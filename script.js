// Theme toggle
(function () {
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;

  const root = document.documentElement;

  // Check for saved preference or use system default
  function getPreferred() {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function apply(theme) {
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }

  // Apply on load
  apply(getPreferred());

  toggle.addEventListener('click', () => {
    const current = root.classList.contains('light') ? 'light' : 'dark';
    apply(current === 'dark' ? 'light' : 'dark');
  });
})();

// Cat B easter egg
(function () {
  const bEl = document.querySelector('.b');
  if (!bEl) return;

  bEl.addEventListener('click', function () {
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

    reveal.querySelector('.close').addEventListener('click', () => reveal.remove());

    function onKey(e) {
      if (e.key === 'Escape') {
        reveal.remove();
        document.removeEventListener('keydown', onKey);
      }
    }
    document.addEventListener('keydown', onKey);

    reveal.addEventListener('click', e => {
      if (e.target === reveal) reveal.remove();
    });
  });
})();

// Diffusion Token Simulation
// Tokens start noisy, gradually denoise, and influence neighbors
(function () {
  const canvas = document.getElementById('sim');
  if (!canvas) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  let w, h;
  let mouse = { x: -1000, y: -1000 };

  // Token vocabulary - mix of code/ML tokens
  const vocab = [
    // python
    'def', 'for', 'if', 'else', 'return', 'import', 'class', 'self',
    '0', '1', 'x', 'y', 'i', 'fn', '()', '[]', '{}', '==', '!=', '+=',
    // ml
    'llm', 'encoder', 'decoder', 'loss', 'forward', 'tensor', 'layers',
    'torch', 'epoch', 'tokenizer', 'vocab', 'token', 'attn',
    // libraries
    'vllm', 'torch', 'flashinfer', 'flashattention', 'triton', 'cutlass',
    // hardware
    'cuda', 'rocm', 'tpu', 'xpu', 'cpu',
    // compression
    'int4', 'int8', 'fp8', 'mxfp4', 'nvfp4', 'sparsity', '2:4',
  ];

  // Noise characters for fuzzy state
  const noise = '░▒▓█▄▀■□▪▫●○◐◑◒◓';

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  document.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  document.addEventListener('mouseleave', () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  // Token particles
  const tokens = [];
  const count = 50;

  for (let i = 0; i < count; i++) {
    tokens.push(createToken());
  }

  function createToken(x, y) {
    return {
      x: x ?? Math.random() * w,
      y: y ?? Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      target: vocab[Math.floor(Math.random() * vocab.length)],
      current: '',
      clarity: 0, // 0 = fully noisy, 1 = fully resolved
      denoiseRate: 0.001 + Math.random() * 0.003,
      noiseTimer: 0,
      settled: false
    };
  }

  function getNoiseChar() {
    return noise[Math.floor(Math.random() * noise.length)];
  }

  function renderToken(token) {
    const len = token.target.length;
    let result = '';

    for (let i = 0; i < len; i++) {
      // Each character has its own threshold based on position
      const charThreshold = (i + 1) / (len + 1);
      if (token.clarity > charThreshold + Math.random() * 0.2) {
        result += token.target[i];
      } else {
        result += getNoiseChar();
      }
    }
    return result;
  }

  function update() {
    for (const t of tokens) {
      // Movement with slight drift
      t.x += t.vx;
      t.y += t.vy;

      // Mouse interaction - tokens near cursor denoise faster
      const dx = mouse.x - t.x;
      const dy = mouse.y - t.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 150) {
        // Boost denoising near mouse
        t.clarity += 0.02 * (1 - dist / 150);
        // Gentle push away from cursor
        t.vx -= dx * 0.00005;
        t.vy -= dy * 0.00005;
      }

      // Natural denoising over time
      if (t.clarity < 1) {
        t.clarity += t.denoiseRate;
      }

      // Neighbor influence - settled tokens help nearby tokens
      if (t.clarity > 0.8) {
        for (const other of tokens) {
          if (other === t) continue;
          const ndx = other.x - t.x;
          const ndy = other.y - t.y;
          const ndist = Math.sqrt(ndx * ndx + ndy * ndy);
          if (ndist < 80) {
            other.clarity += 0.002 * (1 - ndist / 80);
          }
        }
      }

      // Once fully resolved, stay for a bit then re-noise
      if (t.clarity >= 1 && !t.settled) {
        t.settled = true;
        t.noiseTimer = 200 + Math.random() * 300;
      }

      if (t.settled) {
        t.noiseTimer--;
        if (t.noiseTimer <= 0) {
          // Re-noise with new target
          t.clarity = 0;
          t.settled = false;
          t.target = vocab[Math.floor(Math.random() * vocab.length)];
          t.denoiseRate = 0.001 + Math.random() * 0.003;
        }
      }

      // Wrap around edges
      if (t.x < -50) t.x = w + 50;
      if (t.x > w + 50) t.x = -50;
      if (t.y < -20) t.y = h + 20;
      if (t.y > h + 20) t.y = -20;

      // Slight velocity dampening and random drift
      t.vx *= 0.999;
      t.vy *= 0.999;
      t.vx += (Math.random() - 0.5) * 0.01;
      t.vy += (Math.random() - 0.5) * 0.01;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    const isDark = document.documentElement.classList.contains('dark') ||
      (!document.documentElement.classList.contains('light') &&
        !window.matchMedia('(prefers-color-scheme: light)').matches);

    ctx.font = '13px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.textBaseline = 'middle';

    for (const t of tokens) {
      const text = renderToken(t);

      // Opacity based on clarity - noisy tokens are dimmer
      const baseOpacity = isDark ? 0.20 : 0.10;
      const clarityBoost = t.clarity * 0.15;
      const opacity = baseOpacity + clarityBoost;

      // Color shifts slightly as token resolves
      if (isDark) {
        const g = Math.floor(180 + t.clarity * 50);
        const b = Math.floor(180 + t.clarity * 60);
        ctx.fillStyle = `rgba(${160 + t.clarity * 30}, ${g}, ${b}, ${opacity})`;
      } else {
        const shade = Math.floor(40 - t.clarity * 20);
        ctx.fillStyle = `rgba(${shade}, ${shade + 10}, ${shade + 20}, ${opacity})`;
      }

      ctx.fillText(text, t.x, t.y);
    }

    update();
    requestAnimationFrame(draw);
  }

  draw();
})();
