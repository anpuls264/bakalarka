import * as mqtt from 'mqtt';
import { DeviceManager } from './DeviceManager';

export class MqttService {
  private client: mqtt.MqttClient;
  private deviceManager: DeviceManager;
  private isConnected: boolean = false;
  private pendingMessages: Array<{ topic: string, payload: string }> = [];

  constructor(brokerOptions: mqtt.IClientOptions, deviceManager: DeviceManager) {
    this.deviceManager = deviceManager;
    this.client = mqtt.connect(brokerOptions);
    
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      console.log('Connected to MQTT broker');
      this.isConnected = true;
      this.subscribeToTopics();
      this.processPendingMessages();
      
      // Initialize devices after connection
      setTimeout(() => {
        this.deviceManager.initializeDevices();
      }, 1000);
    });

    this.client.on('message', (topic: string, message: Buffer) => {
      console.log(`Received message on topic ${topic}`);
      this.deviceManager.handleMqttMessage(topic, message);
    });

    this.client.on('error', (error: Error) => {
      console.error('MQTT connection error:', error);
      this.isConnected = false;
    });

    this.client.on('reconnect', () => {
      console.log('MQTT client reconnecting');
    });

    this.client.on('close', () => {
      console.log('MQTT connection closed');
      this.isConnected = false;
    });

    // Listen for publish requests from devices
    this.deviceManager.on('mqttPublish', (topic: string, payload: string) => {
      this.publish(topic, payload);
    });
  }

  private subscribeToTopics(): void {
    // Dynamically subscribe to topics for all devices
    const devices = this.deviceManager.getAllDevices();
    
    // Common topics
    this.client.subscribe('user_1/rpc', (err: Error | null) => {
      if (err) {
        console.error('Error subscribing to user_1/rpc:', err);
      } else {
        console.log('Subscribed to user_1/rpc');
      }
    });
    
    // Device-specific topics
    for (const device of devices) {
      const baseTopic = `${device.getMqttTopic()}/status/#`;
      
      this.client.subscribe(baseTopic, (err: Error | null) => {
        if (err) {
          console.error(`Error subscribing to ${baseTopic}:`, err);
        } else {
          console.log(`Subscribed to ${baseTopic}`);
        }
      });
    }
  }

  private processPendingMessages(): void {
    if (this.pendingMessages.length > 0) {
      console.log(`Processing ${this.pendingMessages.length} pending messages`);
      
      for (const message of this.pendingMessages) {
        this.client.publish(message.topic, message.payload, (error) => {
          if (error) {
            console.error(`Error publishing pending message to ${message.topic}:`, error);
          } else {
            console.log(`Published pending message to ${message.topic}`);
          }
        });
      }
      
      this.pendingMessages = [];
    }
  }

  publish(topic: string, payload: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        console.log(`MQTT not connected, queueing message for ${topic}`);
        this.pendingMessages.push({ topic, payload });
        resolve();
        return;
      }
      
      this.client.publish(topic, payload, (error) => {
        if (error) {
          console.error(`Error publishing to ${topic}:`, error);
          reject(error);
        } else {
          console.log(`Published to ${topic}`);
          resolve();
        }
      });
    });
  }

  // Subscribe to a new topic (e.g., when a new device is added)
  subscribeToTopic(topic: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('MQTT client not connected'));
        return;
      }
      
      this.client.subscribe(topic, (error: Error | null) => {
        if (error) {
          console.error(`Error subscribing to ${topic}:`, error);
          reject(error);
        } else {
          console.log(`Subscribed to ${topic}`);
          resolve();
        }
      });
    });
  }

  // Unsubscribe from a topic (e.g., when a device is removed)
  unsubscribeFromTopic(topic: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('MQTT client not connected'));
        return;
      }
      
      this.client.unsubscribe(topic, (error) => {
        if (error) {
          console.error(`Error unsubscribing from ${topic}:`, error);
          reject(error);
        } else {
          console.log(`Unsubscribed from ${topic}`);
          resolve();
        }
      });
    });
  }

  // Close the MQTT connection
  close(): Promise<void> {
    return new Promise((resolve) => {
      this.client.end(false, () => {
        console.log('MQTT connection closed');
        this.isConnected = false;
        resolve();
      });
    });
  }
}
