import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@mui/material';
import { ChartItem, TimeRange, getTimeRangeInMs, getItemTimestamp } from '../common/ChartUtils';
import { deviceService } from '../../services/DeviceService';

export interface TimeDistribution {
  name: string;
  value: number;
  color: string;
  percent?: number;
}

export const usePieChartData = (deviceId: string, timeRange: TimeRange) => {
  const theme = useTheme();
  const [rawData, setRawData] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize colors
  const COLORS = useMemo(() => [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.warning?.main || '#FFBB28',
    theme.palette.info?.main || '#0088FE',
    theme.palette.success?.main || '#00C49F',
    theme.palette.error.main
  ], [theme.palette]);

  // Memoize distribution data calculation
  const distributionData = useMemo(() => {
    if (rawData.length === 0) return [];

    // Group data based on timeRange
    const groupBy = timeRange === TimeRange.DAY ? 'hour' :
                   timeRange === TimeRange.WEEK ? 'day' :
                   'week';

    // Create distribution data with colors
    const segments = rawData.map((item, index) => ({
      name: item.time || '',
      value: item.total || 0,
      color: COLORS[index % COLORS.length]
    }));

    // Calculate percentages
    const totalValue = segments.reduce((sum, item) => sum + item.value, 0);
    return segments.map(item => ({
      ...item,
      percent: totalValue > 0 ? item.value / totalValue : 0
    }));
  }, [rawData, timeRange, COLORS]);

  // Fetch data and update distribution
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const currentTime = new Date();
        const rangeInMs = getTimeRangeInMs(timeRange);
        const startTime = new Date(currentTime.getTime() - rangeInMs);

        // Použít server-side filtrování
        const data = await deviceService.getDeviceMetrics(deviceId, {
          startDate: startTime,
          endDate: currentTime,
          interval: Math.ceil(rangeInMs / 100) // Interval pro agregaci na serveru
        });

        setRawData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        console.error('Error fetching pie chart data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [deviceId, timeRange]);

  // Memoize value formatter
  const formatValue = useMemo(() => (value: number): string => {
    if (isNaN(value)) return 'N/A';
    return `${(value / 1000).toFixed(2)} kWh`;
  }, []);

  return {
    distributionData,
    formatValue,
    loading,
    error
  };
};
