import { useState, useEffect, useMemo } from 'react';
import { ChartItem, TimeRange, getTimeRangeInMs, getItemTimestamp } from '../common/ChartUtils';
import { deviceService } from '../../services/DeviceService';

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

export const useRealTimeData = (deviceId: string, timeRange: TimeRange, sampleSize = 100) => {
  const [rawData, setRawData] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate stats from raw data
  const stats = useMemo<ChartStats>(() => {
    if (rawData.length === 0) {
      return {
        current: { avg: 0, max: 0, min: 0 },
        apower: { avg: 0, max: 0, min: 0 },
        voltage: { avg: 0, max: 0, min: 0 }
      };
    }

    const initialStats = {
      current: { sum: 0, max: -Infinity, min: Infinity, count: 0 },
      apower: { sum: 0, max: -Infinity, min: Infinity, count: 0 },
      voltage: { sum: 0, max: -Infinity, min: Infinity, count: 0 }
    };

    const aggregated = rawData.reduce((acc, item) => {
      if (typeof item.current === 'number') {
        acc.current.sum += item.current;
        acc.current.max = Math.max(acc.current.max, item.current);
        acc.current.min = Math.min(acc.current.min, item.current);
        acc.current.count++;
      }
      if (typeof item.apower === 'number') {
        acc.apower.sum += item.apower;
        acc.apower.max = Math.max(acc.apower.max, item.apower);
        acc.apower.min = Math.min(acc.apower.min, item.apower);
        acc.apower.count++;
      }
      if (typeof item.voltage === 'number') {
        acc.voltage.sum += item.voltage;
        acc.voltage.max = Math.max(acc.voltage.max, item.voltage);
        acc.voltage.min = Math.min(acc.voltage.min, item.voltage);
        acc.voltage.count++;
      }
      return acc;
    }, initialStats);

    return {
      current: {
        avg: aggregated.current.count > 0 ? aggregated.current.sum / aggregated.current.count : 0,
        max: aggregated.current.max !== -Infinity ? aggregated.current.max : 0,
        min: aggregated.current.min !== Infinity ? aggregated.current.min : 0
      },
      apower: {
        avg: aggregated.apower.count > 0 ? aggregated.apower.sum / aggregated.apower.count : 0,
        max: aggregated.apower.max !== -Infinity ? aggregated.apower.max : 0,
        min: aggregated.apower.min !== Infinity ? aggregated.apower.min : 0
      },
      voltage: {
        avg: aggregated.voltage.count > 0 ? aggregated.voltage.sum / aggregated.voltage.count : 0,
        max: aggregated.voltage.max !== -Infinity ? aggregated.voltage.max : 0,
        min: aggregated.voltage.min !== Infinity ? aggregated.voltage.min : 0
      }
    };
  }, [rawData]);

  // Process data for chart display
  const processedData = useMemo(() => rawData, [rawData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const currentTime = new Date();
        const rangeInMs = getTimeRangeInMs(timeRange);
        const startTime = rangeInMs === Infinity ? 
          new Date(0) : 
          new Date(currentTime.getTime() - rangeInMs);

        // Použít server-side filtrování a agregaci
        const data = await deviceService.getDeviceMetrics(deviceId, {
          startDate: startTime,
          endDate: currentTime,
          interval: Math.ceil(rangeInMs / sampleSize) // Interval pro agregaci na serveru
        });

        setRawData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        console.error('Error fetching real-time data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [deviceId, timeRange, sampleSize]);

  // Najdi období s nejvyšší spotřebou
  const highlightedArea = useMemo((): HighlightedArea | null => {
    if (processedData.length < 2) return null;
    
    let maxAvgPower = 0;
    let peakStart = 0;
    let peakEnd = 0;
    
    // Použij posuvné okno pro nalezení období s nejvyšší průměrnou spotřebou
    const windowSize = Math.max(5, Math.floor(processedData.length / 10));
    
    for (let i = 0; i <= processedData.length - windowSize; i++) {
      const windowData = processedData.slice(i, i + windowSize);
      const avgPower = windowData.reduce((sum, item) => sum + (item.apower || 0), 0) / windowSize;
      
      if (avgPower > maxAvgPower) {
        maxAvgPower = avgPower;
        peakStart = i;
        peakEnd = i + windowSize - 1;
      }
    }
    
    if (peakStart !== peakEnd) {
      return {
        start: getItemTimestamp(processedData[peakStart]).getTime(),
        end: getItemTimestamp(processedData[peakEnd]).getTime()
      };
    }
    
    return null;
  }, [processedData]);

  return {
    processedData,
    stats,
    highlightedArea,
    loading,
    error
  };
};
