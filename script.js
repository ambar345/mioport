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
const zoomCards = [...document.querySelectorAll('.project-card')].filter((card) =>
  card.querySelector('.project-thumb img')
);

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

  const thumbOf = (card) => card.querySelector('.project-thumb img');

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
