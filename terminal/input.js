import { term, termAdd, drawTerminal } from './index.js';
import { COLS, PROMPT } from './utils.js';
import { termExec } from './commands.js';
import { tui, tuiPages, startLineAnim, skipLineAnim, renderContent, TABS, TABS_COUNT, TUI_W } from './tui.js';

export function setupKeyboard() {
  window.addEventListener('keydown', (e) => {
    if (!term.bootDone) return;
    if (term.printing) return;
    if (e.target !== document.body && e.target !== document.documentElement) return;

    // ── Ctrl+C ──
    if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      if (tui.active) {
        tui.active = false;
        term.lines = [];
        drawTerminal();
      } else {
        termAdd(PROMPT + term.input + '^C');
        term.input = '';
        drawTerminal();
      }
      return;
    }

    // ── TUI navigation ──
    if (tui.active) {
      if (e.key === 'q' || e.key === 'Q' || e.key === 'Escape') {
        if (tui.animTimer) { clearInterval(tui.animTimer); tui.animTimer = null; }
        tui.active = false;
        term.lines = [];
        drawTerminal();
        e.preventDefault();
        return;
      }

      if (skipLineAnim()) { e.preventDefault(); return; }

      if (e.key === 'ArrowLeft') {
        tui.page = tui.page > 1 ? tui.page - 1 : TABS_COUNT;
        startLineAnim(renderContent(tuiPages[tui.page].rows, TUI_W).length);
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowRight') {
        tui.page = tui.page < TABS_COUNT ? tui.page + 1 : 1;
        startLineAnim(renderContent(tuiPages[tui.page].rows, TUI_W).length);
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowUp') {
        if (tui.scrollY > 0) { tui.scrollY--; drawTerminal(); }
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowDown') {
        tui.scrollY++;
        drawTerminal();
        e.preventDefault();
        return;
      }
      e.preventDefault();
      return;
    }

    // ── Terminal input ──
    if (e.key === 'Enter') {
      if (term.input.trim()) {
        term.history.push(term.input);
        term.historyIdx = term.history.length;
      }
      termExec(term.input);
      drawTerminal();
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (term.history.length === 0) return;
      if (term.historyIdx > 0) term.historyIdx--;
      term.input = term.history[term.historyIdx] || '';
      drawTerminal();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (term.historyIdx < term.history.length - 1) {
        term.historyIdx++;
        term.input = term.history[term.historyIdx];
      } else {
        term.historyIdx = term.history.length;
        term.input = '';
      }
      drawTerminal();
    } else if (e.key === 'Backspace') {
      term.input = term.input.slice(0, -1);
      drawTerminal();
      e.preventDefault();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      term.historyIdx = term.history.length;
      if (term.input.length < COLS) {
        term.input += e.key;
        drawTerminal();
      }
      e.preventDefault();
    }
  });

  document.body.setAttribute('tabindex', '0');
  document.body.addEventListener('click', () => document.body.focus());
  document.body.focus();
}
