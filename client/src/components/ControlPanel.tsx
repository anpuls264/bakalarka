import React, { useEffect, useState } from 'react';
import { FaLightbulb } from "react-icons/fa";
import { FiPower, FiZap, FiSettings, FiBluetooth } from "react-icons/fi";
import { Socket } from 'socket.io-client';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Slider, 
  IconButton, 
  Stack, 
  Divider,
  useTheme,
  Paper,
  Tooltip,
  CircularProgress,
  Fade,
  Chip,
  Button
} from '@mui/material';

interface ControlPanelProps {
  isOn: boolean;
  brightness: number;
  socket: Socket | null;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ socket, isOn, brightness }) => {
  const [lastValidBrightness, setLastValidBrightness] = useState<number | undefined>(undefined);
  const [isChanging, setIsChanging] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const theme = useTheme();

  useEffect(() => {
    if (brightness !== undefined && !isNaN(brightness)) {
      setLastValidBrightness(brightness);
    }
  }, [brightness]);

  const handleIconClick = async () => {
    setIsChanging(true);
    setFeedbackMessage(isOn ? 'Vypínání...' : 'Zapínání...');
    setShowFeedback(true);
    
    try {
      // Use REST API for device control
      await axios.post('/device/power', { on: !isOn });
      
      setFeedbackMessage(isOn ? 'Zařízení vypnuto' : 'Zařízení zapnuto');
      
      // Also use socket for backward compatibility
      if (socket) {
        socket.emit('turnof/on');
      }
    } catch (error) {
      console.error('Error toggling power:', error);
      setFeedbackMessage('Chyba při přepínání napájení');
    } finally {
      setIsChanging(false);
      // Hide feedback after 2 seconds
      setTimeout(() => setShowFeedback(false), 2000);
    }
  };

  const handleBrightnessChange = async (_event: Event, newValue: number | number[]) => {
    const newBrightness = Array.isArray(newValue) ? newValue[0] : newValue;
    setLastValidBrightness(newBrightness);
    setIsChanging(true);
    
    try {
      // Use REST API for device control
      await axios.post('/device/brightness', { brightness: newBrightness });
      
      setFeedbackMessage(`Jas nastaven na ${newBrightness}%`);
      setShowFeedback(true);
      
      // Also use socket for backward compatibility
      if (socket) {
        socket.emit('brightness', newBrightness);
      }
    } catch (error) {
      console.error('Error setting brightness:', error);
      setFeedbackMessage('Chyba při nastavení jasu');
    } finally {
      setIsChanging(false);
      // Hide feedback after 2 seconds
      setTimeout(() => setShowFeedback(false), 2000);
    }
  };

  const handleBluetoothToggle = async () => {
    setIsChanging(true);
    setFeedbackMessage('Přepínání Bluetooth...');
    setShowFeedback(true);
    
    try {
      // Use REST API for device control
      await axios.post('/device/bluetooth', { enable: true });
      
      setFeedbackMessage('Bluetooth přepnuto');
      
      // Also use socket for backward compatibility
      if (socket) {
        socket.emit('bluetooth');
      }
    } catch (error) {
      console.error('Error toggling bluetooth:', error);
      setFeedbackMessage('Chyba při přepínání Bluetooth');
    } finally {
      setIsChanging(false);
      // Hide feedback after 2 seconds
      setTimeout(() => setShowFeedback(false), 2000);
    }
  };

  // Get color based on brightness level
  const getBrightnessColor = () => {
    if (!lastValidBrightness) return theme.palette.primary.main;
    
    if (lastValidBrightness > 75) {
      return theme.palette.warning.main; // High brightness
    } else if (lastValidBrightness > 30) {
      return theme.palette.primary.main; // Medium brightness
    } else {
      return theme.palette.info.main; // Low brightness
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {lastValidBrightness !== undefined ? (
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1" color="text.secondary" fontWeight="medium">
              Ovladací panel
            </Typography>
            
            {isChanging && (
              <CircularProgress size={16} thickness={5} />
            )}
          </Box>
          
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              py: 1,
              position: 'relative'
            }}
          >
            <Tooltip title={isOn ? "Kliknutím vypnete zařízení" : "Kliknutím zapnete zařízení"}>
              <IconButton 
                onClick={handleIconClick}
                color={isOn ? "primary" : "default"}
                disabled={isChanging}
                sx={{ 
                  fontSize: '2.5rem',
                  p: 2,
                  transition: 'all 0.3s ease',
                  boxShadow: isOn ? 3 : 0,
                  bgcolor: isOn ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    bgcolor: isOn ? 'rgba(25, 118, 210, 0.15)' : 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <FaLightbulb 
                  style={{ 
                    fontSize: '2rem',
                    color: isOn ? getBrightnessColor() : theme.palette.text.disabled
                  }} 
                />
              </IconButton>
            </Tooltip>
            
            <Typography 
              variant="h6" 
              fontWeight="medium"
              sx={{ 
                mt: 1,
                color: isOn ? 'primary.main' : 'text.secondary'
              }}
            >
              {isOn ? 'Zapnuto' : 'Vypnuto'}
            </Typography>
          </Box>
          
          <Box sx={{ px: 1, mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <FiZap style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Jas
              </Typography>
              <Chip 
                label={`${lastValidBrightness.toFixed(0)}%`} 
                size="small" 
                color={lastValidBrightness > 75 ? "warning" : "primary"}
                sx={{ height: 20, '& .MuiChip-label': { px: 1, py: 0.5 } }}
              />
            </Box>
            
            <Slider
              value={lastValidBrightness}
              onChange={handleBrightnessChange}
              aria-labelledby="brightness-slider"
              min={0}
              max={100}
              disabled={!isOn || isChanging}
              valueLabelDisplay="auto"
              sx={{ 
                color: getBrightnessColor(),
                '& .MuiSlider-thumb': {
                  boxShadow: `0px 0px 0px 8px ${theme.palette.mode === 'dark' 
                    ? 'rgba(144, 202, 249, 0.16)' 
                    : 'rgba(25, 118, 210, 0.16)'}`
                }
              }}
            />
          </Box>
          
          <Divider sx={{ mt: 1 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 1 }}>
            <Tooltip title="Bluetooth">
              <IconButton 
                onClick={handleBluetoothToggle}
                disabled={isChanging}
                size="small"
              >
                <FiBluetooth />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Napájení">
              <IconButton 
                onClick={handleIconClick}
                disabled={isChanging}
                size="small"
                color={isOn ? "primary" : "default"}
              >
                <FiPower />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Nastavení">
              <IconButton 
                disabled={isChanging}
                size="small"
              >
                <FiSettings />
              </IconButton>
            </Tooltip>
          </Box>
        </Stack>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Načítání dat...
          </Typography>
          <CircularProgress size={24} />
        </Box>
      )}
      
      {/* Feedback message */}
      <Fade in={showFeedback}>
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            py: 0.5,
            px: 1.5,
            borderRadius: 2,
            bgcolor: theme.palette.primary.main,
            color: 'white',
            zIndex: 10
          }}
        >
          <Typography variant="caption">{feedbackMessage}</Typography>
        </Paper>
      </Fade>
    </Box>
  );
};

export default ControlPanel;
