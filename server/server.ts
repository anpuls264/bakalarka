import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import * as mqtt from 'mqtt';
import cors from 'cors';
import { mqttClient } from './mqtt';
import { DeviceManager } from './services/DeviceManager';
import { MqttService } from './services/MqttService';
import { createDeviceRoutes } from './api/deviceRoutes';
import { 
    createElectricalMetrics,
    createEnvironmentalMetrics,
    readDevices, 
    readElectricalMetricsByDeviceIdFiltered,
    readEnvironmentalMetricsByDeviceIdFiltered
} from './crud';
import { DeviceConfig } from './models/Device';

// Načtení proměnných prostředí
dotenv.config();

// Vytvoření Express aplikace
const app = express();
app.use(express.json());
app.use(cors());

// Vytvoření HTTP serveru
const server = http.createServer(app);

// Inicializace Socket.IO
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

// Inicializace Device Manager
const deviceManager = new DeviceManager();

// Inicializace MQTT služby
const mqttService = new MqttService(deviceManager);

// Nastavení API tras
app.use('/api/devices', createDeviceRoutes(deviceManager, mqttService));

// API trasa pro získání elektrických metrik pro konkrétní zařízení
app.get('/api/devices/:id/electrical-metrics', async (req, res) => {
    try {
        const deviceId = req.params.id;
        
        // Parsování parametrů pro filtrování
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
        
        // Kontrola existence zařízení
        const device = deviceManager.getDevice(deviceId);
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        
        // Načíst data z databáze s filtrováním
        const metrics = await readElectricalMetricsByDeviceIdFiltered(
            deviceId, 
            startDate, 
            endDate, 
            limit
        );
        
        res.status(200).json(metrics);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// API trasa pro získání environmentálních metrik pro konkrétní zařízení
app.get('/api/devices/:id/environmental-metrics', async (req, res) => {
    try {
        const deviceId = req.params.id;
        
        // Parsování parametrů pro filtrování
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
        
        // Kontrola existence zařízení
        const device = deviceManager.getDevice(deviceId);
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        
        // Načíst data z databáze s filtrováním
        const metrics = await readEnvironmentalMetricsByDeviceIdFiltered(
            deviceId, 
            startDate, 
            endDate, 
            limit
        );
        
        res.status(200).json(metrics);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// API trasa pro získání agregovaných elektrických metrik
app.get('/api/devices/:id/electrical-metrics/aggregated', async (req, res) => {
    try {
        const deviceId = req.params.id;
        
        // Parsování parametrů pro agregaci
        const timeRange = req.query.timeRange as string || 'day';
        const intervalMs = req.query.interval ? parseInt(req.query.interval as string) : 300000; // 5 minut jako výchozí
        
        // Kontrola existence zařízení
        const device = deviceManager.getDevice(deviceId);
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        
        // Definice začátku a konce časového intervalu
        const now = new Date();
        let startDate: Date;
        
        switch (timeRange) {
            case 'day':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 1);
                break;
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 1);
                break;
            default:
                startDate = new Date(now);
                startDate.setHours(now.getHours() - 1);
        }
        
        // Načíst data z databáze pro daný časový rozsah
        const rawMetrics = await readElectricalMetricsByDeviceIdFiltered(
            deviceId, 
            startDate, 
            now
        );
        
        // Agregovat data
        const aggregatedMetrics = aggregateElectricalMetrics(rawMetrics, intervalMs);
        
        res.status(200).json(aggregatedMetrics);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// API trasa pro získání agregovaných environmentálních metrik
app.get('/api/devices/:id/environmental-metrics/aggregated', async (req, res) => {
    try {
        const deviceId = req.params.id;
        
        // Parsování parametrů pro agregaci
        const timeRange = req.query.timeRange as string || 'day';
        const intervalMs = req.query.interval ? parseInt(req.query.interval as string) : 300000; // 5 minut jako výchozí
        
        // Kontrola existence zařízení
        const device = deviceManager.getDevice(deviceId);
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        
        // Definice začátku a konce časového intervalu
        const now = new Date();
        let startDate: Date;
        
        switch (timeRange) {
            case 'day':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 1);
                break;
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 1);
                break;
            default:
                startDate = new Date(now);
                startDate.setHours(now.getHours() - 1);
        }
        
        // Načíst data z databáze pro daný časový rozsah
        const rawMetrics = await readEnvironmentalMetricsByDeviceIdFiltered(
            deviceId, 
            startDate, 
            now
        );
        
        // Agregovat data
        const aggregatedMetrics = aggregateEnvironmentalMetrics(rawMetrics, intervalMs);
        
        res.status(200).json(aggregatedMetrics);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Socket.IO - zpracování připojení klientů
io.on('connection', (socket) => {
    console.log('Client connected');
    
    // Zaslání informací o všech zařízeních
    socket.emit('devices', deviceManager.getAllDevices().map(device => ({
        id: device.getId(),
        name: device.getName(),
        type: device.getType(),
        state: device.getState()
    })));
    
    // Přihlášení k odběru zpráv konkrétního zařízení
    socket.on('subscribe:device', async (deviceId: string) => {
        try {
            // Připojení k room pro toto zařízení
            socket.join(`device:${deviceId}`);
            
            // Získání zařízení
            const device = deviceManager.getDevice(deviceId);
            if (!device) {
                socket.emit('error', { message: 'Device not found' });
                return;
            }
            
            // Zaslání aktuálního stavu zařízení
            socket.emit('device:state', {
                id: device.getId(),
                name: device.getName(),
                type: device.getType(),
                state: device.getState()
            });
            
            // Zjistit typ zařízení a poslat odpovídající metriky
            const deviceType = device.getType();
            
            // Podle typu zařízení pošleme buď elektrické, environmentální nebo obojí metriky
            if (deviceType === 'shelly-plug-s') {
                // Elektrická zařízení - posíláme jen elektrické metriky
                const electricalMetrics = await readElectricalMetricsByDeviceIdFiltered(
                    deviceId,
                    new Date(Date.now() - 24 * 60 * 60 * 1000), // posledních 24 hodin
                    undefined,
                    100
                );
                
                socket.emit('device:metrics:history', electricalMetrics);
            } else if (deviceType === 'shellyht') {
                // Environmentální zařízení - posíláme jen environmentální metriky
                const environmentalMetrics = await readEnvironmentalMetricsByDeviceIdFiltered(
                    deviceId,
                    new Date(Date.now() - 24 * 60 * 60 * 1000), // posledních 24 hodin
                    undefined,
                    100
                );
                
                socket.emit('device:metrics:history', environmentalMetrics);
            } 
        } catch (error: any) {
            console.error(`Error handling device subscription: ${error.message}`);
            socket.emit('error', { message: error.message });
        }
    });
    
    // Ovládání zařízení
    socket.on('device:control', (data: { deviceId: string, command: string, params: any }) => {
        try {
            const { deviceId, command, params } = data;
            const device = deviceManager.getDevice(deviceId);
            
            if (!device) {
                socket.emit('error', { message: 'Device not found' });
                return;
            }
            
            // Získání dostupných příkazů pro zařízení
            const commands = device.getCommands();
            
            // Provedení příkazu
            switch (command) {
                case 'turnOnOff':
                    if (commands.togglePower) {
                        commands.togglePower(!!params.state);
                        socket.emit('device:control:ack', { deviceId, command, success: true });
                    } else {
                        socket.emit('error', { message: 'Command not supported by this device' });
                    }
                    break;
                //lze rozšířít do budoucna
                default:
                    socket.emit('error', { message: `Unknown command: ${command}` });
            }
        } catch (error: any) {
            console.error(`Error handling device control: ${error.message}`);
            socket.emit('error', { message: error.message });
        }
    });
    
    // Odpojení klienta
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Naslouchání událostem z DeviceManager
deviceManager.on('deviceStateChanged', (device) => {
    // Informování všech klientů přihlášených k danému zařízení
    io.to(`device:${device.getId()}`).emit('device:state', {
        id: device.getId(),
        name: device.getName(),
        type: device.getType(),
        state: device.getState()
    });
});

// Zpracování elektrických metrik
deviceManager.on('electricalMetrics', async (metrics) => {
    try {
        // Uložení metrik do databáze
        const result = await createElectricalMetrics(metrics);
        console.log(`Electrical metrics saved for device ${metrics.deviceId}, ID: ${result.id}`);
        
        // Informování klientů
        io.to(`device:${metrics.deviceId}`).emit('device:electrical-metrics:new', metrics);
    } catch (error: any) {
        console.error(`Error saving electrical metrics: ${error.message}`);
    }
});

// Zpracování environmentálních metrik
deviceManager.on('environmentalMetrics', async (metrics) => {
    try {
        // Uložení metrik do databáze
        const result = await createEnvironmentalMetrics(metrics);
        console.log(`Environmental metrics saved for device ${metrics.deviceId}, ID: ${result.id}`);
        
        // Informování klientů
        io.to(`device:${metrics.deviceId}`).emit('device:environmental-metrics:new', metrics);
    } catch (error: any) {
        console.error(`Error saving environmental metrics: ${error.message}`);
    }
});

deviceManager.on('deviceAdded', (device) => {
    // Informování všech klientů o novém zařízení
    io.emit('device:added', {
        id: device.getId(),
        name: device.getName(),
        type: device.getType()
    });
});

deviceManager.on('deviceRemoved', (deviceId) => {
    // Informování všech klientů o odebraném zařízení
    io.emit('device:removed', { id: deviceId });
});

// Načtení zařízení z databáze při startu serveru
const loadDevicesFromDatabase = async () => {
    try {
        // Načtení zařízení z databáze
        const devices = await readDevices();
        console.log(`Loaded ${devices.length} devices from database`);
        
        // Příprava konfigurací zařízení pro DeviceManager
        const configs: DeviceConfig[] = devices.map(device => ({
            id: device.id,
            name: device.name,
            type: device.type,
            mqttPrefix: device.mqttPrefix,
        }));
        
        // Načtení zařízení do DeviceManager
        deviceManager.loadDevices(configs);
    } catch (error: any) {
        console.error(`Error loading devices from database: ${error.message}`);
    }
};

// Funkce pro agregaci elektrických metrik podle časového intervalu
function aggregateElectricalMetrics(metrics: any[], intervalMs: number) {
    if (metrics.length === 0) {
        return [];
    }
  
    const aggregatedMetrics: any[] = [];
    let currentBucket: any[] = [];
    let bucketStartTime = new Date(metrics[0].timestamp).getTime();
    let bucketEndTime = bucketStartTime + intervalMs;
  
    for (const metric of metrics) {
        const metricTime = new Date(metric.timestamp).getTime();
        
        if (metricTime < bucketEndTime) {
            // Patří do aktuálního bucketu
            currentBucket.push(metric);
        } else {
            // Zpracovat aktuální bucket, pokud obsahuje nějaká data
            if (currentBucket.length > 0) {
                aggregatedMetrics.push(calculateAggregatedElectricalValues(currentBucket));
            }
            
            // Posunout časové okno dál
            while (metricTime >= bucketEndTime) {
                bucketStartTime = bucketEndTime;
                bucketEndTime = bucketStartTime + intervalMs;
            }
            
            // Začít nový bucket s aktuální metrikou
            currentBucket = [metric];
        }
    }
    
    // Zpracovat poslední bucket
    if (currentBucket.length > 0) {
        aggregatedMetrics.push(calculateAggregatedElectricalValues(currentBucket));
    }
    
    return aggregatedMetrics;
}

// Funkce pro agregaci environmentálních metrik podle časového intervalu
function aggregateEnvironmentalMetrics(metrics: any[], intervalMs: number) {
    if (metrics.length === 0) {
        return [];
    }
  
    const aggregatedMetrics: any[] = [];
    let currentBucket: any[] = [];
    let bucketStartTime = new Date(metrics[0].timestamp).getTime();
    let bucketEndTime = bucketStartTime + intervalMs;
  
    for (const metric of metrics) {
        const metricTime = new Date(metric.timestamp).getTime();
        
        if (metricTime < bucketEndTime) {
            // Patří do aktuálního bucketu
            currentBucket.push(metric);
        } else {
            // Zpracovat aktuální bucket, pokud obsahuje nějaká data
            if (currentBucket.length > 0) {
                aggregatedMetrics.push(calculateAggregatedEnvironmentalValues(currentBucket));
            }
            
            // Posunout časové okno dál
            while (metricTime >= bucketEndTime) {
                bucketStartTime = bucketEndTime;
                bucketEndTime = bucketStartTime + intervalMs;
            }
            
            // Začít nový bucket s aktuální metrikou
            currentBucket = [metric];
        }
    }
    
    // Zpracovat poslední bucket
    if (currentBucket.length > 0) {
        aggregatedMetrics.push(calculateAggregatedEnvironmentalValues(currentBucket));
    }
    
    return aggregatedMetrics;
}

// Pomocná funkce pro výpočet agregovaných elektrických hodnot
function calculateAggregatedElectricalValues(metrics: any[]) {
    // Inicializace počátečních hodnot
    let sumApower = 0;
    let sumVoltage = 0;
    let sumCurrent = 0;
    let sumTotal = 0;
    let validApowerCount = 0;
    let validVoltageCount = 0;
    let validCurrentCount = 0;
    let validTotalCount = 0;
    
    for (const metric of metrics) {
        // Zpracovat pouze platné hodnoty
        if (!isNaN(metric.apower)) {
            sumApower += metric.apower;
            validApowerCount++;
        }
        
        if (!isNaN(metric.voltage)) {
            sumVoltage += metric.voltage;
            validVoltageCount++;
        }
        
        if (!isNaN(metric.current)) {
            sumCurrent += metric.current;
            validCurrentCount++;
        }
        
        if (!isNaN(metric.total)) {
            sumTotal += metric.total;
            validTotalCount++;
        }
    }
    
    // Vypočítat průměry z platných hodnot
    const avgApower = validApowerCount > 0 ? sumApower / validApowerCount : 0;
    const avgVoltage = validVoltageCount > 0 ? sumVoltage / validVoltageCount : 0;
    const avgCurrent = validCurrentCount > 0 ? sumCurrent / validCurrentCount : 0;
    const total = validTotalCount > 0 ? sumTotal : avgApower * avgVoltage * avgCurrent;
    
    // Vrátit agregovanou metriku s časovou značkou prvního záznamu v bucketu
    return {
        deviceId: metrics[0].deviceId,
        timestamp: metrics[0].timestamp,
        apower: avgApower,
        voltage: avgVoltage,
        current: avgCurrent,
        total: total,
        sampleCount: metrics.length
    };
}

// Pomocná funkce pro výpočet agregovaných environmentálních hodnot
function calculateAggregatedEnvironmentalValues(metrics: any[]) {
    // Inicializace počátečních hodnot
    let sumTemperature = 0;
    let sumHumidity = 0;
    let validTemperatureCount = 0;
    let validHumidityCount = 0;
    
    for (const metric of metrics) {
        // Zpracovat pouze platné hodnoty
        if (!isNaN(metric.temperature)) {
            sumTemperature += metric.temperature;
            validTemperatureCount++;
        }
        
        if (!isNaN(metric.humidity)) {
            sumHumidity += metric.humidity;
            validHumidityCount++;
        }
    }
    
    // Vypočítat průměry z platných hodnot
    const avgTemperature = validTemperatureCount > 0 ? sumTemperature / validTemperatureCount : 0;
    const avgHumidity = validHumidityCount > 0 ? sumHumidity / validHumidityCount : 0;
    
    // Vrátit agregovanou metriku s časovou značkou prvního záznamu v bucketu
    return {
        deviceId: metrics[0].deviceId,
        timestamp: metrics[0].timestamp,
        temperature: avgTemperature,
        humidity: avgHumidity,
        sampleCount: metrics.length
    };
}

// Spuštění serveru
const PORT = process.env.PORT || 3001;

// Nejprve načíst zařízení z databáze, pak spustit server
loadDevicesFromDatabase().then(() => {
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(error => {
    console.error('Failed to start server:', error);
});

// Zachycení signálu ukončení procesu
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    
    try {
        // Zavření MQTT připojení
        await mqttService.close();
        
        // Zavření HTTP serveru
        server.close(() => {
            console.log('HTTP server closed');
            process.exit(0);
        });
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});