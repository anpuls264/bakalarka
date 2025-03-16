import React, { useEffect, useState } from 'react';
import { FaLightbulb } from "react-icons/fa";
import { FiPower, FiZap, FiSettings, FiBluetooth } from "react-icons/fi";
import { Socket } from 'socket.io-client';
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

// Define the device state interface based on server's DeviceState
interface DeviceState {
  deviceTurnOnOff: boolean;
  bluetoothEnable: boolean;
  currentPower?: number;
  brightness?: number;
  [key: string]: any; // Allow for other properties
}

interface ControlPanelProps {
  socket: Socket | null;
  isOn?: boolean;
  brightness?: number;
}

// Default brightness value if not provided by server
const DEFAULT_BRIGHTNESS = 50;

const ControlPanel: React.FC<ControlPanelProps> = ({ socket, isOn, brightness: initialBrightness }) => {
  // Device state from server
  const [deviceState, setDeviceState] = useState<DeviceState | null>(null);
  
  // UI state
  const [brightness, setBrightness] = useState<number>(initialBrightness || DEFAULT_BRIGHTNESS);
  const [isChanging, setIsChanging] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const theme = useTheme();

  // Show feedback message with auto-hide
  const showFeedbackMessage = (message: string) => {
    setFeedbackMessage(message);
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 2000);
  };

  // Listen for real-time updates from server
  useEffect(() => {
    if (!socket) return;

    // Request initial device state via socket
    socket.emit('getDeviceState');

    // Listen for device state updates
    socket.on('updateValues', (updatedState: DeviceState) => {
      console.log('Received device state update:', updatedState);
      setDeviceState(updatedState);
      
      // Update brightness if available
      if (updatedState.brightness !== undefined) {
        setBrightness(updatedState.brightness);
      }
    });

    return () => {
      // Clean up listeners
      socket.off('updateValues');
    };
  }, [socket]);

  const handlePowerToggle = () => {
    if (!deviceState || !socket) return;
    
    setIsChanging(true);
    const newPowerState = !deviceState.deviceTurnOnOff;
    showFeedbackMessage(deviceState.deviceTurnOnOff ? 'Vypínání...' : 'Zapínání...');
    console.log("kek");
    // Use WebSocket for device control
    socket.emit('turnof/on');
    
    // Update UI immediately for responsiveness
    setDeviceState({
      ...deviceState,
      deviceTurnOnOff: newPowerState
    });
    
    showFeedbackMessage(newPowerState ? 'Zařízení zapnuto' : 'Zařízení vypnuto');
    setIsChanging(false);
  };

  const handleBrightnessChange = (_event: Event, newValue: number | number[]) => {
    const newBrightness = Array.isArray(newValue) ? newValue[0] : newValue;
    setBrightness(newBrightness);
  };

  const handleBrightnessChangeCommitted = (_event: React.SyntheticEvent | Event, newValue: number | number[]) => {
    if (!socket) return;
    
    const newBrightness = Array.isArray(newValue) ? newValue[0] : newValue;
    setIsChanging(true);
    showFeedbackMessage(`Nastavuji jas na ${newBrightness.toFixed(0)}%...`);
    
    // Use WebSocket for device control
    socket.emit('brightness', newBrightness);
    
    showFeedbackMessage(`Jas nastaven na ${newBrightness.toFixed(0)}%`);
    setIsChanging(false);
  };

  const handleBluetoothToggle = () => {
    if (!deviceState || !socket) return;
    
    setIsChanging(true);
    const newBluetoothState = !deviceState.bluetoothEnable;
    showFeedbackMessage('Přepínání Bluetooth...');
    
    // Use WebSocket for device control
    socket.emit('bluetooth');
    
    // Update UI immediately for responsiveness
    setDeviceState({
      ...deviceState,
      bluetoothEnable: newBluetoothState
    });
    
    showFeedbackMessage(`Bluetooth ${newBluetoothState ? 'zapnuto' : 'vypnuto'}`);
    setIsChanging(false);
  };

  // Get color based on brightness level
  const getBrightnessColor = () => {
    if (brightness > 75) {
      return theme.palette.warning.main; // High brightness
    } else if (brightness > 30) {
      return theme.palette.primary.main; // Medium brightness
    } else {
      return theme.palette.info.main; // Low brightness
    }
  };

  // Check if device is on
  const isDeviceOn = deviceState?.deviceTurnOnOff ?? isOn ?? false;

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {deviceState ? (
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
            <Tooltip title={isDeviceOn ? "Kliknutím vypnete zařízení" : "Kliknutím zapnete zařízení"}>
              <IconButton 
                onClick={handlePowerToggle}
                color={isDeviceOn ? "primary" : "default"}
                disabled={isChanging}
                sx={{ 
                  fontSize: '2.5rem',
                  p: 2,
                  transition: 'all 0.3s ease',
                  boxShadow: isDeviceOn ? 3 : 0,
                  bgcolor: isDeviceOn ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    bgcolor: isDeviceOn ? 'rgba(25, 118, 210, 0.15)' : 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <FaLightbulb 
                  style={{ 
                    fontSize: '2rem',
                    color: isDeviceOn ? getBrightnessColor() : theme.palette.text.disabled
                  }} 
                />
              </IconButton>
            </Tooltip>
            
            <Typography 
              variant="h6" 
              fontWeight="medium"
              sx={{ 
                mt: 1,
                color: isDeviceOn ? 'primary.main' : 'text.secondary'
              }}
            >
              {isDeviceOn ? 'Zapnuto' : 'Vypnuto'}
            </Typography>
          </Box>
          
          <Box sx={{ px: 1, mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <FiZap style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Jas
              </Typography>
              <Chip 
                label={`${brightness.toFixed(0)}%`} 
                size="small" 
                color={brightness > 75 ? "warning" : "primary"}
                sx={{ height: 20, '& .MuiChip-label': { px: 1, py: 0.5 } }}
              />
            </Box>
            
            <Slider
              value={brightness}
              onChange={handleBrightnessChange}
              onChangeCommitted={handleBrightnessChangeCommitted}
              aria-labelledby="brightness-slider"
              min={0}
              max={100}
              disabled={!isDeviceOn || isChanging}
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
            <Tooltip title={deviceState.bluetoothEnable ? "Vypnout Bluetooth" : "Zapnout Bluetooth"}>
              <IconButton 
                onClick={handleBluetoothToggle}
                disabled={isChanging}
                size="small"
                color={deviceState.bluetoothEnable ? "primary" : "default"}
              >
                <FiBluetooth />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={isDeviceOn ? "Vypnout zařízení" : "Zapnout zařízení"}>
              <IconButton 
                onClick={handlePowerToggle}
                disabled={isChanging}
                size="small"
                color={isDeviceOn ? "primary" : "default"}
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
          
          {deviceState.currentPower !== undefined && (
            <Box sx={{ mt: 1, px: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Aktuální spotřeba: {deviceState.currentPower.toFixed(1)} W
              </Typography>
            </Box>
          )}
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
