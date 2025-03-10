"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteItem = exports.updateItem = exports.readItems = exports.createItem = void 0;
const database_1 = require("./database");
// CREATE
const createItem = (timestamp, apower, voltage, current, total) => {
    const sql = 'INSERT INTO DeviceMetrics (timestamp, apower, voltage, current, total) VALUES (?, ?, ?, ?, ?)';
    return new Promise((resolve, reject) => {
        database_1.db.run(sql, [timestamp, apower, voltage, current, total], function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve({ id: this.lastID });
            }
        });
    });
};
exports.createItem = createItem;
// READ
const readItems = (callback) => {
    const sql = 'SELECT * FROM DeviceMetrics';
    database_1.db.all(sql, [], callback);
};
exports.readItems = readItems;
// UPDATE
const updateItem = (id, timestamp, apower, voltage, current, total, callback) => {
    const sql = 'UPDATE DeviceMetrics SET timestamp = ?, apower = ?, voltage = ?, current = ?, total = ? WHERE id = ?';
    database_1.db.run(sql, [timestamp, apower, voltage, current, total, id], callback);
};
exports.updateItem = updateItem;
// DELETE
const deleteItem = (id, callback) => {
    const sql = 'DELETE FROM DeviceMetrics WHERE id = ?';
    database_1.db.run(sql, id, callback);
};
exports.deleteItem = deleteItem;
