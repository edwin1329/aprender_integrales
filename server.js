const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  if (url === '/' || url === '') url = '/index.html';

  const file = path.join(__dirname, url);
  const ext  = path.extname(file);

  // Solo servir archivos del directorio del proyecto
  if (!file.startsWith(__dirname) || !MIME[ext]) {
    res.writeHead(404); res.end('Not found'); return;
  }

  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] });
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server });

// ─── Preguntas del juego (5 en total) ───────────────────────────────────────
const QUESTIONS = [
  {
    question: '\\displaystyle\\int 2x \\, dx',
    options: ['x^2 + C', '2x^2 + C', '\\dfrac{x^2}{2} + C', 'x + C'],
    correct: 0,
    explanation:
      'Regla de potencias: \\(\\int x^n\\,dx = \\dfrac{x^{n+1}}{n+1} + C\\). ' +
      'Con \\(n=1\\): \\(\\int 2x\\,dx = 2\\cdot\\dfrac{x^2}{2} + C = x^2 + C\\)'
  },
  {
    question: '\\displaystyle\\int \\cos(x) \\, dx',
    options: ['\\sin(x) + C', '-\\sin(x) + C', '-\\cos(x) + C', '\\tan(x) + C'],
    correct: 0,
    explanation:
      'La derivada de \\(\\sin(x)\\) es \\(\\cos(x)\\), por tanto: ' +
      '\\(\\int \\cos(x)\\,dx = \\sin(x) + C\\)'
  },
  {
    question: '\\displaystyle\\int e^x \\, dx',
    options: [
      'e^x + C',
      'x \\cdot e^x + C',
      'e^{x+1} + C',
      '\\dfrac{e^x}{x} + C'
    ],
    correct: 0,
    explanation:
      'La función exponencial \\(e^x\\) es su propia derivada, ' +
      'por lo tanto también su propia integral: \\(\\int e^x\\,dx = e^x + C\\)'
  },
  {
    question: '\\displaystyle\\int \\frac{1}{x} \\, dx \\quad (x > 0)',
    options: [
      '\\ln|x| + C',
      '-\\dfrac{1}{x^2} + C',
      '\\dfrac{1}{x^2} + C',
      '\\ln(x+1) + C'
    ],
    correct: 0,
    explanation:
      'La derivada de \\(\\ln|x|\\) es \\(\\dfrac{1}{x}\\), entonces: ' +
      '\\(\\int \\dfrac{1}{x}\\,dx = \\ln|x| + C\\)'
  },
  {
    question: '\\displaystyle\\int_0^1 x^2 \\, dx',
    options: [
      '\\dfrac{1}{3}',
      '\\dfrac{1}{2}',
      '1',
      '\\dfrac{2}{3}'
    ],
    correct: 0,
    explanation:
      '\\(\\int_0^1 x^2\\,dx = \\left[\\dfrac{x^3}{3}\\right]_0^1 = ' +
      '\\dfrac{1}{3} - 0 = \\dfrac{1}{3}\\)'
  }
];

// ─── Estado de salas en memoria ──────────────────────────────────────────────
const rooms = new Map();

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function broadcast(room, msg) {
  const data = JSON.stringify(msg);
  room.players.forEach(p => {
    if (p.ws.readyState === WebSocket.OPEN) p.ws.send(data);
  });
}

function sendQuestion(room) {
  const gs = room.gameState;
  const q = QUESTIONS[gs.currentQ];
  gs.answers = new Map();      // playerName → último índice enviado
  gs.answerTimes = new Map();  // playerName → timestamp del primer envío
  gs.qStartTime = Date.now();
  gs.phase = 'question';

  broadcast(room, {
    type: 'question',
    index: gs.currentQ,
    total: QUESTIONS.length,
    question: q.question,
    options: q.options,
    timeLimit: 30
  });

  gs.timer = setTimeout(() => advanceQuestion(room), 30000);
}

function advanceQuestion(room) {
  const gs = room.gameState;
  clearTimeout(gs.timer);
  gs.phase = 'reveal';

  const q = QUESTIONS[gs.currentQ];

  // Calcular puntajes con la respuesta final de cada jugador
  gs.answers.forEach((answer, name) => {
    if (answer === q.correct) {
      const elapsed = (gs.answerTimes.get(name) || Date.now()) - gs.qStartTime;
      const speedBonus = Math.max(0, Math.floor((30000 - elapsed) / 300));
      gs.scores[name] = (gs.scores[name] || 0) + 100 + speedBonus;
    }
  });

  // Enviar reveal personalizado a cada jugador con su resultado
  room.players.forEach(p => {
    const myAnswer = gs.answers.get(p.name);
    const myAnswerCorrect = myAnswer !== undefined ? myAnswer === q.correct : undefined;
    if (p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(JSON.stringify({
        type: 'reveal',
        correct: q.correct,
        options: q.options,
        explanation: q.explanation,
        scores: gs.scores,
        myAnswerCorrect
      }));
    }
  });

  gs.currentQ++;
  const isLast = gs.currentQ >= QUESTIONS.length;

  setTimeout(() => {
    if (isLast) {
      gs.phase = 'finished';
      const ranking = Object.entries(gs.scores).sort((a, b) => b[1] - a[1]);
      broadcast(room, { type: 'game_over', scores: gs.scores, ranking });
    } else {
      sendQuestion(room);
    }
  }, isLast ? 3000 : 4000);
}

// ─── Manejo de conexiones ────────────────────────────────────────────────────
wss.on('connection', ws => {
  let room = null;
  let playerName = null;

  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {

      case 'create': {
        playerName = String(msg.name || 'Anónimo').trim().slice(0, 20);
        let code;
        do { code = genCode(); } while (rooms.has(code));

        room = {
          code,
          host: playerName,
          players: [{ name: playerName, ws }],
          gameState: { phase: 'waiting', scores: {}, currentQ: 0, answeredSet: new Set() }
        };
        rooms.set(code, room);

        ws.send(JSON.stringify({
          type: 'room_created',
          code,
          players: [playerName],
          isHost: true
        }));
        break;
      }

      case 'join': {
        playerName = String(msg.name || 'Anónimo').trim().slice(0, 20);
        const code = String(msg.code || '').trim().toUpperCase();
        room = rooms.get(code);

        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: 'Sala no encontrada. Verifica el código.' }));
          room = null;
          return;
        }
        if (room.gameState.phase !== 'waiting') {
          ws.send(JSON.stringify({ type: 'error', message: 'El juego ya está en curso.' }));
          room = null;
          return;
        }
        // Evitar nombres duplicados
        if (room.players.find(p => p.name === playerName)) {
          playerName = playerName + '_2';
        }

        room.players.push({ name: playerName, ws });
        const playerNames = room.players.map(p => p.name);

        broadcast(room, { type: 'player_joined', players: playerNames, newPlayer: playerName });
        ws.send(JSON.stringify({ type: 'joined', code, players: playerNames, isHost: false }));
        break;
      }

      case 'start': {
        if (!room || room.host !== playerName) return;
        if (room.gameState.phase !== 'waiting') return;

        room.gameState.scores = {};
        room.players.forEach(p => { room.gameState.scores[p.name] = 0; });
        room.gameState.currentQ = 0;

        broadcast(room, { type: 'countdown' });
        setTimeout(() => sendQuestion(room), 3500);
        break;
      }

      case 'answer': {
        if (!room || !room.gameState) return;
        const gs = room.gameState;
        if (gs.phase !== 'question') return;

        const isFirst = !gs.answers.has(playerName);
        gs.answers.set(playerName, msg.answer);
        if (isFirst) gs.answerTimes.set(playerName, Date.now());

        ws.send(JSON.stringify({ type: 'answer_ack' }));
        break;
      }
    }
  });

  ws.on('close', () => {
    if (!room || !playerName) return;
    room.players = room.players.filter(p => p.name !== playerName);

    if (room.players.length === 0) {
      if (room.gameState?.timer) clearTimeout(room.gameState.timer);
      rooms.delete(room.code);
      return;
    }

    if (room.host === playerName) room.host = room.players[0].name;

    broadcast(room, {
      type: 'player_left',
      name: playerName,
      players: room.players.map(p => p.name),
      newHost: room.host
    });

    // Avanzar si todos los demás ya respondieron
    const gs = room.gameState;
    if (gs?.phase === 'question' && gs.answers && gs.answers.size >= room.players.length) {
      clearTimeout(gs.timer);
      advanceQuestion(room);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n📚 Servidor Aprende Integrales`);
  console.log(`   Puerto:    ${PORT}`);
  console.log(`   Local:     http://localhost:${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
  console.log(`   Preguntas: ${QUESTIONS.length}\n`);
});
