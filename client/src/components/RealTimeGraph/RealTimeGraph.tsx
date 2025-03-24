// src/components/RealTimeGraph/RealTimeGraph.tsx
import React, { useState } from 'react';
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
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { TimeRange, formatDateByRange, getChartTitle, formatMetricName } from '../common/ChartUtils';
import TimeRangeSelector from '../common/TimeRangeSelector';
import CustomTooltip from './CustomTooltip';
import StatsDisplay from './StatsDisplay';
import { useRealTimeData } from './useRealTimeData';

interface RealTimeGraphProps {
  data: any[];
}

const RealTimeGraph: React.FC<RealTimeGraphProps> = ({ data }) => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.DAY);
  
  const { processedData, stats, highlightedArea } = useRealTimeData(data, timeRange);

  // Barvy pro grafy - respektování tématu
  const chartColors = {
    current: '#FF5733',
    apower: theme.palette.primary.main,
    voltage: theme.palette.secondary.main,
    gridOpacity: 0.1,
    background: theme.palette.background.paper
  };

  return (
    <Paper
      elevation={1}
      sx={{
        borderRadius: 2,
        p: 2.5,
        bgcolor: theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(0, 0, 0, 0.02)',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        width: '100%',
        height: '100%'
      }}
    >
      <Typography 
        variant="h6" 
        align="center" 
        gutterBottom
        sx={{ mb: 2 }}
      >
        {getChartTitle(timeRange)}
      </Typography>
      
      <TimeRangeSelector 
        currentRange={timeRange} 
        onRangeChange={setTimeRange} 
        showMax={true}
      />
      
      <StatsDisplay stats={stats} />
      
      <Box sx={{ width: '100%', height: 400 }}>
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
              <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors.current} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={chartColors.current} stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors.apower} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={chartColors.apower} stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorVoltage" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors.voltage} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={chartColors.voltage} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(value) => formatDateByRange(value, timeRange)}
              tick={{ fill: theme.palette.text.secondary }}
              minTickGap={30}
            />
            
            <YAxis 
              yAxisId="left"
              tick={{ fill: theme.palette.text.secondary }}
              label={{ 
                value: 'Výkon (W) / Napětí (V)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: theme.palette.text.secondary }
              }}
            />
            
            <YAxis 
              yAxisId="right" 
              orientation="right"
              tick={{ fill: theme.palette.text.secondary }}
              label={{ 
                value: 'Proud (A)', 
                angle: 90, 
                position: 'insideRight',
                style: { fill: theme.palette.text.secondary }
              }}
            />
            
            {/* Zvýraznění období nejvyšší spotřeby */}
            {highlightedArea && (
              <ReferenceArea 
                x1={formatDateByRange(new Date(highlightedArea.start).toISOString(), timeRange)} 
                x2={formatDateByRange(new Date(highlightedArea.end).toISOString(), timeRange)} 
                strokeOpacity={0.3}
                fill={theme.palette.warning.main}
                fillOpacity={0.2}
                label={{ 
                  value: 'Špička', 
                  position: 'insideTop',
                  fill: theme.palette.text.primary 
                }}
              />
            )}
            
            <Area 
              type="monotone" 
              dataKey="current" 
              name="current"
              yAxisId="right"
              stroke={chartColors.current} 
              fill="url(#colorCurrent)" 
              activeDot={{ r: 6 }}
            />
            
            <Area 
              type="monotone" 
              dataKey="apower" 
              name="apower"
              yAxisId="left"
              stroke={chartColors.apower} 
              fill="url(#colorPower)" 
              activeDot={{ r: 6 }}
            />
            
            <Area 
              type="monotone" 
              dataKey="voltage" 
              name="voltage"
              yAxisId="left" 
              stroke={chartColors.voltage} 
              fill="url(#colorVoltage)" 
              activeDot={{ r: 6 }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <CartesianGrid 
              opacity={chartColors.gridOpacity} 
              vertical={false} 
              stroke={theme.palette.divider}
            />
            
            {/* Referenční čáry pro průměry */}
            <ReferenceLine 
              yAxisId="left" 
              y={stats.apower.avg} 
              stroke={chartColors.apower} 
              strokeDasharray="3 3" 
              label={{ 
                value: 'Průměrný výkon', 
                position: 'insideBottomRight', 
                fill: chartColors.apower 
              }} 
            />
            
            <ReferenceLine 
              yAxisId="right" 
              y={stats.current.avg} 
              stroke={chartColors.current} 
              strokeDasharray="3 3" 
            />
            
            <Legend 
              verticalAlign="bottom" 
              formatter={formatMetricName}
              wrapperStyle={{ color: theme.palette.text.primary }} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default React.memo(RealTimeGraph);
