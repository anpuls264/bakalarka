import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import { SocketService } from './services/socket';
import { deviceService } from './services/device';
import { shellyApiService } from './services/shellyApi';
import { 
    readItems, 
    readItemsByTimeRange, 
    getAggregatedMetrics, 
    getLatestMetrics 
} from './repositories/deviceRepository';

// Load environment variables
dotenv.config();

// Initialize Express application
const app = express();
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO service
const socketService = SocketService.initialize(server);

// Define API routes
app.get('/items', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 1000;
        const items = await readItems(limit);
        res.status(200).json(items);
    } catch (error: any) {
        console.error(`Error reading items: ${error.message}`);
        res.status(500).send(error.message);
    }
});

// Get data within a time range
app.get('/items/range', async (req, res) => {
    try {
        const start = req.query.start as string || '-24h';
        const end = req.query.end as string || 'now()';
        const items = await readItemsByTimeRange(start, end);
        res.status(200).json(items);
    } catch (error: any) {
        console.error(`Error reading items by time range: ${error.message}`);
        res.status(500).send(error.message);
    }
});

// Get aggregated data (e.g., hourly averages)
app.get('/items/aggregated', async (req, res) => {
    try {
        const start = req.query.start as string || '-7d';
        const window = req.query.window as string || '1h';
        const data = await getAggregatedMetrics(start, window);
        res.status(200).json(data);
    } catch (error: any) {
        console.error(`Error getting aggregated metrics: ${error.message}`);
        res.status(500).send(error.message);
    }
});

// Get latest metrics
app.get('/items/latest', async (req, res) => {
    try {
        const item = await getLatestMetrics();
        if (item) {
            res.status(200).json(item);
        } else {
            res.status(404).send('No metrics found');
        }
    } catch (error: any) {
        console.error(`Error getting latest metrics: ${error.message}`);
        res.status(500).send(error.message);
    }
});

// Register device control handlers
socketService.registerDeviceControlHandlers({
    turnOnOff: () => deviceService.togglePower(),
    setBrightness: (brightness: number) => deviceService.setBrightness(brightness),
    toggleBluetooth: () => deviceService.toggleBluetooth()
});

// Device control API endpoints
app.post('/device/power', async (req, res) => {
    try {
        const { on } = req.body;
        if (typeof on !== 'boolean') {
            return res.status(400).json({ error: 'Invalid request. "on" parameter must be a boolean.' });
        }
        
        await shellyApiService.togglePower(on);
        res.status(200).json({ success: true, state: on });
    } catch (error: any) {
        console.error(`Error toggling power: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

app.post('/device/brightness', async (req, res) => {
    try {
        const { brightness } = req.body;
        if (typeof brightness !== 'number' || brightness < 0 || brightness > 100) {
            return res.status(400).json({ error: 'Invalid request. "brightness" must be a number between 0 and 100.' });
        }
        
        await shellyApiService.setBrightness(brightness);
        res.status(200).json({ success: true, brightness });
    } catch (error: any) {
        console.error(`Error setting brightness: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

app.post('/device/bluetooth', async (req, res) => {
    try {
        const { enable } = req.body;
        if (typeof enable !== 'boolean') {
            return res.status(400).json({ error: 'Invalid request. "enable" parameter must be a boolean.' });
        }
        
        await shellyApiService.toggleBluetooth(enable);
        res.status(200).json({ success: true, state: enable });
    } catch (error: any) {
        console.error(`Error toggling bluetooth: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

app.post('/device/name', async (req, res) => {
    try {
        const { name } = req.body;
        if (typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ error: 'Invalid request. "name" must be a non-empty string.' });
        }
        
        await shellyApiService.setDeviceName(name);
        res.status(200).json({ success: true, name });
    } catch (error: any) {
        console.error(`Error setting device name: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

app.post('/device/led-mode', async (req, res) => {
    try {
        const { mode } = req.body;
        if (typeof mode !== 'number' || mode < 0 || mode > 3) {
            return res.status(400).json({ error: 'Invalid request. "mode" must be a number between 0 and 3.' });
        }
        
        await shellyApiService.setLedMode(mode);
        res.status(200).json({ success: true, mode });
    } catch (error: any) {
        console.error(`Error setting LED mode: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

app.post('/device/power-on-state', async (req, res) => {
    try {
        const { state } = req.body;
        if (typeof state !== 'number' || state < 0 || state > 2) {
            return res.status(400).json({ error: 'Invalid request. "state" must be a number between 0 and 2.' });
        }
        
        await shellyApiService.setPowerOnState(state);
        res.status(200).json({ success: true, state });
    } catch (error: any) {
        console.error(`Error setting power-on state: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

app.post('/device/auto-off-timer', async (req, res) => {
    try {
        const { seconds } = req.body;
        if (typeof seconds !== 'number' || seconds < 0) {
            return res.status(400).json({ error: 'Invalid request. "seconds" must be a non-negative number.' });
        }
        
        await shellyApiService.setAutoOffTimer(seconds);
        res.status(200).json({ success: true, seconds });
    } catch (error: any) {
        console.error(`Error setting auto-off timer: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

app.post('/device/auto-on-timer', async (req, res) => {
    try {
        const { seconds } = req.body;
        if (typeof seconds !== 'number' || seconds < 0) {
            return res.status(400).json({ error: 'Invalid request. "seconds" must be a non-negative number.' });
        }
        
        await shellyApiService.setAutoOnTimer(seconds);
        res.status(200).json({ success: true, seconds });
    } catch (error: any) {
        console.error(`Error setting auto-on timer: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

app.post('/device/power-limit', async (req, res) => {
    try {
        const { watts } = req.body;
        if (typeof watts !== 'number' || watts < 0) {
            return res.status(400).json({ error: 'Invalid request. "watts" must be a non-negative number.' });
        }
        
        await shellyApiService.setPowerLimit(watts);
        res.status(200).json({ success: true, watts });
    } catch (error: any) {
        console.error(`Error setting power limit: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

app.post('/device/reboot', async (req, res) => {
    try {
        await shellyApiService.rebootDevice();
        res.status(200).json({ success: true });
    } catch (error: any) {
        console.error(`Error rebooting device: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

app.get('/device/config', async (req, res) => {
    try {
        await shellyApiService.getDeviceConfig();
        res.status(200).json({ success: true, message: 'Device configuration request sent' });
    } catch (error: any) {
        console.error(`Error getting device config: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

app.get('/device/status', async (req, res) => {
    try {
        await shellyApiService.getDeviceStatus();
        res.status(200).json({ success: true, message: 'Device status request sent' });
    } catch (error: any) {
        console.error(`Error getting device status: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// Initialize MQTT handlers
deviceService.initializeMqttHandlers();

// Handle new socket connections
socketService.getIO().on('connection', async (socket) => {
    try {
        // Send initial data to newly connected client
        const items = await readItems();
        socketService.sendInitialData(items, deviceService.getDeviceState());
    } catch (error: any) {
        console.error(`Error sending initial data: ${error.message}`);
    }
});

// Start the server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.close(() => {
        console.log('Server shut down');
        process.exit(0);
    });
});
