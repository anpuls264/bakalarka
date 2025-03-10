import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Divider,
  Paper,
  Stack,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { DeviceState } from '../types/types';
import axios from 'axios';

interface DeviceSettingsProps {
  deviceState: DeviceState;
  onSettingsChange?: () => void;
}

const DeviceSettings: React.FC<DeviceSettingsProps> = ({ deviceState, onSettingsChange }) => {
  const [deviceName, setDeviceName] = useState(deviceState.deviceName || 'Shelly Plug S');
  const [ledMode, setLedMode] = useState(deviceState.ledMode || 0);
  const [powerOnState, setPowerOnState] = useState(deviceState.powerOnState || 0);
  const [autoOffTimer, setAutoOffTimer] = useState(deviceState.autoOffTimer || 0);
  const [autoOnTimer, setAutoOnTimer] = useState(deviceState.autoOnTimer || 0);
  const [powerLimit, setPowerLimit] = useState(deviceState.powerLimit || 0);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Update local state when deviceState changes
  useEffect(() => {
    if (deviceState.deviceName) setDeviceName(deviceState.deviceName);
    if (deviceState.ledMode !== undefined) setLedMode(deviceState.ledMode);
    if (deviceState.powerOnState !== undefined) setPowerOnState(deviceState.powerOnState);
    if (deviceState.autoOffTimer !== undefined) setAutoOffTimer(deviceState.autoOffTimer);
    if (deviceState.autoOnTimer !== undefined) setAutoOnTimer(deviceState.autoOnTimer);
    if (deviceState.powerLimit !== undefined) setPowerLimit(deviceState.powerLimit);
  }, [deviceState]);

  const handleSaveDeviceName = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await axios.post('/device/name', { name: deviceName });
      setSuccess('Device name updated successfully');
      if (onSettingsChange) onSettingsChange();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update device name');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLedMode = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await axios.post('/device/led-mode', { mode: ledMode });
      setSuccess('LED mode updated successfully');
      if (onSettingsChange) onSettingsChange();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update LED mode');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePowerOnState = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await axios.post('/device/power-on-state', { state: powerOnState });
      setSuccess('Power-on state updated successfully');
      if (onSettingsChange) onSettingsChange();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update power-on state');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAutoOffTimer = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await axios.post('/device/auto-off-timer', { seconds: autoOffTimer });
      setSuccess('Auto-off timer updated successfully');
      if (onSettingsChange) onSettingsChange();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update auto-off timer');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAutoOnTimer = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await axios.post('/device/auto-on-timer', { seconds: autoOnTimer });
      setSuccess('Auto-on timer updated successfully');
      if (onSettingsChange) onSettingsChange();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update auto-on timer');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePowerLimit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await axios.post('/device/power-limit', { watts: powerLimit });
      setSuccess('Power limit updated successfully');
      if (onSettingsChange) onSettingsChange();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update power limit');
    } finally {
      setLoading(false);
    }
  };

  const handleRebootDevice = async () => {
    if (!window.confirm('Are you sure you want to reboot the device?')) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await axios.post('/device/reboot');
      setSuccess('Device reboot initiated');
      if (onSettingsChange) onSettingsChange();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reboot device');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(null);
    setError(null);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Device Settings
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Device Name */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Device Name
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            fullWidth
            label="Device Name"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            variant="outlined"
            size="small"
          />
          <Button 
            variant="contained" 
            onClick={handleSaveDeviceName}
            disabled={loading}
          >
            Save
          </Button>
        </Stack>
      </Box>
      
      {/* LED Mode */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          LED Mode
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl fullWidth size="small">
            <InputLabel>LED Mode</InputLabel>
            <Select
              value={ledMode}
              label="LED Mode"
              onChange={(e) => setLedMode(Number(e.target.value))}
            >
              <MenuItem value={0}>Off</MenuItem>
              <MenuItem value={1}>On when relay is off</MenuItem>
              <MenuItem value={2}>On when relay is on</MenuItem>
              <MenuItem value={3}>Always on</MenuItem>
            </Select>
          </FormControl>
          <Button 
            variant="contained" 
            onClick={handleSaveLedMode}
            disabled={loading}
          >
            Save
          </Button>
        </Stack>
      </Box>
      
      {/* Power-on State */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Power-on State
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl fullWidth size="small">
            <InputLabel>Power-on State</InputLabel>
            <Select
              value={powerOnState}
              label="Power-on State"
              onChange={(e) => setPowerOnState(Number(e.target.value))}
            >
              <MenuItem value={0}>Off</MenuItem>
              <MenuItem value={1}>On</MenuItem>
              <MenuItem value={2}>Restore last state</MenuItem>
            </Select>
          </FormControl>
          <Button 
            variant="contained" 
            onClick={handleSavePowerOnState}
            disabled={loading}
          >
            Save
          </Button>
        </Stack>
      </Box>
      
      {/* Auto-off Timer */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Auto-off Timer (seconds, 0 to disable)
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            fullWidth
            type="number"
            label="Seconds"
            value={autoOffTimer}
            onChange={(e) => setAutoOffTimer(Number(e.target.value))}
            variant="outlined"
            size="small"
            InputProps={{ inputProps: { min: 0 } }}
          />
          <Button 
            variant="contained" 
            onClick={handleSaveAutoOffTimer}
            disabled={loading}
          >
            Save
          </Button>
        </Stack>
      </Box>
      
      {/* Auto-on Timer */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Auto-on Timer (seconds, 0 to disable)
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            fullWidth
            type="number"
            label="Seconds"
            value={autoOnTimer}
            onChange={(e) => setAutoOnTimer(Number(e.target.value))}
            variant="outlined"
            size="small"
            InputProps={{ inputProps: { min: 0 } }}
          />
          <Button 
            variant="contained" 
            onClick={handleSaveAutoOnTimer}
            disabled={loading}
          >
            Save
          </Button>
        </Stack>
      </Box>
      
      {/* Power Limit */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Power Limit (watts, 0 to disable)
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            fullWidth
            type="number"
            label="Watts"
            value={powerLimit}
            onChange={(e) => setPowerLimit(Number(e.target.value))}
            variant="outlined"
            size="small"
            InputProps={{ inputProps: { min: 0 } }}
          />
          <Button 
            variant="contained" 
            onClick={handleSavePowerLimit}
            disabled={loading}
          >
            Save
          </Button>
        </Stack>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Device Actions */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Device Actions
        </Typography>
        <Button 
          variant="contained" 
          color="warning"
          onClick={handleRebootDevice}
          disabled={loading}
          sx={{ mr: 2 }}
        >
          Reboot Device
        </Button>
      </Box>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      
      <Snackbar 
        open={!!success || !!error} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={success ? "success" : "error"} 
          sx={{ width: '100%' }}
        >
          {success || error}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default DeviceSettings;
