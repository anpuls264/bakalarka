import React, { useState } from 'react';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import { 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { TimeRange } from '../common/ChartUtils';
import TimeRangeSelector from '../common/TimeRangeSelector';
import CustomPieTooltip from './CustomTooltip';
import { usePieChartData } from './usePieChartData';

interface PieChartProps {
  deviceId: string;
}

const PieChart: React.FC<PieChartProps> = ({ deviceId }) => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.DAY);

  // Custom hook for data processing
  const { distributionData, formatValue, loading, error } = usePieChartData(deviceId, timeRange);

  // Styles for the paper container
  const paperStyles = {
    p: 2.5,
    borderRadius: 2,
    bgcolor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.05)' 
      : 'rgba(0, 0, 0, 0.02)',
    width: '100%',
    height: '100%',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  };

  if (error) {
    return (
      <Paper
        elevation={1}
        sx={{
          ...paperStyles,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Typography color="error">Chyba při načítání dat: {error}</Typography>
      </Paper>
    );
  }

  // Get title for time range
  const getTimeRangeTitle = () => {
    switch (timeRange) {
      case TimeRange.DAY:
        return 'Denní';
      case TimeRange.WEEK:
        return 'Týdenní';
      case TimeRange.MONTH:
        return 'Měsíční';
      default:
        return '';
    }
  };

  // Callback for time range change
  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };

  return (
    <Paper elevation={1} sx={paperStyles}>
      <Typography 
        variant="h6" 
        align="center" 
        gutterBottom
      >
        {`${getTimeRangeTitle()} distribuce spotřeby energie`}
      </Typography>
      
      {/* Time range selector */}
      <Box sx={{ mb: 2 }}>
        <TimeRangeSelector 
          currentRange={timeRange} 
          onRangeChange={handleTimeRangeChange}
          customLabels={{
            [TimeRange.DAY]: 'Den',
            [TimeRange.WEEK]: 'Týden',
            [TimeRange.MONTH]: 'Měsíc'
          }}
          showHour={false}
          showMax={false}
        />
      </Box>
      
      <Box sx={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
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
            >
              {distributionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            
            <Tooltip
              content={<CustomPieTooltip formatValue={formatValue} />}
            />
            
            <Legend 
              wrapperStyle={{ color: theme.palette.text.primary }}
              formatter={(value) => <span style={{ color: theme.palette.text.primary }}>{value}</span>}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </Box>
      
      {distributionData.length === 0 && (
        <Typography 
          variant="body2" 
          align="center" 
          color="text.secondary"
          sx={{ mt: 2 }}
        >
          Nejsou k dispozici žádná data pro vybraný časový rozsah.
        </Typography>
      )}
    </Paper>
  );
};

export default React.memo(PieChart);
