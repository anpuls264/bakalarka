import { useState, useEffect, useMemo } from 'react';
import { ChartItem, TimeRange, getTimeRangeInMs, getItemTimestamp } from '../common/ChartUtils';
import { deviceService } from '../../services/DeviceService';

export const useChartData = (deviceId: string, timeRange: TimeRange, movingAvgWindow = 5) => {
  const [rawData, setRawData] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate average power
  const averagePower = useMemo(() => {
    if (rawData.length === 0) return 0;
    return rawData.reduce((sum, item) => sum + (item.apower || 0), 0) / rawData.length;
  }, [rawData]);

  // Calculate moving average
  const processedData = useMemo(() => {
    return rawData.map((item, index, array) => {
      if (index < movingAvgWindow - 1) return { ...item };
      
      let sum = 0;
      for (let i = 0; i < movingAvgWindow; i++) {
        sum += array[index - i].apower || 0;
      }
      
      return {
        ...item,
        movingAvg: sum / movingAvgWindow
      };
    });
  }, [rawData, movingAvgWindow]);

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
          interval: Math.ceil(rangeInMs / 100) // Interval pro agregaci na serveru
        });

        setRawData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        console.error('Error fetching line chart data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [deviceId, timeRange, movingAvgWindow]);

  return {
    processedData,
    averagePower,
    loading,
    error
  };
};
