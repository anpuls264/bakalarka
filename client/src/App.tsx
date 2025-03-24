import React, { useEffect, useState } from 'react';
import DeviceList from './components/DeviceList';
import { deviceService } from './services/DeviceService';
import { metricsService } from './services/MetricsService';
import { dashboardService } from './services/DashboardService';
import { metricsToItems } from './utils/dataAdapters';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { 
  IconButton, 
  Container, 
  Box, 
  Modal, 
  useMediaQuery
} from '@mui/material';
import { lightTheme, darkTheme } from './theme';
import RealTimeGraph from './components/RealTimeGraph/RealTimeGraph';
import CurrentValues from './components/CurrentValue/CurrentValue';
import Tabs from './components/Tabs';
import DashboardLayout from './components/DashboardLayout';
import { Device, DeviceState } from './models/Device';
import { DeviceMetrics } from './models/Metrics';
import { DashboardLayout as DashboardLayoutType } from './models/Dashboard';
import ControlPanel from './components/ControlPanel';
import ColumnChart from './components/ColumnChart/ColumnChart';
import ExpenseBox from './components/ExpenseBox';
import IntervalSelector from './components/IntervalSelector';
import LineChart from './components/LineChart/LineChart';
import PieChart from './components/PieChart/PieChart';
import HeatMap from './components/HeatMap/HeatMap';
import Header from './components/Header';
import { UnitType } from './components/CurrentValue/CurrentValueUtils';

const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 800,
  height: '90%',
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 0,
  borderRadius: 2,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
};

const App: React.FC = () => {
  // UI state
  const [darkMode, setDarkMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [intervalInMilliseconds, setIntervalInMilliseconds] = useState(300000); // 5 minutes as default
  
  // Device state
  const [deviceState, setDeviceState] = useState<DeviceState | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('shelly1');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  
  // Metrics state
  const [metrics, setMetrics] = useState<DeviceMetrics[]>([]);
  const [hourlyTotal, setHourlyTotal] = useState(0);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  
  // Dashboard state
  const [dashboardLayout, setDashboardLayout] = useState<DashboardLayoutType | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  // Responsive breakpoints
  const isXs = useMediaQuery(lightTheme.breakpoints.down('sm'));
  const isSm = useMediaQuery(lightTheme.breakpoints.between('sm', 'md'));
  const isMd = useMediaQuery(lightTheme.breakpoints.between('md', 'lg'));

  // Get electricity rate from localStorage
  const myNumberString: string | null = localStorage.getItem("myNumber");
  const myNumber: number = myNumberString !== null ? parseFloat(myNumberString) : 1;

  // Handle interval change
  const handleUpdateInterval = (newInterval: number) => {
    setIntervalInMilliseconds(newInterval);
  };

  // Toggle modal
  const handleToggleModal = () => {
    setShowModal(!showModal);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  // Handle device selection
  const handleDeviceSelect = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    
    // Fetch the selected device
    const device = await deviceService.getDevice(deviceId);
    setSelectedDevice(device);
    
    // Update device state
    if (device) {
      setDeviceState(device.state);
    }
  };

  // Subscribe to device state updates
  useEffect(() => {
    const unsubscribe = deviceService.subscribeToDeviceState((state) => {
      setDeviceState(state);
    });
    
    // Fetch initial selected device
    const fetchSelectedDevice = async () => {
      const device = await deviceService.getDevice(selectedDeviceId);
      setSelectedDevice(device);
      if (device) {
        setDeviceState(device.state);
      }
    };
    
    fetchSelectedDevice();
    
    return () => {
      unsubscribe();
    };
  }, [selectedDeviceId]);

  // Subscribe to metrics updates
  useEffect(() => {
    const unsubscribeMetrics = metricsService.subscribeToMetrics((newMetrics) => {
      setMetrics(newMetrics);
    });
    
    const unsubscribeHourly = metricsService.subscribeToTotal('hour', (total) => {
      setHourlyTotal(total);
    });
    
    const unsubscribeDaily = metricsService.subscribeToTotal('day', (total) => {
      setDailyTotal(total);
    });
    
    const unsubscribeWeekly = metricsService.subscribeToTotal('week', (total) => {
      setWeeklyTotal(total);
    });
    
    const unsubscribeMonthly = metricsService.subscribeToTotal('month', (total) => {
      setMonthlyTotal(total);
    });
    
    return () => {
      unsubscribeMetrics();
      unsubscribeHourly();
      unsubscribeDaily();
      unsubscribeWeekly();
      unsubscribeMonthly();
    };
  }, []);

  // Subscribe to dashboard layout updates
  useEffect(() => {
    const unsubscribeLayout = dashboardService.subscribeToLayout((layout) => {
      setDashboardLayout(layout);
    });
    
    const unsubscribeEditMode = dashboardService.subscribeToEditMode((mode) => {
      setEditMode(mode);
    });
    
    return () => {
      unsubscribeLayout();
      unsubscribeEditMode();
    };
  }, []);

  // Get aggregated metrics based on the interval
  const aggregatedMetrics = metrics.length > 0 
    ? metricsService.getAggregatedMetrics(intervalInMilliseconds)
    : [];

  // Calculate min and max values for metrics
  const getMinMaxValues = (property: keyof DeviceMetrics) => {
    if (!metrics.length) return { min: 0, max: 0 };
    
    const validValues = metrics
      .filter(item => item[property] !== undefined && !isNaN(Number(item[property])))
      .map(item => Number(item[property]));
    
    return {
      min: validValues.length ? Math.min(...validValues) : 0,
      max: validValues.length ? Math.max(...validValues) : 0
    };
  };

  // Get latest metric values
  const getLatestValue = (property: keyof DeviceMetrics) => {
    if (!metrics.length) return 0;
    return metrics[metrics.length - 1][property] as number || 0;
  };

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh', p: 2 }}>
        <Header 
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          deviceState={deviceState}
          metricsCount={metrics.length}
          showDeviceList={showDeviceList}
          setShowDeviceList={setShowDeviceList}
          editMode={editMode}
          handleUpdateInterval={handleUpdateInterval}
          handleToggleModal={handleToggleModal}
          onDeviceSelect={handleDeviceSelect}
        />

        {showDeviceList ? (
          <Container maxWidth="lg" sx={{ mt: 3 }}>
            <DeviceList />
          </Container>
        ) : (
          <Container maxWidth="xl">
            {dashboardLayout && (
              <DashboardLayout 
                layout={dashboardLayout}
                onLayoutChange={(newLayout) => {
                  dashboardService.updateLayout(newLayout);
                }}
                editMode={editMode}
              >
                {/* Control Panel */}
                <div data-id="control-panel">
                  <ControlPanel deviceId={selectedDeviceId} />
                </div>
                
                {/* Current Values for ShellyPlugS */}
                <div data-id="current-value-voltage">
                  {selectedDevice?.type === 'shelly-plug-s' ? (
                    <CurrentValues 
                      unit={UnitType.VOLT} 
                      value={getLatestValue('voltage')} 
                      min={getMinMaxValues('voltage').min} 
                      max={getMinMaxValues('voltage').max} 
                    />
                  ) : (
                    <Box sx={{ display: 'none' }}></Box>
                  )}
                </div>
                
                <div data-id="current-value-power">
                  {selectedDevice?.type === 'shelly-plug-s' ? (
                    <CurrentValues 
                    unit={UnitType.WATT} 
                      value={getLatestValue('apower')} 
                      min={getMinMaxValues('apower').min} 
                      max={getMinMaxValues('apower').max} 
                    />
                  ) : (
                    <Box sx={{ display: 'none' }}></Box>
                  )}
                </div>
                
                <div data-id="current-value-current">
                  {selectedDevice?.type === 'shelly-plug-s' ? (
                    <CurrentValues 
                      unit={UnitType.AMPERE} 
                      value={getLatestValue('current')} 
                      min={getMinMaxValues('current').min} 
                      max={getMinMaxValues('current').max} 
                    />
                  ) : (
                    <Box sx={{ display: 'none' }}></Box>
                  )}
                </div>
                
                {/* Current Values for ShellyHT */}
                <div data-id="current-value-temperature">
                  {selectedDevice?.type === 'shelly-ht' ? (
                    <CurrentValues 
                      unit={UnitType.CELSIUS} 
                      value={getLatestValue('temperature')} 
                      min={getMinMaxValues('temperature').min} 
                      max={getMinMaxValues('temperature').max} 
                    />
                  ) : (
                    <Box sx={{ display: 'none' }}></Box>
                  )}
                </div>
                
                <div data-id="current-value-humidity">
                  {selectedDevice?.type === 'shelly-ht' ? (
                    <CurrentValues 
                      unit={UnitType.PERCENT} 
                      value={getLatestValue('humidity')} 
                      min={getMinMaxValues('humidity').min} 
                      max={getMinMaxValues('humidity').max} 
                    />
                  ) : (
                    <Box sx={{ display: 'none' }}></Box>
                  )}
                </div>
                
                <div data-id="current-value-battery">
                  {selectedDevice?.type === 'shelly-ht' ? (
                    <CurrentValues 
                      unit={UnitType.PERCENT} 
                      value={deviceState?.battery || 0} 
                      min={0} 
                      max={100} 
                    />
                  ) : (
                    <Box sx={{ display: 'none' }}></Box>
                  )}
                </div>
                
                {/* Charts - Show for all device types but adapt data */}
                <div data-id="real-time-graph">
                  <RealTimeGraph 
                    data={metricsToItems(aggregatedMetrics)} 
                  />
                </div>
                
                <div data-id="column-chart">
                  <ColumnChart 
                    data={metricsToItems(aggregatedMetrics)} 
                  />
                </div>
                
                <div data-id="line-chart">
                  <LineChart 
                    data={metricsToItems(aggregatedMetrics)} 
                  />
                </div>
                
                <div data-id="pie-chart">
                  <PieChart 
                    data={metricsToItems(aggregatedMetrics)} 
                  />
                </div>
                
                {/* Heat Map */}
                <div data-id="heat-map">
                  <HeatMap 
                    data={metricsToItems(aggregatedMetrics)} 
                  />
                </div>
                
                {/* Expense Boxes - Only show content for ShellyPlugS */}
                <div data-id="expense-box-hour">
                  {selectedDevice?.type === 'shelly-plug-s' ? (
                    <ExpenseBox 
                      amount={hourlyTotal * myNumber} 
                      den='hodinu' 
                    />
                  ) : (
                    <Box sx={{ display: 'none' }}></Box>
                  )}
                </div>
                
                <div data-id="expense-box-day">
                  {selectedDevice?.type === 'shelly-plug-s' ? (
                    <ExpenseBox 
                      amount={dailyTotal * myNumber} 
                      den='den' 
                    />
                  ) : (
                    <Box sx={{ display: 'none' }}></Box>
                  )}
                </div>
                
                <div data-id="expense-box-week">
                  {selectedDevice?.type === 'shelly-plug-s' ? (
                    <ExpenseBox 
                      amount={weeklyTotal * myNumber} 
                      den='týden' 
                    />
                  ) : (
                    <Box sx={{ display: 'none' }}></Box>
                  )}
                </div>
                
                <div data-id="expense-box-month">
                  {selectedDevice?.type === 'shelly-plug-s' ? (
                    <ExpenseBox 
                      amount={monthlyTotal * myNumber} 
                      den='měsíc' 
                    />
                  ) : (
                    <Box sx={{ display: 'none' }}></Box>
                  )}
                </div>
              </DashboardLayout>
            )}
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
