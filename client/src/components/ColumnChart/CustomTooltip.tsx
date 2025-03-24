// components/ColumnChart/CustomTooltip.tsx
import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { TimeRange, getChartColors } from '../common/ChartUtils';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  timeRange: TimeRange;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, timeRange }) => {
  const theme = useTheme();
  const colors = getChartColors(theme);
  
  if (!active || !payload || payload.length === 0) return null;

  let periodText = '';
  switch (timeRange) {
    case TimeRange.DAY:
      periodText = `Hodina: ${label}`;
      break;
    case TimeRange.WEEK:
      periodText = `Den: ${label}`;
      break;
    case TimeRange.MONTH:
      periodText = `Den v měsíci: ${label}`;
      break;
    default:
      periodText = label || '';
  }

  return (
    <Box
      sx={{
        bgcolor: colors.background,
        p: 1.5,
        border: `1px solid ${colors.grid}`,
        borderRadius: 1,
        boxShadow: theme.shadows[3]
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
        {periodText}
      </Typography>
      <Typography 
        variant="body2" 
        sx={{ 
          color: colors.primary, 
          fontWeight: 'bold', 
          mt: 0.5 
        }}
      >
        {`Spotřeba: ${(payload[0].value / 1000).toFixed(2)} kWh`}
      </Typography>
    </Box>
  );
};

export default React.memo(CustomTooltip);