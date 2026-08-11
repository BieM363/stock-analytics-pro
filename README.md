# 9. [Untuk Stockbit] Real-Time Stock Analytics & Portfolio Simulator Web App

## 📌 Konsep
Platform analisis saham & simulasi portofolio investasi secara real-time berbasis WebSockets.

## 🛠️ Tech Stack
- **Frontend**: React / Vite, Custom Design System CSS, High-Performance Canvas Financial Indicator Charting.
- **Backend**: Node.js (Express), Socket.IO WebSockets Engine, Redis In-Memory Caching Layer.

## 🚀 Fitur Utama
1. **Real-Time Price Updates via WebSockets**: Simulasi/penarikan pergerakan harga saham live secara asynchronous tanpa perlu refresh halaman.
2. **Interactive Financial Indicator Charting**: Tampilan grafik harga saham (Candlestick, Line, Moving Average, RSI, Volume) yang responsif dan interaktif.
3. **Virtual Portfolio & PnL Calculator**: Fitur jual/beli saham simulasi (Paper Trading) yang menghitung Profit & Loss (PnL), ROI, dan alokasi aset pengguna secara otomatis.
4. **High-Performance Caching (Redis)**: Menggunakan Redis Caching untuk menyimpan data transaksi/harga terpopuler agar beban query database tetap ringan.

---

## 📊 Aset Terdaftar (19 Aset)
- **Saham Indonesia (IDX)**: `BBRI`, `BBCA`, `BMRI`, `TLKM`, `ADRO`, `JPFA`, `KLBF`
- **Saham Luar & ETF (US Market)**: `VOO`, `QQQM`, `SCHD`, `NVDA`, `AAPL`, `JPM`, `GOOGL`
- **Crypto**: `BTC`, `ETH`, `SOL`, `TRX`
- **Komoditas**: `EMAS` (Gold)

---

## ⚙️ Cara Menjalankan Aplikasi
```bash
# Install dependencies
npm install

# Jalankan Backend WebSocket Server & Frontend Vite secara bersamaan
npm start

# Atau jalankan secara terpisah:
npm run server # Express Backend (Port 3000)
npm run dev    # Vite Frontend (Port 5173)
```
