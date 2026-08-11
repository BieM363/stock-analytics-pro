import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Header from './components/Header';
import Watchlist from './components/Watchlist';
import GoogleFinanceChart from './components/GoogleFinanceChart';
import PortfolioSimulator from './components/PortfolioSimulator';
import AddAssetModal from './components/AddAssetModal';
import { CheckCircle2 } from 'lucide-react';

const SAMPLE_PRESET_HOLDINGS = [
  { symbol: 'BBCA', quantity: 5, avgPrice: 6225, currency: 'IDR' },    // 5 Lot BBCA (Harga Real 6.225)
  { symbol: 'BBRI', quantity: 10, avgPrice: 3070, currency: 'IDR' },   // 10 Lot BBRI
  { symbol: 'VOO', quantity: 2, avgPrice: 710.65, currency: 'USD' },   // 2 Shares VOO ETF
  { symbol: 'BTC', quantity: 0.05, avgPrice: 64050.00, currency: 'USD' }, // 0.05 BTC
  { symbol: 'EMAS', quantity: 10, avgPrice: 1395000, currency: 'IDR' }  // 10 Gram Emas
];

export default function App() {
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [usdToIdr, setUsdToIdr] = useState(17830);
  const [displayCurrency, setDisplayCurrency] = useState('IDR');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('market'); // 'market' or 'portfolio'
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Portfolio state
  const [portfolio, setPortfolio] = useState(() => {
    const saved = localStorage.getItem('google_finance_portfolio');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { holdings: SAMPLE_PRESET_HOLDINGS };
  });

  useEffect(() => {
    localStorage.setItem('google_finance_portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  // Connect WebSockets
  useEffect(() => {
    const socket = io('http://localhost:3000', { reconnectionAttempts: 5, timeout: 3000 });

    socket.on('initial_data', (data) => {
      setAssets(data.assets || []);
      if (data.assets && data.assets.length > 0) {
        setSelectedAsset(prev => prev ? data.assets.find(a => a.symbol === prev.symbol) || data.assets[0] : data.assets[0]);
      }
      if (data.usdToIdr) setUsdToIdr(data.usdToIdr);
    });

    socket.on('asset_tick', (tick) => {
      setAssets(prevList => {
        return prevList.map(item => {
          if (item.symbol === tick.symbol) {
            const updated = {
              ...item,
              price: tick.price,
              change: tick.change,
              changePercent: tick.changePercent,
              high: tick.high,
              low: tick.low,
              lastUpdated: Date.now()
            };
            if (item.candles && item.candles.length > 0) {
              const candles = [...item.candles];
              candles[candles.length - 1].close = tick.price;
              candles[candles.length - 1].high = Math.max(candles[candles.length - 1].high, tick.price);
              candles[candles.length - 1].low = Math.min(candles[candles.length - 1].low, tick.price);
              updated.candles = candles;
            }
            return updated;
          }
          return item;
        });
      });

      if (tick.usdToIdr) setUsdToIdr(tick.usdToIdr);
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (!selectedAsset || assets.length === 0) return;
    const current = assets.find(a => a.symbol === selectedAsset.symbol);
    if (current) setSelectedAsset(current);
  }, [assets]);

  const showToast = (msg) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const handleAddHolding = (holding) => {
    setPortfolio(prev => {
      const existingIdx = prev.holdings.findIndex(h => h.symbol === holding.symbol);
      let updated = [...prev.holdings];
      if (existingIdx >= 0) {
        const cur = updated[existingIdx];
        const totalQty = cur.quantity + holding.quantity;
        const avgPrice = ((cur.quantity * cur.avgPrice) + (holding.quantity * holding.avgPrice)) / totalQty;
        updated[existingIdx] = { ...cur, quantity: totalQty, avgPrice };
      } else {
        updated.push(holding);
      }
      return { ...prev, holdings: updated };
    });
    showToast(`Posisi ${holding.symbol} (${holding.quantity}) berhasil ditambahkan!`);
  };

  const handleRemoveHolding = (symbol) => {
    setPortfolio(prev => ({
      ...prev,
      holdings: prev.holdings.filter(h => h.symbol !== symbol)
    }));
    showToast(`Aset ${symbol} dihapus dari portofolio.`);
  };

  const handleResetPortfolio = () => {
    if (window.confirm('Kosongkan semua aset dari portofolio Anda?')) {
      setPortfolio({ holdings: [] });
      showToast('Portofolio berhasil dikosongkan.');
    }
  };

  const handleLoadSamplePortfolio = () => {
    setPortfolio({ holdings: SAMPLE_PRESET_HOLDINGS });
    showToast('Sampel portofolio (Saham, VOO ETF, BTC, Emas) berhasil dimuat!');
  };

  let totalValIDR = 0;
  let totalCostIDR = 0;
  portfolio.holdings.forEach(h => {
    const liveAsset = assets.find(a => a.symbol === h.symbol) || { price: h.avgPrice };
    const curVal = (liveAsset.price || h.avgPrice) * h.quantity;
    const costVal = h.avgPrice * h.quantity;
    totalValIDR += h.currency === 'USD' ? curVal * usdToIdr : curVal;
    totalCostIDR += h.currency === 'USD' ? costVal * usdToIdr : costVal;
  });
  const totalPnL = totalValIDR - totalCostIDR;

  return (
    <div className="app-container">
      
      {/* Header */}
      <Header
        usdToIdr={usdToIdr}
        displayCurrency={displayCurrency}
        setDisplayCurrency={setDisplayCurrency}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        portfolioSummary={{ totalValIDR, totalPnL }}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Main Layout */}
      {activeTab === 'market' ? (
        <div className="google-layout">
          
          {/* Main Area: Clean Line Chart */}
          <div style={{ minHeight: '520px' }}>
            <GoogleFinanceChart
              asset={selectedAsset || assets[0]}
              usdToIdr={usdToIdr}
              displayCurrency={displayCurrency}
            />
          </div>

          {/* Right Area: Watchlist */}
          <div style={{ height: 'calc(100vh - 160px)', position: 'sticky', top: '90px' }}>
            <Watchlist
              assets={assets}
              selectedAsset={selectedAsset}
              onSelectAsset={setSelectedAsset}
              searchQuery={searchQuery}
              usdToIdr={usdToIdr}
              displayCurrency={displayCurrency}
            />
          </div>

        </div>
      ) : (
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '20px', width: '100%' }}>
          <PortfolioSimulator
            portfolio={portfolio}
            assets={assets}
            usdToIdr={usdToIdr}
            displayCurrency={displayCurrency}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onRemoveHolding={handleRemoveHolding}
            onResetPortfolio={handleResetPortfolio}
            onLoadSamplePortfolio={handleLoadSamplePortfolio}
          />
        </div>
      )}

      {/* Add Asset Modal */}
      {isAddModalOpen && (
        <AddAssetModal
          assets={assets}
          usdToIdr={usdToIdr}
          onClose={() => setIsAddModalOpen(false)}
          onAddHolding={handleAddHolding}
        />
      )}

      {/* Toast Notifications */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 9999 }}>
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              padding: '12px 18px',
              borderRadius: '8px',
              background: 'var(--bg-card)',
              border: '1px solid var(--color-green)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              color: '#F1F5F9',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <CheckCircle2 size={18} color="var(--color-green)" />
            {t.msg}
          </div>
        ))}
      </div>

    </div>
  );
}
