import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material';
import { ChartItem, TimeRange, getTimeRangeInMs } from '../common/ChartUtils';

export interface TimeDistribution {
  name: string;
  value: number;
  color: string;
  percent?: number; // Přidáno pole pro procenta
}

export const usePieChartData = (data: ChartItem[], timeRange: TimeRange) => {
  const theme = useTheme();
  const [distributionData, setDistributionData] = useState<TimeDistribution[]>([]);
  
  // Definice barev podle tématu
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.warning?.main || '#FFBB28',
    theme.palette.info?.main || '#0088FE',
    theme.palette.success?.main || '#00C49F',
    theme.palette.error.main
  ];

  // Výpočet distribuce dat podle časového rozsahu
  const calculateDistribution = (data: ChartItem[], range: TimeRange): TimeDistribution[] => {
    if (data.length === 0) return [];

    const currentTime = new Date().getTime();
    const timeRangeMs = getTimeRangeInMs(range);
    const startTime = currentTime - timeRangeMs;
    
    const filteredData = data.filter(item => {
      const itemTime = new Date(item.timestamp).getTime();
      return itemTime >= startTime && itemTime <= currentTime;
    });

    if (filteredData.length === 0) return [];

    let resultData: TimeDistribution[] = [];

    // Pro den: rozdělení na ráno, odpoledne, večer, noc
    if (range === TimeRange.DAY) {
      const morning = { name: 'Ráno (6-12)', value: 0, color: COLORS[0] };
      const afternoon = { name: 'Odpoledne (12-18)', value: 0, color: COLORS[1] };
      const evening = { name: 'Večer (18-24)', value: 0, color: COLORS[2] };
      const night = { name: 'Noc (0-6)', value: 0, color: COLORS[3] };

      filteredData.forEach(item => {
        const hour = new Date(item.timestamp).getHours();
        
        if (hour >= 6 && hour < 12) {
          morning.value += item.total;
        } else if (hour >= 12 && hour < 18) {
          afternoon.value += item.total;
        } else if (hour >= 18 && hour < 24) {
          evening.value += item.total;
        } else {
          night.value += item.total;
        }
      });

      resultData = [morning, afternoon, evening, night].filter(segment => segment.value > 0);
    }

    // Pro týden: rozdělení na pracovní dny a víkend
    else if (range === TimeRange.WEEK) {
      const weekdays = { name: 'Pracovní dny', value: 0, color: COLORS[0] };
      const weekend = { name: 'Víkend', value: 0, color: COLORS[1] };

      filteredData.forEach(item => {
        const day = new Date(item.timestamp).getDay();
        
        if (day === 0 || day === 6) { // 0 je neděle, 6 je sobota
          weekend.value += item.total;
        } else {
          weekdays.value += item.total;
        }
      });

      resultData = [weekdays, weekend].filter(segment => segment.value > 0);
    }

    // Pro měsíc: rozdělení na týdny
    else if (range === TimeRange.MONTH) {
      const weeks: { [key: string]: TimeDistribution } = {
        'Týden 1': { name: 'Týden 1', value: 0, color: COLORS[0] },
        'Týden 2': { name: 'Týden 2', value: 0, color: COLORS[1] },
        'Týden 3': { name: 'Týden 3', value: 0, color: COLORS[2] },
        'Týden 4': { name: 'Týden 4', value: 0, color: COLORS[3] },
        'Týden 5': { name: 'Týden 5', value: 0, color: COLORS[4] }
      };

      filteredData.forEach(item => {
        const date = new Date(item.timestamp);
        const dayOfMonth = date.getDate();
        
        if (dayOfMonth <= 7) {
          weeks['Týden 1'].value += item.total;
        } else if (dayOfMonth <= 14) {
          weeks['Týden 2'].value += item.total;
        } else if (dayOfMonth <= 21) {
          weeks['Týden 3'].value += item.total;
        } else if (dayOfMonth <= 28) {
          weeks['Týden 4'].value += item.total;
        } else {
          weeks['Týden 5'].value += item.total;
        }
      });

      resultData = Object.values(weeks).filter(week => week.value > 0);
    }

    // NOVÉ: Výpočet procent pro každý segment
    if (resultData.length > 0) {
      const totalValue = resultData.reduce((sum, item) => sum + item.value, 0);
      
      return resultData.map(item => ({
        ...item,
        percent: totalValue > 0 ? item.value / totalValue : 0
      }));
    }

    return resultData;
  };

  // Aktualizace dat při změně dat nebo časového rozsahu
  useEffect(() => {
    setDistributionData(calculateDistribution(data, timeRange));
  }, [data, timeRange]);

  // Pomocná funkce pro formátování hodnot
  const formatValue = (value: number): string => {
    if (isNaN(value)) return 'N/A';
    return `${(value / 1000).toFixed(2)} kWh`;
  };

  return {
    distributionData,
    formatValue
  };
};