import { EventEmitter } from 'events';
import { Device, DeviceConfig, DeviceCommands, DeviceState } from '../models/Device';
import { ShellyPlugS } from '../models/ShellyPlugS';
import { ShellyHT } from '../models/ShellyHT';

export class DeviceManager extends EventEmitter {
  private devices: Map<string, Device> = new Map();
  private deviceConfigs: DeviceConfig[] = [];

  constructor() {
    super();
  }

  loadDevices(configs: DeviceConfig[]): void {
    this.deviceConfigs = configs;
    
    for (const config of configs) {
      this.addDevice(config);
    }
  }

  addDevice(config: DeviceConfig): Device | null {
    let device: Device | null = null;
    
    switch (config.type) {
      case 'shelly-plug-s':
        device = new ShellyPlugS(config);
        break;
      case 'shelly-ht':
        device = new ShellyHT(config);
        break;
      default:
        console.error(`Unknown device type: ${config.type}`);
        return null;
    }
    
    // Set up event listeners for the device
    device.on('stateChanged', (updatedDevice: Device) => {
      this.emit('deviceStateChanged', updatedDevice);
    });
    
    device.on('electricalMetrics', (metrics) => {
      this.emit('electricalMetrics', metrics);
    });
    
    device.on('environmentalMetrics', (metrics) => {
      this.emit('environmentalMetrics', metrics);
    });
    
    device.on('mqttPublish', (topic: string, payload: string) => {
      this.emit('mqttPublish', topic, payload);
    });
    
    this.devices.set(config.id, device);
    this.emit('deviceAdded', device);
    
    return device;
  }

  getDevice(id: string): Device | undefined {
    return this.devices.get(id);
  }

  getAllDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  getDevicesByType(type: string): Device[] {
    return this.getAllDevices().filter(device => device.getType() === type);
  }

  removeDevice(id: string): boolean {
    const device = this.devices.get(id);
    
    if (!device) {
      return false;
    }
    
    // Remove all listeners
    device.removeAllListeners();
    
    // Remove from map
    this.devices.delete(id);
    
    this.emit('deviceRemoved', id);
    
    return true;
  }

  handleMqttMessage(topic: string, message: Buffer): void {
    // Check if this is a device-specific message
    for (const device of this.devices.values()) {
      // Check if the topic matches this device's topic
      if (topic.startsWith(device.getMqttPrefix()) || topic === 'user_1/rpc') {
        device.handleMessage(topic, message);
      }
    }
  }

  // Initialize all devices by sending initial MQTT messages
  initializeDevices(): void {
    for (const device of this.devices.values()) {
      device.publishInitialMessages();
    }
  }

  // Get device configurations
  getDeviceConfigs(): DeviceConfig[] {
    return [...this.deviceConfigs];
  }

  // Update a device configuration
  updateDeviceConfig(id: string, updates: Partial<DeviceConfig>): boolean {
    const configIndex = this.deviceConfigs.findIndex(config => config.id === id);
    
    if (configIndex === -1) {
      return false;
    }
    
    // Create a new config object with the updates
    this.deviceConfigs[configIndex] = { 
      ...this.deviceConfigs[configIndex], 
      ...updates 
    };
    
    // If the device exists, recreate it with the new config
    const existingDevice = this.devices.get(id);
    
    if (existingDevice) {
      this.removeDevice(id);
      this.addDevice(this.deviceConfigs[configIndex]);
    }
    
    this.emit('deviceConfigUpdated', this.deviceConfigs[configIndex]);
    
    return true;
  }

  // Get device status (Bluetooth and WiFi)
  getDeviceStatus(id: string): { bluetoothEnabled: boolean, wifiConnection: string | null } | null {
    const device = this.getDevice(id);
    
    if (!device) {
      return null;
    }
    
    const state = device.getState();
    
    return {
      bluetoothEnabled: state.bluetoothEnable || false,
      wifiConnection: state.wifiName || null
    };
  }

  // Request refresh of device status
  refreshDeviceStatus(id: string): boolean {
    const device = this.getDevice(id);
    
    if (!device) {
      return false;
    }
    
    const commands = device.getCommands();
    
    if (commands.getDeviceStatus) {
      commands.getDeviceStatus();
      return true;
    }
    
    return false;
  }
}