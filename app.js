/* ════════════════════════════════════════
   app.js — Aprende Integrales
   Navegación · Ejercicios · Juego multijugador + Práctica
════════════════════════════════════════ */

// ─── Navegación entre páginas ──────────────────────────────────
function goTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');

  const link = document.querySelector('[data-page="' + pageId + '"]');
  if (link) link.classList.add('active');

  window.scrollTo(0, 0);
}

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => goTo(link.dataset.page));
});

// ─── Tabs de teoría ────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    const content = document.getElementById('tab-' + tab.dataset.tab);
    if (content) {
      content.classList.add('active');
      renderMath(content);
    }
  });
});

// ─── MathJax helper ────────────────────────────────────────────
function renderMath(el) {
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([el]).catch(console.error);
  }
}

// ═══════════════════════════════════════════════════════════════
//   EJERCICIOS
// ═══════════════════════════════════════════════════════════════
const EXERCISES = [
  {
    num: 1,
    topic: 'Regla de potencias',
    problem: '\\(\\displaystyle\\int 3x^2\\,dx\\)',
    hint: 'Usa la regla de potencias: \\(\\int x^n\\,dx = \\dfrac{x^{n+1}}{n+1} + C\\) con \\(n = 2\\)',
    options: ['\\(x^3 + C\\)', '\\(3x^3 + C\\)', '\\(\\dfrac{x^3}{3} + C\\)', '\\(6x + C\\)'],
    correct: 0,
    solution: [
      'Aplicamos la regla de potencias: \\(\\int x^n\\,dx = \\dfrac{x^{n+1}}{n+1} + C\\)',
      'Con \\(n = 2\\): \\(\\int 3x^2\\,dx = 3\\cdot\\dfrac{x^3}{3} + C\\)',
      'Simplificamos: \\(= x^3 + C\\)',
      'Verificamos derivando: \\(\\dfrac{d}{dx}(x^3+C) = 3x^2\\) ✓'
    ]
  },
  {
    num: 2,
    topic: 'Función constante',
    problem: '\\(\\displaystyle\\int 7\\,dx\\)',
    hint: 'La integral de una constante \\(k\\) es \\(kx + C\\)',
    options: ['\\(7x + C\\)', '\\(7 + C\\)', '\\(\\dfrac{7}{x} + C\\)', '\\(7x^2 + C\\)'],
    correct: 0,
    solution: [
      'La integral de una constante \\(k\\) es: \\(\\int k\\,dx = kx + C\\)',
      'Con \\(k = 7\\): \\(\\int 7\\,dx = 7x + C\\)',
      'Verificamos: \\(\\dfrac{d}{dx}(7x + C) = 7\\) ✓'
    ]
  },
  {
    num: 3,
    topic: 'Función trigonométrica',
    problem: '\\(\\displaystyle\\int -\\sin(x)\\,dx\\)',
    hint: '\\(\\int \\sin(x)\\,dx = -\\cos(x) + C\\). Recuerda sacar el signo negativo.',
    options: ['\\(\\cos(x) + C\\)', '\\(-\\cos(x) + C\\)', '\\(\\sin(x) + C\\)', '\\(-\\sin(x) + C\\)'],
    correct: 0,
    solution: [
      'Sacamos la constante negativa: \\(\\int -\\sin(x)\\,dx = -\\int \\sin(x)\\,dx\\)',
      'Aplicamos la fórmula: \\(\\int \\sin(x)\\,dx = -\\cos(x) + C\\)',
      'Entonces: \\(-(-\\cos(x)) + C = \\cos(x) + C\\)',
      'Verificamos: \\(\\dfrac{d}{dx}(\\cos(x)+C) = -\\sin(x)\\) ✓'
    ]
  },
  {
    num: 4,
    topic: 'Función exponencial',
    problem: '\\(\\displaystyle\\int e^x\\,dx\\)',
    hint: 'La función exponencial \\(e^x\\) es su propia derivada, y también su propia integral.',
    options: ['\\(e^x + C\\)', '\\(x\\cdot e^x + C\\)', '\\(e^{x+1} + C\\)', '\\(\\dfrac{e^x}{x} + C\\)'],
    correct: 0,
    solution: [
      '\\(e^x\\) es especial: su derivada es ella misma.',
      'Por eso \\(\\int e^x\\,dx = e^x + C\\)',
      'Verificamos: \\(\\dfrac{d}{dx}(e^x + C) = e^x\\) ✓'
    ]
  },
  {
    num: 5,
    topic: 'Integral definida',
    problem: '\\(\\displaystyle\\int_1^3 (2x - 1)\\,dx\\)',
    hint: 'Halla la antiderivada \\(F(x)\\) y evalúa \\(F(3) - F(1)\\)',
    options: ['\\(6\\)', '\\(4\\)', '\\(8\\)', '\\(10\\)'],
    correct: 0,
    solution: [
      'Hallamos la antiderivada: \\(F(x) = x^2 - x\\)',
      'Evaluamos en el límite superior: \\(F(3) = 9 - 3 = 6\\)',
      'Evaluamos en el límite inferior: \\(F(1) = 1 - 1 = 0\\)',
      'Restamos: \\(F(3) - F(1) = 6 - 0 = \\mathbf{6}\\)'
    ]
  }
];

let exerciseAnswered = [];

function buildExercises() {
  exerciseAnswered = new Array(EXERCISES.length).fill(null);
  const container = document.getElementById('exercises-container');
  container.innerHTML = '';

  EXERCISES.forEach((ex, i) => {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.id = 'ex-card-' + i;

    const lettersArr = ['A', 'B', 'C', 'D'];
    const optionsHTML = ex.options.map((opt, j) => `
      <button class="option-btn" onclick="checkExercise(${i}, ${j})" id="ex-opt-${i}-${j}">
        <span style="color:var(--primary);font-weight:700;margin-right:0.4rem">${lettersArr[j]}.</span>
        ${opt}
      </button>
    `).join('');

    const stepsHTML = ex.solution.map((s, k) => `
      <div class="sol-step">
        <span class="sol-step-num">${k + 1}.</span>
        <span>${s}</span>
      </div>
    `).join('');

    card.innerHTML = `
      <div class="exercise-header">
        <span class="exercise-num">Ejercicio ${ex.num} · ${ex.topic}</span>
        <span class="exercise-badge" id="ex-badge-${i}" style="display:none"></span>
      </div>
      <div class="exercise-problem">${ex.problem}</div>
      <div class="exercise-options">${optionsHTML}</div>
      <div class="exercise-actions">
        <button class="hint-btn" onclick="toggleHint(${i})">💡 Ver pista</button>
        <button class="hint-btn" onclick="toggleSolution(${i})">📋 Ver solución</button>
      </div>
      <div class="hint-text" id="ex-hint-${i}">${ex.hint}</div>
      <div class="solution-block" id="ex-sol-${i}">
        <h5>Solución paso a paso</h5>
        <div class="solution-steps">${stepsHTML}</div>
      </div>
    `;

    container.appendChild(card);
  });

  renderMath(container);
  document.getElementById('exercises-summary').style.display = 'none';
}

function checkExercise(exIdx, optIdx) {
  if (exerciseAnswered[exIdx] !== null) return;
  exerciseAnswered[exIdx] = optIdx;

  const ex = EXERCISES[exIdx];
  const isCorrect = optIdx === ex.correct;
  const card = document.getElementById('ex-card-' + exIdx);
  const badge = document.getElementById('ex-badge-' + exIdx);

  card.classList.add(isCorrect ? 'correct' : 'wrong');
  badge.style.display = '';
  badge.className = 'exercise-badge ' + (isCorrect ? 'badge-correct' : 'badge-wrong');
  badge.textContent = isCorrect ? '✓ Correcto' : '✗ Incorrecto';

  // Marcar opciones
  ex.options.forEach((_, j) => {
    const btn = document.getElementById(`ex-opt-${exIdx}-${j}`);
    btn.disabled = true;
    if (j === optIdx && isCorrect) btn.classList.add('selected-correct');
    else if (j === optIdx && !isCorrect) btn.classList.add('selected-wrong');
    else if (j === ex.correct) btn.classList.add('show-correct');
  });

  // Si todas respondidas, mostrar resumen
  if (exerciseAnswered.every(a => a !== null)) {
    setTimeout(showExerciseSummary, 500);
  }
}

function toggleHint(idx) {
  const el = document.getElementById('ex-hint-' + idx);
  el.classList.toggle('visible');
  if (el.classList.contains('visible')) renderMath(el);
}

function toggleSolution(idx) {
  const el = document.getElementById('ex-sol-' + idx);
  el.classList.toggle('visible');
  if (el.classList.contains('visible')) renderMath(el);
}

function showExerciseSummary() {
  const correct = exerciseAnswered.filter((a, i) => a === EXERCISES[i].correct).length;
  const total = EXERCISES.length;
  const pct = Math.round((correct / total) * 100);

  const summary = document.getElementById('exercises-summary');
  const title = document.getElementById('summary-title');
  const msg = document.getElementById('summary-msg');

  let emoji = '😊', titleText, msgText;
  if (pct === 100) {
    emoji = '🎉'; titleText = '¡Perfecto! 5/5';
    msgText = 'Excelente trabajo. Dominas los fundamentos de integración.';
  } else if (pct >= 60) {
    emoji = '👍'; titleText = `Bien hecho · ${correct}/${total}`;
    msgText = 'Buen desempeño. Revisa las soluciones para reforzar los temas donde fallaste.';
  } else {
    emoji = '📚'; titleText = `Sigue practicando · ${correct}/${total}`;
    msgText = 'Repasa la sección de Teoría y vuelve a intentarlo. ¡Tú puedes!';
  }

  document.querySelector('.summary-icon').textContent = emoji;
  title.textContent = titleText;
  msg.textContent = msgText;
  summary.style.display = 'block';
  summary.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetExercises() {
  buildExercises();
}

// ═══════════════════════════════════════════════════════════════
//   JUEGO — datos compartidos con el servidor
// ═══════════════════════════════════════════════════════════════
// Preguntas en LaTeX puro, sin delimitadores — se agregan al mostrar
const GAME_QUESTIONS = [
  {
    question: '\\displaystyle\\int 2x \\, dx',
    options: ['x^2 + C', '2x^2 + C', '\\dfrac{x^2}{2} + C', 'x + C'],
    correct: 0,
    explanation: 'Regla de potencias con \\(n=1\\): \\(\\int 2x\\,dx = 2\\cdot\\dfrac{x^2}{2}+C = x^2+C\\)'
  },
  {
    question: '\\displaystyle\\int \\cos(x) \\, dx',
    options: ['\\sin(x)+C', '-\\sin(x)+C', '-\\cos(x)+C', '\\tan(x)+C'],
    correct: 0,
    explanation: 'La derivada de \\(\\sin(x)\\) es \\(\\cos(x)\\), entonces \\(\\int\\cos(x)\\,dx = \\sin(x)+C\\)'
  },
  {
    question: '\\displaystyle\\int e^x \\, dx',
    options: ['e^x+C', 'xe^x+C', 'e^{x+1}+C', '\\dfrac{e^x}{x}+C'],
    correct: 0,
    explanation: '\\(e^x\\) es su propia derivada e integral: \\(\\int e^x\\,dx = e^x+C\\)'
  },
  {
    question: '\\displaystyle\\int \\frac{1}{x} \\, dx \\quad (x>0)',
    options: ['\\ln|x|+C', '-\\dfrac{1}{x^2}+C', '\\dfrac{1}{x^2}+C', '\\ln(x+1)+C'],
    correct: 0,
    explanation: 'La derivada de \\(\\ln|x|\\) es \\(\\dfrac{1}{x}\\), entonces \\(\\int\\dfrac{1}{x}\\,dx = \\ln|x|+C\\)'
  },
  {
    question: '\\displaystyle\\int_0^1 x^2 \\, dx',
    options: ['\\dfrac{1}{3}', '\\dfrac{1}{2}', '1', '\\dfrac{2}{3}'],
    correct: 0,
    explanation: '\\(\\int_0^1 x^2\\,dx = \\left[\\dfrac{x^3}{3}\\right]_0^1 = \\dfrac{1}{3}-0 = \\dfrac{1}{3}\\)'
  }
];

// ═══════════════════════════════════════════════════════════════
//   JUEGO — lógica de pantallas
// ═══════════════════════════════════════════════════════════════
let ws = null;
let myName = '';
let isHost = false;
let roomCode = '';
let timerInterval = null;
let countdownInterval = null;

function showScreen(id) {
  document.querySelectorAll('.game-screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function showCreateRoom() {
  myName = document.getElementById('input-name').value.trim();
  if (!myName) { alert('Por favor ingresa tu nombre.'); return; }
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    alert('No hay conexión con el servidor. Usa Modo Práctica o inicia el servidor con: npm start'); return;
  }
  ws.send(JSON.stringify({ type: 'create', name: myName }));
}

function showJoinRoom() {
  myName = document.getElementById('input-name').value.trim();
  if (!myName) { alert('Por favor ingresa tu nombre.'); return; }
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    alert('No hay conexión con el servidor. Usa Modo Práctica o inicia el servidor con: npm start'); return;
  }
  showScreen('game-join');
}

function joinRoom() {
  const code = document.getElementById('input-code').value.trim().toUpperCase();
  if (code.length < 3) { setJoinError('Ingresa el código de la sala.'); return; }
  ws.send(JSON.stringify({ type: 'join', name: myName, code }));
}

function setJoinError(msg) {
  document.getElementById('join-error').textContent = msg;
}

function startGame() {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ type: 'start' }));
}

function updateLobby(players) {
  const list = document.getElementById('lobby-players');
  list.innerHTML = players.map(p => `
    <li class="${p === roomCode + '_host' ? 'player-host' : ''}">
      ${p}${p === players[0] ? ' <span style="color:var(--text-dim);font-size:0.78rem">(anfitrión)</span>' : ''}
    </li>
  `).join('');
}

// ─── WebSocket ────────────────────────────────────────────────
function getWsUrl() {
  // Acceso local por file:// → conectar a localhost
  if (window.location.protocol === 'file:') return 'ws://localhost:3001';
  // Acceso via HTTP/HTTPS (túnel o red local) → mismo host, protocolo seguro si aplica
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}`;
}

function connectWS() {
  const statusEl = document.getElementById('ws-status');
  try {
    ws = new WebSocket(getWsUrl());

    ws.onopen = () => {
      statusEl.className = 'ws-status ws-ok';
      statusEl.textContent = '● Servidor conectado — modo multijugador disponible';
    };

    ws.onclose = () => {
      statusEl.className = 'ws-status ws-fail';
      statusEl.textContent = '● Sin conexión — solo Modo Práctica disponible';
      ws = null;
      setTimeout(connectWS, 5000);
    };

    ws.onerror = () => {
      statusEl.className = 'ws-status ws-fail';
      statusEl.textContent = '● Servidor no disponible — solo Modo Práctica disponible';
    };

    ws.onmessage = (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }
      handleServerMsg(msg);
    };
  } catch (e) {
    statusEl.textContent = '● Servidor no disponible';
  }
}

function handleServerMsg(msg) {
  switch (msg.type) {

    case 'room_created':
      roomCode = msg.code;
      isHost = true;
      document.getElementById('display-code').textContent = msg.code;
      document.getElementById('btn-start').style.display = '';
      document.getElementById('waiting-msg').style.display = 'none';
      updateLobbyPlayers(msg.players);
      showScreen('game-lobby');
      break;

    case 'joined':
      roomCode = msg.code;
      isHost = false;
      document.getElementById('display-code').textContent = msg.code;
      document.getElementById('btn-start').style.display = 'none';
      document.getElementById('waiting-msg').style.display = '';
      updateLobbyPlayers(msg.players);
      showScreen('game-lobby');
      break;

    case 'player_joined':
      updateLobbyPlayers(msg.players);
      break;

    case 'player_left':
      updateLobbyPlayers(msg.players);
      if (msg.newHost === myName) {
        isHost = true;
        document.getElementById('btn-start').style.display = '';
        document.getElementById('waiting-msg').style.display = 'none';
      }
      break;

    case 'error':
      setJoinError(msg.message);
      break;

    case 'countdown':
      showScreen('game-countdown');
      runCountdown();
      break;

    case 'question':
      showMultiQuestion(msg);
      break;

    case 'answer_ack': {
      const ackEl = document.getElementById('answer-ack-msg');
      if (ackEl) ackEl.style.display = '';
      break;
    }

    case 'scores_update':
      updateLiveScores(msg.scores);
      break;

    case 'reveal':
      showReveal(msg, false);
      break;

    case 'game_over':
      showGameOver(msg);
      break;
  }
}

function updateLobbyPlayers(players) {
  const list = document.getElementById('lobby-players');
  list.innerHTML = players.map((p, i) => `
    <li>
      ${p}
      ${i === 0 ? '<span style="color:var(--text-dim);font-size:0.78rem"> (anfitrión)</span>' : ''}
    </li>
  `).join('');
}

// ─── Cuenta regresiva ─────────────────────────────────────────
function runCountdown() {
  let n = 3;
  const el = document.getElementById('countdown-num');
  el.textContent = n;
  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    n--;
    if (n <= 0) { clearInterval(countdownInterval); return; }
    el.textContent = n;
  }, 1000);
}

// ─── Pregunta multijugador ────────────────────────────────────
function showMultiQuestion(msg) {
  clearInterval(timerInterval);
  showScreen('game-question');

  const ackEl = document.getElementById('answer-ack-msg');
  if (ackEl) ackEl.style.display = 'none';

  document.getElementById('q-num').textContent = `Pregunta ${msg.index + 1}/${msg.total}`;
  document.getElementById('question-formula').innerHTML = `\\[${msg.question}\\]`;
  renderMath(document.getElementById('question-formula'));

  buildOptions('options-grid', msg.options, (idx) => {
    ws.send(JSON.stringify({ type: 'answer', answer: idx }));
  });

  startTimer('timer-bar', 'timer-text', msg.timeLimit, () => {});
}

function buildOptions(gridId, options, onSelect) {
  const letters = ['A', 'B', 'C', 'D'];
  const grid = document.getElementById(gridId);
  grid.innerHTML = options.map((opt, i) => `
    <button class="game-option" id="${gridId}-opt-${i}" onclick="selectOption('${gridId}',${i},${options.length})">
      <span class="opt-letter">${letters[i]}</span>
      <span>\\(${opt}\\)</span>
    </button>
  `).join('');
  renderMath(grid);

  // Guardar el callback para cuando se seleccione
  grid._onSelect = onSelect;
}

function selectOption(gridId, idx) {
  const grid = document.getElementById(gridId);
  if (!grid._onSelect) return;

  // Cambiar selección visual sin deshabilitar (se puede cambiar mientras haya tiempo)
  grid.querySelectorAll('.game-option').forEach(b => b.classList.remove('selected-pending'));
  document.getElementById(`${gridId}-opt-${idx}`).classList.add('selected-pending');

  grid._onSelect(idx);
}

function lockGrid(gridId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid._onSelect = null;
  grid.querySelectorAll('.game-option').forEach(b => b.disabled = true);
}

function updateLiveScores(scores) {
  const list = document.getElementById('live-scores');
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  list.innerHTML = sorted.map(([name, pts]) => `
    <li>
      <span class="score-name">${name.length > 12 ? name.slice(0,12)+'…' : name}</span>
      <span class="score-pts">${pts}</span>
    </li>
  `).join('');
}

// ─── Revelar respuesta ────────────────────────────────────────
let nextRevealInterval = null;

function showReveal(msg, isPractice) {
  lockGrid(isPractice ? 'p-options-grid' : 'options-grid');
  clearInterval(timerInterval);
  clearInterval(nextRevealInterval);
  showScreen('game-reveal');

  const correctIdx = msg.correct;

  const formula = document.getElementById('reveal-formula');
  const expl = document.getElementById('reveal-explanation');
  const icon = document.getElementById('reveal-result-icon');
  const resultText = document.getElementById('reveal-result-text');
  const nextCountEl = document.getElementById('next-countdown');
  const nextHint = document.getElementById('next-hint');

  // Determinar si mi respuesta fue correcta
  const wasCorrect = msg.myAnswerCorrect;

  icon.textContent = wasCorrect === false ? '❌' : wasCorrect === true ? '✅' : '📋';
  resultText.textContent = wasCorrect === false ? '¡Incorrecto!' : wasCorrect === true ? '¡Correcto!' : 'Tiempo agotado';
  resultText.style.color = wasCorrect === false ? 'var(--danger)' : wasCorrect === true ? 'var(--accent)' : 'var(--warn)';

  // Ambos modos usan LaTeX sin delimitadores — envolver en \[...\] para display math
  const rawOpts = isPractice
    ? GAME_QUESTIONS[practiceState.currentQ - 1].options
    : (msg.options || []);
  formula.innerHTML = rawOpts[correctIdx] !== undefined
    ? `\\[${rawOpts[correctIdx]}\\]`
    : '';
  renderMath(formula);

  expl.innerHTML = msg.explanation || '';
  renderMath(expl);

  // Marcador
  if (msg.scores) {
    const list = document.getElementById('reveal-scores');
    const sorted = Object.entries(msg.scores).sort((a, b) => b[1] - a[1]);
    list.innerHTML = sorted.map(([name, pts], i) => `
      <li>
        <span class="score-name">${i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : '🥉 '}${name}</span>
        <span class="score-pts">${pts} pts</span>
      </li>
    `).join('');
  } else {
    document.getElementById('reveal-scores').innerHTML = '';
  }

  // Cuenta regresiva para siguiente pregunta (solo en práctica; en multi el servidor manda)
  if (isPractice) {
    nextHint.style.display = '';
    let secs = 4;
    nextCountEl.textContent = secs;
    nextRevealInterval = setInterval(() => {
      secs--;
      nextCountEl.textContent = secs;
      if (secs <= 0) {
        clearInterval(nextRevealInterval);
        if (practiceState.currentQ < GAME_QUESTIONS.length) {
          showPracticeQuestion();
        } else {
          showPracticeEnd();
        }
      }
    }, 1000);
  } else {
    nextHint.style.display = 'none';
  }
}

// ─── Game over (multijugador) ─────────────────────────────────
function showGameOver(msg) {
  showScreen('game-finished');
  clearInterval(timerInterval);

  const ranking = msg.ranking || Object.entries(msg.scores).sort((a, b) => b[1] - a[1]);
  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

  document.getElementById('winner-text').textContent =
    ranking.length > 0 ? `¡Felicitaciones ${ranking[0][0]}!` : '';

  const rankEl = document.getElementById('final-ranking');
  rankEl.innerHTML = ranking.map(([name, pts], i) => `
    <div class="rank-item">
      <span class="rank-pos">${medals[i] || (i + 1)}</span>
      <span class="rank-name">${name}</span>
      <span class="rank-score">${pts} pts</span>
    </div>
  `).join('');
}

// ─── Timer visual ─────────────────────────────────────────────
function startTimer(barId, textId, seconds, onEnd) {
  clearInterval(timerInterval);
  const bar = document.getElementById(barId);
  const text = document.getElementById(textId);
  let remaining = seconds;

  bar.style.width = '100%';
  bar.className = 'timer-bar';
  text.textContent = remaining + 's';

  timerInterval = setInterval(() => {
    remaining--;
    const pct = (remaining / seconds) * 100;
    bar.style.width = pct + '%';
    text.textContent = remaining + 's';

    if (pct <= 33 && pct > 15) bar.className = 'timer-bar warn';
    else if (pct <= 15) bar.className = 'timer-bar danger';

    if (remaining <= 0) {
      clearInterval(timerInterval);
      onEnd();
    }
  }, 1000);
}

// ═══════════════════════════════════════════════════════════════
//   MODO PRÁCTICA (sin servidor)
// ═══════════════════════════════════════════════════════════════
const practiceState = {
  currentQ: 0,
  score: 0,
  results: [],
  qStartTime: 0,
  selectedIdx: null
};

function startPractice() {
  practiceState.currentQ = 0;
  practiceState.score = 0;
  practiceState.results = [];
  showPracticeQuestion();
}

function showPracticeQuestion() {
  clearInterval(timerInterval);
  clearInterval(nextRevealInterval);

  const q = GAME_QUESTIONS[practiceState.currentQ];
  practiceState.qStartTime = Date.now();

  showScreen('game-practice');

  document.getElementById('pq-num').textContent =
    `Pregunta ${practiceState.currentQ + 1}/${GAME_QUESTIONS.length}`;

  document.getElementById('p-question-formula').innerHTML = `\\[${q.question}\\]`;
  renderMath(document.getElementById('p-question-formula'));

  buildPracticeOptions(q.options);
  startTimer('p-timer-bar', 'p-timer-text', 30, () => {
    if (practiceState.selectedIdx !== null) {
      // Confirmar automáticamente la última opción seleccionada
      processPracticeAnswer(practiceState.selectedIdx);
    } else {
      // Tiempo agotado sin seleccionar nada
      practiceState.results.push({ correct: false, timedOut: true });
      practiceState.currentQ++;
      showReveal({
        correct: q.correct,
        options: q.options,
        explanation: q.explanation,
        myAnswerCorrect: undefined
      }, true);
    }
  });
}

function buildPracticeOptions(options) {
  const letters = ['A', 'B', 'C', 'D'];
  const grid = document.getElementById('p-options-grid');
  grid.innerHTML = options.map((opt, i) => `
    <button class="game-option" onclick="selectPracticeAnswer(${i})">
      <span class="opt-letter">${letters[i]}</span>
      <span>\\(${opt}\\)</span>
    </button>
  `).join('');
  renderMath(grid);

  practiceState.selectedIdx = null;
  document.getElementById('p-confirm-btn').style.display = 'none';
}

function selectPracticeAnswer(idx) {
  // Solo resaltar — no procesar todavía
  const grid = document.getElementById('p-options-grid');
  grid.querySelectorAll('.game-option').forEach(b => b.classList.remove('selected-pending'));
  grid.querySelectorAll('.game-option')[idx].classList.add('selected-pending');
  practiceState.selectedIdx = idx;
  document.getElementById('p-confirm-btn').style.display = '';
}

function confirmPracticeAnswer() {
  if (practiceState.selectedIdx === null) return;
  processPracticeAnswer(practiceState.selectedIdx);
}

function processPracticeAnswer(idx) {
  clearInterval(timerInterval);
  const q = GAME_QUESTIONS[practiceState.currentQ];
  const isCorrect = idx === q.correct;

  if (isCorrect) {
    const elapsed = Date.now() - practiceState.qStartTime;
    const speedBonus = Math.max(0, Math.floor((30000 - elapsed) / 300));
    practiceState.score += 100 + speedBonus;
  }

  practiceState.results.push({ correct: isCorrect, qIdx: practiceState.currentQ });
  practiceState.currentQ++;

  showReveal({
    correct: q.correct,
    options: q.options,
    explanation: q.explanation,
    myAnswerCorrect: isCorrect
  }, true);
}

function showPracticeEnd() {
  clearInterval(timerInterval);
  clearInterval(nextRevealInterval);
  showScreen('game-practice-end');

  const correct = practiceState.results.filter(r => r.correct).length;
  const total = GAME_QUESTIONS.length;

  let trophy = '🏆', scoreMsg;
  if (correct === total) {
    trophy = '🏆'; scoreMsg = `¡Perfecto! Respondiste todas correctamente.`;
  } else if (correct >= 3) {
    trophy = '🥈'; scoreMsg = `Bien hecho. Respondiste ${correct}/${total} preguntas.`;
  } else {
    trophy = '📚'; scoreMsg = `Respondiste ${correct}/${total}. ¡Sigue practicando!`;
  }

  document.getElementById('practice-trophy').textContent = trophy;
  document.getElementById('practice-score-text').textContent =
    `Puntuación: ${practiceState.score} pts · ${scoreMsg}`;

  const resultsEl = document.getElementById('practice-results');
  resultsEl.innerHTML = practiceState.results.map((r, i) => {
    return `
      <div class="practice-result-item">
        <span class="result-icon">${r.correct ? '✅' : r.timedOut ? '⏰' : '❌'}</span>
        <span class="result-q">Pregunta ${i + 1}</span>
        <span class="result-status ${r.correct ? 'result-correct' : 'result-wrong'}">
          ${r.correct ? '+' + (100 + (r.speedBonus || 0)) + ' pts' : r.timedOut ? 'Tiempo' : '0 pts'}
        </span>
      </div>
    `;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
//   INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  buildExercises();
  connectWS();
  goTo('home');
});
