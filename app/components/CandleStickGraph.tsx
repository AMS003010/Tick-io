"use client";

import { createChart, ColorType, CandlestickSeries, HistogramSeries, createSeriesMarkers } from "lightweight-charts";
import React, { useEffect, useRef } from "react";
import { Quicksand } from "next/font/google";

import NoGraph from '@/public/nothing-here.png'; 
import Image from "next/image";

const quicksand = Quicksand({
  weight:'600',
  subsets: ['latin', 'latin-ext'],
  preload: true,
})

type ChartProps = {
  candleData: { open: number; high: number; low: number; close: number; time: string; }[];
  histoData: { time: string; value: number; }[];
  trades?: TradeType[],
  colors?: {
    backgroundColor?: string;
    textColor?: string;
    upColor?: string;
    downColor?: string;
    borderVisible?: boolean;
    wickUpColor?: string;
    wickDownColor?: string;
    volumeColor?: string;
    entryColor?: string;
    exitColor?: string;
  };
  initialVisibleBars?: number;
};

interface TradeType {
  time: number;
  price: number;
  type: 'entry' | 'exit';
  direction: 'buy' | 'sell';
  text: string;
}

interface CsvType {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  tick_volume: number;
}

interface CsvTypeHist {
  time: number;
  value: number;
}

interface CandleStickGraphProps {
  candleData: CsvType[] | null;
  histoData: CsvTypeHist[] | null;
  trades: TradeType[];
  height?: number;
  initialVisibleBars?: number;
  enableHistogram?: boolean;
}

const ChartComponent: React.FC<ChartProps> = ({ 
  candleData,
  histoData,
  trades = [],
  colors = {
    backgroundColor: "white",
    textColor: "black",
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderVisible: false,
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
    volumeColor: 'rgba(38, 166, 154, 0.5)',
    entryColor: '#2196F3',
    exitColor: '#FF5252',
  },
  initialVisibleBars = 50
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: colors.backgroundColor },
        textColor: colors.textColor,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      rightPriceScale: {
        visible: true,
        borderColor: 'rgba(197, 203, 206, 0.8)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.3,
        },
      },
      leftPriceScale: {
        visible: true,
        borderColor: 'rgba(197, 203, 206, 0.8)',
        scaleMargins: {
          top: 0.7,
          bottom: 0.05,
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(197, 203, 206, 0.8)',
        barSpacing: 10,
      },
      grid: {
        vertLines: {
          color: 'rgba(197, 203, 206, 0.3)',
        },
        horzLines: {
          color: 'rgba(197, 203, 206, 0.3)',
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: 'rgba(42, 46, 57, 0.5)',
          style: 2,
        },
        horzLine: {
          width: 1,
          color: 'rgba(42, 46, 57, 0.5)',
          style: 2,
        },
      },
      handleScroll: {
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });
    
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: colors.upColor,
      downColor: colors.downColor,
      borderVisible: colors.borderVisible,
      wickDownColor: colors.wickDownColor,
      wickUpColor: colors.wickUpColor,
      priceScaleId: 'right',
      entryColor: colors.entryColor,
      exitColor: colors.exitColor,
    });

    const histogramSeries = chart.addSeries(HistogramSeries, {
      color: colors.volumeColor,
      priceScaleId: 'left',
      priceLineVisible: false,
      lastValueVisible: false,
    });

    candlestickSeries.setData(candleData);
    histogramSeries.setData(histoData);

    if (trades && trades.length > 0) {
      const buyEntryMarkers = trades
        .filter(trade => trade.type === 'entry' && trade.direction === 'buy')
        .map(trade => ({
          time: trade.time,
          position: 'belowBar' as const,
          color: colors.entryColor || '#2196F3',
          shape: 'arrowUp' as const,
          text: trade.text || 'BUY Entry',
        }));

      const sellEntryMarkers = trades
        .filter(trade => trade.type === 'entry' && trade.direction === 'sell')
        .map(trade => ({
          time: trade.time,
          position: 'aboveBar' as const,
          color: colors.entryColor || '#2196F3',
          shape: 'arrowDown' as const,
          text: trade.text || 'SELL Entry',
        }));
        
      const buyExitMarkers = trades
        .filter(trade => trade.type === 'exit' && trade.direction === 'buy')
        .map(trade => ({
          time: trade.time,
          position: 'belowBar' as const,
          color: colors.exitColor || '#FF5252',
          shape: 'arrowUp' as const,
          text: trade.text || 'BUY Exit',
        }));
        
      const sellExitMarkers = trades
        .filter(trade => trade.type === 'exit' && trade.direction === 'sell')
        .map(trade => ({
          time: trade.time,
          position: 'aboveBar' as const,
          color: colors.exitColor || '#FF5252',
          shape: 'arrowDown' as const,
          text: trade.text || 'SELL Exit',
        }));
        
      const allMarkers = [
        ...buyEntryMarkers,
        ...sellEntryMarkers,
        ...buyExitMarkers,
        ...sellExitMarkers
      ];
      createSeriesMarkers(candlestickSeries, allMarkers);
    }

    if (candleData.length > initialVisibleBars) {
      const from = candleData.length - initialVisibleBars;
      const to = candleData.length - 1;
      
      chart.timeScale().setVisibleRange({
        from: candleData[from].time,
        to: candleData[to].time,
      });
    } else {
      chart.timeScale().fitContent();
    }
    
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [candleData, histoData, colors, trades,initialVisibleBars]);
  
  return <div ref={chartContainerRef} style={{ width: "100%", height: "100%"}}/>;
};

export default function CandleStickGraph({
  candleData, 
  histoData, 
  height = 400,
  trades,
  initialVisibleBars = 200,
  enableHistogram = true,
}: CandleStickGraphProps) {
  const formattedData = React.useMemo(() => {
    if (!candleData) return [];
    
    return candleData.map((item) => ({
      time: Number(item.time),
      open: Number(item.open),
      high: Number(item.high),
      low: Number(item.low),
      close: Number(item.close),
    }));
  }, [candleData]);  

  const formattedDataHist = React.useMemo(() => {
    if (!histoData || !enableHistogram) return [];
    
    return histoData.map((item) => ({
      time: Number(item.time),
      value: Number(item.value),
    }));
  }, [histoData, enableHistogram]);  

  if (!candleData || !histoData || formattedData.length === 0) {
    return (
      <div className="w-full h-max flex flex-col items-center justify-center border py-[8rem] rounded-xl">
        <Image
          src={NoGraph}
          alt="no graph available"
          className="w-[28rem]"
        />
        <div className={`${quicksand.className} md:text-2xl text-md`}>This Data does not support 15min format !!</div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "99%",
        height: `${height}px`,
        borderRadius: "10px",
        overflow: "hidden",
        border: "1px solid rgba(42, 46, 57, 0.1)",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
      }}
    >
      <ChartComponent
        candleData={formattedData}
        histoData={formattedDataHist}
        initialVisibleBars={initialVisibleBars}
        trades={trades}
        colors={{
          backgroundColor: "white",
          textColor: "black",
          upColor: "#26a69a",
          downColor: "#ef5350",
          borderVisible: false,
          wickUpColor: "#26a69a",
          wickDownColor: "#ef5350",
          volumeColor: "rgba(38, 166, 154, 0.4)",
        }}
      />
    </div>
  );
}