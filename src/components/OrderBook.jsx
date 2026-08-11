import React from 'react';
import { Layers, ArrowUp, ArrowDown } from 'lucide-react';

export default function OrderBook({ stock, onSelectPrice }) {
  if (!stock || !stock.orderBook) {
    return (
      <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Order Book...
      </div>
    );
  }

  const { bids, asks } = stock.orderBook;

  const maxBidVol = Math.max(...bids.map(b => b.volume), 1);
  const maxAskVol = Math.max(...asks.map(a => a.volume), 1);

  const bestBid = bids[0]?.price || 0;
  const bestAsk = asks[0]?.price || 0;
  const spread = parseFloat((bestAsk - bestBid).toFixed(2));
  const spreadPct = bestBid > 0 ? ((spread / bestBid) * 100).toFixed(2) : 0;

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Title */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={14} color="var(--color-green)" />
          Order Book (Market Depth)
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Spread: {spread} ({spreadPct}%)
        </span>
      </div>

      {/* Table Headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        padding: '6px 14px',
        background: 'var(--bg-secondary)',
        fontSize: '11px',
        color: 'var(--text-muted)',
        fontWeight: '600',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div>Bid Vol</div>
        <div>Bid Price</div>
        <div style={{ textAlign: 'right' }}>Ask Price</div>
        <div style={{ textAlign: 'right' }}>Ask Vol</div>
      </div>

      {/* Order Ladder Rows */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {Array.from({ length: 5 }).map((_, i) => {
          const bid = bids[i];
          const ask = asks[i];

          const bidBarWidth = bid ? (bid.volume / maxBidVol) * 100 : 0;
          const askBarWidth = ask ? (ask.volume / maxAskVol) * 100 : 0;

          return (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                padding: '6px 14px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                position: 'relative',
                borderBottom: '1px solid rgba(255,255,255,0.02)',
                alignItems: 'center'
              }}
            >
              {/* Bid Volume & Price */}
              <div style={{ position: 'relative', zIndex: 1, color: 'var(--text-secondary)' }}>
                {bid ? bid.volume.toLocaleString() : '-'}
              </div>

              <div 
                onClick={() => bid && onSelectPrice && onSelectPrice(bid.price, 'BUY')}
                style={{ position: 'relative', zIndex: 1, color: 'var(--color-green)', fontWeight: '700', cursor: 'pointer' }}
              >
                {bid ? (stock.currency === 'IDR' ? bid.price.toLocaleString('id-ID') : bid.price.toFixed(2)) : '-'}
              </div>

              {/* Ask Price & Volume */}
              <div 
                onClick={() => ask && onSelectPrice && onSelectPrice(ask.price, 'SELL')}
                style={{ position: 'relative', zIndex: 1, color: 'var(--color-red)', fontWeight: '700', textAlign: 'right', cursor: 'pointer' }}
              >
                {ask ? (stock.currency === 'IDR' ? ask.price.toLocaleString('id-ID') : ask.price.toFixed(2)) : '-'}
              </div>

              <div style={{ position: 'relative', zIndex: 1, color: 'var(--text-secondary)', textAlign: 'right' }}>
                {ask ? ask.volume.toLocaleString() : '-'}
              </div>

              {/* Background Volume Fill Bars */}
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${bidBarWidth * 0.5}%`,
                background: 'rgba(0, 200, 83, 0.12)',
                pointerEvents: 'none'
              }} />

              <div style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: `${askBarWidth * 0.5}%`,
                background: 'rgba(255, 59, 48, 0.12)',
                pointerEvents: 'none'
              }} />

            </div>
          );
        })}
      </div>

    </div>
  );
}
