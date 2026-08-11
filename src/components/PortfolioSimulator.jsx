import React, { useEffect, useRef } from 'react';
import { Wallet, PieChart, TrendingUp, TrendingDown, Plus, Trash2, RefreshCw, Zap, Activity, Clock } from 'lucide-react';

// Canvas 1: Donut / Pie Chart for Asset Allocation
function AssetAllocationPieChart({ holdings, usdToIdr }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (!holdings || holdings.length === 0) {
      ctx.fillStyle = '#64748B';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Kosong', width / 2, height / 2);
      return;
    }

    const totalIDR = holdings.reduce((sum, h) => {
      const val = h.currentValIDR || (h.quantity * h.avgPrice * (h.currency === 'USD' ? usdToIdr : 1));
      return sum + val;
    }, 0);

    let startAngle = 0;
    const colors = ['#00C853', '#00E5FF', '#FFB300', '#FF3B30', '#E040FB', '#00E676'];

    holdings.forEach((h, idx) => {
      const val = h.currentValIDR || (h.quantity * h.avgPrice * (h.currency === 'USD' ? usdToIdr : 1));
      const sliceAngle = totalIDR > 0 ? (val / totalIDR) * 2 * Math.PI : 0;

      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 55, startAngle, startAngle + sliceAngle);
      ctx.arc(width / 2, height / 2, 32, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = colors[idx % colors.length];
      ctx.fill();

      startAngle += sliceAngle;
    });

  }, [holdings, usdToIdr]);

  return <canvas ref={canvasRef} width={130} height={130} style={{ display: 'block' }} />;
}

// Canvas 2: Portfolio Equity Growth Line Chart (Naik-Turun Pendapatan/Ekuitas)
function PortfolioEquityHistoryChart({ totalValueIDR, isGain }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    const base = totalValueIDR * 0.85;
    const points = [];
    const count = 40;
    let cur = base;

    for (let i = 0; i < count; i++) {
      if (i === count - 1) cur = totalValueIDR;
      else cur += (Math.random() - 0.45) * (totalValueIDR * 0.015);
      points.push(cur);
    }

    const minP = Math.min(...points) * 0.98;
    const maxP = Math.max(...points) * 1.02;
    const range = maxP - minP || 1;

    const mainH = height - 20;

    ctx.beginPath();
    points.forEach((p, idx) => {
      const x = (idx / (count - 1)) * (width - 40) + 10;
      const y = mainH - ((p - minP) / range) * mainH + 10;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    const strokeColor = isGain ? '#00C853' : '#FF3B30';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    const gradient = ctx.createLinearGradient(0, 0, 0, mainH);
    gradient.addColorStop(0, isGain ? 'rgba(0, 200, 83, 0.25)' : 'rgba(255, 59, 48, 0.25)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.lineTo(width - 30, mainH + 10);
    ctx.lineTo(10, mainH + 10);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

  }, [totalValueIDR, isGain]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '140px', display: 'block' }} />;
}

export default function PortfolioSimulator({
  portfolio,
  assets,
  usdToIdr,
  displayCurrency,
  onOpenAddModal,
  onRemoveHolding,
  onResetPortfolio,
  onLoadSamplePortfolio
}) {
  let totalValueIDR = 0;
  let totalCostIDR = 0;

  const holdingsWithMetrics = portfolio.holdings.map(h => {
    const asset = assets.find(a => a.symbol === h.symbol) || { price: h.avgPrice, currency: h.currency, name: h.symbol };
    const currentPrice = asset.price;
    const currentUnitVal = currentPrice * h.quantity;
    const costBasisUnit = h.avgPrice * h.quantity;

    const currentValIDR = h.currency === 'USD' ? currentUnitVal * (usdToIdr || 17830) : currentUnitVal;
    const costBasisIDR = h.currency === 'USD' ? costBasisUnit * (usdToIdr || 17830) : costBasisUnit;

    totalValueIDR += currentValIDR;
    totalCostIDR += costBasisIDR;

    const pnlIDR = currentValIDR - costBasisIDR;
    const pnlPct = costBasisIDR > 0 ? parseFloat(((pnlIDR / costBasisIDR) * 100).toFixed(2)) : 0;

    return {
      ...h,
      currentPrice,
      currentValIDR,
      costBasisIDR,
      pnlIDR,
      pnlPct,
      assetName: asset.name,
      category: asset.category || 'ASSET',
      unitLabel: asset.unitLabel || 'Unit'
    };
  });

  const totalPnLIDR = totalValueIDR - totalCostIDR;
  const totalROIPct = totalCostIDR > 0 ? parseFloat(((totalPnLIDR / totalCostIDR) * 100).toFixed(2)) : 0;
  const isGain = totalPnLIDR >= 0;

  const formatMoney = (valInIDR) => {
    if (displayCurrency === 'IDR') {
      return `Rp ${Math.round(valInIDR).toLocaleString('id-ID')}`;
    } else {
      const usdVal = valInIDR / (usdToIdr || 17830);
      return `$${usdVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  const colors = ['#00C853', '#00E5FF', '#FFB300', '#FF3B30', '#E040FB', '#00E676'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        
        {/* Total Value */}
        <div className="google-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>
            <span>TOTAL NILAI PORTOFOLIO</span>
            <Wallet size={18} color="var(--color-green)" />
          </div>
          <div className="font-mono" style={{ fontSize: '28px', fontWeight: '800', color: '#F1F5F9', marginTop: '6px' }}>
            {formatMoney(totalValueIDR)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Total Modal Investasi: <strong>{formatMoney(totalCostIDR)}</strong>
          </div>
        </div>

        {/* Total PnL */}
        <div className="google-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>
            <span>TOTAL UNTUNG / RUGI (NET PnL)</span>
            {isGain ? <TrendingUp size={18} color="var(--color-green)" /> : <TrendingDown size={18} color="var(--color-red)" />}
          </div>
          <div className="font-mono" style={{ fontSize: '28px', fontWeight: '800', color: isGain ? 'var(--color-green)' : 'var(--color-red)', marginTop: '6px' }}>
            {isGain ? '+' : ''}{formatMoney(totalPnLIDR)}
          </div>
          <div style={{ fontSize: '12px', color: isGain ? 'var(--color-green)' : 'var(--color-red)', fontWeight: '700', marginTop: '4px' }}>
            {isGain ? '+' : ''}{totalROIPct}% Total Return
          </div>
        </div>

        {/* Asset Allocation Pie Chart Box */}
        <div className="google-card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <AssetAllocationPieChart holdings={holdingsWithMetrics} usdToIdr={usdToIdr} />
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '6px' }}>
              PIE CHART ALOKASI ASET
            </div>
            {holdingsWithMetrics.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Belum ada posisi</div>
            ) : (
              holdingsWithMetrics.slice(0, 3).map((h, i) => (
                <div key={h.symbol} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', marginBottom: '3px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors[i % colors.length] }}></span>
                  <span style={{ fontWeight: '700', color: '#F1F5F9' }}>{h.symbol}:</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {totalValueIDR > 0 ? ((h.currentValIDR / totalValueIDR) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Portfolio Equity Performance Growth Line Chart */}
      <div className="google-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="var(--color-green)" />
            Grafik Riwayat Pertumbuhan Pendapatan & Ekuitas Portofolio
          </h3>
          <span style={{ fontSize: '11px', color: isGain ? 'var(--color-green)' : 'var(--color-red)', fontWeight: '700' }}>
            {isGain ? '▲ Trends Bullish' : '▼ Trends Bearish'}
          </span>
        </div>
        <PortfolioEquityHistoryChart totalValueIDR={totalValueIDR} isGain={isGain} />
      </div>

      {/* Holdings Table */}
      <div className="google-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={18} color="var(--color-green)" />
            Catatan Beli & Rincian Posisi Asset ({holdingsWithMetrics.length})
          </h3>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={onLoadSamplePortfolio}>
              <Zap size={13} color="var(--color-amber)" /> Sampel 5 Asset
            </button>
            <button className="btn btn-primary btn-sm" onClick={onOpenAddModal}>
              <Plus size={14} /> Catat Pembelian Aset
            </button>
          </div>
        </div>

        {portfolio.holdings.length === 0 ? (
          <div style={{ padding: '36px 16px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
            <div style={{ fontWeight: '700', color: '#F1F5F9', fontSize: '15px' }}>Portofolio Masih Kosong</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '480px', margin: '4px auto 16px' }}>
              Catat transaksi aset Anda beserta jam dan harga beli Rupiah/USD untuk menghitung imbal hasil otomatis.
            </div>
            <button className="btn btn-primary" onClick={onLoadSamplePortfolio}>
              <Zap size={14} fill="#0B0E14" /> Muat Sampel Portofolio
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '10px 12px' }}>Tanggal & Jam</th>
                  <th style={{ padding: '10px 12px' }}>Aset</th>
                  <th style={{ padding: '10px 12px' }}>Jumlah</th>
                  <th style={{ padding: '10px 12px' }}>Harga Beli (Nanovest / Orig)</th>
                  <th style={{ padding: '10px 12px' }}>Harga Live Sekarang</th>
                  <th style={{ padding: '10px 12px' }}>Nilai Sekarang</th>
                  <th style={{ padding: '10px 12px' }}>Untung / Rugi (PnL)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Hapus</th>
                </tr>
              </thead>
              <tbody>
                {holdingsWithMetrics.map(h => {
                  const isPosGain = h.pnlIDR >= 0;
                  return (
                    <tr key={h.symbol} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} color="var(--color-green)" />
                          {h.timestamp || 'Baru Saja'}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: '700', color: '#F1F5F9' }}>{h.symbol}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{h.assetName}</div>
                      </td>
                      <td className="font-mono" style={{ padding: '12px', color: '#F1F5F9' }}>
                        {h.quantity} {h.unitLabel}
                      </td>
                      <td className="font-mono" style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                        {h.inputBuyPrice ? (
                          h.inputCurrency === 'IDR'
                            ? `Rp ${Math.round(h.inputBuyPrice).toLocaleString('id-ID')}`
                            : `$${h.inputBuyPrice.toLocaleString()}`
                        ) : (
                          h.currency === 'IDR' ? `Rp ${h.avgPrice.toLocaleString('id-ID')}` : `$${h.avgPrice.toLocaleString()}`
                        )}
                      </td>
                      <td className="font-mono" style={{ padding: '12px', fontWeight: '700', color: '#F1F5F9' }}>
                        {h.currency === 'IDR' ? `Rp ${h.currentPrice.toLocaleString('id-ID')}` : `$${h.currentPrice.toLocaleString()}`}
                      </td>
                      <td className="font-mono" style={{ padding: '12px', fontWeight: '700', color: '#F1F5F9' }}>
                        {formatMoney(h.currentValIDR)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div className="font-mono" style={{ fontWeight: '700', color: isPosGain ? 'var(--color-green)' : 'var(--color-red)' }}>
                          {isPosGain ? '+' : ''}{formatMoney(h.pnlIDR)}
                        </div>
                        <div style={{ fontSize: '11px', color: isPosGain ? 'var(--color-green)' : 'var(--color-red)' }}>
                          ({isPosGain ? '+' : ''}{h.pnlPct}%)
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => onRemoveHolding(h.symbol)}
                          style={{ color: 'var(--color-red)' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
