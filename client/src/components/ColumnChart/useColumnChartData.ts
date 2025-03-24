import { useMemo } from 'react';
import { ChartItem, TimeRange, getTimeRangeInMs } from '../common/ChartUtils';
import { groupDataByTimeRange } from './ColumnChartUtils';

export const useColumnChartData = (data: ChartItem[], timeRange: TimeRange) => {
  // Filtrovat data podle časového rozsahu
  const filteredData = useMemo(() => {
    const currentTime = new Date().getTime();
    const rangeInMs = getTimeRangeInMs(timeRange);
    const startTime = currentTime - rangeInMs;
    
    return data.filter((entry) => {
      const entryTime = new Date(entry.timestamp).getTime();
      return entryTime >= startTime && entryTime <= currentTime;
    });
  }, [data, timeRange]);

  // Seskupit data podle časového rozsahu
  const groupedData = useMemo(() => {
    return groupDataByTimeRange(filteredData, timeRange);
  }, [filteredData, timeRange]);

  // Vypočítat průměrnou spotřebu
  const averageConsumption = useMemo(() => {
    if (groupedData.length === 0) return 0;
    const sum = groupedData.reduce((acc, item) => acc + item.total, 0);
    return sum / groupedData.length;
  }, [groupedData]);

  // Nastavení vlastností pro chart
  const chartProperties = useMemo(() => {
    return {
      barSize: timeRange === TimeRange.MONTH ? 15 : 30,
    };
  }, [timeRange]);

  return {
    groupedData,
    averageConsumption,
    chartProperties
  };
};