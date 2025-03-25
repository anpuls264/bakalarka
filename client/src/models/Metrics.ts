import { getItemTimestamp } from '../components/common/ChartUtils';

export interface DeviceMetrics {
  id?: number;
  deviceId: string;
  timestamp: string;  // Make timestamp required
  time?: string;  // For grouped data (e.g., "12:00", "Po", "15")
  apower?: number;
  voltage?: number;
  current?: number;
  total?: number;
  temperature?: number;
  humidity?: number;
  sampleCount?: number;
}

export type TimeRange = 'hour' | 'day' | 'week' | 'month';

export interface AggregationOptions {
  timeRange: TimeRange;
  interval: number; // in milliseconds
}

// Helper function to safely add values, handling NaN
export const safeAdd = (acc: number, curr: number): number => {
  if (isNaN(curr)) return acc;
  return acc + curr;
};

// Helper function to calculate total for a given time period
export const calculateTotal = (metrics: DeviceMetrics[], timePeriod: TimeRange): number => {
  const currentTime = new Date();

  switch (timePeriod) {
    case 'hour':
      return metrics
        .filter(item => {
          const itemTime = getItemTimestamp(item);
          const hourAgo = new Date(currentTime.getTime() - 60 * 60 * 1000);
          return itemTime > hourAgo && itemTime <= currentTime;
        })
        .reduce((acc, curr) => safeAdd(acc, curr.total || 0), 0);

    case 'day':
      return metrics
        .filter(item => {
          const itemTime = getItemTimestamp(item);
          const dayAgo = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);
          return itemTime > dayAgo && itemTime <= currentTime;
        })
        .reduce((acc, curr) => safeAdd(acc, curr.total || 0), 0);

    case 'week':
      return metrics
        .filter(item => {
          const itemTime = getItemTimestamp(item);
          const weekAgo = new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000);
          return itemTime > weekAgo && itemTime <= currentTime;
        })
        .reduce((acc, curr) => safeAdd(acc, curr.total || 0), 0);

    case 'month':
      const currentMonth = currentTime.getMonth();
      return metrics
        .filter(item => {
          const itemTime = getItemTimestamp(item);
          return itemTime.getMonth() === currentMonth && itemTime <= currentTime;
        })
        .reduce((acc, curr) => safeAdd(acc, curr.total || 0), 0);

    default:
      return 0;
  }
};

// Function to aggregate metrics by interval
export const aggregateMetricsByInterval = (metrics: DeviceMetrics[], interval: number): DeviceMetrics[] => {
  if (metrics.length === 0) {
    return [];
  }

  let startTime = getItemTimestamp(metrics[0]).getTime();
  let endTime = startTime + interval;

  const aggregatedMetrics: DeviceMetrics[] = [];
  let sumApower = 0;
  let sumVoltage = 0;
  let sumCurrent = 0;
  let sumTotal = 0;
  let count = 0;
  let validApowerCount = 0;
  let validVoltageCount = 0;
  let validCurrentCount = 0;
  let validTotalCount = 0;

  for (const item of metrics) {
    const itemTime = getItemTimestamp(item).getTime();
    if (itemTime >= startTime && itemTime <= endTime) {
      // Only add valid values to the sum
      if (!isNaN(item.apower || 0)) {
        sumApower += item.apower || 0;
        validApowerCount++;
      }
      if (!isNaN(item.voltage || 0)) {
        sumVoltage += item.voltage || 0;
        validVoltageCount++;
      }
      if (!isNaN(item.current || 0)) {
        sumCurrent += item.current || 0;
        validCurrentCount++;
      }
      if (!isNaN(item.total || 0)) {
        sumTotal += item.total || 0;
        validTotalCount++;
      }
      count++;
    } else {
      if (count > 0) {
        // Calculate averages using valid counts
        const averageApower = validApowerCount > 0 ? sumApower / validApowerCount : 0;
        const averageVoltage = validVoltageCount > 0 ? sumVoltage / validVoltageCount : 0;
        const averageCurrent = validCurrentCount > 0 ? sumCurrent / validCurrentCount : 0;
        const averageTotal = validTotalCount > 0 ? sumTotal / validTotalCount : 0;

        aggregatedMetrics.push({
          ...item,
          apower: averageApower,
          voltage: averageVoltage,
          current: averageCurrent,
          total: averageTotal,
          sampleCount: count
        });

        // Reset counters
        sumApower = 0;
        sumVoltage = 0;
        sumCurrent = 0;
        sumTotal = 0;
        count = 0;
        validApowerCount = 0;
        validVoltageCount = 0;
        validCurrentCount = 0;
        validTotalCount = 0;
      }
      startTime = itemTime;
      endTime = startTime + interval;
    }
  }

  // Process any remaining data
  if (count > 0) {
    const averageApower = validApowerCount > 0 ? sumApower / validApowerCount : 0;
    const averageVoltage = validVoltageCount > 0 ? sumVoltage / validVoltageCount : 0;
    const averageCurrent = validCurrentCount > 0 ? sumCurrent / validCurrentCount : 0;
    const averageTotal = validTotalCount > 0 ? sumTotal / validTotalCount : 0;

    aggregatedMetrics.push({
      ...metrics[metrics.length - 1],
      apower: averageApower,
      voltage: averageVoltage,
      current: averageCurrent,
      total: averageTotal,
      sampleCount: count
    });
  }

  return aggregatedMetrics;
};
