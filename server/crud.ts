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
    
    return new Promise<DeviceData[]>((resolve, reject) => {
        db.all(sql, [], (err: Error | null, rows: any[]) => {
            if (err) {
                reject(err);
            } else {
                // Převést config z JSON string na objekt
                const devices = rows.map(row => ({
                    ...row,
                    config: JSON.parse(row.config)
                }));
                resolve(devices);
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
                resolve({
                    ...row,
                    config: JSON.parse(row.config)
                });
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

// READ - Načtení metrik pro konkrétní zařízení
export const readMetricsByDeviceId = (deviceId: string): Promise<DeviceMetrics[]> => {
    const sql = 'SELECT * FROM DeviceMetrics WHERE deviceId = ? ORDER BY timestamp';
    
    return new Promise<DeviceMetrics[]>((resolve, reject) => {
        db.all(sql, [deviceId], (err: Error | null, rows: any[]) => {
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
