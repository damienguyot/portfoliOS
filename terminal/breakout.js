import { ctx, CANVAS_W, CANVAS_H } from '../canvas.js';
import { screenTex } from '../scene.js';
import { term, drawTerminal } from './index.js';
import { CHAR_W, LINE_H, FONT_SIZE } from './utils.js';

// ══════════════════════════════════
// C64 palette + layout
// ══════════════════════════════════

const C64_BG    = '#000044';
const C64_BORDER = '#6666cc';
const C64_BALL   = '#ffffff';
const C64_PADDLE = '#cccccc';
const C64_TEXT   = '#aaaaff';
const C64_HUD    = '#8888ff';

const BRICK_COLORS = [
  '#cc4444', '#cc6644', '#cccc44',
  '#44cc44', '#44cccc', '#4444cc',
  '#cc44cc', '#88bb44',
];

// Grid
const CW = CHAR_W;
const RH = LINE_H;

// Border edges (pixel-precise, shared by draw + collision)
const BORDER_L = 2 * CW;
const BORDER_R = CANVAS_W - 2 * CW;
const BORDER_T = 3 * RH;
const BORDER_B = CANVAS_H - 2 * RH;

const PLAY_X = BORDER_L + 2;
const PLAY_Y = BORDER_T + 2;
const PLAY_W = BORDER_R - BORDER_L - 4;
const PLAY_H = BORDER_B - BORDER_T - 4;

const GRID_COLS = Math.floor(PLAY_W / CW);
const GRID_ROWS = Math.floor(PLAY_H / RH);

function gc(c) { return PLAY_X + c * CW; }
function gr(r) { return PLAY_Y + r * RH; }

// ══════════════════════════════════
// Game constants
// ══════════════════════════════════

const PADDLE_W = 10;   // cols
const PADDLE_R = GRID_ROWS - 2;
const BALL_SPEED = 320; // px/s
const BRICK_W = 5;
const BRICK_H = 1;
const BRICK_COLS = 12;
const BRICK_ROWS = 8;
const BRICK_GAP = 1;    // cols between bricks
const BRICK_TOP = 4;    // first brick row

// Center bricks within play area
const BRICK_TOTAL_W = BRICK_COLS * (BRICK_W + BRICK_GAP) - BRICK_GAP; // cols
const BRICK_OFFSET = Math.floor((GRID_COLS - BRICK_TOTAL_W) / 2);

const TOTAL_BRICKS = BRICK_COLS * BRICK_ROWS;

// ══════════════════════════════════
// State
// ══════════════════════════════════

let paddleX;      // in grid cols (left edge)
let ball;         // { x, y, vx, vy } in pixels
let bricks;       // boolean grid [row][col]
let score, lives, ballOnPaddle, animId, running;
let lastTs = 0, accum = 0;

// ══════════════════════════════════
// Helpers
// ══════════════════════════════════

function brickPixelX(c) { return PLAY_X + (BRICK_OFFSET + c * (BRICK_W + BRICK_GAP)) * CW; }
function brickPixelY(r) { return PLAY_Y + (BRICK_TOP + r) * RH; }
function brickPixelW()  { return BRICK_W * CW; }
function brickPixelH()  { return BRICK_H * RH; }

function initBricks() {
  bricks = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    bricks[r] = [];
    for (let c = 0; c < BRICK_COLS; c++) {
      bricks[r][c] = true;
    }
  }
}

// ══════════════════════════════════
// Ball / paddle
// ══════════════════════════════════

function launchBall() {
  const angle = (Math.random() - 0.5) * 0.8; // -0.4 .. 0.4 rad
  ball = {
    x: (paddleX + PADDLE_W / 2) * CW + PLAY_X,
    y: gr(PADDLE_R) - BALL_R,
    vx: Math.sin(angle) * BALL_SPEED,
    vy: -Math.cos(angle) * BALL_SPEED,
  };
  ballOnPaddle = false;
}

function clampPaddle() {
  paddleX = Math.max(0, Math.min(GRID_COLS - PADDLE_W, paddleX));
}

// ══════════════════════════════════
// Collision
// ══════════════════════════════════

const BALL_R = 5; // collision radius ~ half char width

// Play area bounds (inside border lines)
const WALL_L = BORDER_L + 2;
const WALL_R = BORDER_R - 2;
const WALL_T = BORDER_T + 2;
const WALL_B = BORDER_B - 2;

function ballBrickHit() {
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      if (!bricks[r][c]) continue;
      const bx = brickPixelX(c);
      const by = brickPixelY(r);
      const bw = brickPixelW();
      const bh = brickPixelH();
      if (ball.x + BALL_R > bx && ball.x - BALL_R < bx + bw &&
          ball.y + BALL_R > by && ball.y - BALL_R < by + bh) {
        return { r, c, bx, by, bw, bh };
      }
    }
  }
  return null;
}

function resolveBrickHit(hit) {
  bricks[hit.r][hit.c] = false;
  score += 10;

  // Push ball outside brick on the correct side
  const bLeft = hit.bx, bRight = hit.bx + hit.bw;
  const bTop = hit.by, bBot = hit.by + hit.bh;

  const prevX = ball.x - ball.vx;
  const prevY = ball.y - ball.vy;

  if (prevY + BALL_R <= bTop) {
    ball.vy = -Math.abs(ball.vy);
    ball.y = bTop - BALL_R;
  } else if (prevY - BALL_R >= bBot) {
    ball.vy = Math.abs(ball.vy);
    ball.y = bBot + BALL_R;
  } else if (prevX + BALL_R <= bLeft) {
    ball.vx = -Math.abs(ball.vx);
    ball.x = bLeft - BALL_R;
  } else {
    ball.vx = Math.abs(ball.vx);
    ball.x = bRight + BALL_R;
  }
}

function stepBall(subDt) {
  ball.x += ball.vx * subDt;
  ball.y += ball.vy * subDt;

  // Walls (match visible border exactly)
  if (ball.x - BALL_R < WALL_L) { ball.x = WALL_L + BALL_R; ball.vx = Math.abs(ball.vx); }
  if (ball.x + BALL_R > WALL_R) { ball.x = WALL_R - BALL_R; ball.vx = -Math.abs(ball.vx); }
  if (ball.y - BALL_R < WALL_T) { ball.y = WALL_T + BALL_R; ball.vy = Math.abs(ball.vy); }

  // Bricks
  const hit = ballBrickHit();
  if (hit) resolveBrickHit(hit);

  // Paddle
  const pLeft = paddleX * CW + PLAY_X;
  const pRight = (paddleX + PADDLE_W) * CW + PLAY_X;
  const pTop = gr(PADDLE_R);

  if (ball.vy > 0 &&
      ball.y + BALL_R >= pTop &&
      ball.y - BALL_R <= pTop + RH &&
      ball.x + BALL_R > pLeft &&
      ball.x - BALL_R < pRight) {
    const hitFrac = (ball.x - pLeft) / ((PADDLE_W - 1) * CW);
    const angle = (hitFrac - 0.5) * 1.3;
    ball.vx = Math.sin(angle) * BALL_SPEED;
    ball.vy = -Math.abs(Math.cos(angle) * BALL_SPEED);
    ball.y = pTop - BALL_R;
  }
}

// ══════════════════════════════════
// Update
// ══════════════════════════════════

const SUBSTEPS = 5;

function update(dt) {
  if (ballOnPaddle) {
    ball = {
      x: (paddleX + PADDLE_W / 2) * CW + PLAY_X,
      y: gr(PADDLE_R) - BALL_R,
      vx: 0, vy: 0,
    };
    return;
  }

  const subDt = dt / SUBSTEPS;
  for (let i = 0; i < SUBSTEPS; i++) {
    stepBall(subDt);
  }

  // Ball falls below
  if (ball.y > WALL_B + RH) {
    lives--;
    if (lives <= 0) return;
    ballOnPaddle = true;
    paddleX = GRID_COLS / 2 - PADDLE_W / 2;
  }

  // Win
  if (score >= TOTAL_BRICKS * 10 && lives > 0) {
    lives = -1;
  }
}

// ══════════════════════════════════
// Draw
// ══════════════════════════════════

function drawBorder() {
  ctx.fillStyle = C64_BORDER;

  // Top + bottom lines
  ctx.fillRect(BORDER_L, BORDER_T, BORDER_R - BORDER_L, 2);
  ctx.fillRect(BORDER_L, BORDER_B, BORDER_R - BORDER_L, 2);

  // Left + right lines
  ctx.fillRect(BORDER_L, BORDER_T, 2, BORDER_B - BORDER_T);
  ctx.fillRect(BORDER_R - 2, BORDER_T, 2, BORDER_B - BORDER_T);

  // Corner decorations (using fillText with monospace font)
  ctx.font = 'bold ' + (FONT_SIZE + 2) + 'px "Courier New", monospace';
  ctx.fillText('╔', BORDER_L + 1, BORDER_T + RH);
  ctx.fillText('╗', BORDER_R - CW - 1, BORDER_T + RH);
  ctx.fillText('╚', BORDER_L + 1, BORDER_B + RH);
  ctx.fillText('╝', BORDER_R - CW - 1, BORDER_B + RH);
}

function drawBricks() {
  ctx.font = 'bold ' + (FONT_SIZE + 2) + 'px "Courier New", monospace';
  for (let r = 0; r < BRICK_ROWS; r++) {
    ctx.fillStyle = BRICK_COLORS[r];
    for (let c = 0; c < BRICK_COLS; c++) {
      if (!bricks[r][c]) continue;
      const bx = brickPixelX(c);
      const by = brickPixelY(r) + RH;
      ctx.fillText('█'.repeat(BRICK_W), bx, by);
    }
  }
}

function drawPaddle() {
  ctx.fillStyle = C64_PADDLE;
  ctx.font = 'bold ' + (FONT_SIZE + 2) + 'px "Courier New", monospace';
  const px = (paddleX) * CW + PLAY_X;
  const py = gr(PADDLE_R) + RH;
  ctx.fillText('▀'.repeat(PADDLE_W), px, py);
}

function drawBall() {
  if (ballOnPaddle) return;
  ctx.fillStyle = C64_BALL;
  ctx.font = 'bold ' + (FONT_SIZE + 2) + 'px "Courier New", monospace';
  ctx.fillText('●', ball.x - CW / 2, ball.y + RH / 2);
}

function drawHUD() {
  ctx.fillStyle = C64_HUD;
  ctx.font = FONT_SIZE + 'px "Courier New", monospace';

  // Score
  ctx.textAlign = 'left';
  const scoreStr = String(score).padStart(6, '0');
  ctx.fillText('SCORE ' + scoreStr, PLAY_X, PLAY_Y - RH * 0.3);

  // Lives
  ctx.textAlign = 'right';
  let livesStr = '';
  for (let i = 0; i < Math.max(0, lives); i++) livesStr += '● ';
  ctx.fillText(livesStr, PLAY_X + PLAY_W, PLAY_Y - RH * 0.3);

  ctx.textAlign = 'left';
}

function drawMessage(title, subtitle) {
  const midC = Math.floor(GRID_COLS / 2);
  const midR = Math.floor(GRID_ROWS / 2);

  const bw = 30, bh = 5;
  const bx = midC - bw / 2;
  const by = midR - bh / 2;

  // Background
  ctx.fillStyle = C64_BG;
  ctx.fillRect(gc(bx), gr(by) - RH, bw * CW, bh * RH);

  // Border
  ctx.fillStyle = C64_BORDER;
  ctx.font = FONT_SIZE + 'px "Courier New", monospace';
  ctx.fillText('╔' + '═'.repeat(bw - 2) + '╗', gc(bx), gr(by));
  for (let r = 1; r < bh - 1; r++) {
    ctx.fillText('║', gc(bx), gr(by + r));
    ctx.fillText('║', gc(bx + bw - 1), gr(by + r));
  }
  ctx.fillText('╚' + '═'.repeat(bw - 2) + '╝', gc(bx), gr(by + bh - 1));

  // Text
  ctx.fillStyle = C64_TEXT;
  ctx.font = 'bold ' + (FONT_SIZE + 4) + 'px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(title, gc(midC), gr(by + 1));

  ctx.fillStyle = C64_HUD;
  ctx.font = FONT_SIZE + 'px "Courier New", monospace';
  ctx.fillText(subtitle, gc(midC), gr(by + 3));
  ctx.textAlign = 'left';
}

function draw() {
  ctx.fillStyle = C64_BG;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  drawBricks();
  drawPaddle();
  drawBall();
  drawBorder();
  drawHUD();

  if (lives <= 0) {
    drawMessage('GAME OVER', '[SPACE] retry    [Q] quit');
  } else if (lives === -1) {
    drawMessage('YOU WIN!', '[SPACE] play again    [Q] quit');
  } else if (ballOnPaddle) {
    ctx.fillStyle = C64_HUD;
    ctx.font = FONT_SIZE + 'px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[SPACE] launch ball', gc(GRID_COLS / 2), gr(PADDLE_R - 2));
    ctx.textAlign = 'left';
  }

  if (screenTex) screenTex.needsUpdate = true;
}

// ══════════════════════════════════
// Game loop
// ══════════════════════════════════

function reset() {
  initBricks();
  paddleX = GRID_COLS / 2 - PADDLE_W / 2;
  ballOnPaddle = true;
  score = 0;
  lives = 3;
  lastTs = 0;
  accum = 0;
}

function gameLoop(ts) {
  if (!running) return;
  animId = requestAnimationFrame(gameLoop);

  if (!lastTs) lastTs = ts;
  const elapsed = Math.min(ts - lastTs, 100);
  lastTs = ts;
  accum += elapsed;

  const TICK = 1000 / 20; // 50ms

  while (accum >= TICK) {
    accum -= TICK;
    const tickDt = TICK / 1000;

    // Paddle movement at same rate as physics
    const PADDLE_SPD = 18;
    if (keys['ArrowLeft'])  { paddleX -= PADDLE_SPD * tickDt; clampPaddle(); }
    if (keys['ArrowRight']) { paddleX += PADDLE_SPD * tickDt; clampPaddle(); }

    update(tickDt);
  }
  draw();
}

// ══════════════════════════════════
// Input
// ══════════════════════════════════

const keys = {};

function onKeyDown(e) {
  if (e.key === 'Escape' || e.key === 'q' || e.key === 'Q' || (e.key === 'c' && e.ctrlKey)) {
    stop();
    e.preventDefault();
    return;
  }
  if (e.key === ' ') {
    e.preventDefault();
    if (lives <= 0 || lives === -1) { reset(); return; }
    if (ballOnPaddle) { launchBall(); return; }
    return;
  }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    keys[e.key] = true;
    e.preventDefault();
  }
}

function onKeyUp(e) {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    keys[e.key] = false;
    e.preventDefault();
  }
}

// ══════════════════════════════════
// Start / stop
// ══════════════════════════════════

function stop() {
  running = false;
  if (animId) cancelAnimationFrame(animId);
  animId = null;
  window.removeEventListener('keydown', onKeyDown, true);
  window.removeEventListener('keyup', onKeyUp, true);
  ctx.fillStyle = C64_BG;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  term.gameActive = false;
  term.bootDone = true;
  drawTerminal();
}

export function startBreakout() {
  reset();
  running = true;
  term.gameActive = true;
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('keyup', onKeyUp, true);
  animId = requestAnimationFrame(gameLoop);
}
