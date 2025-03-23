import React, { useState, useEffect } from 'react';
import { 
  FormControl, 
  Select, 
  MenuItem, 
  InputLabel, 
  SelectChangeEvent, 
  Box, 
  Tooltip, 
  Typography,
  Chip,
  useTheme
} from '@mui/material';
import { FiClock } from 'react-icons/fi';

interface IntervalSelectorProps {
  onChangeInterval: (interval: number) => void;
}

function IntervalSelector({ onChangeInterval }: IntervalSelectorProps) {
  const [interval, setInterval] = useState<number>(300000); // Default interval set to 5 minutes
  const [showFeedback, setShowFeedback] = useState(false);
  const theme = useTheme();

  // Format interval for display
  const formatInterval = (ms: number): string => {
    if (ms < 60000) return `${ms / 1000} sec`;
    return `${ms / 60000} min`;
  };

  const handleIntervalChange = (event: SelectChangeEvent<number>) => {
    const newInterval = Number(event.target.value);
    setInterval(newInterval);
    onChangeInterval(newInterval); // Update interval in parent component
    
    // Show feedback
    setShowFeedback(true);
  };

  // Hide feedback after 2 seconds
  useEffect(() => {
    if (showFeedback) {
      const timer = setTimeout(() => setShowFeedback(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showFeedback]);

  return (
    <Box sx={{ 
      position: 'relative',
      minWidth: 120 
    }}>
        <FormControl size="small" fullWidth>
          <InputLabel id="interval-select-label">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FiClock style={{ marginRight: '4px' }} />
              Interval
            </Box>
          </InputLabel>
          <Select
            labelId="interval-select-label"
            id="interval-select"
            value={interval}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FiClock style={{ marginRight: '4px' }} />
                Interval
              </Box>
            }
            onChange={handleIntervalChange}
            sx={{ 
              minWidth: '140px',
              '& .MuiSelect-select': {
                py: 1,
                display: 'flex',
                alignItems: 'center'
              }
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  '& .MuiMenuItem-root': {
                    py: 1,
                    px: 2
                  }
                }
              }
            }}
          >
            <MenuItem value={60000}>
              <Typography variant="body2">1 Minuta</Typography>
            </MenuItem>
            <MenuItem value={300000}>
              <Typography variant="body2">5 Minut</Typography>
            </MenuItem>
            <MenuItem value={600000}>
              <Typography variant="body2">10 Minut</Typography>
            </MenuItem>
            <MenuItem value={1800000}>
              <Typography variant="body2">30 Minut</Typography>
            </MenuItem>
            <MenuItem value={3600000}>
              <Typography variant="body2">1 Hodina</Typography>
            </MenuItem>
          </Select>
        </FormControl>
    </Box>
  );
}

export default IntervalSelector;
