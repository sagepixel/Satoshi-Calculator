// ========= Helpers =========
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const fmt = (n, code='USD') => new Intl.NumberFormat(undefined, { style: 'currency', currency: code.toUpperCase() }).format(n);

// ========= Theme =========
const themeToggle = $('#themeToggle');
function setTheme(mode){
  if(mode==='dark'){ document.body.classList.add('dark'); themeToggle.textContent='Light Mode'; }
  else { document.body.classList.remove('dark'); themeToggle.textContent='Dark Mode'; }
}
setTheme('light');
themeToggle?.addEventListener('click', ()=> setTheme(document.body.classList.contains('dark') ? 'light' : 'dark'));

// ========= Navbar (hamburger + responsive tweaks) =========
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

navToggle?.addEventListener('click', () => {
  navLinks.classList.toggle('open');  // CSS .open handles display + layout

  // Update ARIA accessibility
  const expanded = navToggle.getAttribute('aria-expanded') === 'true' || false;
  navToggle.setAttribute('aria-expanded', !expanded);
});

// Handle resize between mobile <-> desktop
function handleResize() {
  if (window.innerWidth > 920) {
    navLinks.classList.add('open');   // always show on desktop
  } else {
    navLinks.classList.remove('open'); // reset on mobile
  }
}
window.addEventListener('resize', handleResize);
handleResize();

// ========= Scroll progress =========
const progressBar = $('#scrollProgress');
window.addEventListener('scroll', ()=>{
  const h = document.documentElement;
  const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight);
  progressBar.style.width = (scrolled * 100) + '%';
});

// ========= Fade-in animations =========
const fadeEls = $$('.fade-in');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, {threshold:0.1});
  fadeEls.forEach(el => io.observe(el));
}

// ========= Live BTC price (USD) with retry + fallbacks + cache =========
let rates = { usd: null };
const priceKey = 'last_price_usd';
const priceTimeKey = 'last_price_ts';

function setPriceUI(value, source = 'Cached'){
  $('#p_usd').textContent = fmt(value, 'USD');
  const t = new Date(parseInt(localStorage.getItem(priceTimeKey) || Date.now(), 10));
  $('#priceMeta').textContent = `Source: ${source} • Last update: ${t.toLocaleString()}`;
}

async function fetchWithTimeout(url, opts = {}, timeout = 4000){
  return Promise.race([ fetch(url, opts), new Promise((_, rej) => setTimeout(()=>rej(new Error('timeout')), timeout)) ]);
}

async function getPriceFromCoinGecko(){
  const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';
  const res = await fetchWithTimeout(url);
  const data = await res.json();
  if (!data.bitcoin || !data.bitcoin.usd) throw new Error('coingecko shape');
  return { price: data.bitcoin.usd, source: 'CoinGecko' };
}
async function getPriceFromBinance(){
  const url = 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT';
  const res = await fetchWithTimeout(url);
  const data = await res.json();
  const p = parseFloat(data.price);
  if (!Number.isFinite(p)) throw new Error('binance shape');
  return { price: p, source: 'Binance' };
}
async function getPriceFromKraken(){
  const url = 'https://api.kraken.com/0/public/Ticker?pair=XXBTZUSD';
  const res = await fetchWithTimeout(url);
  const data = await res.json();
  const first = data.result && Object.values(data.result)[0];
  const p = first && first.c && parseFloat(first.c[0]);
  if (!Number.isFinite(p)) throw new Error('kraken shape');
  return { price: p, source: 'Kraken' };
}

async function getRobustPrice(){
  const fns = [getPriceFromCoinGecko, getPriceFromBinance, getPriceFromKraken];
  for (const fn of fns){
    for (let attempt=1; attempt<=2; attempt++){
      try{
        const out = await fn();
        return out;
      }catch(e){
        console.warn('[price attempt failed]', fn.name, e);
      }
    }
  }
  throw new Error('All price sources failed');
}

function useCachedPriceIfAvailable(msg='Using last known price'){
  const cached = localStorage.getItem(priceKey);
  if (cached){
    rates.usd = parseFloat(cached);
    setPriceUI(rates.usd, msg);
    return true;
  }
  return false;
}

async function updatePriceLoop(){
  useCachedPriceIfAvailable('Cached');
  try{
    const { price, source } = await getRobustPrice();
    rates.usd = price;
    localStorage.setItem(priceKey, String(price));
    localStorage.setItem(priceTimeKey, String(Date.now()));
    setPriceUI(price, source);
  }catch(err){
    console.error('[price] all failed', err);
    if (!rates.usd) { $('#p_usd').textContent = '—'; $('#priceMeta').textContent = 'Trying to connect…'; }
  }
}
updatePriceLoop();
setInterval(updatePriceLoop, 5000);

// ========= Fiat selects (for tools) =========
const CURRENCIES = [
  { code:'usd', name:'USD', flag:'us' }, { code:'eur', name:'EUR', flag:'eu' },
  { code:'aud', name:'AUD', flag:'au' }, { code:'inr', name:'INR', flag:'in' },
  { code:'gbp', name:'GBP', flag:'gb' }, { code:'jpy', name:'JPY', flag:'jp' },
  { code:'pkr', name:'PKR', flag:'pk' }, { code:'rub', name:'RUB', flag:'ru' },
  { code:'mxn', name:'MXN', flag:'mx' }, { code:'ngn', name:'NGN', flag:'ng' },
  { code:'ars', name:'ARS', flag:'ar' }, { code:'try', name:'TRY', flag:'tr' },
  { code:'idr', name:'IDR', flag:'id' }, { code:'php', name:'PHP', flag:'ph' },
  { code:'vnd', name:'VND', flag:'vn' },
];
function populateFiatSelect(selectEl, flagEl){
  if (!selectEl) return;
  selectEl.innerHTML = '';
  CURRENCIES.forEach(c=>{
    const o = document.createElement('option'); o.value = c.code; o.textContent = c.name; selectEl.appendChild(o);
  });
  if (flagEl){
    const setFlag = ()=> {
      const found = CURRENCIES.find(x=>x.code===selectEl.value);
      if (found) flagEl.className = `fi fi-${found.flag}`;
    };
    selectEl.addEventListener('change', setFlag); setFlag();
  }
}
populateFiatSelect($('#fiatSelect'),  $('#fiatFlag'));
populateFiatSelect($('#profitFiat'),  $('#profitFlag'));
populateFiatSelect($('#dcaFiat'),     $('#dcaFlag'));
populateFiatSelect($('#pfFiat'),      $('#pfFlag'));
populateFiatSelect($('#emailFiat'),   $('#emailFlag'));

// ========= Converter (BTC/Sats/Fiat) =========
(() => {
  const btcInput   = $('#btcInput');
  const satsInput  = $('#satsInput');
  const fiatSelect = $('#fiatSelect');
  const convBtn    = $('#convertBtn');
  const convOut    = $('#convResult');

  const btcToSats = (btc) => Math.round((+btc || 0) * 100_000_000);
  const satsToBtc = (sats) => (+sats || 0) / 100_000_000;

  const fmtFiat = (n, code = 'USD') =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: code.toUpperCase() })
      .format(+n || 0);

  const PX_CACHE_KEY = 'btc_px_converter';
  const PX_TTL_MS    = 60 * 1000; // 60s

  async function refreshAllPrices() {
    const options = Array.from(fiatSelect.options).map(o => o.value.toLowerCase());
    const unique  = Array.from(new Set(options));
    if (!unique.length) return null;

    const vs      = unique.join(',');
    const url     = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${encodeURIComponent(vs)}`;
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data  = await res.json();
      const rates = (data && data.bitcoin) || {};
      localStorage.setItem(PX_CACHE_KEY, JSON.stringify({ t: Date.now(), rates }));
      return rates;
    } catch {
      return null;
    }
  }

  async function getBtcPriceFor(curCode) {
    const now = Date.now();
    try {
      const cached = JSON.parse(localStorage.getItem(PX_CACHE_KEY) || 'null');
      if (cached && (now - cached.t) < PX_TTL_MS && cached.rates?.[curCode]) {
        refreshAllPrices().catch(() => {});
        return cached.rates[curCode];
      }
    } catch {}

    const refreshed = await refreshAllPrices();
    if (refreshed?.[curCode]) return refreshed[curCode];

    try {
      const cached = JSON.parse(localStorage.getItem(PX_CACHE_KEY) || 'null');
      if (cached?.rates?.[curCode]) return cached.rates[curCode];
    } catch {}

    throw new Error('Price unavailable');
  }

  btcInput?.addEventListener('input', () => {
    const v = parseFloat(btcInput.value);
    satsInput.value = Number.isFinite(v) ? btcToSats(v) : '';
    convOut.textContent = '';
    convOut.classList.remove('show');
  });

  satsInput?.addEventListener('input', () => {
    const v = parseFloat(satsInput.value);
    btcInput.value = Number.isFinite(v) ? satsToBtc(v).toFixed(8) : '';
    convOut.textContent = '';
    convOut.classList.remove('show');
  });

  fiatSelect?.addEventListener('change', () => {
    convOut.textContent = '';
    convOut.classList.remove('show');
  });

  convBtn?.addEventListener('click', async () => {
    let btc = parseFloat(btcInput.value);
    if (!Number.isFinite(btc)) {
      const sats = parseFloat(satsInput.value);
      if (Number.isFinite(sats)) btc = satsToBtc(sats);
    }
    if (!Number.isFinite(btc) || btc <= 0) {
      convOut.textContent = 'Enter BTC or sats to convert.';
      convOut.classList.add('show');
      return;
    }

    const fiatCode = (fiatSelect.value || 'usd').toUpperCase();
    convOut.textContent = 'Converting…';
    convOut.classList.add('show');

    try {
      const px   = await getBtcPriceFor(fiatCode.toLowerCase());
      const sats = btcToSats(btc);
      const fiat = btc * px;

      convOut.innerHTML = `
        <span><strong>${btc.toFixed(8)}</strong> BTC</span>
        <span> = </span>
        <span><strong>${sats.toLocaleString()}</strong> sats</span>
        <span> = </span>
        <span><strong>${fmtFiat(fiat, fiatCode)}</strong></span>
      `;
      convOut.classList.add('show');
    } catch {
      try {
        const cur = fiatCode.toLowerCase();
        const cached = JSON.parse(localStorage.getItem(PX_CACHE_KEY) || 'null');
        if (cached?.rates?.[cur]) {
          const px   = cached.rates[cur];
          const sats = btcToSats(btc);
          const fiat = btc * px;
          convOut.innerHTML = `
            <span><strong>${btc.toFixed(8)}</strong> BTC</span>
            <span> = </span>
            <span><strong>${sats.toLocaleString()}</strong> sats</span>
            <span> = </span>
            <span><strong>${fmtFiat(fiat, fiatCode)}</strong></span>
            <small class="muted" style="display:block;margin-top:4px;">(Using last known price)</small>
          `;
          convOut.classList.add('show');
          return;
        }
      } catch {}
      convOut.textContent = 'Price temporarily unavailable. Please try again.';
      convOut.classList.add('show');
    }
  });

  refreshAllPrices().catch(() => {});
})();  

// ========= Profit =========
$('#profitForm')?.addEventListener('submit', (e)=>{
  e.preventDefault();
  const btc = parseFloat($('#holdBtc').value);
  const avg = parseFloat($('#avgBuy').value);
  const tgt = parseFloat($('#targetPrice').value);
  const cur = $('#profitFiat').value || 'usd';
  if (![btc,avg,tgt].every(Number.isFinite)) return;
  const invested  = btc * avg;
  const projected = btc * tgt;
  const profit    = projected - invested;
  $('#profitResult').innerHTML =
    `Invested: ${fmt(invested,cur)} · Projected: ${fmt(projected,cur)} · ` +
    `Profit: <span style="color:${profit>=0?'#138000':'#b00020'}">${fmt(profit,cur)}</span>`;
});

// ========= DCA (daily history) =========
$('#dcaForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const amount = parseFloat($('#dcaAmount').value);
  const months = parseInt($('#dcaDuration').value,10);
  const freq   = $('#dcaFrequency').value;  
  const cur    = ($('#dcaFiat').value || 'usd').toLowerCase();
  if (!Number.isFinite(amount) || !Number.isFinite(months)) return;

  try {
    const days = Math.max(1, months * 30);
    const url  = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=${cur}&days=${days}&interval=day`;
    const res  = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const prices = (data.prices||[]).map(p => ({ ts:p[0], price:p[1] }));
    if (!prices.length) throw new Error('no history');

    const stepDays = (freq === 'weekly') ? 7 : 30;
    let totalInvested=0, totalBTC=0, buys=0;
    for (let i = prices.length-1; i >= 0; i -= stepDays) {
      const price = prices[i].price;
      totalInvested += amount;
      totalBTC      += (amount / price);
      buys++;
    }

    const avgCost = totalInvested / totalBTC;
    const lastRate = rates[cur] || prices.at(-1)?.price || prices[0]?.price;
    const currentValue = totalBTC * lastRate;

    $('#dcaResult').innerHTML =
      `✅ Simulation complete<br>` +
      `Buys: ${buys} · Invested: ${fmt(totalInvested,cur)}<br>` +
      `BTC: ${totalBTC.toFixed(8)} · Avg Cost: ${fmt(avgCost,cur)}<br>` +
      `Current Value: ${fmt(currentValue,cur)}`;
  } catch(err) {
    console.error('[dca]', err);

    // 🔥 Fallback: approximate using only latest rate
    const lastRate = rates[cur] || rates['usd'] || 0;
    if (lastRate) {
      const invested = amount * months;
      const totalBTC = invested / lastRate;
      const current  = totalBTC * lastRate;

      $('#dcaResult').innerHTML =
        `⚠ Historical data unavailable — showing estimate.<br>` +
        `Invested: ${fmt(invested,cur)}<br>` +
        `BTC: ${totalBTC.toFixed(8)}<br>` +
        `Current Value: ${fmt(current,cur)}`;
    } else {
      $('#dcaResult').textContent = 'Unable to fetch any data at this time.';
    }
  }
});

// ========= Portfolio =========
function loadPF(){ try{return JSON.parse(localStorage.getItem('pf')||'[]')}catch{return[]} }
function savePF(rows){ localStorage.setItem('pf', JSON.stringify(rows)); }
function renderPF(){
  const rows = loadPF();
  const tbody = $('#pfBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  rows.forEach((r, idx)=>{
    const invested = r.btc * r.buy;
    const curRate  = rates[r.fiat] || rates.usd || 0;
    const current  = curRate ? r.btc * curRate : 0;
    const pl = current - invested;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.btc}</td>
      <td>${fmt(r.buy, r.fiat)}</td>
      <td>${r.fiat.toUpperCase()}</td>
      <td>${r.exchange || '-'}</td>
      <td>${fmt(invested, r.fiat)}</td>
      <td>${curRate ? fmt(current, r.fiat) : '—'}</td>
      <td style="color:${pl>=0 ? '#138000' : '#b00020'}">${curRate ? fmt(pl, r.fiat) : '—'}</td>
      <td><button class="btn-ghost small" data-del="${idx}">Remove</button></td>
    `;
    tbody.appendChild(tr);
  });
}
$('#pfForm')?.addEventListener('submit', (e)=>{
  e.preventDefault();
  const btc = parseFloat($('#pfBtc').value);
  const buy = parseFloat($('#pfBuy').value);
  const fiat= $('#pfFiat').value || 'usd';
  const ex  = $('#pfExchange').value.trim();
  if (!Number.isFinite(btc) || !Number.isFinite(buy)) return;
  const rows = loadPF(); rows.push({ btc:+btc.toFixed(8), buy:+buy.toFixed(2), fiat, exchange:ex });
  savePF(rows); renderPF(); e.target.reset();
});
$('#pfBody')?.addEventListener('click', (e)=>{
  const idx = e.target.getAttribute('data-del');
  if (idx !== null && idx !== undefined){
    const rows = loadPF(); rows.splice(+idx,1); savePF(rows); renderPF();
  }
});
$('#pfExport')?.addEventListener('click', ()=>{
  alert('Your CSV will download now.');
  const rows = loadPF();
  const csv = ['BTC,Buy Price,Currency,Exchange'].concat(
    rows.map(r => `${r.btc},${r.buy},${r.fiat.toUpperCase()},${r.exchange||''}`)
  ).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='portfolio.csv'; a.click();
  URL.revokeObjectURL(url);
});
$('#pfClear')?.addEventListener('click', ()=>{
  if (confirm('Clear all portfolio entries?')) { localStorage.removeItem('pf'); renderPF(); }
});
renderPF();

// ========= TradingView chart (lazy load) =========
let tvLoaded = false;
function injectTVScriptOnce(cb){
  if (window.TradingView) return cb();
  if (tvLoaded) return; tvLoaded = true;
  const s = document.createElement('script');
  s.src = 'https://s3.tradingview.com/tv.js';
  s.onload = cb;
  s.onerror = ()=>{ console.error('TradingView script failed'); $('#chartPlaceholder').textContent = 'Chart failed to load. Please refresh.'; };
  document.head.appendChild(s);
}
function initTradingView(){
  if (!window.TradingView) { console.warn('TradingView not ready'); return; }
  try{
    const placeholder = $('#chartPlaceholder');
    const containerId = 'tvChart';
    const hidePlaceholder = ()=>{ if (placeholder) placeholder.style.display='none'; };
    const mo = new MutationObserver(()=>{
      const iframe = document.querySelector(`#${containerId} iframe`);
      if (iframe){
        hidePlaceholder();
        iframe.addEventListener('load', hidePlaceholder, { once:true });
        mo.disconnect();
      }
    });
    mo.observe($('#tvChart'), { childList:true, subtree:true });

    new TradingView.widget({
      container_id: containerId,
      autosize: true,
      symbol: "COINBASE:BTCUSD",
      interval: "60",
      timezone: "Etc/UTC",
      theme: document.body.classList.contains('dark') ? "dark" : "light",
      style: "1",
      locale: "en",
      hide_side_toolbar: false,
      withdateranges: true,
      allow_symbol_change: false,
      calendar: true
    });

    setTimeout(hidePlaceholder, 6000);
  }catch(e){
    console.error('TradingView init error', e);
    $('#chartPlaceholder').textContent = 'Chart failed to load. Please refresh.';
  }
}
const chartSection = $('#chart');
if ('IntersectionObserver' in window){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if (entry.isIntersecting){
        injectTVScriptOnce(initTradingView);
        io.disconnect();
      }
    });
  }, { root:null, rootMargin:'200px', threshold:0.01 });
  io.observe(chartSection);
} else {
  injectTVScriptOnce(initTradingView);
}

// ========= News =========
async function loadNews(){
  const grid = $('#newsGrid');
  const feeds = [
    { src:'CoinDesk', url:'https://www.coindesk.com/arc/outboundfeeds/rss/' },
    { src:'CoinTelegraph', url:'https://cointelegraph.com/rss' }
  ];
  let items = [];
  for (const f of feeds){
    try{
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(f.url)}`);
      const data = await res.json();
      const xml = new DOMParser().parseFromString(data.contents, 'text/xml');
      xml.querySelectorAll('item').forEach(item=>{
        items.push({
          source: f.src,
          title: item.querySelector('title')?.textContent ?? '',
          link:  item.querySelector('link')?.textContent ?? '#'
        });
      });
    }catch(e){ console.warn('[news] feed failed', f.src, e); }
  }
  if (items.length){
    grid.innerHTML = '';
    items.slice(0,6).forEach(n=>{
      const card = document.createElement('div');
      card.className = 'news-card';
      card.innerHTML = `<div class="news-source">${n.source}</div><a href="${n.link}" target="_blank" rel="noopener">${n.title}</a>`;
      grid.appendChild(card);
    });
  }
}
loadNews();

// ========= Tickers =========
const FACTS = [
  '1 Bitcoin = 100,000,000 satoshis.',
  'Bitcoin supply is capped at 21M.',
  'First BTC purchase: 2 pizzas for 10,000 BTC (2010).',
  'Average block time is ~10 minutes.',
  'Block reward halves every ~4 years (210,000 blocks).',
  'Bitcoin whitepaper was published in 2008 by Satoshi Nakamoto.',
  'Miners secure the network by expending energy (PoW).',
  'If you lose your keys, your BTC is gone forever.',
  'Sats are great for micro-payments and tipping.',
  'BTC is divisible to 8 decimal places.',
  '“HODL” originated from a forum typo in 2013.',
  'El Salvador adopted BTC as legal tender in 2021.',
  'Lightning Network enables fast, cheap BTC payments.',
  'There will never be more than 21,000,000 BTC.',
  'Over time, emission decreases — scarcity increases.',
  'BTC is censorship-resistant money.',
  'Running a full node increases your sovereignty.',
  'Cold storage reduces theft risk.',
  'Seed phrases are human-readable backups of keys.',
  'Verify addresses carefully to avoid phishing.'
];
const WISDOM = [
  'Not your keys, not your crypto.',
  'Use a hardware wallet for long-term holdings.',
  'Enable 2FA (authenticator app, not SMS).',
  'Beware of phishing — verify URLs carefully.',
  'Keep seed phrase offline and never share it.',
  'Test small transactions before big ones.',
  'Back up your seed phrase in multiple secure places.',
  'Consider multisig for higher security.',
  'Stay educated — read the whitepaper.',
  'Security is a process, not a product.',
  'Beware of social engineering attacks.',
  'Update firmware on hardware wallets regularly.',
  'Use unique, strong passwords.',
  'Separate hot and cold funds.',
  'Check addresses via QR rather than manual typing.',
  'Keep OS and browsers updated.',
  'Avoid public Wi-Fi for sensitive actions.',
  'Use trusted wallets/exchanges only.',
  'Double-check fee settings before sending.',
  'If it sounds too good to be true, it is.'
];
function rotateList(el, arr, delay=5000){
  let i = 0;
  const render = () => { el.innerHTML = `<li>${arr[i % arr.length]}</li>`; i++; };
  render();
  setInterval(render, delay);
}
rotateList($('#factsList'), FACTS);
rotateList($('#wisdomList'), WISDOM);

// ========= Halving Countdown =========
(function(){
  const intervalBlocks = 210000;
  const avgBlockSec = 600; 
  const rewardStart = 50;
  const $reward = $('#currentReward');
  const $remain = $('#blocksRemaining');
  const $eta    = $('#halvingCountdown');
  let etaMs = null;

  function trimZeros(n){
    return n.toFixed(8).replace(/\.?0+$/,'');
  }
  function calcRewardForHeight(h){
    const halvings = Math.floor(h / intervalBlocks);
    return rewardStart * Math.pow(0.5, halvings);
  }
  function nextHalvingHeight(h){
    return Math.floor(h / intervalBlocks) * intervalBlocks + intervalBlocks;
  }
  async function fetchHeight(){
    try {
      const r1 = await fetch('https://blockchain.info/q/getblockcount?cors=true', { cache:'no-store' });
      const t1 = await r1.text();
      const n1 = parseInt(t1, 10);
      if (Number.isFinite(n1)) return n1;
    } catch(e){}
    try {
      const r2 = await fetch('https://blockstream.info/api/blocks/tip/height', { cache:'no-store' });
      const t2 = await r2.text();
      const n2 = parseInt(t2, 10);
      if (Number.isFinite(n2)) return n2;
    } catch(e){}
    throw new Error('Unable to fetch block height');
  }
  function renderCountdown(){
    if (etaMs == null) { $eta.textContent = '—'; return; }
    const msLeft = Math.max(0, etaMs - Date.now());
    const totalSec = Math.floor(msLeft / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    $eta.textContent = `${days}d ${String(hours).padStart(2,'0')}h ${String(mins).padStart(2,'0')}m`;
  }
  async function refreshHalving(){
    try{
      const h = await fetchHeight();
      const nxt = nextHalvingHeight(h);
      const blocksRemaining = Math.max(0, nxt - h);
      const rewardNow = calcRewardForHeight(h);
      etaMs = Date.now() + blocksRemaining * avgBlockSec * 1000;
      if ($reward) $reward.textContent = trimZeros(rewardNow);
      if ($remain) $remain.textContent = blocksRemaining.toLocaleString();
      renderCountdown();
    }catch(err){
      console.error('[halving]', err);
      if ($eta) $eta.textContent = 'Data unavailable';
    }
  }
  refreshHalving();
  setInterval(renderCountdown, 1000);
  setInterval(refreshHalving, 60 * 1000);
})();

// ========= Cookie bar =========
const cookieBar = $('#cookieBar');
if (cookieBar && sessionStorage.getItem('cookieChoice')) cookieBar.style.display = 'none';
$('#cookieAccept')?.addEventListener('click', ()=>{ sessionStorage.setItem('cookieChoice','accepted'); cookieBar.style.display='none'; });
$('#cookieReject')?.addEventListener('click', ()=>{ sessionStorage.setItem('cookieChoice','rejected'); cookieBar.style.display='none'; });
$('#cookieClose')?.addEventListener('click',  ()=>{ sessionStorage.setItem('cookieChoice','closed');   cookieBar.style.display='none'; });
