import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
  Scatter,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { Item } from '../types/types';
import { useTheme } from '@mui/material';
import './HeatMap.css';

interface HeatMapProps {
  data: Item[];
}

interface HeatMapDataPoint {
  x: number; // Hour of day (0-23)
  y: number; // Day of week (0-6, 0 = Sunday)
  z: number; // Power value
  timestamp: string; // Original timestamp
}

const HeatMap: React.FC<HeatMapProps> = ({ data }) => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState<string>('week');
  const [heatMapData, setHeatMapData] = useState<HeatMapDataPoint[]>([]);

  useEffect(() => {
    setHeatMapData(processDataForHeatMap(data, timeRange));
  }, [data, timeRange]);

  const processDataForHeatMap = (data: Item[], range: string): HeatMapDataPoint[] => {
    if (data.length === 0) return [];

    const currentTime = new Date().getTime();
    let timeRangeMs = 0;

    switch (range) {
      case 'week':
        timeRangeMs = 604800000; // 7 days
        break;
      case 'month':
        timeRangeMs = 2592000000; // 30 days
        break;
      default:
        timeRangeMs = 604800000; // Default to week
    }

    const startTime = currentTime - timeRangeMs;
    const filteredData = data.filter(item => {
      const itemTime = new Date(item.timestamp).getTime();
      return itemTime >= startTime && itemTime <= currentTime;
    });

    return filteredData.map(item => {
      const date = new Date(item.timestamp);
      return {
        x: date.getHours(),
        y: date.getDay(),
        z: item.apower,
        timestamp: item.timestamp
      };
    });
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
  };

  const dayLabels = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
  
  const formatXAxis = (hour: number) => {
    return `${hour}:00`;
  };
  
  const formatYAxis = (day: number) => {
    return dayLabels[day];
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const date = new Date(data.timestamp);
      const formattedDate = date.toLocaleDateString('cs-CZ');
      const formattedTime = date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
      
      return (
        <div className="custom-heatmap-tooltip" style={{ 
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`
        }}>
          <p className="date">{`${formattedDate} ${formattedTime}`}</p>
          <p className="day">{`Den: ${dayLabels[data.y]}`}</p>
          <p className="hour">{`Hodina: ${data.x}:00`}</p>
          <p className="power">{`Výkon: ${isNaN(data.z) ? 'N/A' : data.z.toFixed(2)} W`}</p>
        </div>
      );
    }
    return null;
  };

  // Calculate color based on power value
  const getPointColor = (power: number) => {
    // Handle NaN values
    if (isNaN(power)) return theme.palette.grey[400];
    
    // Find max power for normalization
    const maxPower = Math.max(...heatMapData.filter(point => !isNaN(point.z)).map(point => point.z));
    
    if (maxPower === 0 || heatMapData.length === 0) return theme.palette.grey[400];
    
    const normalizedValue = power / maxPower;
    
    // Color gradient using theme colors
    if (normalizedValue < 0.3) {
      return theme.palette.success.main; // Low power
    } else if (normalizedValue < 0.6) {
      return theme.palette.warning.main; // Medium power
    } else {
      return theme.palette.error.main; // High power
    }
  };

  return (
    <div className="heatmap-container">
      <h3>Vzorce spotřeby energie</h3>
      <div className="filter-buttons">
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
        <ScatterChart
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Hodina" 
            domain={[0, 23]} 
            tickCount={24} 
            tickFormatter={formatXAxis}
            label={{ value: 'Hodina dne', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Den" 
            domain={[0, 6]} 
            tickCount={7} 
            tickFormatter={formatYAxis}
            label={{ value: 'Den v týdnu', angle: -90, position: 'insideLeft' }}
          />
          <ZAxis 
            type="number" 
            dataKey="z" 
            range={[20, 500]} 
            name="Výkon" 
            unit=" W" 
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter 
            name="Spotřeba energie" 
            data={heatMapData} 
            fill="#8884d8"
            shape={(props: any) => {
              const { cx, cy, r } = props;
              const power = props.payload.z;
              const color = getPointColor(power);
              
              return (
                <circle 
                  cx={cx} 
                  cy={cy} 
                  r={r} 
                  fill={color} 
                  stroke="none" 
                />
              );
            }}
          />
          <Legend />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HeatMap;
