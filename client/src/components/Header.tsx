import React, { useEffect, useState } from 'react';
import { FiMoon, FiSun, FiSettings, FiWifi, FiBluetooth, FiServer, FiEdit, FiList, FiBattery } from 'react-icons/fi';
import { SiMqtt } from "react-icons/si";
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box, 
  Tooltip as MuiTooltip,
  useMediaQuery,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { dashboardService } from '../services/DashboardService';
import { deviceService } from '../services/DeviceService';
import IntervalSelector from './IntervalSelector';
import './Header.css';
import { Device, DeviceState } from '../models/Device';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  deviceState: DeviceState | null;
  metricsCount: number;
  showDeviceList: boolean;
  setShowDeviceList: (show: boolean) => void;
  editMode: boolean;
  handleUpdateInterval: (interval: number) => void;
  handleToggleModal: () => void;
  onDeviceSelect?: (deviceId: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  darkMode,
  toggleDarkMode,
  deviceState,
  metricsCount,
  showDeviceList,
  setShowDeviceList,
  editMode,
  handleUpdateInterval,
  handleToggleModal,
  onDeviceSelect
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('shelly1');

  // Fetch all devices when component mounts
  useEffect(() => {
    const fetchDevices = async () => {
      const fetchedDevices = await deviceService.fetchAllDevices();
      setDevices(fetchedDevices);
      
      // Set default selected device if available
      if (fetchedDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(fetchedDevices[0].id);
        if (onDeviceSelect) {
          onDeviceSelect(fetchedDevices[0].id);
        }
      }
    };
    
    fetchDevices();
  }, []);

  // Handle device selection change
  const handleDeviceChange = (event: SelectChangeEvent<string>) => {
    const newDeviceId = event.target.value;
    setSelectedDeviceId(newDeviceId);
    
    if (onDeviceSelect) {
      onDeviceSelect(newDeviceId);
    }
  };

  // Get the current selected device
  const selectedDevice = devices.find(device => device.id === selectedDeviceId);
  
  // Determine if the device is a ShellyHT type
  const isShellyHT = selectedDevice?.type === 'shelly-ht';

  return (
    <AppBar 
      position="static" 
      color="primary" 
      elevation={0} 
      sx={{ mb: 3, borderRadius: 1 }}
      className="header-container"
    >
      <Toolbar className="header-toolbar">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography 
            variant="h6" 
            component="div" 
            className="header-title"
          >
            Dashboard
          </Typography>
          
          {/* Device Selector */}
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 150,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '&:hover fieldset': {
                  borderColor: 'white',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'white',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              '& .MuiSvgIcon-root': {
                color: 'white',
              }
            }}
          >
            <InputLabel id="device-select-label">Zařízení</InputLabel>
            <Select
              labelId="device-select-label"
              id="device-select"
              value={selectedDeviceId}
              label="Zařízení"
              onChange={handleDeviceChange}
            >
              {devices.map(device => (
                <MenuItem key={device.id} value={device.id}>
                  {device.name} ({device.type})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        <Box 
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          className="header-actions"
        >
          <MuiTooltip title={deviceState?.wifiName || "WiFi"}>
            <IconButton color={deviceState?.wifiName ? "secondary" : "default"}>
              <FiWifi />
            </IconButton>
          </MuiTooltip>
          
          <MuiTooltip title={deviceState?.bluetoothEnable ? "Bluetooth: Enable" : "Bluetooth: Disabled"}>
            <IconButton color={deviceState?.bluetoothEnable ? "secondary" : "default"}>
              <FiBluetooth />
            </IconButton>
          </MuiTooltip>
          
          <MuiTooltip title={metricsCount === 0 ? "Server: Off" : "Server: On"}>
            <IconButton color={metricsCount === 0 ? "default" : "secondary"}>
              <FiServer />
            </IconButton>
          </MuiTooltip>
          
          <MuiTooltip title={deviceState?.mqttEnable ? "MQTT: Enable" : "MQTT: Disabled"}>
            <IconButton color={deviceState?.mqttEnable ? "secondary" : "default"}>
              <SiMqtt />
            </IconButton>
          </MuiTooltip>
          
          {/* Battery indicator for ShellyHT devices */}
          {isShellyHT && (
            <MuiTooltip title={`Baterie: ${deviceState?.battery || 0}%`}>
              <IconButton 
                color="secondary"
                sx={{ 
                  position: 'relative',
                  '&::after': {
                    content: `"${deviceState?.battery || 0}%"`,
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    fontSize: '10px',
                    backgroundColor: 'primary.main',
                    borderRadius: '4px',
                    padding: '1px 3px',
                    color: 'white'
                  }
                }}
              >
                <FiBattery />
              </IconButton>
            </MuiTooltip>
          )}
          
          <Box sx={{ ml: 2 }} className="header-interval-selector">
            <IntervalSelector onChangeInterval={handleUpdateInterval} />
          </Box>
          
          <MuiTooltip title="Správa zařízení">
            <IconButton 
              onClick={() => setShowDeviceList(!showDeviceList)} 
              color={showDeviceList ? "secondary" : "inherit"}
            >
              <FiList />
            </IconButton>
          </MuiTooltip>
          
          <MuiTooltip title={editMode ? "Exit Edit Mode" : "Edit Dashboard"}>
            <IconButton 
              onClick={() => dashboardService.toggleEditMode()} 
              color={editMode ? "secondary" : "inherit"}
            >
              <FiEdit />
            </IconButton>
          </MuiTooltip>
          
          <IconButton onClick={toggleDarkMode} color="inherit">
            {darkMode ? <FiSun /> : <FiMoon />}
          </IconButton>
          
          <IconButton onClick={handleToggleModal} color="inherit">
            <FiSettings />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
