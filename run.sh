#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  run.sh — Aprende Integrales
#  Uso: bash run.sh
#  Instala Node.js si hace falta, arranca el servidor,
#  muestra la URL local y crea un túnel público.
# ─────────────────────────────────────────────────────────────

set -e

# ── Colores ──────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'
RED='\033[0;31m';   BOLD='\033[1m';      RESET='\033[0m'
CYAN='\033[0;36m'

ok()   { echo -e "${GREEN}✔ ${RESET}$*"; }
info() { echo -e "${BLUE}→ ${RESET}$*"; }
warn() { echo -e "${YELLOW}⚠ ${RESET}$*"; }
err()  { echo -e "${RED}✘ ${RESET}$*"; }
sep()  { echo -e "${BLUE}────────────────────────────────────────${RESET}"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

clear
sep
echo -e "${BOLD}  📚  Aprende Integrales${RESET}"
sep
echo ""

# ═══════════════════════════════════════════════════════════════
# 1. Buscar / instalar Node.js
# ═══════════════════════════════════════════════════════════════
info "Buscando Node.js..."

NODE_CMD=""
for candidate in \
    "node" \
    "/opt/homebrew/bin/node" \
    "/usr/local/bin/node" \
    "$HOME/.nvm/versions/node/$(ls "$HOME/.nvm/versions/node/" 2>/dev/null | sort -V | tail -1)/bin/node" \
    "$HOME/.volta/bin/node"
do
    if command -v "$candidate" &>/dev/null || [ -x "$candidate" ]; then
        NODE_CMD="$candidate"; break
    fi
done

if [ -z "$NODE_CMD" ] && [ -f "$HOME/.nvm/nvm.sh" ]; then
    export NVM_DIR="$HOME/.nvm"
    source "$NVM_DIR/nvm.sh"
    command -v node &>/dev/null && NODE_CMD="node"
fi

if [ -z "$NODE_CMD" ]; then
    warn "Node.js no encontrado. Instalando..."
    if command -v brew &>/dev/null; then
        brew install node
        NODE_CMD="$(brew --prefix)/bin/node"
    else
        curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        source "$NVM_DIR/nvm.sh"
        nvm install --lts && nvm use --lts
        NODE_CMD="node"
    fi
fi

NODE_VERSION=$("$NODE_CMD" --version 2>/dev/null)
ok "Node.js ${NODE_VERSION}"
NPM_CMD="$(dirname "$(command -v "$NODE_CMD" 2>/dev/null || echo "$NODE_CMD")")/npm"
command -v "$NPM_CMD" &>/dev/null || NPM_CMD="npm"

# ═══════════════════════════════════════════════════════════════
# 2. Instalar dependencias
# ═══════════════════════════════════════════════════════════════
echo ""
info "Verificando dependencias..."
if [ ! -d "node_modules/ws" ]; then
    info "Instalando paquetes (solo la primera vez)..."
    "$NPM_CMD" install --silent
fi
ok "Dependencias listas."

# ═══════════════════════════════════════════════════════════════
# 3. Liberar puerto si está ocupado
# ═══════════════════════════════════════════════════════════════
PORT=3001
PREV_PID=$(lsof -ti tcp:$PORT 2>/dev/null || true)
if [ -n "$PREV_PID" ]; then
    warn "Puerto $PORT en uso. Liberando..."
    kill "$PREV_PID" 2>/dev/null || true
    sleep 1
fi

# ═══════════════════════════════════════════════════════════════
# 4. IP local (para compañeros en la misma red WiFi)
# ═══════════════════════════════════════════════════════════════
LOCAL_IP=""
for iface in en0 en1 en2 eth0 wlan0; do
    IP=$(ipconfig getifaddr "$iface" 2>/dev/null || \
         ifconfig "$iface" 2>/dev/null | awk '/inet /{print $2}' | grep -v 127 | head -1)
    if [ -n "$IP" ]; then LOCAL_IP="$IP"; break; fi
done

# ═══════════════════════════════════════════════════════════════
# 5. Iniciar servidor
# ═══════════════════════════════════════════════════════════════
echo ""
info "Iniciando servidor en puerto $PORT..."
LOG_FILE="$SCRIPT_DIR/server.log"
"$NODE_CMD" server.js > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

READY=0
for i in 1 2 3 4 5; do
    sleep 1
    if lsof -ti tcp:$PORT &>/dev/null; then READY=1; break; fi
done

if [ $READY -eq 0 ]; then
    err "El servidor no arrancó. Revisa server.log:"
    cat "$LOG_FILE"
    exit 1
fi
ok "Servidor listo."

# ═══════════════════════════════════════════════════════════════
# 6. Túnel público (internet, distintas redes)
# ═══════════════════════════════════════════════════════════════
echo ""
sep
info "Creando túnel público..."

TUNNEL_URL=""
TUNNEL_PID=""

# ── Verificar URL con DNS público (evita caché local del Mac) ─
verify_url() {
    local url="$1"
    local domain
    domain=$(echo "$url" | sed 's|https://||')
    # Intentar con dig usando Cloudflare y Google DNS directamente
    if dig @1.1.1.1 "$domain" +short 2>/dev/null | grep -q '[0-9]'; then
        return 0
    fi
    if dig @8.8.8.8 "$domain" +short 2>/dev/null | grep -q '[0-9]'; then
        return 0
    fi
    return 1
}

# ── Opción A: cloudflared ─────────────────────────────────────
try_cloudflared() {
    command -v cloudflared &>/dev/null || return 1
    info "Intentando cloudflared..."
    rm -f "$SCRIPT_DIR/cloudflared.log"
    cloudflared tunnel --url "http://localhost:$PORT" --no-autoupdate \
        > "$SCRIPT_DIR/cloudflared.log" 2>&1 &
    TUNNEL_PID=$!

    local url=""
    # Esperar la URL en el log (máx 25s)
    for _ in $(seq 1 25); do
        url=$(grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' \
              "$SCRIPT_DIR/cloudflared.log" 2>/dev/null | head -1)
        [ -n "$url" ] && break
        sleep 1
    done
    [ -z "$url" ] && return 1

    # Esperar a que el DNS público resuelva (máx 35s)
    info "Esperando propagación DNS..."
    for _ in $(seq 1 35); do
        if verify_url "$url"; then
            TUNNEL_URL="$url"
            return 0
        fi
        sleep 1
    done

    # Fallback: si el proceso sigue vivo, asumir que el túnel funciona
    # (el DNS del Mac puede ser lento pero otros lo resolverán)
    if kill -0 "$TUNNEL_PID" 2>/dev/null; then
        TUNNEL_URL="$url"
        warn "DNS local lento, pero el túnel está activo."
        return 0
    fi
    return 1
}

# ── Opción B: localhost.run (SSH, sin instalación, sin cuenta) ─
# URL resultante: https://HASH.lhr.life  (dominio .lhr.life)
try_localhost_run() {
    command -v ssh &>/dev/null || return 1
    info "Intentando localhost.run (SSH)..."
    rm -f "$SCRIPT_DIR/localhostrun.log"
    ssh -o StrictHostKeyChecking=no \
        -o ServerAliveInterval=30 \
        -o ConnectTimeout=15 \
        -R "80:localhost:$PORT" \
        nokey@localhost.run \
        > "$SCRIPT_DIR/localhostrun.log" 2>&1 &
    TUNNEL_PID=$!

    # Esperar URL (máx 25s) — formato: https://HASH.lhr.life
    for _ in $(seq 1 25); do
        local url
        url=$(grep -oE 'https://[a-zA-Z0-9]+\.lhr\.life' \
              "$SCRIPT_DIR/localhostrun.log" 2>/dev/null | head -1)
        if [ -n "$url" ]; then
            TUNNEL_URL="$url"
            return 0
        fi
        sleep 1
    done
    return 1
}

# ── Opción C: instalar cloudflared con brew ───────────────────
try_install_cf() {
    command -v brew &>/dev/null || return 1
    info "Instalando cloudflared..."
    brew install cloudflared 2>/dev/null && try_cloudflared
}

# ── Probar en orden ───────────────────────────────────────────
# localhost.run primero: SSH puro, sin DNS propagation delay
try_localhost_run \
|| try_cloudflared  \
|| try_install_cf   \
|| warn "No se pudo crear túnel. Solo disponible en red local."

# ═══════════════════════════════════════════════════════════════
# 7. Mostrar URLs
# ═══════════════════════════════════════════════════════════════
echo ""
sep

# ─── URL Local (misma red WiFi) ───────────────────────────────
if [ -n "$LOCAL_IP" ]; then
    echo ""
    echo -e "  ${BOLD}📡 MISMA RED WIFI (sin internet necesario):${RESET}"
    echo -e "  ${BOLD}${CYAN}  http://${LOCAL_IP}:${PORT}${RESET}"
fi

# ─── URL Pública (internet, redes distintas) ──────────────────
if [ -n "$TUNNEL_URL" ]; then
    echo ""
    echo -e "  ${BOLD}${GREEN}╔══════════════════════════════════════════════════════╗${RESET}"
    echo -e "  ${BOLD}${GREEN}║  🌐  INTERNET (comparte esta URL):                   ║${RESET}"
    echo -e "  ${BOLD}${GREEN}║                                                      ║${RESET}"
    printf   "  ${BOLD}${CYAN}  %-52s${RESET}\n" "$TUNNEL_URL"
    echo -e "  ${BOLD}${GREEN}║                                                      ║${RESET}"
    echo -e "  ${BOLD}${GREEN}╚══════════════════════════════════════════════════════╝${RESET}"
    echo ""

    # Si el DNS local no resuelve pero el túnel está activo, avisar
    if ! verify_url "$TUNNEL_URL" 2>/dev/null; then
        echo -e "  ${YELLOW}⚠  Tu Mac tiene caché DNS viejo.${RESET}"
        echo -e "  ${YELLOW}   La URL funciona para tus compañeros.${RESET}"
        echo -e "  ${YELLOW}   Para abrirla aquí, ejecuta en otra terminal:${RESET}"
        echo -e "  ${BOLD}   sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder${RESET}"
        echo ""
    fi

    # Abrir en el navegador
    info "Abriendo en el navegador..."
    if   command -v open     &>/dev/null; then open     "$TUNNEL_URL"
    elif command -v xdg-open &>/dev/null; then xdg-open "$TUNNEL_URL"
    fi
else
    if [ -n "$LOCAL_IP" ]; then
        open "http://${LOCAL_IP}:${PORT}" 2>/dev/null || true
    fi
fi

echo ""
sep
echo -e "  Servidor PID:    $SERVER_PID"
[ -n "$TUNNEL_PID" ] && echo -e "  Túnel PID:       $TUNNEL_PID"
echo -e "  Log servidor:    server.log"
[ -f "$SCRIPT_DIR/cloudflared.log" ]   && echo -e "  Log cloudflared: cloudflared.log"
[ -f "$SCRIPT_DIR/localhostrun.log" ]  && echo -e "  Log tunnel SSH:  localhostrun.log"
echo ""
echo -e "  ${YELLOW}Presiona Ctrl+C para detener todo.${RESET}"
sep
echo ""

# ═══════════════════════════════════════════════════════════════
# 8. Mantener vivo; limpiar al salir
# ═══════════════════════════════════════════════════════════════
cleanup() {
    echo ""
    info "Deteniendo servicios..."
    kill "$SERVER_PID"  2>/dev/null || true
    [ -n "$TUNNEL_PID" ] && kill "$TUNNEL_PID" 2>/dev/null || true
    pkill -f "cloudflared tunnel" 2>/dev/null || true
    ok "¡Hasta luego!"
    exit 0
}
trap cleanup INT TERM

tail -f "$LOG_FILE" 2>/dev/null &
TAIL_PID=$!

wait "$SERVER_PID" 2>/dev/null || true
kill "$TAIL_PID" 2>/dev/null || true
