(() => {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const total = slides.length;
  const railDots = document.getElementById('railDots');
  const currentNumEl = document.getElementById('currentNum');
  const totalNumEl = document.getElementById('totalNum');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const partTags = document.querySelectorAll('.part-tag');

  totalNumEl.textContent = String(total).padStart(2, '0');

  let current = 0;
  let isAnimating = false;

  // Build rail dots
  slides.forEach((_, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.setAttribute('aria-label', `Go to slide ${i + 1}`);
    btn.addEventListener('click', () => goTo(i));
    li.appendChild(btn);
    railDots.appendChild(li);
  });
  const dotButtons = Array.from(railDots.querySelectorAll('button'));

  function updatePartTags(index) {
    let activePart = null;
    if (index >= 2 && index <= 8) activePart = '1';
    if (index >= 9 && index <= 15) activePart = '2';
    partTags.forEach(tag => {
      tag.classList.toggle('active', tag.dataset.part === activePart);
    });
  }

  function render(index, direction) {
    slides.forEach((s, i) => {
      s.classList.remove('active', 'exit-up');
      if (i === index) {
        s.classList.add('active');
      }
    });
    dotButtons.forEach((d, i) => d.classList.toggle('active', i === index));
    currentNumEl.textContent = String(index + 1).padStart(2, '0');
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === total - 1;
    updatePartTags(index);
  }

  function goTo(index) {
    if (index < 0 || index >= total || index === current || isAnimating) return;
    isAnimating = true;
    current = index;
    render(current);
    window.setTimeout(() => { isAnimating = false; }, 560);
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  const startBtn = document.getElementById('startBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      startBtn.classList.remove('pressed');
      void startBtn.offsetWidth; // restart animation
      startBtn.classList.add('pressed');
      goTo(current + 1);
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); goTo(current + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goTo(current - 1); }
    if (e.key === 'Home') goTo(0);
    if (e.key === 'End') goTo(total - 1);
  });

  // Touch / swipe support
  let touchStartX = 0;
  const stage = document.getElementById('stage');
  stage.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) { dx < 0 ? goTo(current + 1) : goTo(current - 1); }
  }, { passive: true });

  render(0);

  // ===== Tap-to-reveal detail interactions =====
  const revealEls = Array.from(document.querySelectorAll('.tap-reveal'));

  function spawnSonar(el, evt) {
    if (prefersReducedGlobal()) return;
    const rect = el.getBoundingClientRect();
    const x = (evt && evt.clientX) ? evt.clientX - rect.left : rect.width / 2;
    const y = (evt && evt.clientY) ? evt.clientY - rect.top : rect.height / 2;
    const ring = document.createElement('span');
    ring.className = 'sonar-ping';
    ring.style.left = x + 'px';
    ring.style.top = y + 'px';
    ring.style.width = '90px';
    ring.style.height = '90px';
    el.appendChild(ring);
    window.setTimeout(() => ring.remove(), 650);
  }

  function prefersReducedGlobal() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function toggleReveal(el, evt) {
    const willOpen = !el.classList.contains('open');
    // close siblings within the same slide for focus, keep it lively but tidy
    const slide = el.closest('.slide');
    if (slide) {
      slide.querySelectorAll('.tap-reveal.open').forEach(other => {
        if (other !== el) {
          other.classList.remove('open');
          other.setAttribute('aria-expanded', 'false');
        }
      });
    }
    el.classList.toggle('open', willOpen);
    el.setAttribute('aria-expanded', String(willOpen));
    el.classList.remove('just-tapped');
    // eslint-disable-next-line no-unused-expressions
    void el.offsetWidth; // restart animation
    el.classList.add('just-tapped');
    if (el.classList.contains('visual-tap') && willOpen) spawnSonar(el, evt);
  }

  revealEls.forEach(el => {
    el.addEventListener('click', (evt) => toggleReveal(el, evt));
    el.addEventListener('keydown', (evt) => {
      if (evt.key === 'Enter' || evt.key === ' ') {
        evt.preventDefault();
        toggleReveal(el, evt);
      }
    });
  });

  // ===== Global touch/click ripple feedback =====
  function spawnRipple(x, y) {
    if (prefersReducedGlobal()) return;
    const r = document.createElement('div');
    r.className = 'ripple';
    r.style.left = x + 'px';
    r.style.top = y + 'px';
    document.body.appendChild(r);
    window.setTimeout(() => r.remove(), 620);
  }
  stage.addEventListener('pointerdown', (e) => {
    spawnRipple(e.clientX, e.clientY);
  });

  // ===== Ambient network canvas =====
  const canvas = document.getElementById('mesh');
  const ctx = canvas.getContext('2d');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w, h, nodes = [];
  const NODE_COUNT = 46;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function initNodes() {
    nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() * 1.4 + 0.6
    }));
  }
  initNodes();
  window.addEventListener('resize', initNodes);

  const CYAN = '94,234,212';
  const AMBER = '255,184,107';

  function tick() {
    ctx.clearRect(0, 0, w, h);
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const opacity = (1 - dist / 150) * 0.16;
          const color = (i + j) % 5 === 0 ? AMBER : CYAN;
          ctx.strokeStyle = `rgba(${color},${opacity})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    for (const n of nodes) {
      ctx.fillStyle = `rgba(${CYAN},0.5)`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!prefersReduced) requestAnimationFrame(tick);
  }
  tick();
})();