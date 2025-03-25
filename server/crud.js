"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readItems = exports.createItem = exports.deleteMetricsByDeviceId = exports.readAllMetrics = exports.readMetricsByDeviceId = exports.createMetrics = exports.deleteDevice = exports.updateDevice = exports.readDeviceById = exports.readDevices = exports.createDevice = void 0;
const database_1 = require("./database");
// CREATE - Uložení zařízení
const createDevice = (id, name, type, config) => {
    const sql = 'INSERT OR REPLACE INTO Devices (id, name, type, config) VALUES (?, ?, ?, ?)';
    return new Promise((resolve, reject) => {
        database_1.db.run(sql, [id, name, type, JSON.stringify(config)], function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve({ id });
            }
        });
    });
};
exports.createDevice = createDevice;
// READ - Načtení všech zařízení
const readDevices = () => {
    const sql = 'SELECT * FROM Devices';
    console.log("kek");
    return new Promise((resolve, reject) => {
        database_1.db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
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
                        }
                        catch (parseError) {
                            console.error(`Error parsing config for device ${row.id}: ${parseError.message}`);
                            console.error('Invalid config:', row.config);
                            return row; // Return row as is, let the caller handle the invalid JSON
                        }
                    });
                    resolve(devices);
                }
                catch (error) {
                    console.error('Error processing devices:', error);
                    reject(error);
                }
            }
        });
    });
};
exports.readDevices = readDevices;
// READ - Načtení konkrétního zařízení podle ID
const readDeviceById = (id) => {
    const sql = 'SELECT * FROM Devices WHERE id = ?';
    return new Promise((resolve, reject) => {
        database_1.db.get(sql, [id], (err, row) => {
            if (err) {
                reject(err);
            }
            else if (!row) {
                resolve(null);
            }
            else {
                try {
                    // Validate that config is a string before parsing
                    if (typeof row.config !== 'string') {
                        console.error(`Device ${row.id}: config is not a string, it's a ${typeof row.config}`);
                        resolve(row); // Return row as is
                    }
                    else {
                        // Try to parse the config to validate it's valid JSON, but keep it as a string
                        try {
                            JSON.parse(row.config); // Just to validate
                            resolve(row);
                        }
                        catch (parseError) {
                            console.error(`Error parsing config for device ${row.id}: ${parseError.message}`);
                            console.error('Invalid config:', row.config);
                            resolve(row); // Return row as is, let the caller handle the invalid JSON
                        }
                    }
                }
                catch (error) {
                    console.error(`Error processing device ${id}: ${error.message}`);
                    reject(error);
                }
            }
        });
    });
};
exports.readDeviceById = readDeviceById;
// UPDATE - Aktualizace zařízení
const updateDevice = (id, config) => {
    const sql = 'UPDATE Devices SET config = ? WHERE id = ?';
    return new Promise((resolve, reject) => {
        database_1.db.run(sql, [JSON.stringify(config), id], function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
};
exports.updateDevice = updateDevice;
// DELETE - Odstranění zařízení
const deleteDevice = (id) => {
    const sql = 'DELETE FROM Devices WHERE id = ?';
    return new Promise((resolve, reject) => {
        database_1.db.run(sql, [id], function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
};
exports.deleteDevice = deleteDevice;
// CREATE - Uložení metrik zařízení
const createMetrics = (metrics) => {
    const { deviceId, timestamp, apower, voltage, current, total, temperature, humidity } = metrics;
    const sql = 'INSERT INTO DeviceMetrics (deviceId, timestamp, apower, voltage, current, total, temperature, humidity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    return new Promise((resolve, reject) => {
        database_1.db.run(sql, [deviceId, timestamp, apower, voltage, current, total, temperature, humidity], function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve({ id: this.lastID });
            }
        });
    });
};
exports.createMetrics = createMetrics;
// READ - Načtení metrik pro konkrétní zařízení s filtrováním a agregací na úrovni databáze
const readMetricsByDeviceId = (deviceId, options) => {
    let sql = 'SELECT ';
    const params = [deviceId];
    if (options === null || options === void 0 ? void 0 : options.groupBy) {
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
    }
    else if (options === null || options === void 0 ? void 0 : options.interval) {
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
    }
    else {
        // Bez agregace vracíme všechny sloupce
        sql += '* ';
    }
    sql += 'FROM DeviceMetrics WHERE deviceId = ?';
    if (options === null || options === void 0 ? void 0 : options.startDate) {
        sql += ' AND timestamp >= ?';
        params.push(options.startDate.toISOString());
    }
    if (options === null || options === void 0 ? void 0 : options.endDate) {
        sql += ' AND timestamp <= ?';
        params.push(options.endDate.toISOString());
    }
    if (options === null || options === void 0 ? void 0 : options.groupBy) {
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
    }
    else if (options === null || options === void 0 ? void 0 : options.interval) {
        // Standardní intervalové seskupení
        sql += ' GROUP BY deviceId, datetime((strftime(\'%s\', timestamp) - (strftime(\'%s\', timestamp) % (? / 1000))) || \' seconds\')';
        params.push(options.interval);
    }
    sql += ' ORDER BY timestamp';
    if (options === null || options === void 0 ? void 0 : options.limit) {
        sql += ' LIMIT ?';
        params.push(options.limit);
    }
    return new Promise((resolve, reject) => {
        database_1.db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        });
    });
};
exports.readMetricsByDeviceId = readMetricsByDeviceId;
// READ - Načtení všech metrik
const readAllMetrics = () => {
    const sql = 'SELECT * FROM DeviceMetrics ORDER BY timestamp';
    return new Promise((resolve, reject) => {
        database_1.db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        });
    });
};
exports.readAllMetrics = readAllMetrics;
// DELETE - Odstranění metrik pro konkrétní zařízení
const deleteMetricsByDeviceId = (deviceId) => {
    const sql = 'DELETE FROM DeviceMetrics WHERE deviceId = ?';
    return new Promise((resolve, reject) => {
        database_1.db.run(sql, [deviceId], function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
};
exports.deleteMetricsByDeviceId = deleteMetricsByDeviceId;
// Pro zpětnou kompatibilitu
const createItem = (timestamp, apower, voltage, current, total) => {
    return (0, exports.createMetrics)({
        deviceId: 'shelly1', // Výchozí ID pro zpětnou kompatibilitu
        timestamp,
        apower,
        voltage,
        current,
        total
    });
};
exports.createItem = createItem;
// Pro zpětnou kompatibilitu
const readItems = (callback) => {
    (0, exports.readAllMetrics)()
        .then(items => callback(null, items))
        .catch(err => callback(err, null));
};
exports.readItems = readItems;
