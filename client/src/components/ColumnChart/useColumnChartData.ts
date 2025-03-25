import { useState, useEffect, useMemo } from 'react';
import { TimeRange, getTimeRangeInMs } from '../common/ChartUtils';
import { deviceService } from '../../services/DeviceService';

interface ChartDataItem {
  time: string;
  total: number;
}

export const useColumnChartData = (deviceId: string, timeRange: TimeRange) => {
  const [groupedData, setGroupedData] = useState<ChartDataItem[]>([]);
  const [averageConsumption, setAverageConsumption] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const currentTime = new Date();
        const rangeInMs = getTimeRangeInMs(timeRange);
        const startTime = new Date(currentTime.getTime() - rangeInMs);

        // Použít server-side filtrování a agregaci
        let groupBy: 'hour' | 'day' | 'month';
        switch (timeRange) {
          case TimeRange.DAY:
            groupBy = 'hour';
            break;
          case TimeRange.WEEK:
            groupBy = 'day';
            break;
          case TimeRange.MONTH:
            groupBy = 'month';
            break;
          default:
            groupBy = 'hour';
        }

        const data = await deviceService.getDeviceMetrics(deviceId, {
          startDate: startTime,
          endDate: currentTime,
          groupBy
        });

        // Data jsou již seskupena na serveru
        // Data jsou již seskupena na serveru ve správném formátu
        setGroupedData(data.map(item => ({
          time: item.time || '',
          total: item.total || 0
        })));

        // Vypočítat průměrnou spotřebu
        if (data.length > 0) {
          const sum = data.reduce((acc, item) => acc + (item.total || 0), 0);
          setAverageConsumption(sum / data.length);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        console.error('Error fetching column chart data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [deviceId, timeRange]);

  // Nastavení vlastností pro chart
  const chartProperties = useMemo(() => ({
    barSize: timeRange === TimeRange.MONTH ? 15 : 30,
  }), [timeRange]);

  return {
    groupedData,
    averageConsumption,
    chartProperties,
    loading,
    error
  };
};
