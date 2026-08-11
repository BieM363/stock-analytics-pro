import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function GoogleFinanceChart({ asset, usdToIdr, displayCurrency }) {
  const canvasRef = useRef(null);
  const [period, setPeriod] = useState('1M');
  const [hoverPoint, setHoverPoint] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !asset || !asset.candles || asset.candles.length === 0) return;
    const ctx = canvas.getContext('2d');

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    let candles = [...asset.candles];
    if (period === '1D') candles = candles.slice(-25);
    else if (period === '5D') candles = candles.slice(-45);
    else if (period === '1M') candles = candles.slice(-65);

    const prices = candles.map(c => c.price || c.close || asset.price);
    const minPrice = Math.min(...prices) * 0.998;
    const maxPrice = Math.max(...prices) * 1.002;
    const priceRange = maxPrice - minPrice || 1;

    const mainH = height - 30;

    const getY = (price) => mainH - ((price - minPrice) / priceRange) * mainH + 10;
    const getX = (i) => (i / (candles.length - 1)) * (width - 60) + 10;

    const isGain = asset.change >= 0;
    const strokeColor = isGain ? '#00C853' : '#FF3B30';

    // Grid lines & Axis
    ctx.strokeStyle = '#212B3B';
    ctx.lineWidth = 0.6;
    for (let i = 0; i <= 3; i++) {
      const y = (mainH / 3) * i + 10;
      const priceVal = maxPrice - (priceRange / 3) * i;
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(width - 55, y);
      ctx.stroke();

      ctx.fillStyle = '#64748B';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(
        asset.currency === 'IDR' ? priceVal.toFixed(0) : priceVal.toFixed(2),
        width - 50,
        y + 3
      );
    }

    // Line Path
    ctx.beginPath();
    candles.forEach((c, idx) => {
      const x = getX(idx);
      const y = getY(c.price || c.close || asset.price);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Area Fill Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, mainH);
    gradient.addColorStop(0, isGain ? 'rgba(0, 200, 83, 0.25)' : 'rgba(255, 59, 48, 0.25)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.lineTo(getX(candles.length - 1), mainH);
    ctx.lineTo(getX(0), mainH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

  }, [asset, period]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !asset || !asset.candles) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const index = Math.round((x / (rect.width - 60)) * (asset.candles.length - 1));

    if (index >= 0 && index < asset.candles.length) {
      setHoverPoint(asset.candles[index]);
    } else {
      setHoverPoint(null);
    }
  };

  if (!asset) return null;

  const isGain = asset.change >= 0;
  const currentPrice = hoverPoint ? (hoverPoint.price || hoverPoint.close) : asset.price;

  const formatPrice = (val, origCurr) => {
    if (displayCurrency === 'IDR') {
      const idrVal = origCurr === 'USD' ? val * (usdToIdr || 17830) : val;
      return `Rp ${Math.round(idrVal).toLocaleString('id-ID')}`;
    } else {
      const usdVal = origCurr === 'IDR' ? val / (usdToIdr || 17830) : val;
      return `$${usdVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
    }
  };

  return (
    <div className="google-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* Title & Price Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#F1F5F9' }}>{asset.symbol}</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{asset.name}</span>
            <span className="badge badge-green">{asset.category.replace('_', ' ')}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '6px' }}>
            <div className="font-mono" style={{ fontSize: '32px', fontWeight: '800', color: '#F1F5F9' }}>
              {formatPrice(currentPrice, asset.currency)}
            </div>
            <div className={`badge ${isGain ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '13px', padding: '3px 8px' }}>
              {isGain ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {isGain ? '+' : ''}{asset.change} ({isGain ? '+' : ''}{asset.changePercent}%)
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Mata uang asal: {asset.currency} • Real-time Stream
          </div>
        </div>

        {/* Timeframe Chips */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {['1D', '5D', '1M', '6M', '1Y', 'ALL'].map(p => (
            <button
              key={p}
              className={`pill ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Line Canvas Viewport */}
      <div style={{ flex: 1, minHeight: '340px', position: 'relative' }} onMouseLeave={() => setHoverPoint(null)}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
        />
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '12px' }}>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Rentang Hari Ini</div>
          <div className="font-mono" style={{ fontWeight: '700', color: '#F1F5F9' }}>
            {formatPrice(asset.low, asset.currency)} - {formatPrice(asset.high, asset.currency)}
          </div>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Harga Penutupan Lalu</div>
          <div className="font-mono" style={{ fontWeight: '700', color: '#F1F5F9' }}>
            {formatPrice(asset.prevClose, asset.currency)}
          </div>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Volume Perdagangan</div>
          <div className="font-mono" style={{ fontWeight: '700', color: '#F1F5F9' }}>
            {asset.volume ? asset.volume.toLocaleString() : '15,000'} {asset.unitLabel}
          </div>
        </div>
      </div>

    </div>
  );
}
