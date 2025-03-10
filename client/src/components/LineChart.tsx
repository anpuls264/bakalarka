import React, { useState } from 'react';
import { 
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  XAxis,
  YAxis,
  Line,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from 'recharts';
import { Item } from '../types/types';
import { useTheme } from '@mui/material';
import './LineChart.css';

interface LineChartProps {
  data: Item[];
}

const LineChart: React.FC<LineChartProps> = ({ data }) => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState<string>('day');
  const currentTime = new Date().getTime();

  const getTimeRange = (): number => {
    const timeRanges: { [key: string]: number } = {
      hour: 3600000,
      day: 86400000,
      week: 604800000,
      month: 2592000000,
      max: Infinity
    };
    return timeRanges[timeRange] || 3600000;
  };

  const filteredData = data.filter(entry => {
    const entryTime = new Date(entry.timestamp).getTime();
    const startTime = currentTime - getTimeRange();
    return entryTime >= startTime && entryTime <= currentTime;
  });

  // Calculate average power
  const averagePower = filteredData.length > 0 
    ? filteredData.reduce((sum, item) => sum + item.apower, 0) / filteredData.length 
    : 0;

  // Calculate moving average for smoother trend line
  const calculateMovingAverage = (data: Item[], window: number = 5) => {
    return data.map((item, index, array) => {
      if (index < window - 1) return { ...item };
      
      let sum = 0;
      for (let i = 0; i < window; i++) {
        sum += array[index - i].apower;
      }
      
      return {
        ...item,
        movingAvg: sum / window
      };
    });
  };

  const dataWithMovingAverage = calculateMovingAverage(filteredData);

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {};

    switch (timeRange) {
      case 'hour':
        options.hour = '2-digit';
        options.minute = '2-digit';
        break;
      case 'day':
        options.hour = '2-digit';
        break;
      case 'week':
        options.weekday = 'short';
        break;
      case 'month':
      case 'max':
        options.day = '2-digit';
        options.month = '2-digit';
        break;
      default:
        break;
    }

    return date.toLocaleString('cs-CZ', options);
  };

  return (
    <div className="line-chart-container">
      <h3>Trend spotřeby energie</h3>
      <div className="filter-buttons">
        <button
          onClick={() => handleTimeRangeChange('hour')}
          className={timeRange === 'hour' ? 'active' : ''}
        >
          1H
        </button>
        <button
          onClick={() => handleTimeRangeChange('day')}
          className={timeRange === 'day' ? 'active' : ''}
        >
          1D
        </button>
        <button
          onClick={() => handleTimeRangeChange('week')}
          className={timeRange === 'week' ? 'active' : ''}
        >
          1W
        </button>
        <button
          onClick={() => handleTimeRangeChange('month')}
          className={timeRange === 'month' ? 'active' : ''}
        >
          1M
        </button>
        <button
          onClick={() => handleTimeRangeChange('max')}
          className={timeRange === 'max' ? 'active' : ''}
        >
          Max
        </button>
      </div>
      <ResponsiveContainer width="100%" height={400}>  
        <RechartsLineChart
          width={500}
          height={400}
          data={dataWithMovingAverage}
          margin={{
            top: 40,
            right: 30,
            left: 0,
            bottom: 30,
          }}
        >
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={formatDate}
            minTickGap={30}
          />
          <YAxis />
          <CartesianGrid opacity={0.1} vertical={false} />
          <Tooltip 
            formatter={(value: number) => isNaN(value) ? 'N/A' : `${value.toFixed(2)} W`}
            labelFormatter={(label) => formatDate(label as string)}
            contentStyle={{ 
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              border: `1px solid ${theme.palette.divider}`
            }}
          />
          <Legend />
          <ReferenceLine 
            y={averagePower} 
            label={{ 
              value: "Průměr", 
              fill: theme.palette.text.primary,
              position: 'right'
            }} 
            stroke={theme.palette.secondary.main} 
            strokeDasharray="3 3" 
          />
          <Line 
            type="monotone" 
            dataKey="apower" 
            name="Výkon" 
            stroke={theme.palette.primary.main} 
            dot={false} 
            activeDot={{ r: 8 }}
            isAnimationActive={true}
          />
          <Line 
            type="monotone" 
            dataKey="movingAvg" 
            name="Klouzavý průměr" 
            stroke={theme.palette.secondary.main} 
            dot={false}
            strokeWidth={2}
            isAnimationActive={true}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;
