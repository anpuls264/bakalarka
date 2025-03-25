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
        db.run('CREATE TABLE IF NOT EXISTS Devices (id TEXT PRIMARY KEY, name TEXT, type TEXT, config TEXT);', (err) => {
            if (err)
                console.log(err.message);
            else
                console.log("Devices table created or existed");
        });
        // Upravená tabulka pro metriky s odkazem na zařízení
        db.run('CREATE TABLE IF NOT EXISTS DeviceMetrics (id INTEGER PRIMARY KEY AUTOINCREMENT, deviceId TEXT, timestamp DATETIME, apower REAL, voltage REAL, current REAL, total REAL, temperature REAL, humidity REAL, FOREIGN KEY(deviceId) REFERENCES Devices(id));', (err) => {
            if (err)
                console.log(err.message);
            else
                console.log("DeviceMetrics table created or existed");
        });
    }
});
exports.db = db;
