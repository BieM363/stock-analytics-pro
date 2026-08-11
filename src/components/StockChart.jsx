import React, { useState, useEffect, useRef } from 'react';
import { CandlestickChart, BarChart2, Activity, Layers, Maximize2, RefreshCw } from 'lucide-react';

export default function StockChart({ stock }) {
  const canvasRef = useRef(null);
  const [chartType, setChartType] = useState('CANDLE'); // 'CANDLE' or 'AREA'
  const [showSMA, setShowSMA] = useState(true);
  const [showRSI, setShowRSI] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [timeframe, setTimeframe] = useState('1D');
  const [hoverData, setHoverData] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !stock || !stock.candles || stock.candles.length === 0) return;
    const ctx = canvas.getContext('2d');

    // Handle HiDPI crisp rendering
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    // Filter candles based on timeframe
    let candles = [...stock.candles];
    if (timeframe === '1D') candles = candles.slice(-30);
    else if (timeframe === '1W') candles = candles.slice(-50);
    else if (timeframe === '1M') candles = candles.slice(-70);

    // Calculate dimensions
    const rsiHeight = showRSI ? 80 : 0;
    const volumeHeight = showVolume ? 60 : 0;
    const mainChartHeight = height - rsiHeight - volumeHeight - 30; // 30 for time axis

    // Calculate Min & Max for main chart
    const prices = candles.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...prices) * 0.998;
    const maxPrice = Math.max(...prices) * 1.002;
    const priceRange = maxPrice - minPrice || 1;

    const candleWidth = (width - 60) / candles.length;

    // Helper functions
    const getY = (price) => mainChartHeight - ((price - minPrice) / priceRange) * mainChartHeight;
    const getX = (index) => index * candleWidth + candleWidth / 2 + 10;

    // Grid lines & Price Axis
    ctx.strokeStyle = '#1E2738';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (mainChartHeight / 4) * i;
      const priceVal = maxPrice - (priceRange / 4) * i;
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(width - 50, y);
      ctx.stroke();

      ctx.fillStyle = '#64748B';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(
        stock.currency === 'IDR' ? priceVal.toFixed(0) : priceVal.toFixed(2),
        width - 45,
        y + 4
      );
    }

    // Render Candles or Area
    candles.forEach((c, i) => {
      const x = getX(i);
      const openY = getY(c.open);
      const closeY = getY(c.close);
      const highY = getY(c.high);
      const lowY = getY(c.low);
      const isGreen = c.close >= c.open;

      if (chartType === 'CANDLE') {
        // High-Low Wick
        ctx.strokeStyle = isGreen ? '#00C853' : '#FF3B30';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // Body
        ctx.fillStyle = isGreen ? '#00C853' : '#FF3B30';
        const bodyY = Math.min(openY, closeY);
        const bodyH = Math.max(2, Math.abs(openY - closeY));
        const bodyW = Math.max(2, candleWidth * 0.7);
        ctx.fillRect(x - bodyW / 2, bodyY, bodyW, bodyH);
      } else {
        // Area Chart
        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(x, closeY);
        } else {
          ctx.lineTo(x, closeY);
        }
      }
    });

    if (chartType === 'AREA') {
      ctx.strokeStyle = '#00C853';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Area gradient fill
      const gradient = ctx.createLinearGradient(0, 0, 0, mainChartHeight);
      gradient.addColorStop(0, 'rgba(0, 200, 83, 0.35)');
      gradient.addColorStop(1, 'rgba(0, 200, 83, 0.0)');

      ctx.lineTo(getX(candles.length - 1), mainChartHeight);
      ctx.lineTo(getX(0), mainChartHeight);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // SMA 20 Line Calculation & Render
    if (showSMA && candles.length >= 5) {
      const period = 10;
      ctx.beginPath();
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 1.5;

      for (let i = period - 1; i < candles.length; i++) {
        const slice = candles.slice(i - period + 1, i + 1);
        const avg = slice.reduce((sum, c) => sum + c.close, 0) / period;
        const x = getX(i);
        const y = getY(avg);
        if (i === period - 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Volume Sub-chart
    if (showVolume) {
      const volMax = Math.max(...candles.map(c => c.volume)) || 1;
      const volTop = mainChartHeight + 10;

      // Divider line
      ctx.strokeStyle = '#232D3F';
      ctx.beginPath();
      ctx.moveTo(10, volTop);
      ctx.lineTo(width - 50, volTop);
      ctx.stroke();

      candles.forEach((c, i) => {
        const x = getX(i);
        const volH = (c.volume / volMax) * (volumeHeight - 15);
        const isGreen = c.close >= c.open;
        ctx.fillStyle = isGreen ? 'rgba(0, 200, 83, 0.4)' : 'rgba(255, 59, 48, 0.4)';
        const w = Math.max(2, candleWidth * 0.7);
        ctx.fillRect(x - w / 2, volTop + volumeHeight - volH, w, volH);
      });
    }

    // RSI 14 Oscillator Sub-chart
    if (showRSI) {
      const rsiTop = mainChartHeight + volumeHeight + 20;

      // Sub-chart box & lines (70 overbought, 30 oversold)
      ctx.strokeStyle = '#232D3F';
      ctx.beginPath();
      ctx.moveTo(10, rsiTop);
      ctx.lineTo(width - 50, rsiTop);
      ctx.stroke();

      ctx.fillStyle = '#64748B';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText('RSI (14)', 15, rsiTop + 12);

      // Overbought / Oversold dashed lines
      const obY = rsiTop + rsiHeight * 0.3;
      const osY = rsiTop + rsiHeight * 0.7;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(10, obY); ctx.lineTo(width - 50, obY);
      ctx.moveTo(10, osY); ctx.lineTo(width - 50, osY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Simple RSI calculation
      const rsiValues = [];
      let gains = 0, losses = 0;
      for (let i = 1; i < candles.length; i++) {
        const diff = candles[i].close - candles[i - 1].close;
        if (diff >= 0) gains += diff;
        else losses += Math.abs(diff);

        if (i >= 14) {
          const avgGain = gains / 14;
          const avgLoss = losses / 14 || 1;
          const rs = avgGain / avgLoss;
          const rsi = 100 - (100 / (1 + rs));
          rsiValues.push({ index: i, val: rsi });
        }
      }

      ctx.beginPath();
      ctx.strokeStyle = '#FFB300';
      ctx.lineWidth = 1.5;

      rsiValues.forEach((item, idx) => {
        const x = getX(item.index);
        const y = rsiTop + rsiHeight - (item.val / 100) * rsiHeight;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

  }, [stock, chartType, showSMA, showRSI, showVolume, timeframe]);

  // Handle Mouse Move Crosshair
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !stock || !stock.candles) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const candleWidth = (rect.width - 60) / stock.candles.length;
    const index = Math.floor((x - 10) / candleWidth);

    if (index >= 0 && index < stock.candles.length) {
      setHoverData(stock.candles[index]);
    } else {
      setHoverData(null);
    }
  };

  const isGain = stock ? stock.change >= 0 : true;
  const displayCandle = hoverData || (stock?.candles ? stock.candles[stock.candles.length - 1] : null);

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Chart Top Header & OHLC Banner */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        
        {/* Stock Title */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#FFF' }}>{stock?.symbol}</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{stock?.name}</span>
            <span className="badge badge-green">{stock?.market}</span>
          </div>

          {/* OHLC Banner */}
          {displayCandle && (
            <div style={{ display: 'flex', gap: '14px', marginTop: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: 'var(--text-muted)' }}>O: <strong style={{ color: '#FFF' }}>{displayCandle.open}</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>H: <strong style={{ color: 'var(--color-green)' }}>{displayCandle.high}</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>L: <strong style={{ color: 'var(--color-red)' }}>{displayCandle.low}</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>C: <strong style={{ color: '#FFF' }}>{displayCandle.close}</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>Vol: <strong style={{ color: '#FFF' }}>{displayCandle.volume.toLocaleString()}</strong></span>
            </div>
          )}
        </div>

        {/* Current Price & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          
          <div style={{ textAlign: 'right' }}>
            <div className="font-mono" style={{ fontSize: '22px', fontWeight: '800', color: isGain ? 'var(--color-green)' : 'var(--color-red)' }}>
              {stock?.currency === 'IDR' ? `Rp ${stock?.price.toLocaleString('id-ID')}` : `$${stock?.price.toFixed(2)}`}
            </div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: isGain ? 'var(--color-green)' : 'var(--color-red)' }}>
              {isGain ? '+' : ''}{stock?.change} ({isGain ? '+' : ''}{stock?.changePercent}%)
            </div>
          </div>

          {/* Timeframe Controls */}
          <div className="tab-group">
            {['1D', '1W', '1M', '1Y', 'ALL'].map(tf => (
              <button
                key={tf}
                className={`tab-btn ${timeframe === tf ? 'active' : ''}`}
                onClick={() => setTimeframe(tf)}
                style={{ padding: '4px 8px', fontSize: '11px' }}
              >
                {tf}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* Indicators Toolbar */}
      <div style={{ padding: '6px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px' }}>
        <span style={{ color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Layers size={13} /> Indicators:
        </span>

        <button
          onClick={() => setChartType(chartType === 'CANDLE' ? 'AREA' : 'CANDLE')}
          className="btn btn-secondary btn-sm"
          style={{ height: '24px', fontSize: '11px' }}
        >
          {chartType === 'CANDLE' ? '🕯️ Candlestick' : '📈 Area Chart'}
        </button>

        <button
          onClick={() => setShowSMA(!showSMA)}
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            border: '1px solid',
            borderColor: showSMA ? '#00E5FF' : 'var(--border-color)',
            background: showSMA ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
            color: showSMA ? '#00E5FF' : 'var(--text-muted)',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          SMA (20)
        </button>

        <button
          onClick={() => setShowRSI(!showRSI)}
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            border: '1px solid',
            borderColor: showRSI ? '#FFB300' : 'var(--border-color)',
            background: showRSI ? 'rgba(255, 179, 0, 0.15)' : 'transparent',
            color: showRSI ? '#FFB300' : 'var(--text-muted)',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          RSI (14)
        </button>

        <button
          onClick={() => setShowVolume(!showVolume)}
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            border: '1px solid',
            borderColor: showVolume ? 'var(--color-green)' : 'var(--border-color)',
            background: showVolume ? 'var(--color-green-bg)' : 'transparent',
            color: showVolume ? 'var(--color-green)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Volume
        </button>
      </div>

      {/* Main Canvas Viewport */}
      <div style={{ flex: 1, position: 'relative', background: '#0B0E14', padding: '10px' }} onMouseLeave={() => setHoverData(null)}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
        />
      </div>

    </div>
  );
}
