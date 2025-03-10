import React, { useEffect, useState } from 'react';
import { 
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Bar,
  Tooltip,
  CartesianGrid,
  Legend,
  LabelList,
  ReferenceLine
} from 'recharts';
import { Item } from '../types/types';
import './ColumnChart.css';

interface ColumnChartProps {
  data: Item[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  timeRange: string;
}

const CustomTooltip = ({ active, payload, label, timeRange }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    let periodText = '';
    switch (timeRange) {
      case 'day':
        periodText = `Hodina: ${label}`;
        break;
      case 'week':
        periodText = `Den: ${label}`;
        break;
      case 'month':
        periodText = `Den v měsíci: ${label}`;
        break;
      default:
        periodText = label || '';
    }

    return (
      <div className="custom-column-tooltip">
        <p className="period">{periodText}</p>
        <p className="value">{`Spotřeba: ${(payload[0].value / 1000).toFixed(2)} kWh`}</p>
      </div>
    );
  }
  return null;
};

const ColumnChart: React.FC<ColumnChartProps> = ({ data }) => {
  const [timeRange, setTimeRange] = useState<string>('day');
  const currentTime = new Date().getTime();

  const getTimeRange = (): number => {
    switch (timeRange) {
      case 'day':
        return 86400000;
      case 'week':
        return 604800000;
      case 'month':
        return 2592000000;
      default:
        return 3600000; // Default na hodinový rozsah
    }
  };

  const filteredData = data.filter((entry) => {
    const entryTime = new Date(entry.timestamp).getTime();
    const startTime = currentTime - getTimeRange();
    return entryTime >= startTime && entryTime <= currentTime;
  });

  const groupedData = groupDataByTimeRange(filteredData, timeRange);

  // Calculate average consumption
  const averageConsumption = groupedData.length > 0
    ? groupedData.reduce((sum, item) => sum + item.total, 0) / groupedData.length
    : 0;

  const dateFormatter = (timestamp: number) => {
    const date = new Date(timestamp);

    switch (timeRange) {
      case 'day':
        return date.toLocaleString("cs-CZ", {
          hour: "2-digit",
        });
      case 'week':
        return date.toLocaleString("cs-CZ", {
          weekday: "short",
        });
      case 'month':
        return date.toLocaleString("cs-CZ", {
          day: "2-digit",
        });
      default:
        return '';
    }
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
  };

  // Get chart title based on time range
  const getChartTitle = () => {
    switch (timeRange) {
      case 'day':
        return 'Denní spotřeba energie';
      case 'week':
        return 'Týdenní spotřeba energie';
      case 'month':
        return 'Měsíční spotřeba energie';
      default:
        return 'Spotřeba energie';
    }
  };

  return (
    <div className="column-chart-container">
      <h3>{getChartTitle()}</h3>
      <div className="filter-buttons">
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
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          width={500}
          height={400}
          data={groupedData}
          margin={{
            top: 40,
            right: 30,
            left: 0,
            bottom: 30,
          }}
        >
          <XAxis 
            dataKey="time" 
            label={{ 
              value: timeRange === 'day' ? 'Hodina' : timeRange === 'week' ? 'Den v týdnu' : 'Den v měsíci', 
              position: 'insideBottom', 
              offset: -5 
            }} 
          />
          <YAxis 
            label={{ 
              value: 'Spotřeba (Wh)', 
              angle: -90, 
              position: 'insideLeft' 
            }} 
          />
          <Bar 
            dataKey="total" 
            fill="#8884d8" 
            name="Spotřeba energie"
            animationDuration={1000}
            barSize={timeRange === 'month' ? 15 : 30}
          >
            {/* Add labels to bars that exceed average */}
            <LabelList 
              dataKey="total" 
              position="top" 
              formatter={(value: number) => value > averageConsumption * 1.5 ? `${(value / 1000).toFixed(1)}` : ''} 
              style={{ fill: '#ff0000' }}
            />
          </Bar>
          <Tooltip content={<CustomTooltip timeRange={timeRange} />} />
          <Legend verticalAlign="top" height={36} />
          <CartesianGrid opacity={0.1} vertical={false} />
          <ReferenceLine y={averageConsumption} stroke="red" strokeDasharray="3 3" label="Průměr" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

function groupDataByTimeRange(data: Item[], range: string) {
  const groupedData: { time: string; total: number }[] = [];

  switch (range) {
    case 'day':
      for (let i = 0; i < 24; i++) {
        const startTime = new Date().setHours(i, 0, 0, 0);
        const endTime = new Date().setHours(i + 1, 0, 0, 0);
        const total = data
          .filter(entry => {
            const entryTime = new Date(entry.timestamp).getTime();
            return entryTime >= startTime && entryTime < endTime;
          })
          .reduce((acc, entry) => acc + entry.total, 0);

        groupedData.push({
          time: `${i}:00`,
          total,
        });
      }
      break;
    case 'week':
      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      for (let i = 0; i < daysOfWeek.length; i++) {
        const dayIndex = i;
        const startTime = new Date().setDate(new Date().getDate() - new Date().getDay() + dayIndex);
        const endTime = new Date().setDate(new Date().getDate() - new Date().getDay() + dayIndex + 1);
        const total = data
          .filter(entry => {
            const entryTime = new Date(entry.timestamp).getTime();
            return entryTime >= startTime && entryTime < endTime;
          })
          .reduce((acc, entry) => acc + entry.total, 0);

        groupedData.push({
          time: daysOfWeek[i],
          total,
        });
      }
      break;
    case 'month':
      const daysInCurrentMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0
      ).getDate();
      
      for (let i = 1; i <= daysInCurrentMonth; i++) {
        const startTime = new Date(new Date().getFullYear(), new Date().getMonth(), i, 0, 0, 0);
        const endTime = new Date(new Date().getFullYear(), new Date().getMonth(), i + 1, 0, 0, 0);
        const total = data
          .filter(entry => {
            const entryTime = new Date(entry.timestamp).getTime();
            return entryTime >= startTime.getTime() && entryTime < endTime.getTime();
          })
          .reduce((acc, entry) => acc + entry.total, 0);
      
        groupedData.push({
          time: `${i}`,
          total,
        });
      }
      break;
    default:
      break;
  }

  return groupedData;
}

export default ColumnChart;
