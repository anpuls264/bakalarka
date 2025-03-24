import React from 'react';
import { Box, Typography, Stack, Divider, useTheme, LinearProgress, Tooltip, Fade } from '@mui/material';
import { FiTrendingUp, FiTrendingDown, FiMinus } from "react-icons/fi";
import { UnitType, getLabel, getUnit } from './CurrentValueUtils';
import { useCurrentValueMonitor, TrendDirection } from './useCurrentValueMonitor';

interface CurrentValuesProps {
  unit: UnitType;
  value: number;
  min: number;
  max: number;
}

const TrendIndicator: React.FC<{ trend: TrendDirection }> = ({ trend }) => {
  const theme = useTheme();
  
  if (trend === 'up') {
    return <FiTrendingUp color={theme.palette.success.main} />;
  } else if (trend === 'down') {
    return <FiTrendingDown color={theme.palette.error.main} />;
  } else {
    return <FiMinus color={theme.palette.text.secondary} />;
  }
};

const CurrentValues: React.FC<CurrentValuesProps> = ({ unit, value, min, max }) => {
  const theme = useTheme();
  const { 
    lastValidValue, 
    trend, 
    changePercentage, 
    calculatePercentage 
  } = useCurrentValueMonitor(value);
  
  if (lastValidValue === undefined) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Načítání dat...
        </Typography>
        <LinearProgress sx={{ width: '80%' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Stack spacing={1.5}>
        <Typography variant="subtitle1" color="text.secondary" fontWeight="medium">
          {getLabel(unit)}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography 
            variant="h4" 
            fontWeight="bold"
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              color: theme.palette.primary.main
            }}
          >
            {lastValidValue.toFixed(2)}
            <Typography 
              component="span" 
              sx={{ 
                ml: 0.5, 
                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                color: theme.palette.text.secondary
              }}
            >
              {unit}
            </Typography>
          </Typography>
          
          <Tooltip 
            title={`Změna: ${changePercentage}`}
            placement="top"
            TransitionComponent={Fade}
            TransitionProps={{ timeout: 600 }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              bgcolor: 'background.paper',
              p: 0.5,
              borderRadius: 1,
              boxShadow: 1
            }}>
              <TrendIndicator trend={trend} />
            </Box>
          </Tooltip>
        </Box>
        
        <Tooltip 
          title={`Hodnota v rozsahu: ${min.toFixed(2)} - ${max.toFixed(2)} ${unit}`}
          placement="top"
        >
          <Box sx={{ width: '100%', mt: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={calculatePercentage(min, max)} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                }
              }}
            />
          </Box>
        </Tooltip>
        
        <Divider />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          <Tooltip title={`Minimální hodnota: ${min.toFixed(2)} ${unit}`}>
            <Typography variant="body2" color="text.secondary">
              Min: {min.toFixed(2)}
            </Typography>
          </Tooltip>
          <Tooltip title={`Maximální hodnota: ${max.toFixed(2)} ${unit}`}>
            <Typography variant="body2" color="text.secondary">
              Max: {max.toFixed(2)}
            </Typography>
          </Tooltip>
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
          {getUnit(unit)}
        </Typography>
      </Stack>
    </Box>
  );
};

export default React.memo(CurrentValues);