"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const sqlite3 = __importStar(require("sqlite3"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const dbName = process.env.DB_NAME || '';
let db = new sqlite3.Database(dbName, (err) => {
    if (err)
        console.log(err.message);
    else {
        console.log("Connected to the Database");
        // Vytvoření tabulky pro zařízení
        db.run('CREATE TABLE IF NOT EXISTS Devices (id TEXT PRIMARY KEY, name TEXT, type TEXT, mqttPrefix TEXT);', (err) => {
            if (err)
                console.log(err.message);
            else {
                console.log("Devices table created or existed");
                // Vložení zařízení Shelly Plug S
                db.run('INSERT OR IGNORE INTO Devices (id, name, type, mqttPrefix) VALUES (?, ?, ?, ?)', ['shelly1', 'Shelly Plug S', 'shelly-plug-s', 'shelly1'], (err) => {
                    if (err)
                        console.log(`Error inserting Shelly Plug S: ${err.message}`);
                    else
                        console.log("Shelly Plug S device inserted or already exists");
                });
                // Vložení zařízení Shelly H&T
                db.run('INSERT OR IGNORE INTO Devices (id, name, type, mqttPrefix) VALUES (?, ?, ?, ?)', ['shellyht', 'Shelly H&T', 'shelly-ht', 'shellyht'], (err) => {
                    if (err)
                        console.log(`Error inserting Shelly H&T: ${err.message}`);
                    else
                        console.log("Shelly H&T device inserted or already exists");
                });
            }
        });
        // Tabulka pro elektrické metriky
        db.run('CREATE TABLE IF NOT EXISTS ElectricalMetrics (id INTEGER PRIMARY KEY AUTOINCREMENT, deviceId TEXT, timestamp DATETIME, apower REAL, voltage REAL, current REAL, total REAL, FOREIGN KEY(deviceId) REFERENCES Devices(id));', (err) => {
            if (err)
                console.log(err.message);
            else
                console.log("ElectricalMetrics table created or existed");
        });
        // Tabulka pro environmentální metriky
        db.run('CREATE TABLE IF NOT EXISTS EnvironmentalMetrics (id INTEGER PRIMARY KEY AUTOINCREMENT, deviceId TEXT, timestamp DATETIME, temperature REAL, humidity REAL, FOREIGN KEY(deviceId) REFERENCES Devices(id));', (err) => {
            if (err)
                console.log(err.message);
            else
                console.log("EnvironmentalMetrics table created or existed");
        });
        // Vytvoření indexů pro ElectricalMetrics
        db.run('CREATE INDEX IF NOT EXISTS idx_electrical_metrics_device_id ON ElectricalMetrics(deviceId);');
        db.run('CREATE INDEX IF NOT EXISTS idx_electrical_metrics_timestamp ON ElectricalMetrics(timestamp);');
        db.run('CREATE INDEX IF NOT EXISTS idx_electrical_metrics_device_timestamp ON ElectricalMetrics(deviceId, timestamp);');
        // Vytvoření indexů pro EnvironmentalMetrics
        db.run('CREATE INDEX IF NOT EXISTS idx_environmental_metrics_device_id ON EnvironmentalMetrics(deviceId);');
        db.run('CREATE INDEX IF NOT EXISTS idx_environmental_metrics_timestamp ON EnvironmentalMetrics(timestamp);');
        db.run('CREATE INDEX IF NOT EXISTS idx_environmental_metrics_device_timestamp ON EnvironmentalMetrics(deviceId, timestamp);');
    }
});
exports.db = db;
