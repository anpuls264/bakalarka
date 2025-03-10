import React, { useEffect, useState } from 'react';
import { 
  ResponsiveContainer,
  AreaChart,
  XAxis,
  YAxis,
  Area,
  Tooltip,
  CartesianGrid,
  Legend,
  TooltipProps,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { Item } from '../types/types';
import './RealTimeGraph.css';

interface RealTimeGraphProps {
  data: Item[];
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload) {
    return (
      <div className="custom-tooltip">
        <p className="date">{formatDate(label)}</p>
        {payload.map((entry, index) => (
          <p key={index} className="metric" style={{ color: entry.color }}>
            {entry.name === 'current' ? 'Proud' :
             entry.name === 'apower' ? 'Výkon' :
             entry.name === 'voltage' ? 'Napětí' : entry.name}
            : <span className="value">{entry.value?.toFixed(2)} {getUnit(entry.name)}</span>
          </p>
        ))}
      </div>
    );
  }

  return null;
};

// Helper function to get the appropriate unit for each metric
const getUnit = (metricName: string | undefined): string => {
  if (!metricName) return '';
  
  switch (metricName) {
    case 'current':
      return 'A';
    case 'apower':
      return 'W';
    case 'voltage':
      return 'V';
    default:
      return '';
  }
};

const RealTimeGraph: React.FC<RealTimeGraphProps> = ({ data }) => {
  const [timeRange, setTimeRange] = useState<string>('day');
  const [highlightedArea, setHighlightedArea] = useState<{start: number, end: number} | null>(null);
  const currentTime = new Date().getTime();

  const getTimeRange = (): number => {
    const timeRanges: { [key: string]: number } = {
      hour: 3600000,
      day: 86400000,
      week: 604800000,
      month: 2592000000,
      max: Infinity // Nastavení 'max' na Infinity pro zahrnutí všech dat
    };
    return timeRanges[timeRange] || 3600000; // Defaultní hodnota na hodinu
  };

  const filteredData = data.filter(entry => {
    const entryTime = new Date(entry.timestamp).getTime();
    const startTime = currentTime - getTimeRange();
    return entryTime >= startTime && entryTime <= currentTime;
  });

  const downsampledData = downsampleData(filteredData, 100);

  // Calculate statistics for each metric
  const calculateStats = () => {
    if (downsampledData.length === 0) return { current: {}, apower: {}, voltage: {} };
    
    const metrics = ['current', 'apower', 'voltage'];
    const stats: any = {};
    
    metrics.forEach(metric => {
      const values = downsampledData.map(item => (item as any)[metric]);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);
      
      stats[metric] = { avg, max, min };
    });
    
    return stats;
  };
  
  const stats = calculateStats();

  // Find peak usage period
  const findPeakPeriod = () => {
    if (downsampledData.length < 2) return null;
    
    let maxAvgPower = 0;
    let peakStart = 0;
    let peakEnd = 0;
    
    // Use a sliding window to find the period with highest average power
    const windowSize = Math.max(5, Math.floor(downsampledData.length / 10));
    
    for (let i = 0; i <= downsampledData.length - windowSize; i++) {
      const windowData = downsampledData.slice(i, i + windowSize);
      const avgPower = windowData.reduce((sum, item) => sum + item.apower, 0) / windowSize;
      
      if (avgPower > maxAvgPower) {
        maxAvgPower = avgPower;
        peakStart = i;
        peakEnd = i + windowSize - 1;
      }
    }
    
    if (peakStart !== peakEnd) {
      return {
        start: new Date(downsampledData[peakStart].timestamp).getTime(),
        end: new Date(downsampledData[peakEnd].timestamp).getTime()
      };
    }
    
    return null;
  };

  useEffect(() => {
    setHighlightedArea(findPeakPeriod());
  }, [downsampledData]);

  const formatXAxis = (timestamp: string) => {
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

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
  };

  // Get chart title based on time range
  const getChartTitle = () => {
    switch (timeRange) {
      case 'hour':
        return 'Hodinový přehled';
      case 'day':
        return 'Denní přehled';
      case 'week':
        return 'Týdenní přehled';
      case 'month':
        return 'Měsíční přehled';
      case 'max':
        return 'Kompletní přehled';
      default:
        return 'Přehled v reálném čase';
    }
  };

  return (
    <div className="real-time-graph-container">
      <h3>{getChartTitle()}</h3>
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
      
      <div className="stats-container">
        <div className="stat-item">
          <span className="stat-label">Průměrný výkon:</span>
          <span className="stat-value">{stats.apower?.avg?.toFixed(2) || 0} W</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Průměrné napětí:</span>
          <span className="stat-value">{stats.voltage?.avg?.toFixed(2) || 0} V</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Průměrný proud:</span>
          <span className="stat-value">{stats.current?.avg?.toFixed(2) || 0} A</span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>  
        <AreaChart
          width={500}
          height={400}
          data={downsampledData}
          margin={{
            top: 40,
            right: 30,
            left: 0,
            bottom: 30,
          }}
        >
          <defs>
            <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF5733" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#FF5733" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorVoltage" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={formatXAxis}
            label={{ 
              value: 'Čas', 
              position: 'insideBottom', 
              offset: -5 
            }}
          /> 
          <YAxis 
            yAxisId="left"
            label={{ 
              value: 'Výkon (W) / Napětí (V)', 
              angle: -90, 
              position: 'insideLeft' 
            }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            label={{ 
              value: 'Proud (A)', 
              angle: 90, 
              position: 'insideRight' 
            }}
          />
          
          {/* Highlight peak usage period */}
          {highlightedArea && (
            <ReferenceArea 
              x1={formatXAxis(new Date(highlightedArea.start).toISOString())} 
              x2={formatXAxis(new Date(highlightedArea.end).toISOString())} 
              strokeOpacity={0.3}
              fill="#ff9800"
              fillOpacity={0.2}
              label={{ value: 'Špička', position: 'insideTop' }}
            />
          )}
          
          <Area 
            type="monotone" 
            dataKey="current" 
            yAxisId="right"
            stroke="#FF5733" 
            fill="url(#colorCurrent)" 
            activeDot={{ r: 8 }}
          />
          <Area 
            type="monotone" 
            dataKey="apower" 
            yAxisId="left"
            stroke="#8884d8" 
            fill="url(#colorPower)" 
            activeDot={{ r: 8 }}
          />
          <Area 
            type="monotone" 
            dataKey="voltage" 
            yAxisId="left" 
            stroke="#82ca9d" 
            fill="url(#colorVoltage)" 
            activeDot={{ r: 8 }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          <CartesianGrid opacity={0.1} vertical={false} />
          
          {/* Reference lines for averages */}
          <ReferenceLine 
            yAxisId="left" 
            y={stats.apower?.avg} 
            stroke="#8884d8" 
            strokeDasharray="3 3" 
            label={{ value: 'Průměrný výkon', position: 'insideBottomRight', fill: '#8884d8' }} 
          />
          <ReferenceLine 
            yAxisId="right" 
            y={stats.current?.avg} 
            stroke="#FF5733" 
            strokeDasharray="3 3" 
          />
          
          <Legend 
            verticalAlign="bottom" 
            formatter={(value) => {
              switch (value) {
                case 'current':
                  return 'Proud (A)';
                case 'apower':
                  return 'Výkon (W)';
                case 'voltage':
                  return 'Napětí (V)';
                default:
                  return '';
              }
            }} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

function formatDate(timestamp: string) : string {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function downsampleData(data: Item[], sampleSize: number) {
  if (data.length <= sampleSize) return data;
  
  const downsampledData = [];
  const step = Math.ceil(data.length / sampleSize);
  
  for (let i = 0; i < data.length; i += step) {
    // For each step, calculate the average of all points in the window
    const windowData = data.slice(i, Math.min(i + step, data.length));
    const avgItem = windowData.reduce((acc, curr) => {
      return {
        ...acc,
        apower: acc.apower + curr.apower / windowData.length,
        voltage: acc.voltage + curr.voltage / windowData.length,
        current: acc.current + curr.current / windowData.length,
        total: acc.total + curr.total / windowData.length
      };
    }, {
      ...windowData[0],
      apower: 0,
      voltage: 0,
      current: 0,
      total: 0
    });
    
    downsampledData.push(avgItem);
  }

  return downsampledData.map(item => ({
    ...item,
    formattedDate: formatDate(item.timestamp),
  }));
}

export default RealTimeGraph;
