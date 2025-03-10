import { mqttService } from './mqtt';

/**
 * Service for interacting with Shelly Plug S device via MQTT
 * Based on Shelly API documentation: https://shelly-api-docs.shelly.cloud/gen1/#shelly-plug-plugs
 */
class ShellyApiService {
    private static instance: ShellyApiService;
    private deviceId: string = 'shelly1'; // Default device ID
    private rpcTopic: string;
    private statusTopic: string;

    /**
     * Private constructor to enforce singleton pattern
     */
    private constructor() {
        this.rpcTopic = `${this.deviceId}/rpc`;
        this.statusTopic = `${this.deviceId}/status/switch:0`;
    }

    /**
     * Get singleton instance of ShellyApiService
     */
    public static getInstance(): ShellyApiService {
        if (!ShellyApiService.instance) {
            ShellyApiService.instance = new ShellyApiService();
        }
        return ShellyApiService.instance;
    }

    /**
     * Set the device ID
     * @param deviceId Device ID
     */
    public setDeviceId(deviceId: string): void {
        this.deviceId = deviceId;
        this.rpcTopic = `${this.deviceId}/rpc`;
        this.statusTopic = `${this.deviceId}/status/switch:0`;
    }

    /**
     * Generate a unique request ID
     */
    private generateRequestId(): number {
        return Math.floor(Math.random() * 10000);
    }

    /**
     * Toggle device power (turn on/off)
     * @param on Whether to turn the device on (true) or off (false)
     */
    public async togglePower(on: boolean): Promise<void> {
        const payload = JSON.stringify({
            id: this.generateRequestId(),
            src: "user_1",
            method: "Switch.Set",
            params: {
                id: 0,
                on: on
            }
        });
        
        await mqttService.publish(this.rpcTopic, payload, `power ${on ? 'on' : 'off'} command`);
    }

    /**
     * Set device brightness (dimmer)
     * @param brightness Brightness level (0-100)
     */
    public async setBrightness(brightness: number): Promise<void> {
        // Ensure brightness is within valid range
        const validBrightness = Math.max(0, Math.min(100, brightness));
        
        const payload = JSON.stringify({
            id: this.generateRequestId(),
            src: "user_1",
            method: "Switch.Set",
            params: {
                id: 0,
                brightness: validBrightness
            }
        });
        
        await mqttService.publish(this.rpcTopic, payload, `brightness adjustment command`);
    }

    /**
     * Toggle Bluetooth
     * @param enable Whether to enable (true) or disable (false) Bluetooth
     */
    public async toggleBluetooth(enable: boolean): Promise<void> {
        const payload = JSON.stringify({
            id: this.generateRequestId(),
            src: "user_1",
            method: "BLE.SetConfig",
            params: {
                config: {
                    enable: enable,
                    rpc: {
                        enable: true
                    }
                }
            }
        });
        
        await mqttService.publish(this.rpcTopic, payload, `bluetooth ${enable ? 'enable' : 'disable'} command`);
    }

    /**
     * Set device name
     * @param name New device name
     */
    public async setDeviceName(name: string): Promise<void> {
        const payload = JSON.stringify({
            id: this.generateRequestId(),
            src: "user_1",
            method: "Shelly.SetConfig",
            params: {
                config: {
                    name: name
                }
            }
        });
        
        await mqttService.publish(this.rpcTopic, payload, `set device name command`);
    }

    /**
     * Set LED mode
     * @param mode LED mode (0: off, 1: on when relay is off, 2: on when relay is on, 3: always on)
     */
    public async setLedMode(mode: number): Promise<void> {
        // Ensure mode is within valid range
        const validMode = Math.max(0, Math.min(3, mode));
        
        const payload = JSON.stringify({
            id: this.generateRequestId(),
            src: "user_1",
            method: "Switch.SetConfig",
            params: {
                id: 0,
                config: {
                    led_mode: validMode
                }
            }
        });
        
        await mqttService.publish(this.rpcTopic, payload, `set LED mode command`);
    }

    /**
     * Set power-on state
     * @param state Power-on state (0: off, 1: on, 2: restore last state)
     */
    public async setPowerOnState(state: number): Promise<void> {
        // Ensure state is within valid range
        const validState = Math.max(0, Math.min(2, state));
        
        const payload = JSON.stringify({
            id: this.generateRequestId(),
            src: "user_1",
            method: "Switch.SetConfig",
            params: {
                id: 0,
                config: {
                    initial_state: validState
                }
            }
        });
        
        await mqttService.publish(this.rpcTopic, payload, `set power-on state command`);
    }

    /**
     * Set auto-off timer
     * @param seconds Timer duration in seconds (0 to disable)
     */
    public async setAutoOffTimer(seconds: number): Promise<void> {
        const payload = JSON.stringify({
            id: this.generateRequestId(),
            src: "user_1",
            method: "Switch.SetConfig",
            params: {
                id: 0,
                config: {
                    auto_off: seconds > 0,
                    auto_off_delay: seconds
                }
            }
        });
        
        await mqttService.publish(this.rpcTopic, payload, `set auto-off timer command`);
    }

    /**
     * Set auto-on timer
     * @param seconds Timer duration in seconds (0 to disable)
     */
    public async setAutoOnTimer(seconds: number): Promise<void> {
        const payload = JSON.stringify({
            id: this.generateRequestId(),
            src: "user_1",
            method: "Switch.SetConfig",
            params: {
                id: 0,
                config: {
                    auto_on: seconds > 0,
                    auto_on_delay: seconds
                }
            }
        });
        
        await mqttService.publish(this.rpcTopic, payload, `set auto-on timer command`);
    }

    /**
     * Set power limit
     * @param watts Power limit in watts (0 to disable)
     */
    public async setPowerLimit(watts: number): Promise<void> {
        const payload = JSON.stringify({
            id: this.generateRequestId(),
            src: "user_1",
            method: "Switch.SetConfig",
            params: {
                id: 0,
                config: {
                    power_limit: watts,
                    power_limit_enabled: watts > 0
                }
            }
        });
        
        await mqttService.publish(this.rpcTopic, payload, `set power limit command`);
    }

    /**
     * Reboot the device
     */
    public async rebootDevice(): Promise<void> {
        const payload = JSON.stringify({
            id: this.generateRequestId(),
            src: "user_1",
            method: "Shelly.Reboot",
            params: {}
        });
        
        await mqttService.publish(this.rpcTopic, payload, `reboot device command`);
    }

    /**
     * Factory reset the device
     */
    public async factoryReset(): Promise<void> {
        const payload = JSON.stringify({
            id: this.generateRequestId(),
            src: "user_1",
            method: "Shelly.FactoryReset",
            params: {}
        });
        
        await mqttService.publish(this.rpcTopic, payload, `factory reset command`);
    }

    /**
     * Get device configuration
     */
    public async getDeviceConfig(): Promise<void> {
        const payload = JSON.stringify({
            id: this.generateRequestId(),
            src: "user_1",
            method: "Shelly.GetConfig",
            params: {}
        });
        
        await mqttService.publish(this.rpcTopic, payload, `get device config command`);
    }

    /**
     * Get device status
     */
    public async getDeviceStatus(): Promise<void> {
        const payload = JSON.stringify({
            id: this.generateRequestId(),
            src: "user_1",
            method: "Shelly.GetStatus",
            params: {}
        });
        
        await mqttService.publish(this.rpcTopic, payload, `get device status command`);
    }
}

// Export singleton instance
export const shellyApiService = ShellyApiService.getInstance();
