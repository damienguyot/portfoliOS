import { term, termAdd, drawTerminal } from './index.js';
import { COLS, center, ASCII_LOGO } from './utils.js';
import { tui, tuiPages, startLineAnim, renderContent, TUI_W } from './tui.js';

// ──────────────────────────────────
// Boot state
// ──────────────────────────────────

let bootIndex = 0;
let bootWarning = null;

export function setBootWarning(msg) {
  bootWarning = msg;
}

// ──────────────────────────────────
// Boot sequence data
// ──────────────────────────────────

const bootSequence = [
  ['', 2000],
  ['', 80],
  ...ASCII_LOGO.map(line => [line, 28]),
  ['', 80],
  ['            Version 6.1.0 LTS', 60],
  ['', 1000],
  ['__CLEAR__', 0],
  ['BIOS v2.10.8 (C) 2067 GUYOT Technologies', 18],
  ['Initializing hardware...', 18],
  ['CPU: AMD Ryzen 9 9950X3D (16 cores @ 4.5GHz)', 22],
  ['RAM: 65536MB DDR5-6000 (OK)', 18],
  ['NVMe: SAMSUNG 990 PRO 2TB (OK)', 18],
  ['GPU: NVIDIA GeForce RTX 4090 (OK)', 22],
  ['', 12],
  ['Booting from NVMe0 (PortfoliOS)', 30],
  ['Loading Linux 6.1.0-portfoliOS ...', 22],
  ['', 10],
  ['[    0.001] Booting Linux on physical CPU 0x0000', 10],
  ['[    0.002] Linux version 6.1.0-portfolio (gcc 13.2.0)', 10],
  ['[    0.008] Command line: BOOT_IMAGE=/vmlinuz quiet splash', 10],
  ['[    0.015] KERNEL supported cpus: Intel, AMD, Hygon', 10],
  ['[    0.022] x86/fpu: Supporting XSAVE feature 0x200', 10],
  ['[    0.031] BIOS-provided physical RAM map:', 10],
  ['[    0.038]   usable: 0x00000000 - 0x0009fc00', 10],
  ['[    0.045]   reserved: 0x0009fc00 - 0x000a0000', 10],
  ['[    0.052]   usable: 0x000e0000 - 0x01000000', 10],
  ['[    0.060] NX (Execute Disable) protection: active', 10],
  ['[    0.068] DMI: PortfolioOS / B650 AORUS ELITE AX', 10],
  ['[    0.080] ACPI: Early table checksum verification disabled', 10],
  ['[    0.090] ACPI: RSDP 0x00000000000F05B0 000024 (v02 ALASKA)', 10],
  ['[    0.100] ACPI: SSDT 0x00000000BF200000 0077F0 (v02 AMD B450)', 10],
  ['[    0.115] NR_IRQS: 524544, nr_irqs: 2048, preallocated irqs: 16', 10],
  ['[    0.130] Console: colour VGA+ 80x25', 10],
  ['[    0.140] printk: console enabled', 10],
  ['[    0.148] mem auto-init: stack:off, heap alloc:on, heap free:off', 10],
  ['[    0.160] Memory: 65472MB / 65536MB available (16384K kernel code)', 15],
  ['[    0.190] SLUB: HWalign=64, Order=0-3, MinObjects=0, CPUs=16, Nodes=1', 10],
  ['[    0.210] rcu: Hierarchical RCU implementation', 10],
  ['[    0.220] rcu: RCU restricting CPUs from NR_CPUS=8192 to nr_cpu_ids=16', 10],
  ['[    0.240] NR_IRQS: 524544, nr_irqs: 2048, preallocated irqs: 16', 10],
  ['[    0.260] Console: colour dummy device 80x25', 10],
  ['', 15],
  ['[  OK  ] Loaded kernel modules: 148', 30],
  ['[  OK  ] Started udev Coldplug all Devices', 25],
  ['[  OK  ] Started udev Kernel Device Manager', 22],
  ['[  OK  ] Mounted Kernel Configuration File System', 22],
  ['[  OK  ] Mounted FUSE Control File System', 22],
  ['[  OK  ] Mounted POSIX Message Queue File System', 22],
  ['[  OK  ] Mounted Huge Pages File System', 22],
  ['[  OK  ] Mounted Temporary Directory /tmp', 22],
  ['[  OK  ] Mounted /boot/efi', 22],
  ['[  OK  ] Reached target Local File Systems', 25],
  ['[  OK  ] Listening on udev Control Socket', 22],
  ['[  OK  ] Listening on udev Kernel Socket', 22],
  ['[  OK  ] Listening on Journal Socket', 22],
  ['[  OK  ] Starting Load Kernel Modules...', 30],
  ['[  OK  ] Started Load Kernel Modules', 22],
  ['[  OK  ] Started Remount Root and Kernel File Systems', 22],
  ['[  OK  ] Started Apply Kernel Variables', 22],
  ['[  OK  ] Started Create System Users', 22],
  ['', 12],
  ['[  OK  ] Found device SAMSUNG_MZVL22T0HBLB_2TB home', 30],
  ['[  OK  ] Mounted /home (ext4, noatime)', 30],
  ['[  OK  ] Starting File System Check on /dev/sda1...', 25],
  ['[  OK  ] Started File System Check on /dev/sda1', 22],
  ['[  OK  ] Mounted /mnt/data (ext4)', 22],
  ['', 12],
  ['[  OK  ] Starting Network Name Resolution...', 30],
  ['[  OK  ] Starting Network Time Synchronization...', 25],
  ['[  OK  ] Started Network Manager', 25],
  ['[  OK  ] Reached target Network', 22],
  ['[  OK  ] Reached target Network is Online', 22],
  ['         lo: 127.0.0.1/8 ::1/128', 30],
  ['         eth0: 192.168.1.42/24 (1 Gbps, full duplex)', 35],
  ['', 12],
  ['[  OK  ] Started D-Bus System Message Bus', 22],
  ['[  OK  ] Starting GPU Driver (nvidia 550.120)...', 33],
  ['[  OK  ] Started GPU Driver (nvidia 550.120)', 27],
  ['         CUDA 12.4 | Driver 550.120 | 24GB VRAM', 22],
  ['[  OK  ] Started Display Manager', 22],
  ['', 12],
  ['[  OK  ] Started OpenSSH Daemon (port 22)', 30],
  ['[  OK  ] Started Cron Daemon', 22],
  ['[  OK  ] Started Docker Engine (v25.0.3)', 27],
  ['[  OK  ] Container: portfolio-web (healthy)', 22],
  ['[  OK  ] Container: postgres (healthy)', 22],
  ['[  OK  ] Started PostgreSQL 16 (port 5432)', 27],
  ['[  OK  ] Started Redis Server (port 6379)', 22],
  ['[  OK  ] Started NGINX (port 80/443)', 22],
  ['[  OK  ] Started Node Exporter (port 9100)', 22],
  ['', 12],
  ['[  OK  ] Loading user profile (guest)', 38],
  ['[  OK  ] Reached target Multi-User System', 30],
  ['[  OK  ] Reached target Graphical Interface', 27],
  ['', 15],
  ['PortfoliOS 6.1.0 LTS (tty1)', 22],
  ['', 60],
  ['guest@portfoliOS login: guest', 90],
  ['', 45],
  ['Last login: ' + new Date().toLocaleString(), 30],
  ['', 22],
  ['  Welcome to PortfoliOS!', 22],
  ['  Type \'help\' to get started.', 18],
  ['', 150],
];

// ──────────────────────────────────
// Boot playback
// ──────────────────────────────────

function transitionToTUI() {
  term.bootDone = true;
  term.lines = [];
  tui.active = true;
  tui.page = 1;
  const p = tuiPages[1];
  startLineAnim(renderContent(p.rows, TUI_W).length);
}

export function playBoot() {
  if (bootIndex >= bootSequence.length) {
    term.bootDone = false;
    term.lines = [];
    drawTerminal();
    const sp = ['|', '/', '-', '\\'];
    let f = 0;
    const iv = setInterval(() => {
      term.lines = [
        '', '', '', '', '', '', '',
        '', '', '', '', '', '', '',
        center('Chargement du portfolio', COLS),
        '',
        center(sp[f % 4], COLS),
      ];
      if (bootWarning) {
        term.lines.push('');
        term.lines.push(center('[ WARN ] ' + bootWarning, COLS));
      }
      drawTerminal();
      f++;
    }, 80);
    setTimeout(() => {
      clearInterval(iv);
      transitionToTUI();
    }, 1500);
    return;
  }
  const [text, delay] = bootSequence[bootIndex];
  if (text === '__CLEAR__') {
    term.lines = [];
  } else {
    termAdd(text);
  }
  drawTerminal();
  bootIndex++;
  setTimeout(playBoot, delay);
}

export function resetBoot() {
  bootIndex = 0;
  term.bootDone = false;
  playBoot();
}
