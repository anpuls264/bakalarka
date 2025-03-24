// components/LineChart/useChartData.ts
import { useMemo } from 'react';
import { ChartItem, TimeRange, getTimeRangeInMs } from '../common/ChartUtils';

export const useChartData = (data: ChartItem[], timeRange: TimeRange, movingAvgWindow = 5) => {
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

  // Vypočítej průměrný výkon
  const averagePower = useMemo(() => {
    if (filteredData.length === 0) return 0;
    return filteredData.reduce((sum, item) => sum + (item.apower || 0), 0) / filteredData.length;
  }, [filteredData]);

  // Vypočítej klouzavý průměr
  const dataWithMovingAverage = useMemo(() => {
    return filteredData.map((item, index, array) => {
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
  }, [filteredData, movingAvgWindow]);

  return {
    processedData: dataWithMovingAverage,
    averagePower
  };
};