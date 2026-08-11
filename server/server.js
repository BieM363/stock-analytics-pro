import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// USD to IDR live exchange rate (default 16,250 until fetched)
let usdToIdr = 16250;

// ==========================================
// REDIS CACHE MANAGER
// ==========================================
class RedisCacheManager {
  constructor() {
    this.store = new Map();
    this.hits = 0;
    this.misses = 0;
  }
  set(key, value, ttlSeconds = 300) {
    this.store.set(key, { value, expireAt: Date.now() + ttlSeconds * 1000 });
  }
  get(key) {
    const item = this.store.get(key);
    if (!item) { this.misses++; return null; }
    if (Date.now() > item.expireAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return item.value;
  }
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? ((this.hits / total) * 100).toFixed(1) : '100.0';
    return { keysCount: this.store.size, hits: this.hits, misses: this.misses, hitRate: `${hitRate}%` };
  }
}

const redisCache = new RedisCacheManager();

// ==========================================
// 19 ASSETS CONFIG WITH YAHOO SYMBOL MAPPING
// ==========================================
const ASSETS_CONFIG = [
  // --- Saham Indonesia (IDX) ---
  { symbol: 'BBCA', yahooSymbol: 'BBCA.JK', name: 'Bank Central Asia Tbk', category: 'SAHAM_INDO', defaultPrice: 6225, currency: 'IDR', unitLabel: 'Lot' },
  { symbol: 'BBRI', yahooSymbol: 'BBRI.JK', name: 'Bank Rakyat Indonesia Tbk', category: 'SAHAM_INDO', defaultPrice: 3070, currency: 'IDR', unitLabel: 'Lot' },
  { symbol: 'BMRI', yahooSymbol: 'BMRI.JK', name: 'Bank Mandiri Tbk', category: 'SAHAM_INDO', defaultPrice: 4850, currency: 'IDR', unitLabel: 'Lot' },
  { symbol: 'TLKM', yahooSymbol: 'TLKM.JK', name: 'Telkom Indonesia Tbk', category: 'SAHAM_INDO', defaultPrice: 2940, currency: 'IDR', unitLabel: 'Lot' },
  { symbol: 'ADRO', yahooSymbol: 'ADRO.JK', name: 'Adaro Energy Indonesia Tbk', category: 'SAHAM_INDO', defaultPrice: 3680, currency: 'IDR', unitLabel: 'Lot' },
  { symbol: 'JPFA', yahooSymbol: 'JPFA.JK', name: 'Japfa Comfeed Indonesia Tbk', category: 'SAHAM_INDO', defaultPrice: 1540, currency: 'IDR', unitLabel: 'Lot' },
  { symbol: 'KLBF', yahooSymbol: 'KLBF.JK', name: 'Kalbe Farma Tbk', category: 'SAHAM_INDO', defaultPrice: 1685, currency: 'IDR', unitLabel: 'Lot' },

  // --- Saham Luar & ETF (US) ---
  { symbol: 'VOO', yahooSymbol: 'VOO', name: 'Vanguard S&P 500 ETF', category: 'SAHAM_US', defaultPrice: 710.65, currency: 'USD', unitLabel: 'Shares' },
  { symbol: 'QQQM', yahooSymbol: 'QQQM', name: 'Invesco NASDAQ 100 ETF', category: 'SAHAM_US', defaultPrice: 204.80, currency: 'USD', unitLabel: 'Shares' },
  { symbol: 'SCHD', yahooSymbol: 'SCHD', name: 'Schwab U.S. Dividend Equity ETF', category: 'SAHAM_US', defaultPrice: 82.35, currency: 'USD', unitLabel: 'Shares' },
  { symbol: 'NVDA', yahooSymbol: 'NVDA', name: 'NVIDIA Corporation', category: 'SAHAM_US', defaultPrice: 128.50, currency: 'USD', unitLabel: 'Shares' },
  { symbol: 'AAPL', yahooSymbol: 'AAPL', name: 'Apple Inc.', category: 'SAHAM_US', defaultPrice: 224.30, currency: 'USD', unitLabel: 'Shares' },
  { symbol: 'JPM', yahooSymbol: 'JPM', name: 'JPMorgan Chase & Co.', category: 'SAHAM_US', defaultPrice: 218.60, currency: 'USD', unitLabel: 'Shares' },
  { symbol: 'GOOGL', yahooSymbol: 'GOOGL', name: 'Alphabet Inc. (Google)', category: 'SAHAM_US', defaultPrice: 165.20, currency: 'USD', unitLabel: 'Shares' },

  // --- Crypto ---
  { symbol: 'BTC', yahooSymbol: 'BTC-USD', name: 'Bitcoin / USD', category: 'CRYPTO', defaultPrice: 64050.00, currency: 'USD', unitLabel: 'BTC' },
  { symbol: 'ETH', yahooSymbol: 'ETH-USD', name: 'Ethereum / USD', category: 'CRYPTO', defaultPrice: 3480.00, currency: 'USD', unitLabel: 'ETH' },
  { symbol: 'SOL', yahooSymbol: 'SOL-USD', name: 'Solana / USD', category: 'CRYPTO', defaultPrice: 154.20, currency: 'USD', unitLabel: 'SOL' },
  { symbol: 'TRX', yahooSymbol: 'TRX-USD', name: 'TRON / USD', category: 'CRYPTO', defaultPrice: 0.1345, currency: 'USD', unitLabel: 'TRX' },

  // --- Emas (Gold) ---
  { symbol: 'EMAS', yahooSymbol: 'GC=F', name: 'Emas Batangan (Gold / IDR)', category: 'EMAS', defaultPrice: 1395000, currency: 'IDR', unitLabel: 'Gram' }
];

const assetsMap = new Map();

// Helper to generate initial historical series
function generateSeries(basePrice, count = 90) {
  const points = [];
  let current = basePrice * 0.90;
  const now = Date.now();
  const step = 60 * 1000;

  for (let i = count; i >= 0; i--) {
    const time = now - i * step;
    const changePct = (Math.random() - 0.49) * 0.006;
    current = Math.max(0.0001, current * (1 + changePct));

    points.push({
      time: Math.floor(time / 1000),
      price: parseFloat(current.toFixed(current > 100 ? 2 : 4)),
      open: parseFloat((current * 0.999).toFixed(2)),
      high: parseFloat((current * 1.002).toFixed(2)),
      low: parseFloat((current * 0.998).toFixed(2)),
      close: parseFloat(current.toFixed(2)),
      volume: Math.floor(Math.random() * 8000) + 1000
    });
  }
  return points;
}

// Initialize Map
ASSETS_CONFIG.forEach(cfg => {
  const assetObj = {
    symbol: cfg.symbol,
    yahooSymbol: cfg.yahooSymbol,
    name: cfg.name,
    category: cfg.category,
    price: cfg.defaultPrice,
    prevClose: cfg.defaultPrice,
    change: 0,
    changePercent: 0,
    high: cfg.defaultPrice * 1.01,
    low: cfg.defaultPrice * 0.99,
    volume: 15000,
    currency: cfg.currency,
    unitLabel: cfg.unitLabel,
    candles: generateSeries(cfg.defaultPrice, 90),
    lastUpdated: Date.now()
  };
  assetsMap.set(cfg.symbol, assetObj);
  redisCache.set(`asset:${cfg.symbol}`, assetObj, 600);
});

// Function to fetch REAL LIVE DATA from Yahoo Finance
async function fetchRealMarketData() {
  console.log('🔄 [Live Market Data] Fetching real-time quotes from Yahoo Finance...');
  
  // 1. Fetch USD to IDR rate
  try {
    const usdQuote = await yf.quote('USDIDR=X');
    if (usdQuote && usdQuote.regularMarketPrice) {
      usdToIdr = Math.round(usdQuote.regularMarketPrice);
      console.log(`💵 [Rate Live] 1 USD = Rp ${usdToIdr.toLocaleString('id-ID')}`);
    }
  } catch (err) {
    console.warn('USD/IDR fetch warning:', err.message);
  }

  // 2. Fetch all 19 assets
  for (const cfg of ASSETS_CONFIG) {
    try {
      const quote = await yf.quote(cfg.yahooSymbol);
      if (quote && quote.regularMarketPrice) {
        const asset = assetsMap.get(cfg.symbol);
        let livePrice = quote.regularMarketPrice;
        let prevClose = quote.regularMarketPreviousClose || quote.regularMarketPrice;

        // Emas conversion from Gold Futures (USD/oz) to IDR/gram
        if (cfg.symbol === 'EMAS') {
          // 1 troy ounce = 31.1034768 grams
          const pricePerGramUSD = livePrice / 31.1034768;
          livePrice = Math.round(pricePerGramUSD * usdToIdr);
          prevClose = Math.round((prevClose / 31.1034768) * usdToIdr);
        }

        const change = parseFloat((livePrice - prevClose).toFixed(2));
        const changePercent = prevClose > 0 ? parseFloat(((change / prevClose) * 100).toFixed(2)) : 0;

        asset.price = livePrice;
        asset.prevClose = prevClose;
        asset.change = change;
        asset.changePercent = changePercent;
        asset.high = quote.regularMarketDayHigh || Math.max(asset.high, livePrice);
        asset.low = quote.regularMarketDayLow || Math.min(asset.low, livePrice);
        asset.volume = quote.regularMarketVolume || asset.volume;
        asset.lastUpdated = Date.now();

        // Update latest candle
        if (asset.candles && asset.candles.length > 0) {
          const last = asset.candles[asset.candles.length - 1];
          last.close = livePrice;
          last.high = Math.max(last.high, livePrice);
          last.low = Math.min(last.low, livePrice);
        }

        redisCache.set(`asset:${cfg.symbol}`, asset, 600);

        // Emit socket tick
        io.emit('asset_tick', {
          symbol: cfg.symbol,
          price: livePrice,
          change,
          changePercent,
          high: asset.high,
          low: asset.low,
          usdToIdr,
          timestamp: Date.now()
        });
      }
    } catch (err) {
      console.warn(`Warning fetching ${cfg.symbol} (${cfg.yahooSymbol}):`, err.message);
    }
  }
}

// Initial fetch on start
fetchRealMarketData();

// Interval to re-fetch live market data every 20 seconds
setInterval(fetchRealMarketData, 20000);

// Micro fluctuation tick every 1.5s for seamless UI interactivity
setInterval(() => {
  const symbolList = Array.from(assetsMap.keys());
  const randomSymbol = symbolList[Math.floor(Math.random() * symbolList.length)];
  const asset = assetsMap.get(randomSymbol);

  const pctChange = (Math.random() - 0.495) * 0.002;
  const oldPrice = asset.price;
  let newPrice = oldPrice * (1 + pctChange);

  if (asset.currency === 'IDR') {
    if (asset.symbol === 'EMAS') newPrice = Math.round(newPrice / 1000) * 1000;
    else if (newPrice > 500) newPrice = Math.round(newPrice / 10) * 10;
  } else {
    newPrice = parseFloat(newPrice.toFixed(newPrice < 1 ? 4 : 2));
  }

  asset.price = newPrice;
  asset.change = parseFloat((newPrice - asset.prevClose).toFixed(2));
  asset.changePercent = asset.prevClose > 0 ? parseFloat(((asset.change / asset.prevClose) * 100).toFixed(2)) : 0;
  asset.lastUpdated = Date.now();

  io.emit('asset_tick', {
    symbol: randomSymbol,
    price: newPrice,
    change: asset.change,
    changePercent: asset.changePercent,
    high: asset.high,
    low: asset.low,
    usdToIdr,
    timestamp: Date.now()
  });

}, 1500);

// REST API Endpoints
app.get('/api/assets', (req, res) => {
  res.json({ assets: Array.from(assetsMap.values()), usdToIdr, cacheStats: redisCache.getStats() });
});

app.get('/api/assets/:symbol', (req, res) => {
  const asset = assetsMap.get(req.params.symbol.toUpperCase());
  if (!asset) return res.status(404).json({ error: 'Asset not found' });
  res.json({ asset, usdToIdr });
});

io.on('connection', (socket) => {
  console.log(`[StockAnalytics Engine] Client connected: ${socket.id}`);
  socket.emit('initial_data', {
    assets: Array.from(assetsMap.values()),
    usdToIdr,
    cacheStats: redisCache.getStats()
  });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 [StockAnalytics Engine] Live Server running on http://localhost:${PORT}`);
  console.log(`📡 Fetching real-time market data from Yahoo Finance for 19 assets & USD/IDR`);
});
