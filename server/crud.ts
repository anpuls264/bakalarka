import { db } from './database';

interface Item {
    id: number;
    timestamp: string;
    apower: number;
    voltage: number;
    current: number;
    total: number;
}

// CREATE
const createItem = (timestamp: string, apower: number, voltage: number, current: number, total: number): Promise<{ id: number }> => {
    const sql = 'INSERT INTO DeviceMetrics (timestamp, apower, voltage, current, total) VALUES (?, ?, ?, ?, ?)';
    
    return new Promise<{ id: number }>((resolve, reject) => {
        db.run(sql, [timestamp, apower, voltage, current, total], function (err: Error | null) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID });
            }
        });
    });
};

// READ
const readItems = (callback: (err: Error | null, items: Item[] | null) => void): void => {
    const sql = 'SELECT * FROM DeviceMetrics';
    db.all(sql, [], callback);
};

// UPDATE
const updateItem = (id: number, timestamp: string, apower: number, voltage: number, current: number, total: number, callback: (err: Error | null) => void): void => {
    const sql = 'UPDATE DeviceMetrics SET timestamp = ?, apower = ?, voltage = ?, current = ?, total = ? WHERE id = ?';
    db.run(sql, [timestamp, apower, voltage, current, total, id], callback);
};

// DELETE
const deleteItem = (id: number, callback: (err: Error | null) => void): void => {
    const sql = 'DELETE FROM DeviceMetrics WHERE id = ?';
    db.run(sql, id, callback);
};

export { createItem, readItems, updateItem, deleteItem };