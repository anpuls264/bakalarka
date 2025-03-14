"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mqtt_1 = require("./mqtt");
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const crud_1 = require("./crud");
let lastTotalValue = null;
let deviceState = {
    wifiName: null,
    deviceTurnOnOff: true,
    bluetoothEnable: false,
    mqttEnable: false
};
// Update device state and notify all clients
const updateDeviceState = (updates) => {
    deviceState = Object.assign(Object.assign({}, deviceState), updates);
    io.emit('updateValues', deviceState);
    console.log('Device state updated:', deviceState);
};
// Save device data to database and emit to clients
const saveData = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const timestamp = new Date().toISOString();
    if (lastTotalValue !== null && data.aenergy.total < lastTotalValue) {
        data.aenergy.total += lastTotalValue;
    }
    try {
        const result = yield (0, crud_1.createItem)(timestamp, data.apower, data.voltage, data.current, data.aenergy.total);
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
    }
    catch (error) {
        console.error(`Error adding item: ${error.message}`);
    }
});
// Publish MQTT messages to get device configuration
const publishInitialMessages = () => {
    const initialPayloads = [
        '{"id": 123, "src": "user_1", "method": "Shelly.GetConfig"}',
        '{"id": 130, "src": "user_1", "method": "Wifi.GetStatus"}',
        '{"id": 131, "src": "user_1", "method": "Wifi.GetConfig"}'
    ];
    initialPayloads.forEach((payload, index) => {
        mqtt_1.mqttClient.publish('shelly1/rpc', payload, (error) => {
            console.log(payload);
            if (error) {
                console.error(`Error publishing initial MQTT message ${index + 1}: ${error.message}`);
            }
            else {
                console.log(`Initial MQTT message ${index + 1} published to shelly1/rpc`);
            }
        });
    });
};
// Toggle device power state via MQTT
const toggleDevicePower = (turnOn) => {
    const payload = `{"id": 123, "src": "user_1", "method": "Switch.Set", "params":{"id":0,"on":${turnOn}}}`;
    mqtt_1.mqttClient.publish('shelly1/rpc', payload, (error) => {
        if (error) {
            console.error(`Error publishing power toggle MQTT message: ${error.message}`);
        }
        else {
            console.log(`Power toggle MQTT message published to shelly1/rpc, turning device ${turnOn ? 'ON' : 'OFF'}`);
            // Update state immediately for better UX, will be corrected if actual state is different
            updateDeviceState({ deviceTurnOnOff: turnOn });
        }
    });
};
// Toggle bluetooth state via MQTT
const toggleBluetooth = (enable) => {
    const payload = `{"id": 124, "src": "user_1", "method": "Bluetooth.SetConfig", "params":{"enable":${enable}}}`;
    mqtt_1.mqttClient.publish('shelly1/rpc', payload, (error) => {
        if (error) {
            console.error(`Error publishing bluetooth toggle MQTT message: ${error.message}`);
        }
        else {
            console.log(`Bluetooth toggle MQTT message published to shelly1/rpc, setting bluetooth ${enable ? 'ON' : 'OFF'}`);
            // Update state immediately for better UX, will be corrected if actual state is different
            updateDeviceState({ bluetoothEnable: enable });
        }
    });
};
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
// API endpoints
app.get('/items', (req, res) => {
    (0, crud_1.readItems)((err, rows) => {
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
    const scanPromise = new Promise((resolve, reject) => {
        // Set a timeout to reject the promise after 10 seconds
        const timeoutId = setTimeout(() => {
            reject(new Error('WiFi scan timed out'));
        }, 10000);
        // Set up a one-time event handler for the scan response
        const handleScanResponse = (topic, message) => {
            if (topic === 'user_1/rpc') {
                try {
                    const data = JSON.parse(message.toString());
                    // Check if this is the scan response
                    if (data.id === 126 && data.result && data.result.results) {
                        // Clear the timeout
                        clearTimeout(timeoutId);
                        // Remove this event handler
                        mqtt_1.mqttClient.removeListener('message', handleScanResponse);
                        // Resolve with the scan results
                        resolve(data.result.results);
                    }
                }
                catch (error) {
                    console.error('Error parsing scan response:', error);
                }
            }
        };
        // Add the event handler
        mqtt_1.mqttClient.on('message', handleScanResponse);
    });
    // Send the scan command
    mqtt_1.mqttClient.publish('shelly1/rpc', payload, (error) => __awaiter(void 0, void 0, void 0, function* () {
        if (error) {
            console.error(`Error publishing WiFi scan MQTT message: ${error.message}`);
            return res.status(500).json({ error: 'Failed to initiate WiFi scan' });
        }
        console.log('WiFi scan MQTT message published to shelly1/rpc');
        try {
            // Wait for the scan results
            const scanResults = yield scanPromise;
            // Transform the results to match the expected format
            const networks = scanResults.map((network) => ({
                ssid: network.ssid,
                rssi: network.rssi,
                secure: network.auth_mode !== 0 // Auth mode 0 is typically open/unsecured
            }));
            res.status(200).json({ networks });
        }
        catch (error) {
            console.error(`WiFi scan error: ${error.message}`);
            res.status(500).json({ error: 'Failed to complete WiFi scan' });
        }
    }));
});
app.post('/wifi/connect', (req, res) => {
    const { ssid, password } = req.body;
    if (!ssid) {
        return res.status(400).json({ error: 'SSID is required' });
    }
    // Create WiFi configuration object
    const wifiConfig = {
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
    const connectPromise = new Promise((resolve, reject) => {
        // Set a timeout to reject the promise after 15 seconds
        const timeoutId = setTimeout(() => {
            reject(new Error('WiFi connection timed out'));
        }, 15000);
        // Set up a one-time event handler for the connection response
        const handleConnectResponse = (topic, message) => {
            if (topic === 'user_1/rpc') {
                try {
                    const data = JSON.parse(message.toString());
                    // Check if this is the connection response
                    if (data.id === 127) {
                        // Clear the timeout
                        clearTimeout(timeoutId);
                        // Remove this event handler
                        mqtt_1.mqttClient.removeListener('message', handleConnectResponse);
                        if (data.error) {
                            reject(new Error(data.error.message || 'Failed to connect to WiFi'));
                        }
                        else {
                            // Update device state with new WiFi name
                            updateDeviceState({ wifiName: ssid });
                            resolve(data.result);
                        }
                    }
                }
                catch (error) {
                    console.error('Error parsing connect response:', error);
                }
            }
        };
        // Add the event handler
        mqtt_1.mqttClient.on('message', handleConnectResponse);
    });
    // Send the connect command
    mqtt_1.mqttClient.publish('shelly1/rpc', payload, (error) => __awaiter(void 0, void 0, void 0, function* () {
        if (error) {
            console.error(`Error publishing WiFi connect MQTT message: ${error.message}`);
            return res.status(500).json({ error: 'Failed to initiate WiFi connection' });
        }
        console.log('WiFi connect MQTT message published to shelly1/rpc');
        try {
            // Wait for the connection result
            yield connectPromise;
            res.status(200).json({ success: true, message: `Connected to ${ssid}` });
        }
        catch (error) {
            console.error(`WiFi connection error: ${error.message}`);
            res.status(500).json({ error: `Failed to connect to WiFi: ${error.message}` });
        }
    }));
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
    const togglePromise = new Promise((resolve, reject) => {
        // Set a timeout to reject the promise after 5 seconds
        const timeoutId = setTimeout(() => {
            reject(new Error('WiFi toggle timed out'));
        }, 5000);
        // Set up a one-time event handler for the toggle response
        const handleToggleResponse = (topic, message) => {
            if (topic === 'user_1/rpc') {
                try {
                    const data = JSON.parse(message.toString());
                    // Check if this is the toggle response
                    if (data.id === 128) {
                        // Clear the timeout
                        clearTimeout(timeoutId);
                        // Remove this event handler
                        mqtt_1.mqttClient.removeListener('message', handleToggleResponse);
                        if (data.error) {
                            reject(new Error(data.error.message || 'Failed to toggle WiFi'));
                        }
                        else {
                            // If disabling WiFi, clear the WiFi name
                            if (!enable) {
                                updateDeviceState({ wifiName: null });
                            }
                            resolve(data.result);
                        }
                    }
                }
                catch (error) {
                    console.error('Error parsing toggle response:', error);
                }
            }
        };
        // Add the event handler
        mqtt_1.mqttClient.on('message', handleToggleResponse);
    });
    // Send the toggle command
    mqtt_1.mqttClient.publish('shelly1/rpc', payload, (error) => __awaiter(void 0, void 0, void 0, function* () {
        if (error) {
            console.error(`Error publishing WiFi toggle MQTT message: ${error.message}`);
            return res.status(500).json({ error: 'Failed to toggle WiFi' });
        }
        console.log('WiFi toggle MQTT message published to shelly1/rpc');
        try {
            // Wait for the toggle result
            yield togglePromise;
            res.status(200).json({ success: true, message: `WiFi ${enable ? 'enabled' : 'disabled'}` });
        }
        catch (error) {
            console.error(`WiFi toggle error: ${error.message}`);
            res.status(500).json({ error: `Failed to toggle WiFi: ${error.message}` });
        }
    }));
});
// Get WiFi status
app.get('/wifi/status', (req, res) => {
    // Send MQTT command to get WiFi status
    const payload = `{"id": 129, "src": "user_1", "method": "Wifi.GetStatus"}`;
    // Create a promise to handle the response
    const statusPromise = new Promise((resolve, reject) => {
        // Set a timeout to reject the promise after 5 seconds
        const timeoutId = setTimeout(() => {
            reject(new Error('WiFi status request timed out'));
        }, 5000);
        // Set up a one-time event handler for the status response
        const handleStatusResponse = (topic, message) => {
            if (topic === 'user_1/rpc') {
                try {
                    const data = JSON.parse(message.toString());
                    // Check if this is the status response
                    if (data.id === 129) {
                        // Clear the timeout
                        clearTimeout(timeoutId);
                        // Remove this event handler
                        mqtt_1.mqttClient.removeListener('message', handleStatusResponse);
                        if (data.error) {
                            reject(new Error(data.error.message || 'Failed to get WiFi status'));
                        }
                        else {
                            resolve(data.result);
                        }
                    }
                }
                catch (error) {
                    console.error('Error parsing status response:', error);
                }
            }
        };
        // Add the event handler
        mqtt_1.mqttClient.on('message', handleStatusResponse);
    });
    // Send the status command
    mqtt_1.mqttClient.publish('shelly1/rpc', payload, (error) => __awaiter(void 0, void 0, void 0, function* () {
        if (error) {
            console.error(`Error publishing WiFi status MQTT message: ${error.message}`);
            return res.status(500).json({ error: 'Failed to get WiFi status' });
        }
        console.log('WiFi status MQTT message published to shelly1/rpc');
        try {
            // Wait for the status result
            const status = yield statusPromise;
            res.status(200).json(status);
        }
        catch (error) {
            console.error(`WiFi status error: ${error.message}`);
            res.status(500).json({ error: `Failed to get WiFi status: ${error.message}` });
        }
    }));
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
    mqtt_1.mqttClient.publish('shelly1/rpc', payload, (error) => {
        if (error) {
            console.error(`Error publishing brightness MQTT message: ${error.message}`);
            return res.status(500).json({ error: 'Failed to set brightness' });
        }
        else {
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
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
    },
});
io.on('connection', (socket) => {
    console.log('Client connected');
    // Send initial data
    (0, crud_1.readItems)((err, items) => {
        if (err) {
            console.error(err.message);
        }
        else {
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
    socket.on('brightness', (brightness) => {
        // Placeholder for actual MQTT command
        const payload = `{"id": 125, "src": "user_1", "method": "Light.Set", "params":{"id":0,"brightness":${brightness}}}`;
        mqtt_1.mqttClient.publish('shelly1/rpc', payload, (error) => {
            if (error) {
                console.error(`Error publishing brightness MQTT message: ${error.message}`);
            }
            else {
                console.log(`Brightness MQTT message published to shelly1/rpc, setting brightness to ${brightness}%`);
            }
        });
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});
mqtt_1.mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
    try {
        mqtt_1.mqttClient.subscribe('shelly1/status/switch:0');
        mqtt_1.mqttClient.subscribe('user_1/rpc');
    }
    catch (error) {
        console.error(error.message);
    }
    publishInitialMessages();
});
mqtt_1.mqttClient.on('message', (topic, message) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    console.log(`Received message on topic ${topic}: ${message}`);
    try {
        if (topic == 'shelly1/status/switch:0') {
            const incomingData = JSON.parse(message.toString());
            console.log(incomingData);
            saveData(incomingData);
            // Update device power state based on actual device response
            if (incomingData.result && typeof incomingData.result.output === 'boolean') {
                updateDeviceState({ deviceTurnOnOff: incomingData.result.output });
            }
        }
        else if (topic == 'user_1/rpc') {
            const incomingData = JSON.parse(message.toString());
            // Update device configuration state
            const updates = {};
            if ((_c = (_b = (_a = incomingData.result) === null || _a === void 0 ? void 0 : _a.wifi) === null || _b === void 0 ? void 0 : _b.sta) === null || _c === void 0 ? void 0 : _c.ssid) {
                updates.wifiName = incomingData.result.wifi.sta.ssid;
            }
            if (((_e = (_d = incomingData.result) === null || _d === void 0 ? void 0 : _d.ble) === null || _e === void 0 ? void 0 : _e.enable) !== undefined) {
                updates.bluetoothEnable = incomingData.result.ble.enable;
            }
            if (((_g = (_f = incomingData.result) === null || _f === void 0 ? void 0 : _f.mqtt) === null || _g === void 0 ? void 0 : _g.enable) !== undefined) {
                updates.mqttEnable = incomingData.result.mqtt.enable;
            }
            if ((_h = incomingData.result) === null || _h === void 0 ? void 0 : _h.name) {
                updates.deviceName = incomingData.result.name;
            }
            // Update device state if we have any changes
            if (Object.keys(updates).length > 0) {
                updateDeviceState(updates);
            }
        }
    }
    catch (error) {
        console.error('Error parsing or processing data:', error);
    }
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
