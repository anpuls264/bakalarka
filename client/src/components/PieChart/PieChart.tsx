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
  data: any[];
}

// No longer need the debug wrapper

const PieChart: React.FC<PieChartProps> = ({ data }) => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.DAY);
  
  // Použití custom hooku pro zpracování dat
  const { distributionData, formatValue } = usePieChartData(data, timeRange);
  
  // Use the distribution data for the pie chart

  // Získat název pro časový rozsah
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

  // Callback pro změnu časového rozsahu
  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2.5,
        borderRadius: 2,
        bgcolor: theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(0, 0, 0, 0.02)',
        width: '100%',
        height: '100%',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Typography 
        variant="h6" 
        align="center" 
        gutterBottom
      >
        {`${getTimeRangeTitle()} distribuce spotřeby energie`}
      </Typography>
      
      {/* Použití sdílené komponenty TimeRangeSelector */}
      <Box sx={{ mb: 2 }}>
        <TimeRangeSelector 
          currentRange={timeRange} 
          onRangeChange={handleTimeRangeChange}
          // Vlastní popisky tlačítek pro koláčový graf
          customLabels={{
            [TimeRange.DAY]: 'Den',
            [TimeRange.WEEK]: 'Týden',
            [TimeRange.MONTH]: 'Měsíc'
          }}
          // Skrýt časové rozsahy, které nepoužíváme
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