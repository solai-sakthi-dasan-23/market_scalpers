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
  const y = document.getElementById('year');
  if(y) y.textContent = new Date().getFullYear();
});

// ============ Nav: active link, scroll style, mobile toggle ============
function initNav(){
  const nav = document.getElementById('siteNav');
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if(!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
  });

  if(toggle && links){
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }

  const page = document.body.getAttribute('data-page');
  if(page){
    const active = nav.querySelector(`[data-nav="${page}"]`);
    if(active) active.classList.add('active');
  }
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
