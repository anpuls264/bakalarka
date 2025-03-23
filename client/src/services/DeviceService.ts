import axios from 'axios';
import { io, Socket } from 'socket.io-client';

export interface Device {
  id: string;
  name: string;
  type: string;
  state: any;
}

export interface DeviceMetrics {
  id?: number;
  deviceId: string;
  timestamp: string;
  apower?: number;
  voltage?: number;
  current?: number;
  total?: number;
  temperature?: number;
  humidity?: number;
}

export class DeviceService {
  private socket: Socket;
  private devices: Map<string, Device> = new Map();
  private listeners: Map<string, Set<(device: Device) => void>> = new Map();
  private metricsListeners: Set<(metrics: DeviceMetrics) => void> = new Set();
  private baseUrl: string;

  constructor(serverUrl: string = '13.61.175.177:3000') {
    this.baseUrl = `http://${serverUrl}`;
    this.socket = io(serverUrl);
    
    this.setupSocketListeners();
    
    // Načtení všech zařízení při inicializaci
    this.fetchAllDevices();
  }

  private setupSocketListeners(): void {
    // Aktualizace stavu zařízení
    this.socket.on('updateValues', (deviceState: any) => {
      // Zpětná kompatibilita - předpokládáme, že jde o výchozí zařízení
      const device = this.devices.get('shelly1');
      if (device) {
        const updatedDevice = { ...device, state: deviceState };
        this.updateDevice(updatedDevice);
      }
    });
    
    // Nová data z metriky
    this.socket.on('newData', (metrics: DeviceMetrics) => {
      // Notifikace všech posluchačů
      this.metricsListeners.forEach(listener => {
        listener(metrics);
      });
    });
    
    // Počáteční data
    this.socket.on('initialData', (metrics: DeviceMetrics[]) => {
      // Notifikace všech posluchačů pro každou metriku
      metrics.forEach(metric => {
        this.metricsListeners.forEach(listener => {
          listener(metric);
        });
      });
    });
  }

  private updateDevice(deviceData: Device): void {
    this.devices.set(deviceData.id, deviceData);
    
    // Notifikace všech posluchačů
    const deviceListeners = this.listeners.get(deviceData.id);
    if (deviceListeners) {
      deviceListeners.forEach(listener => {
        listener(deviceData);
      });
    }
  }

  async fetchAllDevices(): Promise<Device[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/devices`);
      const devices = response.data;
      
      for (const device of devices) {
        this.devices.set(device.id, device);
      }
      
      return devices;
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      return [];
    }
  }

  async getDevice(id: string): Promise<Device | null> {
    // Pokud máme zařízení v cache, vrátíme ho
    if (this.devices.has(id)) {
      return this.devices.get(id) || null;
    }
    
    // Jinak načteme z API
    try {
      const response = await axios.get(`${this.baseUrl}/api/devices/${id}`);
      const device = response.data;
      this.devices.set(id, device);
      return device;
    } catch (error) {
      console.error(`Failed to fetch device ${id}:`, error);
      return null;
    }
  }

  async executeCommand(deviceId: string, command: string, params?: any[]): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/devices/${deviceId}/command`, {
        command,
        params
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to execute command ${command} on device ${deviceId}:`, error);
      throw error;
    }
  }

  subscribeToDeviceUpdates(deviceId: string, callback: (device: Device) => void): () => void {
    if (!this.listeners.has(deviceId)) {
      this.listeners.set(deviceId, new Set());
    }
    
    this.listeners.get(deviceId)?.add(callback);
    
    // Vrátíme funkci pro odhlášení
    return () => {
      this.listeners.get(deviceId)?.delete(callback);
    };
  }

  subscribeToMetricsUpdates(callback: (metrics: DeviceMetrics) => void): () => void {
    this.metricsListeners.add(callback);
    
    // Vrátíme funkci pro odhlášení
    return () => {
      this.metricsListeners.delete(callback);
    };
  }

  async getDeviceMetrics(deviceId: string): Promise<DeviceMetrics[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/devices/${deviceId}/metrics`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch metrics for device ${deviceId}:`, error);
      return [];
    }
  }

  // Zpětná kompatibilita pro stávající komponenty
  togglePower(): void {
    this.socket.emit('turnof/on');
  }

  toggleBluetooth(): void {
    this.socket.emit('bluetooth');
  }

  setBrightness(brightness: number): void {
    this.socket.emit('brightness', brightness);
  }

  // Metody pro správu zařízení
  async addDevice(name: string, type: string, mqttTopic: string, capabilities: string[] = []): Promise<Device | null> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/devices`, {
        id: `${type}-${Date.now()}`, // Generovat unikátní ID
        name,
        type,
        mqttTopic,
        capabilities
      });
      
      const newDevice = response.data;
      this.devices.set(newDevice.id, newDevice);
      
      return newDevice;
    } catch (error) {
      console.error('Failed to add device:', error);
      return null;
    }
  }

  async updateDeviceConfig(id: string, updates: { name?: string, mqttTopic?: string, capabilities?: string[] }): Promise<Device | null> {
    try {
      const response = await axios.put(`${this.baseUrl}/api/devices/${id}`, updates);
      
      const updatedDevice = response.data;
      this.devices.set(updatedDevice.id, updatedDevice);
      
      return updatedDevice;
    } catch (error) {
      console.error(`Failed to update device ${id}:`, error);
      return null;
    }
  }

  async deleteDevice(id: string): Promise<boolean> {
    try {
      await axios.delete(`${this.baseUrl}/api/devices/${id}`);
      
      this.devices.delete(id);
      this.listeners.delete(id);
      
      return true;
    } catch (error) {
      console.error(`Failed to delete device ${id}:`, error);
      return false;
    }
  }
}

// Exportovat instanci služby pro použití v celé aplikaci
export const deviceService = new DeviceService();
