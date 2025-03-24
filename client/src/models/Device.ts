export interface DeviceConfig {
  id: string;
  name: string;
  type: string;
  mqttTopic: string;
  capabilities: string[];
}

export interface DeviceState {
  deviceName?: string;
  mqttTopic?: string;
  wifiName: string | null;
  deviceTurnOnOff: boolean;
  bluetoothEnable: boolean;
  mqttEnable: boolean;
  ledMode?: number;
  powerOnState?: number;
  autoOffTimer?: number;
  autoOnTimer?: number;
  powerLimit?: number;
  currentPower?: number;
  currentVoltage?: number;
  currentCurrent?: number;
  totalEnergy?: number;
  brightness?: number;
  [key: string]: any; // Allow for other properties
}

export interface Device {
  id: string;
  name: string;
  type: string;
  state: DeviceState;
}

export interface DeviceCommand {
  command: string;
  params?: any[];
}
