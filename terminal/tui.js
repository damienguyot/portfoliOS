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
  selectedProject: 0,
  projectDetail: null,
};

export function isTUIActive() {
  return tui.active;
}

function getProjectEntries() {
  return tuiPages[3].rows.filter(r => r.entry).map(r => r.entry);
}

function wrapText(text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const trial = cur ? cur + ' ' + w : w;
    if (trial.length > maxW) { lines.push(cur); cur = w; }
    else { cur = trial; }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

function buildSection(title, body, W) {
  const boxW = W - 4;
  const innerW = boxW - 4;
  const top = '  ┌─' + title + ' ' + charFill('─', boxW - 4 - title.length) + '┐';
  const lines = [top];
  for (const raw of (Array.isArray(body) ? body : wrapText(body, innerW))) {
    lines.push('  │ ' + pad(raw, innerW) + ' │');
  }
  lines.push('  └' + charFill('─', boxW - 2) + '┘');
  return lines;
}

export function buildProjectDetailContent(W) {
  const entries = getProjectEntries();
  const p = entries[tui.projectDetail];
  if (!p) return [];

  const out = [];
  out.push('');
  out.push(center(p.title, W - 2));
  out.push(center(p.date + (p.duration ? '  ·  ' + p.duration : ''), W - 2));
  out.push(center(charFill('═', Math.min(p.title.length + 10, 40)), W - 2));
  out.push('');

  const stackLine = p.stack.join('  │  ');
  out.push(...buildSection('STACK', stackLine, W));
  out.push('');

  out.push(...buildSection('PROBLÈME', p.problem, W));
  out.push('');

  out.push(...buildSection('APPROCHE', p.approach, W));
  out.push('');

  const src = p.source
    ? p.source
    : 'Disponible sur demande';
  out.push(...buildSection('CODE SOURCE', src, W));
  out.push('');

  return out;
}

// ──────────────────────────────────
// Tab definitions
// ──────────────────────────────────

export const TABS = ['A propos', 'Technologies', 'Projets', 'Diplômes', 'Emplois', 'Contact'];
export const TABS_COUNT = TABS.length;
export const TUI_W = COLS;

const INDENT = '  ';
const ENTRY_INDENT = '    ';
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
    { entry: { title: 'PORTFOLIOS', date: '2026', duration: '2 semaines',
      stack: ['Three.js', 'GLSL', 'Canvas 2D', 'Vanilla JS'],
      problem: 'Créer un portfolio qui se démarque, sans frameworks lourds ni dépendances NPM.',
      approach: 'Scène 3D immersive avec Three.js. Émulateur de terminal Linux complet rendu sur Canvas 2D, utilisé comme texture sur un écran CRT modélisé. Shaders GLSL custom pour la distortion CRT (fisheye + pixelation). Architecture vanilla JS avec modules ES6, zéro build step.',
      source: 'https://github.com/damienguyot/portfoliOS',
      lines: ['Vous êtes dessus. Three.js, custom GLSL shaders, émulateur Linux,', 'environment 3D à la première personne avec rendering style rétro-PS1.'] }},
    { blank: true },
    { entry: { title: 'SKINVAULT', date: '2026', duration: '3 semaines',
      stack: ['Symfony', 'PHP', 'Docker', 'MySQL', 'Twig'],
      problem: 'Les sites de suivi d\'inventaire Counter-Strike se contentent d\'une estimation globale. Je voulais une plateforme capable de suivre l\'évolution des prix et d\'enregistrer les prix d\'achat de chaque skin, pour avoir un vrai suivi de portefeuille.',
      approach: 'Plateforme de suivi qui traite chaque skin comme un actif financier : tendances de prix, graphiques de fluctuation, suivi du ROI par skin. Scraping multi-plateformes (10+ marketplaces) pour détecter les écarts et opportunités d\'arbitrage. Déploiement Docker.',
      source: null,
      lines: ['Web app Symfony, scraping du prix des skins CS2 sur 10+', 'plateformes. Suivi de portefeuille, graphiques. Docker.'] }},
    { blank: true },
    { entry: { title: 'MIDIX', date: '2026', duration: '2 semaines',
      stack: ['Python', 'ALSA', 'Pipewire', 'MIDI', 'Linux'],
      problem: 'Le projet xtnix en Bash était lent et instable pour le contrôle MIDI des sinks audio Pipewire. Besoin d\'une solution performante et maintenable.',
      approach: 'Ré-écriture complète en Python avec TUI interactive (curses). Configuration par knob MIDI en temps réel. Exécution de scripts externes pour extensibilité. Architecture modulaire.',
      source: 'https://github.com/damienguyot/midix',
      lines: ['Ré-écriture de xtnix (Bash) en Python. TUI, usage temps-réel,', 'configuration par knob, scripts externes. Plus stable et performant.'] }},
    { blank: true },
    { entry: { title: 'SNEAKPEEK', date: '2025', duration: '4 semaines',
      stack: ['Symfony', 'PHP', 'Docker', 'MySQL', 'Redis'],
      problem: 'Je voulais explorer la complexité du chiffrement côté client et la validation de contenu avant upload, sans jamais exposer les données en clair au serveur.',
      approach: 'Chiffrement AES-256-CBC côté client via Web Crypto API (PBKDF2, IV unique). Le serveur ne voit jamais le contenu en clair ni la clé. Rôles hiérarchisés par quotas d\'upload et taille de fichier. URLs inforçables (8 caractères hex). Expiration configurable de 5 minutes à 99 ans, nettoyage automatique. Drag-and-drop et paste-to-upload. Déploiement Docker avec supervision Prometheus/Grafana.',
      source: null,
      lines: ['Web app de partage d\'images chiffré (zero-knowledge). Dashboard,', 'gestion des crédits. Docker.'] }},
    { blank: true },
    { entry: { title: 'XTNIX', date: '2025', duration: '1 semaine',
      stack: ['Bash', 'Pipewire', 'ALSA', 'MIDI', 'Linux'],
      problem: 'Impossible de contrôler finement les sinks audio Pipewire avec un contrôleur MIDI physique sous Linux. Aucune solution existante.',
      approach: 'Daemon Bash léger écoutant les événements MIDI via ALSA. Mapping configurable contrôleurs MIDI → propriétés des sinks Pipewire (volume, mute, routing). Scripts d\'initialisation systemd pour démarrage automatique.',
      source: 'https://github.com/damienguyot/xtnix',
      lines: ['Daemon Bash permettant d\'utiliser un contrôleur MIDI pour gérer', 'les sinks audio Pipewire sur Linux.'] }},
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

export function renderContent(rows, W, selEntry = -1, compact = false) {
  const out = [];
  let entryIdx = 0;
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
      const marker = entryIdx === selEntry ? '  > ' : ENTRY_INDENT;
      out.push(marker + e.title + '    ' + pad(e.date, 10));
      if (e.subtitle) out.push(ENTRY_INDENT + e.subtitle + '    ' + pad(e.detail || '', 10));
      if (!compact) {
        out.push(ENTRY_INDENT + charFill('-', W - 6));
        for (const line of e.lines) out.push(ENTRY_INDENT + line);
      }
      entryIdx++;
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

export function getEntryLineIndex(rows, W, targetEntry, compact = false) {
  let line = 0;
  let entry = 0;
  for (const row of rows) {
    if (row.blank) {
      line += typeof row.blank === 'number' ? row.blank : 1;
    } else if (row.raw) {
      line += row.raw.length;
    } else if (row.center || row.divider) {
      line += 1;
    } else if (row.header) {
      line += 2;
    } else if (row.items) {
      line += 1;
    } else if (row.entry) {
      if (entry === targetEntry) return line;
      line += 1; // title
      if (row.entry.subtitle) line += 1;
      if (!compact) {
        line += 1; // divider
        line += row.entry.lines.length;
      }
      entry++;
    } else if (row.edu) {
      line += 4;
    }
  }
  return -1;
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
  const isProjectDetail = tui.page === 3 && tui.projectDetail !== null;
  const isProjectList = tui.page === 3 && tui.projectDetail === null;

  const BOT   = '╚' + charFill('═', W) + '╝';
  const hint = isProjectDetail
    ? (getProjectEntries()[tui.projectDetail] || {}).source
      ? '  ← → : onglets   ↑ ↓ : navigation   Espace : code source   Echap : retour'
      : '  ← → : onglets   ↑ ↓ : navigation   Espace / Echap : retour'
    : isProjectList
      ? '  ← → : onglets   ↑ ↓ : selection   Espace : details    ^C : quitter'
      : '  ← → : onglets   ↑ ↓ : navigation    ^C : quitter';
  const CTRL  = '║' + pad(hint, W) + '║';

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

  const fullContent = isProjectDetail
    ? buildProjectDetailContent(W)
    : renderContent(page.rows, W, isProjectList ? tui.selectedProject : -1, isProjectList);
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
