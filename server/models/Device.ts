import { EventEmitter } from 'events';

export interface DeviceConfig {
  id: string;
  name: string;
  type: string;
  mqttTopic: string;
  capabilities: string[];
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
      mqttTopic: config.mqttTopic
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

  getMqttTopic(): string {
    return this.config.mqttTopic;
  }

  getCapabilities(): string[] {
    return this.config.capabilities;
  }

  getState(): DeviceState {
    return { ...this.state };
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

  // Pomocná metoda pro publikování metrik
  protected publishMetrics(metrics: any): void {
    this.emit('metrics', {
      deviceId: this.config.id,
      timestamp: new Date().toISOString(),
      ...metrics
    });
  }
}
