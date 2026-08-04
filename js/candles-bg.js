// ============================================================
// Market Scalpers — "Market Constellation" Particle Network
// An interactive particle system with market-themed colors,
// proximity connections, mouse interactivity, and subtle glow.
// ============================================================
(function(){
  const canvas = document.getElementById('candlesBg');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Config ---
  const PARTICLE_COUNT_BASE = 80;  // base count, scales with screen
  const CONNECTION_DIST = 150;
  const MOUSE_RADIUS = 200;
  const MOUSE_PUSH = 0.8;
  const BASE_SPEED = 0.35;
  const PARTICLE_MIN_R = 1.5;
  const PARTICLE_MAX_R = 3.5;

  // Market colors
  const COLORS = {
    bullish: [
      'rgba(22, 163, 74, 0.8)',   // green-500
      'rgba(74, 222, 128, 0.7)',  // green-400
      'rgba(34, 197, 94, 0.75)',  // mid-green
    ],
    bearish: [
      'rgba(220, 45, 45, 0.8)',   // red-500
      'rgba(229, 62, 62, 0.7)',   // red-400
      'rgba(248, 113, 113, 0.65)',// light red
    ],
    neutral: [
      'rgba(107, 114, 128, 0.5)', // ink-2
      'rgba(156, 163, 175, 0.4)', // lighter gray
    ]
  };

  const CONNECTION_COLOR_BULL = 'rgba(22, 163, 74, ';
  const CONNECTION_COLOR_BEAR = 'rgba(220, 45, 45, ';
  const CONNECTION_COLOR_NEUTRAL = 'rgba(107, 114, 128, ';

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W, H, particles = [], rafId = null;
  let mouseX = -9999, mouseY = -9999;
  let particleCount;

  // --- Particle class ---
  class Particle {
    constructor(){
      this.reset(true);
    }

    reset(initial){
      this.x = initial ? Math.random() * W : (Math.random() < 0.5 ? -20 : W + 20);
      this.y = initial ? Math.random() * H : Math.random() * H;
      this.r = PARTICLE_MIN_R + Math.random() * (PARTICLE_MAX_R - PARTICLE_MIN_R);

      // Pick type: 40% bull, 40% bear, 20% neutral
      const roll = Math.random();
      if(roll < 0.4){
        this.type = 'bullish';
        this.color = COLORS.bullish[Math.floor(Math.random() * COLORS.bullish.length)];
        this.connColor = CONNECTION_COLOR_BULL;
      } else if(roll < 0.8){
        this.type = 'bearish';
        this.color = COLORS.bearish[Math.floor(Math.random() * COLORS.bearish.length)];
        this.connColor = CONNECTION_COLOR_BEAR;
      } else {
        this.type = 'neutral';
        this.color = COLORS.neutral[Math.floor(Math.random() * COLORS.neutral.length)];
        this.connColor = CONNECTION_COLOR_NEUTRAL;
      }

      // Velocity
      const angle = Math.random() * Math.PI * 2;
      const speed = BASE_SPEED * (0.5 + Math.random() * 0.8);
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;

      // Pulse phase
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.pulseSpeed = 0.008 + Math.random() * 0.015;

      // Glow intensity
      this.glowSize = this.r * (2 + Math.random() * 3);
    }

    update(){
      // Mouse repulsion
      const dx = this.x - mouseX;
      const dy = this.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if(dist < MOUSE_RADIUS && dist > 0){
        const force = (1 - dist / MOUSE_RADIUS) * MOUSE_PUSH;
        this.vx += (dx / dist) * force;
        this.vy += (dy / dist) * force;
      }

      // Damping
      this.vx *= 0.992;
      this.vy *= 0.992;

      // Ensure minimum speed so particles keep drifting
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if(speed < BASE_SPEED * 0.3){
        const angle = Math.atan2(this.vy, this.vx);
        this.vx = Math.cos(angle) * BASE_SPEED * 0.4;
        this.vy = Math.sin(angle) * BASE_SPEED * 0.4;
      }

      this.x += this.vx;
      this.y += this.vy;

      // Wrap around edges with padding
      const pad = 40;
      if(this.x < -pad) this.x = W + pad;
      if(this.x > W + pad) this.x = -pad;
      if(this.y < -pad) this.y = H + pad;
      if(this.y > H + pad) this.y = -pad;

      // Pulse
      this.pulsePhase += this.pulseSpeed;
    }

    draw(){
      const pulse = 0.6 + 0.4 * Math.sin(this.pulsePhase);
      const currentR = this.r * (0.8 + 0.4 * pulse);

      // Outer glow
      ctx.save();
      ctx.globalAlpha = 0.15 * pulse;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.glowSize, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.restore();

      // Core particle
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.4 * pulse;
      ctx.beginPath();
      ctx.arc(this.x, this.y, currentR, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.restore();

      // Bright center dot
      ctx.save();
      ctx.globalAlpha = 0.8 + 0.2 * pulse;
      ctx.beginPath();
      ctx.arc(this.x, this.y, currentR * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.restore();
    }
  }

  // --- Connection drawing with spatial grid for performance ---
  function drawConnections(){
    ctx.save();
    const cellSize = CONNECTION_DIST;
    const cols = Math.ceil(W / cellSize) + 1;
    const rows = Math.ceil(H / cellSize) + 1;
    const grid = new Array(cols * rows);

    // Assign particles to grid cells
    for(let i = 0; i < particles.length; i++){
      const p = particles[i];
      const cx = Math.floor(p.x / cellSize);
      const cy = Math.floor(p.y / cellSize);
      const key = cy * cols + cx;
      if(key >= 0 && key < grid.length){
        if(!grid[key]) grid[key] = [];
        grid[key].push(i);
      }
    }

    // Check connections only between neighboring cells
    for(let cy = 0; cy < rows; cy++){
      for(let cx = 0; cx < cols; cx++){
        const key = cy * cols + cx;
        const cell = grid[key];
        if(!cell) continue;

        // Check this cell and 4 neighbors (right, bottom, bottom-right, bottom-left)
        const neighbors = [
          key,
          cx + 1 < cols ? key + 1 : -1,
          cy + 1 < rows ? key + cols : -1,
          (cx + 1 < cols && cy + 1 < rows) ? key + cols + 1 : -1,
          (cx - 1 >= 0 && cy + 1 < rows) ? key + cols - 1 : -1,
        ];

        for(const nk of neighbors){
          if(nk < 0 || !grid[nk]) continue;
          const ncell = grid[nk];

          for(const ai of cell){
            for(const bi of ncell){
              if(ai >= bi) continue;
              const a = particles[ai];
              const b = particles[bi];
              const dx = a.x - b.x;
              const dy = a.y - b.y;
              const distSq = dx * dx + dy * dy;
              const maxDist = CONNECTION_DIST;

              if(distSq < maxDist * maxDist){
                const dist = Math.sqrt(distSq);
                const opacity = (1 - dist / maxDist) * 0.18;

                // Use the color of the particle with more "energy" (larger)
                const connColor = a.r > b.r ? a.connColor : b.connColor;

                ctx.globalAlpha = opacity;
                ctx.strokeStyle = connColor + '1)';
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
              }
            }
          }
        }
      }
    }
    ctx.restore();
  }

  // --- Mouse proximity highlight ---
  function drawMouseGlow(){
    if(mouseX < -500 || mouseY < -500) return;
    ctx.save();
    const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, MOUSE_RADIUS * 0.7);
    gradient.addColorStop(0, 'rgba(220, 45, 45, 0.03)');
    gradient.addColorStop(0.5, 'rgba(22, 163, 74, 0.02)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, MOUSE_RADIUS * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // --- Main loop ---
  function resize(){
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Scale particle count with screen area
    particleCount = Math.min(
      Math.max(Math.floor((W * H) / 14000), 30),
      PARTICLE_COUNT_BASE
    );

    // Adjust particle array
    while(particles.length < particleCount){
      particles.push(new Particle());
    }
    while(particles.length > particleCount){
      particles.pop();
    }
  }

  function draw(){
    ctx.clearRect(0, 0, W, H);
    drawMouseGlow();
    drawConnections();
    for(const p of particles){
      p.draw();
    }
  }

  function tick(){
    for(const p of particles){
      p.update();
    }
    draw();
    rafId = requestAnimationFrame(tick);
  }

  // --- Event listeners (on document so they work through pointer-events:none) ---
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  document.addEventListener('mouseleave', () => {
    mouseX = -9999;
    mouseY = -9999;
  });

  // Touch support
  document.addEventListener('touchmove', (e) => {
    if(e.touches.length > 0){
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
    }
  }, { passive: true });

  document.addEventListener('touchend', () => {
    mouseX = -9999;
    mouseY = -9999;
  });

  window.addEventListener('resize', () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    resize();
    if(reduceMotion) draw();
  });

  // --- Init ---
  resize();
  if(reduceMotion){
    draw();
  } else {
    tick();
  }
})();