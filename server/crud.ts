import { db } from './database';
import { DeviceConfig } from './models/Device';

interface ElectricalMetrics {
    id?: number;
    deviceId: string;
    timestamp: string;
    apower: number;
    voltage: number;
    current: number;
    total: number;
}

interface EnvironmentalMetrics {
    id?: number;
    deviceId: string;
    timestamp: string;
    temperature: number;
    humidity: number;
}

interface Device {
    id: string;
    name: string;
    type: string;
    mqttPrefix: string;
}

// DEVICE CRUD OPERATIONS

// Create a new device
export const createDevice = (id: string, name: string, type: string, mqttPrefix: string): Promise<void> => {
    const sql = 'INSERT INTO Devices (id, name, type, mqttPrefix) VALUES (?, ?, ?, ?)';
    
    return new Promise<void>((resolve, reject) => {
        db.run(sql, [id, name, type, mqttPrefix], function(err: Error | null) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

// Read all devices
export const readDevices = (): Promise<Device[]> => {
    const sql = 'SELECT * FROM Devices';
    
    return new Promise<Device[]>((resolve, reject) => {
        db.all(sql, [], (err: Error | null, rows: any[]) => {
            if (err) {
                reject(err);
            } else {
                const devices = rows.map(row => ({
                    id: row.id,
                    name: row.name,
                    type: row.type,
                    mqttPrefix: row.mqttPrefix
                }));
                resolve(devices);
            }
        });
    });
};

// Read device by ID
export const readDeviceById = (id: string): Promise<Device | null> => {
    const sql = 'SELECT * FROM Devices WHERE id = ?';
    
    return new Promise<Device | null>((resolve, reject) => {
        db.get(sql, [id], (err: Error | null, row: any) => {
            if (err) {
                reject(err);
            } else if (!row) {
                resolve(null);
            } else {
                const device: Device = {
                    id: row.id,
                    name: row.name,
                    type: row.type,
                    mqttPrefix: row.mqttPrefix
                };
                resolve(device);
            }
        });
    });
};

// Update device
export const updateDevice = (id: string, name: string, type: string, mqttPrefix: string): Promise<void> => {
    const sql = 'UPDATE Devices SET name = ?, type = ?, mqttPrefix = ? WHERE id = ?';
    
    return new Promise<void>((resolve, reject) => {
        db.run(sql, [name, type, mqttPrefix, id], function(err: Error | null) {
            if (err) {
                reject(err);
            } else if (this.changes === 0) {
                reject(new Error('Device not found'));
            } else {
                resolve();
            }
        });
    });
};

// Delete device
export const deleteDevice = (id: string): Promise<void> => {
    const sql = 'DELETE FROM Devices WHERE id = ?';
    
    return new Promise<void>((resolve, reject) => {
        db.run(sql, [id], function(err: Error | null) {
            if (err) {
                reject(err);
            } else if (this.changes === 0) {
                reject(new Error('Device not found'));
            } else {
                resolve();
            }
        });
    });
};

// ELECTRICAL METRICS CRUD OPERATIONS

// Create new electrical metrics
export const createElectricalMetrics = (metrics: ElectricalMetrics): Promise<{ id: number }> => {
    const sql = 'INSERT INTO ElectricalMetrics (deviceId, timestamp, apower, voltage, current, total) VALUES (?, ?, ?, ?, ?, ?)';
    
    return new Promise<{ id: number }>((resolve, reject) => {
        db.run(
            sql, 
            [
                metrics.deviceId, 
                metrics.timestamp, 
                metrics.apower, 
                metrics.voltage, 
                metrics.current, 
                metrics.total
            ], 
            function(err: Error | null) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
                }
            }
        );
    });
};

// Read all electrical metrics
export const readElectricalMetrics = (): Promise<ElectricalMetrics[]> => {
    const sql = 'SELECT * FROM ElectricalMetrics';
    
    return new Promise<ElectricalMetrics[]>((resolve, reject) => {
        db.all(sql, [], (err: Error | null, rows: any[]) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// Read electrical metrics by device ID
export const readElectricalMetricsByDeviceId = (deviceId: string): Promise<ElectricalMetrics[]> => {
    const sql = 'SELECT * FROM ElectricalMetrics WHERE deviceId = ?';
    
    return new Promise<ElectricalMetrics[]>((resolve, reject) => {
        db.all(sql, [deviceId], (err: Error | null, rows: any[]) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// Read electrical metrics by device ID with date filtering
export const readElectricalMetricsByDeviceIdFiltered = (
    deviceId: string, 
    startDate?: Date, 
    endDate?: Date, 
    limit?: number
): Promise<ElectricalMetrics[]> => {
    let sql = 'SELECT * FROM ElectricalMetrics WHERE deviceId = ?';
    const params: any[] = [deviceId];
    
    if (startDate) {
        sql += ' AND datetime(timestamp) >= datetime(?)';
        params.push(startDate.toISOString());
    }
    
    if (endDate) {
        sql += ' AND datetime(timestamp) <= datetime(?)';
        params.push(endDate.toISOString());
    }
    
    sql += ' ORDER BY datetime(timestamp) ASC';
    
    if (limit && limit > 0) {
        sql += ' LIMIT ?';
        params.push(limit);
    }
    
    return new Promise<ElectricalMetrics[]>((resolve, reject) => {
        db.all(sql, params, (err: Error | null, rows: any[]) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// Update electrical metrics
export const updateElectricalMetrics = (id: number, metrics: ElectricalMetrics): Promise<void> => {
    const sql = 'UPDATE ElectricalMetrics SET deviceId = ?, timestamp = ?, apower = ?, voltage = ?, current = ?, total = ? WHERE id = ?';
    
    return new Promise<void>((resolve, reject) => {
        db.run(
            sql, 
            [
                metrics.deviceId, 
                metrics.timestamp, 
                metrics.apower, 
                metrics.voltage, 
                metrics.current, 
                metrics.total,
                id
            ], 
            function(err: Error | null) {
                if (err) {
                    reject(err);
                } else if (this.changes === 0) {
                    reject(new Error('Electrical metrics not found'));
                } else {
                    resolve();
                }
            }
        );
    });
};

// Delete electrical metrics
export const deleteElectricalMetrics = (id: number): Promise<void> => {
    const sql = 'DELETE FROM ElectricalMetrics WHERE id = ?';
    
    return new Promise<void>((resolve, reject) => {
        db.run(sql, [id], function(err: Error | null) {
            if (err) {
                reject(err);
            } else if (this.changes === 0) {
                reject(new Error('Electrical metrics not found'));
            } else {
                resolve();
            }
        });
    });
};

// Delete electrical metrics by device ID (useful when deleting a device)
export const deleteElectricalMetricsByDeviceId = (deviceId: string): Promise<void> => {
    const sql = 'DELETE FROM ElectricalMetrics WHERE deviceId = ?';
    
    return new Promise<void>((resolve, reject) => {
        db.run(sql, [deviceId], function(err: Error | null) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

// ENVIRONMENTAL METRICS CRUD OPERATIONS

// Create new environmental metrics
export const createEnvironmentalMetrics = (metrics: EnvironmentalMetrics): Promise<{ id: number }> => {
    const sql = 'INSERT INTO EnvironmentalMetrics (deviceId, timestamp, temperature, humidity) VALUES (?, ?, ?, ?)';
    
    return new Promise<{ id: number }>((resolve, reject) => {
        db.run(
            sql, 
            [
                metrics.deviceId, 
                metrics.timestamp, 
                metrics.temperature, 
                metrics.humidity
            ], 
            function(err: Error | null) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
                }
            }
        );
    });
};

// Read all environmental metrics
export const readEnvironmentalMetrics = (): Promise<EnvironmentalMetrics[]> => {
    const sql = 'SELECT * FROM EnvironmentalMetrics';
    
    return new Promise<EnvironmentalMetrics[]>((resolve, reject) => {
        db.all(sql, [], (err: Error | null, rows: any[]) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// Read environmental metrics by device ID
export const readEnvironmentalMetricsByDeviceId = (deviceId: string): Promise<EnvironmentalMetrics[]> => {
    const sql = 'SELECT * FROM EnvironmentalMetrics WHERE deviceId = ?';
    
    return new Promise<EnvironmentalMetrics[]>((resolve, reject) => {
        db.all(sql, [deviceId], (err: Error | null, rows: any[]) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// Read environmental metrics by device ID with date filtering
export const readEnvironmentalMetricsByDeviceIdFiltered = (
    deviceId: string, 
    startDate?: Date, 
    endDate?: Date, 
    limit?: number
): Promise<EnvironmentalMetrics[]> => {
    let sql = 'SELECT * FROM EnvironmentalMetrics WHERE deviceId = ?';
    const params: any[] = [deviceId];
    
    if (startDate) {
        sql += ' AND datetime(timestamp) >= datetime(?)';
        params.push(startDate.toISOString());
    }
    
    if (endDate) {
        sql += ' AND datetime(timestamp) <= datetime(?)';
        params.push(endDate.toISOString());
    }
    
    sql += ' ORDER BY datetime(timestamp) ASC';
    
    if (limit && limit > 0) {
        sql += ' LIMIT ?';
        params.push(limit);
    }
    
    return new Promise<EnvironmentalMetrics[]>((resolve, reject) => {
        db.all(sql, params, (err: Error | null, rows: any[]) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// Update environmental metrics
export const updateEnvironmentalMetrics = (id: number, metrics: EnvironmentalMetrics): Promise<void> => {
    const sql = 'UPDATE EnvironmentalMetrics SET deviceId = ?, timestamp = ?, temperature = ?, humidity = ? WHERE id = ?';
    
    return new Promise<void>((resolve, reject) => {
        db.run(
            sql, 
            [
                metrics.deviceId, 
                metrics.timestamp, 
                metrics.temperature, 
                metrics.humidity,
                id
            ], 
            function(err: Error | null) {
                if (err) {
                    reject(err);
                } else if (this.changes === 0) {
                    reject(new Error('Environmental metrics not found'));
                } else {
                    resolve();
                }
            }
        );
    });
};

// Delete environmental metrics
export const deleteEnvironmentalMetrics = (id: number): Promise<void> => {
    const sql = 'DELETE FROM EnvironmentalMetrics WHERE id = ?';
    
    return new Promise<void>((resolve, reject) => {
        db.run(sql, [id], function(err: Error | null) {
            if (err) {
                reject(err);
            } else if (this.changes === 0) {
                reject(new Error('Environmental metrics not found'));
            } else {
                resolve();
            }
        });
    });
};

// Delete environmental metrics by device ID (useful when deleting a device)
export const deleteEnvironmentalMetricsByDeviceId = (deviceId: string): Promise<void> => {
    const sql = 'DELETE FROM EnvironmentalMetrics WHERE deviceId = ?';
    
    return new Promise<void>((resolve, reject) => {
        db.run(sql, [deviceId], function(err: Error | null) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

// Delete all metrics for a device (both electrical and environmental)
export const deleteAllMetricsByDeviceId = (deviceId: string): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
        try {
            await deleteElectricalMetricsByDeviceId(deviceId);
            await deleteEnvironmentalMetricsByDeviceId(deviceId);
            resolve();
        } catch (error) {
            reject(error);
        }
    });
};