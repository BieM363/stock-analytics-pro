import React from 'react';
import { Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function RunningTrades({ trades }) {
  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Title */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={14} color="var(--color-cyan)" />
          Running Trades (Live Stream)
        </div>
        <span style={{ fontSize: '11px', color: 'var(--color-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-green)' }}></span>
          Streaming
        </span>
      </div>

      {/* Table Headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '70px 65px 1fr 60px 50px',
        padding: '6px 12px',
        background: 'var(--bg-secondary)',
        fontSize: '11px',
        color: 'var(--text-muted)',
        fontWeight: '600',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div>Time</div>
        <div>Ticker</div>
        <div style={{ textAlign: 'right' }}>Price</div>
        <div style={{ textAlign: 'right' }}>Vol</div>
        <div style={{ textAlign: 'center' }}>Side</div>
      </div>

      {/* Live Stream Trade List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {trades.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            Menunggu data transaksi...
          </div>
        ) : (
          trades.map((t) => {
            const isBuy = t.type === 'BUY';
            return (
              <div
                key={t.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '70px 65px 1fr 60px 50px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  borderBottom: '1px solid rgba(255,255,255,0.02)',
                  alignItems: 'center',
                  animation: 'fadeIn 0.2s ease-out'
                }}
              >
                <div style={{ color: 'var(--text-muted)' }}>{t.time}</div>
                <div style={{ fontWeight: '700', color: '#FFF' }}>{t.symbol}</div>
                <div style={{ textAlign: 'right', fontWeight: '700', color: isBuy ? 'var(--color-green)' : 'var(--color-red)' }}>
                  {t.price.toLocaleString()}
                </div>
                <div style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{t.volume}</div>
                <div style={{ textAlign: 'center' }}>
                  <span className={`badge ${isBuy ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '9px', padding: '1px 4px' }}>
                    {isBuy ? 'B' : 'S'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
