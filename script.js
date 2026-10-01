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
