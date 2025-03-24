// components/ColumnChart/ColumnChartUtils.ts
import { ChartItem, TimeRange } from '../common/ChartUtils';

export interface ChartDataItem {
  time: string;
  total: number;
}

export const groupDataByTimeRange = (data: ChartItem[], range: TimeRange): ChartDataItem[] => {
  const groupedData: ChartDataItem[] = [];
  const currentDate = new Date();

  switch (range) {
    case TimeRange.DAY:
      for (let i = 0; i < 24; i++) {
        const startTime = new Date(currentDate).setHours(i, 0, 0, 0);
        const endTime = new Date(currentDate).setHours(i + 1, 0, 0, 0);
        
        const total = calculateTotalInRange(data, startTime, endTime);
        groupedData.push({
          time: `${i}:00`,
          total,
        });
      }
      break;
      
    case TimeRange.WEEK:
      const daysOfWeek = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
      const currentDay = currentDate.getDay(); // 0 = neděle, 1 = pondělí, ...
      const firstDayOfWeek = currentDay === 0 ? 6 : currentDay - 1; // Převod na pondělí = 0
      
      for (let i = 0; i < 7; i++) {
        const dayIndex = (i + firstDayOfWeek) % 7;
        const startTime = new Date(currentDate).setDate(currentDate.getDate() - firstDayOfWeek + i);
        const endTime = new Date(currentDate).setDate(currentDate.getDate() - firstDayOfWeek + i + 1);
        
        const total = calculateTotalInRange(data, startTime, endTime);
        groupedData.push({
          time: daysOfWeek[dayIndex],
          total,
        });
      }
      break;
      
    case TimeRange.MONTH:
      const daysInMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      ).getDate();
      
      for (let i = 1; i <= daysInMonth; i++) {
        const startTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), i, 0, 0, 0).getTime();
        const endTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1, 0, 0, 0).getTime();
        
        const total = calculateTotalInRange(data, startTime, endTime);
        groupedData.push({
          time: `${i}`,
          total,
        });
      }
      break;
  }

  return groupedData;
};

const calculateTotalInRange = (data: ChartItem[], startTime: number, endTime: number): number => {
  return data
    .filter(entry => {
      const entryTime = new Date(entry.timestamp).getTime();
      return entryTime >= startTime && entryTime < endTime;
    })
    .reduce((acc, entry) => acc + entry.total, 0);
};