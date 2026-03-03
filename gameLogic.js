// gameLogic.js — pure game logic, no direct DOM dependencies.
// getCell is passed as a parameter so this code works in both
// the browser (script.js closes over cellMap) and in Jest tests.

function getAdjacentBoxes(r, c, getCell) {
  const boxes = [];
  if (r % 2 === 0 && c % 2 !== 0) {          // horizontal line
    const topBox    = getCell(r - 1, c);
    const bottomBox = getCell(r + 1, c);
    if (topBox?.classList.contains('box'))    boxes.push(topBox);
    if (bottomBox?.classList.contains('box')) boxes.push(bottomBox);
  } else if (r % 2 !== 0 && c % 2 === 0) {   // vertical line
    const leftBox  = getCell(r, c - 1);
    const rightBox = getCell(r, c + 1);
    if (leftBox?.classList.contains('box'))  boxes.push(leftBox);
    if (rightBox?.classList.contains('box')) boxes.push(rightBox);
  }
  return boxes;
}

function sidesCount(box, getCell) {
  const r = parseInt(box.dataset.row);
  const c = parseInt(box.dataset.col);
  return [getCell(r - 1, c), getCell(r + 1, c), getCell(r, c - 1), getCell(r, c + 1)]
    .filter(line => line?.classList.contains('clicked')).length;
}

// Returns the line the AI should play.
function pickAiLine(availableLines, getCell) {
  // 1. Complete any box that already has 3 sides
  for (const line of availableLines) {
    const r = parseInt(line.dataset.row);
    const c = parseInt(line.dataset.col);
    if (getAdjacentBoxes(r, c, getCell).some(box => sidesCount(box, getCell) === 3)) {
      return line;
    }
  }

  // 2. Avoid giving the opponent a box (skip lines next to 2-sided boxes)
  const safeLines = availableLines.filter(line => {
    const r = parseInt(line.dataset.row);
    const c = parseInt(line.dataset.col);
    return !getAdjacentBoxes(r, c, getCell).some(box => sidesCount(box, getCell) === 2);
  });

  const pool = safeLines.length > 0 ? safeLines : availableLines;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Works as a browser global AND as a Node/Jest module
if (typeof module !== 'undefined') {
  module.exports = { getAdjacentBoxes, sidesCount, pickAiLine };
}
