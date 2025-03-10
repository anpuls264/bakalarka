import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { Item } from '../types/types';
import { useTheme } from '@mui/material';
import './PieChart.css';

interface PieChartProps {
  data: Item[];
}

interface TimeDistribution {
  name: string;
  value: number;
  color: string;
}

const PieChart: React.FC<PieChartProps> = ({ data }) => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState<string>('day');
  const [distributionData, setDistributionData] = useState<TimeDistribution[]>([]);
  
  // Define colors based on theme
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.warning?.main || '#FFBB28',
    theme.palette.info?.main || '#0088FE',
    theme.palette.success?.main || '#00C49F',
    theme.palette.error.main
  ];

  useEffect(() => {
    setDistributionData(calculateDistribution(data, timeRange));
  }, [data, timeRange]);

  const calculateDistribution = (data: Item[], range: string): TimeDistribution[] => {
    if (data.length === 0) return [];

    const currentTime = new Date().getTime();
    let timeRangeMs = 0;

    switch (range) {
      case 'day':
        timeRangeMs = 86400000; // 24 hours
        break;
      case 'week':
        timeRangeMs = 604800000; // 7 days
        break;
      case 'month':
        timeRangeMs = 2592000000; // 30 days
        break;
      default:
        timeRangeMs = 86400000; // Default to day
    }

    const startTime = currentTime - timeRangeMs;
    const filteredData = data.filter(item => {
      const itemTime = new Date(item.timestamp).getTime();
      return itemTime >= startTime && itemTime <= currentTime;
    });

    if (filteredData.length === 0) return [];

    // For day: divide into morning, afternoon, evening, night
    if (range === 'day') {
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

      return [morning, afternoon, evening, night].filter(segment => segment.value > 0);
    }

    // For week: divide into weekdays and weekend
    if (range === 'week') {
      const weekdays = { name: 'Pracovní dny', value: 0, color: COLORS[0] };
      const weekend = { name: 'Víkend', value: 0, color: COLORS[1] };

      filteredData.forEach(item => {
        const day = new Date(item.timestamp).getDay();
        
        if (day === 0 || day === 6) { // 0 is Sunday, 6 is Saturday
          weekend.value += item.total;
        } else {
          weekdays.value += item.total;
        }
      });

      return [weekdays, weekend].filter(segment => segment.value > 0);
    }

    // For month: divide into weeks
    if (range === 'month') {
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

      return Object.values(weeks).filter(week => week.value > 0);
    }

    return [];
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
  };

  const formatValue = (value: number) => {
    if (isNaN(value)) return 'N/A';
    return `${(value / 1000).toFixed(2)} kWh`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-pie-tooltip" style={{ 
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`
        }}>
          <p className="label">{`${payload[0].name}: ${formatValue(payload[0].value)}`}</p>
          <p className="percent">{`${(payload[0].percent * 100).toFixed(1)}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="pie-chart-container">
      <h3>Distribuce spotřeby energie</h3>
      <div className="filter-buttons">
        <button
          onClick={() => handleTimeRangeChange('day')}
          className={timeRange === 'day' ? 'active' : ''}
        >
          Den
        </button>
        <button
          onClick={() => handleTimeRangeChange('week')}
          className={timeRange === 'week' ? 'active' : ''}
        >
          Týden
        </button>
        <button
          onClick={() => handleTimeRangeChange('month')}
          className={timeRange === 'month' ? 'active' : ''}
        >
          Měsíc
        </button>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <RechartsPieChart>
          <Pie
            data={distributionData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={150}
            fill={theme.palette.primary.main}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {distributionData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChart;
