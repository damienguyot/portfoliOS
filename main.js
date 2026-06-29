import * as THREE from './lib/three.module.js';
import { webglAvailable, scene, camera, renderer, screenLight, monitor, keyboard, woodTex, computeFOV, addTouchHint, touchHintScene, touchHintMat } from './scene.js';
import { composer, useComposer, pixelFisheyePass, updateScreenBounds } from './postprocessing.js';
import { term, drawTerminal } from './terminal/index.js';
import { playBoot, setBootWarning } from './terminal/boot.js';
import { setupKeyboard } from './terminal/input.js';

// ══════════════════════════════════
// Phone detection
// ══════════════════════════════════

const isPhone = /Mobi|Android/i.test(navigator.userAgent)
  || (navigator.maxTouchPoints > 0 && matchMedia('(pointer: coarse)').matches);
const isAndroid = /Android/i.test(navigator.userAgent);

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

function startPortfolio() {
  // ══════════════════════════════════
  // Terminal init
  // ══════════════════════════════════

  setupKeyboard();

  // ══════════════════════════════════
  // Touch gestures (mobile)
  // ══════════════════════════════════

  if (isPhone) {
    let tx = 0, ty = 0, tt = 0;
    let multi = false;
    const SWIPE = 30;

    function fire(key) {
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    }

    document.addEventListener('touchstart', (e) => {
      if (e.touches.length >= 2) {
        multi = true;
        e.preventDefault();
        fire('Escape');
        return;
      }
      multi = false;
      tx = e.touches[0].clientX;
      ty = e.touches[0].clientY;
      tt = Date.now();
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
      if (multi || e.touches.length > 0) return;
      e.preventDefault();
      const c = e.changedTouches[0];
      if (!c) return;
      const dx = c.clientX - tx;
      const dy = c.clientY - ty;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dt = Date.now() - tt;

      let key;
      if (dist < SWIPE && dt < 300) {
        key = ' ';
      } else if (Math.abs(dx) > Math.abs(dy)) {
        key = dx > 0 ? 'ArrowRight' : 'ArrowLeft';
      } else {
        key = dy > 0 ? 'ArrowDown' : 'ArrowUp';
      }
      fire(key);
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });

    if (keyboard) keyboard.addEventListener('loaded', addTouchHint, { once: true });
  }

  drawTerminal();
  playBoot();

  // ══════════════════════════════════
  // Render loop
  // ══════════════════════════════════

  if (!webglAvailable) {
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

      look.x += (look.tx - look.x) * 3 * dt;
      look.y += (look.ty - look.y) * 3 * dt;
      camera.rotation.y = look.x;
      camera.rotation.x = -0.18 + look.y;

      camera.position.y = 1.10 + Math.sin(t * 1.3) * 0.008;

      if (!term.printing) term.cursorTimer += dt;
      if (term.cursorTimer > 0.53) {
        term.cursorTimer = 0;
        term.cursorOn = !term.cursorOn;
        drawTerminal();
      }

      screenLight.intensity = 15 + Math.sin(t * 3.7) * 1.5 + Math.sin(t * 11.3) * 0.8;

      monitor.rotation.z = Math.sin(t * 0.7) * 0.003;
      monitor.rotation.x = Math.sin(t * 0.5) * 0.002;

      updateScreenBounds();

      if (useComposer && composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }

      if (touchHintScene && touchHintMat) {
        renderer.autoClear = false;
        renderer.render(touchHintScene, camera);
        renderer.autoClear = true;
        if (touchHintMat.opacity > 0.01) {
          touchHintMat.opacity -= dt * 0.2;
        } else if (touchHintMat.opacity > 0) {
          touchHintMat.opacity = 0;
        }
      }
    }

    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.fov = computeFOV(camera.aspect);
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.domElement.style.width = window.innerWidth + 'px';
      renderer.domElement.style.height = window.innerHeight + 'px';
      if (composer) {
        composer.setSize(renderer.domElement.width, renderer.domElement.height);
        pixelFisheyePass.uniforms.uTexSize.value.set(renderer.domElement.width, renderer.domElement.height);
      }
    });
  }
}

// ══════════════════════════════════
// Start — gate on phone interstitial
// ══════════════════════════════════

if (isPhone) {
  const interstitial = document.getElementById('phone-interstitial');
  if (!interstitial) { startPortfolio(); } else {
    const msg = interstitial.querySelector('.phone-msg');
    const btn = document.getElementById('phone-ack');

    if (isAndroid) {
      const extra = document.createElement('p');
      extra.textContent = 'Dû à certaines limitations techniques liés à Android, la qualité graphique à été ajustée.';
      extra.style.cssText = 'color:#777;font-size:13px;line-height:1.5;margin-bottom:32px;';
      msg.insertBefore(extra, btn);
    }

    msg.style.opacity = '0';
    msg.style.transition = 'opacity 0.8s ease';

    setTimeout(() => {
      interstitial.style.opacity = '1';
      interstitial.style.pointerEvents = 'all';
      msg.style.opacity = '1';
    }, 1000);

    btn.addEventListener('click', () => {
      interstitial.style.transition = 'opacity 1s ease';
      interstitial.style.opacity = '0';
      interstitial.style.pointerEvents = 'none';
      setTimeout(() => {
        interstitial.remove();
        startPortfolio();
      }, 1200);
    });
  }
} else {
  startPortfolio();
}
