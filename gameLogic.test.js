const { getAdjacentBoxes, sidesCount, pickAiLine } = require('./gameLogic');

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeEl(classes, row, col, clicked = false) {
  const el = document.createElement('div');
  classes.forEach(c => el.classList.add(c));
  if (row !== undefined) el.dataset.row = String(row);
  if (col !== undefined) el.dataset.col = String(col);
  if (clicked) el.classList.add('clicked');
  return el;
}

const makeLine = (r, c, clicked = false) =>
  makeEl(['line', r % 2 === 0 ? 'horizontal' : 'vertical'], r, c, clicked);

const makeBox = (r, c) => makeEl(['box'], r, c);

// Build a getCell from a coord→element Map
const makeGetCell = cells => (r, c) => cells.get(`${r},${c}`) ?? null;

// Build a full set of 4 side-lines around box (r,c) with optional clicked sides
function boxSides(r, c, clickedSides = []) {
  // sides: 'top'|'bottom'|'left'|'right'
  return new Map([
    [`${r - 1},${c}`, makeLine(r - 1, c, clickedSides.includes('top'))],
    [`${r + 1},${c}`, makeLine(r + 1, c, clickedSides.includes('bottom'))],
    [`${r},${c - 1}`, makeLine(r, c - 1, clickedSides.includes('left'))],
    [`${r},${c + 1}`, makeLine(r, c + 1, clickedSides.includes('right'))],
    [`${r},${c}`,     makeBox(r, c)],
  ]);
}

// ── sidesCount ───────────────────────────────────────────────────────────────

describe('sidesCount', () => {
  test('returns 0 when no sides are clicked', () => {
    const cells = boxSides(1, 1);
    expect(sidesCount(makeBox(1, 1), makeGetCell(cells))).toBe(0);
  });

  test('counts only clicked sides', () => {
    const cells = boxSides(1, 1, ['top', 'left']);
    expect(sidesCount(makeBox(1, 1), makeGetCell(cells))).toBe(2);
  });

  test('returns 4 when all sides are clicked', () => {
    const cells = boxSides(1, 1, ['top', 'bottom', 'left', 'right']);
    expect(sidesCount(makeBox(1, 1), makeGetCell(cells))).toBe(4);
  });

  test('treats missing (null) cells as not clicked — handles grid edges', () => {
    // Only 2 of 4 neighbour cells exist (top-left corner of board)
    const cells = new Map([
      ['2,1', makeLine(2, 1, true)],  // bottom clicked
      ['1,2', makeLine(1, 2, true)],  // right clicked
      // top (0,1) and left (1,0) are off-board — not in map
    ]);
    expect(sidesCount(makeBox(1, 1), makeGetCell(cells))).toBe(2);
  });
});

// ── getAdjacentBoxes ─────────────────────────────────────────────────────────

describe('getAdjacentBoxes', () => {
  test('horizontal line at the top edge returns only the bottom box', () => {
    const bottom = makeBox(1, 1);
    const cells  = new Map([['1,1', bottom]]);
    // r=0 (even), c=1 (odd) → top-edge horizontal line
    expect(getAdjacentBoxes(0, 1, makeGetCell(cells))).toEqual([bottom]);
  });

  test('horizontal line in the middle returns both adjacent boxes', () => {
    const top    = makeBox(1, 1);
    const bottom = makeBox(3, 1);
    const cells  = new Map([['1,1', top], ['3,1', bottom]]);
    // r=2 (even), c=1 (odd) → middle horizontal line
    expect(getAdjacentBoxes(2, 1, makeGetCell(cells))).toEqual([top, bottom]);
  });

  test('vertical line at the left edge returns only the right box', () => {
    const right = makeBox(1, 1);
    const cells = new Map([['1,1', right]]);
    // r=1 (odd), c=0 (even) → left-edge vertical line
    expect(getAdjacentBoxes(1, 0, makeGetCell(cells))).toEqual([right]);
  });

  test('vertical line in the middle returns both adjacent boxes', () => {
    const left  = makeBox(1, 1);
    const right = makeBox(1, 3);
    const cells = new Map([['1,1', left], ['1,3', right]]);
    // r=1 (odd), c=2 (even) → middle vertical line
    expect(getAdjacentBoxes(1, 2, makeGetCell(cells))).toEqual([left, right]);
  });

  test('dot position (even row, even col) returns no boxes', () => {
    expect(getAdjacentBoxes(0, 0, () => null)).toEqual([]);
  });

  test('box position (odd row, odd col) returns no boxes', () => {
    expect(getAdjacentBoxes(1, 1, () => null)).toEqual([]);
  });
});

// ── pickAiLine ───────────────────────────────────────────────────────────────

describe('pickAiLine', () => {
  test('picks the line that completes a 3-sided box', () => {
    // Box at (1,1): top, bottom, left clicked → right (1,2) completes it
    const cells = boxSides(1, 1, ['top', 'bottom', 'left']);
    const completingLine = cells.get('1,2');  // right side, not yet clicked
    const unrelatedLine  = makeLine(0, 3);    // unrelated line elsewhere

    expect(pickAiLine([unrelatedLine, completingLine], makeGetCell(cells)))
      .toBe(completingLine);
  });

  test('prefers safe lines over dangerous ones when both exist', () => {
    // Box at (1,1) has 2 sides → clicking left or right gives opponent 3-sided box
    const cells = boxSides(1, 1, ['top', 'bottom']);
    const dangerLine = cells.get('1,0');  // left side — dangerous
    const safeLine   = makeLine(4, 1);   // far away — safe

    expect(pickAiLine([dangerLine, safeLine], makeGetCell(cells)))
      .toBe(safeLine);
  });

  test('falls back to any available line when all moves are dangerous', () => {
    // All remaining lines expose a 2-sided box — must still pick one
    const cells = boxSides(1, 1, ['top', 'bottom']);
    const line1 = cells.get('1,0');
    const line2 = cells.get('1,2');

    const result = pickAiLine([line1, line2], makeGetCell(cells));
    expect([line1, line2]).toContain(result);
  });

  test('returns the only available line when there is just one', () => {
    const cells  = new Map();  // no adjacent boxes
    const onlyLine = makeLine(0, 1);

    expect(pickAiLine([onlyLine], makeGetCell(cells))).toBe(onlyLine);
  });
});
