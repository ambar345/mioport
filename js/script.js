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

const createRibbon = (canvas) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

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

  let dpr = 1;
  let quality = { sheets: 5, seg: 200, strip: 3 };
  let fit = null;

  const geometry = (pose, q, collect) => {
    const { rx, ry, rz, flow, breathe } = pose;
    const cx = Math.cos(rx); const sx = Math.sin(rx);
    const cy = Math.cos(ry); const sy = Math.sin(ry);
    const cz = Math.cos(rz); const sz = Math.sin(rz);
    const rot = ([x, y, z]) => {
      [y, z] = [y * cx - z * sx, y * sx + z * cx];
      [x, z] = [x * cy + z * sy, -x * sy + z * cy];
      [x, y] = [x * cz - y * sz, x * sz + y * cz];
      return [x, y, z];
    };
    const center = (u) => {
      const r = 1 + 0.1 * Math.sin(3 * u + breathe);
      return [r * Math.cos(u), r * Math.sin(u), 0.25 * Math.sin(2 * u + 0.6 + breathe * 0.5)];
    };

    const sheets = [];
    for (let s = 0; s < q.sheets; s++) {
      const rows = [];
      for (let k = 0; k <= q.seg; k++) {
        const u = (2 * Math.PI * k) / q.seg;
        const c = center(u);
        const c0 = center(u - 1e-4);
        const c1 = center(u + 1e-4);
        const T = norm([c1[0] - c0[0], c1[1] - c0[1], c1[2] - c0[2]]);
        let N = norm([Math.cos(u), Math.sin(u), 0]);
        const d = dot(N, T);
        N = norm([N[0] - d * T[0], N[1] - d * T[1], N[2] - d * T[2]]);
        const B = cross(T, N);
        const th = 2 * u + s * 0.12 + 0.4 + flow;
        const ct = Math.cos(th); const st = Math.sin(th);
        const D = [ct * N[0] + st * B[0], ct * N[1] + st * B[1], ct * N[2] + st * B[2]];
        const Dn = [-st * N[0] + ct * B[0], -st * N[1] + ct * B[1], -st * N[2] + ct * B[2]];
        const width = (0.3 + 0.08 * Math.sin(u + 1.2)) * (1 - s * 0.05);
        const off = (s - (q.sheets - 1) / 2) * 0.05;
        const n = rot(Dn);
        const row = [];
        for (let j = 0; j <= q.strip; j++) {
          const w = (-1 + (2 * j) / q.strip) * width;
          const p = rot([c[0] + w * D[0] + off * Dn[0], c[1] + w * D[1] + off * Dn[1], c[2] + w * D[2] + off * Dn[2]]);
          if (collect) collect(p);
          row.push({ p, n });
        }
        rows.push(row);
      }
      sheets.push(rows);
    }
    return sheets;
  };

  const resize = (poses) => {
    const size = canvas.clientWidth;
    if (!size) return false;
    dpr = Math.min(window.devicePixelRatio || 1, size < 420 ? 2 : 1.5);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    const b = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    const probe = { sheets: quality.sheets, seg: 72, strip: 2 };
    poses.forEach((pose) => geometry(pose, probe, (p) => {
      b.minX = Math.min(b.minX, p[0]); b.maxX = Math.max(b.maxX, p[0]);
      b.minY = Math.min(b.minY, p[1]); b.maxY = Math.max(b.maxY, p[1]);
    }));
    const pad = canvas.width * 0.04;
    const scale = (canvas.width - 2 * pad) / Math.max(b.maxX - b.minX, b.maxY - b.minY);
    fit = {
      scale,
      ox: canvas.width / 2 - ((b.minX + b.maxX) / 2) * scale,
      oy: canvas.height / 2 - ((b.minY + b.maxY) / 2) * scale,
    };
    return true;
  };

  const draw = (pose) => {
    if (!fit) return;
    const q = quality;
    const sheets = geometry(pose, q);
    const quads = [];
    sheets.forEach((rows) => {
      for (let k = 0; k < q.seg; k++) {
        for (let j = 0; j < q.strip; j++) {
          const pts = [rows[k][j], rows[k + 1][j], rows[k + 1][j + 1], rows[k][j + 1]];
          let n = norm([0, 1, 2].map((i) => pts[0].n[i] + pts[1].n[i] + pts[2].n[i] + pts[3].n[i]));
          if (n[2] < 0) n = [-n[0], -n[1], -n[2]];
          const nv = n[2];
          const fres = Math.pow(1 - nv, 3);
          const col = mix(env([2 * nv * n[0], 2 * nv * n[1], 2 * nv * n[2] - 1]), bright, fres * 0.35);
          let edge = null;
          if (j === 0) edge = [pts[0], pts[1]];
          else if (j === q.strip - 1) edge = [pts[3], pts[2]];
          quads.push({ z: (pts[0].p[2] + pts[1].p[2] + pts[2].p[2] + pts[3].p[2]) / 4, pts, col, edge, fres });
        }
      }
    });
    quads.sort((a, b) => a.z - b.z);

    const { scale, ox, oy } = fit;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineJoin = 'round';
    quads.forEach((quad) => {
      const r = Math.max(0, Math.min(255, Math.round(quad.col[0])));
      const g = Math.max(0, Math.min(255, Math.round(quad.col[1])));
      const bl = Math.max(0, Math.min(255, Math.round(quad.col[2])));
      ctx.fillStyle = `rgb(${r},${g},${bl})`;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 0.9 * dpr;
      ctx.beginPath();
      quad.pts.forEach(({ p }, i) => {
        const x = p[0] * scale + ox;
        const y = p[1] * scale + oy;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (quad.edge) {
        const [a, b] = quad.edge;
        ctx.strokeStyle = `rgba(255,160,230,${(0.25 + 0.5 * quad.fres).toFixed(2)})`;
        ctx.lineWidth = 1.1 * dpr;
        ctx.beginPath();
        ctx.moveTo(a.p[0] * scale + ox, a.p[1] * scale + oy);
        ctx.lineTo(b.p[0] * scale + ox, b.p[1] * scale + oy);
        ctx.stroke();
      }
    });
    canvas.classList.add('is-ready');
  };

  const setQuality = (q) => { quality = q; };
  return { resize, draw, setQuality };
};

if (heroRibbon) {
  const ribbon = createRibbon(heroRibbon);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const TILT = 0.14;
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };

  const pose = (t) => ({
    rx: 1.08 + 0.09 * Math.sin(t * 0.21) + tilt.y,
    ry: 0.26 + 0.15 * Math.sin(t * 0.16 + 1.1) + tilt.x,
    rz: -0.5 + 0.1 * Math.sin(t * 0.11 + 2.3),
    flow: t * 0.28,
    breathe: 0.6 * Math.sin(t * 0.13),
  });

  const fitPoses = () => {
    const poses = [];
    for (let i = 0; i < 24; i++) {
      const t = i * 7.3;
      const p = pose(t);
      const sx = i % 2 ? TILT : -TILT;
      const sy = i % 4 < 2 ? TILT : -TILT;
      poses.push({ ...p, rx: p.rx + sy, ry: p.ry + sx });
    }
    return poses;
  };

  let start = performance.now();
  let frozenAt = 0;
  let rafId = 0;
  let last = 0;
  let inView = true;
  let drawnSize = 0;
  const LEVELS = [
    { sheets: 5, seg: 200, strip: 3 },
    { sheets: 5, seg: 160, strip: 3 },
    { sheets: 4, seg: 130, strip: 3 },
  ];
  let level = 0;
  let minFrame = 1000 / 30;
  let cost = 0;
  let samples = 0;

  const elapsed = (now) => (now - start) / 1000;

  const frame = (now) => {
    rafId = requestAnimationFrame(frame);
    if (now - last < minFrame - 4) return;
    last = now;
    tilt.x += (tilt.tx - tilt.x) * 0.045;
    tilt.y += (tilt.ty - tilt.y) * 0.045;
    const t0 = performance.now();
    ribbon.draw(pose(elapsed(now)));
    cost += performance.now() - t0;
    if (++samples === 30) {
      const avg = cost / samples;
      cost = 0;
      samples = 0;
      if (avg > 24 && level < LEVELS.length - 1) ribbon.setQuality(LEVELS[++level]);
      minFrame = avg < 8 ? 0 : 1000 / 30;
    }
  };

  const animating = () => !reducedMotion.matches && inView;

  const sync = () => {
    if (animating()) {
      if (!rafId) {
        start = performance.now() - frozenAt * 1000;
        rafId = requestAnimationFrame(frame);
      }
    } else if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
      frozenAt = elapsed(performance.now());
    }
  };

  const render = () => {
    const size = heroRibbon.clientWidth;
    if (!ribbon || !size || size === drawnSize) return;
    drawnSize = size;
    level = Math.max(level, size < 420 ? 1 : 0);
    ribbon.setQuality(LEVELS[level]);
    if (!ribbon.resize(fitPoses())) return;
    ribbon.draw(pose(rafId ? elapsed(performance.now()) : frozenAt));
    sync();
  };

  requestAnimationFrame(render);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 200);
  });

  reducedMotion.addEventListener('change', sync);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    }).observe(heroRibbon);
  }

  if (finePointer.matches) {
    const hero = heroRibbon.closest('.hero') || document;
    hero.addEventListener('pointermove', (event) => {
      if (reducedMotion.matches) return;
      const rect = heroRibbon.getBoundingClientRect();
      const nx = (event.clientX - (rect.left + rect.width / 2)) / window.innerWidth;
      const ny = (event.clientY - (rect.top + rect.height / 2)) / window.innerHeight;
      tilt.tx = Math.max(-1, Math.min(1, nx * 2)) * TILT;
      tilt.ty = Math.max(-1, Math.min(1, ny * 2)) * TILT * 0.7;
    });
    hero.addEventListener('pointerleave', () => {
      tilt.tx = 0;
      tilt.ty = 0;
    });
  }
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
