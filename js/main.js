// ============ Partial injection (nav + footer) ============
async function loadPartial(id, url){
  const host = document.getElementById(id);
  if(!host) return;
  try{
    const res = await fetch(url);
    host.innerHTML = await res.text();
  }catch(e){
    console.error('Partial load failed:', url, e);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    loadPartial('nav-mount', 'partials/nav.html'),
    loadPartial('footer-mount', 'partials/footer.html')
  ]);
  initNav();
  initReveal();
  initFAQ();
  initTestimonials();
  initCountdown();
  initCountUp();
  initGlassGlow();
  const y = document.getElementById('year');
  if(y) y.textContent = new Date().getFullYear();
});

// ============ Nav: split-tier, sliding indicator, bottom sheet ============
function initNav(){
  const nav = document.getElementById('siteNav');
  const toggle = document.getElementById('navToggle');
  const sheet = document.getElementById('navSheet');
  const backdrop = document.getElementById('navBackdrop');
  const indicator = document.getElementById('navIndicator');
  const navLinks = document.getElementById('navLinks');
  if(!nav) return;

  // --- Scroll merge: compact top bar, hide floating pill ---
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
    lastScroll = window.scrollY;
  });

  // --- Sliding indicator for desktop link pill ---
  function moveIndicator(targetEl){
    if(!indicator || !targetEl || !navLinks) return;
    const pillRect = navLinks.getBoundingClientRect();
    const linkRect = targetEl.getBoundingClientRect();
    const left = linkRect.left - pillRect.left;
    const width = linkRect.width;
    indicator.style.left = left + 'px';
    indicator.style.width = width + 'px';
    indicator.classList.add('visible');
  }

  function hideIndicator(){
    if(!indicator) return;
    // Only hide if no active link
    const active = navLinks?.querySelector('a.active');
    if(active){
      moveIndicator(active.parentElement || active);
    } else {
      indicator.classList.remove('visible');
    }
  }

  // Set indicator on active link initially
  const page = document.body.getAttribute('data-page');
  if(page){
    const activeDesktop = nav.querySelector(`.nav-links [data-nav="${page}"]`);
    if(activeDesktop){
      activeDesktop.classList.add('active');
      // Wait for layout to settle
      requestAnimationFrame(() => requestAnimationFrame(() => moveIndicator(activeDesktop)));
    }

    // Mark active in sheet links too
    const activeSheet = nav.querySelector(`.sheet-links [data-nav="${page}"]`);
    if(activeSheet) activeSheet.classList.add('active');
  }

  // Hover-follow indicator on desktop
  if(navLinks){
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('mouseenter', () => moveIndicator(link));
    });
    navLinks.addEventListener('mouseleave', hideIndicator);
  }

  // Recalculate indicator on resize
  window.addEventListener('resize', () => {
    const active = navLinks?.querySelector('a.active');
    if(active) moveIndicator(active);
  });

  // --- Mobile bottom sheet toggle ---
  let sheetOpen = false;

  function openSheet(){
    sheetOpen = true;
    sheet?.classList.add('open');
    backdrop?.classList.add('visible');
    toggle?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSheet(){
    sheetOpen = false;
    sheet?.classList.remove('open');
    backdrop?.classList.remove('visible');
    toggle?.classList.remove('active');
    document.body.style.overflow = '';
  }

  if(toggle){
    toggle.addEventListener('click', () => {
      if(sheetOpen) closeSheet();
      else openSheet();
    });
  }

  // Close on backdrop click
  backdrop?.addEventListener('click', closeSheet);

  // Close on link click in sheet
  sheet?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeSheet));

  // --- Swipe down to close ---
  let touchStartY = 0;
  let touchCurrentY = 0;
  let isSwiping = false;

  sheet?.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    isSwiping = true;
  }, { passive: true });

  sheet?.addEventListener('touchmove', (e) => {
    if(!isSwiping) return;
    touchCurrentY = e.touches[0].clientY;
    const diff = touchCurrentY - touchStartY;
    if(diff > 0){
      sheet.style.transform = `translateY(${diff}px)`;
    }
  }, { passive: true });

  sheet?.addEventListener('touchend', () => {
    if(!isSwiping) return;
    isSwiping = false;
    const diff = touchCurrentY - touchStartY;
    if(diff > 80){
      closeSheet();
    }
    // Reset transform (CSS transition handles the snap back)
    sheet.style.transform = '';
  });
}

// ============ Scroll reveal ============
function initReveal(){
  const items = document.querySelectorAll('.reveal');
  if(!items.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  items.forEach(i => io.observe(i));
}

// ============ FAQ accordion ============
function initFAQ(){
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if(!q || !a) return;
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      item.closest('.faq-list')?.querySelectorAll('.faq-item.open').forEach(o => {
        if(o !== item){ o.classList.remove('open'); o.querySelector('.faq-a').style.maxHeight = null; }
      });
      item.classList.toggle('open', !isOpen);
      a.style.maxHeight = !isOpen ? a.scrollHeight + 'px' : null;
    });
  });
}

// ============ Testimonial carousel ============
function initTestimonials(){
  const wrap = document.querySelector('.testi-wrap');
  if(!wrap) return;
  const track = wrap.querySelector('.testi-track');
  const cards = wrap.querySelectorAll('.testi-card');
  const nav = wrap.parentElement.querySelector('.testi-nav');
  const perView = window.innerWidth >= 760 ? 2 : 1;
  const pages = Math.ceil(cards.length / perView);
  let idx = 0;

  if(nav){
    nav.innerHTML = '';
    for(let i=0;i<pages;i++){
      const dot = document.createElement('button');
      dot.className = 'testi-dot' + (i===0 ? ' active' : '');
      dot.addEventListener('click', () => go(i));
      nav.appendChild(dot);
    }
  }

  function go(i){
    idx = (i + pages) % pages;
    track.style.transform = `translateX(-${idx * 100}%)`;
    nav?.querySelectorAll('.testi-dot').forEach((d,n) => d.classList.toggle('active', n===idx));
  }

  let auto = setInterval(() => go(idx+1), 6000);
  wrap.addEventListener('mouseenter', () => clearInterval(auto));
  wrap.addEventListener('mouseleave', () => auto = setInterval(() => go(idx+1), 6000));
}

// ============ Enrollment countdown ============
function initCountdown(){
  const el = document.getElementById('countdown');
  if(!el) return;
  const target = new Date(el.dataset.target).getTime();

  function tick(){
    const now = Date.now();
    let diff = target - now;
    if(diff < 0) diff = 0;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.querySelector('[data-u="d"]').textContent = String(d).padStart(2,'0');
    el.querySelector('[data-u="h"]').textContent = String(h).padStart(2,'0');
    el.querySelector('[data-u="m"]').textContent = String(m).padStart(2,'0');
    el.querySelector('[data-u="s"]').textContent = String(s).padStart(2,'0');
  }
  tick();
  setInterval(tick, 1000);
}

// ============ Animated count-up with digit scramble ============
function initCountUp(){
  const statNums = document.querySelectorAll('.stat-num[data-count-to]');
  if(!statNums.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        animateNumber(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  statNums.forEach(el => {
    // Store original display text so we can show it if animation is disabled
    el._originalText = el.textContent;
    io.observe(el);
  });

  function animateNumber(el){
    if(reduceMotion){
      el.classList.add('counted');
      return;
    }

    const target = parseFloat(el.dataset.countTo);
    const prefix = el.dataset.countPrefix || '';
    const suffix = el.dataset.countSuffix || '';
    const type = el.dataset.countType || 'number'; // number, percent, ratio, year
    const decimals = parseInt(el.dataset.countDecimals || '0');

    // Duration varies by type for non-uniform feel
    let duration;
    let easeFn;
    switch(type){
      case 'year':
        duration = 1800;
        easeFn = easeLinear;
        break;
      case 'percent':
        duration = 1400;
        easeFn = easeOutExpo;
        break;
      case 'ratio':
        duration = 600;
        easeFn = easeOutBack;
        break;
      case 'large':
        duration = 2000;
        easeFn = easeOutBounce;
        break;
      default:
        duration = 1200;
        easeFn = easeOutCubic;
    }

    el.classList.add('counting');

    // Scramble phase: show random digits briefly before counting
    const scrambleDuration = Math.min(duration * 0.2, 300);
    const scrambleChars = '0123456789';
    let scrambleStart = performance.now();

    function scramble(now){
      const elapsed = now - scrambleStart;
      if(elapsed < scrambleDuration){
        const displayLen = el._originalText.replace(/[^0-9]/g, '').length || 3;
        let scrambled = '';
        for(let i = 0; i < displayLen; i++){
          scrambled += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
        }
        el.textContent = prefix + scrambled + suffix;
        requestAnimationFrame(scramble);
      } else {
        // Start actual count-up
        startCount(el, target, prefix, suffix, type, decimals, duration - scrambleDuration, easeFn);
      }
    }

    requestAnimationFrame(scramble);
  }

  function startCount(el, target, prefix, suffix, type, decimals, duration, easeFn){
    const start = performance.now();
    // For ratios like "3:1", target is just the first number
    const isRatio = type === 'ratio';
    const ratioSuffix = el.dataset.countRatio || '';

    function tick(now){
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeFn(progress);
      const current = eased * target;

      let display;
      if(isRatio){
        display = prefix + Math.round(current) + ratioSuffix + suffix;
      } else if(type === 'year'){
        display = prefix + Math.round(current) + suffix;
      } else if(decimals > 0){
        display = prefix + current.toFixed(decimals) + suffix;
      } else {
        display = prefix + formatNumber(Math.round(current)) + suffix;
      }

      el.textContent = display;

      if(progress < 1){
        requestAnimationFrame(tick);
      } else {
        // Final value — ensure exact
        if(isRatio){
          el.textContent = prefix + target + ratioSuffix + suffix;
        } else if(type === 'year'){
          el.textContent = prefix + target + suffix;
        } else if(decimals > 0){
          el.textContent = prefix + target.toFixed(decimals) + suffix;
        } else {
          el.textContent = prefix + formatNumber(target) + suffix;
        }

        el.classList.remove('counting');
        el.classList.add('counted');

        // Remove glow effect after 2 seconds
        setTimeout(() => {
          el.style.textShadow = '';
        }, 2000);
      }
    }

    requestAnimationFrame(tick);
  }

  function formatNumber(n){
    return n.toLocaleString('en-IN');
  }

  // Easing functions for varied animation feel
  function easeLinear(t){ return t; }

  function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

  function easeOutExpo(t){ return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  function easeOutBack(t){
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function easeOutBounce(t){
    const n1 = 7.5625;
    const d1 = 2.75;
    if(t < 1 / d1){ return n1 * t * t; }
    else if(t < 2 / d1){ return n1 * (t -= 1.5 / d1) * t + 0.75; }
    else if(t < 2.5 / d1){ return n1 * (t -= 2.25 / d1) * t + 0.9375; }
    else { return n1 * (t -= 2.625 / d1) * t + 0.984375; }
  }
}

// ============ Glass card mouse-follow inner glow ============
function initGlassGlow(){
  document.querySelectorAll('.glass').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--glow-x', x + 'px');
      card.style.setProperty('--glow-y', y + 'px');
    });
  });

  // Re-init for dynamically loaded content (partials)
  const observer = new MutationObserver(() => {
    document.querySelectorAll('.glass:not([data-glow-init])').forEach(card => {
      card.setAttribute('data-glow-init', '1');
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--glow-x', x + 'px');
        card.style.setProperty('--glow-y', y + 'px');
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// ============ Contact form (client-side demo handling) ============
function handleContactForm(e){
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const original = btn.textContent;
  btn.textContent = 'Sending...';
  btn.disabled = true;
  setTimeout(() => {
    form.reset();
    btn.textContent = 'Message sent ✓';
    setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 2500);
  }, 900);
  return false;
}
