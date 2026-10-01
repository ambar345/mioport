// Menú en mobile
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Flechas del carrusel de habilidades
const track = document.getElementById('skillsTrack');
const prevBtn = document.getElementById('skillsPrev');
const nextBtn = document.getElementById('skillsNext');

if (track && prevBtn && nextBtn) {
  const step = () => {
    const card = track.querySelector('.skill-card');
    if (!card) return 240;
    const style = getComputedStyle(track);
    return card.offsetWidth + parseFloat(style.columnGap || style.gap || 20);
  };
  prevBtn.addEventListener('click', () => {
    track.scrollBy({ left: -step(), behavior: 'smooth' });
  });
  nextBtn.addEventListener('click', () => {
    track.scrollBy({ left: step(), behavior: 'smooth' });
  });
}

// Zoom de capturas en las tarjetas de proyectos
const zoomCards = [
  ...[...document.querySelectorAll('.project-card')].filter((card) => card.querySelector('.project-thumb img')),
  ...[...document.querySelectorAll('.shot')].filter((shot) => shot.querySelector('.shot-frame-body img')),
];

if (zoomCards.length) {
  const overlay = document.createElement('div');
  overlay.className = 'zoom-overlay';
  overlay.hidden = true;
  overlay.tabIndex = -1;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  const zoomImg = document.createElement('img');
  zoomImg.className = 'zoom-img';
  overlay.appendChild(zoomImg);
  document.body.appendChild(overlay);

  let activeCard = null;

  const thumbOf = (card) => card.querySelector('.project-thumb img, .shot-frame-body img');
  const isInactiveShot = (card) => card.classList.contains('shot') && !card.classList.contains('is-active');

  const targetRect = (img) => {
    const ratio = img.naturalWidth / img.naturalHeight || 1.6;
    let width = window.innerWidth * 0.92;
    let height = width / ratio;
    if (height > window.innerHeight * 0.88) {
      height = window.innerHeight * 0.88;
      width = height * ratio;
    }
    return {
      left: (window.innerWidth - width) / 2,
      top: (window.innerHeight - height) / 2,
      width,
      height,
    };
  };

  const placeZoom = (target) => {
    zoomImg.style.left = `${target.left}px`;
    zoomImg.style.top = `${target.top}px`;
    zoomImg.style.width = `${target.width}px`;
    zoomImg.style.height = `${target.height}px`;
  };

  const transformFrom = (source, target) =>
    `translate(${source.left - target.left}px, ${source.top - target.top}px) ` +
    `scale(${source.width / target.width}, ${source.height / target.height})`;

  const openZoom = (card) => {
    if (isInactiveShot(card)) return;
    const img = thumbOf(card);
    const target = targetRect(img);
    activeCard = card;
    zoomImg.src = img.currentSrc || img.src;
    zoomImg.alt = img.alt;
    overlay.setAttribute('aria-label', img.alt);
    placeZoom(target);
    zoomImg.style.transition = 'none';
    zoomImg.style.transform = transformFrom(img.getBoundingClientRect(), target);
    overlay.hidden = false;
    void zoomImg.offsetWidth;
    zoomImg.style.transition = '';
    zoomImg.style.transform = 'none';
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    overlay.focus();
  };

  const closeZoom = () => {
    if (!activeCard || !overlay.classList.contains('open')) return;
    const card = activeCard;
    const img = thumbOf(card);
    overlay.classList.remove('open');
    zoomImg.style.transform = transformFrom(img.getBoundingClientRect(), targetRect(img));
    const finish = (event) => {
      if (event.propertyName !== 'transform') return;
      zoomImg.removeEventListener('transitionend', finish);
      overlay.hidden = true;
      document.body.style.overflow = '';
      activeCard = null;
      card.focus();
    };
    zoomImg.addEventListener('transitionend', finish);
  };

  zoomCards.forEach((card) => {
    const img = thumbOf(card);
    card.classList.add('is-zoomable');
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Ampliar captura: ${img.alt}`);
    card.addEventListener('click', () => openZoom(card));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openZoom(card);
      }
    });
  });

  overlay.addEventListener('click', closeZoom);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeZoom();
  });
  window.addEventListener('resize', () => {
    if (activeCard && overlay.classList.contains('open')) placeZoom(targetRect(thumbOf(activeCard)));
  });
}

// Carrusel de capturas del proyecto destacado
const shotsTrack = document.getElementById('shotsTrack');
const shotsPrev = document.getElementById('shotsPrev');
const shotsNext = document.getElementById('shotsNext');
const shotsDots = document.getElementById('shotsDots');

if (shotsTrack && shotsPrev && shotsNext) {
  const shots = [...shotsTrack.querySelectorAll('.shot')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const behavior = () => (reducedMotion.matches ? 'auto' : 'smooth');

  const step = () => {
    const shot = shots[0];
    if (!shot) return shotsTrack.clientWidth;
    const style = getComputedStyle(shotsTrack);
    return shot.offsetWidth + parseFloat(style.columnGap || style.gap || 18);
  };

  const goTo = (index) => {
    shotsTrack.scrollTo({ left: index * step(), behavior: behavior() });
  };

  const dots = shots.map((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'shot-dot';
    dot.tabIndex = -1;
    dot.addEventListener('click', () => goTo(index));
    if (shotsDots) shotsDots.appendChild(dot);
    return dot;
  });

  let activeIndex = -1;
  const update = () => {
    const index = Math.max(0, Math.min(shots.length - 1, Math.round(shotsTrack.scrollLeft / step())));
    if (index === activeIndex) return;
    activeIndex = index;
    shots.forEach((shot, i) => shot.classList.toggle('is-active', i === index));
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
  };

  let ticking = false;
  shotsTrack.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }, { passive: true });

  shotsPrev.addEventListener('click', () => {
    shotsTrack.scrollBy({ left: -step(), behavior: behavior() });
  });
  shotsNext.addEventListener('click', () => {
    shotsTrack.scrollBy({ left: step(), behavior: behavior() });
  });
  shots.forEach((shot, index) => {
    shot.addEventListener('click', () => {
      if (!shot.classList.contains('is-active')) goTo(index);
    });
  });
  window.addEventListener('resize', () => {
    activeIndex = -1;
    update();
  });

  update();
}

// Objeto abstracto del hero: cinta retorcida renderizada en canvas 2D
const heroRibbon = document.getElementById('heroRibbon');

const drawRibbon = (canvas) => {
  const ctx = canvas.getContext('2d');
  const size = canvas.clientWidth;
  if (!ctx || !size) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);

  const norm = (v) => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const smooth = (e0, e1, x) => {
    const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  };

  const rx = 1.08;
  const ry = 0.26;
  const rz = -0.5;
  const rot = ([x, y, z]) => {
    [y, z] = [y * Math.cos(rx) - z * Math.sin(rx), y * Math.sin(rx) + z * Math.cos(rx)];
    [x, z] = [x * Math.cos(ry) + z * Math.sin(ry), -x * Math.sin(ry) + z * Math.cos(ry)];
    [x, y] = [x * Math.cos(rz) - y * Math.sin(rz), x * Math.sin(rz) + y * Math.cos(rz)];
    return [x, y, z];
  };
  const center = (u) => {
    const r = 1 + 0.1 * Math.sin(3 * u);
    return [r * Math.cos(u), r * Math.sin(u), 0.25 * Math.sin(2 * u + 0.6)];
  };

  const black = [10, 6, 16];
  const deep = [46, 10, 74];
  const violet = [109, 40, 217];
  const fuchsia = [255, 45, 166];
  const bright = [255, 150, 225];
  const env = (r) => {
    const up = -r[1] * 0.6 - r[0] * 0.55;
    let c = mix(black, deep, smooth(-0.9, 0.1, up));
    c = mix(c, violet, smooth(-0.1, 0.5, up) * 0.95);
    c = mix(c, fuchsia, smooth(0.35, 0.8, up));
    c = mix(c, bright, smooth(0.82, 1.0, up) * 0.9);
    return mix(c, violet, smooth(0.3, 0.95, r[0] * 0.8 + r[1] * 0.35) * 0.6);
  };

  const SHEETS = 6;
  const SEG = size < 420 ? 170 : 240;
  const STRIP = 6;
  const quads = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let s = 0; s < SHEETS; s++) {
    const rows = [];
    for (let k = 0; k <= SEG; k++) {
      const u = (2 * Math.PI * k) / SEG;
      const c = center(u);
      const c0 = center(u - 1e-4);
      const c1 = center(u + 1e-4);
      const T = norm([c1[0] - c0[0], c1[1] - c0[1], c1[2] - c0[2]]);
      let N = norm([Math.cos(u), Math.sin(u), 0]);
      const d = dot(N, T);
      N = norm([N[0] - d * T[0], N[1] - d * T[1], N[2] - d * T[2]]);
      const B = cross(T, N);
      const th = 2 * u + s * 0.12 + 0.4;
      const D = [0, 1, 2].map((i) => Math.cos(th) * N[i] + Math.sin(th) * B[i]);
      const Dn = [0, 1, 2].map((i) => -Math.sin(th) * N[i] + Math.cos(th) * B[i]);
      const width = (0.3 + 0.08 * Math.sin(u + 1.2)) * (1 - s * 0.05);
      const off = (s - (SHEETS - 1) / 2) * 0.05;
      const n = rot(Dn);
      const row = [];
      for (let j = 0; j <= STRIP; j++) {
        const w = -1 + (2 * j) / STRIP;
        const p = rot([0, 1, 2].map((i) => c[i] + w * width * D[i] + off * Dn[i]));
        minX = Math.min(minX, p[0]);
        maxX = Math.max(maxX, p[0]);
        minY = Math.min(minY, p[1]);
        maxY = Math.max(maxY, p[1]);
        row.push({ p, n });
      }
      rows.push(row);
    }
    for (let k = 0; k < SEG; k++) {
      for (let j = 0; j < STRIP; j++) {
        const pts = [rows[k][j], rows[k + 1][j], rows[k + 1][j + 1], rows[k][j + 1]];
        let n = norm([0, 1, 2].map((i) => pts.reduce((a, q) => a + q.n[i], 0)));
        if (n[2] < 0) n = [-n[0], -n[1], -n[2]];
        const nv = n[2];
        const fres = Math.pow(1 - nv, 3);
        const col = mix(env([2 * nv * n[0], 2 * nv * n[1], 2 * nv * n[2] - 1]), bright, fres * 0.35);
        let edge = null;
        if (j === 0) edge = [pts[0], pts[1]];
        else if (j === STRIP - 1) edge = [pts[3], pts[2]];
        quads.push({ z: pts.reduce((a, q) => a + q.p[2], 0) / 4, pts, col, edge, fres });
      }
    }
  }
  quads.sort((a, b) => a.z - b.z);

  const pad = canvas.width * 0.04;
  const scale = (canvas.width - 2 * pad) / Math.max(maxX - minX, maxY - minY);
  const ox = (canvas.width - (maxX - minX) * scale) / 2 - minX * scale;
  const oy = (canvas.height - (maxY - minY) * scale) / 2 - minY * scale;
  const xy = ({ p }) => [p[0] * scale + ox, p[1] * scale + oy];

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineJoin = 'round';
  quads.forEach((q) => {
    const [r, g, b] = q.col.map((v) => Math.max(0, Math.min(255, Math.round(v))));
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 0.9 * dpr;
    ctx.beginPath();
    q.pts.forEach((pt, i) => {
      const [x, y] = xy(pt);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (q.edge) {
      const [x0, y0] = xy(q.edge[0]);
      const [x1, y1] = xy(q.edge[1]);
      ctx.strokeStyle = `rgba(255,160,230,${(0.25 + 0.5 * q.fres).toFixed(2)})`;
      ctx.lineWidth = 1.1 * dpr;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  });
  canvas.classList.add('is-ready');
};

if (heroRibbon) {
  let drawnSize = 0;
  const render = () => {
    const size = heroRibbon.clientWidth;
    if (!size || size === drawnSize) return;
    drawnSize = size;
    drawRibbon(heroRibbon);
  };
  requestAnimationFrame(render);
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 200);
  });
}

// Iluminación localizada en tarjetas
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.do-card, .skill-card, .project-card-soon').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--my', `${event.clientY - rect.top}px`);
    });
  });
}
