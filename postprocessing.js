import * as THREE from './lib/three.module.js';
import { EffectComposer } from './lib/EffectComposer.js';
import { RenderPass } from './lib/RenderPass.js';
import { ShaderPass } from './lib/ShaderPass.js';
import { scene, camera, renderer, screenPlane } from './scene.js';

// ══════════════════════════════════
// Constants
// ══════════════════════════════════

const FISHEYE_DISTORTION = 0.3;
const PIXEL_SIZE = 3.0;
const SCREEN_W = 0.49;
const SCREEN_H = 0.37;

// ══════════════════════════════════
// Effect composer setup
// ══════════════════════════════════

export let composer = null;
export let useComposer = false;
export let pixelFisheyePass = null;

try {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  pixelFisheyePass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uDistortion: { value: FISHEYE_DISTORTION },
      uPixelSize: { value: PIXEL_SIZE },
      uTexSize: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uScreenMin: { value: new THREE.Vector2(0, 0) },
      uScreenMax: { value: new THREE.Vector2(1, 1) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform sampler2D tDiffuse;
      uniform float uDistortion;
      uniform float uPixelSize;
      uniform vec2 uTexSize;
      uniform vec2 uScreenMin;
      uniform vec2 uScreenMax;
      varying vec2 vUv;

      void main() {
        vec2 centered = vUv - 0.5;
        float r = length(centered);
        float r2 = r * r;
        float factor = 1.0 + uDistortion * r2;
        vec2 distorted = 0.5 + centered * factor;

        if (distorted.x < 0.0 || distorted.x > 1.0 || distorted.y < 0.0 || distorted.y > 1.0) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          return;
        }

        vec2 sampleUV = distorted;
        vec2 pixelUV = floor(distorted * uTexSize / uPixelSize) * uPixelSize / uTexSize + (0.5 / uTexSize);

        vec2 edgeDist = min(distorted - uScreenMin, uScreenMax - distorted);
        float d = min(edgeDist.x, edgeDist.y);
        float blendW = 2.0 / max(uTexSize.x, uTexSize.y);
        float blend = smoothstep(0.0, blendW, d);

        gl_FragColor = texture2D(tDiffuse, mix(pixelUV, sampleUV, blend));
      }
    `,
  });
  pixelFisheyePass.renderToScreen = true;
  composer.addPass(pixelFisheyePass);
  composer.setSize(renderer.domElement.width, renderer.domElement.height);
  useComposer = true;
} catch (e) {
  console.error(e);
}

// ══════════════════════════════════
// Dynamic screen bounds for CRT mask
// ══════════════════════════════════

export function updateScreenBounds() {
  if (!useComposer || !screenPlane) return;

  const halfW = SCREEN_W / 2;
  const halfH = SCREEN_H / 2;
  const corners = [
    new THREE.Vector3(-halfW,  halfH, 0),
    new THREE.Vector3( halfW,  halfH, 0),
    new THREE.Vector3( halfW, -halfH, 0),
    new THREE.Vector3(-halfW, -halfH, 0),
  ];

  let minU = 1, maxU = 0, minV = 1, maxV = 0;
  corners.forEach((c) => {
    screenPlane.localToWorld(c);
    c.project(camera);
    const u = c.x * 0.5 + 0.5;
    const v = c.y * 0.5 + 0.5;
    if (u < minU) minU = u;
    if (u > maxU) maxU = u;
    if (v < minV) minV = v;
    if (v > maxV) maxV = v;
  });

  pixelFisheyePass.uniforms.uScreenMin.value.set(minU, minV);
  pixelFisheyePass.uniforms.uScreenMax.value.set(maxU, maxV);
}
