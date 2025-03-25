import { db } from './database';

// Rozhraní pro metriky zařízení
export interface DeviceMetrics {
    id?: number;
    deviceId: string;
    timestamp: string;
    apower?: number;
    voltage?: number;
    current?: number;
    total?: number;
    temperature?: number;
    humidity?: number;
}

// Rozhraní pro zařízení
export interface DeviceData {
    id: string;
    name: string;
    type: string;
    config: string;
}

// CREATE - Uložení zařízení
export const createDevice = (id: string, name: string, type: string, config: object): Promise<{ id: string }> => {
    const sql = 'INSERT OR REPLACE INTO Devices (id, name, type, config) VALUES (?, ?, ?, ?)';
    
    return new Promise<{ id: string }>((resolve, reject) => {
        db.run(sql, [id, name, type, JSON.stringify(config)], function (err: Error | null) {
            if (err) {
                reject(err);
            } else {
                resolve({ id });
            }
        });
    });
};

// READ - Načtení všech zařízení
export const readDevices = (): Promise<DeviceData[]> => {
    const sql = 'SELECT * FROM Devices';
    console.log("kek");
    
    return new Promise<DeviceData[]>((resolve, reject) => {
        db.all(sql, [], (err: Error | null, rows: any[]) => {
            if (err) {
                reject(err);
            } else {
                try {
                    // Převést config z JSON string na objekt, ale zachovat jako string v DeviceData
                    const devices = rows.map(row => {
                        try {
                            console.log("kek");
                            // Validate that config is a string before parsing
                            if (typeof row.config !== 'string') {
                                console.error(`Device ${row.id}: config is not a string, it's a ${typeof row.config}`);
                                return row; // Return row as is
                            }
                            console.log(row.config);
                            console.log("kek");
                            // Try to parse the config to validate it's valid JSON, but keep it as a string
                            JSON.parse(row.config); // Just to validate
                            return row;
                        } catch (parseError: any) {
                            console.error(`Error parsing config for device ${row.id}: ${parseError.message}`);
                            console.error('Invalid config:', row.config);
                            return row; // Return row as is, let the caller handle the invalid JSON
                        }
                    });
                    resolve(devices);
                } catch (error) {
                    console.error('Error processing devices:', error);
                    reject(error);
                }
            }
        });
    });
};

// READ - Načtení konkrétního zařízení podle ID
export const readDeviceById = (id: string): Promise<DeviceData | null> => {
    const sql = 'SELECT * FROM Devices WHERE id = ?';
    
    return new Promise<DeviceData | null>((resolve, reject) => {
        db.get(sql, [id], (err: Error | null, row: any) => {
            if (err) {
                reject(err);
            } else if (!row) {
                resolve(null);
            } else {
                try {
                    // Validate that config is a string before parsing
                    if (typeof row.config !== 'string') {
                        console.error(`Device ${row.id}: config is not a string, it's a ${typeof row.config}`);
                        resolve(row); // Return row as is
                    } else {
                        // Try to parse the config to validate it's valid JSON, but keep it as a string
                        try {
                            JSON.parse(row.config); // Just to validate
                            resolve(row);
                        } catch (parseError: any) {
                            console.error(`Error parsing config for device ${row.id}: ${parseError.message}`);
                            console.error('Invalid config:', row.config);
                            resolve(row); // Return row as is, let the caller handle the invalid JSON
                        }
                    }
                } catch (error: any) {
                    console.error(`Error processing device ${id}: ${error.message}`);
                    reject(error);
                }
            }
        });
    });
};

// UPDATE - Aktualizace zařízení
export const updateDevice = (id: string, config: object): Promise<void> => {
    const sql = 'UPDATE Devices SET config = ? WHERE id = ?';
    
    return new Promise<void>((resolve, reject) => {
        db.run(sql, [JSON.stringify(config), id], function (err: Error | null) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

// DELETE - Odstranění zařízení
export const deleteDevice = (id: string): Promise<void> => {
    const sql = 'DELETE FROM Devices WHERE id = ?';
    
    return new Promise<void>((resolve, reject) => {
        db.run(sql, [id], function (err: Error | null) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

// CREATE - Uložení metrik zařízení
export const createMetrics = (metrics: DeviceMetrics): Promise<{ id: number }> => {
    const { deviceId, timestamp, apower, voltage, current, total, temperature, humidity } = metrics;
    const sql = 'INSERT INTO DeviceMetrics (deviceId, timestamp, apower, voltage, current, total, temperature, humidity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    
    return new Promise<{ id: number }>((resolve, reject) => {
        db.run(sql, [deviceId, timestamp, apower, voltage, current, total, temperature, humidity], function (err: Error | null) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID });
            }
        });
    });
};

// READ - Načtení metrik pro konkrétní zařízení s filtrováním a agregací na úrovni databáze
export const readMetricsByDeviceId = (
    deviceId: string,
    options?: {
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        interval?: number; // interval v milisekundách pro agregaci
        groupBy?: 'hour' | 'day' | 'week' | 'month'; // pro ColumnChart
    }
): Promise<DeviceMetrics[]> => {
    let sql = 'SELECT ';
    const params: any[] = [deviceId];

    if (options?.groupBy) {
        // Speciální agregace pro ColumnChart
        switch (options.groupBy) {
            case 'hour':
                sql += `
                    deviceId,
                    strftime('%H:00', timestamp) as time,
                    SUM(total) as total,
                    COUNT(*) as sampleCount
                `;
                break;
            case 'day':
                sql += `
                    deviceId,
                    CASE strftime('%w', timestamp)
                        WHEN '0' THEN 'Ne'
                        WHEN '1' THEN 'Po'
                        WHEN '2' THEN 'Út'
                        WHEN '3' THEN 'St'
                        WHEN '4' THEN 'Čt'
                        WHEN '5' THEN 'Pá'
                        WHEN '6' THEN 'So'
                    END as time,
                    SUM(total) as total,
                    COUNT(*) as sampleCount
                `;
                break;
            case 'month':
                sql += `
                    deviceId,
                    strftime('%d', timestamp) as time,
                    SUM(total) as total,
                    COUNT(*) as sampleCount
                `;
                break;
        }
    } else if (options?.interval) {
        // Standardní intervalová agregace
        sql += `
            deviceId,
            datetime((strftime('%s', timestamp) - (strftime('%s', timestamp) % (? / 1000))) || ' seconds') as timestamp,
            AVG(apower) as apower,
            AVG(voltage) as voltage,
            AVG(current) as current,
            MAX(total) as total,
            AVG(temperature) as temperature,
            AVG(humidity) as humidity,
            COUNT(*) as sampleCount
        `;
        params.push(options.interval);
    } else {
        // Bez agregace vracíme všechny sloupce
        sql += '* ';
    }

    sql += 'FROM DeviceMetrics WHERE deviceId = ?';

    if (options?.startDate) {
        sql += ' AND timestamp >= ?';
        params.push(options.startDate.toISOString());
    }

    if (options?.endDate) {
        sql += ' AND timestamp <= ?';
        params.push(options.endDate.toISOString());
    }

    if (options?.groupBy) {
        // Seskupení podle časového období
        switch (options.groupBy) {
            case 'hour':
                sql += ' GROUP BY deviceId, strftime(\'%H\', timestamp)';
                break;
            case 'day':
                sql += ' GROUP BY deviceId, strftime(\'%w\', timestamp)';
                break;
            case 'month':
                sql += ' GROUP BY deviceId, strftime(\'%d\', timestamp)';
                break;
        }
    } else if (options?.interval) {
        // Standardní intervalové seskupení
        sql += ' GROUP BY deviceId, datetime((strftime(\'%s\', timestamp) - (strftime(\'%s\', timestamp) % (? / 1000))) || \' seconds\')';
        params.push(options.interval);
    }

    sql += ' ORDER BY timestamp';

    if (options?.limit) {
        sql += ' LIMIT ?';
        params.push(options.limit);
    }

    return new Promise<DeviceMetrics[]>((resolve, reject) => {
        db.all(sql, params, (err: Error | null, rows: any[]) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// READ - Načtení všech metrik
export const readAllMetrics = (): Promise<DeviceMetrics[]> => {
    const sql = 'SELECT * FROM DeviceMetrics ORDER BY timestamp';
    
    return new Promise<DeviceMetrics[]>((resolve, reject) => {
        db.all(sql, [], (err: Error | null, rows: any[]) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// DELETE - Odstranění metrik pro konkrétní zařízení
export const deleteMetricsByDeviceId = (deviceId: string): Promise<void> => {
    const sql = 'DELETE FROM DeviceMetrics WHERE deviceId = ?';
    
    return new Promise<void>((resolve, reject) => {
        db.run(sql, [deviceId], function (err: Error | null) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

// Pro zpětnou kompatibilitu
export const createItem = (timestamp: string, apower: number, voltage: number, current: number, total: number): Promise<{ id: number }> => {
    return createMetrics({
        deviceId: 'shelly1', // Výchozí ID pro zpětnou kompatibilitu
        timestamp,
        apower,
        voltage,
        current,
        total
    });
};

// Pro zpětnou kompatibilitu
export const readItems = (callback: (err: Error | null, items: DeviceMetrics[] | null) => void): void => {
    readAllMetrics()
        .then(items => callback(null, items))
        .catch(err => callback(err, null));
};
