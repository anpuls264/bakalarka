// src/components/common/ChartSkeleton.tsx
import React from 'react';
import { Box, Skeleton, Paper, useTheme } from '@mui/material';

interface ChartSkeletonProps {
  height?: number | string;
}

const ChartSkeleton: React.FC<ChartSkeletonProps> = ({ height = 400 }) => {
  const theme = useTheme();
  
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
      }}
    >
      {/* Nadpis */}
      <Skeleton 
        variant="text" 
        width="60%" 
        height={40} 
        sx={{ mx: 'auto', mb: 2 }} 
      />
      
      {/* Filtry */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Skeleton variant="rounded" width={160} height={32} />
      </Box>
      
      {/* Hlavní obsah grafu */}
      <Skeleton 
        variant="rounded" 
        width="100%" 
        height={height} 
        sx={{ mb: 2 }} 
      />
      
      {/* Legenda */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
        <Skeleton variant="rounded" width="80%" height={30} />
      </Box>
    </Paper>
  );
};

export default ChartSkeleton;