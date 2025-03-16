import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Collapse
} from '@mui/material';
import { FiWifi, FiRefreshCw, FiLock } from 'react-icons/fi';
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
  
  // WiFi settings
  const [currentWifiName, setCurrentWifiName] = useState<string | null>(deviceState.wifiName);
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [availableNetworks, setAvailableNetworks] = useState<Array<{ssid: string, rssi: number, secure: boolean}>>([]);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [showWifiPassword, setShowWifiPassword] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showWifiSettings, setShowWifiSettings] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // No longer needed as we'll fetch real networks from the server

  // Fetch current device state from server
  const fetchDeviceState = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/device/state');
      const currentState = response.data;
      
      // Update local state with current values from server
      if (currentState.deviceName) setDeviceName(currentState.deviceName);
      if (currentState.ledMode !== undefined) setLedMode(currentState.ledMode);
      if (currentState.powerOnState !== undefined) setPowerOnState(currentState.powerOnState);
      if (currentState.autoOffTimer !== undefined) setAutoOffTimer(currentState.autoOffTimer);
      if (currentState.autoOnTimer !== undefined) setAutoOnTimer(currentState.autoOnTimer);
      if (currentState.powerLimit !== undefined) setPowerLimit(currentState.powerLimit);
      if (currentState.wifiName !== undefined) setCurrentWifiName(currentState.wifiName);
      
    } catch (err: any) {
      console.error('Failed to fetch device state:', err);
      setError('Failed to fetch current device settings');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch device state on component mount
  useEffect(() => {
    fetchDeviceState();
  }, [fetchDeviceState]);

  // Update local state when deviceState prop changes
  useEffect(() => {
    if (deviceState.deviceName) setDeviceName(deviceState.deviceName);
    if (deviceState.ledMode !== undefined) setLedMode(deviceState.ledMode);
    if (deviceState.powerOnState !== undefined) setPowerOnState(deviceState.powerOnState);
    if (deviceState.autoOffTimer !== undefined) setAutoOffTimer(deviceState.autoOffTimer);
    if (deviceState.autoOnTimer !== undefined) setAutoOnTimer(deviceState.autoOnTimer);
    if (deviceState.powerLimit !== undefined) setPowerLimit(deviceState.powerLimit);
    if (deviceState.wifiName !== undefined) setCurrentWifiName(deviceState.wifiName);
  }, [deviceState]);

  const handleSaveDeviceName = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await axios.post('/device/name', { name: deviceName });
      setSuccess('Device name updated successfully');
      if (onSettingsChange) onSettingsChange();
      // Refresh device state to get updated values
      await fetchDeviceState();
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
      // Refresh device state to get updated values
      await fetchDeviceState();
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
      // Refresh device state to get updated values
      await fetchDeviceState();
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
      // Refresh device state to get updated values
      await fetchDeviceState();
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
      // Refresh device state to get updated values
      await fetchDeviceState();
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
      // Refresh device state to get updated values
      await fetchDeviceState();
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
      // Refresh device state after a short delay to allow reboot to complete
      setTimeout(() => {
        fetchDeviceState();
      }, 5000);
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

  // Scan for WiFi networks
  const scanWifiNetworks = async () => {
    setIsScanning(true);
    setError(null);
    
    try {
      // Call the real API endpoint to scan for networks
      const response = await axios.get('/wifi/scan');
      setAvailableNetworks(response.data.networks);
      setSuccess('WiFi scan completed');
    } catch (err: any) {
      console.error('Failed to scan WiFi networks:', err);
      setError(err.response?.data?.error || 'Failed to scan WiFi networks');
    } finally {
      setIsScanning(false);
    }
  };

  // Connect to WiFi network
  const connectToWifi = async () => {
    if (!selectedNetwork) {
      setError('Please select a WiFi network');
      return;
    }
    
    const selectedNetworkInfo = availableNetworks.find(network => network.ssid === selectedNetwork);
    if (selectedNetworkInfo?.secure && !wifiPassword) {
      setError('Please enter the WiFi password');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Call the real API endpoint to connect to the network
      const response = await axios.post('/wifi/connect', {
        ssid: selectedNetwork,
        password: selectedNetworkInfo?.secure ? wifiPassword : undefined
      });
      
      setCurrentWifiName(selectedNetwork);
      setSuccess(response.data.message || `Connected to ${selectedNetwork}`);
      setShowWifiSettings(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to connect to WiFi network');
    } finally {
      setLoading(false);
    }
  };

  // Toggle WiFi
  const toggleWifi = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Call the real API endpoint to toggle WiFi
      const response = await axios.post('/wifi/toggle', {
        enable: !wifiEnabled
      });
      
      setWifiEnabled(!wifiEnabled);
      setSuccess(response.data.message || `WiFi ${!wifiEnabled ? 'enabled' : 'disabled'}`);
      
      // If disabling WiFi, clear the current WiFi name
      if (wifiEnabled) {
        setCurrentWifiName(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to toggle WiFi');
    } finally {
      setLoading(false);
    }
  };
  
  // Get WiFi status
  const getWifiStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/wifi/status');
      const status = response.data;
      
      // Update state based on WiFi status
      if (status.sta && status.sta.connected) {
        setCurrentWifiName(status.sta.ssid);
        setWifiEnabled(true);
      } else {
        setWifiEnabled(status.sta && status.sta.enabled);
      }
      
      setSuccess('WiFi status updated');
    } catch (err: any) {
      console.error('Failed to get WiFi status:', err);
      setError(err.response?.data?.error || 'Failed to get WiFi status');
    } finally {
      setLoading(false);
    }
  };

  // Refresh all settings from server
  const handleRefreshSettings = async () => {
    await fetchDeviceState();
    await getWifiStatus();
    setSuccess('Settings refreshed successfully');
  };

  // Get signal strength icon based on RSSI value
  const getSignalStrengthIcon = (rssi: number) => {
    if (rssi > -70) return '📶'; // Strong
    if (rssi > -80) return '📶'; // Medium
    return '📶'; // Weak
  };
  
  // Initial fetch of WiFi status
  useEffect(() => {
    getWifiStatus();
  }, []);

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Device Settings
        </Typography>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={handleRefreshSettings}
          disabled={loading}
        >
          Refresh Settings
        </Button>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* WiFi Settings */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          WiFi Settings
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FiWifi style={{ marginRight: '8px', color: wifiEnabled ? '#4caf50' : '#bdbdbd' }} />
            <Typography variant="body1">
              {wifiEnabled ? (
                currentWifiName ? `Connected to: ${currentWifiName}` : 'WiFi enabled but not connected'
              ) : 'WiFi disabled'}
            </Typography>
          </Box>
          
          <Box>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => setShowWifiSettings(!showWifiSettings)}
              sx={{ mr: 1 }}
            >
              {showWifiSettings ? 'Hide Settings' : 'Configure WiFi'}
            </Button>
            
            <Button 
              variant="outlined" 
              size="small" 
              onClick={toggleWifi}
              color={wifiEnabled ? 'error' : 'success'}
              disabled={loading}
            >
              {wifiEnabled ? 'Disable' : 'Enable'}
            </Button>
          </Box>
        </Box>
        
        <Collapse in={showWifiSettings}>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2">Available Networks</Typography>
              <Button 
                startIcon={<FiRefreshCw />} 
                size="small" 
                onClick={scanWifiNetworks}
                disabled={isScanning}
              >
                {isScanning ? 'Scanning...' : 'Scan'}
              </Button>
            </Box>
            
            {isScanning ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <List dense sx={{ maxHeight: '200px', overflow: 'auto', bgcolor: 'background.paper' }}>
                {availableNetworks.length > 0 ? (
                  availableNetworks.map((network, index) => (
                    <ListItem 
                      key={index} 
                      onClick={() => setSelectedNetwork(network.ssid)}
                      sx={{ 
                        borderRadius: 1,
                        mb: 0.5,
                        cursor: 'pointer',
                        bgcolor: selectedNetwork === network.ssid ? 'primary.light' : 'transparent',
                        '&:hover': {
                          bgcolor: selectedNetwork === network.ssid ? 'primary.light' : 'action.hover',
                        }
                      }}
                    >
                      <ListItemText 
                        primary={network.ssid} 
                        secondary={`Signal strength: ${Math.abs(network.rssi)}%`} 
                      />
                      <ListItemSecondaryAction>
                        {network.secure && <FiLock />}
                        {getSignalStrengthIcon(network.rssi)}
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                    No networks found. Click Scan to search for WiFi networks.
                  </Typography>
                )}
              </List>
            )}
            
            {selectedNetwork && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Connect to "{selectedNetwork}"
                </Typography>
                
                {availableNetworks.find(network => network.ssid === selectedNetwork)?.secure && (
                  <TextField
                    fullWidth
                    label="WiFi Password"
                    type={showWifiPassword ? "text" : "password"}
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    variant="outlined"
                    size="small"
                    margin="normal"
                    InputProps={{
                      endAdornment: (
                        <IconButton 
                          size="small" 
                          onClick={() => setShowWifiPassword(!showWifiPassword)}
                        >
                          {showWifiPassword ? "Hide" : "Show"}
                        </IconButton>
                      )
                    }}
                  />
                )}
                
                <Button 
                  variant="contained" 
                  fullWidth 
                  onClick={connectToWifi}
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  Connect
                </Button>
              </Box>
            )}
          </Paper>
        </Collapse>
      </Box>
      
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
