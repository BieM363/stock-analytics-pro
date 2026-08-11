import React, { useState } from 'react';
import { Star, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';

export default function Watchlist({
  assets,
  selectedAsset,
  onSelectAsset,
  searchQuery,
  usdToIdr,
  displayCurrency
}) {
  const [activeCategory, setActiveCategory] = useState('ALL');

  const filteredAssets = assets.filter(item => {
    const matchSearch = searchQuery === '' ||
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;

    if (activeCategory === 'SAHAM_INDO') return item.category === 'SAHAM_INDO';
    if (activeCategory === 'SAHAM_US') return item.category === 'SAHAM_US';
    if (activeCategory === 'CRYPTO') return item.category === 'CRYPTO';
    if (activeCategory === 'EMAS') return item.category === 'EMAS';
    return true;
  });

  const formatPrice = (val, origCurr) => {
    if (displayCurrency === 'IDR') {
      const idrVal = origCurr === 'USD' ? val * (usdToIdr || 16250) : val;
      return `Rp ${Math.round(idrVal).toLocaleString('id-ID')}`;
    } else {
      const usdVal = origCurr === 'IDR' ? val / (usdToIdr || 16250) : val;
      return `$${usdVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
    }
  };

  return (
    <div className="google-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0', overflow: 'hidden' }}>
      
      {/* Category Pills Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ fontWeight: '700', fontSize: '14px', color: '#E8EAED', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Star size={16} fill="var(--color-amber)" color="var(--color-amber)" />
            Daftar Aset ({filteredAssets.length})
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-green)' }}></span> Live
          </span>
        </div>

        {/* Categories Pills */}
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'ALL', label: 'Semua (19)' },
            { id: 'SAHAM_INDO', label: 'Saham Indo (7)' },
            { id: 'SAHAM_US', label: 'Saham US (7)' },
            { id: 'CRYPTO', label: 'Crypto (4)' },
            { id: 'EMAS', label: 'Emas (1)' }
          ].map(c => (
            <button
              key={c.id}
              className={`pill ${activeCategory === c.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(c.id)}
              style={{ padding: '3px 9px', fontSize: '11px', whiteSpace: 'nowrap' }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Asset List Rows */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredAssets.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            Tidak ada aset ditemukan.
          </div>
        ) : (
          filteredAssets.map(item => {
            const isSelected = selectedAsset && selectedAsset.symbol === item.symbol;
            const isGain = item.change >= 0;
            const isUpdated = item.lastUpdated && Date.now() - item.lastUpdated < 1000;

            return (
              <div
                key={item.symbol}
                onClick={() => onSelectAsset(item)}
                className={isUpdated ? (isGain ? 'flash-up' : 'flash-down') : ''}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--bg-card-active)' : 'transparent',
                  borderLeft: isSelected ? '3px solid var(--color-google-blue)' : '3px solid transparent',
                  transition: 'background 0.15s ease'
                }}
              >
                {/* Ticker Symbol & Name */}
                <div style={{ minWidth: 0, paddingRight: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#E8EAED' }}>
                      {item.symbol}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '1px 5px', borderRadius: '3px' }}>
                      {item.currency}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </div>
                </div>

                {/* Price & Change Badge */}
                <div style={{ textAlign: 'right' }}>
                  <div className="font-mono" style={{ fontWeight: '700', fontSize: '13px', color: '#E8EAED' }}>
                    {formatPrice(item.price, item.currency)}
                  </div>
                  <div className={`badge ${isGain ? 'badge-green' : 'badge-red'}`} style={{ marginTop: '2px', fontSize: '10px' }}>
                    {isGain ? '+' : ''}{item.changePercent}%
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
