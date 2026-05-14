import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ── Agents ────────────────────────────────────────────────────────────────────
const AGENTS = [
  { id: 'michelle', name: 'Michelle', role: 'Creative Director',   dept: 'Dirección Creativa',  color: '#c084fc', pos: [-2.5, 0,  1.2], room: [-6.5, 0, -4], model: 'models/characters/michelle_idle.glb' },
  { id: 'luna',     name: 'Luna',     role: 'Social Media Manager', dept: 'Marketing Digital',   color: '#f472b6', pos: [ 0.5, 0,  1.8], room: [-1.5, 0, -4], model: 'models/characters/sophie.glb' },
  { id: 'marco',    name: 'Marco',    role: 'Video Editor',         dept: 'Post Producción',     color: '#60a5fa', pos: [ 2.5, 0,  0.8], room: [ 3.5, 0, -4], model: 'models/characters/james.glb' },
  { id: 'alex',     name: 'Alex',     role: 'Colorista',            dept: 'Color / VFX',         color: '#34d399', pos: [-1.0, 0, -0.5], room: [-6.5, 0, -4], model: 'models/characters/xbot.glb' },
  { id: 'liam',     name: 'Liam',     role: 'Graphic Designer',     dept: 'Diseño',              color: '#fb923c', pos: [ 1.2, 0, -1.2], room: [-1.5, 0, -4], model: 'models/characters/liam.glb' },
  { id: 'maria',    name: 'María',    role: 'Finance Manager',      dept: 'Finanzas',            color: '#facc15', pos: [-3.5, 0,  0.2], room: [ 8.5, 0, -4], model: 'models/characters/maria.glb' },
  { id: 'diego',    name: 'Diego',    role: 'Developer',            dept: 'Tech',                color: '#38bdf8', pos: [ 3.8, 0, -0.2], room: [ 3.5, 0, -4], model: 'models/characters/bryce.glb' },
  { id: 'jasmine',  name: 'Jasmine',  role: 'Account Manager',      dept: 'Cuentas',             color: '#e879f9', pos: [ 0.0, 0,  2.8], room: [ 8.5, 0, -4], model: 'models/characters/jasmine.glb' },
];

// Camera views — calibrated from ZoeDepth analysis (MPS)
// floor_depth: 0.557, far_depth: 0.145 → beta ~1.2 (more top-down than assumed)
// Positions calibrated to agency-bg.jpg photo layout:
// Glass rooms = back-center, Bar = right-back, Ping pong = right-front, Lounge = left-front sofas
const VIEWS = {
  overview: { pos: [5,  18, 38],  target: [0,  5,  0]   }, // full space
  lounge:   { pos: [8,  12, 30],  target: [-8, 2,  12]  }, // sofas izquierda primer plano
  rooms:    { pos: [5,  10, 20],  target: [0,  6, -25]  }, // salas vidrio fondo centro
  bar:      { pos: [-5, 10, 22],  target: [18, 4,  -8]  }, // bar derecha-fondo
  pingpong: { pos: [-2, 10, 25],  target: [14, 2,   8]  }, // ping pong derecha
};

// ── Three.js setup ────────────────────────────────────────────────────────────
const container = document.getElementById('canvas-container');
const W = window.innerWidth, H = window.innerHeight;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(W, H);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.85;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 200);
camera.position.set(...VIEWS.overview.pos);

// OrbitControls — scroll, drag, touch
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 5;
controls.maxDistance = 70;
controls.maxPolarAngle = Math.PI / 1.8;  // allow looking slightly upward
controls.minPolarAngle = 0.1;
controls.update();

// Post-processing — bloom for neons
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.4, 0.6, 0.85);
composer.addPass(bloom);

// ── Background ────────────────────────────────────────────────────────────────
const loader = new THREE.TextureLoader();
setProgress(5, 'Cargando ambiente...');

// Safety fallback — always dismiss loading after 5s
setTimeout(() => dismissLoading(), 5000);

loader.load(
  'assets/agency-bg.jpg',
  tex => {
    // Wide photo (3168x1890) on sphere — 16:9 shows full space
    tex.repeat.set(1, 1);
    const bgGeo = new THREE.SphereGeometry(70, 64, 40);
    const bgMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide });
    const bg = new THREE.Mesh(bgGeo, bgMat);
    bg.rotation.y = 2.1;  // recalibrate for wider image
    bg.position.y = -6;
    scene.add(bg);
    setProgress(20, 'Construyendo espacio...');
    try { buildScene(); } catch(e) {
      console.error('buildScene error:', e);
      loadAgents(); // still load agents even if scene geometry fails
    }
  },
  undefined,
  err => {
    console.warn('Background image failed, continuing without it:', err);
    setProgress(20, 'Construyendo espacio...');
    try { buildScene(); } catch(e) { console.error('buildScene error:', e); loadAgents(); }
  }
);

// ── Lights — matching photo: warm string lights + neon rooms ──────────────────
function buildLights() {
  // Ambient — low, warm night
  scene.add(Object.assign(new THREE.AmbientLight(0xfff0d0, 0.4)));

  // Warm string lights (center overhead)
  const warm = new THREE.PointLight(0xffcc77, 3.5, 22);
  warm.position.set(0, 7, 1);
  warm.castShadow = true;
  scene.add(warm);

  // Hemisphere — sky warm / ground dark
  scene.add(new THREE.HemisphereLight(0xffe0a0, 0x111018, 0.5));

  // Neon room glows
  const neons = [
    { color: 0xb044ff, pos: [-6.5, 2, -3.5] }, // purple
    { color: 0x33dd66, pos: [-1.5, 2, -3.5] }, // green
    { color: 0x11ddee, pos: [ 3.5, 2, -3.5] }, // cyan
    { color: 0xd4a030, pos: [ 8.5, 2, -3.5] }, // gold
  ];
  neons.forEach(({ color, pos }) => {
    const l = new THREE.PointLight(color, 2.5, 10);
    l.position.set(...pos);
    scene.add(l);
  });

  // City glow from windows
  const city = new THREE.PointLight(0x4477ff, 1.2, 22);
  city.position.set(12, 5, -8);
  scene.add(city);

  // Bar spotlight
  const bar = new THREE.SpotLight(0xffcc55, 3, 12, Math.PI / 6, 0.4);
  bar.position.set(8.5, 7, -1.5);
  bar.target.position.set(8.5, 0, -1.5);
  scene.add(bar); scene.add(bar.target);
}

// ── Scene geometry — matches photo layout ─────────────────────────────────────
function buildScene() {
  buildLights();

  // Floor — invisible, only for shadow receiving
  const floorMat = new THREE.ShadowMaterial({ opacity: 0.15 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(36, 28), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // 4 Glass neon rooms (back wall)
  const rooms = [
    { x: -6.5, color: 0xb044ff, label: 'Creativa'    },
    { x: -1.5, color: 0x33dd66, label: 'Producción'  },
    { x:  3.5, color: 0x11ddee, label: 'Digital'     },
    { x:  8.5, color: 0xd4a030, label: 'Estrategia'  },
  ];
  rooms.forEach(r => buildRoom(r.x, r.color));

  // Central wooden table
  buildBox([-1, 0.38, 1.2], [3.5, 0.08, 1.5], 0x3d2008, 0.7, 0.1);

  // Sofas
  buildSofa(-4.5, 3.8,  0);
  buildSofa( 0.5, 3.2, Math.PI);
  buildSofa( 4.5, 3.8,  0);

  // Coffee table
  buildBox([2.8, 0.35, 3.5], [1.0, 0.05, 0.65], 0x3d2008, 0.7, 0.1);

  // Ping pong
  buildPingPong(5.5, 1.0);

  // Bar
  buildBar(8.5, -1.5);

  // Pillars
  [[-9,-7],[-9,5],[11,-7],[11,5]].forEach(([x,z]) => buildPillar(x,z));

  // String lights
  buildStringLights();

  setProgress(55, 'Cargando agentes...');
  loadAgents();
}

function buildRoom(x, neonColor) {
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: neonColor, transparent: true, opacity: 0.12,
    roughness: 0, metalness: 0, side: THREE.DoubleSide,
    emissive: neonColor, emissiveIntensity: 0.08,
  });
  // Front glass wall
  scene.add(Object.assign(
    new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.2), glassMat),
    { position: new THREE.Vector3(x, 1.6, -2.8) }
  ));
  // Side walls
  [-2.1, 2.1].forEach(dx => {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(4, 3.2), glassMat);
    side.position.set(x + dx, 1.6, -4.8);
    side.rotation.y = Math.PI / 2;
    scene.add(side);
  });
  // Neon frame — emissive bar top
  const neonMat = new THREE.MeshStandardMaterial({ color: neonColor, emissive: neonColor, emissiveIntensity: 2.5 });
  const topBar = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.06, 0.08), neonMat);
  topBar.position.set(x, 3.22, -2.8);
  scene.add(topBar);
  // Floor glow strip
  const strip = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.03, 0.1), neonMat);
  strip.position.set(x, 0.02, -2.75);
  scene.add(strip);
  // Desks inside
  buildBox([x - 1, 0.36, -5.5], [1.5, 0.06, 0.8], 0x111118, 0.9, 0.05);
  buildBox([x + 1, 0.36, -5.5], [1.5, 0.06, 0.8], 0x111118, 0.9, 0.05);
  // Monitor glow
  const monMat = new THREE.MeshStandardMaterial({ color: neonColor, emissive: neonColor, emissiveIntensity: 0.6, transparent: true, opacity: 0.8 });
  [x-1, x+1].forEach(mx => {
    const mon = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.03), monMat);
    mon.position.set(mx, 0.77, -5.8);
    scene.add(mon);
  });
}

function buildSofa(x, z, rotY) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.9, metalness: 0 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.32, 0.9), mat);
  seat.position.set(x, 0.33, z); seat.rotation.y = rotY; seat.castShadow = true;
  scene.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 0.22), mat);
  back.position.set(x, 0.72, z + (rotY ? -0.45 : 0.45)); back.rotation.y = rotY;
  scene.add(back);
}

function buildPingPong(x, z) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x0a5522, roughness: 0.8 });
  const table = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 2.8), mat);
  table.position.set(x, 0.75, z); table.castShadow = true; scene.add(table);
  const netMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, emissive: 0x555555, emissiveIntensity: 0.3 });
  const net = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.18, 0.03), netMat);
  net.position.set(x, 0.86, z); scene.add(net);
}

function buildBar(x, z) {
  // Counter
  buildBox([x, 0.5, z], [3.5, 1.0, 0.65], 0x1a0e06, 0.85, 0.05);
  // Gold top
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4b070, emissive: 0xd4b070, emissiveIntensity: 0.15, roughness: 0.3, metalness: 0.6 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.05, 0.7), goldMat);
  top.position.set(x, 1.03, z); scene.add(top);
  // Neon sign bar
  const signMat = new THREE.MeshStandardMaterial({ color: 0xd4b070, emissive: 0xd4b070, emissiveIntensity: 3 });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(2, 0.05, 0.05), signMat);
  sign.position.set(x, 2.1, z - 0.5); scene.add(sign);
  // Shelves + bottles
  [1.3, 1.75, 2.2].forEach((sy, si) => {
    buildBox([x, sy, z - 0.55], [2.8, 0.03, 0.28], 0x1a0e06, 0.85, 0.05);
    for (let b = 0; b < 5; b++) {
      const h = [0.8,0.5,0.3,0.9,0.6][b];
      const bottleMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(h*0.3, h*0.5, h*0.2), transparent: true, opacity: 0.7,
        roughness: 0.1, metalness: 0.1,
      });
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.26, 8), bottleMat);
      bottle.position.set(x - 1.1 + b * 0.55, sy + 0.16, z - 0.55);
      scene.add(bottle);
    }
  });
  // Stools
  for (let s = 0; s < 4; s++) {
    buildBox([x - 1.3 + s * 0.85, 0.36, z + 0.75], [0.36, 0.72, 0.36], 0x0d0d12, 0.85, 0.1);
  }
}

function buildPillar(x, z) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x111112, roughness: 0.9 });
  const p = new THREE.Mesh(new THREE.BoxGeometry(0.55, 6, 0.55), mat);
  p.position.set(x, 3, z); p.castShadow = true; scene.add(p);
  // Gold base
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xd4b070, emissive: 0xd4b070, emissiveIntensity: 0.4 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.03, 0.58), baseMat);
  base.position.set(x, 0.015, z); scene.add(base);
}

function buildStringLights() {
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffe080, emissive: 0xffe080, emissiveIntensity: 3 });
  for (let i = -10; i <= 10; i += 1.3) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), bulbMat);
    bulb.position.set(i, 5.2 - Math.abs(Math.sin(i * 0.5)) * 0.5, 1);
    scene.add(bulb);
  }
}

function buildBox([x,y,z], [w,h,d], color, rough=0.8, metal=0) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
  scene.add(mesh); return mesh;
}

// ── Agent loading ─────────────────────────────────────────────────────────────
const agentObjects = {};
const gltfLoader = new GLTFLoader();
let loadedCount = 0;

function dismissLoading() {
  setProgress(100, 'Listo');
  const el = document.getElementById('loading');
  if (el) el.classList.add('fade');
}

function loadAgents() {
  AGENTS.forEach(agent => {
    // Floor halo
    const haloMat = new THREE.MeshBasicMaterial({
      color: agent.color, transparent: true, opacity: 0.5, side: THREE.DoubleSide,
    });
    const halo = new THREE.Mesh(new THREE.CircleGeometry(0.38, 32), haloMat);
    halo.rotation.x = -Math.PI / 2;
    halo.position.set(agent.pos[0], 0.008, agent.pos[2]);
    scene.add(halo);

    // Placeholder — invisible dot on floor only
    const mat = new THREE.MeshStandardMaterial({
      color: agent.color, emissive: agent.color, emissiveIntensity: 0.6,
      roughness: 0.5, transparent: true, opacity: 0,
    });
    const cap = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.3, 6, 10), mat);
    cap.position.set(agent.pos[0], 0.87, agent.pos[2]);
    cap.userData = { agent };
    scene.add(cap);

    agentObjects[agent.id] = { mesh: cap, halo, agent, isMoving: false };

    // Try loading GLB
    gltfLoader.load(
      agent.model,
      gltf => {
        const root = gltf.scene;
        root.position.set(agent.pos[0], 0, agent.pos[2]);
        root.scale.setScalar(0.011);
        root.castShadow = true;
        root.traverse(c => { if (c.isMesh) { c.castShadow = true; c.userData = { agent }; } });
        scene.add(root);
        cap.visible = false;
        agentObjects[agent.id].mesh = root;
        if (gltf.animations?.length) {
          const mixer = new THREE.AnimationMixer(root);
          mixer.clipAction(gltf.animations[0]).play();
          agentObjects[agent.id].mixer = mixer;
        }
      },
      undefined,
      () => { /* keep placeholder */ }
    );

    loadedCount++;
    setProgress(55 + (loadedCount / AGENTS.length) * 40, `Cargando ${agent.name}...`);
  });

  setTimeout(() => dismissLoading(), 800);
}

// ── Interaction ───────────────────────────────────────────────────────────────
const raycaster = new THREE.Raycaster();
const pointer   = new THREE.Vector2();
const tooltip   = document.getElementById('tooltip');
let hoveredAgent = null;

function getAgentFromEvent(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;
  pointer.x =  ((clientX - rect.left) / rect.width)  * 2 - 1;
  pointer.y = -((clientY - rect.top)  / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(scene.children, true);
  for (const h of hits) {
    let obj = h.object;
    while (obj) {
      if (obj.userData?.agent) return obj.userData.agent;
      obj = obj.parent;
    }
  }
  return null;
}

renderer.domElement.addEventListener('mousemove', e => {
  const agent = getAgentFromEvent(e);
  if (agent) {
    tooltip.style.display = 'block';
    tooltip.style.left = (e.clientX + 16) + 'px';
    tooltip.style.top  = (e.clientY - 10) + 'px';
    tooltip.textContent = `${agent.name} · ${agent.role}`;
    renderer.domElement.style.cursor = 'pointer';
  } else {
    tooltip.style.display = 'none';
    renderer.domElement.style.cursor = '';
  }
});

renderer.domElement.addEventListener('click', e => {
  const agent = getAgentFromEvent(e);
  if (agent) openPanel(agent);
});

renderer.domElement.addEventListener('touchend', e => {
  const agent = getAgentFromEvent(e);
  if (agent) openPanel(agent);
}, { passive: true });

// ── Panel ─────────────────────────────────────────────────────────────────────
let activeAgentId = null;

function openPanel(agent) {
  activeAgentId = agent.id;
  document.getElementById('panel-dept').textContent = agent.dept;
  document.getElementById('panel-name').textContent = agent.name;
  document.getElementById('panel-role').textContent = agent.role;
  document.getElementById('panel-bio').textContent  =
    agent.bio || `Agente activo en el departamento de ${agent.dept}.`;
  const btn = document.getElementById('panel-move-btn');
  btn.textContent = '→ Ir a sala';
  btn.style.opacity = '1';
  btn.onclick = () => moveToRoom(agent);
  document.getElementById('agent-panel').classList.add('open');

  // Smooth camera focus
  const pos = agentObjects[agent.id].mesh.position;
  animateCameraTo(
    [pos.x + 4, 8, pos.z + 6],
    [pos.x, 0, pos.z],
    1.2
  );
}

window.closePanel = () => {
  document.getElementById('agent-panel').classList.remove('open');
  activeAgentId = null;
};

// ── Movement ──────────────────────────────────────────────────────────────────
function moveToRoom(agent) {
  const data = agentObjects[agent.id];
  if (data.isMoving) return;
  data.isMoving = true;

  const btn = document.getElementById('panel-move-btn');
  btn.textContent = 'Caminando...';
  btn.style.opacity = '0.5';

  const target = new THREE.Vector3(
    agent.room[0] + (Math.random() - 0.5) * 0.6,
    0,
    agent.room[2] + 0.8
  );

  const mesh  = data.mesh;
  const halo  = data.halo;
  const start = mesh.position.clone();
  const dur   = 2.2; // seconds
  let elapsed = 0;

  // Face direction
  const dir = target.clone().sub(start).normalize();
  if (dir.length() > 0.01) mesh.rotation.y = Math.atan2(dir.x, dir.z);

  const onFrame = (delta) => {
    elapsed += delta;
    const t    = Math.min(elapsed / dur, 1);
    const ease = t < 0.5 ? 2*t*t : -1 + (4-2*t)*t;
    mesh.position.lerpVectors(start, target, ease);
    mesh.position.y = Math.abs(Math.sin(elapsed * 6)) * 0.06; // walk bob
    halo.position.x = mesh.position.x;
    halo.position.z = mesh.position.z;
    if (t >= 1) {
      mesh.position.y = 0;
      data.isMoving = false;
      data._onFrame = null;
      btn.textContent = '✓ En sala';
      btn.style.opacity = '1';
      animateCameraTo(
        [agent.room[0], 8, agent.room[2] + 8],
        [agent.room[0], 0, agent.room[2]],
        1.5
      );
    }
  };
  data._onFrame = onFrame;
}

// ── Camera animation ──────────────────────────────────────────────────────────
let camAnim = null;

function animateCameraTo(toPos, toTarget, dur = 1.6) {
  const fromPos    = camera.position.clone();
  const fromTarget = controls.target.clone();
  const tPos    = new THREE.Vector3(...toPos);
  const tTarget = new THREE.Vector3(...toTarget);
  let elapsed = 0;
  camAnim = { fromPos, fromTarget, tPos, tTarget, dur, elapsed };
}

window.gotoView = (name, btn) => {
  const v = VIEWS[name]; if (!v) return;
  animateCameraTo(v.pos, v.target, 1.6);
  document.querySelectorAll('.hud-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
};

// ── Render loop ───────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  // Agent movement
  Object.values(agentObjects).forEach(d => { if (d._onFrame) d._onFrame(delta); });

  // Animation mixers
  Object.values(agentObjects).forEach(d => { if (d.mixer) d.mixer.update(delta); });

  // Camera animation
  if (camAnim) {
    camAnim.elapsed += delta;
    const t = Math.min(camAnim.elapsed / camAnim.dur, 1);
    const e = t < 0.5 ? 2*t*t : -1 + (4-2*t)*t;
    camera.position.lerpVectors(camAnim.fromPos, camAnim.tPos, e);
    controls.target.lerpVectors(camAnim.fromTarget, camAnim.tTarget, e);
    if (t >= 1) camAnim = null;
  }

  controls.update();
  composer.render();
}

animate();

// ── Resize ────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
});

// ── Utils ─────────────────────────────────────────────────────────────────────
function setProgress(pct, label) {
  document.getElementById('load-bar').style.width   = pct + '%';
  document.getElementById('load-label').textContent = label || '';
}
