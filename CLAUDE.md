# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run all tests
npm test

# Run a single test file
npx jest gameLogic.test.js

# Run tests matching a specific name
npx jest -t "pickAiLine"

# Open the game locally (no build step needed)
start index.html   # Windows
open index.html    # macOS
```

There is no build or bundler. The game runs directly in the browser as static files.

## Architecture

This is a vanilla JS + CSS PWA with no framework or bundler.

**The key split:** game logic is separated into `gameLogic.js` (pure functions, no DOM) so it can be tested with Jest, while `script.js` owns all DOM manipulation and wires everything together.

**Grid coordinate system:** The board is a `(rows*2+1) × (cols*2+1)` grid where:
- Even row + even col → **dot**
- Even row + odd col → **horizontal line**
- Odd row + even col → **vertical line**
- Odd row + odd col → **box**

This coordinate scheme is used everywhere: `dataset.row`/`dataset.col` on DOM elements, the `cellMap` in `script.js`, and the `getCell(r, c)` function passed into `gameLogic.js`.

**`getCell` injection:** `gameLogic.js` functions accept `getCell` as a parameter (rather than closing over the DOM) so the same logic works both in the browser and in Jest/jsdom tests. `gameLogic.js` dual-exports: browser global `if (typeof module !== 'undefined')` guard enables `require()` in tests.

**AI strategy (`pickAiLine`):** Three-priority greedy — (1) complete any 3-sided box, (2) avoid lines adjacent to 2-sided boxes, (3) random fallback.

**PWA:** `manifest.json` + `sw.js` (service worker). The SW is registered at `/dots-boxes/sw.js` (subpath), so local `file://` opening won't register it — that's expected.
