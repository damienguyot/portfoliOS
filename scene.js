import * as THREE from './lib/three.module.js';
import { GLTFLoader } from './lib/GLTFLoader.js';
import { screenCanvas } from './canvas.js';

// ══════════════════════════════════
// Constants
// ══════════════════════════════════

// Room
const ROOM_WIDTH = 12;
const ROOM_HEIGHT = 4;
const ROOM_DEPTH = 3.5;

// Lighting
const AMBIENT_COLOR = 0x334455;
const AMBIENT_INTENSITY = 1.5;
const SCREEN_LIGHT_COLOR = 0xaaccff;
const SCREEN_LIGHT_INTENSITY = 15;
const SCREEN_LIGHT_DISTANCE = 3;
const LAMP_COLOR = 0xffaa66;
const LAMP_INTENSITY = 8;
const LAMP_DISTANCE = 4;
const FILL_COLOR = 0x446688;
const FILL_INTENSITY = 8;
const FILL_DISTANCE = 6;

// Desk
const DESK_WIDTH = 1.6;
const DESK_THICKNESS = 0.06;
const DESK_DEPTH = 0.8;
const LEG_SIZE = 0.06;
const LEG_HEIGHT = 0.75;

// CRT Monitor
const CRT_BODY_W = 0.65;
const CRT_BODY_H = 0.5;
const CRT_BODY_D = 0.5;
const CRT_BULGE_W = 0.5;
const CRT_BULGE_H = 0.42;
const CRT_BULGE_D = 0.28;
const BEZEL_W = 0.53;
const BEZEL_THICKNESS = 0.015;
const SCREEN_W = 0.49;
const SCREEN_H = 0.37;

// Renderer
const SHADOW_MAP_SIZE = 1024;
const NEAR_PLANE = 0.05;
const FAR_PLANE = 20;
const FOV = 90;

// ══════════════════════════════════
// WebGL setup
// ══════════════════════════════════

export let webglAvailable = true;
export let scene = null;
export let camera = null;
export let renderer = null;
export let screenLight = null;
export let monitor = null;
export let keyboard = null;
export let woodTex = null;
export let screenTex = null;
export let screenPlane = null;

try {
  // ── Renderer ──
  renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(1);
  renderer.domElement.style.width = window.innerWidth + 'px';
  renderer.domElement.style.height = window.innerHeight + 'px';
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  // ── Scene ──
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1a);
  scene.fog = new THREE.Fog(0x1a1a1a, 2, 15);

  // ── Camera ──
  camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, NEAR_PLANE, FAR_PLANE);
  camera.position.set(0, 1.10, 0.3);
  camera.rotation.order = 'YXZ';

  // ── Lighting ──
  scene.add(new THREE.AmbientLight(AMBIENT_COLOR, AMBIENT_INTENSITY));

  screenLight = new THREE.PointLight(SCREEN_LIGHT_COLOR, SCREEN_LIGHT_INTENSITY, SCREEN_LIGHT_DISTANCE, 1.5);
  screenLight.position.set(0, 1.25, -1.0);
  scene.add(screenLight);

  const lampLight = new THREE.PointLight(LAMP_COLOR, LAMP_INTENSITY, LAMP_DISTANCE, 2);
  lampLight.position.set(1.5, 1.8, 0.5);
  scene.add(lampLight);

  const fillLight = new THREE.PointLight(FILL_COLOR, FILL_INTENSITY, FILL_DISTANCE, 2);
  fillLight.position.set(-1, 2, -0.5);
  scene.add(fillLight);

  // ── Materials ──
  const textureLoader = new THREE.TextureLoader();
  woodTex = textureLoader.load(
    'textures/dark_wood_diff_1k.jpg',
    (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(3, 2);
      tex.minFilter = THREE.NearestFilter;
      tex.magFilter = THREE.NearestFilter;
    },
    undefined,
    () => {}
  );

  const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.9, metalness: 0.0, color: 0x888888 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x3a2210, roughness: 0.5, metalness: 0.05 });
  const darkPlastic = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.3, metalness: 0.2 });
  const bezelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.1 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.3, metalness: 0.9 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.95 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });

  // ── Room ──
  function buildWall(w, h, x, y, z, ry) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    m.receiveShadow = true;
    scene.add(m);
  }

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_WIDTH), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  floor.receiveShadow = true;
  scene.add(floor);

  buildWall(ROOM_WIDTH, ROOM_HEIGHT, 0, 2, -ROOM_DEPTH, 0);
  buildWall(ROOM_WIDTH, ROOM_HEIGHT, ROOM_DEPTH, 2, 0, -Math.PI / 2);
  buildWall(ROOM_WIDTH, ROOM_HEIGHT, -ROOM_DEPTH, 2, 0, Math.PI / 2);

  // ── Desk ──
  const deskGroup = new THREE.Group();
  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(DESK_WIDTH, DESK_THICKNESS, DESK_DEPTH), woodMat);
  deskTop.position.y = LEG_HEIGHT;
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  deskGroup.add(deskTop);

  for (const x of [-0.7, 0.7]) {
    for (const z of [-0.3, 0.3]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(LEG_SIZE, LEG_HEIGHT, LEG_SIZE), darkWoodMat);
      leg.position.set(x, LEG_HEIGHT / 2, z);
      leg.castShadow = true;
      deskGroup.add(leg);
    }
  }
  deskGroup.position.set(0, 0, -0.2);
  scene.add(deskGroup);

  // ── CRT Monitor ──
  monitor = new THREE.Group();

  const crtBody = new THREE.Mesh(
    new THREE.BoxGeometry(CRT_BODY_W, CRT_BODY_H, CRT_BODY_D), bezelMat
  );
  crtBody.position.z = -0.05;
  crtBody.castShadow = true;
  monitor.add(crtBody);

  const crtBulge = new THREE.Mesh(
    new THREE.BoxGeometry(CRT_BULGE_W, CRT_BULGE_H, CRT_BULGE_D), bezelMat
  );
  crtBulge.position.z = -0.36;
  crtBulge.castShadow = true;
  monitor.add(crtBulge);

  const bezel = new THREE.Mesh(
    new THREE.BoxGeometry(BEZEL_W, 0.41, BEZEL_THICKNESS),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.3 })
  );
  bezel.position.z = 0.22;
  monitor.add(bezel);

  // Screen (canvas texture)
  screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.minFilter = THREE.LinearFilter;
  screenTex.magFilter = THREE.LinearFilter;
  screenPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(SCREEN_W, SCREEN_H),
    new THREE.MeshBasicMaterial({ map: screenTex })
  );
  screenPlane.position.z = 0.23;
  monitor.add(screenPlane);

  // Monitor stand neck + base
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.15, 8), metalMat);
  neck.position.set(0, -0.27, -0.05);
  neck.castShadow = true;
  monitor.add(neck);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.04, 16), darkPlastic);
  base.position.set(0, -0.34, -0.05);
  base.castShadow = true;
  base.receiveShadow = true;
  monitor.add(base);

  monitor.position.set(0, 1.05, -0.20);
  scene.add(monitor);

  const standBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.30, 0.01, 16),
    new THREE.MeshBasicMaterial({ color: 0x1a1a1a })
  );
  standBase.position.set(0, 0.785, -0.25);
  standBase.receiveShadow = true;
  scene.add(standBase);

  // ── Keyboard ──
  keyboard = new THREE.Group();
  const gltfLoader = new GLTFLoader();
  gltfLoader.load('keyboard.glb',
    (gltf) => setupKeyboardModel(gltf.scene, keyboard),
    undefined,
    () => { keyboard.dispatchEvent({ type: 'loaded' }); }
  );
  keyboard.position.set(0, 0.82, 0.15);
  keyboard.rotation.x = -0.15;
  scene.add(keyboard);

} catch (e) {
  console.error('WebGL setup failed:', e);
  webglAvailable = false;
  scene = null;
  renderer = null;
  screenCanvas.id = 'term-fallback';
  screenCanvas.style.cssText = 'display:block;position:fixed;top:50%;left:50%;'
    + 'transform:translate(-50%,-50%);width:100vw;height:100vh;'
    + 'object-fit:contain;background:#080808;z-index:1;';
  document.body.appendChild(screenCanvas);
}

// ──────────────────────────────────
// Keyboard model loader
// ──────────────────────────────────

function setupKeyboardModel(model, group) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0.001) model.scale.setScalar(0.35 / maxDim);
  model.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    mats.forEach((mat) => {
      if (!mat) return;
      mat.map = null;
      mat.roughness = 1.0;
      mat.metalness = 0.0;
      mat.color.set(0x333333);
      mat.needsUpdate = true;
    });
  });
  group.add(model);
  group.dispatchEvent({ type: 'loaded' });
}
