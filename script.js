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
const settingsPanel = document.getElementById('settings-panel');
const overlay = document.getElementById('overlay');
const rowsInput = document.getElementById('rows-input');
const colsInput = document.getElementById('cols-input');
const rowsHint = document.getElementById('rows-hint');
const colsHint = document.getElementById('cols-hint');

let rows = 6;
let cols = 6;
let currentPlayer = 1;
let scores = { 1: 0, 2: 0 };
let totalBoxes = rows * cols;
let aiTimeout = null;
let cellMap = new Map();
let playerNames = { 1: 'Player 1', 2: 'Bot' };
let firstPlayer = 1;

// Hamburger menu
hamburgerBtn.addEventListener('click', () => {
  settingsPanel.classList.add('open');
  overlay.classList.add('visible');
});

overlay.addEventListener('click', () => {
  settingsPanel.classList.remove('open');
  overlay.classList.remove('visible');
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
  const p1Name = name1Input.value.trim() || 'Player 1';
  const p2Name = name2Input.value.trim() || 'Bot';
  firstPlayer = Math.random() < 0.5 ? 1 : 2;
  const winnerName = firstPlayer === 1 ? p1Name : p2Name;
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
  currentPlayerNameEl.textContent = playerNames[currentPlayer];
  createBoard();
  if (currentPlayer === 2) {
    aiTimeout = setTimeout(aiMove, 500);
  }
}

function createBoard() {
  board.innerHTML = '';
  cellMap = new Map();
  board.style.gridTemplateColumns = `repeat(${cols * 2 + 1}, auto)`;

  const cellW = Math.min(60, Math.floor(650 / (cols + (cols + 1) / 4)));
  const cellH = Math.min(60, Math.floor(600 / (rows + (rows + 1) / 4)));
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
  currentPlayerNameEl.textContent = playerNames[currentPlayer];

  if (scores[1] + scores[2] === totalBoxes) {
    let winner;
    if (scores[1] > scores[2]) winner = playerNames[1];
    else if (scores[2] > scores[1]) winner = playerNames[2];
    else winner = 'Nobody (Draw)';
    setTimeout(() => alert(`Game Over! Winner: ${winner}`), 100);
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

// Start on load
startGame();
