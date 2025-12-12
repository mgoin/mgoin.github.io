// Cat B easter egg
(function() {
  const bEl = document.querySelector('.b');
  if (!bEl) return;

  bEl.addEventListener('click', function() {
    // Remove existing reveal if any
    const existing = document.querySelector('.cat-reveal');
    if (existing) {
      existing.remove();
      return;
    }

    const reveal = document.createElement('div');
    reveal.className = 'cat-reveal';
    reveal.innerHTML = `
      <button class="close" aria-label="Close">&times;</button>
      <img src="assets/b.jpg" alt="B the cat">
      <p>This is B.</p>
    `;

    document.body.appendChild(reveal);

    reveal.querySelector('.close').addEventListener('click', function() {
      reveal.remove();
    });

    // Close on escape
    function onKey(e) {
      if (e.key === 'Escape') {
        reveal.remove();
        document.removeEventListener('keydown', onKey);
      }
    }
    document.addEventListener('keydown', onKey);

    // Close on click outside
    reveal.addEventListener('click', function(e) {
      if (e.target === reveal) {
        reveal.remove();
      }
    });
  });
})();

// Simulation placeholder
// TODO: Implement diffusion-style token simulation
(function() {
  const canvas = document.getElementById('sim');
  if (!canvas) return;

  // Respect reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const ctx = canvas.getContext('2d');
  let w, h;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  // Placeholder: subtle particle drift
  // Will be replaced with diffusion LM simulation
  const particles = [];
  const count = 30;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 1,
      char: String.fromCharCode(0x2580 + Math.floor(Math.random() * 32))
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches ||
                   !window.matchMedia('(prefers-color-scheme: light)').matches;

    ctx.fillStyle = isDark ? 'rgba(212, 212, 212, 0.15)' : 'rgba(26, 26, 26, 0.1)';
    ctx.font = '14px monospace';

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;

      ctx.fillText(p.char, p.x, p.y);
    }

    requestAnimationFrame(draw);
  }

  draw();
})();
