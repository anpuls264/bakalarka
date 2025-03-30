import { EventEmitter } from 'events';

export interface DeviceConfig {
  id: string;
  name: string;
  type: string;
  mqttPrefix: string;
}

export interface DeviceState {
  [key: string]: any;
}

export interface DeviceCommands {
  [key: string]: (...args: any[]) => any;
}

export abstract class Device extends EventEmitter {
  protected config: DeviceConfig;
  protected state: DeviceState = {};

  constructor(config: DeviceConfig) {
    super();
    this.config = config;
    this.state = {
      deviceName: config.name,
      mqttTopic: config.mqttPrefix,
      bluetoothEnable: false,
      wifiName: null
    };
  }

  // Základní gettery
  getId(): string {
    return this.config.id;
  }

  getName(): string {
    return this.config.name;
  }

  getType(): string {
    return this.config.type;
  }

  getMqttPrefix(): string {
    return this.config.mqttPrefix;
  }

  getState(): DeviceState {
    return { ...this.state };
  }

  // Getter pro stav Bluetooth
  getBluetoothStatus(): boolean {
    return this.state.bluetoothEnable;
  }

  // Getter pro WiFi připojení
  getWifiConnection(): string | null {
    return this.state.wifiName;
  }

  // Abstraktní metody, které musí implementovat konkrétní zařízení
  abstract handleMessage(topic: string, message: Buffer): void;
  abstract getCommands(): DeviceCommands;
  abstract publishInitialMessages(): void;

  // Pomocná metoda pro aktualizaci stavu
  protected updateState(updates: DeviceState): void {
    this.state = { ...this.state, ...updates };
    this.emit('stateChanged', this);
  }

  // Pomocná metoda pro publikování MQTT zpráv
  protected publishMqttMessage(topic: string, payload: string): void {
    this.emit('mqttPublish', topic, payload);
  }

  protected publishElectricalMetrics(metrics: any): void {
    this.emit('electricalMetrics', {
      deviceId: this.config.id,
      timestamp: new Date().toISOString(),
      ...metrics
    });
  }
  
  protected publishEnvironmentalMetrics(metrics: any): void {
    console.log("Tady taky");
    this.emit('environmentalMetrics', {
      deviceId: this.config.id,
      timestamp: new Date().toISOString(),
      ...metrics
    });
  }
}

