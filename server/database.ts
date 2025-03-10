import * as sqlite3 from 'sqlite3';
import * as dotenv from 'dotenv';

dotenv.config();

const dbName: string = process.env.DB_NAME || '';

let db = new sqlite3.Database(dbName, (err: Error | null) => {
    if (err)
        console.log(err.message);
    else {
        console.log("Connected to the Database");
        db.run('CREATE TABLE IF NOT EXISTS DeviceMetrics (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp DATETIME, apower REAL, voltage REAL, current REAL, total REAL);', (err: Error | null) => {
            if (err)
                console.log(err.message)
            else
                console.log("Table created or existed")
        });
    }
});

export { db };