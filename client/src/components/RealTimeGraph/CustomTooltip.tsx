// src/components/RealTimeGraph/CustomTooltip.tsx
import React from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { TooltipProps } from 'recharts';
import { formatFullDate, getUnitForMetric } from '../common/ChartUtils';

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  const theme = useTheme();
  
  if (!active || !payload || !payload.length) return null;

  return (
    <Paper
      sx={{
        p: 1.5,
        borderRadius: 1,
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[3],
        width: 240,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 'bold',
          pb: 0.5,
          mb: 1,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        {formatFullDate(label)}
      </Typography>
      
      {payload.map((entry, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            my: 0.5,
            color: entry.color
          }}
        >
          <Typography variant="body2">
            {entry.name === 'current' ? 'Proud' :
             entry.name === 'apower' ? 'Výkon' :
             entry.name === 'voltage' ? 'Napětí' : entry.name}:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', ml: 1 }}>
            {entry.value?.toFixed(2)} {getUnitForMetric(entry.name)}
          </Typography>
        </Box>
      ))}
    </Paper>
  );
};

export default React.memo(CustomTooltip);