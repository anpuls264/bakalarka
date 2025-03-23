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
        db.run('CREATE TABLE IF NOT EXISTS Devices (id TEXT PRIMARY KEY, name TEXT, type TEXT, config TEXT);', (err: Error | null) => {
            if (err)
                console.log(err.message)
            else
                console.log("Devices table created or existed")
        });
        
        // Upravená tabulka pro metriky s odkazem na zařízení
        db.run('CREATE TABLE IF NOT EXISTS DeviceMetrics (id INTEGER PRIMARY KEY AUTOINCREMENT, deviceId TEXT, timestamp DATETIME, apower REAL, voltage REAL, current REAL, total REAL, temperature REAL, humidity REAL, FOREIGN KEY(deviceId) REFERENCES Devices(id));', (err: Error | null) => {
            if (err)
                console.log(err.message)
            else
                console.log("DeviceMetrics table created or existed")
        });
    }
});

export { db };
