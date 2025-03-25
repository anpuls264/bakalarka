// src/components/TemperatureHumidityGraph/useTemperatureHumidityData.ts
import { useState, useEffect } from 'react';
import { ChartItem, TimeRange, getTimeRangeInMs } from '../common/ChartUtils';
import { deviceService } from '../../services/DeviceService';

export interface ProcessedData extends ChartItem {
  formattedDate: string;
}

export interface TemperatureHumidityStats {
  temperature?: { avg: number; max: number; min: number };
  humidity?: { avg: number; max: number; min: number };
}

export const useTemperatureHumidityData = (deviceId: string, timeRange: TimeRange, sampleSize = 100) => {
  const [processedData, setProcessedData] = useState<ChartItem[]>([]);
  const [stats, setStats] = useState<TemperatureHumidityStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // Statistiky jsou již vypočítány na serveru v rámci agregace
        const lastMetric = data[data.length - 1];
        if (lastMetric) {
          setStats({
            temperature: lastMetric.temperature !== undefined ? {
              avg: lastMetric.temperature,
              max: lastMetric.temperature,
              min: lastMetric.temperature
            } : undefined,
            humidity: lastMetric.humidity !== undefined ? {
              avg: lastMetric.humidity,
              max: lastMetric.humidity,
              min: lastMetric.humidity
            } : undefined
          });
        }

        setProcessedData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        console.error('Error fetching temperature/humidity data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [deviceId, timeRange, sampleSize]);

  return {
    processedData,
    stats,
    loading,
    error
  };
};
