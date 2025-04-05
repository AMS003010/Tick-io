"use client";

import { createChart, ColorType, CandlestickSeries, CrosshairMode, Time } from "lightweight-charts";
import React, { useEffect, useRef, useMemo } from "react";
import { Quicksand } from "next/font/google";
import Image from "next/image";

import NoGraph from '@/public/nothing-here.png'; 

const quicksand = Quicksand({
  weight:'600',
  subsets: ['latin', 'latin-ext'],
  preload: true,
})

interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  time: number | string;
}

interface FormattedCandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  time: string;
}

interface SeriesConfig {
  data: CandleData[];
  label: string;
  color: string;
}

type ChartProps = {
  seriesConfigs: {
    data: FormattedCandleData[];
    label: string;
    color: string;
  }[];
  colors?: {
    backgroundColor?: string;
    textColor?: string;
    crosshairColor?: string;
  };
  initialVisibleBars?: number;
};

interface MultipleCandleGraphProps {
  seriesConfigs: SeriesConfig[];
  height?: number;
  initialVisibleBars?: number;
}

const DEFAULT_COLORS = [
  '#ef5350', // Red
  '#42a5f5', // Blue
  '#26a69a', // Green
  '#ab47bc', // Purple
  '#ec407a', // Pink
  '#7e57c2', // Deep Purple
  '#5c6bc0', // Indigo
  '#ffa726', // Orange
  '#29b6f6', // Light Blue
  '#66bb6a', // Light Green
];

const formatLabelAsDate = (timestamp: string | number): string => {
  const date = new Date(typeof timestamp === "string" ? parseInt(timestamp) : timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ChartComponent: React.FC<ChartProps> = ({ 
  seriesConfigs,
  colors = {
    backgroundColor: "white",
    textColor: "black",
    crosshairColor: 'rgba(42, 46, 57, 0.5)',
  },
  initialVisibleBars = 50
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!chartContainerRef.current || !tooltipRef.current || seriesConfigs.length === 0) return;
    
    // Create custom tooltip element
    const tooltip = tooltipRef.current;
    tooltip.style.position = 'absolute';
    tooltip.style.display = 'none';
    tooltip.style.padding = '8px 12px';
    tooltip.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    tooltip.style.fontSize = '12px';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    tooltip.style.borderRadius = '4px';
    tooltip.style.zIndex = '1000';
    tooltip.style.border = '1px solid rgba(0, 0, 0, 0.1)';
    tooltip.style.maxHeight = '300px';
    tooltip.style.overflowY = 'auto';
    
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: colors.backgroundColor },
        textColor: colors.textColor,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: colors.crosshairColor,
          width: 1,
          style: 2,
          visible: true,
          labelVisible: false,
        },
        horzLine: {
          color: colors.crosshairColor,
          width: 1,
          style: 2,
          visible: true,
          labelVisible: true,
        },
      },
      grid: {
        vertLines: {
          color: 'rgba(197, 203, 206, 0.3)',
        },
        horzLines: {
          color: 'rgba(197, 203, 206, 0.3)',
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(197, 203, 206, 0.8)',
      },
    });
    
    const allSeries: { series: any; config: { label: string; color: string } }[] = [];
    
    seriesConfigs.forEach((config) => {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: config.color,
        downColor: config.color,
        borderVisible: false,
        wickUpColor: config.color,
        wickDownColor: config.color,
      });
      
      series.setData(config.data);
      allSeries.push({ series, config });
    });
    
    chart.subscribeCrosshairMove((param) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartContainerRef.current!.clientWidth ||
        param.point.y < 0 ||
        param.point.y > chartContainerRef.current!.clientHeight
      ) {
        tooltip.style.display = 'none';
      } else {
        const dateStr = param.time as string;
        
        tooltip.style.display = 'block';
        tooltip.style.left = `${param.point.x}px`;
        tooltip.style.top = `${param.point.y}px`;
        
        let tooltipContent = `<div style="font-weight:bold;margin-bottom:8px;color:black">${formatLabelAsDate(dateStr)}</div>`;
        
        allSeries.forEach(({ series, config }) => {
          const data = param.seriesData.get(series) as any;
          
          if (data) {
            tooltipContent += `
              <div style="margin-bottom:8px;color:${config.color};">
                <span style="font-weight:bold;margin-bottom:4px;display:block;">${config.label}</span>
                <div style="display:grid;grid-template-columns:auto auto;gap:4px 12px;">
                  <div>Open:</div><div>${data.open.toFixed(2)}</div>
                  <div>High:</div><div>${data.high.toFixed(2)}</div>
                  <div>Low:</div><div>${data.low.toFixed(2)}</div>
                  <div>Close:</div><div>${data.close.toFixed(2)}</div>
                </div>
              </div>
            `;
          }
        });
        
        tooltip.innerHTML = tooltipContent;
        
        const tooltipRect = tooltip.getBoundingClientRect();
        const chartRect = chartContainerRef.current!.getBoundingClientRect();
        
        if (tooltipRect.right > chartRect.right) {
          tooltip.style.left = `${param.point.x - tooltipRect.width}px`;
        }
        
        if (tooltipRect.bottom > chartRect.bottom) {
          tooltip.style.top = `${param.point.y - tooltipRect.height}px`;
        }
      }
    });
    
    if (seriesConfigs[0]?.data.length > initialVisibleBars) {
      const data = seriesConfigs[0].data;
      const from = data.length - initialVisibleBars;
      const to = data.length - 1;
      
      chart.timeScale().setVisibleRange({
        from: data[from].time as Time,
        to: data[to].time as Time,
      });
    } else {
      chart.timeScale().fitContent();
    }
    
    const legend = document.createElement('div');
    legend.style.position = 'absolute';
    legend.style.top = '5px';
    legend.style.left = '10px';
    legend.style.zIndex = '1';
    legend.style.fontSize = '12px';
    legend.style.padding = '8px';
    legend.style.borderRadius = '4px';
    legend.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
    legend.style.maxHeight = '90%';
    legend.style.overflowY = 'auto';
    legend.style.maxWidth = '200px';
    
    let legendHTML = '';
    seriesConfigs.forEach((config) => {
      legendHTML += `
        <div style="display:flex;align-items:center;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:black">
          <div style="flex-shrink:0;width:15px;height:15px;background-color:${config.color};margin-right:5px;"></div>
          <span title="${config.label}">${config.label}</span>
        </div>
      `;
    });
    legend.innerHTML = legendHTML;
    chartContainerRef.current.appendChild(legend);
    
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
      if (chartContainerRef.current?.contains(legend)) {
        chartContainerRef.current.removeChild(legend);
      }
    };
  }, [seriesConfigs, colors, initialVisibleBars]);
  
  return (
    <>
      <div ref={chartContainerRef} style={{ width: "100%", height: "100%", position: "relative" }}/>
      <div ref={tooltipRef} />
    </>
  );
};

export default function MultipleCandleGraph({
  seriesConfigs,
  height = 400,
  initialVisibleBars = 50,
}: MultipleCandleGraphProps) {

  const getColorByIndex = (index:number): string => {
    return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  }

  let formattedSeriesConfigs = useMemo(() => {
    if (!seriesConfigs || seriesConfigs.length === 0) return [];
    
    return seriesConfigs.map((config, index) => {
      const { data, label, color = DEFAULT_COLORS[index % DEFAULT_COLORS.length] } = config;
      
      if (!data || data.length === 0) return null;
      
      const timeMap = new Map();
      
      data.forEach(item => {
        const timestamp = typeof item.time === 'string' ? item.time : Number(item.time);
        timeMap.set(timestamp, {
          time: timestamp,
          open: Number(item.open),
          high: Number(item.high),
          low: Number(item.low),
          close: Number(item.close),
        });
      });
      
      const formattedData = Array.from(timeMap.values())
        .sort((a, b) => {
          const timeA = typeof a.time === 'string' ? a.time : a.time;
          const timeB = typeof b.time === 'string' ? b.time : b.time;
          return timeA < timeB ? -1 : 1;
        })
        .map(item => {
          return {
            time: item.time,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
          };
        });
      
      return {
        data: formattedData,
        label: label || `Series ${index + 1}`,
        color
      };
    }).filter(Boolean) as {
      data: FormattedCandleData[];
      label: string;
      color: string;
    }[];
  }, [seriesConfigs]);
  
  if (formattedSeriesConfigs.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center border rounded-2xl" style={{ height: `${height}px` }}>
        <div>
          <Image
            src={NoGraph}
            alt="noting to plot"
            className="w-[28rem]"
          />
        </div>
        <div className={`${quicksand.className} text-3xl`}>No data available to display</div>
      </div>
    );
  } else {
    formattedSeriesConfigs = formattedSeriesConfigs.map((config, index) => ({
      ...config,
      color: getColorByIndex(index),
    }))
  }
  
  return (
    <div
      style={{
        width: "100%",
        height: `${height}px`,
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid rgba(42, 46, 57, 0.1)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        position: 'relative'
      }}
    >
      <ChartComponent 
        seriesConfigs={formattedSeriesConfigs}
        initialVisibleBars={initialVisibleBars}
        colors={{
          backgroundColor: "white",
          textColor: "black",
          crosshairColor: 'rgba(42, 46, 57, 0.5)',
        }}
      />
    </div>
  );
}