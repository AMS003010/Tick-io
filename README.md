# 📈 Tick.io

**Tick.io** visualizes trading CSVs as candlestick charts with 15min and 1hr intervals. Compare trends, add markers, and store data locally in your browser.

---

## ✨ Features

- 📈 Interactive **Candlestick Charts** using TradingView’s Lightweight Charts  
- ⏱️ Supports both **15-minute** and **1-hour** timeframes  
- 📂 **Compare multiple trading histories** from different CSVs  
- 🧠 Add **markers** to highlight key points  
- 📏 **Persistent storage** with IndexedDB — no re-uploads needed  
- ↺ Automatically detects and parses time interval formats  
- ⚡ Renders both chart formats if data allows  

---

## 🚀 Getting Started

### Clone & Run Locally

```bash
git clone https://github.com/AMS003010/Tick-io.git
cd Tick-io
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to use the app.
You can use sample csv dumps in the `/sample-csv`

---

## 🐳 Run with Docker

You can also run Tick.io in a container:

```bash
docker run -p 3000:3000 ams132/tick-io-image:latest
```

Open [http://localhost:3000](http://localhost:3000) to get started.

---

## 🛠 Technologies Used

- **Next.js** – React framework for web apps  
- **Tailwind CSS** – Utility-first styling  
- **Lightweight Charts** – High-performance charts by TradingView  
- **IndexedDB** – Client-side persistence  
- **CSV Parsing** – Dynamic format detection & chart rendering  

---

## ✨ Future Improvements

- ✍️ Add drawing tools (trendlines, fib retracements, etc.)
- ⚠️ Allow users to filter trades by date range, trade type (BUY/SELL), profit/loss, account, or price
- 📈 Define and simulate strategies (e.g., moving averages, RSI) with performance visualization
- 🤝 Evaluate risk and return analytics for trades and strategies
- 📄 Export charts or reports as PDF, or generate shareable links for collaboration

---

Made with ❤️ for traders and tinkerers.

