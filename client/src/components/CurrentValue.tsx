import React, { useEffect, useState } from 'react';
import { Box, Typography, Stack, Divider, useTheme, LinearProgress, Tooltip, Fade } from '@mui/material';
import { GoArrowUpRight, GoArrowDownRight } from "react-icons/go";
import { FiTrendingUp, FiTrendingDown, FiMinus } from "react-icons/fi";

interface CurrentValuesProps {
  neco: string;
  value: number;
  min: number;
  max: number;
}

const CurrentValues: React.FC<CurrentValuesProps> = ({ neco, value, min, max }) => {
  const [lastValidValue, setLastValidValue] = useState<number | undefined>(undefined);
  const [previousValue, setPreviousValue] = useState<number | undefined>(undefined);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const theme = useTheme();

  const getLabel = () => {
    switch (neco) {
      case 'W':
        return 'Aktuální výkon';
      case 'A':
        return 'Aktuální proud';
      case 'V':
        return 'Aktuální napětí';
      case 'Kč':
        return 'Celková cena';
      default:
        return 'Neznámá hodnota';
    }
  };

  const getUnit = () => {
    switch (neco) {
      case 'W':
        return 'Watt';
      case 'A':
        return 'Ampér';
      case 'V':
        return 'Volt';
      case 'Kč':
        return 'Koruna';
      default:
        return neco;
    }
  };

  useEffect(() => {
    if (value !== undefined && !isNaN(value)) {
      // Determine trend
      if (lastValidValue !== undefined) {
        setPreviousValue(lastValidValue);
        if (value > lastValidValue) {
          setTrend('up');
        } else if (value < lastValidValue) {
          setTrend('down');
        } else {
          setTrend('stable');
        }
      }
      setLastValidValue(value);
    }
  }, [value]);

  // Calculate percentage for progress bar
  const calculatePercentage = () => {
    if (lastValidValue === undefined || min === max) return 0;
    const percentage = ((lastValidValue - min) / (max - min)) * 100;
    return Math.min(Math.max(percentage, 0), 100); // Clamp between 0-100
  };

  // Get trend icon and color
  const getTrendIndicator = () => {
    if (trend === 'up') {
      return <FiTrendingUp color={theme.palette.success.main} />;
    } else if (trend === 'down') {
      return <FiTrendingDown color={theme.palette.error.main} />;
    } else {
      return <FiMinus color={theme.palette.text.secondary} />;
    }
  };

  // Format the change percentage
  const getChangePercentage = () => {
    if (previousValue === undefined || lastValidValue === undefined || previousValue === 0) {
      return '0%';
    }
    
    const change = ((lastValidValue - previousValue) / previousValue) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {lastValidValue !== undefined ? (
        <Stack spacing={1.5}>
          <Typography variant="subtitle1" color="text.secondary" fontWeight="medium">
            {getLabel()}
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
              {`${lastValidValue.toFixed(2)}`}
              <Typography 
                component="span" 
                sx={{ 
                  ml: 0.5, 
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                  color: theme.palette.text.secondary
                }}
              >
                {neco}
              </Typography>
            </Typography>
            
            <Tooltip 
              title={`Změna: ${getChangePercentage()}`}
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
                {getTrendIndicator()}
              </Box>
            </Tooltip>
          </Box>
          
          <Tooltip 
            title={`Hodnota v rozsahu: ${min.toFixed(2)} - ${max.toFixed(2)} ${neco}`}
            placement="top"
          >
            <Box sx={{ width: '100%', mt: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={calculatePercentage()} 
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
            <Tooltip title={`Minimální hodnota: ${min.toFixed(2)} ${neco}`}>
              <Typography variant="body2" color="text.secondary">
                Min: {`${min.toFixed(2)}`}
              </Typography>
            </Tooltip>
            <Tooltip title={`Maximální hodnota: ${max.toFixed(2)} ${neco}`}>
              <Typography variant="body2" color="text.secondary">
                Max: {`${max.toFixed(2)}`}
              </Typography>
            </Tooltip>
          </Box>
          
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
            {getUnit()}
          </Typography>
        </Stack>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Načítání dat...
          </Typography>
          <LinearProgress sx={{ width: '80%' }} />
        </Box>
      )}
    </Box>
  );
};

export default CurrentValues;
