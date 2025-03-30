import * as sqlite3 from 'sqlite3';
import * as dotenv from 'dotenv';
dotenv.config();
const dbName: string = process.env.DB_NAME || '';
let db = new sqlite3.Database(dbName, (err: Error | null) => {
    if (err)
        console.log(err.message);
    else {
        console.log("Connected to the Database");
        
        // Vytvoření tabulky pro zařízení
        db.run('CREATE TABLE IF NOT EXISTS Devices (id TEXT PRIMARY KEY, name TEXT, type TEXT, mqttPrefix TEXT);', (err: Error | null) => {
            if (err)
                console.log(err.message)
            else {
                console.log("Devices table created or existed");
                
                // Vložení zařízení Shelly Plug S
                db.run('INSERT OR IGNORE INTO Devices (id, name, type, mqttPrefix) VALUES (?, ?, ?, ?)', 
                    ['shelly1', 'Shelly Plug S', 'shelly-plug-s', 'shelly1'], 
                    (err: Error | null) => {
                        if (err)
                            console.log(`Error inserting Shelly Plug S: ${err.message}`);
                        else
                            console.log("Shelly Plug S device inserted or already exists");
                    }
                );
                
                // Vložení zařízení Shelly H&T
                db.run('INSERT OR IGNORE INTO Devices (id, name, type, mqttPrefix) VALUES (?, ?, ?, ?)', 
                    ['shellyht', 'Shelly H&T', 'shelly-ht', 'shellyht'], 
                    (err: Error | null) => {
                        if (err)
                            console.log(`Error inserting Shelly H&T: ${err.message}`);
                        else
                            console.log("Shelly H&T device inserted or already exists");
                    }
                );
            }
        });
        
        // Tabulka pro elektrické metriky
        db.run('CREATE TABLE IF NOT EXISTS ElectricalMetrics (id INTEGER PRIMARY KEY AUTOINCREMENT, deviceId TEXT, timestamp DATETIME, apower REAL, voltage REAL, current REAL, total REAL, FOREIGN KEY(deviceId) REFERENCES Devices(id));', (err: Error | null) => {
            if (err)
                console.log(err.message)
            else
                console.log("ElectricalMetrics table created or existed")
        });
        
        // Tabulka pro environmentální metriky
        db.run('CREATE TABLE IF NOT EXISTS EnvironmentalMetrics (id INTEGER PRIMARY KEY AUTOINCREMENT, deviceId TEXT, timestamp DATETIME, temperature REAL, humidity REAL, FOREIGN KEY(deviceId) REFERENCES Devices(id));', (err: Error | null) => {
            if (err)
                console.log(err.message)
            else
                console.log("EnvironmentalMetrics table created or existed")
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
export { db };