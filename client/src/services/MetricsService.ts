import { DeviceMetrics, TimeRange, aggregateMetricsByInterval, calculateTotal } from '../models/Metrics';
import { deviceService } from './DeviceService';

export class MetricsService {
  private metrics: DeviceMetrics[] = [];
  private metricsListeners: Set<(metrics: DeviceMetrics[]) => void> = new Set();
  private totalsListeners: Map<TimeRange, Set<(total: number) => void>> = new Map();
  private defaultDeviceId: string = 'shelly1';
  
  constructor() {
    // Initialize totals listeners map for each time range
    this.totalsListeners.set('hour', new Set());
    this.totalsListeners.set('day', new Set());
    this.totalsListeners.set('week', new Set());
    this.totalsListeners.set('month', new Set());
    
    // Subscribe to metrics updates from the device service
    deviceService.subscribeToMetricsUpdates(this.handleNewMetric);
    
    // Load initial metrics
    this.loadInitialMetrics();
  }
  
  private handleNewMetric = (metric: DeviceMetrics): void => {
    // Add the new metric to our collection
    this.metrics.push(metric);
    
    // Notify metrics listeners
    this.notifyMetricsListeners();
    
    // Recalculate and notify totals listeners
    this.updateTotals();
  }
  
  private notifyMetricsListeners(): void {
    this.metricsListeners.forEach(listener => {
      listener([...this.metrics]);
    });
  }
  
  private updateTotals(): void {
    // Calculate totals for each time range
    const hourlyTotal = calculateTotal(this.metrics, 'hour');
    const dailyTotal = calculateTotal(this.metrics, 'day');
    const weeklyTotal = calculateTotal(this.metrics, 'week');
    const monthlyTotal = calculateTotal(this.metrics, 'month');
    
    // Notify listeners for each time range
    this.totalsListeners.get('hour')?.forEach(listener => listener(hourlyTotal));
    this.totalsListeners.get('day')?.forEach(listener => listener(dailyTotal));
    this.totalsListeners.get('week')?.forEach(listener => listener(weeklyTotal));
    this.totalsListeners.get('month')?.forEach(listener => listener(monthlyTotal));
  }
  
  private async loadInitialMetrics(): Promise<void> {
    try {
      // Load metrics for the default device
      const metrics = await deviceService.getDeviceMetrics(this.defaultDeviceId);
      
      // Store metrics
      this.metrics = metrics;
      
      // Notify listeners
      this.notifyMetricsListeners();
      this.updateTotals();
    } catch (error) {
      console.error('Failed to load initial metrics:', error);
    }
  }
  
  /**
   * Get all metrics
   */
  getMetrics(): DeviceMetrics[] {
    return [...this.metrics];
  }
  
  /**
   * Get aggregated metrics based on the specified interval
   */
  getAggregatedMetrics(interval: number): DeviceMetrics[] {
    return aggregateMetricsByInterval(this.metrics, interval);
  }
  
  /**
   * Get the total for a specific time range
   */
  getTotal(timeRange: TimeRange): number {
    return calculateTotal(this.metrics, timeRange);
  }
  
  /**
   * Subscribe to metrics updates
   */
  subscribeToMetrics(callback: (metrics: DeviceMetrics[]) => void): () => void {
    this.metricsListeners.add(callback);
    
    // Immediately notify with current data
    callback([...this.metrics]);
    
    // Return unsubscribe function
    return () => {
      this.metricsListeners.delete(callback);
    };
  }
  
  /**
   * Subscribe to total updates for a specific time range
   */
  subscribeToTotal(timeRange: TimeRange, callback: (total: number) => void): () => void {
    const listeners = this.totalsListeners.get(timeRange);
    if (listeners) {
      listeners.add(callback);
      
      // Immediately notify with current total
      callback(this.getTotal(timeRange));
    }
    
    // Return unsubscribe function
    return () => {
      this.totalsListeners.get(timeRange)?.delete(callback);
    };
  }
  
  /**
   * Load metrics for a specific device
   */
  async loadDeviceMetrics(deviceId: string): Promise<DeviceMetrics[]> {
    try {
      const metrics = await deviceService.getDeviceMetrics(deviceId);
      
      // If this is the default device, update our metrics collection
      if (deviceId === this.defaultDeviceId) {
        this.metrics = metrics;
        this.notifyMetricsListeners();
        this.updateTotals();
      }
      
      return metrics;
    } catch (error) {
      console.error(`Failed to load metrics for device ${deviceId}:`, error);
      return [];
    }
  }
  
  /**
   * Load aggregated metrics for a specific device
   */
  async loadAggregatedMetrics(
    deviceId: string,
    timeRange: string = 'day',
    interval: number = 300000
  ): Promise<DeviceMetrics[]> {
    try {
      return await deviceService.getAggregatedMetrics(deviceId, timeRange, interval);
    } catch (error) {
      console.error(`Failed to load aggregated metrics for device ${deviceId}:`, error);
      return [];
    }
  }
  
  /**
   * Set the default device ID
   */
  setDefaultDeviceId(deviceId: string): void {
    this.defaultDeviceId = deviceId;
    this.loadInitialMetrics();
  }
}

// Export a singleton instance for use throughout the application
export const metricsService = new MetricsService();
