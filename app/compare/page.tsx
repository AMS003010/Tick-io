"use client";
import { useEffect, useState } from "react";
import { openDB } from "idb";
import MultipleCandleGraph from "../components/MultipleCandleGraph";
import FileDisplayComp from "../components/FileDisplayComp";
import { useRouter } from "next/navigation";

const DB_NAME = "algaurumCsvStorage";
const STORE_NAME = "csvFiles";

interface CsvDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  tick_volume: number;
}

interface CsvType {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface dataFormat {
  data: CsvType[],
  label: string,
  color: string,
}

export default function ComparePage() {
  const colors = ["#7D4C9C", "#EFA46B", "#3C9D8C", "#F0D47B", "#8F4D88"];
  const [seriesConfigs, setSeriesConfigs] = useState<dataFormat[]>([]);
  const [removedSeries, setRemovedSeries] = useState<dataFormat[]>([]);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const goToHome = () => {
    router.push("/#upload-section");
  }

  const removeFileData = (label: string) => {
    const index = seriesConfigs.findIndex((r) => r.label === label);
    if (index !== -1) {
      const removed = seriesConfigs[index];
      setRemovedSeries((prev) => [...prev, removed]);
      setSeriesConfigs((prev) => prev.filter((r) => r.label !== label));
    }
  };

  const restoreFileData = (label: string) => {
    const index = removedSeries.findIndex((r) => r.label === label);
    if (index !== -1) {
      const restored = removedSeries[index];
      setSeriesConfigs((prev) => [...prev, restored]);
      setRemovedSeries((prev) => prev.filter((r) => r.label !== label));
    }
  };

  useEffect(() => {
    async function fetchDataFromIndexedDB() {
        try {
            const db = await openDB(DB_NAME, 1);    
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const allKeys = await store.getAllKeys();

            setFileNames(allKeys);

            if (allKeys.length === 0) {
                setError("No files found in database");
                setIsLoading(false);
                return;
            }

            const config: dataFormat[] = [];

            for (const key of allKeys) {
                const storeData = await store.get(key) as CsvDataPoint[];
                if (!storeData || storeData.length === 0) continue;

                const formattedData = storeData
                    .filter(entry => entry && entry.time && !isNaN(entry.time))
                    .map(entry => ({
                        time: entry.time,
                        open: entry.open,
                        high: entry.high,
                        low: entry.low,
                        close: entry.close
                    }));

                config.push({
                    data: formattedData,
                    label: key.toString(),
                    color: colors[Math.floor(Math.random() * colors.length)]
                });
            }

            setSeriesConfigs(config);
            setIsLoading(false);
        } catch (err: any) {
            setError("Failed to load data: " + err.message);
            setIsLoading(false);
        }
    }
    
    fetchDataFromIndexedDB();
  }, []);

  return (
    <div className="w-full bg-gradient-to-br from-[#504dbe] to-[#131321]">
      {isLoading ? (
        <div className="flex justify-center items-center h-[100vh]">
          <p>Loading stock data...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col space-y-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
        </div>
      ) : (
        <div className="p-2">
          <MultipleCandleGraph
            seriesConfigs={seriesConfigs}
            height={700}
            initialVisibleBars={100}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-5 mb-[8rem]">
            {fileNames.map((record, index) => (
              <FileDisplayComp
                record={record}
                key={index}
                onClick = {() => {
                  const index = seriesConfigs.findIndex((r) => r.label === record);
                  if (index !== -1) {
                    removeFileData(record)
                  } else {
                    restoreFileData(record)
                  }
                }}
              />
            ))}
            <div
              onClick={() => goToHome()}
              className="flex justify-center gap-4 items-center px-4 p-3 rounded-xl border-gray-200 border-[2px] cursor-pointer hover:opacity-65 w-max"
            >
              <div className="p-1 rounded-full border-[2px] border-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                    className="lucide lucide-plus-icon lucide-plus size-4 text-gray-200">
                  <path d="M5 12h14"/>
                  <path d="M12 5v14"/>
                </svg>
              </div>
              <div className="text-gray-200">Add files</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
