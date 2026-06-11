import * as THREE from './lib/three.module.js';
import { webglAvailable, scene, camera, renderer, screenLight, monitor, keyboard, woodTex } from './scene.js';
import { composer, useComposer, pixelFisheyePass, updateScreenBounds } from './postprocessing.js';
import { term, drawTerminal } from './terminal/index.js';
import { playBoot, setBootWarning } from './terminal/boot.js';
import { setupKeyboard } from './terminal/input.js';

// ══════════════════════════════════
// Hardware acceleration warning
// ══════════════════════════════════

if (!webglAvailable) {
  const warn = document.createElement('div');
  warn.id = 'hw-warning';
  warn.style.cssText = 'position:fixed;bottom:0;left:0;width:100%;background:#d0d0d0;color:#000;'
    + 'text-align:center;padding:10px 20px;font:14px "Courier New",monospace;'
    + 'z-index:100;';
  warn.textContent = '[ Avertissement ] Acceleration materielle indisponible — mode terminal uniquement. Pour une experience optimale, activez l\'accéleration matérielle.';
  document.body.appendChild(warn);
  setBootWarning('GPU/WebGL indisponible. Mode terminal uniquement.');
}

// ══════════════════════════════════
// Asset loading
// ══════════════════════════════════

const loaderEl = document.getElementById('loader');
let assetsLoaded = 0;
const ASSETS_NEEDED = webglAvailable ? 3 : 1;

function assetReady() {
  assetsLoaded++;
  if (assetsLoaded >= ASSETS_NEEDED) {
    setTimeout(() => {
      loaderEl.classList.add('fade');
      setTimeout(() => loaderEl.remove(), 2000);
    }, 800);
  }
}

function pollWoodTexture() {
  if (woodTex.image && woodTex.image.complete && woodTex.image.naturalWidth > 0) {
    assetReady();
  } else {
    setTimeout(pollWoodTexture, 100);
  }
}

if (webglAvailable) {
  pollWoodTexture();

  keyboard.addEventListener('loaded', () => { assetReady(); }, { once: true });

  if (useComposer) assetReady();
  else setTimeout(assetReady, 100);
} else {
  setTimeout(assetReady, 100);
}

// ══════════════════════════════════
// Terminal init
// ══════════════════════════════════

setupKeyboard();
drawTerminal();
playBoot();

// ══════════════════════════════════
// Render loop
// ══════════════════════════════════

if (!webglAvailable) {
  // Fallback: cursor blink on 2D canvas without 3D loop
  function blinkLoop() {
    requestAnimationFrame(blinkLoop);
    if (!term.printing) term.cursorTimer += 0.016;
    if (term.cursorTimer > 0.53) {
      term.cursorTimer = 0;
      term.cursorOn = !term.cursorOn;
      drawTerminal();
    }
  }
  blinkLoop();
} else {
  const clock = new THREE.Clock();
  const look = { tx: 0, ty: 0, x: 0, y: 0 };

  window.addEventListener('mousemove', (e) => {
    look.tx = -(e.clientX / window.innerWidth - 0.5) * 0.3;
    look.ty = -(e.clientY / window.innerHeight - 0.5) * 0.18;
  });

  function animate() {
    requestAnimationFrame(animate);

    const dt = Math.min(clock.getDelta(), 0.1);
    const t = performance.now() * 0.001;

    // Smooth camera follow
    look.x += (look.tx - look.x) * 3 * dt;
    look.y += (look.ty - look.y) * 3 * dt;
    camera.rotation.y = look.x;
    camera.rotation.x = -0.18 + look.y;

    // Subtle camera bob
    camera.position.y = 1.10 + Math.sin(t * 1.3) * 0.008;

    // Cursor blink (skip while printing)
    if (!term.printing) term.cursorTimer += dt;
    if (term.cursorTimer > 0.53) {
      term.cursorTimer = 0;
      term.cursorOn = !term.cursorOn;
      drawTerminal();
    }

    // Screen flicker
    screenLight.intensity = 15 + Math.sin(t * 3.7) * 1.5 + Math.sin(t * 11.3) * 0.8;

    // Monitor micro-movements
    monitor.rotation.z = Math.sin(t * 0.7) * 0.003;
    monitor.rotation.x = Math.sin(t * 0.5) * 0.002;

    updateScreenBounds();

    if (useComposer && composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }

  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.width = window.innerWidth + 'px';
    renderer.domElement.style.height = window.innerHeight + 'px';
    if (composer) {
      composer.setSize(window.innerWidth, window.innerHeight);
      pixelFisheyePass.uniforms.uTexSize.value.set(window.innerWidth, window.innerHeight);
    }
  });
}
