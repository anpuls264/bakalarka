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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllMetricsByDeviceId = exports.deleteEnvironmentalMetricsByDeviceId = exports.deleteEnvironmentalMetrics = exports.updateEnvironmentalMetrics = exports.readEnvironmentalMetricsByDeviceIdFiltered = exports.readEnvironmentalMetricsByDeviceId = exports.readEnvironmentalMetrics = exports.createEnvironmentalMetrics = exports.deleteElectricalMetricsByDeviceId = exports.deleteElectricalMetrics = exports.updateElectricalMetrics = exports.readElectricalMetricsByDeviceIdFiltered = exports.readElectricalMetricsByDeviceId = exports.readElectricalMetrics = exports.createElectricalMetrics = exports.deleteDevice = exports.updateDevice = exports.readDeviceById = exports.readDevices = exports.createDevice = void 0;
const database_1 = require("./database");
// DEVICE CRUD OPERATIONS
// Create a new device
const createDevice = (id, name, type, mqttPrefix) => {
    const sql = 'INSERT INTO Devices (id, name, type, mqttPrefix) VALUES (?, ?, ?, ?)';
    return new Promise((resolve, reject) => {
        database_1.db.run(sql, [id, name, type, mqttPrefix], function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
};
exports.createDevice = createDevice;
// Read all devices
const readDevices = () => {
    const sql = 'SELECT * FROM Devices';
    return new Promise((resolve, reject) => {
        database_1.db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
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
exports.readDevices = readDevices;
// Read device by ID
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
                const device = {
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
exports.readDeviceById = readDeviceById;
// Update device
const updateDevice = (id, name, type, mqttPrefix) => {
    const sql = 'UPDATE Devices SET name = ?, type = ?, mqttPrefix = ? WHERE id = ?';
    return new Promise((resolve, reject) => {
        database_1.db.run(sql, [name, type, mqttPrefix, id], function (err) {
            if (err) {
                reject(err);
            }
            else if (this.changes === 0) {
                reject(new Error('Device not found'));
            }
            else {
                resolve();
            }
        });
    });
};
exports.updateDevice = updateDevice;
// Delete device
const deleteDevice = (id) => {
    const sql = 'DELETE FROM Devices WHERE id = ?';
    return new Promise((resolve, reject) => {
        database_1.db.run(sql, [id], function (err) {
            if (err) {
                reject(err);
            }
            else if (this.changes === 0) {
                reject(new Error('Device not found'));
            }
            else {
                resolve();
            }
        });
    });
};
exports.deleteDevice = deleteDevice;
// ELECTRICAL METRICS CRUD OPERATIONS
// Create new electrical metrics
const createElectricalMetrics = (metrics) => {
    const sql = 'INSERT INTO ElectricalMetrics (deviceId, timestamp, apower, voltage, current, total) VALUES (?, ?, ?, ?, ?, ?)';
    return new Promise((resolve, reject) => {
        database_1.db.run(sql, [
            metrics.deviceId,
            metrics.timestamp,
            metrics.apower,
            metrics.voltage,
            metrics.current,
            metrics.total
        ], function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve({ id: this.lastID });
            }
        });
    });
};
exports.createElectricalMetrics = createElectricalMetrics;
// Read all electrical metrics
const readElectricalMetrics = () => {
    const sql = 'SELECT * FROM ElectricalMetrics';
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
exports.readElectricalMetrics = readElectricalMetrics;
// Read electrical metrics by device ID
const readElectricalMetricsByDeviceId = (deviceId) => {
    const sql = 'SELECT * FROM ElectricalMetrics WHERE deviceId = ?';
    return new Promise((resolve, reject) => {
        database_1.db.all(sql, [deviceId], (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        });
    });
};
exports.readElectricalMetricsByDeviceId = readElectricalMetricsByDeviceId;
// Read electrical metrics by device ID with date filtering
const readElectricalMetricsByDeviceIdFiltered = (deviceId, startDate, endDate, limit) => {
    let sql = 'SELECT * FROM ElectricalMetrics WHERE deviceId = ?';
    const params = [deviceId];
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
exports.readElectricalMetricsByDeviceIdFiltered = readElectricalMetricsByDeviceIdFiltered;
// Update electrical metrics
const updateElectricalMetrics = (id, metrics) => {
    const sql = 'UPDATE ElectricalMetrics SET deviceId = ?, timestamp = ?, apower = ?, voltage = ?, current = ?, total = ? WHERE id = ?';
    return new Promise((resolve, reject) => {
        database_1.db.run(sql, [
            metrics.deviceId,
            metrics.timestamp,
            metrics.apower,
            metrics.voltage,
            metrics.current,
            metrics.total,
            id
        ], function (err) {
            if (err) {
                reject(err);
            }
            else if (this.changes === 0) {
                reject(new Error('Electrical metrics not found'));
            }
            else {
                resolve();
            }
        });
    });
};
exports.updateElectricalMetrics = updateElectricalMetrics;
// Delete electrical metrics
const deleteElectricalMetrics = (id) => {
    const sql = 'DELETE FROM ElectricalMetrics WHERE id = ?';
    return new Promise((resolve, reject) => {
        database_1.db.run(sql, [id], function (err) {
            if (err) {
                reject(err);
            }
            else if (this.changes === 0) {
                reject(new Error('Electrical metrics not found'));
            }
            else {
                resolve();
            }
        });
    });
};
exports.deleteElectricalMetrics = deleteElectricalMetrics;
// Delete electrical metrics by device ID (useful when deleting a device)
const deleteElectricalMetricsByDeviceId = (deviceId) => {
    const sql = 'DELETE FROM ElectricalMetrics WHERE deviceId = ?';
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
exports.deleteElectricalMetricsByDeviceId = deleteElectricalMetricsByDeviceId;
// ENVIRONMENTAL METRICS CRUD OPERATIONS
// Create new environmental metrics
const createEnvironmentalMetrics = (metrics) => {
    const sql = 'INSERT INTO EnvironmentalMetrics (deviceId, timestamp, temperature, humidity) VALUES (?, ?, ?, ?)';
    return new Promise((resolve, reject) => {
        database_1.db.run(sql, [
            metrics.deviceId,
            metrics.timestamp,
            metrics.temperature,
            metrics.humidity
        ], function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve({ id: this.lastID });
            }
        });
    });
};
exports.createEnvironmentalMetrics = createEnvironmentalMetrics;
// Read all environmental metrics
const readEnvironmentalMetrics = () => {
    const sql = 'SELECT * FROM EnvironmentalMetrics';
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
exports.readEnvironmentalMetrics = readEnvironmentalMetrics;
// Read environmental metrics by device ID
const readEnvironmentalMetricsByDeviceId = (deviceId) => {
    const sql = 'SELECT * FROM EnvironmentalMetrics WHERE deviceId = ?';
    return new Promise((resolve, reject) => {
        database_1.db.all(sql, [deviceId], (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        });
    });
};
exports.readEnvironmentalMetricsByDeviceId = readEnvironmentalMetricsByDeviceId;
// Read environmental metrics by device ID with date filtering
const readEnvironmentalMetricsByDeviceIdFiltered = (deviceId, startDate, endDate, limit) => {
    let sql = 'SELECT * FROM EnvironmentalMetrics WHERE deviceId = ?';
    const params = [deviceId];
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
exports.readEnvironmentalMetricsByDeviceIdFiltered = readEnvironmentalMetricsByDeviceIdFiltered;
// Update environmental metrics
const updateEnvironmentalMetrics = (id, metrics) => {
    const sql = 'UPDATE EnvironmentalMetrics SET deviceId = ?, timestamp = ?, temperature = ?, humidity = ? WHERE id = ?';
    return new Promise((resolve, reject) => {
        database_1.db.run(sql, [
            metrics.deviceId,
            metrics.timestamp,
            metrics.temperature,
            metrics.humidity,
            id
        ], function (err) {
            if (err) {
                reject(err);
            }
            else if (this.changes === 0) {
                reject(new Error('Environmental metrics not found'));
            }
            else {
                resolve();
            }
        });
    });
};
exports.updateEnvironmentalMetrics = updateEnvironmentalMetrics;
// Delete environmental metrics
const deleteEnvironmentalMetrics = (id) => {
    const sql = 'DELETE FROM EnvironmentalMetrics WHERE id = ?';
    return new Promise((resolve, reject) => {
        database_1.db.run(sql, [id], function (err) {
            if (err) {
                reject(err);
            }
            else if (this.changes === 0) {
                reject(new Error('Environmental metrics not found'));
            }
            else {
                resolve();
            }
        });
    });
};
exports.deleteEnvironmentalMetrics = deleteEnvironmentalMetrics;
// Delete environmental metrics by device ID (useful when deleting a device)
const deleteEnvironmentalMetricsByDeviceId = (deviceId) => {
    const sql = 'DELETE FROM EnvironmentalMetrics WHERE deviceId = ?';
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
exports.deleteEnvironmentalMetricsByDeviceId = deleteEnvironmentalMetricsByDeviceId;
// Delete all metrics for a device (both electrical and environmental)
const deleteAllMetricsByDeviceId = (deviceId) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield (0, exports.deleteElectricalMetricsByDeviceId)(deviceId);
            yield (0, exports.deleteEnvironmentalMetricsByDeviceId)(deviceId);
            resolve();
        }
        catch (error) {
            reject(error);
        }
    }));
};
exports.deleteAllMetricsByDeviceId = deleteAllMetricsByDeviceId;
