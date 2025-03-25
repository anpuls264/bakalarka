import { DashboardItemType } from '../models/Dashboard';

/**
 * Defines which dashboard components are compatible with each device type
 */
export interface DeviceCompatibility {
  deviceType: string;
  compatibleComponents: DashboardItemType[];
}

/**
 * Compatibility definitions for different device types
 */
export const DEVICE_COMPATIBILITY: DeviceCompatibility[] = [
  {
    deviceType: 'shelly-ht',
    compatibleComponents: [
      'current-value-temperature',
      'current-value-humidity',
      'current-value-battery',
      'temperature-humidity-graph'
    ]
  },
  {
    deviceType: 'shelly-plug-s',
    compatibleComponents: [
      'control-panel',
      'current-value-voltage',
      'current-value-power',
      'current-value-current',
      'real-time-graph',
      'column-chart',
      'line-chart',
      'pie-chart',
      'heat-map',
      'expense-box-hour',
      'expense-box-day',
      'expense-box-week',
      'expense-box-month'
    ]
  }
];

/**
 * Check if a component is compatible with a specific device type
 * @param componentType The type of dashboard component
 * @param deviceType The type of device
 * @returns True if the component is compatible with the device type
 */
export const isComponentCompatible = (
  componentType: DashboardItemType,
  deviceType: string
): boolean => {
  const compatibility = DEVICE_COMPATIBILITY.find(
    (c) => c.deviceType === deviceType
  );

  if (!compatibility) {
    // If no compatibility definition is found, assume all components are compatible
    return true;
  }

  return compatibility.compatibleComponents.includes(componentType);
};

/**
 * Get all compatible components for a specific device type
 * @param deviceType The type of device
 * @returns Array of compatible component types
 */
export const getCompatibleComponents = (
  deviceType: string
): DashboardItemType[] => {
  const compatibility = DEVICE_COMPATIBILITY.find(
    (c) => c.deviceType === deviceType
  );

  if (!compatibility) {
    // If no compatibility definition is found, return an empty array
    return [];
  }

  return [...compatibility.compatibleComponents];
};
