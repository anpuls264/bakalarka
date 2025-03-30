import express from 'express';
import { DeviceManager } from '../services/DeviceManager';
import { MqttService } from '../services/MqttService';
import { createElectricalMetrics, createEnvironmentalMetrics, readElectricalMetricsByDeviceId, readEnvironmentalMetricsByDeviceId, createDevice, readDeviceById, readDevices, deleteDevice } from '../crud';
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

    // Získání elektrických metrik pro konkrétní zařízení s možností filtrování
    router.get('/:id/electrical-metrics', async (req, res) => {
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

    // Získání environmentálních metrik pro konkrétní zařízení s možností filtrování
    router.get('/:id/environmental-metrics', async (req, res) => {
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

    // Nový endpoint pro agregovaná elektrická data
    router.get('/:id/electrical-metrics/aggregated', async (req, res) => {
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
            
            // Agregovat data na serveru
            const aggregatedMetrics = aggregateElectricalMetrics(rawMetrics, intervalMs);
            
            res.status(200).json(aggregatedMetrics);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // Nový endpoint pro agregovaná environmentální data
    router.get('/:id/environmental-metrics/aggregated', async (req, res) => {
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
            
            // Agregovat data na serveru
            const aggregatedMetrics = aggregateEnvironmentalMetrics(rawMetrics, intervalMs);
            
            res.status(200).json(aggregatedMetrics);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // Přidání nového zařízení
    router.post('/', async (req, res) => {
        try {
            const { id, name, type, mqttPrefix } = req.body;
            
            if (!id || !name || !type || !mqttPrefix) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            const config: DeviceConfig = {
                id,
                name,
                type,
                mqttPrefix,
            };
            
            // Uložit konfiguraci zařízení do databáze
            await createDevice(id, name, type, mqttPrefix);
            
            // Přidat zařízení do správce zařízení
            const device = deviceManager.addDevice(config);
            
            if (!device) {
                return res.status(400).json({ error: 'Failed to add device' });
            }
            
            // Přihlásit se k MQTT tématům pro nové zařízení
            await mqttService.subscribeToTopic(`${mqttPrefix}/status/#`);
            
            res.status(201).json({
                id: device.getId(),
                name: device.getName(),
                type: device.getType()
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // Ostatní endpointy zůstávají beze změny...

    return router;
};

// Pomocná funkce pro filtrování elektrických metrik podle data
async function readElectricalMetricsByDeviceIdFiltered(
    deviceId: string, 
    startDate?: Date, 
    endDate?: Date, 
    limit?: number
) {
    // Tato funkce by měla být implementována v CRUD modulu
    // Zde je zjednodušená implementace pro demonstraci
    let metrics = await readElectricalMetricsByDeviceId(deviceId);
    
    if (startDate) {
        metrics = metrics.filter((metric: { timestamp: string | number | Date; }) => 
            new Date(metric.timestamp) >= startDate
        );
    }
    
    if (endDate) {
        metrics = metrics.filter((metric: { timestamp: string | number | Date; }) => 
            new Date(metric.timestamp) <= endDate
        );
    }
    
    // Seřadit podle času vzestupně
    metrics.sort((a: { timestamp: string | number | Date; }, b: { timestamp: string | number | Date; }) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Aplikovat limit, pokud je definován
    if (limit && limit > 0) {
        metrics = metrics.slice(0, limit);
    }
    
    return metrics;
}

// Pomocná funkce pro filtrování environmentálních metrik podle data
async function readEnvironmentalMetricsByDeviceIdFiltered(
    deviceId: string, 
    startDate?: Date, 
    endDate?: Date, 
    limit?: number
) {
    // Tato funkce by měla být implementována v CRUD modulu
    // Zde je zjednodušená implementace pro demonstraci
    let metrics = await readEnvironmentalMetricsByDeviceId(deviceId);
    
    if (startDate) {
        metrics = metrics.filter((metric: { timestamp: string | number | Date; }) => 
            new Date(metric.timestamp) >= startDate
        );
    }
    
    if (endDate) {
        metrics = metrics.filter((metric: { timestamp: string | number | Date; }) => 
            new Date(metric.timestamp) <= endDate
        );
    }
    
    // Seřadit podle času vzestupně
    metrics.sort((a: { timestamp: string | number | Date; }, b: { timestamp: string | number | Date; }) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Aplikovat limit, pokud je definován
    if (limit && limit > 0) {
        metrics = metrics.slice(0, limit);
    }
    
    return metrics;
}

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