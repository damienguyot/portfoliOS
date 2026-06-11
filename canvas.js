// ──────────────────────────────────
// 2D canvas — used as texture on the CRT screen
// ──────────────────────────────────

export const CANVAS_W = 1024;
export const CANVAS_H = 768;

export const screenCanvas = document.createElement('canvas');
screenCanvas.width = CANVAS_W;
screenCanvas.height = CANVAS_H;

export const ctx = screenCanvas.getContext('2d');
