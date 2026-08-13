export const DEFAULT_ASSETS_CONFIG = [
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

export function generateCandles(basePrice, count = 90) {
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

export function getDefaultAssets() {
  return DEFAULT_ASSETS_CONFIG.map(cfg => ({
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
    candles: generateCandles(cfg.defaultPrice, 90),
    lastUpdated: Date.now()
  }));
}
