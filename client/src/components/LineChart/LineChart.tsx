// components/LineChart/LineChart.tsx
import React, { useState, useMemo } from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
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
import { TimeRange, formatDateByTimeRange, getChartColors } from '../common/ChartUtils';
import TimeRangeSelector from '../common/TimeRangeSelector';
import { useChartData } from './useChartData';

interface LineChartProps {
  deviceId: string;
}

const LineChart: React.FC<LineChartProps> = ({ deviceId }) => {
  const theme = useTheme();
  const colors = useMemo(() => getChartColors(theme), [theme]);
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.DAY);
  const { processedData, averagePower, loading, error } = useChartData(deviceId, timeRange);

  // Memoize styles
  const paperStyles = useMemo(() => ({
    p: 2,
    borderRadius: 2,
    bgcolor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.05)' 
      : 'rgba(0, 0, 0, 0.02)',
    width: '100%',
    height: '100%'
  }), [theme.palette.mode]);

  const loadingStyles = useMemo(() => ({
    ...paperStyles,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }), [paperStyles]);

  const chartContainerStyles = useMemo(() => ({
    width: '100%',
    height: 400
  }), []);

  if (loading) {
    return (
      <Paper elevation={1} sx={loadingStyles}>
        <Typography>Načítání dat...</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={1} sx={loadingStyles}>
        <Typography color="error">Chyba při načítání dat: {error}</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={1} sx={paperStyles}>
      <Typography 
        variant="h6" 
        align="center" 
        color="textPrimary" 
        gutterBottom
      >
        Trend spotřeby energie
      </Typography>
      
      <TimeRangeSelector 
        currentRange={timeRange} 
        onRangeChange={setTimeRange} 
        showMax={true}
      />
      
      <Box sx={chartContainerStyles}>
        <ResponsiveContainer>
          <RechartsLineChart
            data={processedData}
            margin={{
              top: 20,
              right: 30,
              left: 0,
              bottom: 30,
            }}
          >
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(value) => formatDateByTimeRange(value, timeRange)}
              minTickGap={30}
              tick={{ fill: colors.textSecondary }}
            />
            <YAxis 
              tick={{ fill: colors.textSecondary }}
              label={{ 
                value: 'Výkon (W)', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: colors.textSecondary }
              }}
            />
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke={colors.grid} 
              opacity={0.1} 
            />
            <Tooltip 
              formatter={(value: number) => isNaN(value) ? 'N/A' : `${value.toFixed(2)} W`}
              labelFormatter={(label) => formatDateByTimeRange(label as string, timeRange)}
              contentStyle={{ 
                backgroundColor: colors.background,
                color: colors.text,
                border: `1px solid ${colors.grid}`
              }}
            />
            <Legend wrapperStyle={{ color: colors.text }} />
            <ReferenceLine 
              y={averagePower} 
              label={{ 
                value: "Průměr", 
                fill: colors.text,
                position: 'right'
              }} 
              stroke={colors.secondary} 
              strokeDasharray="3 3" 
            />
            <Line 
              type="monotone" 
              dataKey="apower" 
              name="Výkon" 
              stroke={colors.primary} 
              dot={false} 
              activeDot={{ r: 6, fill: colors.primary }}
              strokeWidth={2}
              isAnimationActive
            />
            <Line 
              type="monotone" 
              dataKey="movingAvg" 
              name="Klouzavý průměr" 
              stroke={colors.secondary} 
              dot={false}
              strokeWidth={2}
              isAnimationActive
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default React.memo(LineChart);
