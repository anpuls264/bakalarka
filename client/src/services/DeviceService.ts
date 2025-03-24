import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { Device, DeviceState, DeviceConfig, DeviceCommand } from '../models/Device';
import { DeviceMetrics } from '../models/Metrics';

// Configuration for the service
export interface DeviceServiceConfig {
  serverUrl: string;
  apiPath: string;
}

// Default configuration
const DEFAULT_CONFIG: DeviceServiceConfig = {
  serverUrl: 'localhost:3000',
  apiPath: '/api/devices'
};

export class DeviceService {
  private socket: Socket;
  private devices: Map<string, Device> = new Map();
  private deviceListeners: Map<string, Set<(device: Device) => void>> = new Map();
  private metricsListeners: Set<(metrics: DeviceMetrics) => void> = new Set();
  private stateListeners: Set<(state: DeviceState) => void> = new Set();
  private baseUrl: string;
  private apiPath: string;
  private isConnected: boolean = false;

  constructor(config: Partial<DeviceServiceConfig> = {}) {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    this.baseUrl = `http://${fullConfig.serverUrl}`;
    this.apiPath = fullConfig.apiPath;
    
    // Initialize Socket.IO connection
    this.socket = io(fullConfig.serverUrl);
    
    // Setup socket event listeners
    this.setupSocketListeners();
    
    // Load all devices on initialization
    this.fetchAllDevices().catch(error => {
      console.error('Failed to fetch initial devices:', error);
    });
  }

  private setupSocketListeners(): void {
    // Connection status
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.isConnected = true;
      
      // Request initial device state
      this.socket.emit('getDeviceState');
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.isConnected = false;
    });
    
    // Device state updates
    this.socket.on('updateValues', (deviceState: DeviceState) => {
      console.log('Received device state update:', deviceState);
      
      // Notify state listeners
      this.stateListeners.forEach(listener => {
        listener(deviceState);
      });
      
      // Update device if it exists in our cache
      const deviceId = 'shelly1'; // Default device ID for backward compatibility
      const device = this.devices.get(deviceId);
      if (device) {
        const updatedDevice = { ...device, state: deviceState };
        this.updateDevice(updatedDevice);
      }
    });
    
    // New metrics data
    this.socket.on('newData', (metrics: DeviceMetrics) => {
      console.log('Received new metrics data:', metrics);
      
      // Notify all metrics listeners
      this.metricsListeners.forEach(listener => {
        listener(metrics);
      });
    });
    
    // Initial metrics data
    this.socket.on('initialData', (metrics: DeviceMetrics[]) => {
      console.log(`Received ${metrics.length} initial metrics`);
      
      // Notify all metrics listeners for each metric
      metrics.forEach(metric => {
        this.metricsListeners.forEach(listener => {
          listener(metric);
        });
      });
    });
  }

  private updateDevice(deviceData: Device): void {
    this.devices.set(deviceData.id, deviceData);
    
    // Notify device-specific listeners
    const deviceListeners = this.deviceListeners.get(deviceData.id);
    if (deviceListeners) {
      deviceListeners.forEach(listener => {
        listener(deviceData);
      });
    }
  }

  // API Methods

  /**
   * Fetch all devices from the server
   */
  async fetchAllDevices(): Promise<Device[]> {
    try {
      const response = await axios.get(`${this.baseUrl}${this.apiPath}`);
      const devices = response.data;
      
      // Update local cache
      for (const device of devices) {
        this.devices.set(device.id, device);
      }
      
      return devices;
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      return [];
    }
  }

  /**
   * Get a specific device by ID
   */
  async getDevice(id: string): Promise<Device | null> {
    // Return from cache if available
    if (this.devices.has(id)) {
      return this.devices.get(id) || null;
    }
    
    // Otherwise fetch from API
    try {
      const response = await axios.get(`${this.baseUrl}${this.apiPath}/${id}`);
      const device = response.data;
      this.devices.set(id, device);
      return device;
    } catch (error) {
      console.error(`Failed to fetch device ${id}:`, error);
      return null;
    }
  }

  /**
   * Execute a command on a device
   */
  async executeCommand(deviceId: string, command: string, params?: any[]): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}${this.apiPath}/${deviceId}/command`, {
        command,
        params
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to execute command ${command} on device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Get metrics for a specific device
   */
  async getDeviceMetrics(deviceId: string, options?: {
    startDate?: Date,
    endDate?: Date,
    limit?: number
  }): Promise<DeviceMetrics[]> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (options?.startDate) {
        params.append('startDate', options.startDate.toISOString());
      }
      if (options?.endDate) {
        params.append('endDate', options.endDate.toISOString());
      }
      if (options?.limit) {
        params.append('limit', options.limit.toString());
      }
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await axios.get(`${this.baseUrl}${this.apiPath}/${deviceId}/metrics${queryString}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch metrics for device ${deviceId}:`, error);
      return [];
    }
  }

  /**
   * Get aggregated metrics for a specific device
   */
  async getAggregatedMetrics(deviceId: string, timeRange: string = 'day', interval: number = 300000): Promise<DeviceMetrics[]> {
    try {
      const params = new URLSearchParams({
        timeRange,
        interval: interval.toString()
      });
      
      const response = await axios.get(
        `${this.baseUrl}${this.apiPath}/${deviceId}/metrics/aggregated?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch aggregated metrics for device ${deviceId}:`, error);
      return [];
    }
  }

  /**
   * Add a new device
   */
  async addDevice(name: string, type: string, mqttTopic: string, capabilities: string[] = []): Promise<Device | null> {
    try {
      const response = await axios.post(`${this.baseUrl}${this.apiPath}`, {
        id: `${type}-${Date.now()}`, // Generate unique ID
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

  /**
   * Update a device configuration
   */
  async updateDeviceConfig(id: string, updates: Partial<DeviceConfig>): Promise<Device | null> {
    try {
      const response = await axios.put(`${this.baseUrl}${this.apiPath}/${id}`, updates);
      
      const updatedDevice = response.data;
      this.devices.set(updatedDevice.id, updatedDevice);
      
      return updatedDevice;
    } catch (error) {
      console.error(`Failed to update device ${id}:`, error);
      return null;
    }
  }

  /**
   * Delete a device
   */
  async deleteDevice(id: string): Promise<boolean> {
    try {
      await axios.delete(`${this.baseUrl}${this.apiPath}/${id}`);
      
      this.devices.delete(id);
      this.deviceListeners.delete(id);
      
      return true;
    } catch (error) {
      console.error(`Failed to delete device ${id}:`, error);
      return false;
    }
  }

  // WebSocket Methods

  /**
   * Subscribe to device state updates
   */
  subscribeToDeviceState(callback: (state: DeviceState) => void): () => void {
    this.stateListeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.stateListeners.delete(callback);
    };
  }

  /**
   * Subscribe to device updates
   */
  subscribeToDeviceUpdates(deviceId: string, callback: (device: Device) => void): () => void {
    if (!this.deviceListeners.has(deviceId)) {
      this.deviceListeners.set(deviceId, new Set());
    }
    
    this.deviceListeners.get(deviceId)?.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.deviceListeners.get(deviceId)?.delete(callback);
    };
  }

  /**
   * Subscribe to metrics updates
   */
  subscribeToMetricsUpdates(callback: (metrics: DeviceMetrics) => void): () => void {
    this.metricsListeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.metricsListeners.delete(callback);
    };
  }

  // Device Control Methods

  /**
   * Toggle device power
   */
  togglePower(on?: boolean): void {
    if (on !== undefined) {
      // If a specific state is requested, use the API
      this.executeCommand('shelly1', 'togglePower', [on])
        .catch(error => console.error('Error toggling power:', error));
    } else {
      // Otherwise use the WebSocket for backward compatibility
      this.socket.emit('turnof/on');
    }
  }

  /**
   * Toggle Bluetooth
   */
  toggleBluetooth(enable?: boolean): void {
    if (enable !== undefined) {
      // If a specific state is requested, use the API
      this.executeCommand('shelly1', 'toggleBluetooth', [enable])
        .catch(error => console.error('Error toggling Bluetooth:', error));
    } else {
      // Otherwise use the WebSocket for backward compatibility
      this.socket.emit('bluetooth');
    }
  }

  /**
   * Set brightness
   */
  setBrightness(brightness: number): void {
    if (!this.isConnected) {
      console.error('Cannot set brightness: not connected to server');
      return;
    }

    console.log("kek");
    
    // Use WebSocket for backward compatibility
    this.socket.emit('brightness', brightness);
    
    // Also try the API for newer implementations
    this.executeCommand('shelly1', 'setBrightness', [brightness])
      .catch(error => {
        // Silently fail if the API method is not available
        if (error.response?.status !== 404) {
          console.error('Error setting brightness:', error);
        }
      });
  }

  /**
   * Get the Socket.IO instance for direct access if needed
   */
  getSocket(): Socket {
    return this.socket;
  }

  /**
   * Check if connected to the server
   */
  isSocketConnected(): boolean {
    return this.isConnected;
  }
}

// Export a singleton instance for use throughout the application
export const deviceService = new DeviceService();
