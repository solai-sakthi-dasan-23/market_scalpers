// Live-ish market ticker for Market Scalpers
// Sources: CoinGecko (crypto, free/no-key), gold-api.com (XAU/XAG, free/no-key),
// frankfurter.app (FX majors, free/no-key, ECB reference rates).
// Falls back to static sample data if a source is unreachable (offline/blocked network),
// so the ticker never breaks the page.

const FALLBACK_DATA = [
  { sym:'XAUUSD', px:2418.30, chg:0.42 },
  { sym:'XAGUSD', px:28.74, chg:-0.18 },
  { sym:'BTCUSD', px:64230, chg:1.85 },
  { sym:'ETHUSD', px:3180, chg:2.10 },
  { sym:'EURUSD', px:1.0842, chg:-0.05 },
  { sym:'GBPUSD', px:1.2701, chg:0.11 },
  { sym:'USDJPY', px:156.42, chg:0.22 },
  { sym:'USDINR', px:83.51, chg:0.03 },
];

async function fetchCrypto(){
  try{
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true');
    const data = await res.json();
    return [
      { sym:'BTCUSD', px:data.bitcoin.usd, chg:data.bitcoin.usd_24h_change },
      { sym:'ETHUSD', px:data.ethereum.usd, chg:data.ethereum.usd_24h_change },
    ];
  }catch(e){ return null; }
}

async function fetchMetals(){
  try{
    const [xau, xag] = await Promise.all([
      fetch('https://api.gold-api.com/price/XAU').then(r=>r.json()),
      fetch('https://api.gold-api.com/price/XAG').then(r=>r.json()),
    ]);
    return [
      { sym:'XAUUSD', px:xau.price, chg:null },
      { sym:'XAGUSD', px:xag.price, chg:null },
    ];
  }catch(e){ return null; }
}

async function fetchFX(){
  try{
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,JPY,INR');
    const data = await res.json();
    return [
      { sym:'EURUSD', px: +(1/data.rates.EUR).toFixed(4), chg:null },
      { sym:'GBPUSD', px: +(1/data.rates.GBP).toFixed(4), chg:null },
      { sym:'USDJPY', px: +data.rates.JPY.toFixed(2), chg:null },
      { sym:'USDINR', px: +data.rates.INR.toFixed(2), chg:null },
    ];
  }catch(e){ return null; }
}

function renderTicker(items){
  const track = document.getElementById('tickerTrack');
  if(!track) return;
  const row = items.map(i => {
    const hasChg = typeof i.chg === 'number';
    const cls = hasChg ? (i.chg >= 0 ? 'up' : 'down') : '';
    const arrow = hasChg ? (i.chg >= 0 ? '▲' : '▼') : '';
    const chgTxt = hasChg ? `<span class="chg ${cls}">${arrow} ${Math.abs(i.chg).toFixed(2)}%</span>` : '';
    const decimals = i.px < 10 ? 4 : i.px > 1000 ? 2 : 2;
    return `<div class="ticker-item"><span class="sym">${i.sym}</span><span class="px">${i.px.toLocaleString(undefined,{maximumFractionDigits:decimals})}</span>${chgTxt}</div>`;
  }).join('');
  // duplicate content for seamless loop
  track.innerHTML = row + row;
}

async function initTicker(){
  const [crypto, metals, fx] = await Promise.all([fetchCrypto(), fetchMetals(), fetchFX()]);
  let live = [...(metals||[]), ...(crypto||[]), ...(fx||[])];

  if(live.length === 0){
    renderTicker(FALLBACK_DATA);
    const note = document.getElementById('tickerNote');
    if(note) note.textContent = 'Showing sample data — live feed unavailable right now.';
    return;
  }
  // merge with fallback for any source that failed, so the strip always looks complete
  const bySym = Object.fromEntries(live.map(i => [i.sym, i]));
  const merged = FALLBACK_DATA.map(f => bySym[f.sym] || f);
  renderTicker(merged);
}

document.addEventListener('DOMContentLoaded', () => {
  if(document.getElementById('tickerTrack')){
    initTicker();
    setInterval(initTicker, 60000); // refresh every 60s
  }
});
