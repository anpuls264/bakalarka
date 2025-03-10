import React, { useEffect, useState } from 'react';
import { useTheme, Box, Typography, Button, TextField, Switch, FormControlLabel, MenuItem, Select, InputLabel, FormControl, SelectChangeEvent } from '@mui/material';
import './Tabs.css';
import DashboardSettings from './DashboardSettings';
import DeviceSettings from './DeviceSettings';
import { DashboardLayout, DashboardItem, DeviceState } from '../types/types';

const Tabs = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState<any>(null);
  const [wifiTabSelected, setWifiTabSelected] = useState(false);
  const [bluetoothTabSelected, setBluetoothTabSelected] = useState(false);
  const [ssids, setSsids] = useState<string[]>([]);
  const [wifiConfig, setWifiConfig] = useState<any>(null);
  const [bluetoothConfig, setBluetoothConfig] = useState<any>(null);

  // Dashboard layout state
  const [dashboardLayout, setDashboardLayout] = useState<DashboardLayout>({
    items: [
      {
        id: 'control-panel',
        type: 'control-panel',
        title: 'Control Panel',
        width: 4,
        order: 0,
        visible: true
      },
      {
        id: 'current-value-voltage',
        type: 'current-value-voltage',
        title: 'Current Voltage',
        width: 4,
        order: 1,
        visible: true
      },
      {
        id: 'current-value-power',
        type: 'current-value-power',
        title: 'Current Power',
        width: 4,
        order: 2,
        visible: true
      },
      {
        id: 'current-value-current',
        type: 'current-value-current',
        title: 'Current Amperage',
        width: 4,
        order: 3,
        visible: true
      },
      {
        id: 'real-time-graph',
        type: 'real-time-graph',
        title: 'Real-Time Graph',
        width: 2,
        order: 4,
        visible: true
      },
      {
        id: 'column-chart',
        type: 'column-chart',
        title: 'Column Chart',
        width: 2,
        order: 5,
        visible: true
      },
      {
        id: 'line-chart',
        type: 'line-chart',
        title: 'Line Chart',
        width: 2,
        order: 6,
        visible: true
      },
      {
        id: 'pie-chart',
        type: 'pie-chart',
        title: 'Pie Chart',
        width: 2,
        order: 7,
        visible: true
      },
      {
        id: 'heat-map',
        type: 'heat-map',
        title: 'Heat Map',
        width: 1,
        order: 8,
        visible: true
      },
      {
        id: 'expense-box-hour',
        type: 'expense-box-hour',
        title: 'Hourly Expense',
        width: 4,
        order: 9,
        visible: true
      },
      {
        id: 'expense-box-day',
        type: 'expense-box-day',
        title: 'Daily Expense',
        width: 4,
        order: 10,
        visible: true
      },
      {
        id: 'expense-box-week',
        type: 'expense-box-week',
        title: 'Weekly Expense',
        width: 4,
        order: 11,
        visible: true
      },
      {
        id: 'expense-box-month',
        type: 'expense-box-month',
        title: 'Monthly Expense',
        width: 4,
        order: 12,
        visible: true
      }
    ],
    columns: 4
  });

  // Load dashboard layout from localStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboardLayout');
    if (savedLayout) {
      try {
        setDashboardLayout(JSON.parse(savedLayout));
      } catch (error) {
        console.error('Error parsing saved dashboard layout:', error);
      }
    }
  }, []);

  // Load electricity rate from localStorage
  const loadedNumberString = localStorage.getItem("myNumber");
  const loadedNumber: number | null = loadedNumberString ? parseFloat(loadedNumberString) : null;
  const [inputValue, setInputValue] = useState(loadedNumber !== null ? loadedNumber * 1000 : 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpointURLs = ['/rpc/MQTT.GetConfig', '/rpc/Wifi.GetConfig', '/rpc/BLE.GetConfig'];

        if (wifiTabSelected) {
          console.log("yes");
          endpointURLs.push('/rpc/Wifi.Scan');
        }

        const fetchPromises = endpointURLs.map(async (url) => {
          const response = await fetch(url);
          return response.json();
        });

        const results = await Promise.all(fetchPromises);
        setData(results);
        setWifiConfig(results[1].ap.enable);
        setBluetoothConfig(results[2]);
        console.log( "data: " + JSON.stringify(data, null, 3));

        if (wifiTabSelected && results[2] && results[2].results) {
          const extractedSsids = results[2].results.map((result: any) => result.ssid);
          setSsids(extractedSsids);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [wifiTabSelected]);

  const handleTabs = (index : number) => {
    if (index === activeTab) return;
    
    setActiveTab(index);

    if (index === 1 && !wifiTabSelected) {
      setWifiTabSelected(true);
    } else if (index === 2 && !bluetoothTabSelected) { 
      setBluetoothTabSelected(true);
    }
  };

  const handleWifiToggle = () => {
    const wifiSettings = data && data[0];

    if (wifiSettings) {
      const updatedWifiSettings = { ...wifiSettings, enable: !wifiSettings.enable };
      console.log('Updated Wi-Fi Settings:', updatedWifiSettings);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      setInputValue(newValue);
    }
  };

  const handleDashboardLayoutChange = (newLayout: DashboardLayout) => {
    setDashboardLayout(newLayout);
    localStorage.setItem('dashboardLayout', JSON.stringify(newLayout));
  };

  const handleSaveButtonClick = () => {
    const valueToSave = (Number(inputValue) / 1000).toString();
    localStorage.setItem('myNumber', valueToSave);
    
    // Also save dashboard layout
    localStorage.setItem('dashboardLayout', JSON.stringify(dashboardLayout));
  };

  return (
    <Box className="tabs-component" sx={{ 
      bgcolor: theme.palette.background.paper,
      borderRadius: 2,
      boxShadow: 3,
      overflow: 'hidden'
    }}>
      <Box className="tabs-container" sx={{ 
        display: 'flex',
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        {["MQTT", "Wi-fi", "Bluetooth", "Cena za kW", "Dashboard", "Zařízení"].map((tab, index) => (
          <Button
            key={index}
            className={index === activeTab ? "active" : ""}
            onClick={() => handleTabs(index)}
            sx={{
              flex: 1,
              py: 1.5,
              borderRadius: 0,
              color: index === activeTab ? theme.palette.common.white : theme.palette.text.primary,
              bgcolor: index === activeTab ? theme.palette.primary.main : 'transparent',
              '&:hover': {
                bgcolor: index === activeTab ? theme.palette.primary.dark : theme.palette.action.hover
              }
            }}
          >
            {tab}
          </Button>
        ))}
      </Box>
      
      {/* MQTT Tab */}
      <Box className={`content ${activeTab === 0 ? "active-content" : ""}`} sx={{ p: 3 }}>
        {data && (
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={data[0]?.enable || false} 
                  onChange={handleWifiToggle}
                  color="primary"
                />
              }
              label="Enable MQTT"
            />
            <TextField
              label="Server"
              variant="outlined"
              fullWidth
              value={data[0]?.server || ''}
              margin="normal"
            />
            <TextField
              label="Client ID"
              variant="outlined"
              fullWidth
              value={data[0]?.topic_prefix || ''}
              margin="normal"
            />
            <TextField
              label="Username"
              variant="outlined"
              fullWidth
              value={data[0]?.user || ''}
              margin="normal"
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
            />
          </Box>
        )}
      </Box>
      
      {/* WiFi Tab */}
      <Box className={`content ${activeTab === 1 ? "active-content" : ""}`} sx={{ p: 3 }}>
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch 
                checked={wifiConfig || false} 
                onChange={handleWifiToggle}
                color="primary"
              />
            }
            label="Enable Wi-Fi"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="ssid-select-label">Select SSID</InputLabel>
            <Select
              labelId="ssid-select-label"
              id="ssid-select"
              label="Select SSID"
              defaultValue=""
            >
              {ssids.map((ssid, index) => (
                <MenuItem key={index} value={ssid}>
                  {ssid}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
          />
        </Box>
      </Box>
      
      {/* Bluetooth Tab */}
      <Box className={`content ${activeTab === 2 ? "active-content" : ""}`} sx={{ p: 3 }}>
        {data && bluetoothConfig && (
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={bluetoothConfig.enabled || false} 
                  onChange={() => setBluetoothConfig((prevState: { enabled: any; }) => ({ ...prevState, enabled: !prevState.enabled }))}
                  color="primary"
                />
              }
              label="Enable Bluetooth"
            />
            <TextField
              label="Device Name"
              variant="outlined"
              fullWidth
              value={bluetoothConfig.deviceName || ''}
              margin="normal"
            />
            <TextField
              label="Device ID"
              variant="outlined"
              fullWidth
              value={bluetoothConfig.deviceId || ''}
              margin="normal"
            />
          </Box>
        )}
      </Box>
      
      {/* Electricity Rate Tab */}
      <Box className={`content ${activeTab === 3 ? "active-content" : ""}`} sx={{ p: 3 }}>
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Cena za kWh (Kč)"
            type="number"
            variant="outlined"
            fullWidth
            value={inputValue}
            onChange={handleInputChange}
            InputProps={{
              inputProps: { 
                step: 0.01,
                min: 0
              }
            }}
            margin="normal"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Nastavená hodnota bude použita pro výpočet nákladů na elektřinu.
          </Typography>
        </Box>
      </Box>
      
      {/* Dashboard Settings Tab */}
      <Box className={`content ${activeTab === 4 ? "active-content" : ""}`} sx={{ p: 3 }}>
        <DashboardSettings 
          layout={dashboardLayout}
          onLayoutChange={handleDashboardLayoutChange}
        />
      </Box>
      
      {/* Device Settings Tab */}
      <Box className={`content ${activeTab === 5 ? "active-content" : ""}`} sx={{ p: 3 }}>
        <DeviceSettings 
          deviceState={{
            wifiName: wifiConfig?.ssid || null,
            deviceTurnOnOff: false,
            bluetoothEnable: bluetoothConfig?.enabled || false,
            mqttEnable: data?.[0]?.enable || false,
            deviceName: 'Shelly Plug S',
            ledMode: 0,
            powerOnState: 0,
            autoOffTimer: 0,
            autoOnTimer: 0,
            powerLimit: 0
          }}
          onSettingsChange={() => {
            // Refresh data after settings change
            if (activeTab === 5) {
              // Fetch updated device state
              console.log('Refreshing device settings');
            }
          }}
        />
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleSaveButtonClick}
          sx={{ minWidth: 120 }}
        >
          Uložit
        </Button>
      </Box>
    </Box>
  );
};

export default Tabs;
