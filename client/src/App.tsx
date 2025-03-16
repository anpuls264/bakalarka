import React, { useEffect, useState } from 'react';
import { FiMoon, FiSun, FiSettings, FiWifi, FiBluetooth, FiServer, FiEdit, FiList } from 'react-icons/fi';
import { SiMqtt } from "react-icons/si";
import { Socket, io } from 'socket.io-client';
import axios from 'axios';
import DeviceList from './components/DeviceList';
import { deviceService } from './services/DeviceService';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Container, 
  Grid, 
  Box, 
  Paper, 
  Modal, 
  Tooltip as MuiTooltip,
  useMediaQuery
} from '@mui/material';
import { lightTheme, darkTheme } from './theme';
import RealTimeGraph from './components/RealTimeGraph';
import CurrentValues from './components/CurrentValue';
import Tabs from './components/Tabs';
import DashboardLayout from './components/DashboardLayout';
import { Item, DashboardLayout as DashboardLayoutType } from './types/types';
import ControlPanel from './components/ControlPanel';
import ColumnChart from './components/ColumnChart';
import ExpenseBox from './components/ExpenseBox';
import IntervalSelector from './components/IntervalSelector';
import LineChart from './components/LineChart';
import PieChart from './components/PieChart';
import HeatMap from './components/HeatMap';

const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxWidth: 600,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const App: React.FC = () => {
  const [data, setData] = useState<Item[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [wifiName, setWifiName] = useState('');
  const [deviceTurnOnOf, setDeviceTurnOnOf] = useState(false);
  const [bluetoothEnable, setBluetoothEnable] = useState(false);
  const [mqttEnable, setMqttEnable] = useState(false);
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [intervalInMilliseconds, setIntervalInMilliseconds] = useState(300000); // 5 minutes as default
  const [editMode, setEditMode] = useState(false);
  
  // Dashboard layout state
  const [dashboardLayout, setDashboardLayout] = useState<DashboardLayoutType>({
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
  
  // Responsive breakpoints
  const isXs = useMediaQuery(lightTheme.breakpoints.down('sm'));
  const isSm = useMediaQuery(lightTheme.breakpoints.between('sm', 'md'));
  const isMd = useMediaQuery(lightTheme.breakpoints.between('md', 'lg'));

  const handleUpdateInterval = (newInterval: number) => {
    setIntervalInMilliseconds(newInterval);
  };

  const [hourlyTotal, setHourlyTotal] = useState(0);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  // Function to calculate total for a given time period
  const calculateTotal = (timePeriod: string) => {
    const currentTime = new Date();

    // Helper function to safely add values, handling NaN
    const safeAdd = (acc: number, curr: number) => {
      if (isNaN(curr)) return acc;
      return acc + curr;
    };

    switch (timePeriod) {
      case 'hodinu':
        return data.filter(item => {
          const itemTime = new Date(item.timestamp);
          const hourAgo = new Date(currentTime.getTime() - 60 * 60 * 1000);
          return itemTime > hourAgo && itemTime <= currentTime;
        }).reduce((acc, curr) => safeAdd(acc, curr.total), 0);

      case 'den':
        return data.filter(item => {
          const itemTime = new Date(item.timestamp);
          const dayAgo = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);
          return itemTime > dayAgo && itemTime <= currentTime;
        }).reduce((acc, curr) => safeAdd(acc, curr.total), 0);

      case 'týden':
        return data.filter(item => {
          const itemTime = new Date(item.timestamp);
          const weekAgo = new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000);
          return itemTime > weekAgo && itemTime <= currentTime;
        }).reduce((acc, curr) => safeAdd(acc, curr.total), 0);

      case 'měsíc':
        const currentMonth = currentTime.getMonth();
        return data.filter(item => {
          const itemTime = new Date(item.timestamp);
          return itemTime.getMonth() === currentMonth && itemTime <= currentTime;
        }).reduce((acc, curr) => safeAdd(acc, curr.total), 0);

      default:
        return 0;
    }
  };

  // Get electricity rate from localStorage
  const myNumberString: string | null = localStorage.getItem("myNumber");
  const myNumber: number = myNumberString !== null ? parseFloat(myNumberString) : 1;

  const handleToggleModal = () => {
    setShowModal(!showModal);
  };

  function aggregateItemsByInterval(items: Item[], interval: number): Item[] {
    if (items.length === 0) {
      return [];
    }
  
    let startTime = new Date(items[0].timestamp).getTime();
    let endTime = startTime + interval;
  
    const aggregatedItems: Item[] = [];
    let sumApower = 0;
    let sumVoltage = 0;
    let sumCurrent = 0;
    let count = 0;
    let validApowerCount = 0;
    let validVoltageCount = 0;
    let validCurrentCount = 0;
  
    for (const item of items) {
      const itemTime = new Date(item.timestamp).getTime();
      if (itemTime >= startTime && itemTime <= endTime) {
        // Only add valid values to the sum
        if (!isNaN(item.apower)) {
          sumApower += item.apower;
          validApowerCount++;
        }
        if (!isNaN(item.voltage)) {
          sumVoltage += item.voltage;
          validVoltageCount++;
        }
        if (!isNaN(item.current)) {
          sumCurrent += item.current;
          validCurrentCount++;
        }
        count++;
      } else {
        if (count > 0) {
          // Calculate averages using valid counts
          const averageApower = validApowerCount > 0 ? sumApower / validApowerCount : 0;
          const averageVoltage = validVoltageCount > 0 ? sumVoltage / validVoltageCount : 0;
          const averageCurrent = validCurrentCount > 0 ? sumCurrent / validCurrentCount : 0;
          const total = averageApower * averageVoltage * averageCurrent;
  
          aggregatedItems.push({
            ...item,
            apower: averageApower,
            voltage: averageVoltage,
            current: averageCurrent,
            total,
          });
  
          // Reset counters
          sumApower = 0;
          sumVoltage = 0;
          sumCurrent = 0;
          count = 0;
          validApowerCount = 0;
          validVoltageCount = 0;
          validCurrentCount = 0;
        }
        startTime = itemTime;
        endTime = startTime + interval;
      }
    }
  
    // Process any remaining data
    if (count > 0) {
      const averageApower = validApowerCount > 0 ? sumApower / validApowerCount : 0;
      const averageVoltage = validVoltageCount > 0 ? sumVoltage / validVoltageCount : 0;
      const averageCurrent = validCurrentCount > 0 ? sumCurrent / validCurrentCount : 0;
      const total = averageApower * averageVoltage * averageCurrent;

      aggregatedItems.push({
        ...items[items.length - 1],
        apower: averageApower,
        voltage: averageVoltage,
        current: averageCurrent,
        total,
      });
    }
  
    return aggregatedItems;
  }

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

  // Connect to socket and set up event listeners
  useEffect(() => {
    const socketInstance = io('13.61.175.177:3000');

    socketInstance.on('initialData', (initialData: Item[]) => {
      setData(initialData);
    });

    socketInstance.on('updateValues', (updatedValues) => {
      const { wifiName, deviceTurnOnOf, bluetoothEnable, mqttEnable } = updatedValues;
      setWifiName(wifiName);
      setDeviceTurnOnOf(deviceTurnOnOf);
      setBluetoothEnable(bluetoothEnable);
      setMqttEnable(mqttEnable);
    });

    socketInstance.on('newData', (newData: Item) => {
      setData((prevData) => [...prevData, newData]);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [data]); // Empty dependency array to run only once on mount

  // Update totals when data changes
  useEffect(() => {
    setHourlyTotal(calculateTotal('hodinu'));
    setDailyTotal(calculateTotal('den'));
    setWeeklyTotal(calculateTotal('týden'));
    setMonthlyTotal(calculateTotal('měsíc'));
  }, [data]); // Only recalculate when data changes

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh', p: 2 }}>
        <AppBar position="static" color="primary" elevation={0} sx={{ mb: 3, borderRadius: 1 }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Dashboard
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MuiTooltip title={wifiName || "WiFi"}>
                <IconButton color={wifiName ? "secondary" : "default"}>
                  <FiWifi />
                </IconButton>
              </MuiTooltip>
              
              <MuiTooltip title={bluetoothEnable ? "Bluetooth: Enable" : "Bluetooth: Disabled"}>
                <IconButton color={bluetoothEnable ? "secondary" : "default"}>
                  <FiBluetooth />
                </IconButton>
              </MuiTooltip>
              
              <MuiTooltip title={data.length === 0 ? "Server: Off" : "Server: On"}>
                <IconButton color={data.length === 0 ? "default" : "secondary"}>
                  <FiServer />
                </IconButton>
              </MuiTooltip>
              
              <MuiTooltip title={mqttEnable ? "MQTT: Enable" : "MQTT: Disabled"}>
                <IconButton color={mqttEnable ? "secondary" : "default"}>
                  <SiMqtt />
                </IconButton>
              </MuiTooltip>
              
              <Box sx={{ ml: 2 }}>
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
                  onClick={() => setEditMode(!editMode)} 
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

        {showDeviceList ? (
          <Container maxWidth="lg" sx={{ mt: 3 }}>
            <DeviceList />
          </Container>
        ) : (
          <Container maxWidth="xl">
            <DashboardLayout 
              layout={dashboardLayout}
              onLayoutChange={(newLayout) => {
                setDashboardLayout(newLayout);
                localStorage.setItem('dashboardLayout', JSON.stringify(newLayout));
              }}
              editMode={editMode}
            >
            {/* Control Panel */}
            <div data-id="control-panel">
              <ControlPanel 
                socket={socket} 
                isOn={deviceTurnOnOf} 
                brightness={100} 
              />
            </div>
            
            {/* Current Values */}
            <div data-id="current-value-voltage">
              <CurrentValues 
                neco={'V'} 
                value={data[data.length - 1]?.voltage} 
                min={data.length ? Math.min(...data.filter(item => !isNaN(item.voltage)).map(item => item.voltage)) : 0} 
                max={data.length ? Math.max(...data.filter(item => !isNaN(item.voltage)).map(item => item.voltage)) : 0} 
              />
            </div>
            
            <div data-id="current-value-power">
              <CurrentValues 
                neco={'W'} 
                value={data[data.length - 1]?.apower} 
                min={data.length ? Math.min(...data.filter(item => !isNaN(item.apower)).map(item => item.apower)) : 0} 
                max={data.length ? Math.max(...data.filter(item => !isNaN(item.apower)).map(item => item.apower)) : 0} 
              />
            </div>
            
            <div data-id="current-value-current">
              <CurrentValues 
                neco={'A'} 
                value={data[data.length - 1]?.current} 
                min={data.length ? Math.min(...data.filter(item => !isNaN(item.current)).map(item => item.current)) : 0} 
                max={data.length ? Math.max(...data.filter(item => !isNaN(item.current)).map(item => item.current)) : 0} 
              />
            </div>
            
            {/* Charts */}
            <div data-id="real-time-graph">
              <RealTimeGraph 
                data={aggregateItemsByInterval(data, intervalInMilliseconds)} 
              />
            </div>
            
            <div data-id="column-chart">
              <ColumnChart 
                data={aggregateItemsByInterval(data, intervalInMilliseconds)} 
              />
            </div>
            
            <div data-id="line-chart">
              <LineChart 
                data={aggregateItemsByInterval(data, intervalInMilliseconds)} 
              />
            </div>
            
            <div data-id="pie-chart">
              <PieChart 
                data={aggregateItemsByInterval(data, intervalInMilliseconds)} 
              />
            </div>
            
            {/* Heat Map */}
            <div data-id="heat-map">
              <HeatMap 
                data={aggregateItemsByInterval(data, intervalInMilliseconds)} 
              />
            </div>
            
            {/* Expense Boxes */}
            <div data-id="expense-box-hour">
              <ExpenseBox 
                amount={hourlyTotal * 5} 
                den='hodinu' 
              />
            </div>
            
            <div data-id="expense-box-day">
              <ExpenseBox 
                amount={dailyTotal} 
                den='den' 
              />
            </div>
            
            <div data-id="expense-box-week">
              <ExpenseBox 
                amount={weeklyTotal} 
                den='týden' 
              />
            </div>
            
            <div data-id="expense-box-month">
              <ExpenseBox 
                amount={monthlyTotal} 
                den='měsíc' 
              />
            </div>
            </DashboardLayout>
          </Container>
        )}

        {/* Settings Modal */}
        <Modal
          open={showModal}
          onClose={handleToggleModal}
          aria-labelledby="settings-modal"
          aria-describedby="settings-modal-description"
        >
          <Box sx={modalStyle}>
            <IconButton
              onClick={handleToggleModal}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              X
            </IconButton>
            <Tabs />
          </Box>
        </Modal>
      </Box>
    </ThemeProvider>
  );
};

export default App;
