export type DashboardItemType = 
  | 'control-panel'
  | 'current-value-voltage'
  | 'current-value-power'
  | 'current-value-current'
  | 'current-value-temperature'
  | 'current-value-humidity'
  | 'current-value-battery'
  | 'real-time-graph'
  | 'column-chart'
  | 'line-chart'
  | 'pie-chart'
  | 'heat-map'
  | 'expense-box-hour'
  | 'expense-box-day'
  | 'expense-box-week'
  | 'expense-box-month';

export interface DashboardItem {
  id: string;
  type: DashboardItemType;
  title: string;
  gridArea?: string;
  order?: number;
  width?: number;
  height?: number;
  visible: boolean;
}

export interface DashboardLayout {
  items: DashboardItem[];
  columns: number;
}

// Default dashboard layout
export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = {
  items: [
    {
      id: 'control-panel',
      type: 'control-panel',
      title: 'Control Panel',
      width: 4,
      order: 0,
      visible: true
    },
    // ShellyPlugS specific items
    {
      id: 'current-value-voltage',
      type: 'current-value-voltage',
      title: 'Current Voltage',
      width: 4,
      order: 1,
      visible: true
    },
    {
      id: 'current-value-power',
      type: 'current-value-power',
      title: 'Current Power',
      width: 4,
      order: 2,
      visible: true
    },
    {
      id: 'current-value-current',
      type: 'current-value-current',
      title: 'Current Amperage',
      width: 4,
      order: 3,
      visible: true
    },
    // ShellyHT specific items
    {
      id: 'current-value-temperature',
      type: 'current-value-temperature',
      title: 'Temperature',
      width: 4,
      order: 1,
      visible: true
    },
    {
      id: 'current-value-humidity',
      type: 'current-value-humidity',
      title: 'Humidity',
      width: 4,
      order: 2,
      visible: true
    },
    {
      id: 'current-value-battery',
      type: 'current-value-battery',
      title: 'Battery',
      width: 4,
      order: 3,
      visible: true
    },
    {
      id: 'real-time-graph',
      type: 'real-time-graph',
      title: 'Real-Time Graph',
      width: 2,
      order: 4,
      visible: true
    },
    {
      id: 'column-chart',
      type: 'column-chart',
      title: 'Column Chart',
      width: 2,
      order: 5,
      visible: true
    },
    {
      id: 'line-chart',
      type: 'line-chart',
      title: 'Line Chart',
      width: 2,
      order: 6,
      visible: true
    },
    {
      id: 'pie-chart',
      type: 'pie-chart',
      title: 'Pie Chart',
      width: 2,
      order: 7,
      visible: true
    },
    {
      id: 'heat-map',
      type: 'heat-map',
      title: 'Heat Map',
      width: 1,
      order: 8,
      visible: true
    },
    {
      id: 'expense-box-hour',
      type: 'expense-box-hour',
      title: 'Hourly Expense',
      width: 4,
      order: 9,
      visible: true
    },
    {
      id: 'expense-box-day',
      type: 'expense-box-day',
      title: 'Daily Expense',
      width: 4,
      order: 10,
      visible: true
    },
    {
      id: 'expense-box-week',
      type: 'expense-box-week',
      title: 'Weekly Expense',
      width: 4,
      order: 11,
      visible: true
    },
    {
      id: 'expense-box-month',
      type: 'expense-box-month',
      title: 'Monthly Expense',
      width: 4,
      order: 12,
      visible: true
    }
  ],
  columns: 4
};

// Helper functions for dashboard management
export const loadDashboardLayout = (): DashboardLayout => {
  try {
    const savedLayout = localStorage.getItem('dashboardLayout');
    if (savedLayout) {
      return JSON.parse(savedLayout);
    }
  } catch (error) {
    console.error('Error loading dashboard layout:', error);
  }
  return DEFAULT_DASHBOARD_LAYOUT;
};

export const saveDashboardLayout = (layout: DashboardLayout): void => {
  try {
    localStorage.setItem('dashboardLayout', JSON.stringify(layout));
  } catch (error) {
    console.error('Error saving dashboard layout:', error);
  }
};
