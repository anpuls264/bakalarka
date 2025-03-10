// Shared interfaces for the server application

// Device metrics data from Shelly device
export interface ShellyData {
    apower: number;
    voltage: number;
    current: number;
    aenergy: { 
        total: number 
    };
    result?: {
        output: boolean;
    };
}

// Device configuration data
export interface ShellyConfig {
    result: {
        wifi: {
            sta: {
                ssid: string;
            }
        };
        ble: {
            enable: boolean;
        };
        mqtt: {
            enable: boolean;
        };
    };
}

// Device state for client updates
export interface DeviceState {
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

// Database item interface
export interface Item {
    id: number;
    timestamp: string;
    apower: number;
    voltage: number;
    current: number;
    total: number;
}

// SQLite callback function interface with lastID property
export interface SQLiteRunCallback {
    lastID: number;
}
