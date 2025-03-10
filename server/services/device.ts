import { ShellyData, ShellyConfig, DeviceState } from '../types/interfaces';
import { mqttService } from './mqtt';
import { SocketService } from './socket';
import { shellyApiService } from './shellyApi';
import { createItem } from '../repositories/deviceRepository';

/**
 * Service for managing device state and operations
 */
class DeviceService {
    private static instance: DeviceService;
    
    // Device state
    private lastTotalValue: number | null = null;
    private deviceTurnOnOff: boolean = false;
    private wifiName: string | null = null;
    private bluetoothEnable: boolean = false;
    private mqttEnable: boolean = false;
    private deviceName: string = 'Shelly Plug S';
    private ledMode: number = 0;
    private powerOnState: number = 0;
    private autoOffTimer: number = 0;
    private autoOnTimer: number = 0;
    private powerLimit: number = 0;
    private currentPower: number = 0;
    private currentVoltage: number = 0;
    private currentCurrent: number = 0;
    private totalEnergy: number = 0;

    /**
     * Private constructor to enforce singleton pattern
     */
    private constructor() {
        // Initialize device service
    }

    /**
     * Get singleton instance of DeviceService
     */
    public static getInstance(): DeviceService {
        if (!DeviceService.instance) {
            DeviceService.instance = new DeviceService();
        }
        return DeviceService.instance;
    }

    /**
     * Initialize MQTT message handlers
     */
    public initializeMqttHandlers(): void {
        // Subscribe to MQTT topics when connected
        mqttService.on('connected', () => {
            this.subscribeToTopics();
            this.publishInitialMessages();
        });

        // Handle incoming MQTT messages
        mqttService.on('message', (topic: string, messageStr: string) => {
            this.handleMqttMessage(topic, messageStr);
        });
    }

    /**
     * Subscribe to relevant MQTT topics
     */
    private subscribeToTopics(): void {
        mqttService.subscribe(['shelly1/status/switch:0', 'user_1/rpc'])
            .catch(error => {
                console.error(`Failed to subscribe to MQTT topics: ${error.message}`);
            });
    }

    /**
     * Publish initial configuration request messages to the device
     */
    private publishInitialMessages(): void {
        const initialPayloads = [
            '{"id": 123, "src": "user_1", "method": "Shelly.GetConfig"}',
        ];
      
        initialPayloads.forEach((payload, index) => {
            console.log(payload);
            mqttService.publish(
                'shelly1/rpc', 
                payload, 
                `initial MQTT message ${index + 1}`
            ).catch(error => {
                console.error(`Failed to publish initial message: ${error.message}`);
            });
        });
    }

    /**
     * Handle incoming MQTT messages
     * @param topic MQTT topic
     * @param messageStr Message string
     */
    private handleMqttMessage(topic: string, messageStr: string): void {
        try {
            if (topic === 'shelly1/status/switch:0') {
                // Handle device status updates
                const incomingData: ShellyData = JSON.parse(messageStr);
                console.log(incomingData);
                
                // Update current metrics
                this.currentPower = incomingData.apower;
                this.currentVoltage = incomingData.voltage;
                this.currentCurrent = incomingData.current;
                this.totalEnergy = incomingData.aenergy.total;
                
                // Save metrics data
                this.saveData(incomingData);
                
                // Update device state if available
                if (incomingData.result && incomingData.result.output !== undefined) {
                    this.deviceTurnOnOff = incomingData.result.output;
                }
                
                this.updateDeviceState();
            } else if (topic === 'user_1/rpc') {
                // Handle configuration data
                const data = JSON.parse(messageStr);
                
                // Check if it's a config response
                if (data.method === 'Shelly.GetConfig' && data.result) {
                    // Update device configuration state
                    if (data.result.wifi && data.result.wifi.sta) {
                        this.wifiName = data.result.wifi.sta.ssid;
                    }
                    
                    if (data.result.ble) {
                        this.bluetoothEnable = data.result.ble.enable;
                    }
                    
                    if (data.result.mqtt) {
                        this.mqttEnable = data.result.mqtt.enable;
                    }
                    
                    if (data.result.name) {
                        this.deviceName = data.result.name;
                    }
                    
                    // Check for switch config
                    if (data.result.switch && data.result.switch[0]) {
                        const switchConfig = data.result.switch[0];
                        
                        if (switchConfig.led_mode !== undefined) {
                            this.ledMode = switchConfig.led_mode;
                        }
                        
                        if (switchConfig.initial_state !== undefined) {
                            this.powerOnState = switchConfig.initial_state;
                        }
                        
                        if (switchConfig.auto_off !== undefined) {
                            this.autoOffTimer = switchConfig.auto_off_delay || 0;
                        }
                        
                        if (switchConfig.auto_on !== undefined) {
                            this.autoOnTimer = switchConfig.auto_on_delay || 0;
                        }
                        
                        if (switchConfig.power_limit !== undefined) {
                            this.powerLimit = switchConfig.power_limit;
                        }
                    }
                }
                
                // Notify clients of updated values
                this.updateDeviceState();
            }
        } catch (error: any) {
            console.error(`Error processing MQTT message: ${error.message}`);
        }
    }

    /**
     * Saves device metrics data to the database and emits the new data to connected clients
     * @param data The device metrics data to save
     */
    private async saveData(data: ShellyData): Promise<void> {
        const timestamp = new Date().toISOString();
        
        // Handle energy counter reset
        if (this.lastTotalValue !== null && data.aenergy.total < this.lastTotalValue) {
            data.aenergy.total += this.lastTotalValue;
        }

        try {
            const result = await createItem(
                timestamp, 
                data.apower, 
                data.voltage, 
                data.current, 
                data.aenergy.total
            );
            console.log(`Item is added, Id: ${result.id}`);

            this.lastTotalValue = data.aenergy.total;

            // Emit new data to all connected clients
            try {
                const socketService = SocketService.getInstance();
                socketService.broadcastNewData(result);
            } catch (error) {
                console.warn('Socket service not initialized yet, skipping broadcast');
            }
        } catch (error: any) {
            console.error(`Error adding item: ${error.message}`);
        }
    }

    /**
     * Update device state for all connected clients
     */
    private updateDeviceState(): void {
        try {
            const socketService = SocketService.getInstance();
            socketService.updateDeviceState(this.getDeviceState());
        } catch (error) {
            console.warn('Socket service not initialized yet, skipping state update');
        }
    }

    /**
     * Get current device state for client updates
     */
    public getDeviceState(): DeviceState {
        return {
            wifiName: this.wifiName,
            deviceTurnOnOff: this.deviceTurnOnOff,
            bluetoothEnable: this.bluetoothEnable,
            mqttEnable: this.mqttEnable,
            deviceName: this.deviceName,
            ledMode: this.ledMode,
            powerOnState: this.powerOnState,
            autoOffTimer: this.autoOffTimer,
            autoOnTimer: this.autoOnTimer,
            powerLimit: this.powerLimit,
            currentPower: this.currentPower,
            currentVoltage: this.currentVoltage,
            currentCurrent: this.currentCurrent,
            totalEnergy: this.totalEnergy
        };
    }

    /**
     * Toggle device power
     */
    public async togglePower(): Promise<void> {
        console.log(`Current device state: ${this.deviceTurnOnOff}`);
        this.deviceTurnOnOff = !this.deviceTurnOnOff;
        
        try {
            await shellyApiService.togglePower(this.deviceTurnOnOff);
        } catch (error: any) {
            console.error(`Failed to toggle device power: ${error.message}`);
        }
    }

    /**
     * Set device brightness
     * @param brightness Brightness level
     */
    public async setBrightness(brightness: number): Promise<void> {
        console.log(`Setting brightness to ${brightness}`);
        
        try {
            await shellyApiService.setBrightness(brightness);
        } catch (error: any) {
            console.error(`Failed to set brightness: ${error.message}`);
        }
    }

    /**
     * Toggle bluetooth
     */
    public async toggleBluetooth(): Promise<void> {
        console.log(`Current bluetooth state: ${this.bluetoothEnable}`);
        this.bluetoothEnable = !this.bluetoothEnable;
        
        try {
            await shellyApiService.toggleBluetooth(this.bluetoothEnable);
        } catch (error: any) {
            console.error(`Failed to toggle bluetooth: ${error.message}`);
        }
    }

    /**
     * Set device name
     * @param name New device name
     */
    public async setDeviceName(name: string): Promise<void> {
        try {
            await shellyApiService.setDeviceName(name);
        } catch (error: any) {
            console.error(`Failed to set device name: ${error.message}`);
        }
    }

    /**
     * Set LED mode
     * @param mode LED mode (0: off, 1: on when relay is off, 2: on when relay is on, 3: always on)
     */
    public async setLedMode(mode: number): Promise<void> {
        try {
            await shellyApiService.setLedMode(mode);
        } catch (error: any) {
            console.error(`Failed to set LED mode: ${error.message}`);
        }
    }

    /**
     * Set power-on state
     * @param state Power-on state (0: off, 1: on, 2: restore last state)
     */
    public async setPowerOnState(state: number): Promise<void> {
        try {
            await shellyApiService.setPowerOnState(state);
        } catch (error: any) {
            console.error(`Failed to set power-on state: ${error.message}`);
        }
    }

    /**
     * Set auto-off timer
     * @param seconds Timer duration in seconds (0 to disable)
     */
    public async setAutoOffTimer(seconds: number): Promise<void> {
        try {
            await shellyApiService.setAutoOffTimer(seconds);
        } catch (error: any) {
            console.error(`Failed to set auto-off timer: ${error.message}`);
        }
    }

    /**
     * Set auto-on timer
     * @param seconds Timer duration in seconds (0 to disable)
     */
    public async setAutoOnTimer(seconds: number): Promise<void> {
        try {
            await shellyApiService.setAutoOnTimer(seconds);
        } catch (error: any) {
            console.error(`Failed to set auto-on timer: ${error.message}`);
        }
    }

    /**
     * Set power limit
     * @param watts Power limit in watts (0 to disable)
     */
    public async setPowerLimit(watts: number): Promise<void> {
        try {
            await shellyApiService.setPowerLimit(watts);
        } catch (error: any) {
            console.error(`Failed to set power limit: ${error.message}`);
        }
    }

    /**
     * Reboot the device
     */
    public async rebootDevice(): Promise<void> {
        try {
            await shellyApiService.rebootDevice();
        } catch (error: any) {
            console.error(`Failed to reboot device: ${error.message}`);
        }
    }

    /**
     * Factory reset the device
     */
    public async factoryReset(): Promise<void> {
        try {
            await shellyApiService.factoryReset();
        } catch (error: any) {
            console.error(`Failed to factory reset device: ${error.message}`);
        }
    }

    /**
     * Get device configuration
     */
    public async getDeviceConfig(): Promise<void> {
        try {
            await shellyApiService.getDeviceConfig();
        } catch (error: any) {
            console.error(`Failed to get device config: ${error.message}`);
        }
    }

    /**
     * Get device status
     */
    public async getDeviceStatus(): Promise<void> {
        try {
            await shellyApiService.getDeviceStatus();
        } catch (error: any) {
            console.error(`Failed to get device status: ${error.message}`);
        }
    }
}

export const deviceService = DeviceService.getInstance();
