import { mqttClient } from "./mqtt";
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { createItem, readItems, Item } from "./crud";

// Define interfaces for better type safety
interface ShellyData {
    apower: number;
    voltage: number;
    current: number;
    aenergy: { 
        total: number 
    };
    result?: {
        output: boolean;
    };
}

interface ShellyConfig {
    result: {
        wifi: {
            sta: {
                ssid: string;
            }
        };
        ble: {
            enable: boolean;
        };
        mqtt: {
            enable: boolean;
        };
    };
}

interface DeviceState {
    wifiName: string | null;
    deviceTurnOnOff: boolean;
    bluetoothEnable: boolean;
    mqttEnable: boolean;
}

// Application state
let lastTotalValue: number | null = null;
let deviceTurnOnOff: boolean = false;
let wifiName: string | null = null;
let bluetoothEnable: boolean = false;
let mqttEnable: boolean = false;

/**
 * Saves device metrics data to the database and emits the new data to connected clients
 * @param data The device metrics data to save
 */
const saveData = async (data: ShellyData): Promise<void> => {
    const timestamp = new Date().toISOString();
    
    // Handle energy counter reset
    if (lastTotalValue !== null && data.aenergy.total < lastTotalValue) {
        data.aenergy.total += lastTotalValue;
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

        lastTotalValue = data.aenergy.total;

        // Emit new data to all connected clients
        io.emit('newData', result);
    } catch (error : any) {
        console.error(`Error adding item: ${error.message}`);
    }
};

/**
 * Helper function to publish messages to MQTT broker
 * @param topic The MQTT topic to publish to
 * @param payload The message payload
 * @param description Description for logging purposes
 */
const publishMqttMessage = (topic: string, payload: string, description: string): void => {
    mqttClient.publish(topic, payload, (err) => {
        if (err) {
            console.error(`Error publishing ${description}: ${err.message}`);
        } else {
            console.log(`Successfully published ${description} to ${topic}`);
        }
    });
};

/**
 * Publishes initial configuration request messages to the device
 */
const publishInitialMessages = (): void => {
    const initialPayloads = [
        '{"id": 123, "src": "user_1", "method": "Shelly.GetConfig"}',
    ];
  
    initialPayloads.forEach((payload, index) => {
        console.log(payload);
        publishMqttMessage(
            'shelly1/rpc', 
            payload, 
            `initial MQTT message ${index + 1}`
        );
    });
};

// Load environment variables
dotenv.config();

// Initialize Express application
const app = express();
app.use(express.json());

// Define API routes
app.get('/items', (req, res) => {
    readItems((err, rows) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.status(200).json(rows);
        }
    });
});

// Create HTTP server and Socket.IO instance
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins
    },
});

/**
 * Get current device state for client updates
 */
const getDeviceState = (): DeviceState => ({
    wifiName,
    deviceTurnOnOff,
    bluetoothEnable,
    mqttEnable
});

// Handle Socket.IO connections
io.on('connection', (socket) => {
    // Send initial data to newly connected client
    readItems((err, items) => {
        if (err) {
            console.error(`Error reading items: ${err.message}`);
        } else {
            socket.emit('initialData', items);
            io.emit('updateValues', getDeviceState());
        }
    });

    // Handle device power toggle
    socket.on('turnof/on', () => {
        console.log(`Current device state: ${deviceTurnOnOff}`);
        const payload = `{"id": 123, "src": "user_1", "method": "Switch.Set", "params":{"id":0,"on":${deviceTurnOnOff}}}`;
        deviceTurnOnOff = !deviceTurnOnOff;
        
        publishMqttMessage('shelly1/rpc', payload, 'device power toggle command');
    });

    // Handle brightness adjustment
    socket.on('brightness', (brightness: number) => {
        const payload = `{"id": 123, "src": "user_1", "method": "Switch.Set", "params":{"id":0,"brightness":${brightness}}}`;
        console.log(`Setting brightness to ${brightness}`);
        
        publishMqttMessage('shelly1/rpc', payload, 'brightness adjustment command');
    });

    // Handle bluetooth toggle
    socket.on('bluetooth', () => {
        console.log(`Current bluetooth state: ${bluetoothEnable}`);
        const payload = `{"id":123, "src": "user_1", "method":"BLE.SetConfig","params":{"config":{"enable":${bluetoothEnable},"rpc":{"enable":true}}}}`;
        bluetoothEnable = !bluetoothEnable;
        
        publishMqttMessage('shelly1/rpc', payload, 'bluetooth toggle command');
    });
});

// Handle MQTT connection
mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker'); 
    try {
        // Subscribe to relevant topics
        mqttClient.subscribe('shelly1/status/switch:0');
        mqttClient.subscribe('user_1/rpc');
        
        // Request initial configuration
        publishInitialMessages();
    } catch (error : any) {
        console.error(`MQTT subscription error: ${error.message}`);
    }
});

// Handle incoming MQTT messages
mqttClient.on('message', (topic, message) => {
    console.log(`Received message on topic ${topic}: ${message}`);
    try {
        const messageStr = message.toString();
        
        if (topic === 'shelly1/status/switch:0') {
            // Handle device status updates
            const incomingData: ShellyData = JSON.parse(messageStr);
            console.log(incomingData);
            
            // Save metrics data
            saveData(incomingData);
            
            // Update device state if available
            if (incomingData.result && incomingData.result.output !== undefined) {
                deviceTurnOnOff = incomingData.result.output;
            }
        } else if (topic === 'user_1/rpc') {
            // Handle configuration data
            const incomingData: ShellyConfig = JSON.parse(messageStr);

            // Update device configuration state
            wifiName = incomingData.result.wifi.sta.ssid;
            bluetoothEnable = incomingData.result.ble.enable;
            mqttEnable = incomingData.result.mqtt.enable;
            
            // Notify clients of updated values
            io.emit('updateValues', getDeviceState());
        }
    } catch (error) {
        console.error('Error parsing or processing MQTT data:', error);
    }
});

// Start the server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
