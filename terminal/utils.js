// ──────────────────────────────────
// Shared constants
// ──────────────────────────────────

export const COLS = 80;
export const FONT_SIZE = 18;
export const LINE_H = 22;
export const PAD_X = 40;
export const PAD_Y = 30;
export const MAX_LINES = 31;
export const CHAR_W = 10.2;
export const VISIBLE = 25;

export const PROMPT = 'guest@portfoliOS:~$ ';

export const HOME_HOST = 'portfoliOS';

// ──────────────────────────────────
// String helpers
// ──────────────────────────────────

export function clamp(s, w) {
  return s.length > w ? s.slice(0, w) : s;
}

export function pad(s, w) {
  const len = Math.min(s.length, w);
  return s + ' '.repeat(Math.max(0, w - len));
}

export function center(s, w) {
  const t = clamp(s, w);
  const padL = Math.floor((w - t.length) / 2);
  return ' '.repeat(Math.max(0, padL)) + t;
}

export function charFill(c, w) {
  return c.repeat(w);
}

// ──────────────────────────────────
// Android fingerprint & box-char fix
// ──────────────────────────────────

export const IS_ANDROID = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

const BOX_REPLACE = {
  '╔': '+', '╗': '+', '╚': '+', '╝': '+',
  '╠': '+', '╣': '+',
  '║': '|', '═': '=',
  '┌': '+', '┐': '+', '└': '+', '┘': '+',
  '│': '|', '─': '-',
  '▲': '^', '▼': 'v',
};

export function replaceBoxChars(s) {
  if (!IS_ANDROID) return s;
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const r = BOX_REPLACE[s[i]];
    out += r !== undefined ? r : s[i];
  }
  return out;
}

export const ASCII_LOGO_ANDROID = [
  'portfoliOS',
];

// ──────────────────────────────────
// Shared ASCII art
// ──────────────────────────────────

export const ASCII_LOGO = [
  '      ▗ ▐▘  ▜ ▘▄▖▄▖',
  '▛▌▛▌▛▘▜▘▜▘▛▌▐ ▌▌▌▚ ',
  '▙▌▙▌▌ ▐▖▐ ▙▌▐▖▌▙▌▄▌',
  '▌                  ',
];
