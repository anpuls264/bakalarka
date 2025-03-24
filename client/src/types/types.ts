export type Item = {
    id: number;
    timestamp: string;
    apower: number;
    voltage: number;
    current: number;
    total: number;
}

export type DeviceState = {
    wifiName: string | null;
    deviceTurnOnOff: boolean;
    bluetoothEnable: boolean;
    mqttEnable: boolean;
    deviceName?: string;
    type?: string;
    ledMode?: number;
    powerOnState?: number;
    autoOffTimer?: number;
    autoOnTimer?: number;
    powerLimit?: number;
    currentPower?: number;
    currentVoltage?: number;
    currentCurrent?: number;
    totalEnergy?: number;
    // ShellyHT specific properties
    temperature?: number;
    humidity?: number;
    battery?: number;
}

export type DashboardItemType = 
  | 'control-panel'
  | 'current-value-voltage'
  | 'current-value-power'
  | 'current-value-current'
  | 'current-value-temperature'
  | 'current-value-humidity'
  | 'current-value-battery'
  | 'real-time-graph'
  | 'column-chart'
  | 'line-chart'
  | 'pie-chart'
  | 'heat-map'
  | 'expense-box-hour'
  | 'expense-box-day'
  | 'expense-box-week'
  | 'expense-box-month';

export type DashboardItem = {
  id: string;
  type: DashboardItemType;
  title: string;
  gridArea?: string;
  order?: number;
  width?: number;
  height?: number;
  visible: boolean;
}

export type DashboardLayout = {
  items: DashboardItem[];
  columns: number;
}
