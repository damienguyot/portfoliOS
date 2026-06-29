import { term, termAdd, termPrint, drawTerminal } from './index.js';
import { COLS, PROMPT, center, charFill, ASCII_LOGO, IS_ANDROID, ASCII_LOGO_ANDROID } from './utils.js';
import { tui, tuiPages, startLineAnim, renderContent, TUI_W } from './tui.js';
import { resetBoot } from './boot.js';
import { startBreakout } from './breakout.js';

// ──────────────────────────────────
// Command handlers
// ──────────────────────────────────

function cmdClear() {
  term.lines = [];
}

function cmdHelp() {
  termPrint([
    'Available: help, clear, echo, hostname, whoami, date, ls,',
    '           history, neofetch, cowsay, portfolio, reboot, breakout',
  ]);
}

function cmdWhoami() {
  termAdd('guest');
}

function cmdDate() {
  termAdd(new Date().toString());
}

function cmdLine() {
  termAdd(charFill('-', COLS));
}

function cmdLs() {
  termPrint(['super_secret_password.txt', 'contact']);
}

function cmdFill(args) {
  const parts = args.split(' ');
  const ch = parts[0] || '-';
  const count = parseInt(parts[1]) || COLS;
  termAdd(ch.repeat(Math.min(count, 200)));
}

function cmdCat(args) {
  const file = args.trim();
  if (file === 'super_secret_password.txt') {
    termAdd('access denied');
  } else if (file === 'contact') {
    termPrint([
      'Email:    damien@guyot.dev',
      'GitHub:   github.com/damienguyot',
      'LinkedIn: linkedin.com/in/damienguyot',
    ]);
  } else {
    termAdd('cat: ' + file + ': No such file or directory');
  }
}

function cmdPortfolio() {
  term.lines = [];
  term.input = '';
  term.bootDone = false;
  drawTerminal();
  const spinner = ['|', '/', '-', '\\'];
  let frame = 0;
  const spinIvl = setInterval(() => {
    term.lines = ['', '', '', '', '', '', '',
      center('Loading portfolio... ' + spinner[frame % 4], COLS)];
    drawTerminal();
    frame++;
  }, 80);
  setTimeout(() => {
    clearInterval(spinIvl);
    term.bootDone = true;
    term.lines = [];
    tui.active = true;
    tui.page = 1;
    const p = tuiPages[1];
    startLineAnim(renderContent(p.rows, TUI_W).length);
  }, 1500);
}

function cmdReboot() {
  term.bootDone = false;
  termAdd('');
  termAdd('Broadcasting reboot signal...');
  termAdd('');
  const shutdown = [
    ['[  OK  ] Stopping NGINX Web Server...', 150],
    ['[  OK  ] Stopping Redis Server...', 120],
    ['[  OK  ] Stopping PostgreSQL 16...', 140],
    ['[  OK  ] Stopping Docker containers...', 130],
    ['[  OK  ] Stopping Docker Engine...', 120],
    ['[  OK  ] Stopping OpenSSH Daemon...', 110],
    ['[  OK  ] Stopping Cron Daemon...', 100],
    ['[  OK  ] Stopping Network Manager...', 120],
    ['[  OK  ] Unmounting filesystems...', 130],
    ['[  OK  ] Syncing disks...', 100],
    ['', 200],
  ];
  let si = 0;
  function playShutdown() {
    if (si >= shutdown.length) {
      setTimeout(() => {
        term.lines = [];
        drawTerminal();
        setTimeout(resetBoot, 500);
      }, 1500);
      return;
    }
    const [text, delay] = shutdown[si];
    termAdd(text);
    drawTerminal();
    si++;
    setTimeout(playShutdown, delay);
  }
  playShutdown();
  term.input = '';
}

function cmdBreakout() {
  term.bootDone = false;
  term.input = '';
  startBreakout();
}

function cmdHostname() {
  termAdd('portfoliOS');
}

function cmdHistory() {
  if (term.history.length === 0) {
    termPrint(['(empty)']);
    return;
  }
  const lines = term.history.map((h, i) => '  ' + (i + 1) + '  ' + h);
  termPrint(lines);
}

function cmdEcho(args) {
  termAdd(args.trim());
}

function cmdNeofetch() {
  term.lines = [];
  termPrint([
    ...(IS_ANDROID ? ASCII_LOGO_ANDROID : ASCII_LOGO),
    '',
    'guest@portfoliOS',
    '───────────────',
    'OS: PortfoliOS 6.1.0 LTS',
    'Kernel: Linux 6.1.0-portfolio',
    'Shell: bash 5.2',
    'CPU: AMD Ryzen 9 9950X3D (16) @ 4.5GHz',
    'GPU: NVIDIA GeForce RTX 4090',
    'RAM: 65536MB DDR5-6000',
    'Uptime: ' + Math.floor(performance.now() / 1000) + 's',
    'Packages: 1487 (dpkg)',
    'Editor: vim',
    'Location: FR',
    '',
  ]);
}

function cmdCowsay(args) {
  const msg = (args || '').trim() || 'moo';
  const w = Math.min(msg.length + 2, COLS - 4);
  termPrint([
    ' ' + '_'.repeat(w),
    '<' + msg + ' '.repeat(Math.max(0, w - 2 - msg.length)) + '>',
    ' ' + '-'.repeat(w),
    '        \\   ^__^',
    '         \\  (oo)\\_______',
    '            (__)\\       )\\/\\',
    '                ||----w |',
    '                ||     ||',
    '',
  ]);
}

function cmdSudo(args) {
  const cmd = args.trim();
  if (cmd === 'reboot' || cmd === 'shutdown') {
    termAdd('sudo: Nice try.');
  } else if (cmd === 'rm -rf /') {
    termAdd('sudo: I don\'t think so.');
  } else if (cmd === 'su') {
    termAdd('sudo: You are already guest. Stay humble.');
  } else {
    termAdd('sudo: Permission denied. (' + cmd + ')');
  }
}

// ──────────────────────────────────
// Command dispatch
// ──────────────────────────────────

const exactCommands = {
  'clear': cmdClear,
  'help': cmdHelp,
  'whoami': cmdWhoami,
  'date': cmdDate,
  'line': cmdLine,
  'ls': cmdLs,
  'portfolio': cmdPortfolio,
  'reboot': cmdReboot,
  'breakout': cmdBreakout,
  'hostname': cmdHostname,
  'history': cmdHistory,
  'neofetch': cmdNeofetch,
  'cowsay': () => cmdCowsay(''),
  'rm -rf /': () => termAdd('nice try'),
};

const prefixCommands = [
  { prefix: 'fill ', handler: cmdFill },
  { prefix: 'cat ', handler: cmdCat },
  { prefix: 'echo ', handler: cmdEcho },
  { prefix: 'cowsay ', handler: cmdCowsay },
  { prefix: 'sudo ', handler: cmdSudo },
];

export function termExec(cmd) {
  if (!term.bootDone) return;
  termAdd(PROMPT + cmd);
  const c = cmd.trim();

  if (c === '') {
    term.input = '';
    return;
  }

  const exact = exactCommands[c];
  if (exact) {
    exact();
    term.input = '';
    return;
  }

  for (const { prefix, handler } of prefixCommands) {
    if (c.startsWith(prefix)) {
      handler(c.slice(prefix.length));
      term.input = '';
      return;
    }
  }

  termAdd('bash: ' + c + ': command not found');
  term.input = '';
}
