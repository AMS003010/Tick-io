"use client";

import { useEffect, useState } from "react";
import { openDB } from "idb";
import { useRouter } from "next/navigation";
import { Quicksand } from "next/font/google";

import CandleStickGraph from "../components/CandleStickGraph";

const DB_NAME = "algaurumCsvStorage";
const STORE_NAME = "csvFiles";

const quicksand = Quicksand({
  subsets: ['latin', 'latin-ext'],
  preload: true,
});

interface CsvDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  tick_volume: number;
}

interface CandleChartDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface HistChartDataPoint {
  time: number;
  value: number;
}

interface TradeMarker {
  time: number;
  price: number;
  type: 'entry' | 'exit';
  direction: 'buy' | 'sell';
  text: string;
}

export default function AnalyzePage() {
  const [candleChartData15, setCandleChartData15] = useState<CandleChartDataPoint[]>([]);
  const [candleChartData1hr, setCandleChartData1hr] = useState<CandleChartDataPoint[] | null>([]);
  const [histChartData15, setHistChartData15] = useState<HistChartDataPoint[]>([]);
  const [histChartData1hr, setHistChartData1hr] = useState<HistChartDataPoint[] | null>([]);
  const [chartTimeMode, setChartTimeMode] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trades, setTrades] = useState<TradeMarker[]>([
    
  ]);
  
  const [markerDate, setMarkerDate] = useState<string>("");
  const [markerTime, setMarkerTime] = useState<string>("12:00");
  const [markerPrice, setMarkerPrice] = useState<string>("");
  const [markerType, setMarkerType] = useState<'entry' | 'exit'>('entry');
  const [markerDirection, setMarkerDirection] = useState<'buy' | 'sell'>('buy');
  const [markerText, setMarkerText] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  
  const router = useRouter();

  const goToHome = () => {
    router.push("/#upload-section");
  }

  const addAMarker = () => {
    setIsFormOpen(isFormOpen == false ? true : isFormOpen)
    router.push("/analyze/#markers-table");
  }

  function convertCandleDataFrom15minTo1hr(data: CandleChartDataPoint[]) {
    if (data.length < 2) return null;
  
    const interval = data[1].time - data[0].time;
    if (interval >= 3600) return null;
  
    const hourlyData = [];
    for (let i = 0; i < data.length; i += 4) {
      const chunk = data.slice(i, i + 4);
      if (chunk.length < 4) break;
  
      hourlyData.push({
        time: chunk[0].time,
        open: chunk[0].open,
        high: Math.max(...chunk.map(c => c.high)),
        low: Math.min(...chunk.map(c => c.low)),
        close: chunk[chunk.length - 1].close
      });
    }
  
    return hourlyData;
  }

  function convertHistDataFrom15minTo1hr(data: HistChartDataPoint[]) {
    if (data.length === 0) return null;

    const isAlready1Hour = data.every((d, i) => 
        i === 0 || (d.time - data[i - 1].time) === 3600
    );
    if (isAlready1Hour) return null;

    const hourlyData = [];
    
    for (let i = 0; i < data.length; i += 4) {
        if (i + 3 < data.length) {
            const hourBlock = data.slice(i, i + 4);
            const aggregatedVolume = hourBlock.reduce((sum, entry) => sum + entry.value, 0);

            hourlyData.push({
                time: hourBlock[0].time,
                value: aggregatedVolume
            });
        }
    }

    return hourlyData;
  }
  
  const addMarker = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!markerDate || !markerTime || !markerPrice) {
      alert("Please fill in date, time, and price fields");
      return;
    }
    
    try {
      const dateTimeString = `${markerDate}T${markerTime}:00`;
      
      const date = new Date(dateTimeString);
      const timestamp = Math.floor(date.getTime() / 1000);
      
      const newMarker: TradeMarker = {
        time: timestamp,
        price: parseFloat(markerPrice),
        type: markerType,
        direction: markerDirection,
        text: markerText || `${markerDirection.toUpperCase()} ${markerType}`,
      };
      
      setTrades(prevTrades => [...prevTrades, newMarker]);
      
      setMarkerDate("");
      setMarkerTime("12:00");
      setMarkerPrice("");
      setMarkerText("");
      setIsFormOpen(false);
    } catch (err) {
      alert("Error adding marker. Please check your inputs.");
      console.error(err);
    }
  };
  
  const removeMarker = (index: number) => {
    setTrades(prevTrades => prevTrades.filter((_, i) => i !== index));
  };

  const ChartTimeModeList = [
    <CandleStickGraph key={0} candleData={candleChartData15} histoData={histChartData15} trades={trades} height={700}/>,
    <CandleStickGraph key={1} candleData={candleChartData1hr} histoData={histChartData1hr} trades={trades} height={700}/>
  ]

  useEffect(() => {
    const fetchDataFromDB = async () => {
      try {
        const db = await openDB(DB_NAME, 1);
        
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const allKeys = await store.getAllKeys();
        
        if (allKeys.length === 0) {
          setError("No files found in database");
          setIsLoading(false);
          return;
        }
        
        const firstKey = allKeys[0];
        const rawData = await store.get(firstKey) as CsvDataPoint[];
        
        if (!Array.isArray(rawData)) {
          setError("Invalid data format");
          setIsLoading(false);
          return;
        }
        
        const formattedData = rawData
          .filter(entry => entry && entry.time && !isNaN(entry.time))
          .map(entry => ({
            time: entry.time,
            open: entry.open,
            high: entry.high,
            low: entry.low,
            close: entry.close
          }));

        const candle_1hr_data = convertCandleDataFrom15minTo1hr(formattedData);

        const formattedDataForHist = rawData
          .filter(entry => entry && entry.time && !isNaN(entry.time))
          .map(entry => ({
            time: entry.time,
            value: entry.tick_volume,
          }));

        const hist_1hr_data = convertHistDataFrom15minTo1hr(formattedDataForHist);
        
        setCandleChartData15(formattedData);
        setHistChartData15(formattedDataForHist);
        setCandleChartData1hr(candle_1hr_data);
        setHistChartData1hr(hist_1hr_data);

      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataFromDB();
  }, []);

  if (isLoading) {
    return <div className="w-screen h-screen flex items-center justify-center">Loading ...</div>
  }

  if (error) {
    return <div className="w-screen h-screen flex items-center justify-center text-red-500">{error}</div>;
  }

  const formatDateForDisplay = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  return (
    <div className="w-screen h-screen p-2">
      <div className="flex flex-col md:flex-row gap-3 md:gap-0 items-start md:justify-between md:items-center mb-2">
        <div className="flex justify-end gap-3 text-gray-800 text-sm">
          <div
            onClick={() => setChartTimeMode(0)}
            className={`px-8 p-2 rounded-lg hover:opacity-65 cursor-pointer ${chartTimeMode==0 ? "border-2 border-blue-600 bg-blue-300" : "border-2 border-gray-200 bg-gray-100"}`}
          >
            M15
          </div>
          <div
            onClick={() => setChartTimeMode(1)}
            className={`px-8 p-2 rounded-lg hover:opacity-65 cursor-pointer ${chartTimeMode==1 ? "border-2 border-blue-600 bg-blue-300" : "border-2 border-gray-200 bg-gray-100"}`}
          >
            H1
          </div>
        </div>
        <div className="flex justify-center gap-3 mr-4">
          <div
            onClick={() => goToHome()}
            className="flex justify-center gap-4 items-center px-4 p-2 rounded-xl border-gray-400 border-[2px] cursor-pointer hover:opacity-65"
          >
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-chart-pie-icon lucide-file-chart-pie size-5">
                <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
                <path d="M16 22h2a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3.5"/>
                <path d="M4.017 11.512a6 6 0 1 0 8.466 8.475"/>
                <path d="M9 16a1 1 0 0 1-1-1v-4c0-.552.45-1.008.995-.917a6 6 0 0 1 4.922 4.922c.091.544-.365.995-.917.995z"/>
              </svg>
            </div>
            <div className="text-gray-400 mr-5 text-sm">Add Files</div>
            <div className="p-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-icon lucide-plus size-6 text-gray-400">
                <path d="M5 12h14"/>
                <path d="M12 5v14"/>
              </svg>
            </div>
          </div>
          <div
            onClick={() => addAMarker()}
            className="flex justify-center gap-4 items-center px-4 p-2 rounded-xl border-gray-400 border-[2px] cursor-pointer hover:opacity-65"
          >
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pin-icon lucide-pin size-5">
                <path d="M12 17v5"/>
                <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>
              </svg>
            </div>
            <div className="text-gray-400 mr-5 text-sm">Add Markers</div>
            <div className="p-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-icon lucide-plus size-6 text-gray-400">
                <path d="M5 12h14"/>
                <path d="M12 5v14"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
      {ChartTimeModeList[chartTimeMode]}
      
      <div className="mt-4 border rounded-lg p-4 mr-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-600">Trade Markers</h2>
          <button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className={`px-4 py-2 text-white rounded-lg flex cursor-pointer items-center gap-2 ${isFormOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            {
              isFormOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-icon lucide-x">
                  <path d="M18 6 6 18"/>
                  <path d="m6 6 12 12"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/>
                  <path d="M12 5v14"/>
                </svg>
              )
            }
            
            {isFormOpen ? 'Cancel' : 'Add Marker'}
          </button>
        </div>
        
        {isFormOpen && (
          <form onSubmit={addMarker} className="mb-6 bg-white p-4 rounded-lg shadow text-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={markerDate}
                  onChange={(e) => setMarkerDate(e.target.value)}
                  required
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  value={markerTime}
                  onChange={(e) => setMarkerTime(e.target.value)}
                  required
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  step="0.0001"
                  value={markerPrice}
                  onChange={(e) => setMarkerPrice(e.target.value)}
                  required
                  className="w-full p-2 border rounded-md"
                  placeholder="e.g. 1.2345"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={markerType}
                  onChange={(e) => setMarkerType(e.target.value as 'entry' | 'exit')}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="entry">Entry</option>
                  <option value="exit">Exit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                <select
                  value={markerDirection}
                  onChange={(e) => setMarkerDirection(e.target.value as 'buy' | 'sell')}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
              <input
                type="text"
                value={markerText}
                onChange={(e) => setMarkerText(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Add a note for this marker"
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Add Marker
            </button>
          </form>
        )}
        
        {/* List of existing markers */}
        <div className={`${quicksand.className} overflow-x-auto text-gray-800 h-max`}>
          <table className="min-w-full text-xs md:text-base bg-white" id="markers-table">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left">Date & Time</th>
                <th className="py-2 px-4 text-left">Price</th>
                <th className="py-2 px-4 text-left">Type</th>
                <th className="py-2 px-4 text-left">Direction</th>
                <th className="py-2 px-4 text-left">Note</th>
                <th className="py-2 px-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade, index) => (
                <tr key={index} className="border-t text-gray-600">
                  <td className="py-2 px-4">{formatDateForDisplay(trade.time)}</td>
                  <td className="py-2 px-4">{trade.price}</td>
                  <td className="py-2 px-4 capitalize">{trade.type}</td>
                  <td className="py-2 px-4 capitalize">{trade.direction}</td>
                  <td className="py-2 px-4">{trade.text}</td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => removeMarker(index)}
                      className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 cursor-pointer"
                      title="Remove marker"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" 
                          viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {trades.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 px-4 text-center text-gray-500">
                    No markers added yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="mt-56 mb-4 flex justify-center italic font-medium text-sm md:text-base text-center">Markers in stocks aren&apos;t predictions, they&apos;re clues—follow them, but trust your instincts.</div>
        </div>
      </div>
    </div>
  );
}