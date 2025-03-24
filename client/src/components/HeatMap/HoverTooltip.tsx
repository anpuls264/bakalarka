// src/components/HeatMap/HoverTooltip.tsx
import React from 'react';
import { Typography, Paper, useTheme } from '@mui/material';
import { HeatMapCell } from './useHeatMapData';

interface HoverTooltipProps {
  cell: HeatMapCell;
  dayLabels: string[];
  isMobile?: boolean;
}

const HoverTooltip: React.FC<HoverTooltipProps> = ({ 
  cell, 
  dayLabels,
  isMobile = false
}) => {
  const theme = useTheme();
  
  if (cell.count === 0) return null;

  return (
    <Paper 
      elevation={3}
      sx={{
        position: 'absolute',
        top: isMobile ? 5 : 10,
        right: isMobile ? 5 : 10,
        p: isMobile ? 1 : 1.5,
        maxWidth: isMobile ? 150 : 200,
        zIndex: 10,
        backgroundColor: theme.palette.mode === 'dark' 
          ? 'rgba(35, 35, 35, 0.95)' 
          : 'rgba(255, 255, 255, 0.95)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        backdropFilter: 'blur(4px)'
      }}
    >
      <Typography 
        variant={isMobile ? "caption" : "subtitle2"} 
        sx={{ 
          mb: 0.5, 
          color: theme.palette.text.primary,
          fontWeight: 'bold'
        }}
      >
        {dayLabels[cell.day]}, {cell.hour}:00 - {cell.hour + 1}:00
      </Typography>
      
      <Typography 
        variant={isMobile ? "caption" : "body2"} 
        sx={{ 
          mb: 0.5, 
          color: theme.palette.text.secondary
        }}
      >
        Průměrný výkon: <strong style={{ color: theme.palette.primary.main }}>{cell.power.toFixed(2)} W</strong>
      </Typography>
      
      <Typography 
        variant={isMobile ? "caption" : "body2"} 
        sx={{ color: theme.palette.text.secondary }}
      >
        Počet měření: {cell.count}
      </Typography>
    </Paper>
  );
};

export default React.memo(HoverTooltip);