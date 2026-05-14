// PVB Virtual Tour — Matterport-style pan/zoom
// Pure JS, no libraries, no deformation

// ── Agent data — positions as % of image (x%, y%) ─────────────────────────
// Calibrated to agency-bg-wide.jpg (3168×1890)
const AGENTS = [
  // ── Líderes — salas privadas ──
  { id:'michelle', name:'Michelle', role:'Creative Director',    dept:'Dirección Creativa', color:'#c084fc', px:21, py:54, leader:true  },
  { id:'alex',     name:'Alex',     role:'Director de Color',    dept:'Color / VFX',        color:'#34d399', px:49, py:50, leader:true  },
  { id:'diego',    name:'Diego',    role:'Tech Lead',            dept:'Tech',               color:'#22d3ee', px:63, py:50, leader:true  },
  // ── Equipo — áreas comunes ──
  { id:'maria',    name:'María',    role:'Finance Manager',      dept:'Finanzas',           color:'#facc15', px:7,  py:63, leader:false },
  { id:'luna',     name:'Luna',     role:'Social Media Manager', dept:'Marketing Digital',  color:'#f472b6', px:33, py:70, leader:false },
  { id:'marco',    name:'Marco',    role:'Video Editor',         dept:'Post Producción',    color:'#60a5fa', px:43, py:62, leader:false },
  { id:'jasmine',  name:'Jasmine',  role:'Account Manager',      dept:'Cuentas',            color:'#e879f9', px:72, py:64, leader:false },
  { id:'liam',     name:'Liam',     role:'Graphic Designer',     dept:'Diseño',             color:'#fb923c', px:83, py:58, leader:false },
];

// ── State ──────────────────────────────────────────────────────────────────
const viewport = document.getElementById('viewport');
const scene    = document.getElementById('scene');
const img      = document.getElementById('bg-img');
const tooltip  = document.getElementById('tooltip');
const mmVP     = document.getElementById('minimap-viewport');

let imgW = 0, imgH = 0;
let scale = 1, minScale = 0.3, maxScale = 4;
let tx = 0, ty = 0;
let dragging = false, lastX = 0, lastY = 0;
let activeAgent = null;

// ── Init after image loads ─────────────────────────────────────────────────
img.addEventListener('load', () => {
  imgW = img.naturalWidth;
  imgH = img.naturalHeight;
  scene.style.width  = imgW + 'px';
  scene.style.height = imgH + 'px';
  spawnPins();
  resetView();
});
if (img.complete) img.dispatchEvent(new Event('load'));

// ── Fit image to viewport on load / resize ────────────────────────────────
function resetView() {
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  scale    = Math.min(vw / imgW, vh / imgH) * 0.92;
  minScale = scale * 0.5;
  tx = (vw - imgW * scale) / 2;
  ty = (vh - imgH * scale) / 2;
  applyTransform(true);
}

window.resetView = resetView;
window.addEventListener('resize', resetView);

// ── Transform ─────────────────────────────────────────────────────────────
function applyTransform(animate) {
  if (animate) {
    scene.style.transition = 'transform 0.35s cubic-bezier(0.4,0,0.2,1)';
    setTimeout(() => scene.style.transition = '', 380);
  } else {
    scene.style.transition = '';
  }
  scene.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  updateMinimap();
}

function clampTranslation() {
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const sw = imgW * scale, sh = imgH * scale;
  const pad = 80;
  tx = Math.min(pad, Math.max(vw - sw - pad, tx));
  ty = Math.min(pad, Math.max(vh - sh - pad, ty));
}

// ── Zoom ──────────────────────────────────────────────────────────────────
function zoomAt(factor, cx, cy) {
  const newScale = Math.min(maxScale, Math.max(minScale, scale * factor));
  const ratio    = newScale / scale;
  tx = cx - ratio * (cx - tx);
  ty = cy - ratio * (cy - ty);
  scale = newScale;
  clampTranslation();
  applyTransform(false);
}

window.zoomBy = (factor) => {
  const vw = viewport.clientWidth, vh = viewport.clientHeight;
  zoomAt(factor, vw / 2, vh / 2);
};

// ── Mouse events ──────────────────────────────────────────────────────────
viewport.addEventListener('mousedown', e => {
  if (e.target.closest('.agent-pin')) return;
  dragging = true;
  lastX = e.clientX; lastY = e.clientY;
  viewport.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', e => {
  if (!dragging) return;
  tx += e.clientX - lastX;
  ty += e.clientY - lastY;
  lastX = e.clientX; lastY = e.clientY;
  clampTranslation();
  applyTransform(false);
});

window.addEventListener('mouseup', () => {
  dragging = false;
  viewport.style.cursor = '';
});

viewport.addEventListener('wheel', e => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.12 : 0.89;
  zoomAt(factor, e.clientX, e.clientY);
}, { passive: false });

// ── Touch events ──────────────────────────────────────────────────────────
let lastTouchDist = 0, lastTouchX = 0, lastTouchY = 0;

viewport.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    lastTouchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }
}, { passive: true });

viewport.addEventListener('touchmove', e => {
  e.preventDefault();
  if (e.touches.length === 1) {
    tx += e.touches[0].clientX - lastTouchX;
    ty += e.touches[0].clientY - lastTouchY;
    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
    clampTranslation();
    applyTransform(false);
  } else if (e.touches.length === 2) {
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    zoomAt(dist / lastTouchDist, cx, cy);
    lastTouchDist = dist;
  }
}, { passive: false });

// ── Minimap ───────────────────────────────────────────────────────────────
function updateMinimap() {
  const mm   = document.getElementById('minimap');
  const mmW  = mm.clientWidth, mmH = mm.clientHeight;
  const vw   = viewport.clientWidth, vh = viewport.clientHeight;
  const sw   = imgW * scale, sh = imgH * scale;

  const visX = Math.max(0, -tx);
  const visY = Math.max(0, -ty);
  const visW = Math.min(sw, vw  + Math.min(0, tx)) ;
  const visH = Math.min(sh, vh  + Math.min(0, ty));

  const scaleX = mmW / sw, scaleY = mmH / sh;

  mmVP.style.left   = (visX * scaleX) + 'px';
  mmVP.style.top    = (visY * scaleY) + 'px';
  mmVP.style.width  = Math.min(mmW, visW * scaleX) + 'px';
  mmVP.style.height = Math.min(mmH, visH * scaleY) + 'px';
}

// ── Agent pins ────────────────────────────────────────────────────────────
function spawnPins() {
  AGENTS.forEach(agent => {
    const pin = document.createElement('div');
    pin.className = agent.leader ? 'agent-pin leader' : 'agent-pin';
    pin.dataset.id = agent.id;
    pin.style.left = agent.px + '%';
    pin.style.top  = agent.py + '%';

    const dot = document.createElement('div');
    dot.className = 'pin-dot';
    dot.style.color      = agent.color;
    dot.style.background = agent.color;

    const label = document.createElement('div');
    label.className   = 'pin-label';
    label.textContent = agent.name;

    pin.appendChild(dot);
    pin.appendChild(label);
    scene.appendChild(pin);

    pin.addEventListener('click', e => {
      e.stopPropagation();
      openPanel(agent, pin);
    });

    pin.addEventListener('mouseenter', e => {
      tooltip.style.display = 'block';
      tooltip.textContent   = `${agent.name} · ${agent.role}`;
    });

    pin.addEventListener('mousemove', e => {
      tooltip.style.left = (e.clientX + 16) + 'px';
      tooltip.style.top  = (e.clientY - 10) + 'px';
    });

    pin.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
  });
}

// ── Panel ─────────────────────────────────────────────────────────────────
function openPanel(agent, pin) {
  activeAgent = agent.id;
  document.getElementById('panel-dept').textContent = agent.dept;
  document.getElementById('panel-name').textContent = agent.name;
  document.getElementById('panel-role').textContent = agent.role;
  document.getElementById('panel-bio').textContent  = agent.bio;
  const btn = document.getElementById('panel-goto-btn');
  btn.textContent = '→ Ver en agencia';
  btn.onclick = () => focusAgent(agent, pin);
  document.getElementById('agent-panel').classList.add('open');
}

window.closePanel = () => {
  document.getElementById('agent-panel').classList.remove('open');
  activeAgent = null;
};

// Fly to agent in the image
function focusAgent(agent, pin) {
  const vw = viewport.clientWidth, vh = viewport.clientHeight;
  const targetScale = Math.min(maxScale, Math.max(scale, 1.4));
  const imgX = (agent.px / 100) * imgW;
  const imgY = (agent.py / 100) * imgH;
  scale = targetScale;
  tx    = vw / 2 - imgX * scale;
  ty    = vh / 2 - imgY * scale;
  clampTranslation();
  applyTransform(true);
}

// Click on background closes panel
viewport.addEventListener('click', e => {
  if (!e.target.closest('.agent-pin') && !e.target.closest('#agent-panel')) {
    closePanel();
  }
});
