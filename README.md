<<<<<<< HEAD
# Satoshi Calculator

A sleek, Apple-style Bitcoin dashboard with calculators, charts, portfolio tracking, news, and more.  
Built for SEO + AdSense readiness.

---

## 🚀 Features
- **Live BTC Prices** with fallback API chain.
- **BTC / Sats / Fiat Converter**.
- **Profit Calculator**.
- **DCA Calculator** (exact calendar intervals).
- **Portfolio Tracker** (localStorage + CSV export).
- **TradingView Chart** (intervals: 15m → 1y) with Chart.js fallback.
- **Latest Bitcoin News** with proxy & fallback chain.
- **Fun Facts & Wisdom Tickers** (20+ each).
- **Cookie Consent Bar** (accept / reject / ×).
- **Dark/Light Themes** (system detect + toggle).
- **Responsive Layout** (hamburger menu, mobile-first).
- **SEO-optimized** with JSON-LD structured data.
- **WCAG compliant** colors + accessibility.

---

## 🌐 APIs & Data Sources

### Prices / Market Data
1. [CoinGecko](https://www.coingecko.com/en/api) → primary live + history.  
   - `simple/price`, `market_chart` endpoints.
2. [Binance](https://binance-docs.github.io/apidocs/) → fallback BTC/USDT.  
3. [Kraken](https://docs.kraken.com/rest/) → fallback BTC/USD ticker.  
4. [CryptoCompare](https://min-api.cryptocompare.com/) → fallback (API key optional).  
5. [CoinMarketCap](https://coinmarketcap.com/api/) → fallback (requires key).

### Fiat Conversion
- **Handled by CoinGecko**, fallback possible with Open Exchange Rates / CurrencyLayer (not wired by default).

### Charts
- [TradingView](https://www.tradingview.com/widget/) widget (interactive).  
- [Chart.js](https://www.chartjs.org/) fallback with CoinGecko data.

### News
1. [CoinDesk RSS](https://www.coindesk.com/arc/outboundfeeds/rss/)  
2. [CoinTelegraph RSS](https://cointelegraph.com/rss)  
3. Fallbacks:  
   - [CryptoControl API](https://cryptocontrol.io/) (optional key).  
   - [NewsAPI](https://newsapi.org/) (optional key).  
   - [Reddit RSS](https://www.reddit.com/r/Bitcoin/.rss).

### On-chain Data (future-ready, not integrated yet)
- [BlockCypher](https://www.blockcypher.com/dev/bitcoin/)  
- [Blockstream](https://blockstream.info/api/)  
- [SoChain](https://chain.so/api)

---

## 🛠️ Usage

### Run Locally
1. Clone project or copy files.
2. Place all assets in the same directory:
   - `index.html`, `styles.css`, `main.js`
   - Logos: `bitcoin.png`, `mexc.png`, `coinbase.png`, `kucoin.png`, `binance.png`, `kraken.png`
   - `robots.txt`, `sitemap.xml`
3. Open `index.html` in browser (works offline for UI, APIs fetch live data).

### Deploy
- **Netlify / Vercel / Cloudflare Pages** → drag & drop repo or connect Git.  
- Works on any static host (GitHub Pages, S3, etc.).

---

## 📈 SEO & AdSense

- **SEO**:
  - Title/meta optimized for Bitcoin calculator/converter queries.
  - JSON-LD structured data for FAQ + Organization.
  - `robots.txt` + `sitemap.xml` included.

- **AdSense Readiness**:
  1. Add your Google AdSense script in `<head>` of `index.html`.
  2. Verify domain ownership in AdSense dashboard.
  3. Deploy live → wait for approval.
  4. Ads will auto-inject or you can add `<ins class="adsbygoogle">` manually.

---

## 🎨 Design System

### Colors
- **Light Mode**:
  - Background: `#ffffff`
  - Text: `#111111`
  - Muted: `#666666`
  - Cards: `#ffffff`
  - Borders: `#e9e9e9`
  - Accent: BTC Orange `#F7931A`
- **Dark Mode**:
  - Background: `#121212`
  - Text: `#f0f0f0`
  - Muted: `#aaaaaa`
  - Cards: `#1e1e1e`
  - Borders: `#2c2c2c`
  - Accent: `#F7931A`

### Typography
- Font: **Inter** + system fallbacks.
- H1: clamp(28px–40px), H2: ~22px, Body: ~15.5px, Small: ~13.5px.
- Clear hierarchy + consistent line-height.

### Spacing
- Cards: 24px padding, 22px margin between.
- Form grid: 14px gap.
- Consistent radii (`16px` cards, `12px` small elements, pill buttons).

---

## 📦 File Structure
=======
# Satoshi-Calculator
>>>>>>> 9fbc08103126d074c4f573ed39d258d668d0543a
