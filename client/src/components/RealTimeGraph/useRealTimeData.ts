// src/components/RealTimeGraph/useRealTimeData.ts
import { useMemo, useState, useEffect } from 'react';
import { ChartItem, TimeRange, getTimeRangeInMs } from '../common/ChartUtils';

export interface ProcessedData extends ChartItem {
  formattedDate: string;
}

export interface ChartStats {
  current: { avg: number; max: number; min: number };
  apower: { avg: number; max: number; min: number };
  voltage: { avg: number; max: number; min: number };
}

export interface HighlightedArea {
  start: number;
  end: number;
}

export const useRealTimeData = (data: ChartItem[], timeRange: TimeRange, sampleSize = 100) => {
  const [highlightedArea, setHighlightedArea] = useState<HighlightedArea | null>(null);

  // Filtruj data podle časového rozsahu
  const filteredData = useMemo(() => {
    const currentTime = new Date().getTime();
    const rangeInMs = getTimeRangeInMs(timeRange);
    const startTime = rangeInMs === Infinity ? 0 : currentTime - rangeInMs;
    
    return data.filter((entry) => {
      const entryTime = new Date(entry.timestamp).getTime();
      return entryTime >= startTime && entryTime <= currentTime;
    });
  }, [data, timeRange]);

  // Downsampling dat pro lepší výkon vykreslování
  const downsampledData = useMemo(() => {
    if (filteredData.length <= sampleSize) return filteredData;
    
    const result = [];
    const step = Math.ceil(filteredData.length / sampleSize);
    
    for (let i = 0; i < filteredData.length; i += step) {
      // Pro každý krok spočítej průměr všech bodů v okně
      const windowData = filteredData.slice(i, Math.min(i + step, filteredData.length));
      const avgItem = windowData.reduce((acc, curr) => {
        return {
          ...acc,
          apower: acc.apower + curr.apower / windowData.length,
          voltage: acc.voltage + curr.voltage / windowData.length,
          current: acc.current + curr.current / windowData.length,
          total: acc.total + curr.total / windowData.length
        };
      }, {
        ...windowData[0],
        apower: 0,
        voltage: 0,
        current: 0,
        total: 0
      });
      
      result.push(avgItem);
    }

    return result;
  }, [filteredData, sampleSize]);

  // Spočítej statistiky pro všechny metriky
  const calculateStats = useMemo((): ChartStats => {
    if (downsampledData.length === 0) {
      return { 
        current: { avg: 0, max: 0, min: 0 }, 
        apower: { avg: 0, max: 0, min: 0 }, 
        voltage: { avg: 0, max: 0, min: 0 } 
      };
    }
    
    const metrics = ['current', 'apower', 'voltage'];
    const stats: any = {};
    
    metrics.forEach(metric => {
      const values = downsampledData.map(item => (item as any)[metric] || 0);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);
      
      stats[metric] = { avg, max, min };
    });
    
    return stats as ChartStats;
  }, [downsampledData]);

  // Najdi období s nejvyšší spotřebou
  const findPeakPeriod = useMemo((): HighlightedArea | null => {
    if (downsampledData.length < 2) return null;
    
    let maxAvgPower = 0;
    let peakStart = 0;
    let peakEnd = 0;
    
    // Použij posuvné okno pro nalezení období s nejvyšší průměrnou spotřebou
    const windowSize = Math.max(5, Math.floor(downsampledData.length / 10));
    
    for (let i = 0; i <= downsampledData.length - windowSize; i++) {
      const windowData = downsampledData.slice(i, i + windowSize);
      const avgPower = windowData.reduce((sum, item) => sum + (item.apower || 0), 0) / windowSize;
      
      if (avgPower > maxAvgPower) {
        maxAvgPower = avgPower;
        peakStart = i;
        peakEnd = i + windowSize - 1;
      }
    }
    
    if (peakStart !== peakEnd) {
      return {
        start: new Date(downsampledData[peakStart].timestamp).getTime(),
        end: new Date(downsampledData[peakEnd].timestamp).getTime()
      };
    }
    
    return null;
  }, [downsampledData]);

  // Sleduj změny v peakPeriod
  useEffect(() => {
    setHighlightedArea(findPeakPeriod);
  }, [findPeakPeriod]);

  return {
    processedData: downsampledData,
    stats: calculateStats,
    highlightedArea,
  };
};