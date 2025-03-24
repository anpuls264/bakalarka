import { DeviceMetrics } from '../models/Metrics';
import { Item } from '../types/types';

/**
 * Converts DeviceMetrics array to Item array for compatibility with chart components
 */
export const metricsToItems = (metrics: DeviceMetrics[]): Item[] => {
  return metrics.map((metric, index) => ({
    id: metric.id !== undefined ? metric.id : index,
    timestamp: metric.timestamp,
    apower: metric.apower !== undefined ? metric.apower : 0,
    voltage: metric.voltage !== undefined ? metric.voltage : 0,
    current: metric.current !== undefined ? metric.current : 0,
    total: metric.total !== undefined ? metric.total : 0
  }));
};
