import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { OrgsAPI, BucketsAPI } from '@influxdata/influxdb-client-apis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * InfluxDB service for managing time-series data
 */
class InfluxDBService {
    private client: InfluxDB;
    private org: string;
    private bucket: string;
    private static instance: InfluxDBService;

    /**
     * Private constructor to enforce singleton pattern
     */
    private constructor() {
        const url = process.env.INFLUXDB_URL || 'http://localhost:8086';
        const token = process.env.INFLUXDB_TOKEN;
        
        if (!token) {
            throw new Error('INFLUXDB_TOKEN environment variable is required');
        }
        
        this.org = process.env.INFLUXDB_ORG || 'my-org';
        this.bucket = process.env.INFLUXDB_BUCKET || 'device_metrics';
        
        this.client = new InfluxDB({ url, token });
        
        // Ensure bucket exists
        this.initializeBucket().catch(error => {
            console.error(`Error initializing InfluxDB bucket: ${error.message}`);
        });
    }

    /**
     * Get singleton instance of InfluxDBService
     */
    public static getInstance(): InfluxDBService {
        if (!InfluxDBService.instance) {
            InfluxDBService.instance = new InfluxDBService();
        }
        return InfluxDBService.instance;
    }

    /**
     * Initialize InfluxDB bucket if it doesn't exist
     */
    private async initializeBucket(): Promise<void> {
        try {
            const orgsAPI = new OrgsAPI(this.client);
            const bucketsAPI = new BucketsAPI(this.client);
            
            // Find organization ID
            const orgs = await orgsAPI.getOrgs({ org: this.org });
            if (!orgs || !orgs.orgs || orgs.orgs.length === 0) {
                throw new Error(`Organization '${this.org}' not found`);
            }
            
            const orgID = orgs.orgs[0].id;
            
            // Check if bucket exists
            const buckets = await bucketsAPI.getBuckets({ orgID, name: this.bucket });
            
            if (!buckets || !buckets.buckets || buckets.buckets.length === 0) {
                // Create bucket if it doesn't exist
                console.log(`Creating InfluxDB bucket '${this.bucket}'`);
                await bucketsAPI.postBuckets({ body: { orgID, name: this.bucket } });
            }
            
            console.log(`InfluxDB bucket '${this.bucket}' is ready`);
        } catch (error: any) {
            console.error(`Error initializing InfluxDB bucket: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get a write API client for the configured bucket
     */
    public getWriteApi() {
        return this.client.getWriteApi(this.org, this.bucket, 'ns');
    }

    /**
     * Get a query API client
     */
    public getQueryApi() {
        return this.client.getQueryApi(this.org);
    }

    /**
     * Create a new point for writing to InfluxDB
     * @param measurement Measurement name
     */
    public createPoint(measurement: string): Point {
        return new Point(measurement);
    }

    /**
     * Close all connections
     */
    public close(): void {
        // InfluxDB client doesn't have a close method, but we can add one if needed in the future
    }
}

// Export singleton instance
export const influxdb = InfluxDBService.getInstance();
