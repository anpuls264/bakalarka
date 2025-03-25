import React, { useState, useMemo } from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
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
import { TimeRange, getChartColors } from '../common/ChartUtils';
import TimeRangeSelector from '../common/TimeRangeSelector';
import { useColumnChartData } from './useColumnChartData';
import CustomTooltip from './CustomTooltip';

interface ColumnChartProps {
  deviceId: string;
}

const ColumnChart: React.FC<ColumnChartProps> = ({ deviceId }) => {
  const theme = useTheme();
  const colors = useMemo(() => getChartColors(theme), [theme]);
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.DAY);
  
  const { 
    groupedData, 
    averageConsumption, 
    chartProperties,
    loading,
    error 
  } = useColumnChartData(deviceId, timeRange);

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
        {timeRange === TimeRange.DAY 
          ? 'Denní spotřeba energie' 
          : timeRange === TimeRange.WEEK 
            ? 'Týdenní spotřeba energie' 
            : 'Měsíční spotřeba energie'}
      </Typography>
      
      <TimeRangeSelector 
        currentRange={timeRange} 
        onRangeChange={setTimeRange} 
        showMax={false}
      />
      
      <Box sx={chartContainerStyles}>
        <ResponsiveContainer>
          <BarChart
            data={groupedData}
            margin={{
              top: 20,
              right: 30,
              left: 0,
              bottom: 30,
            }}
          >
            <XAxis 
              dataKey="time" 
              label={{ 
                value: timeRange === TimeRange.DAY 
                  ? 'Hodina' 
                  : timeRange === TimeRange.WEEK 
                    ? 'Den v týdnu' 
                    : 'Den v měsíci', 
                position: 'insideBottom', 
                offset: -5,
                style: { textAnchor: 'middle', fill: colors.textSecondary }
              }}
              tick={{ fill: colors.textSecondary }}
            />
            <YAxis 
              label={{ 
                value: 'Spotřeba (Wh)', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: colors.textSecondary }
              }}
              tick={{ fill: colors.textSecondary }}
            />
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke={colors.grid} 
              opacity={0.1}
            />
            <Tooltip content={<CustomTooltip timeRange={timeRange} />} />
            <Legend 
              verticalAlign="top" 
              height={36}
              wrapperStyle={{ color: colors.text }}
            />
            <Bar 
              dataKey="total" 
              name="Spotřeba energie"
              fill={colors.primary}
              animationDuration={1000}
              barSize={chartProperties.barSize}
            >
              <LabelList 
                dataKey="total" 
                position="top" 
                formatter={(value: number) => 
                  value > averageConsumption * 1.5 ? `${(value / 1000).toFixed(1)}` : ''
                } 
                style={{ fill: theme.palette.error.main }}
              />
            </Bar>
            <ReferenceLine 
              y={averageConsumption} 
              stroke={theme.palette.error.main} 
              strokeDasharray="3 3" 
              label={{
                value: "Průměr",
                fill: colors.textSecondary,
                position: 'right'
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default React.memo(ColumnChart);
