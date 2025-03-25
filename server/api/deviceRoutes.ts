import express from 'express';
import { DeviceManager } from '../services/DeviceManager';
import { MqttService } from '../services/MqttService';
import { createMetrics, readMetricsByDeviceId, createDevice, readDeviceById, readDevices, deleteDevice, updateDevice } from '../crud';
import { DeviceConfig } from '../models/Device';

export const createDeviceRoutes = (deviceManager: DeviceManager, mqttService: MqttService) => {
    const router = express.Router();

    // Získání seznamu všech zařízení
    router.get('/', (req, res) => {
        const devices = deviceManager.getAllDevices().map(device => ({
            id: device.getId(),
            name: device.getName(),
            type: device.getType(),
            state: device.getState()
        }));
        
        res.status(200).json(devices);
    });

    // Získání konkrétního zařízení
    router.get('/:id', (req, res) => {
        const device = deviceManager.getDevice(req.params.id);
        
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        
        res.status(200).json({
            id: device.getId(),
            name: device.getName(),
            type: device.getType(),
            state: device.getState()
        });
    });

    // Získání metrik pro konkrétní zařízení s možností filtrování a agregace
    router.get('/:id/metrics', async (req, res) => {
        try {
            const deviceId = req.params.id;
            
            // Parsování parametrů
            const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
            const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
            const interval = req.query.interval ? parseInt(req.query.interval as string) : undefined;
            
            // Kontrola existence zařízení
            const device = deviceManager.getDevice(deviceId);
            if (!device) {
                return res.status(404).json({ error: 'Device not found' });
            }
            
            // Načíst data z databáze s filtrováním a agregací
            const metrics = await readMetricsByDeviceId(deviceId, {
                startDate,
                endDate,
                limit,
                interval
            });
            
            res.status(200).json(metrics);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // Endpoint pro agregovaná data s předdefinovanými časovými rozsahy
    router.get('/:id/metrics/aggregated', async (req, res) => {
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
            
            // Načíst data z databáze s filtrováním a agregací
            const metrics = await readMetricsByDeviceId(deviceId, {
                startDate,
                endDate: now,
                interval: intervalMs
            });
            
            res.status(200).json(metrics);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // Přidání nového zařízení
    router.post('/', async (req, res) => {
        try {
            const { id, name, type, mqttTopic, capabilities } = req.body;
            
            if (!id || !name || !type || !mqttTopic) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            const config: DeviceConfig = {
                id,
                name,
                type,
                mqttTopic,
                capabilities: capabilities || []
            };
            
            // Uložit konfiguraci zařízení do databáze
            await createDevice(id, name, type, config);
            
            // Přidat zařízení do správce zařízení
            const device = deviceManager.addDevice(config);
            
            if (!device) {
                return res.status(400).json({ error: 'Failed to add device' });
            }
            
            // Přihlásit se k MQTT tématům pro nové zařízení
            await mqttService.subscribeToTopic(`${mqttTopic}/status/#`);
            
            res.status(201).json({
                id: device.getId(),
                name: device.getName(),
                type: device.getType()
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // Aktualizace existujícího zařízení
    router.put('/:id', async (req, res) => {
        try {
            const deviceId = req.params.id;
            const { name, mqttTopic, capabilities } = req.body;
            
            // Kontrola existence zařízení
            const existingDevice = await readDeviceById(deviceId);
            if (!existingDevice) {
                return res.status(404).json({ error: 'Device not found' });
            }
            
            // Získat aktuální konfiguraci
            const device = deviceManager.getDevice(deviceId);
            if (!device) {
                return res.status(404).json({ error: 'Device not found in device manager' });
            }
            
            // Aktualizovat konfiguraci
            const currentConfig = JSON.parse(existingDevice.config);
            const updatedConfig: DeviceConfig = {
                ...currentConfig,
                name: name || currentConfig.name,
                mqttTopic: mqttTopic || currentConfig.mqttTopic,
                capabilities: capabilities || currentConfig.capabilities
            };
            
            // Uložit aktualizovanou konfiguraci do databáze
            await updateDevice(deviceId, updatedConfig);
            
            // Aktualizovat zařízení ve správci zařízení
            const updated = deviceManager.updateDeviceConfig(deviceId, updatedConfig);
            
            if (!updated) {
                return res.status(400).json({ error: 'Failed to update device' });
            }
            
            // Pokud se změnilo MQTT téma, je potřeba se odhlásit od starého a přihlásit k novému
            if (mqttTopic && mqttTopic !== currentConfig.mqttTopic) {
                await mqttService.unsubscribeFromTopic(`${currentConfig.mqttTopic}/status/#`);
                await mqttService.subscribeToTopic(`${mqttTopic}/status/#`);
            }
            
            // Získat aktualizované zařízení
            const updatedDevice = deviceManager.getDevice(deviceId);
            
            if (!updatedDevice) {
                return res.status(500).json({ error: 'Failed to get updated device' });
            }
            
            res.status(200).json({
                id: updatedDevice.getId(),
                name: updatedDevice.getName(),
                type: updatedDevice.getType(),
                state: updatedDevice.getState()
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // Odstranění zařízení
    router.delete('/:id', async (req, res) => {
        try {
            const deviceId = req.params.id;
            
            // Kontrola existence zařízení
            const existingDevice = await readDeviceById(deviceId);
            if (!existingDevice) {
                return res.status(404).json({ error: 'Device not found' });
            }
            
            // Získat aktuální konfiguraci pro MQTT téma
            const device = deviceManager.getDevice(deviceId);
            if (!device) {
                return res.status(404).json({ error: 'Device not found in device manager' });
            }
            
            const mqttTopic = device.getMqttTopic();
            
            // Odstranit zařízení z databáze
            await deleteDevice(deviceId);
            
            // Odstranit zařízení ze správce zařízení
            // Poznámka: Toto by vyžadovalo implementaci metody removeDevice v DeviceManager
            // Pro jednoduchost předpokládáme, že taková metoda existuje
            const removed = deviceManager.removeDevice(deviceId);
            
            if (!removed) {
                return res.status(400).json({ error: 'Failed to remove device' });
            }
            
            // Odhlásit se od MQTT témat pro toto zařízení
            await mqttService.unsubscribeFromTopic(`${mqttTopic}/status/#`);
            
            res.status(200).json({ success: true, message: `Device ${deviceId} successfully removed` });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // Odeslání příkazu zařízení
    router.post('/:id/command', async (req, res) => {
        try {
            const deviceId = req.params.id;
            const { command, params } = req.body;
            
            if (!command) {
                return res.status(400).json({ error: 'Command is required' });
            }
            
            // Kontrola existence zařízení
            const device = deviceManager.getDevice(deviceId);
            if (!device) {
                return res.status(404).json({ error: 'Device not found' });
            }
            
            // Získat dostupné příkazy pro zařízení
            const commands = device.getCommands();
            
            // Kontrola, zda zařízení podporuje požadovaný příkaz
            if (!commands[command]) {
                return res.status(400).json({ error: `Device does not support command: ${command}` });
            }
            
            // Vykonat příkaz s parametry
            try {
                const result = await commands[command](...(params || []));
                res.status(200).json({ success: true, result });
            } catch (commandError: any) {
                res.status(400).json({ error: `Command execution failed: ${commandError.message}` });
            }
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // Získání seznamu schopností zařízení
    router.get('/:id/capabilities', (req, res) => {
        const deviceId = req.params.id;
        
        // Kontrola existence zařízení
        const device = deviceManager.getDevice(deviceId);
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        
        // Získat schopnosti zařízení
        const capabilities = device.getCapabilities();
        
        // Získat dostupné příkazy
        const commands = Object.keys(device.getCommands());
        
        res.status(200).json({
            capabilities,
            commands
        });
    });

    // Získání aktuálního stavu zařízení
    router.get('/:id/state', (req, res) => {
        const deviceId = req.params.id;
        
        // Kontrola existence zařízení
        const device = deviceManager.getDevice(deviceId);
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        
        // Získat aktuální stav zařízení
        const state = device.getState();
        
        res.status(200).json(state);
    });

    return router;
};

// Pomocná funkce pro filtrování metrik podle data
async function readMetricsByDeviceIdFiltered(
    deviceId: string, 
    startDate?: Date, 
    endDate?: Date, 
    limit?: number
) {
    // Tato funkce by měla být implementována v CRUD modulu
    // Zde je zjednodušená implementace pro demonstraci
    let metrics = await readMetricsByDeviceId(deviceId);
    
    if (startDate) {
        metrics = metrics.filter(metric => 
            new Date(metric.timestamp) >= startDate
        );
    }
    
    if (endDate) {
        metrics = metrics.filter(metric => 
            new Date(metric.timestamp) <= endDate
        );
    }
    
    // Seřadit podle času vzestupně
    metrics.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Aplikovat limit, pokud je definován
    if (limit && limit > 0) {
        metrics = metrics.slice(0, limit);
    }
    
    return metrics;
}

// Funkce pro agregaci metrik podle časového intervalu
function aggregateMetrics(metrics: any[], intervalMs: number) {
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
                aggregatedMetrics.push(calculateAggregatedValues(currentBucket));
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
        aggregatedMetrics.push(calculateAggregatedValues(currentBucket));
    }
    
    return aggregatedMetrics;
}

// Pomocná funkce pro výpočet agregovaných hodnot
function calculateAggregatedValues(metrics: any[]) {
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
        temperature: metrics[0].temperature,
        humidity: metrics[0].humidity,
        sampleCount: metrics.length
    };
}
