# HOLO ARMOR LAB

A J.A.R.V.I.S.-inspired, **original** 3D holographic armor proof of concept made with Three.js, TypeScript, GSAP, and MediaPipe Hand Landmarker. This is a fan-inspired prototype, not an official Marvel product. No licensed movie assets are included.

## Features

- Original procedural AX-07 exosuit built with Three.js primitives; no external GLB asset required
- Orbit / drag and mouse-wheel zoom with OrbitControls
- Armor explosion and reassembly animations
- Toggleable cyan edge overlays and animated energy reactor
- Browser camera live preview with 21 hand landmarks drawn over the video
- Pinch thumb + index finger to rotate the model; release to stop
- Two hands farther apart / closer together to zoom
- Webcam-off fallback: full mouse / touch / button access
- Responsive dark cyan sci-fi HUD with live gesture and 3D telemetry

## Quick start

Requirements: Node.js >= 20.19, a current Chrome / Edge browser, and (for gestures) a webcam.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (typically http://localhost:5173). Camera access requires **localhost or HTTPS**. Click **CAMERA ON**, grant browser camera permission, and wait for MediaPipe WASM + the hand model to download. The video never needs to be uploaded to a server; processing happens locally in the browser, although model and library assets load from external CDNs.

## Controls

| Input | Behavior |
|---|---|
| Mouse drag / touch drag | Orbit the armor |
| Wheel / touch pinch | Camera zoom |
| One hand thumb+index pinch and move | Rotate armor |
| Two hands move apart / closer together | Scale armor |
| EXPLODE / ASSEMBLE | Separate / join armor modules |
| WIREFRAME | Toggle glowing edges |
| RESET | Reset model rotation, scale and component positions |
| CAMERA ON / OFF | Start or stop local hand tracking |

Gesture thresholds and smoothing are in `src/gesture.ts`. In live mode, hand recognition is throttled to approximately 20 FPS to leave time for Three.js rendering.

## Structure

```text
index.html
package.json
tsconfig.json
src/
  main.ts       # UI wiring, status, buttons
  scene.ts      # Three.js procedural robot, 3D renderer
  camera.ts     # MediaPipe + video lifecycle and landmarks
  gesture.ts    # Pure gesture state machine
  style.css     # sci-fi HUD and mobile layout
tests/
  gesture.test.mjs
```

## Verification

```bash
npm run build
npm test
```

The browser and webcam must be tested on a real machine. Source was submitted from a restricted environment without a full dependency-install/build run, so **do not consider the entire browser flow validated yet**.

## Known POC limitations

1. This is a stylized original robotic suit made of primitives, not a movie-quality Mark armor.
2. Hand tracking uses a regular webcam, not accurate 3D spatial hand tracking.
3. The hand model requires an internet connection on first load.
4. Hand signs may need thresholds tuned for camera angle and lighting.
5. Camera recognition may struggle with backlighting or occlusion.
6. Hand tracking is paused when the camera is disabled; mouse controls remain usable.

## Privacy

- The browser asks for camera permission before accessing video.
- Camera frames are processed locally by MediaPipe.
- Avoid logging, storing, or uploading camera frames.
- This demo contains no authentication, backend, or database.

## Roadmap

- Local build and on-device verification
- Improved gesture debounce / lost-hand timeout
- More detailed GLB/GLTF model with selectable parts
- Voice-assisted 3D commands
- Production deployment over HTTPS
