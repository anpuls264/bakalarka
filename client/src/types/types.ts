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
    ledMode?: number;
    powerOnState?: number;
    autoOffTimer?: number;
    autoOnTimer?: number;
    powerLimit?: number;
    currentPower?: number;
    currentVoltage?: number;
    currentCurrent?: number;
    totalEnergy?: number;
}

export type DashboardItemType = 
  | 'control-panel'
  | 'current-value-voltage'
  | 'current-value-power'
  | 'current-value-current'
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
