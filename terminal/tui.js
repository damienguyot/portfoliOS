import { ctx } from '../canvas.js';
import { screenTex } from '../scene.js';
import {
  COLS, FONT_SIZE, LINE_H, PAD_X, PAD_Y,
  VISIBLE, HOME_HOST, clamp, pad, center, charFill,
} from './utils.js';

// ──────────────────────────────────
// TUI state
// ──────────────────────────────────

export const tui = {
  active: false,
  page: 1,
  scrollY: 0,
  revealedLines: 0,
  totalLines: 0,
  animTimer: null,
};

export function isTUIActive() {
  return tui.active;
}

// ──────────────────────────────────
// Tab definitions
// ──────────────────────────────────

export const TABS = ['A propos', 'Technologies', 'Projets', 'Diplômes', 'Emplois', 'Contact'];
export const TABS_COUNT = TABS.length;
export const TUI_W = COLS;

const INDENT = '  ';
const DIV = charFill('─', 36);

const ASCII_NAME = [
  '  _____                  _               _____ _    ___     ______ _______ ',
  ' |  __ \\                (_)             / ____| |  | \\ \\   / / __ \\__   __|',
  ' | |  | | __ _ _ __ ___  _  ___ _ __   | |  __| |  | |\\ \\_/ / |  | | | |   ',
  ' | |  | |/ _` | \'_ ` _ \\| |/ _ \\ \'_ \\  | | |_ | |  | | \\   /| |  | | | |   ',
  ' | |__| | (_| | | | | | | |  __/ | | | | |__| | |__| |  | | | |__| | | |   ',
  ' |_____/ \\__,_|_| |_| |_|_|\\___|_| |_|  \\_____|\\____/   |_|  \\____/  |_|   ',
  '                                                                           ',
];

// ──────────────────────────────────
// Page data
// ──────────────────────────────────

export const tuiPages = {
  1: { rows: [
    { blank: 3 },
    { raw: ASCII_NAME },
    { blank: true },
    { center: 'Développeur informatique' },
    { blank: true },
    { divider: true },
    { blank: true },
    { center: "Passionné d'informatique depuis petit, je me suis vite " },
    { center: 'pris de passion pour le développement informatique. ' },
    { center: "Autodidacte, j'ai également un bon bagage en cyber-sécurité, " },
    { center: "en infrastructure réseau, ainsi qu'en analyse de données" },
    { blank: true },
    { divider: true },
    { blank: true },
    { center: 'github.com/damienguyot     damien@guyot.dev' },
  ]},
  2: { rows: [
    { blank: true },
    { header: 'LANGAGES LOGICIEL & SYSTEMES' },
    { items: ['Python', 'Go', 'C / C++ / C#', 'Java'] },
    { blank: true },
    { header: 'FRONTEND' },
    { items: ['React', 'Next.js', 'Three.js', 'WebGL'] },
    { items: ['Tailwind', 'Canvas', 'WebAssembly'] },
    { blank: true },
    { header: 'BACKEND & DB' },
    { items: ['PHP', 'Symfony', 'Node.js', 'Springboot', 'Ionic'] },
    { items: ['GraphQL', 'Redis', 'APIs REST', 'Microservices'] },
    { items: ['MySQL', 'MariaDB', 'MongoDB'] },
    { blank: true },
    { header: 'DEVOPS & INFRA' },
    { items: ['Docker', 'Kubernetes', 'Git', 'AWS', 'CI/CD'] },
    { items: ['Prometheus', 'Grafana', 'GitHub Actions', 'Jira'] },
    { blank: true },
    { header: "SYSTEMES D'EXPLOITATION" },
    { items: ['Linux', 'Ubuntu/Debian', 'Proxmox', 'Arch', 'NixOS'] },
    { items: ['Windows', 'macOS', 'Android', 'Windows Server'] },
    { blank: true },
    { header: 'MOTEURS DE JEU' },
    { items: ['Unity', 'Godot', 'Roblox Studio'] },
    { blank: true },
  ]},
  3: { rows: [
    { blank: true },
    { entry: { title: 'PORTFOLIOS', date: '2026', lines: [
      'Vous êtes dessus. Three.js, custom GLSL shaders, émulateur Linux,',
      'environment 3D à la première personne avec rendering style rétro-PS1.',
    ]}},
    { blank: true },
    { entry: { title: 'SKINVAULT', date: '2026', lines: [
      'Web app développé en Symfony, permettant de suivre l\'évolution',
      'du prix de ses skins Counter-Strike, en scrappant le prix sur plus',
      'de 10 plateformes d\'échanges différentes. Déploiement avec Docker.'
    ]}},
    { blank: true },
    { entry: { title: 'XTNIX (Python)', date: '2026', lines: [
      'Ré-écriture du projet xtnix (originellement en Bash), en Python.',
      'Meilleure performances, TUI avec usage en temps-réel, configuration',
      'par knob, execution de scripts externes. Bien plus stable et poli.',
    ]}},
    { blank: true },
    { entry: { title: 'SNEAKPEEK', date: '2025', lines: [
      'Web app de partage d\'images temporaires entièrement chiffré',
      '(zero-knowledge). Dashboard, Plateforme de paiement, Gestion',
      'des crédits, Support. Déploiement avec Docker.'
    ]}},
    { blank: true },
    { entry: { title: 'XTNIX', date: '2025', lines: [
      'Daemon Bash permettant d\'utiliser un controlleur MIDI afin de gérer',
      'ses sinks audios Pipewire sur Linux',
    ]}},
  ]},
  4: { rows: [
    { blank: true },
    { edu: ['Master Big Data, Dev et IA', '2021-2023', 'IPSSI', 'Paris, FR'] },
    { blank: true },
    { edu: ['Licence Générale Informatique', '2020-2021', 'CNAM', 'Amiens, FR'] },
    { blank: true },
    { edu: ['BTS SIO SLAM', '2018-2020', 'Lycée Saint-Vincent', 'Senlis, FR'] },
    { blank: true },
    { edu: ['BAC SEN', '2014-2017', 'Lycée Roberval', 'Breuil-le-Vert, FR'] },
  ]},
  5: { rows: [
    { blank: true },
    { entry: { title: 'Développeur Full-Stack', date: '2025-2025',
      subtitle: 'F1 Groupe', detail: 'Eguilles, FR', lines: [
      'Ré-écriture complète de la plateforme de ticketing interne.',
      'Création de librairies internes (Multi-auth 2FA), Test unitaires.',
      'Next.js, Symfony.',
    ]}},
    { blank: 2 },
    { entry: { title: 'Développeur Windev', date: '2024-2024',
      subtitle: 'T\'RHEA', detail: 'Saint-Martin-de-Crau, FR', lines: [
      'Développement d\'une application de gestion des colis sur PDO.',
      'Ré-écriture d\'un système d\'impression d\'étiquettes sur emballages.',
      'Maintenance préventive et corrective des applications et serveurs',
      'déjà en place. Windev & Webdev.',
    ]}},
    { blank: 2 },
    { entry: { title: 'Développeur Full-Stack', date: '2021-2023',
      subtitle: 'GROUPE CYLLENE', detail: 'Paris, FR', lines: [
      'Système SSO pour Biotech Dental, Maintenance curative pour NUXE.',
      'Formation Nuxt.js. Symfony.',
    ]}},
    { blank: 2 },
    { entry: { title: 'Développeur Full-Stack', date: '2020-2021',
      subtitle: 'AFTRAL SERVICES', detail: 'Monchy, FR', lines: [
      'Création d\'une plateforme interne, visant à enrichir la vie au',
      'sein de l\'entreprise. Maintenance sur la surcouche Android installée',
      'sur la tablette des formateurs. Symfony & Ionic.',
    ]}},
    { blank: 2 },
    { entry: { title: 'Stagiaire Développeur Full-Stack', date: '2019-2019',
      subtitle: 'Communauté de Communes du Clermontois', detail: 'Clermont, FR', lines: [
      'Développement d\'une appli web, servant à cataloguer le courrier entrant.',
      'Création d\'une application de gestion du service Urbanisme, permettant aux',
      'citoyens de prendre rendez-vous pour des permis de construire. PHP.',
    ]}},
  ]},
  6: { rows: [
    { blank: 9 },
    { center: 'Email: damien@guyot.dev' },
    { center: 'GitHub: github.com/damienguyot' },
    { center: 'LinkedIn: linkedin.com/in/damienguyot' },
    { blank: true },
    { divider: true },
    { blank: true },
    { center: 'Disponible pour freelance & opportunités à plein-temps' },
    { center: 'Basé en France - Remote-friendly' },
  ]},
};

// ──────────────────────────────────
// Content rendering
// ──────────────────────────────────

export function renderContent(rows, W) {
  const out = [];
  for (const row of rows) {
    if (row.blank) {
      const n = typeof row.blank === 'number' ? row.blank : 1;
      for (let i = 0; i < n; i++) out.push('');
    } else if (row.raw) {
      for (const line of row.raw) out.push(center(line, W));
    } else if (row.center) {
      out.push(center(row.center, W));
    } else if (row.header) {
      out.push(INDENT + center(row.header, W - 2));
      out.push(INDENT + center(DIV, W - 2));
    } else if (row.divider) {
      out.push(center(DIV, W - 2));
    } else if (row.items) {
      out.push(center(row.items.join('    '), W));
    } else if (row.entry) {
      const e = row.entry;
      out.push(INDENT + e.title + '    ' + pad(e.date, 10));
      if (e.subtitle) out.push(INDENT + e.subtitle + '    ' + pad(e.detail || '', 10));
      out.push(INDENT + charFill('-', W - 4));
      for (const line of e.lines) out.push(INDENT + line);
    } else if (row.edu) {
      const [title, date, school, loc] = row.edu;
      const CW = W - 6;
      out.push(INDENT + '┌' + charFill('─', CW) + '┐');
      out.push(INDENT + '│' + pad(' ' + title + '    ' + date, CW) + '│');
      out.push(INDENT + '│' + pad(' ' + school + '    ' + loc, CW) + '│');
      out.push(INDENT + '└' + charFill('─', CW) + '┘');
    }
  }
  return out;
}

// ──────────────────────────────────
// Typewriter animation
// ──────────────────────────────────

export function startLineAnim(total) {
  if (tui.animTimer) clearInterval(tui.animTimer);
  tui.revealedLines = 0;
  tui.totalLines = total;
  tui.scrollY = 0;
  tui.animTimer = setInterval(() => {
    tui.revealedLines++;
    drawTUI();
    if (tui.revealedLines >= total) {
      clearInterval(tui.animTimer);
      tui.animTimer = null;
    }
  }, 15);
}

export function skipLineAnim() {
  if (!tui.animTimer) return false;
  clearInterval(tui.animTimer);
  tui.animTimer = null;
  tui.revealedLines = tui.totalLines;
  drawTUI();
  return true;
}

// ──────────────────────────────────
// TUI drawing
// ──────────────────────────────────

export function drawTUI() {
  const page = tuiPages[tui.page];
  const W = TUI_W;

  let tabStr = '';
  for (let i = 0; i < TABS.length; i++) {
    if (i + 1 === tui.page) {
      tabStr += '╠ ' + TABS[i] + ' ╣';
    } else {
      tabStr += ' ' + TABS[i] + ' ';
    }
    if (i < TABS.length - 1) tabStr += ' ';
  }

  const midW = W - HOME_HOST.length;
  const topLine = pad(center(tabStr, midW), midW);

  const TOP   = '╔' + charFill('═', W) + '╗';
  const TITLE = '║' + pad(topLine, W) + '║';
  const BOT   = '╚' + charFill('═', W) + '╝';
  const CTRL  = '║' + pad('  ← → flèches: tabs   ↑ ↓ flèches: navigation    ^C : quitter', W) + '║';

  const finalTop = pad(topLine, W);
  const aStart = finalTop.indexOf('╠');
  const aEnd = finalTop.indexOf('╣');
  let bdiv = '╠';
  for (let i = 0; i < W; i++) {
    if (i === aStart) bdiv += '╝';
    else if (i === aEnd) bdiv += '╚';
    else if (i > aStart && i < aEnd) bdiv += ' ';
    else bdiv += '═';
  }
  bdiv += '╣';

  const fullContent = renderContent(page.rows, W);
  const content = tui.animTimer ? fullContent.slice(0, tui.revealedLines) : fullContent;
  const totalContent = content.length;
  const maxScroll = Math.max(0, totalContent - VISIBLE);
  if (tui.scrollY > maxScroll) tui.scrollY = maxScroll;
  if (tui.scrollY < 0) tui.scrollY = 0;

  const visibleContent = content.slice(tui.scrollY, tui.scrollY + VISIBLE);
  const hasOverflow = tui.totalLines > VISIBLE;
  const canScrollDown = tui.scrollY < maxScroll;
  const canScrollUp = tui.scrollY > 0;

  const lines = [TOP, TITLE, bdiv];
  if (hasOverflow && canScrollUp) {
    lines.push('║' + pad(center('▲', W), W) + '║');
  }
  for (const line of visibleContent) {
    lines.push('║' + pad(line, W) + '║');
  }
  if (hasOverflow && canScrollDown) {
    lines.push('║' + pad(center('▼', W), W) + '║');
  }
  const fillLines = Math.max(0, 30 - lines.length);
  for (let i = 0; i < fillLines; i++) {
    lines.push('║' + pad('', W) + '║');
  }
  const BDIV = '╠' + charFill('═', W) + '╣';
  lines.push(BDIV, CTRL, BOT);

  ctx.fillStyle = '#080808';
  ctx.fillRect(0, 0, 1024, 768);
  ctx.fillStyle = '#bbbbbb';
  ctx.font = FONT_SIZE + 'px "Courier New", monospace';

  const totalH = lines.length * LINE_H;
  const startY = Math.max(PAD_Y, (768 - totalH) / 2);

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], PAD_X, startY + (i + 1) * LINE_H);
  }

  ctx.fillStyle = 'rgba(0,0,0,0.04)';
  for (let sy = 0; sy < 768; sy += 3) ctx.fillRect(0, sy, 1024, 1);

  if (screenTex) screenTex.needsUpdate = true;
}
