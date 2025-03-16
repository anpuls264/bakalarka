import { mqttClient } from "./mqtt";
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { createItem, readItems } from "./crud";

// Device state management
interface DeviceState {
    wifiName: string | null;
    deviceTurnOnOff: boolean;
    bluetoothEnable: boolean;
    mqttEnable: boolean;
    deviceName?: string;
    currentPower?: number;
    currentVoltage?: number;
    currentCurrent?: number;
    totalEnergy?: number;
}

let lastTotalValue: number | null = null;
let deviceState: DeviceState = {
    wifiName: null,
    deviceTurnOnOff: true,
    bluetoothEnable: false,
    mqttEnable: false
};

// Update device state and notify all clients
const updateDeviceState = (updates: Partial<DeviceState>) => {
    deviceState = { ...deviceState, ...updates };
    io.emit('updateValues', deviceState);
    console.log('Device state updated:', deviceState);
};

// Save device data to database and emit to clients
const saveData = async (data: { apower: number, voltage: number, current: number, aenergy: { total: number } }): Promise<void> => {
    const timestamp = new Date().toISOString();
    
    if (lastTotalValue !== null && data.aenergy.total < lastTotalValue) {
        data.aenergy.total += lastTotalValue;
    }

    try {
        const result = await createItem(timestamp, data.apower, data.voltage, data.current, data.aenergy.total);
        console.log(`Item is added, Id: ${result.id}`);

        lastTotalValue = data.aenergy.total;
        
        // Update current values in device state
        updateDeviceState({
            currentPower: data.apower,
            currentVoltage: data.voltage,
            currentCurrent: data.current,
            totalEnergy: data.aenergy.total
        });

        io.emit('newData', result);
    } catch (error : any) {
        console.error(`Error adding item: ${error.message}`);
    }
};

// Publish MQTT messages to get device configuration
const publishInitialMessages = () => {
    const initialPayloads = [
      '{"id": 123, "src": "user_1", "method": "Shelly.GetConfig"}',
      '{"id": 130, "src": "user_1", "method": "Wifi.GetStatus"}',
      '{"id": 131, "src": "user_1", "method": "Wifi.GetConfig"}'
    ];
  
    initialPayloads.forEach((payload, index) => {
      mqttClient.publish('shelly1/rpc', payload, (error: any) => {
        console.log(payload);
        if (error) {
          console.error(`Error publishing initial MQTT message ${index + 1}: ${error.message}`);
        } else {
          console.log(`Initial MQTT message ${index + 1} published to shelly1/rpc`);
        }
      });
    });
};

// Toggle device power state via MQTT
const toggleDevicePower = (turnOn: boolean) => {
    const payload = `{"id": 123, "src": "user_1", "method": "Switch.Set", "params":{"id":0,"on":${turnOn}}}`;
    
    mqttClient.publish('shelly1/rpc', payload, (error: any) => {
        if (error) {
            console.error(`Error publishing power toggle MQTT message: ${error.message}`);
        } else {
            console.log(`Power toggle MQTT message published to shelly1/rpc, turning device ${turnOn ? 'ON' : 'OFF'}`);
            // Update state immediately for better UX, will be corrected if actual state is different
            updateDeviceState({ deviceTurnOnOff: turnOn });
        }
    });
};

// Toggle bluetooth state via MQTT
const toggleBluetooth = (enable: boolean) => {
    const payload = `{"id": 124, "src": "user_1", "method": "Bluetooth.SetConfig", "params":{"enable":${enable}}}`;
    
    mqttClient.publish('shelly1/rpc', payload, (error: any) => {
        if (error) {
            console.error(`Error publishing bluetooth toggle MQTT message: ${error.message}`);
        } else {
            console.log(`Bluetooth toggle MQTT message published to shelly1/rpc, setting bluetooth ${enable ? 'ON' : 'OFF'}`);
            // Update state immediately for better UX, will be corrected if actual state is different
            updateDeviceState({ bluetoothEnable: enable });
        }
    });
};

dotenv.config();

const app = express();

app.use(express.json());

// API endpoints
app.get('/items', (req, res) => {
    readItems((err, rows) => {
        if (err)
            res.status(500).send(err.message);
        else
            res.status(200).json(rows);
    });
});

// Get current device state
app.get('/device/state', (req, res) => {
    res.status(200).json(deviceState);
});

// WiFi endpoints
app.get('/wifi/scan', (req, res) => {
    // Send MQTT command to scan for WiFi networks
    const payload = `{"id": 126, "src": "user_1", "method": "Wifi.Scan"}`;
    
    // Create a promise to handle the response
    const scanPromise = new Promise<any>((resolve, reject) => {
        // Set a timeout to reject the promise after 10 seconds
        const timeoutId = setTimeout(() => {
            reject(new Error('WiFi scan timed out'));
        }, 10000);
        
        // Set up a one-time event handler for the scan response
        const handleScanResponse = (topic: string, message: Buffer) => {
            if (topic === 'user_1/rpc') {
                try {
                    const data = JSON.parse(message.toString());
                    
                    // Check if this is the scan response
                    if (data.id === 126 && data.result && data.result.results) {
                        // Clear the timeout
                        clearTimeout(timeoutId);
                        
                        // Remove this event handler
                        mqttClient.removeListener('message', handleScanResponse);
                        
                        // Resolve with the scan results
                        resolve(data.result.results);
                    }
                } catch (error) {
                    console.error('Error parsing scan response:', error);
                }
            }
        };
        
        // Add the event handler
        mqttClient.on('message', handleScanResponse);
    });
    
    // Send the scan command
    mqttClient.publish('shelly1/rpc', payload, async (error: any) => {
        if (error) {
            console.error(`Error publishing WiFi scan MQTT message: ${error.message}`);
            return res.status(500).json({ error: 'Failed to initiate WiFi scan' });
        }
        
        console.log('WiFi scan MQTT message published to shelly1/rpc');
        
        try {
            // Wait for the scan results
            const scanResults = await scanPromise;
            
            // Transform the results to match the expected format
            const networks = scanResults.map((network: any) => ({
                ssid: network.ssid,
                rssi: network.rssi,
                secure: network.auth_mode !== 0 // Auth mode 0 is typically open/unsecured
            }));
            
            res.status(200).json({ networks });
        } catch (error: any) {
            console.error(`WiFi scan error: ${error.message}`);
            res.status(500).json({ error: 'Failed to complete WiFi scan' });
        }
    });
});

app.post('/wifi/connect', (req, res) => {
    const { ssid, password } = req.body;
    
    if (!ssid) {
        return res.status(400).json({ error: 'SSID is required' });
    }
    
    // Create WiFi configuration object
    const wifiConfig: any = {
        ssid: ssid
    };
    
    // Add password if provided
    if (password) {
        wifiConfig.password = password;
    }
    
    // Send MQTT command to configure WiFi
    const payload = JSON.stringify({
        id: 127,
        src: "user_1",
        method: "Wifi.SetConfig",
        params: {
            config: {
                sta: wifiConfig
            }
        }
    });
    
    // Create a promise to handle the response
    const connectPromise = new Promise<any>((resolve, reject) => {
        // Set a timeout to reject the promise after 15 seconds
        const timeoutId = setTimeout(() => {
            reject(new Error('WiFi connection timed out'));
        }, 15000);
        
        // Set up a one-time event handler for the connection response
        const handleConnectResponse = (topic: string, message: Buffer) => {
            if (topic === 'user_1/rpc') {
                try {
                    const data = JSON.parse(message.toString());
                    
                    // Check if this is the connection response
                    if (data.id === 127) {
                        // Clear the timeout
                        clearTimeout(timeoutId);
                        
                        // Remove this event handler
                        mqttClient.removeListener('message', handleConnectResponse);
                        
                        if (data.error) {
                            reject(new Error(data.error.message || 'Failed to connect to WiFi'));
                        } else {
                            // Update device state with new WiFi name
                            updateDeviceState({ wifiName: ssid });
                            resolve(data.result);
                        }
                    }
                } catch (error) {
                    console.error('Error parsing connect response:', error);
                }
            }
        };
        
        // Add the event handler
        mqttClient.on('message', handleConnectResponse);
    });
    
    // Send the connect command
    mqttClient.publish('shelly1/rpc', payload, async (error: any) => {
        if (error) {
            console.error(`Error publishing WiFi connect MQTT message: ${error.message}`);
            return res.status(500).json({ error: 'Failed to initiate WiFi connection' });
        }
        
        console.log('WiFi connect MQTT message published to shelly1/rpc');
        
        try {
            // Wait for the connection result
            await connectPromise;
            res.status(200).json({ success: true, message: `Connected to ${ssid}` });
        } catch (error: any) {
            console.error(`WiFi connection error: ${error.message}`);
            res.status(500).json({ error: `Failed to connect to WiFi: ${error.message}` });
        }
    });
});

app.post('/wifi/toggle', (req, res) => {
    const { enable } = req.body;
    
    if (typeof enable !== 'boolean') {
        return res.status(400).json({ error: 'Invalid request. "enable" parameter must be a boolean.' });
    }
    
    // Send MQTT command to enable/disable WiFi
    const payload = JSON.stringify({
        id: 128,
        src: "user_1",
        method: "Wifi.SetConfig",
        params: {
            config: {
                enable: enable
            }
        }
    });
    
    // Create a promise to handle the response
    const togglePromise = new Promise<any>((resolve, reject) => {
        // Set a timeout to reject the promise after 5 seconds
        const timeoutId = setTimeout(() => {
            reject(new Error('WiFi toggle timed out'));
        }, 5000);
        
        // Set up a one-time event handler for the toggle response
        const handleToggleResponse = (topic: string, message: Buffer) => {
            if (topic === 'user_1/rpc') {
                try {
                    const data = JSON.parse(message.toString());
                    
                    // Check if this is the toggle response
                    if (data.id === 128) {
                        // Clear the timeout
                        clearTimeout(timeoutId);
                        
                        // Remove this event handler
                        mqttClient.removeListener('message', handleToggleResponse);
                        
                        if (data.error) {
                            reject(new Error(data.error.message || 'Failed to toggle WiFi'));
                        } else {
                            // If disabling WiFi, clear the WiFi name
                            if (!enable) {
                                updateDeviceState({ wifiName: null });
                            }
                            resolve(data.result);
                        }
                    }
                } catch (error) {
                    console.error('Error parsing toggle response:', error);
                }
            }
        };
        
        // Add the event handler
        mqttClient.on('message', handleToggleResponse);
    });
    
    // Send the toggle command
    mqttClient.publish('shelly1/rpc', payload, async (error: any) => {
        if (error) {
            console.error(`Error publishing WiFi toggle MQTT message: ${error.message}`);
            return res.status(500).json({ error: 'Failed to toggle WiFi' });
        }
        
        console.log('WiFi toggle MQTT message published to shelly1/rpc');
        
        try {
            // Wait for the toggle result
            await togglePromise;
            res.status(200).json({ success: true, message: `WiFi ${enable ? 'enabled' : 'disabled'}` });
        } catch (error: any) {
            console.error(`WiFi toggle error: ${error.message}`);
            res.status(500).json({ error: `Failed to toggle WiFi: ${error.message}` });
        }
    });
});

// Get WiFi status
app.get('/wifi/status', (req, res) => {
    // Send MQTT command to get WiFi status
    const payload = `{"id": 129, "src": "user_1", "method": "Wifi.GetStatus"}`;
    
    // Create a promise to handle the response
    const statusPromise = new Promise<any>((resolve, reject) => {
        // Set a timeout to reject the promise after 5 seconds
        const timeoutId = setTimeout(() => {
            reject(new Error('WiFi status request timed out'));
        }, 5000);
        
        // Set up a one-time event handler for the status response
        const handleStatusResponse = (topic: string, message: Buffer) => {
            if (topic === 'user_1/rpc') {
                try {
                    const data = JSON.parse(message.toString());
                    
                    // Check if this is the status response
                    if (data.id === 129) {
                        // Clear the timeout
                        clearTimeout(timeoutId);
                        
                        // Remove this event handler
                        mqttClient.removeListener('message', handleStatusResponse);
                        
                        if (data.error) {
                            reject(new Error(data.error.message || 'Failed to get WiFi status'));
                        } else {
                            resolve(data.result);
                        }
                    }
                } catch (error) {
                    console.error('Error parsing status response:', error);
                }
            }
        };
        
        // Add the event handler
        mqttClient.on('message', handleStatusResponse);
    });
    
    // Send the status command
    mqttClient.publish('shelly1/rpc', payload, async (error: any) => {
        if (error) {
            console.error(`Error publishing WiFi status MQTT message: ${error.message}`);
            return res.status(500).json({ error: 'Failed to get WiFi status' });
        }
        
        console.log('WiFi status MQTT message published to shelly1/rpc');
        
        try {
            // Wait for the status result
            const status = await statusPromise;
            res.status(200).json(status);
        } catch (error: any) {
            console.error(`WiFi status error: ${error.message}`);
            res.status(500).json({ error: `Failed to get WiFi status: ${error.message}` });
        }
    });
});

// Toggle device power
app.post('/device/power', (req, res) => {
    const { on } = req.body;
    
    if (typeof on !== 'boolean') {
        return res.status(400).json({ error: 'Invalid request. "on" parameter must be a boolean.' });
    }
    
    toggleDevicePower(on);
    res.status(200).json({ success: true, message: `Device power set to ${on ? 'ON' : 'OFF'}` });
});

// Set device brightness (placeholder - implement actual MQTT command)
app.post('/device/brightness', (req, res) => {
    const { brightness } = req.body;
    
    if (typeof brightness !== 'number' || brightness < 0 || brightness > 100) {
        return res.status(400).json({ error: 'Invalid request. "brightness" must be a number between 0 and 100.' });
    }
    
    // Placeholder for actual MQTT command
    const payload = `{"id": 125, "src": "user_1", "method": "Light.Set", "params":{"id":0,"brightness":${brightness}}}`;
    
    mqttClient.publish('shelly1/rpc', payload, (error: any) => {
        if (error) {
            console.error(`Error publishing brightness MQTT message: ${error.message}`);
            return res.status(500).json({ error: 'Failed to set brightness' });
        } else {
            console.log(`Brightness MQTT message published to shelly1/rpc, setting brightness to ${brightness}%`);
            res.status(200).json({ success: true, message: `Brightness set to ${brightness}%` });
        }
    });
});

// Toggle bluetooth
app.post('/device/bluetooth', (req, res) => {
    const { enable } = req.body;
    
    if (typeof enable !== 'boolean') {
        return res.status(400).json({ error: 'Invalid request. "enable" parameter must be a boolean.' });
    }
    
    toggleBluetooth(enable);
    res.status(200).json({ success: true, message: `Bluetooth ${enable ? 'enabled' : 'disabled'}` });
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

io.on('connection', (socket) => {
    console.log('Client connected');
    
    // Send initial data
    readItems((err, items) => {
        if (err) {
            console.error(err.message);
        } else {
            socket.emit('initialData', items);
        }
    });
    
    // Send current device state
    socket.emit('updateValues', deviceState);
    
    // Handle socket events for backward compatibility
    socket.on('turnof/on', () => {
        const newState = !deviceState.deviceTurnOnOff;
        toggleDevicePower(newState);
    });
    
    socket.on('bluetooth', () => {
        const newState = !deviceState.bluetoothEnable;
        toggleBluetooth(newState);
    });
    
    socket.on('brightness', (brightness: number) => {
        // Placeholder for actual MQTT command
        const payload = `{"id": 125, "src": "user_1", "method": "Light.Set", "params":{"id":0,"brightness":${brightness}}}`;
        
        mqttClient.publish('shelly1/rpc', payload, (error: any) => {
            if (error) {
                console.error(`Error publishing brightness MQTT message: ${error.message}`);
            } else {
                console.log(`Brightness MQTT message published to shelly1/rpc, setting brightness to ${brightness}%`);
            }
        });
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker'); 
    try {
        mqttClient.subscribe('shelly1/status/switch:0');
        mqttClient.subscribe('user_1/rpc');
    } catch (error : any) {
        console.error(error.message);
    }

    publishInitialMessages();
});

mqttClient.on('message', (topic: string, message: Buffer) => {
    console.log(`Received message on topic ${topic}: ${message}`);
    try {
        if(topic == 'shelly1/status/switch:0')
        {
            const incomingData = JSON.parse(message.toString());
            console.log(incomingData);
            saveData(incomingData);
            
            // Update device power state based on actual device response
            if (incomingData.result && typeof incomingData.result.output === 'boolean') {
                updateDeviceState({ deviceTurnOnOff: incomingData.result.output });
            }
        }
        else if(topic == 'user_1/rpc')
        {
            const incomingData = JSON.parse(message.toString());
            
            // Update device configuration state
            const updates: Partial<DeviceState> = {};
            
            if (incomingData.result?.wifi?.sta?.ssid) {
                updates.wifiName = incomingData.result.wifi.sta.ssid;
            }
            
            if (incomingData.result?.ble?.enable !== undefined) {
                updates.bluetoothEnable = incomingData.result.ble.enable;
            }
            
            if (incomingData.result?.mqtt?.enable !== undefined) {
                updates.mqttEnable = incomingData.result.mqtt.enable;
            }
            
            if (incomingData.result?.name) {
                updates.deviceName = incomingData.result.name;
            }
            
            // Update device state if we have any changes
            if (Object.keys(updates).length > 0) {
                updateDeviceState(updates);
            }
        }
    } catch (error) {
        console.error('Error parsing or processing data:', error);
    }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
