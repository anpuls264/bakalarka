// src/components/HeatMap/Legend.tsx
import React from 'react';
import { Box, Typography, Grid, useTheme, useMediaQuery } from '@mui/material';
import { ConsumptionLevel } from './useHeatMapData';

interface LegendProps {
  consumptionColors: Record<ConsumptionLevel, string>;
}

const Legend: React.FC<LegendProps> = ({ consumptionColors }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const levels = [
    { level: ConsumptionLevel.VERY_LOW, label: 'Velmi nízká' },
    { level: ConsumptionLevel.LOW, label: 'Nízká' },
    { level: ConsumptionLevel.MEDIUM_LOW, label: 'Nižší střední' },
    { level: ConsumptionLevel.MEDIUM, label: 'Střední' },
    { level: ConsumptionLevel.MEDIUM_HIGH, label: 'Vyšší střední' },
    { level: ConsumptionLevel.HIGH, label: 'Vysoká' },
    { level: ConsumptionLevel.VERY_HIGH, label: 'Velmi vysoká' }
  ];
  
  // Zkrácené popisky pro mobilní zobrazení
  const getMobileLabel = (label: string) => {
    switch(label) {
      case 'Velmi nízká': return 'V. nízká';
      case 'Nižší střední': return 'N. střední';
      case 'Vyšší střední': return 'V. střední';
      case 'Velmi vysoká': return 'V. vysoká';
      default: return label;
    }
  };
  
  return (
    <Grid 
      container 
      spacing={1} 
      justifyContent="center" 
      alignItems="center"
      sx={{ mt: 2, mb: 1 }}
    >
      {levels.map(({ level, label }) => (
        <Grid item key={level} xs={isMobile ? 'auto' : undefined}>
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            <Box 
              sx={{ 
                width: 16,
                height: 16,
                bgcolor: consumptionColors[level],
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 0.5
              }} 
            />
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.65rem' : '0.75rem' }}
            >
              {isMobile ? getMobileLabel(label) : label}
            </Typography>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};

export default React.memo(Legend);