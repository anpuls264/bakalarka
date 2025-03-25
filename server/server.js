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
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const DeviceManager_1 = require("./services/DeviceManager");
const MqttService_1 = require("./services/MqttService");
const deviceRoutes_1 = require("./api/deviceRoutes");
const crud_1 = require("./crud");
// Načíst proměnné prostředí
dotenv_1.default.config();
// Vytvořit Express aplikaci
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Vytvořit HTTP server
const server = http_1.default.createServer(app);
// Vytvořit Socket.IO server
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
    },
});
// Vytvořit správce zařízení
const deviceManager = new DeviceManager_1.DeviceManager();
// Nastavení MQTT klienta
const mqttOptions = {
    host: process.env.MQTT_HOST || '172.31.45.126',
    port: parseInt(process.env.MQTT_PORT || '1883'),
    username: process.env.MQTT_USERNAME || 'simatic',
    password: process.env.MQTT_PASSWORD || 'vitkovic1',
    protocol: 'mqtt',
    keepalive: 60,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
    clean: true
};
// Vytvořit MQTT službu
const mqttService = new MqttService_1.MqttService(mqttOptions, deviceManager);
// Nastavit API routy pro zařízení
app.use('/api/devices', (0, deviceRoutes_1.createDeviceRoutes)(deviceManager, mqttService));
// Zpětná kompatibilita pro stávající API
app.get('/items', (req, res) => {
    (0, crud_1.readAllMetrics)()
        .then(items => res.status(200).json(items))
        .catch(err => res.status(500).send(err.message));
});
// Získat stav zařízení (zpětná kompatibilita)
app.get('/device/state', (req, res) => {
    const device = deviceManager.getDevice('shelly1');
    if (!device) {
        return res.status(404).json({ error: 'Default device not found' });
    }
    res.status(200).json(device.getState());
});
// Ovládání zařízení (zpětná kompatibilita)
app.post('/device/power', (req, res) => {
    const { on } = req.body;
    const device = deviceManager.getDevice('shelly1');
    if (!device) {
        return res.status(404).json({ error: 'Default device not found' });
    }
    if (typeof on !== 'boolean') {
        return res.status(400).json({ error: 'Invalid request. "on" parameter must be a boolean.' });
    }
    const commands = device.getCommands();
    if (!commands.togglePower) {
        return res.status(400).json({ error: 'Device does not support power control' });
    }
    try {
        commands.togglePower(on);
        res.status(200).json({ success: true, message: `Device power set to ${on ? 'ON' : 'OFF'}` });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Nastavení jasu (zpětná kompatibilita)
app.post('/device/brightness', (req, res) => {
    const { brightness } = req.body;
    const device = deviceManager.getDevice('shelly1');
    if (!device) {
        return res.status(404).json({ error: 'Default device not found' });
    }
    if (typeof brightness !== 'number' || brightness < 0 || brightness > 100) {
        return res.status(400).json({ error: 'Invalid request. "brightness" must be a number between 0 and 100.' });
    }
    const commands = device.getCommands();
    if (!commands.setBrightness) {
        return res.status(400).json({ error: 'Device does not support brightness control' });
    }
    try {
        commands.setBrightness(brightness);
        res.status(200).json({ success: true, message: `Brightness set to ${brightness}%` });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Ovládání Bluetooth (zpětná kompatibilita)
app.post('/device/bluetooth', (req, res) => {
    const { enable } = req.body;
    const device = deviceManager.getDevice('shelly1');
    if (!device) {
        return res.status(404).json({ error: 'Default device not found' });
    }
    if (typeof enable !== 'boolean') {
        return res.status(400).json({ error: 'Invalid request. "enable" parameter must be a boolean.' });
    }
    const commands = device.getCommands();
    if (!commands.toggleBluetooth) {
        return res.status(400).json({ error: 'Device does not support Bluetooth control' });
    }
    try {
        commands.toggleBluetooth(enable);
        res.status(200).json({ success: true, message: `Bluetooth ${enable ? 'enabled' : 'disabled'}` });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// WiFi API (zpětná kompatibilita)
app.get('/wifi/scan', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const device = deviceManager.getDevice('shelly1');
    if (!device) {
        return res.status(404).json({ error: 'Default device not found' });
    }
    const commands = device.getCommands();
    if (!commands.scanWifi) {
        return res.status(400).json({ error: 'Device does not support WiFi scanning' });
    }
    try {
        const result = yield commands.scanWifi();
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
app.post('/wifi/connect', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { ssid, password } = req.body;
    const device = deviceManager.getDevice('shelly1');
    if (!device) {
        return res.status(404).json({ error: 'Default device not found' });
    }
    if (!ssid) {
        return res.status(400).json({ error: 'SSID is required' });
    }
    const commands = device.getCommands();
    if (!commands.connectWifi) {
        return res.status(400).json({ error: 'Device does not support WiFi connection' });
    }
    try {
        yield commands.connectWifi(ssid, password);
        res.status(200).json({ success: true, message: `Connected to ${ssid}` });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
app.get('/wifi/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const device = deviceManager.getDevice('shelly1');
    if (!device) {
        return res.status(404).json({ error: 'Default device not found' });
    }
    const commands = device.getCommands();
    if (!commands.getWifiStatus) {
        return res.status(400).json({ error: 'Device does not support WiFi status' });
    }
    try {
        const result = yield commands.getWifiStatus();
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
// Socket.IO komunikace
io.on('connection', (socket) => {
    console.log('Client connected');
    // Poslat počáteční data
    (0, crud_1.readAllMetrics)()
        .then(items => socket.emit('initialData', items))
        .catch(err => console.error(err.message));
    // Poslat aktuální stav zařízení
    const device = deviceManager.getDevice('shelly1');
    if (device) {
        socket.emit('updateValues', device.getState());
    }
    // Zpětná kompatibilita pro Socket.IO události
    socket.on('turnof/on', () => {
        const device = deviceManager.getDevice('shelly1');
        if (device) {
            const state = device.getState();
            const commands = device.getCommands();
            if (commands.togglePower) {
                commands.togglePower(!state.deviceTurnOnOff);
            }
        }
    });
    socket.on('bluetooth', () => {
        const device = deviceManager.getDevice('shelly1');
        if (device) {
            const state = device.getState();
            const commands = device.getCommands();
            if (commands.toggleBluetooth) {
                commands.toggleBluetooth(!state.bluetoothEnable);
            }
        }
    });
    socket.on('brightness', (brightness) => {
        const device = deviceManager.getDevice('shelly1');
        if (device) {
            const commands = device.getCommands();
            if (commands.setBrightness) {
                commands.setBrightness(brightness);
            }
        }
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});
// Naslouchat na událostech z DeviceManager
deviceManager.on('deviceStateChanged', (device) => {
    io.emit('updateValues', device.getState());
});
deviceManager.on('deviceMetrics', (metrics) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, crud_1.createMetrics)(metrics);
        io.emit('newData', Object.assign(Object.assign({}, metrics), { id: result.id }));
    }
    catch (error) {
        console.error(`Error saving metrics: ${error.message}`);
    }
}));
// Načíst existující zařízení z databáze
const initializeDevices = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Načíst zařízení z databáze
        const devices = yield (0, crud_1.readDevices)();
        console.log(`Found ${devices.length} devices in database`);
        if (devices.length === 0) {
            // Vytvořit výchozí zařízení, pokud žádné neexistuje
            const defaultConfig = {
                id: 'shelly1',
                name: 'Shelly Plug S',
                type: 'shelly-plug-s',
                mqttTopic: 'shelly1',
                capabilities: ['power', 'bluetooth', 'wifi', 'brightness']
            };
            console.log('Creating default device:', defaultConfig);
            yield (0, crud_1.createDevice)('shelly1', 'Shelly Plug S', 'shelly-plug-s', defaultConfig);
            deviceManager.addDevice(defaultConfig);
        }
        else {
            // Přidat existující zařízení do správce
            for (const device of devices) {
                try {
                    console.log(`Processing device: ${device.id}, config type: ${typeof device.config}`);
                    let deviceConfig;
                    // Ensure we have a valid DeviceConfig object
                    if (typeof device.config === 'string') {
                        try {
                            deviceConfig = JSON.parse(device.config);
                            console.log('Successfully parsed config from string');
                        }
                        catch (parseError) {
                            console.error(`Error parsing device config for ${device.id}: ${parseError.message}`);
                            console.error('Config string:', device.config);
                            continue; // Skip this device and move to the next one
                        }
                    }
                    else if (typeof device.config === 'object' && device.config !== null) {
                        deviceConfig = device.config;
                        console.log('Using config object directly');
                    }
                    else {
                        console.error(`Invalid config type for device ${device.id}: ${typeof device.config}`);
                        continue; // Skip this device
                    }
                    // Validate the deviceConfig has required properties
                    if (!deviceConfig.id || !deviceConfig.type || !deviceConfig.mqttTopic) {
                        console.error(`Invalid device config for ${device.id}: missing required properties`);
                        console.error('Config:', JSON.stringify(deviceConfig));
                        continue; // Skip this device
                    }
                    // Add the device
                    const addedDevice = deviceManager.addDevice(deviceConfig);
                    if (!addedDevice) {
                        console.error(`Failed to add device ${deviceConfig.id} of type ${deviceConfig.type}`);
                    }
                    else {
                        console.log(`Successfully added device ${deviceConfig.id}`);
                    }
                }
                catch (deviceError) {
                    console.error(`Error processing device ${device.id}: ${deviceError.message}`);
                }
            }
        }
        console.log(`Loaded ${deviceManager.getAllDevices().length} devices`);
    }
    catch (error) {
        console.error(`Error initializing devices: ${error.message}`);
        console.error(error.stack);
    }
});
// Spustit server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Server is running on port ${PORT}`);
    // Inicializovat zařízení
    yield initializeDevices();
    // Re-subscribe to all device topics after devices are loaded
    mqttService.resubscribeToAllTopics();
}));
