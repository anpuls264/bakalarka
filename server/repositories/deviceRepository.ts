import { influxdb } from '../services/influxdb';
import { Item } from '../types/interfaces';
import { FluxTableMetaData } from '@influxdata/influxdb-client';

const MEASUREMENT = 'device_metrics';

/**
 * Create a new device metrics item in InfluxDB
 * @param timestamp Timestamp of the measurement
 * @param apower Active power measurement
 * @param voltage Voltage measurement
 * @param current Current measurement
 * @param total Total energy consumption
 * @returns Promise resolving to the created item
 */
export const createItem = async (
    timestamp: string, 
    apower: number, 
    voltage: number, 
    current: number, 
    total: number
): Promise<Item> => {
    try {
        const writeApi = influxdb.getWriteApi();
        const point = influxdb.createPoint(MEASUREMENT)
            .timestamp(new Date(timestamp))
            .floatField('apower', apower)
            .floatField('voltage', voltage)
            .floatField('current', current)
            .floatField('total', total);
        
        writeApi.writePoint(point);
        await writeApi.flush();
        
        // Generate a unique ID for the item (InfluxDB doesn't have auto-incrementing IDs)
        const id = Date.now();
        
        return { 
            id, 
            timestamp, 
            apower, 
            voltage, 
            current, 
            total 
        };
    } catch (error: any) {
        console.error('Error creating device metrics item:', error);
        throw error;
    }
};

/**
 * Read all device metrics items from InfluxDB
 * @param limit Optional limit on number of items to return
 * @returns Promise resolving to an array of items
 */
export const readItems = async (limit: number = 1000): Promise<Item[]> => {
    try {
        const queryApi = influxdb.getQueryApi();
        
        // Flux query to get the most recent data points
        const query = `
            from(bucket: "${process.env.INFLUXDB_BUCKET || 'device_metrics'}")
                |> range(start: -30d)
                |> filter(fn: (r) => r._measurement == "${MEASUREMENT}")
                |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
                |> sort(columns: ["_time"], desc: true)
                |> limit(n: ${limit})
        `;
        
        // Execute the query and process the results
        const result: Item[] = [];
        const rows = await queryApi.collectRows(query);
        
        // Process the rows into our Item format
        rows.forEach((row: any, index: number) => {
            result.push({
                id: index + 1, // Generate sequential IDs
                timestamp: row._time,
                apower: row.apower || 0,
                voltage: row.voltage || 0,
                current: row.current || 0,
                total: row.total || 0
            });
        });
        
        return result;
    } catch (error: any) {
        console.error('Error reading device metrics items:', error);
        throw error;
    }
};

/**
 * Read device metrics within a time range
 * @param start Start time (ISO string or relative time like '-1h')
 * @param end End time (ISO string or 'now')
 * @returns Promise resolving to an array of items
 */
export const readItemsByTimeRange = async (
    start: string = '-24h', 
    end: string = 'now()'
): Promise<Item[]> => {
    try {
        const queryApi = influxdb.getQueryApi();
        
        // Flux query to get data within a time range
        const query = `
            from(bucket: "${process.env.INFLUXDB_BUCKET || 'device_metrics'}")
                |> range(start: ${start}, stop: ${end})
                |> filter(fn: (r) => r._measurement == "${MEASUREMENT}")
                |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
                |> sort(columns: ["_time"])
        `;
        
        // Execute the query and process the results
        const result: Item[] = [];
        const rows = await queryApi.collectRows(query);
        
        // Process the rows into our Item format
        rows.forEach((row: any, index: number) => {
            result.push({
                id: index + 1, // Generate sequential IDs
                timestamp: row._time,
                apower: row.apower || 0,
                voltage: row.voltage || 0,
                current: row.current || 0,
                total: row.total || 0
            });
        });
        
        return result;
    } catch (error: any) {
        console.error('Error reading device metrics by time range:', error);
        throw error;
    }
};

/**
 * Get aggregated metrics (e.g., hourly averages)
 * @param start Start time (ISO string or relative time like '-7d')
 * @param window Aggregation window (e.g., '1h', '1d')
 * @returns Promise resolving to aggregated data
 */
export const getAggregatedMetrics = async (
    start: string = '-7d',
    window: string = '1h'
): Promise<any[]> => {
    try {
        const queryApi = influxdb.getQueryApi();
        
        // Flux query for aggregated data
        const query = `
            from(bucket: "${process.env.INFLUXDB_BUCKET || 'device_metrics'}")
                |> range(start: ${start})
                |> filter(fn: (r) => r._measurement == "${MEASUREMENT}")
                |> aggregateWindow(every: ${window}, fn: mean, createEmpty: false)
                |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
                |> sort(columns: ["_time"])
        `;
        
        // Execute the query
        return await queryApi.collectRows(query);
    } catch (error: any) {
        console.error('Error getting aggregated metrics:', error);
        throw error;
    }
};

/**
 * Get the latest metrics
 * @returns Promise resolving to the latest metrics
 */
export const getLatestMetrics = async (): Promise<Item | null> => {
    try {
        const items = await readItems(1);
        return items.length > 0 ? items[0] : null;
    } catch (error: any) {
        console.error('Error getting latest metrics:', error);
        throw error;
    }
};
