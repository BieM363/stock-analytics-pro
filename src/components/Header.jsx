import React from 'react';
import { Search, Globe, Plus, Wallet, TrendingUp, BarChart2 } from 'lucide-react';

export default function Header({
  usdToIdr,
  displayCurrency,
  setDisplayCurrency,
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  portfolioSummary,
  onOpenAddModal
}) {
  return (
    <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 100 }}>
      
      {/* Top App Bar */}
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setActiveTab('market')}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #00C853 0%, #00E676 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '18px',
              color: '#0B0E14',
              boxShadow: '0 0 16px rgba(0, 200, 83, 0.3)'
            }}>
              <TrendingUp size={22} strokeWidth={2.8} />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#F1F5F9', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                StockAnalytics <span style={{ color: '#00C853', fontSize: '10px', padding: '1px 6px', background: 'var(--color-green-bg)', borderRadius: '4px', border: '1px solid rgba(0,200,83,0.3)' }}>EMERALD</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Real-Time Stock & Portfolio Simulator</div>
            </div>
          </div>

          <div style={{ width: '1px', height: '22px', background: 'var(--border-color)' }}></div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('market')}
              style={{
                background: activeTab === 'market' ? 'var(--color-green-bg)' : 'transparent',
                color: activeTab === 'market' ? 'var(--color-green)' : 'var(--text-secondary)',
                border: activeTab === 'market' ? '1px solid rgba(0,200,83,0.4)' : '1px solid transparent',
                padding: '6px 14px',
                borderRadius: '6px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <BarChart2 size={15} /> Pasar & Asset (19)
            </button>

            <button
              onClick={() => setActiveTab('portfolio')}
              style={{
                background: activeTab === 'portfolio' ? 'var(--color-green-bg)' : 'transparent',
                color: activeTab === 'portfolio' ? 'var(--color-green)' : 'var(--text-secondary)',
                border: activeTab === 'portfolio' ? '1px solid rgba(0,200,83,0.4)' : '1px solid transparent',
                padding: '6px 14px',
                borderRadius: '6px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Wallet size={15} /> Portofolio PnL Saya
            </button>
          </div>
        </div>

        {/* Controls: Search, Currency Switch, Add Position */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* Search Bar */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Cari (e.g. BBCA, VOO, BTC)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{ paddingLeft: '32px', height: '34px', fontSize: '12px' }}
            />
          </div>

          {/* Currency Toggle (IDR vs USD) */}
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '2px' }}>
            <button
              onClick={() => setDisplayCurrency('IDR')}
              style={{
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: '800',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                background: displayCurrency === 'IDR' ? 'var(--color-green)' : 'transparent',
                color: displayCurrency === 'IDR' ? '#0B0E14' : 'var(--text-muted)'
              }}
            >
              IDR (Rp)
            </button>
            <button
              onClick={() => setDisplayCurrency('USD')}
              style={{
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: '800',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                background: displayCurrency === 'USD' ? 'var(--color-green)' : 'transparent',
                color: displayCurrency === 'USD' ? '#0B0E14' : 'var(--text-muted)'
              }}
            >
              USD ($)
            </button>
          </div>

          {/* USD/IDR Rate Pill */}
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', padding: '4px 8px', background: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
            $1 = Rp {usdToIdr ? usdToIdr.toLocaleString('id-ID') : '17.830'}
          </div>

          {/* Add Asset Button */}
          <button className="btn btn-primary" onClick={onOpenAddModal} style={{ height: '34px', padding: '0 14px' }}>
            <Plus size={16} /> Tambah Ke Portofolio
          </button>

        </div>

      </div>

      {/* Market Overview Ticker Bar */}
      <div style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', padding: '6px 20px', overflowX: 'auto' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', gap: '24px', fontSize: '12px', whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>IHSG:</span>
            <span className="font-mono" style={{ fontWeight: '700', color: '#F1F5F9' }}>7,420.50</span>
            <span style={{ color: 'var(--color-green)', fontWeight: '700' }}>+0.45%</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>S&P 500:</span>
            <span className="font-mono" style={{ fontWeight: '700', color: '#F1F5F9' }}>5,580.20</span>
            <span style={{ color: 'var(--color-green)', fontWeight: '700' }}>+0.62%</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Bitcoin:</span>
            <span className="font-mono" style={{ fontWeight: '700', color: '#F1F5F9' }}>$64,050</span>
            <span style={{ color: 'var(--color-green)', fontWeight: '700' }}>+2.30%</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Gold (Emas):</span>
            <span className="font-mono" style={{ fontWeight: '700', color: '#F1F5F9' }}>Rp 1.395.000/g</span>
            <span style={{ color: 'var(--color-green)', fontWeight: '700' }}>+0.50%</span>
          </div>
        </div>
      </div>

    </header>
  );
}
