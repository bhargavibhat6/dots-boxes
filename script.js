// DOM references
const board = document.getElementById('game-board');
const score1El = document.getElementById('score1');
const score2El = document.getElementById('score2');
const p1LabelEl = document.getElementById('p1-label');
const p2LabelEl = document.getElementById('p2-label');
const currentPlayerNameEl = document.getElementById('current-player-name');
const resetBtn = document.getElementById('reset-btn');
const startBtn = document.getElementById('start-btn');
const tossBtn = document.getElementById('toss-btn');
const tossResultEl = document.getElementById('toss-result');
const setupEl = document.getElementById('setup');
const gameAreaEl = document.getElementById('game-area');
const name1Input = document.getElementById('name1');
const name2Input = document.getElementById('name2');

let size = 3;
let currentPlayer = 1;
let scores = { 1: 0, 2: 0 };
let totalBoxes = size * size;
let aiTimeout = null;
let cellMap = new Map();
let playerNames = { 1: 'Player 1', 2: 'AI' };
let firstPlayer = 1;

// Grid size selection
document.querySelectorAll('.size-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    size = parseInt(btn.dataset.size);
  });
});

// Coin toss
tossBtn.addEventListener('click', () => {
  const p1Name = name1Input.value.trim() || 'Player 1';
  const p2Name = name2Input.value.trim() || 'AI';
  firstPlayer = Math.random() < 0.5 ? 1 : 2;
  const winnerName = firstPlayer === 1 ? p1Name : p2Name;
  const coinSide = Math.random() < 0.5 ? 'Heads' : 'Tails';

  // Restart animation by resetting class
  tossResultEl.className = '';
  void tossResultEl.offsetWidth; // force reflow
  tossResultEl.textContent = `${coinSide}! ${winnerName} goes first!`;
  tossResultEl.className = firstPlayer === 1 ? 'toss-p1' : 'toss-p2';
});

// Start game
startBtn.addEventListener('click', () => {
  playerNames[1] = name1Input.value.trim() || 'Player 1';
  playerNames[2] = name2Input.value.trim() || 'AI';
  p1LabelEl.textContent = playerNames[1];
  p2LabelEl.textContent = playerNames[2];
  totalBoxes = size * size;
  setupEl.style.display = 'none';
  gameAreaEl.style.display = 'block';
  startGame();
});

function startGame() {
  clearTimeout(aiTimeout);
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
  board.style.gridTemplateColumns = `repeat(${size * 2 + 1}, auto)`;

  for (let r = 0; r < size * 2 + 1; r++) {
    for (let c = 0; c < size * 2 + 1; c++) {
      const cell = document.createElement('div');

      if (r % 2 === 0 && c % 2 === 0) {
        cell.classList.add('dot');
      } else if (r % 2 === 0) {
        cell.classList.add('line', 'horizontal');
        cell.dataset.type = 'h';
        cell.dataset.row = r;
        cell.dataset.col = c;
      } else if (c % 2 === 0) {
        cell.classList.add('line', 'vertical');
        cell.dataset.type = 'v';
        cell.dataset.row = r;
        cell.dataset.col = c;
      } else {
        cell.classList.add('box');
        cell.dataset.row = r;
        cell.dataset.col = c;
      }

      cellMap.set(`${r},${c}`, cell);
      board.appendChild(cell);
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

// New Game → back to setup
resetBtn.addEventListener('click', () => {
  clearTimeout(aiTimeout);
  firstPlayer = 1;
  tossResultEl.textContent = '';
  tossResultEl.className = '';
  gameAreaEl.style.display = 'none';
  setupEl.style.display = '';
});
