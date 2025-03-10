import dotenv from 'dotenv';
import { EventEmitter } from 'events';
import * as mqtt from 'mqtt';
import { MqttClient } from 'mqtt';

dotenv.config();

/**
 * MQTT Service for handling MQTT connections and messaging
 */
class MqttService extends EventEmitter {
    private client: any; // Using any to avoid type issues
    private static instance: MqttService;
    private isConnected: boolean = false;

    /**
     * Private constructor to enforce singleton pattern
     */
    private constructor() {
        super();
        
        const brokerOptions = {
            host: process.env.MQTT_HOST || '192.168.0.157',
            port: parseInt(process.env.MQTT_PORT || '1883'),
            username: process.env.MQTT_USERNAME || 'simatic',
            password: process.env.MQTT_PASSWORD || 'vitkovic1',
            protocol: 'mqtt',
            reconnectPeriod: 5000, // Reconnect every 5 seconds
        };

        this.client = mqtt.connect(brokerOptions);
        this.setupEventHandlers();
    }

    /**
     * Get singleton instance of MqttService
     */
    public static getInstance(): MqttService {
        if (!MqttService.instance) {
            MqttService.instance = new MqttService();
        }
        return MqttService.instance;
    }

    /**
     * Setup MQTT client event handlers
     */
    private setupEventHandlers(): void {
        this.client.on('connect', () => {
            console.log('Connected to MQTT broker');
            this.isConnected = true;
            this.emit('connected');
        });

        this.client.on('reconnect', () => {
            console.log('Attempting to reconnect to MQTT broker');
        });

        this.client.on('error', (error: any) => {
            console.error(`MQTT connection error: ${error.message}`);
            this.isConnected = false;
            this.emit('error', error);
        });

        this.client.on('message', (topic: string, message: Buffer) => {
            try {
                const messageStr = message.toString();
                console.log(`Received message on topic ${topic}: ${messageStr}`);
                this.emit('message', topic, messageStr);
            } catch (error) {
                console.error('Error processing MQTT message:', error);
            }
        });

        this.client.on('close', () => {
            console.log('MQTT connection closed');
            this.isConnected = false;
            this.emit('disconnected');
        });
    }

    /**
     * Subscribe to MQTT topics
     * @param topics Array of topics to subscribe to
     * @returns Promise that resolves when subscription is complete
     */
    public subscribe(topics: string[]): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('MQTT client not connected'));
                return;
            }

            this.client.subscribe(topics, (err: any) => {
                if (err) {
                    console.error(`MQTT subscription error: ${err.message}`);
                    reject(err);
                } else {
                    console.log(`Successfully subscribed to topics: ${topics.join(', ')}`);
                    resolve();
                }
            });
        });
    }

    /**
     * Publish a message to an MQTT topic
     * @param topic The topic to publish to
     * @param payload The message payload
     * @param description Optional description for logging
     * @returns Promise that resolves when publish is complete
     */
    public publish(topic: string, payload: string, description?: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('MQTT client not connected'));
                return;
            }

            this.client.publish(topic, payload, (err: any) => {
                if (err) {
                    const errorMsg = `Error publishing ${description || 'message'}: ${err.message}`;
                    console.error(errorMsg);
                    reject(new Error(errorMsg));
                } else {
                    console.log(`Successfully published ${description || 'message'} to ${topic}`);
                    resolve();
                }
            });
        });
    }

    /**
     * Check if MQTT client is connected
     */
    public isClientConnected(): boolean {
        return this.isConnected;
    }

    /**
     * Close the MQTT connection
     */
    public close(): Promise<void> {
        return new Promise((resolve) => {
            this.client.end(true, {}, () => {
                console.log('MQTT connection closed');
                this.isConnected = false;
                resolve();
            });
        });
    }
}

// Export singleton instance
export const mqttService = MqttService.getInstance();
