import * as sqlite3 from 'sqlite3';
import * as dotenv from 'dotenv';
import { SQLiteRunCallback } from '../types/interfaces';

dotenv.config();

/**
 * Database service for managing SQLite connections and operations
 */
class DatabaseService {
    private db: sqlite3.Database;
    private static instance: DatabaseService;

    /**
     * Private constructor to enforce singleton pattern
     */
    private constructor() {
        const dbName: string = process.env.DB_NAME || 'device_metrics.db';
        
        this.db = new sqlite3.Database(dbName, (err: Error | null) => {
            if (err) {
                console.error(`Database connection error: ${err.message}`);
                throw err;
            } else {
                console.log("Connected to the Database");
                this.initializeDatabase();
            }
        });
    }

    /**
     * Get singleton instance of DatabaseService
     */
    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    /**
     * Initialize database tables
     */
    private initializeDatabase(): void {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS DeviceMetrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                timestamp DATETIME, 
                apower REAL, 
                voltage REAL, 
                current REAL, 
                total REAL
            );
        `;
        
        this.db.run(createTableSQL, (err: Error | null) => {
            if (err) {
                console.error(`Table creation error: ${err.message}`);
            } else {
                console.log("Database tables initialized successfully");
            }
        });
    }

    /**
     * Execute a database query with parameters
     * @param sql SQL query string
     * @param params Query parameters
     * @returns Promise that resolves with the query result
     */
    public run(sql: string, params: any[] = []): Promise<{ lastID: number }> {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(this: SQLiteRunCallback, err: Error | null) {
                if (err) {
                    console.error(`Database query error: ${err.message}`);
                    reject(err);
                } else {
                    resolve({ lastID: this.lastID });
                }
            });
        });
    }

    /**
     * Execute a query and return all results
     * @param sql SQL query string
     * @param params Query parameters
     * @returns Promise that resolves with the query results
     */
    public all<T>(sql: string, params: any[] = []): Promise<T[]> {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err: Error | null, rows: T[]) => {
                if (err) {
                    console.error(`Database query error: ${err.message}`);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Execute a query and return the first result
     * @param sql SQL query string
     * @param params Query parameters
     * @returns Promise that resolves with the first result
     */
    public get<T>(sql: string, params: any[] = []): Promise<T | null> {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err: Error | null, row: T) => {
                if (err) {
                    console.error(`Database query error: ${err.message}`);
                    reject(err);
                } else {
                    resolve(row || null);
                }
            });
        });
    }

    /**
     * Close the database connection
     */
    public close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.close((err: Error | null) => {
                if (err) {
                    console.error(`Error closing database: ${err.message}`);
                    reject(err);
                } else {
                    console.log("Database connection closed");
                    resolve();
                }
            });
        });
    }
}

// Export singleton instance
export const db = DatabaseService.getInstance();
