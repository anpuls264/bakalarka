// src/components/RealTimeGraph/StatsDisplay.tsx
import React from 'react';
import { Box, Typography, Paper, Grid, useTheme } from '@mui/material';
import { ChartStats } from './useRealTimeData';

interface StatsDisplayProps {
  stats: ChartStats;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({ stats }) => {
  const theme = useTheme();
  
  return (
    <Paper
      sx={{
        p: 1.5,
        mb: 2,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
        borderRadius: 1
      }}
    >
      <Grid container spacing={2}>
        <StatItem 
          label="Průměrný výkon" 
          value={`${stats.apower.avg.toFixed(2)} W`} 
        />
        
        <StatItem 
          label="Průměrné napětí" 
          value={`${stats.voltage.avg.toFixed(2)} V`} 
        />
        
        <StatItem 
          label="Průměrný proud" 
          value={`${stats.current.avg.toFixed(2)} A`} 
        />
      </Grid>
    </Paper>
  );
};

interface StatItemProps {
  label: string;
  value: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value }) => {
  const theme = useTheme();
  
  return (
    <Grid item xs={12} sm={4}>
      <Box sx={{ textAlign: 'center', p: 1 }}>
        <Typography 
          variant="caption" 
          component="div"
          sx={{ 
            color: theme.palette.text.secondary,
            mb: 0.5
          }}
        >
          {label}
        </Typography>
        <Typography 
          variant="subtitle1"
          sx={{ 
            fontWeight: 'bold',
            color: theme.palette.text.primary
          }}
        >
          {value}
        </Typography>
      </Box>
    </Grid>
  );
};

export default React.memo(StatsDisplay);