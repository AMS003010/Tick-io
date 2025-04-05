import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { usePapaParse } from "react-papaparse";
import { openDB } from "idb";
import { Poppins } from "next/font/google";
import { toast } from "react-toastify";

const DB_NAME = "algaurumCsvStorage";
const STORE_NAME = "csvFiles";

const poppins = Poppins({
  weight: '500',
  style:"normal",
  subsets: ['latin', 'latin-ext'],
  preload: true,
})

interface CsvType {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  tick_volume: number;
}

interface MultipleCsvUploaderProps {
  setNoOfFiles: (count: number) => void,
}

interface MarketData {
  time: string | number;
  open: string | number;
  high: string | number;
  low: string | number;
  close: string | number;
  tick_volume: string | number;
}

async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

async function saveToDB(filename: string, data: CsvType[]) {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  await store.put(data, filename);
  await tx.done;
}

async function loadFromDB() {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const allKeys = await store.getAllKeys();

  const allData = await Promise.all(
    allKeys.map(async (key) => ({ [String(key)]: await store.get(key) }))
  );

  return allData;
}

async function deleteFromDB(filename: string) {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  await tx.objectStore(STORE_NAME).delete(filename);
  await tx.done;
}

async function clearDB() {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  await tx.objectStore(STORE_NAME).clear();
  await tx.done;
}

function getExtension(file: string) {
  const tmp = file.split(".");
  return "."+tmp[tmp.length-1]
}

export default function MultipleCsvUploader({setNoOfFiles}: MultipleCsvUploaderProps) {
  const { readString } = usePapaParse();
  const [data, setData] = useState<Record<string, CsvType[]>[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const storedData = await loadFromDB();
      setData(storedData);
      setNoOfFiles(storedData.length);
    };
    
    loadData();
  }, []);

  useEffect(() => {
    setNoOfFiles(data.length);
  }, [data, setNoOfFiles]);

  const handleDelete = async (filename: string) => {
    await deleteFromDB(filename);
    
    setData((prev) => prev.filter((fileData) => !fileData[filename]));
    setError(null);
  };

  const isFileDuplicate = (filename: string): boolean => {
    return data.some((fileData) => fileData[filename] !== undefined);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);

    if (data.length + acceptedFiles.length > 5) {
      toast.warn("🚫 You can only upload 5 files max!", {
        position: "top-center",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });      
      return;
    }

    acceptedFiles.forEach((file) => {
      if (isFileDuplicate(file.name)) {
        toast.error(`File "${file.name}" already exists`);
        return;
      }

      if (getExtension(file.name).toLowerCase() !== ".csv") {
        toast.error(`"${file.name}" is not a CSV file`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const text = reader.result.toString();
          readString(text, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
              const formattedData = (result.data as MarketData[]).map((row) => {
                let timestamp = 0;
                if (row.time && typeof row.time === 'string') {
                  const date = new Date(row.time);
                  if (!isNaN(date.getTime())) {
                    timestamp = Math.floor(date.getTime() / 1000);
                  }
                }
  
                return {
                  time: timestamp,
                  open: parseFloat(row.open as string) || 0,
                  high: parseFloat(row.high as string) || 0,
                  low: parseFloat(row.low as string) || 0,
                  close: parseFloat(row.close as string) || 0,
                  tick_volume: parseInt(row.tick_volume as string, 10) || 0,
                };
              });
                
              const fileData = { [file.name]: formattedData };
              
              saveToDB(file.name, formattedData).then(() => {
                setData((prev) => [...prev, fileData]);
              });
            },
          });
        }
      };
      reader.readAsText(file);
    });
  }, [readString, data.length]);

  const clearData = async () => {
    await clearDB();
    setData([]);
    setError(null);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
  });

  return (
    <div id="upload-section" className={`${poppins.className} p-8 border bg-white rounded-3xl shadow-2xl mt-10 md:mt-30 scale-50 md:scale-100`}>
      <div className="text-black text-xl mb-2">Upload Files</div>
      <div
        {...getRootProps()}
        className="border-dashed border-[1px] border-gray-300 p-6 rounded-md cursor-pointer px-24"
      >
        <input {...getInputProps()} />
        <div className="flex flex-col justify-center items-center gap-3 text-gray-500 ">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-plus-icon lucide-circle-plus size-8">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 12h8"/>
              <path d="M12 8v8"/>
            </svg>
          </div>
          <div>Drag & drop or click to choose files</div>
          <div className="flex justify-center gap-2 items-center mt-6">
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-badge-info-icon lucide-badge-info size-5">
              <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
              <line x1="12" x2="12" y1="16" y2="12"/>
              <line x1="12" x2="12.01" y1="8" y2="8"/>
              </svg>
            </div>
            <div className="text-sm">Upload only CSV files (max 5)</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle size-5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" x2="12" y1="8" y2="12"/>
            <line x1="12" x2="12.01" y1="16" y2="16"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="mt-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-gray-700">Stored Data:</h3>
          <span className="text-sm text-gray-500">{data.length}/5 files</span>
        </div>
        {data.length > 0 ? (
          data.map((fileData, index) => (
            <div key={index} className="mt-2 p-2 border rounded-md inset-shadow-sm shadow-md">
              {Object.entries(fileData).map(([filename]) => (
                <div key={filename}>
                  <div className="flex justify-between items-center gap-6 px-2 p-1">
                    <div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-chart-pie-icon lucide-file-chart-pie size-5 text-orange-500">
                        <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
                        <path d="M16 22h2a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3.5"/>
                        <path d="M4.017 11.512a6 6 0 1 0 8.466 8.475"/>
                        <path d="M9 16a1 1 0 0 1-1-1v-4c0-.552.45-1.008.995-.917a6 6 0 0 1 4.922 4.922c.091.544-.365.995-.917.995z"/>
                      </svg>
                    </div>
                    <div className="flex flex-col justify-start">
                      <div className="w-[25rem] truncate text-gray-600">{filename}</div>
                      <div className="text-sm text-gray-400">{getExtension(filename)} file</div>
                    </div>
                    <div className="cursor-pointer" onClick={() => handleDelete(filename)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2-icon lucide-trash-2 size-5 text-gray-600">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        <line x1="10" x2="10" y1="11" y2="17"/>
                        <line x1="14" x2="14" y1="11" y2="17"/>
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          <p className="text-gray-500 mt-1">No data stored</p>
        )}
      </div>

      {data.length > 0 && (
        <div
          onClick={clearData}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex justify-center gap-3 items-center cursor-pointer"
        >
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2-icon lucide-trash-2 size-5">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              <line x1="10" x2="10" y1="11" y2="17"/>
              <line x1="14" x2="14" y1="11" y2="17"/>
            </svg>
          </div>
          <div>Clear all files</div>
        </div>
      )}
    </div>
  );
}