import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { DeviceManager } from './services/DeviceManager';
import { MqttService } from './services/MqttService';
import { createDeviceRoutes } from './api/deviceRoutes';
import { readDevices, createDevice, createMetrics, readAllMetrics } from './crud';
import { DeviceConfig } from './models/Device';
import * as mqtt from 'mqtt';

// Načíst proměnné prostředí
dotenv.config();

// Vytvořit Express aplikaci
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Vytvořit HTTP server
const server = http.createServer(app);

// Vytvořit Socket.IO server
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

// Vytvořit správce zařízení
const deviceManager = new DeviceManager();

// Nastavení MQTT klienta
const mqttOptions: mqtt.IClientOptions = {
    host: process.env.MQTT_HOST || '172.31.45.126',
    port: parseInt(process.env.MQTT_PORT || '1883'),
    username: process.env.MQTT_USERNAME || 'simatic',
    password: process.env.MQTT_PASSWORD || 'vitkovic1',
    protocol: 'mqtt' as mqtt.MqttProtocol,
    keepalive: 60,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
    clean: true
};

// Vytvořit MQTT službu
const mqttService = new MqttService(mqttOptions, deviceManager);

// Nastavit API routy pro zařízení
app.use('/api/devices', createDeviceRoutes(deviceManager, mqttService));

// Zpětná kompatibilita pro stávající API
app.get('/items', (req, res) => {
    readAllMetrics()
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// WiFi API (zpětná kompatibilita)
app.get('/wifi/scan', async (req, res) => {
    const device = deviceManager.getDevice('shelly1');
    
    if (!device) {
        return res.status(404).json({ error: 'Default device not found' });
    }
    
    const commands = device.getCommands();
    
    if (!commands.scanWifi) {
        return res.status(400).json({ error: 'Device does not support WiFi scanning' });
    }
    
    try {
        const result = await commands.scanWifi();
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/wifi/connect', async (req, res) => {
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
        await commands.connectWifi(ssid, password);
        res.status(200).json({ success: true, message: `Connected to ${ssid}` });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/wifi/status', async (req, res) => {
    const device = deviceManager.getDevice('shelly1');
    
    if (!device) {
        return res.status(404).json({ error: 'Default device not found' });
    }
    
    const commands = device.getCommands();
    
    if (!commands.getWifiStatus) {
        return res.status(400).json({ error: 'Device does not support WiFi status' });
    }
    
    try {
        const result = await commands.getWifiStatus();
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Socket.IO komunikace
io.on('connection', (socket) => {
    console.log('Client connected');
    
    // Poslat počáteční data
    readAllMetrics()
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
    
    socket.on('brightness', (brightness: number) => {
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

deviceManager.on('deviceMetrics', async (metrics) => {
    try {
        const result = await createMetrics(metrics);
        io.emit('newData', { ...metrics, id: result.id });
    } catch (error: any) {
        console.error(`Error saving metrics: ${error.message}`);
    }
});

// Načíst existující zařízení z databáze
const initializeDevices = async () => {
    try {
        // Načíst zařízení z databáze
        const devices = await readDevices();
        
        if (devices.length === 0) {
            // Vytvořit výchozí zařízení, pokud žádné neexistuje
            const defaultConfig: DeviceConfig = {
                id: 'shelly1',
                name: 'Shelly Plug S',
                type: 'shelly-plug-s',
                mqttTopic: 'shelly1',
                capabilities: ['power', 'bluetooth', 'wifi', 'brightness']
            };
            
            await createDevice('shelly1', 'Shelly Plug S', 'shelly-plug-s', defaultConfig);
            deviceManager.addDevice(defaultConfig);
        } else {
            // Přidat existující zařízení do správce
            for (const device of devices) {
                deviceManager.addDevice(JSON.parse(device.config) as DeviceConfig);
            }
        }
        
        console.log(`Loaded ${deviceManager.getAllDevices().length} devices`);
    } catch (error: any) {
        console.error(`Error initializing devices: ${error.message}`);
    }
};

// Spustit server
const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    
    // Inicializovat zařízení
    await initializeDevices();
});
