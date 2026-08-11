import React, { useState } from 'react';
import { X, Zap, ShieldCheck, AlertCircle } from 'lucide-react';

export default function OrderModal({ stock, initialType = 'BUY', portfolio, onClose, onExecuteOrder }) {
  const [orderType, setOrderType] = useState(initialType); // BUY or SELL
  const [executionType, setExecutionType] = useState('MARKET'); // MARKET or LIMIT
  const [quantity, setQuantity] = useState(1); // Lots for IDX, Shares for US
  const [limitPrice, setLimitPrice] = useState(stock ? stock.price : 0);

  if (!stock) return null;

  const isIDX = stock.market === 'IDX';
  const priceToUse = executionType === 'MARKET' ? stock.price : limitPrice;
  const sharesCount = isIDX ? quantity * 100 : quantity;
  const rawCost = priceToUse * sharesCount;
  const fee = rawCost * 0.0015; // 0.15% transaction fee
  const totalCost = orderType === 'BUY' ? rawCost + fee : rawCost - fee;

  const hasEnoughCash = orderType === 'BUY' ? portfolio.cashBalance >= totalCost : true;

  // Find current holdings for sell check
  const holding = portfolio.holdings.find(h => h.symbol === stock.symbol);
  const maxSellShares = holding ? holding.shares : 0;
  const maxSellLots = isIDX ? Math.floor(maxSellShares / 100) : maxSellShares;
  const canSell = orderType === 'SELL' ? (isIDX ? quantity <= maxSellLots : quantity <= maxSellShares) : true;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (orderType === 'BUY' && !hasEnoughCash) return;
    if (orderType === 'SELL' && !canSell) return;

    onExecuteOrder({
      symbol: stock.symbol,
      market: stock.market,
      currency: stock.currency,
      type: orderType,
      executionType,
      shares: sharesCount,
      price: priceToUse,
      totalCost
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Execution Order: <span style={{ color: orderType === 'BUY' ? 'var(--color-green)' : 'var(--color-red)' }}>{stock.symbol}</span>
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{stock.name} • Live: Rp {stock.price.toLocaleString('id-ID')}</div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          
          {/* BUY / SELL Switcher */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setOrderType('BUY')}
              style={{
                padding: '10px',
                borderRadius: '6px',
                fontWeight: '800',
                border: 'none',
                cursor: 'pointer',
                background: orderType === 'BUY' ? 'var(--color-green)' : 'var(--bg-secondary)',
                color: orderType === 'BUY' ? '#000' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              🟢 BUY (BELI)
            </button>

            <button
              type="button"
              onClick={() => setOrderType('SELL')}
              style={{
                padding: '10px',
                borderRadius: '6px',
                fontWeight: '800',
                border: 'none',
                cursor: 'pointer',
                background: orderType === 'SELL' ? 'var(--color-red)' : 'var(--bg-secondary)',
                color: orderType === 'SELL' ? '#FFF' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              🔴 SELL (JUAL)
            </button>
          </div>

          {/* Execution Type: Market vs Limit */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Order Type</label>
            <div className="tab-group">
              <button
                type="button"
                className={`tab-btn ${executionType === 'MARKET' ? 'active' : ''}`}
                onClick={() => setExecutionType('MARKET')}
                style={{ flex: 1 }}
              >
                Market Order (Instant)
              </button>
              <button
                type="button"
                className={`tab-btn ${executionType === 'LIMIT' ? 'active' : ''}`}
                onClick={() => setExecutionType('LIMIT')}
                style={{ flex: 1 }}
              >
                Limit Order
              </button>
            </div>
          </div>

          {/* Limit Price Input if Limit Order */}
          {executionType === 'LIMIT' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Limit Price</label>
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(Number(e.target.value))}
                className="input font-mono"
              />
            </div>
          )}

          {/* Quantity Input */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
              <label style={{ color: 'var(--text-muted)' }}>
                {isIDX ? 'Jumlah (Lot)' : 'Jumlah Shares'}
              </label>
              {orderType === 'SELL' && (
                <span style={{ color: 'var(--color-cyan)', cursor: 'pointer' }} onClick={() => setQuantity(maxSellLots || 1)}>
                  Max Sell: {maxSellLots} Lot ({maxSellShares} lembar)
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="input font-mono"
                style={{ fontSize: '16px', fontWeight: '700' }}
              />
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 5, 10, 50].map(val => (
                  <button
                    key={val}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setQuantity(val)}
                  >
                    +{val}
                  </button>
                ))}
              </div>
            </div>
            {isIDX && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                1 Lot = 100 lembar saham = {sharesCount.toLocaleString()} lembar
              </div>
            )}
          </div>

          {/* Financial Cost Calculation Box */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              <span>Estimasi Nilai Transaksi:</span>
              <span className="font-mono" style={{ color: '#FFF' }}>Rp {rawCost.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <span>Broker Fee (0.15%):</span>
              <span className="font-mono">Rp {fee.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '6px 0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '800' }}>
              <span style={{ color: '#FFF' }}>Total Estimasi Dana:</span>
              <span className="font-mono" style={{ color: orderType === 'BUY' ? 'var(--color-green)' : 'var(--color-red)' }}>
                Rp {totalCost.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Warnings */}
          {orderType === 'BUY' && !hasEnoughCash && (
            <div style={{ padding: '10px', background: 'var(--color-red-bg)', border: '1px solid var(--color-red)', borderRadius: '6px', color: 'var(--color-red)', fontSize: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} /> Saldo simulator tidak mencukupi (Tersedia: Rp {portfolio.cashBalance.toLocaleString('id-ID')}).
            </div>
          )}

          {orderType === 'SELL' && !canSell && (
            <div style={{ padding: '10px', background: 'var(--color-red-bg)', border: '1px solid var(--color-red)', borderRadius: '6px', color: 'var(--color-red)', fontSize: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} /> Anda tidak memiliki cukup saham {stock.symbol} untuk dijual.
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className={`btn ${orderType === 'BUY' ? 'btn-primary' : 'btn-danger'}`}
            disabled={orderType === 'BUY' ? !hasEnoughCash : !canSell}
            style={{ width: '100%', height: '44px', fontSize: '15px', fontWeight: '800' }}
          >
            <Zap size={16} />
            Konfirmasi {orderType === 'BUY' ? 'Pembelian' : 'Penjualan'} ({stock.symbol})
          </button>

        </form>
      </div>
    </div>
  );
}
