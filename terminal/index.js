import { ctx } from '../canvas.js';
import { screenTex } from '../scene.js';
import { COLS, FONT_SIZE, LINE_H, PAD_X, PAD_Y, CHAR_W, PROMPT } from './utils.js';
import { drawTUI, isTUIActive } from './tui.js';

// ──────────────────────────────────
// Terminal state
// ──────────────────────────────────

export const term = {
  lines: [],
  input: '',
  cursorOn: true,
  cursorTimer: 0,
  bootDone: false,
  history: ['portfolio'],
  historyIdx: -1,
  gameActive: false,
  printing: false,
};

const printQueue = [];
let printTimer = null;
const BATCH_MIN = 2;
const BATCH_MAX = 5;
const BATCH_PAUSE = 50; // ms pause between batches

export function termAdd(text) {
  const t = typeof text === 'string' ? text : String(text);
  term.lines.push(t.length > COLS ? t.slice(0, COLS) : t);
  if (term.lines.length > 31) term.lines.shift();
}

export function termPrint(lines) {
  if (!Array.isArray(lines)) return;
  for (const line of lines) printQueue.push(String(line));
  if (!term.printing) flushQueue();
}

function flushQueue() {
  if (printQueue.length === 0) {
    term.printing = false;
    printTimer = null;
    return;
  }
  term.printing = true;

  // Burst: print a batch of lines instantly
  const batchSize = BATCH_MIN + Math.floor(Math.random() * (BATCH_MAX - BATCH_MIN + 1));
  for (let i = 0; i < batchSize && printQueue.length > 0; i++) {
    termAdd(printQueue.shift());
  }
  drawTerminal();

  if (printQueue.length > 0) {
    printTimer = setTimeout(flushQueue, BATCH_PAUSE);
  } else {
    printTimer = setTimeout(() => {
      term.printing = false;
      printTimer = null;
    }, BATCH_PAUSE);
  }
}

// ──────────────────────────────────
// Main draw entry point — dispatches to TUI or terminal mode
// ──────────────────────────────────

export function drawTerminal() {
  if (term.gameActive) return;
  if (isTUIActive()) {
    drawTUI();
    return;
  }
  drawTerm();
}

function drawTerm() {
  ctx.fillStyle = '#080808';
  ctx.fillRect(0, 0, 1024, 768);

  const g = ctx.createRadialGradient(512, 384, 150, 512, 384, 600);
  g.addColorStop(0, 'rgba(20,50,40,0.2)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 768);

  ctx.fillStyle = '#bbbbbb';
  ctx.font = FONT_SIZE + 'px "Courier New", monospace';

  let y = PAD_Y + LINE_H;
  for (const line of term.lines) {
    ctx.fillText(line.length > COLS ? line.slice(0, COLS) : line, PAD_X, y);
    y += LINE_H;
    if (y > 768 - PAD_Y) break;
  }

  if (term.bootDone) {
    const fullLine = PROMPT + term.input;
    ctx.fillStyle = '#bbbbbb';

    if (fullLine.length <= COLS) {
      ctx.fillText(fullLine, PAD_X, y);
      if (term.cursorOn) {
        const cw = ctx.measureText(fullLine).width;
        ctx.fillRect(PAD_X + cw, y - FONT_SIZE + 4, CHAR_W, FONT_SIZE);
      }
    } else {
      let remaining = fullLine;
      let cy = y;
      while (remaining.length > 0) {
        const chunk = remaining.slice(0, COLS);
        ctx.fillText(chunk, PAD_X, cy);
        remaining = remaining.slice(COLS);
        cy += LINE_H;
      }
      if (term.cursorOn) {
        const lastChunk = fullLine.slice(-(fullLine.length % COLS || COLS));
        const cw = ctx.measureText(lastChunk).width;
        ctx.fillRect(PAD_X + cw, cy - LINE_H - FONT_SIZE + 4, CHAR_W, FONT_SIZE);
      }
    }
  }

  ctx.fillStyle = 'rgba(0,0,0,0.04)';
  for (let sy = 0; sy < 768; sy += 3) ctx.fillRect(0, sy, 1024, 1);

  if (screenTex) screenTex.needsUpdate = true;
}
