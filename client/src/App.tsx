import React, { useEffect, useState, useMemo, useCallback } from 'react';
import DeviceList from './components/DeviceList';
import { deviceService } from './services/DeviceService';
import { metricsService } from './services/MetricsService';
import { dashboardService } from './services/DashboardService';
import { metricsToItems } from './utils/dataAdapters';
import { isComponentCompatible } from './utils/componentCompatibility';
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
import TemperatureHumidityGraph from './components/TemperatureHumidityGraph/TemperatureHumidityGraph';
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

  // Memoized handlers
  const handleUpdateInterval = useCallback((newInterval: number) => {
    setIntervalInMilliseconds(newInterval);
  }, []);

  const handleToggleModal = useCallback(() => {
    setShowModal(prev => !prev);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const handleDeviceSelect = useCallback(async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    
    const device = await deviceService.getDevice(deviceId);
    setSelectedDevice(device);
    
    if (device) {
      setDeviceState(device.state);
    }
  }, []);

  // Combine all subscriptions into one effect
  useEffect(() => {
    const subscriptions = [
      deviceService.subscribeToDeviceState(setDeviceState),
      metricsService.subscribeToMetrics(setMetrics),
      metricsService.subscribeToTotal('hour', setHourlyTotal),
      metricsService.subscribeToTotal('day', setDailyTotal),
      metricsService.subscribeToTotal('week', setWeeklyTotal),
      metricsService.subscribeToTotal('month', setMonthlyTotal),
      dashboardService.subscribeToLayout(setDashboardLayout),
      dashboardService.subscribeToEditMode(setEditMode)
    ];
    
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
      subscriptions.forEach(unsubscribe => unsubscribe());
    };
  }, [selectedDeviceId]);

  // Memoized calculations
  const aggregatedMetrics = useMemo(() => {
    return metrics.length > 0 
      ? metricsService.getAggregatedMetrics(intervalInMilliseconds)
      : [];
  }, [metrics, intervalInMilliseconds]);

  const getMinMaxValues = useCallback((property: keyof DeviceMetrics) => {
    if (!metrics.length) return { min: 0, max: 0 };
    
    const validValues = metrics
      .filter(item => item[property] !== undefined && !isNaN(Number(item[property])))
      .map(item => Number(item[property]));
    
    return {
      min: validValues.length ? Math.min(...validValues) : 0,
      max: validValues.length ? Math.max(...validValues) : 0
    };
  }, [metrics]);

  const getLatestValue = useCallback((property: keyof DeviceMetrics) => {
    if (!metrics.length) return 0;
    return metrics[metrics.length - 1][property] as number || 0;
  }, [metrics]);

  // Memoize transformed data for charts
  const chartData = useMemo(() => 
    metricsToItems(aggregatedMetrics), 
    [aggregatedMetrics]
  );

  // Memoize header props
  const headerProps = useMemo(() => ({
    darkMode,
    toggleDarkMode,
    deviceState,
    metricsCount: metrics.length,
    showDeviceList,
    setShowDeviceList,
    editMode,
    handleUpdateInterval,
    handleToggleModal,
    onDeviceSelect: handleDeviceSelect
  }), [
    darkMode, 
    toggleDarkMode, 
    deviceState, 
    metrics.length, 
    showDeviceList, 
    editMode, 
    handleUpdateInterval, 
    handleToggleModal, 
    handleDeviceSelect
  ]);

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh', p: 2 }}>
        <Header {...headerProps} />

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
                  {selectedDevice && isComponentCompatible('control-panel', selectedDevice.type) ? (
                    <ControlPanel deviceId={selectedDeviceId} />
                  ) : (
                    null
                  )}
                </div>
                
                {/* Current Values for ShellyPlugS */}
                <div data-id="current-value-voltage">
                  {selectedDevice && isComponentCompatible('current-value-voltage', selectedDevice.type) ? (
                    <CurrentValues 
                      unit={UnitType.VOLT} 
                      value={getLatestValue('voltage')} 
                      min={getMinMaxValues('voltage').min} 
                      max={getMinMaxValues('voltage').max} 
                    />
                  ) : (
                    null
                  )}
                </div>
                
                <div data-id="current-value-power">
                  {selectedDevice && isComponentCompatible('current-value-power', selectedDevice.type) ? (
                    <CurrentValues 
                      unit={UnitType.WATT} 
                      value={getLatestValue('apower')} 
                      min={getMinMaxValues('apower').min} 
                      max={getMinMaxValues('apower').max} 
                    />
                  ) : (
                    null
                  )}
                </div>
                
                <div data-id="current-value-current">
                  {selectedDevice && isComponentCompatible('current-value-current', selectedDevice.type) ? (
                    <CurrentValues 
                      unit={UnitType.AMPERE} 
                      value={getLatestValue('current')} 
                      min={getMinMaxValues('current').min} 
                      max={getMinMaxValues('current').max} 
                    />
                  ) : (
                    null
                  )}
                </div>
                
                {/* Current Values for ShellyHT */}
                <div data-id="current-value-temperature">
                  {selectedDevice && isComponentCompatible('current-value-temperature', selectedDevice.type) ? (
                    <CurrentValues 
                      unit={UnitType.CELSIUS} 
                      value={getLatestValue('temperature')} 
                      min={getMinMaxValues('temperature').min} 
                      max={getMinMaxValues('temperature').max} 
                    />
                  ) : (
                    null
                  )}
                </div>
                
                <div data-id="current-value-humidity">
                  {selectedDevice && isComponentCompatible('current-value-humidity', selectedDevice.type) ? (
                    <CurrentValues 
                      unit={UnitType.PERCENT} 
                      value={getLatestValue('humidity')} 
                      min={getMinMaxValues('humidity').min} 
                      max={getMinMaxValues('humidity').max} 
                    />
                  ) : (
                    null
                  )}
                </div>
                
                <div data-id="current-value-battery">
                  {selectedDevice && isComponentCompatible('current-value-battery', selectedDevice.type) ? (
                    <CurrentValues 
                      unit={UnitType.PERCENT} 
                      value={deviceState?.battery || 0} 
                      min={0} 
                      max={100} 
                    />
                  ) : (
                    null
                  )}
                </div>
                
                {/* Temperature Humidity Graph - Only for ShellyHT */}
                <div data-id="temperature-humidity-graph">
                  {selectedDevice && isComponentCompatible('temperature-humidity-graph', selectedDevice.type) ? (
                    <TemperatureHumidityGraph deviceId={selectedDeviceId} />
                  ) : (
                    null
                  )}
                </div>
                
                {/* Charts */}
                <div data-id="real-time-graph">
                  {selectedDevice && isComponentCompatible('real-time-graph', selectedDevice.type) ? (
                    <RealTimeGraph deviceId={selectedDeviceId} />
                  ) : (
                    null
                  )}
                </div>
                
                <div data-id="column-chart">
                  {selectedDevice && isComponentCompatible('column-chart', selectedDevice.type) ? (
                    <ColumnChart deviceId={selectedDeviceId} />
                  ) : (
                    null
                  )}
                </div>
                
                <div data-id="line-chart">
                  {selectedDevice && isComponentCompatible('line-chart', selectedDevice.type) ? (
                    <LineChart deviceId={selectedDeviceId} />
                  ) : (
                    null
                  )}
                </div>
                
                <div data-id="pie-chart">
                  {selectedDevice && isComponentCompatible('pie-chart', selectedDevice.type) ? (
                    <PieChart deviceId={selectedDeviceId} />
                  ) : (
                    null
                  )}
                </div>
                
                 {/* Heat Map */}
                <div data-id="heat-map">
                  {selectedDevice && isComponentCompatible('heat-map', selectedDevice.type) ? (
                    <HeatMap deviceId={selectedDeviceId} />
                  ) : (
                    null
                  )}
                </div>
                
                {/* Expense Boxes */}
                <div data-id="expense-box-hour">
                  {selectedDevice && isComponentCompatible('expense-box-hour', selectedDevice.type) ? (
                    <ExpenseBox 
                      amount={hourlyTotal * myNumber} 
                      den='hodinu' 
                    />
                  ) : (
                    null
                  )}
                </div>
                
                <div data-id="expense-box-day">
                  {selectedDevice && isComponentCompatible('expense-box-day', selectedDevice.type) ? (
                    <ExpenseBox 
                      amount={dailyTotal * myNumber} 
                      den='den' 
                    />
                  ) : (
                    null
                  )}
                </div>
                
                <div data-id="expense-box-week">
                  {selectedDevice && isComponentCompatible('expense-box-week', selectedDevice.type) ? (
                    <ExpenseBox 
                      amount={weeklyTotal * myNumber} 
                      den='týden' 
                    />
                  ) : (
                    null
                  )}
                </div>
                
                <div data-id="expense-box-month">
                  {selectedDevice && isComponentCompatible('expense-box-month', selectedDevice.type) ? (
                    <ExpenseBox 
                      amount={monthlyTotal * myNumber} 
                      den='měsíc' 
                    />
                  ) : (
                    null
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
