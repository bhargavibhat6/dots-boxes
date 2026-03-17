// DOM references
const board = document.getElementById('game-board');
const score1El = document.getElementById('score1');
const score2El = document.getElementById('score2');
const p1LabelEl = document.getElementById('p1-label');
const p2LabelEl = document.getElementById('p2-label');
const currentPlayerNameEl = document.getElementById('current-player-name');
const resetBtn = document.getElementById('reset-btn');
const tossBtn = document.getElementById('toss-btn');
const tossResultEl = document.getElementById('toss-result');
const name1Input = document.getElementById('name1');
const name2Input = document.getElementById('name2');
const hamburgerBtn = document.getElementById('hamburger-btn');
const settingsModal = document.getElementById('settings-modal');
const settingsCloseBtn = document.getElementById('settings-close-btn');
const settingsApplyBtn = document.getElementById('settings-apply-btn');
const rowsInput = document.getElementById('rows-input');
const colsInput = document.getElementById('cols-input');
const rowsHint = document.getElementById('rows-hint');
const colsHint = document.getElementById('cols-hint');
const p1Card = document.getElementById('p1-card');
const p2Card = document.getElementById('p2-card');
const gameArea = document.getElementById('game-area');
const gameOverModal = document.getElementById('game-over-modal');
const gameOverIcon = document.getElementById('game-over-icon');
const gameOverTitle = document.getElementById('game-over-title');
const gameOverScores = document.getElementById('game-over-scores');
const gameOverBtn = document.getElementById('game-over-btn');

let rows = 4;
let cols = 4;
let currentPlayer = 1;
let scores = { 1: 0, 2: 0 };
let totalBoxes = rows * cols;
let aiTimeout = null;
let cellMap = new Map();
let playerNames = { 1: 'Player 1', 2: 'Bot' };
let firstPlayer = 1;

function applySettings() {
  playerNames[1] = name1Input.value.trim() || 'Player 1';
  playerNames[2] = name2Input.value.trim() || 'Bot';
  p1LabelEl.textContent = playerNames[1];
  p2LabelEl.textContent = playerNames[2];
}

function updateTurnUI() {
  const isP1 = currentPlayer === 1;
  currentPlayerNameEl.textContent = playerNames[currentPlayer];
  currentPlayerNameEl.className = `turn-name turn-p${currentPlayer}`;
  p1Card.classList.toggle('active', isP1);
  p2Card.classList.toggle('active', !isP1);
  gameArea.classList.toggle('turn-p1', isP1);
  gameArea.classList.toggle('turn-p2', !isP1);
}

function showGameOver() {
  const isDraw = scores[1] === scores[2];
  const winnerIdx = scores[1] > scores[2] ? 1 : 2;
  const winnerName = isDraw ? null : playerNames[winnerIdx];

  gameOverIcon.textContent = isDraw ? '🤝' : '🏆';
  gameOverTitle.textContent = isDraw ? "It's a Draw!" : `${winnerName} Wins!`;
  gameOverScores.innerHTML =
    `<strong style="color:var(--p1)">${playerNames[1]}</strong>: ${scores[1]} &nbsp;·&nbsp; ` +
    `<strong style="color:var(--p2)">${playerNames[2]}</strong>: ${scores[2]}`;

  if (!isDraw) {
    gameOverTitle.style.color = winnerIdx === 1 ? 'var(--p1)' : 'var(--p2)';
  } else {
    gameOverTitle.style.color = '';
  }

  gameOverModal.classList.add('visible');
}

gameOverBtn.addEventListener('click', () => {
  gameOverModal.classList.remove('visible');
  startGame();
});

// Settings modal
hamburgerBtn.addEventListener('click', () => settingsModal.classList.add('visible'));
settingsCloseBtn.addEventListener('click', () => settingsModal.classList.remove('visible'));
settingsModal.addEventListener('click', e => {
  if (e.target === settingsModal) settingsModal.classList.remove('visible');
});
settingsApplyBtn.addEventListener('click', () => {
  applySettings();
  settingsModal.classList.remove('visible');
  clearTimeout(aiTimeout);
  startGame();
});

// Grid dimension inputs
function bindGridInput(input, hint, setter) {
  input.addEventListener('input', () => {
    const val = parseInt(input.value);
    const valid = val >= 2 && val <= 20;
    input.classList.toggle('error', !!input.value && !valid);
    hint.classList.toggle('visible', !!input.value && !valid);
    if (valid) setter(val);
  });
}

bindGridInput(rowsInput, rowsHint, val => { rows = val; });
bindGridInput(colsInput, colsHint, val => { cols = val; });

// Coin toss
tossBtn.addEventListener('click', () => {
  applySettings();
  firstPlayer = Math.random() < 0.5 ? 1 : 2;
  const winnerName = playerNames[firstPlayer];
  const coinSide = Math.random() < 0.5 ? 'Heads' : 'Tails';

  tossResultEl.className = '';
  void tossResultEl.offsetWidth;
  tossResultEl.textContent = `${coinSide}! ${winnerName} goes first!`;
  tossResultEl.className = firstPlayer === 1 ? 'toss-p1' : 'toss-p2';

  startGame();
});

// Quick restart with current settings
resetBtn.addEventListener('click', () => {
  clearTimeout(aiTimeout);
  startGame();
});

function startGame() {
  clearTimeout(aiTimeout);
  totalBoxes = rows * cols;
  scores = { 1: 0, 2: 0 };
  currentPlayer = firstPlayer;
  score1El.textContent = 0;
  score2El.textContent = 0;
  updateTurnUI();
  createBoard();
  if (currentPlayer === 2) {
    aiTimeout = setTimeout(aiMove, 500);
  }
}

function createBoard() {
  board.innerHTML = '';
  cellMap = new Map();
  board.style.gridTemplateColumns = `repeat(${cols * 2 + 1}, auto)`;

  const availW = window.innerWidth - 40;
  const availH = window.innerHeight - 220;
  const cellW = Math.min(60, Math.floor(availW / (cols + (cols + 1) / 4)));
  const cellH = Math.min(60, Math.floor(availH / (rows + (rows + 1) / 4)));
  const dot   = Math.max(8, Math.round(Math.min(cellW, cellH) / 4));
  board.style.setProperty('--cell-w', `${cellW}px`);
  board.style.setProperty('--cell-h', `${cellH}px`);
  board.style.setProperty('--dot', `${dot}px`);

  for (let r = 0; r < rows * 2 + 1; r++) {
    for (let c = 0; c < cols * 2 + 1; c++) {
      const el = document.createElement('div');

      if (r % 2 === 0 && c % 2 === 0) {
        el.classList.add('dot');
      } else if (r % 2 === 0) {
        el.classList.add('line', 'horizontal');
        el.dataset.type = 'h';
        el.dataset.row = r;
        el.dataset.col = c;
      } else if (c % 2 === 0) {
        el.classList.add('line', 'vertical');
        el.dataset.type = 'v';
        el.dataset.row = r;
        el.dataset.col = c;
      } else {
        el.classList.add('box');
        el.dataset.row = r;
        el.dataset.col = c;
      }

      cellMap.set(`${r},${c}`, el);
      board.appendChild(el);
    }
  }
}

// Single delegated listener
board.addEventListener('click', e => {
  if (currentPlayer !== 1) return;
  const line = e.target.closest('.line');
  if (!line || line.classList.contains('clicked')) return;
  makeMove(line);
  endTurn();
});

function makeMove(line) {
  line.classList.add('clicked');
}

function endTurn() {
  const boxCompleted = checkBoxes();
  if (!boxCompleted) {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
  }
  updateTurnUI();

  if (scores[1] + scores[2] === totalBoxes) {
    setTimeout(showGameOver, 300);
    return;
  }

  if (currentPlayer === 2) {
    aiTimeout = setTimeout(aiMove, 500);
  }
}

function checkBoxes() {
  const boxes = board.querySelectorAll('.box');
  let completedAny = false;

  boxes.forEach(box => {
    if (box.classList.contains('player1') || box.classList.contains('player2')) return;

    const r = parseInt(box.dataset.row);
    const c = parseInt(box.dataset.col);

    if (getCell(r - 1, c)?.classList.contains('clicked') &&
        getCell(r + 1, c)?.classList.contains('clicked') &&
        getCell(r, c - 1)?.classList.contains('clicked') &&
        getCell(r, c + 1)?.classList.contains('clicked')) {
      box.classList.add(currentPlayer === 1 ? 'player1' : 'player2');
      scores[currentPlayer]++;
      completedAny = true;
    }
  });

  score1El.textContent = scores[1];
  score2El.textContent = scores[2];
  return completedAny;
}

function getCell(r, c) {
  return cellMap.get(`${r},${c}`);
}

// getAdjacentBoxes, sidesCount, and pickAiLine live in gameLogic.js
function aiMove() {
  const availableLines = [...board.querySelectorAll('.line')].filter(l => !l.classList.contains('clicked'));
  if (availableLines.length === 0) return;
  makeMove(pickAiLine(availableLines, getCell));
  endTurn();
}

// PWA install prompt
const installBtn = document.getElementById('install-btn');
const installIos = document.getElementById('install-ios');
let deferredInstallPrompt = null;

const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;

if (isIos && !isInStandaloneMode) {
  installIos.style.display = 'block';
}

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  installBtn.style.display = 'block';
});

installBtn.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  if (outcome === 'accepted') installBtn.style.display = 'none';
  deferredInstallPrompt = null;
});

window.addEventListener('appinstalled', () => {
  installBtn.style.display = 'none';
  deferredInstallPrompt = null;
});

// Start on load
applySettings();
startGame();

// Redraw board on orientation change / resize
window.addEventListener('resize', () => createBoard());
