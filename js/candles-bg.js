// ============================================================
// Market Scalpers — Bull/Bear Market Canvas Animation
// A more expressive candlestick board with glowing price trails,
// moving grid, and bold red/green momentum.
// ============================================================
(function(){
  const canvas = document.getElementById('candlesBg');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');

  const CANDLE_W = 16;
  const GAP = 10;
  const STEP = CANDLE_W + GAP;
  const SPEED = 0.85;
  const WICK_W = 1.8;
  const GRID_SPACING = 76;

  const colorUp = () => getComputedStyle(document.documentElement).getPropertyValue('--green-500').trim() || '#16A34A';
  const colorDown = () => getComputedStyle(document.documentElement).getPropertyValue('--red-500').trim() || '#DC2D2D';
  const gridColor = () => getComputedStyle(document.documentElement).getPropertyValue('--line-1').trim() || 'rgba(17, 24, 39, .14)';

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W, H, candles = [], offset = 0, lastPrice = 0.54, rafId = null;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize(){
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    buildSeries();
  }

  function buildSeries(){
    candles = [];
    const count = Math.ceil(W / STEP) + 14;
    lastPrice = 0.5;
    for(let i = 0; i < count; i++) candles.push(nextCandle());
  }

  function nextCandle(){
    const momentum = (Math.random() - 0.5) * 0.18;
    const open = lastPrice;
    let close = open + momentum + (Math.random() - 0.5) * 0.05;
    close = Math.max(0.06, Math.min(0.94, close));
    const high = Math.max(open, close) + Math.random() * 0.06;
    const low = Math.min(open, close) - Math.random() * 0.06;
    lastPrice = close;
    return { open, close, high: Math.min(high, 0.98), low: Math.max(low, 0.02) };
  }

  function drawGrid(){
    ctx.save();
    ctx.globalAlpha = 0.24;
    ctx.strokeStyle = gridColor();
    ctx.lineWidth = 1;

    for(let x = 0; x <= W; x += GRID_SPACING){
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    for(let y = 0; y <= H; y += GRID_SPACING){
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(17,24,39,.08)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.28);
    ctx.lineTo(W, H * 0.28);
    ctx.moveTo(0, H * 0.62);
    ctx.lineTo(W, H * 0.62);
    ctx.stroke();
    ctx.restore();
  }

  function drawCandles(){
    const baseY = H * 0.14;
    const spanY = H * 0.78;
    ctx.save();
    ctx.translate(-offset, 0);

    for(let i = 0; i < candles.length; i++){
      const x = i * STEP;
      if(x - offset < -STEP*4 || x - offset > W + STEP*4) continue;
      const c = candles[i];
      const yOpen = baseY + (1 - c.open) * spanY;
      const yClose = baseY + (1 - c.close) * spanY;
      const yHigh = baseY + (1 - c.high) * spanY;
      const yLow = baseY + (1 - c.low) * spanY;
      const up = c.close >= c.open;
      const color = up ? colorUp() : colorDown();
      const glow = up ? 'rgba(22,163,74,.24)' : 'rgba(220,45,45,.24)';

      ctx.globalAlpha = 0.24;
      ctx.fillStyle = glow;
      const top = Math.min(yOpen, yClose);
      const height = Math.max(Math.abs(yClose - yOpen), 4);
      ctx.fillRect(x - 4, top - 4, CANDLE_W + 8, height + 8);

      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = WICK_W;
      ctx.beginPath();
      ctx.moveTo(x + CANDLE_W * 0.5, yHigh);
      ctx.lineTo(x + CANDLE_W * 0.5, yLow);
      ctx.stroke();

      ctx.fillStyle = up ? 'rgba(22,163,74,.42)' : 'rgba(220,45,45,.42)';
      ctx.fillRect(x, top, CANDLE_W, height);
      ctx.strokeRect(x + 0.5, top + 0.5, CANDLE_W - 1, height - 1);
    }
    ctx.restore();
  }

  function drawTrace(){
    const baseY = H * 0.14;
    const spanY = H * 0.78;
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(17,24,39,.28)';
    ctx.beginPath();

    for(let i = 0; i < candles.length; i++){
      const x = i * STEP - offset + CANDLE_W * 0.5;
      const value = (candles[i].open + candles[i].close) * 0.5;
      const y = baseY + (1 - value) * spanY;
      if(i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(17,24,39,.14)';
    for(let i = 0; i < candles.length; i += 12){
      const x = i * STEP - offset + CANDLE_W * 0.5;
      const value = (candles[i].open + candles[i].close) * 0.5;
      const y = baseY + (1 - value) * spanY;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function draw(){
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    drawCandles();
    drawTrace();
  }

  function tick(){
    offset += SPEED;
    if(offset >= STEP){
      offset -= STEP;
      candles.shift();
      candles.push(nextCandle());
    }
    draw();
    rafId = requestAnimationFrame(tick);
  }

  window.addEventListener('resize', () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    resize();
    if(reduceMotion) draw();
  });

  resize();
  if(reduceMotion){
    draw();
  } else {
    tick();
  }
})();