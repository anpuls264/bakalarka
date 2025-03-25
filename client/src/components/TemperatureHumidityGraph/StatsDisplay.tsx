// src/components/TemperatureHumidityGraph/StatsDisplay.tsx
import React from 'react';
import { Box, Typography, Paper, Grid, useTheme } from '@mui/material';
import { TemperatureHumidityStats } from './useTemperatureHumidityData';

interface StatsDisplayProps {
  stats: TemperatureHumidityStats;
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
        {/* Temperature stats */}
        {stats.temperature && (
          <>
            <StatItem 
              label="Průměrná teplota" 
              value={`${stats.temperature.avg.toFixed(1)} °C`} 
            />
            
            <StatItem 
              label="Min. teplota" 
              value={`${stats.temperature.min.toFixed(1)} °C`} 
            />
            
            <StatItem 
              label="Max. teplota" 
              value={`${stats.temperature.max.toFixed(1)} °C`} 
            />
          </>
        )}
        
        {/* Humidity stats */}
        {stats.humidity && (
          <>
            <StatItem 
              label="Průměrná vlhkost" 
              value={`${stats.humidity.avg.toFixed(1)} %`} 
            />
            
            <StatItem 
              label="Min. vlhkost" 
              value={`${stats.humidity.min.toFixed(1)} %`} 
            />
            
            <StatItem 
              label="Max. vlhkost" 
              value={`${stats.humidity.max.toFixed(1)} %`} 
            />
          </>
        )}
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
