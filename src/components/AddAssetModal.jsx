import React, { useState } from 'react';
import { X, Plus, Clock, DollarSign, RefreshCw } from 'lucide-react';

export default function AddAssetModal({ assets, usdToIdr, onClose, onAddHolding }) {
  const [selectedSymbol, setSelectedSymbol] = useState(assets[0]?.symbol || 'BBCA');
  const targetAsset = assets.find(a => a.symbol === selectedSymbol) || assets[0];

  // Date & Time field (Default to current local date & time: YYYY-MM-DDTHH:mm)
  const [transactionDateTime, setTransactionDateTime] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  });

  // Purchase Currency mode (IDR vs USD) - Useful for Nanovest users!
  const [inputCurrencyMode, setInputCurrencyMode] = useState(targetAsset?.currency || 'IDR');

  const [quantity, setQuantity] = useState(1);
  const [buyPriceInput, setBuyPriceInput] = useState(() => {
    if (!targetAsset) return 1000;
    return targetAsset.currency === 'USD' ? targetAsset.price : targetAsset.price;
  });

  // When symbol changes, adjust default input currency and price
  const handleSymbolChange = (sym) => {
    setSelectedSymbol(sym);
    const found = assets.find(a => a.symbol === sym);
    if (found) {
      const mode = found.currency;
      setInputCurrencyMode(mode);
      setBuyPriceInput(found.price);
    }
  };

  // When input currency mode toggles (IDR <-> USD) for US stocks/Nanovest
  const handleToggleCurrencyMode = (mode) => {
    if (mode === inputCurrencyMode) return;
    setInputCurrencyMode(mode);
    if (mode === 'IDR' && targetAsset.currency === 'USD') {
      // Convert USD price to IDR for Nanovest input
      setBuyPriceInput(Math.round(buyPriceInput * (usdToIdr || 17830)));
    } else if (mode === 'USD' && targetAsset.currency === 'USD') {
      // Convert back to USD
      setBuyPriceInput(parseFloat((buyPriceInput / (usdToIdr || 17830)).toFixed(2)));
    }
  };

  // Financial calculations
  const rawPrice = Number(buyPriceInput) || 0;
  const rawQty = Number(quantity) || 0;
  const totalCostInput = rawPrice * rawQty;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Calculate normalized avgPrice in original asset currency
    let effectiveAvgPrice = rawPrice;
    if (inputCurrencyMode === 'IDR' && targetAsset.currency === 'USD') {
      effectiveAvgPrice = rawPrice / (usdToIdr || 17830);
    } else if (inputCurrencyMode === 'USD' && targetAsset.currency === 'IDR') {
      effectiveAvgPrice = rawPrice * (usdToIdr || 17830);
    }

    // Format readable timestamp (e.g. "11 Aug 2026, 17:00")
    const d = new Date(transactionDateTime);
    const formattedTime = d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    onAddHolding({
      symbol: targetAsset.symbol,
      currency: targetAsset.currency,
      inputCurrency: inputCurrencyMode,
      inputBuyPrice: rawPrice,
      quantity: rawQty,
      avgPrice: effectiveAvgPrice,
      timestamp: formattedTime
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#F1F5F9' }}>Catat Beli / Tambah Aset</h3>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Catat riwayat pembelian beserta tanggal, jam & mata uang</div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          
          {/* Tanggal & Jam Transaksi */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Clock size={14} color="var(--color-green)" /> Tanggal & Jam Beli / Catatan
            </label>
            <input
              type="datetime-local"
              value={transactionDateTime}
              onChange={(e) => setTransactionDateTime(e.target.value)}
              className="input font-mono"
              style={{ fontSize: '13px' }}
            />
          </div>

          {/* Asset Dropdown */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Pilih Aset</label>
            <select
              value={selectedSymbol}
              onChange={(e) => handleSymbolChange(e.target.value)}
              className="input"
              style={{ fontSize: '14px', fontWeight: '700' }}
            >
              <optgroup label="🇮🇩 Saham Indonesia (IDX)">
                {assets.filter(a => a.category === 'SAHAM_INDO').map(a => (
                  <option key={a.symbol} value={a.symbol}>{a.symbol} - {a.name} (Rp)</option>
                ))}
              </optgroup>

              <optgroup label="🇺🇸 Saham US & ETF (Nanovest / Global)">
                {assets.filter(a => a.category === 'SAHAM_US').map(a => (
                  <option key={a.symbol} value={a.symbol}>{a.symbol} - {a.name} ($ USD / Rp)</option>
                ))}
              </optgroup>

              <optgroup label="🪙 Crypto">
                {assets.filter(a => a.category === 'CRYPTO').map(a => (
                  <option key={a.symbol} value={a.symbol}>{a.symbol} - {a.name}</option>
                ))}
              </optgroup>

              <optgroup label="🥇 Emas">
                {assets.filter(a => a.category === 'EMAS').map(a => (
                  <option key={a.symbol} value={a.symbol}>{a.symbol} - {a.name} (Rp/gram)</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Input Currency Switcher for Nanovest US Stocks / Global Assets */}
          {targetAsset?.category === 'SAHAM_US' && (
            <div style={{ marginBottom: '16px', background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                💡 Mode Pembelian (Cocok untuk aplikasi seperti <strong>Nanovest</strong>):
              </div>
              <div className="tab-group">
                <button
                  type="button"
                  className={`tab-btn ${inputCurrencyMode === 'IDR' ? 'active' : ''}`}
                  onClick={() => handleToggleCurrencyMode('IDR')}
                  style={{ flex: 1, fontWeight: '700' }}
                >
                  🇮🇩 Beli Pakai Rupiah (IDR - Nanovest)
                </button>
                <button
                  type="button"
                  className={`tab-btn ${inputCurrencyMode === 'USD' ? 'active' : ''}`}
                  onClick={() => handleToggleCurrencyMode('USD')}
                  style={{ flex: 1, fontWeight: '700' }}
                >
                  🇺🇸 Beli Pakai Dollar (USD)
                </button>
              </div>
            </div>
          )}

          {/* Buy Price */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Harga Beli Rata-Rata ({inputCurrencyMode === 'IDR' ? 'Rupiah / Rp' : 'Dollar / $'})
            </label>
            <input
              type="number"
              step="any"
              value={buyPriceInput}
              onChange={(e) => setBuyPriceInput(e.target.value)}
              className="input font-mono"
              style={{ fontSize: '15px', fontWeight: '700' }}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Harga Live Pasar Saat Ini: {targetAsset?.currency === 'IDR' ? `Rp ${targetAsset?.price.toLocaleString('id-ID')}` : `$${targetAsset?.price}`} 
              {targetAsset?.currency === 'USD' && ` (≈ Rp ${Math.round(targetAsset?.price * (usdToIdr || 17830)).toLocaleString('id-ID')})`}
            </div>
          </div>

          {/* Quantity */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Jumlah ({targetAsset?.unitLabel || 'Unit'})
            </label>
            <input
              type="number"
              step="any"
              min="0.0001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input font-mono"
              style={{ fontSize: '15px', fontWeight: '700' }}
            />
          </div>

          {/* Cost Summary Box */}
          <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>Total Modal Pembelian:</span>
              <span className="font-mono" style={{ fontWeight: '800', color: 'var(--color-green)' }}>
                {inputCurrencyMode === 'IDR' ? `Rp ${Math.round(totalCostInput).toLocaleString('id-ID')}` : `$${totalCostInput.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              </span>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '44px', fontSize: '14px', fontWeight: '800' }}>
            <Plus size={16} /> Simpan Catatan Pembelian
          </button>

        </form>

      </div>
    </div>
  );
}
