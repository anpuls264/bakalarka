// src/components/TemperatureHumidityGraph/TemperatureHumidityGraph.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import {
  ResponsiveContainer,
  AreaChart,
  XAxis,
  YAxis,
  Area,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from 'recharts';
import { TimeRange, formatDateByRange, getChartTitle } from '../common/ChartUtils';
import TimeRangeSelector from '../common/TimeRangeSelector';
import CustomTooltip from './CustomTooltip';
import StatsDisplay from './StatsDisplay';
import { useTemperatureHumidityData } from './useTemperatureHumidityData';

interface TemperatureHumidityGraphProps {
  deviceId: string;
}

const paperStyles = {
  borderRadius: 2,
  p: 2.5,
  width: '100%',
  height: '100%',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
};

const chartContainerStyles = { 
  width: '100%', 
  height: 400 
};

const titleStyles = { 
  mb: 2 
};

const TemperatureHumidityGraph: React.FC<TemperatureHumidityGraphProps> = ({ deviceId }) => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.DAY);
  
  const { processedData, stats, loading, error } = useTemperatureHumidityData(deviceId, timeRange);

  if (loading) {
    return (
      <Paper elevation={1} sx={{ ...paperStyles, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography>Načítání dat...</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={1} sx={{ ...paperStyles, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography color="error">Chyba při načítání dat: {error}</Typography>
      </Paper>
    );
  }

  // Memoize chart colors
  const chartColors = useMemo(() => ({
    temperature: '#FF9800',
    humidity: '#03A9F4',
    gridOpacity: 0.1,
    background: theme.palette.background.paper
  }), [theme.palette.background.paper]);

  // Memoize time range change handler
  const handleTimeRangeChange = useCallback((newRange: TimeRange) => {
    setTimeRange(newRange);
  }, []);

  // Memoize paper background style based on theme
  const paperBgStyle = useMemo(() => ({
    bgcolor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.05)' 
      : 'rgba(0, 0, 0, 0.02)'
  }), [theme.palette.mode]);

  return (
    <Paper
      elevation={1}
      sx={{ ...paperStyles, ...paperBgStyle }}
    >
      <Typography 
        variant="h6" 
        align="center" 
        gutterBottom
        sx={titleStyles}
      >
        {getChartTitle(timeRange)}
      </Typography>
      
      <TimeRangeSelector 
        currentRange={timeRange} 
        onRangeChange={handleTimeRangeChange} 
        showMax={true}
      />
      
      <StatsDisplay stats={stats} />
      
      <Box sx={chartContainerStyles}>
        <ResponsiveContainer>
          <AreaChart
            data={processedData}
            margin={{
              top: 20,
              right: 30,
              left: 5,
              bottom: 30,
            }}
          >
            <defs>
              <linearGradient id="colorTemperature" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors.temperature} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={chartColors.temperature} stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors.humidity} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={chartColors.humidity} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(value) => formatDateByRange(value, timeRange)}
              tick={{ fill: theme.palette.text.secondary }}
              minTickGap={30}
            />
            
            {/* Y-axis for temperature */}
            <YAxis 
              yAxisId="temperature" 
              orientation="left"
              tick={{ fill: theme.palette.text.secondary }}
              label={{ 
                value: 'Teplota (°C)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: theme.palette.text.secondary }
              }}
              tickCount={5}
              domain={['dataMin - 1', 'dataMax + 1']}
            />
            
            {/* Y-axis for humidity */}
            <YAxis 
              yAxisId="humidity" 
              orientation="right"
              tick={{ fill: theme.palette.text.secondary }}
              label={{ 
                value: 'Vlhkost (%)', 
                angle: 90, 
                position: 'insideRight',
                style: { fill: theme.palette.text.secondary }
              }}
              tickCount={5}
              domain={[0, 100]}
            />
            
            {/* Temperature data */}
            <Area 
              type="monotone" 
              dataKey="temperature" 
              name="temperature"
              yAxisId="temperature"
              stroke={chartColors.temperature} 
              fill="url(#colorTemperature)" 
              activeDot={{ r: 6 }}
            />
            
            {/* Humidity data */}
            <Area 
              type="monotone" 
              dataKey="humidity" 
              name="humidity"
              yAxisId="humidity"
              stroke={chartColors.humidity} 
              fill="url(#colorHumidity)" 
              activeDot={{ r: 6 }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <CartesianGrid 
              opacity={chartColors.gridOpacity} 
              vertical={false} 
              stroke={theme.palette.divider}
            />
            
            {/* Reference lines for averages */}
            {stats.temperature && (
              <ReferenceLine 
                yAxisId="temperature" 
                y={stats.temperature.avg} 
                stroke={chartColors.temperature} 
                strokeDasharray="3 3" 
                label={{ 
                  value: 'Průměrná teplota', 
                  position: 'insideBottomRight', 
                  fill: chartColors.temperature 
                }} 
              />
            )}
            
            {stats.humidity && (
              <ReferenceLine 
                yAxisId="humidity" 
                y={stats.humidity.avg} 
                stroke={chartColors.humidity} 
                strokeDasharray="3 3" 
                label={{ 
                  value: 'Průměrná vlhkost', 
                  position: 'insideBottomRight', 
                  fill: chartColors.humidity 
                }} 
              />
            )}
            
            <Legend 
              verticalAlign="bottom" 
              formatter={(value) => {
                if (value === 'temperature') return 'Teplota (°C)';
                if (value === 'humidity') return 'Vlhkost (%)';
                return value;
              }}
              wrapperStyle={{ color: theme.palette.text.primary }} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default React.memo(TemperatureHumidityGraph);
