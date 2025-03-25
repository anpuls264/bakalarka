// common/ChartUtils.ts
import { Theme } from '@mui/material/styles';

export enum TimeRange {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  MAX = 'max'
}

export interface ChartItem {
  timestamp?: string;
  time?: string;
  [key: string]: any;
}

export interface ChartItemWithTimestamp extends ChartItem {
  timestamp: string;
}

export interface ChartItemWithTime extends ChartItem {
  time: string;
}

export const TIME_IN_MS = {
  HOUR: 60 * 60 * 1000,        // 3,600,000
  DAY: 24 * 60 * 60 * 1000,    // 86,400,000 
  WEEK: 7 * 24 * 60 * 60 * 1000, // 604,800,000
  MONTH: 30 * 24 * 60 * 60 * 1000, // 2,592,000,000
  MAX: Number.POSITIVE_INFINITY
} as const;

export const getTimeRangeInMs = (range: TimeRange): number => {
  return TIME_IN_MS[range.toUpperCase() as keyof typeof TIME_IN_MS] || TIME_IN_MS.HOUR;
};

// Helper function to safely convert timestamp to Date
export const safeParseDate = (timestamp: string | undefined): Date => {
  if (!timestamp) {
    return new Date();
  }
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? new Date() : date;
};

// Helper function to safely get timestamp from ChartItem
export const getItemTimestamp = (item: ChartItem): Date => {
  if (item.timestamp) {
    return safeParseDate(item.timestamp);
  }
  if (item.time) {
    // Handle time-based items (e.g., "12:00", "Po", "15")
    const now = new Date();
    const timeStr = item.time;
    
    // Try to parse hour:minute format
    const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (timeMatch) {
      now.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), 0, 0);
      return now;
    }
    
    // Try to parse day number (1-31)
    const dayMatch = timeStr.match(/^(\d{1,2})$/);
    if (dayMatch) {
      now.setDate(parseInt(dayMatch[1], 10));
      return now;
    }
    
    // Handle weekday abbreviations
    const weekdays = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
    const weekdayIndex = weekdays.indexOf(timeStr);
    if (weekdayIndex !== -1) {
      const currentDay = now.getDay();
      const targetDay = weekdayIndex + 1; // Convert to 1-7 format
      const diff = targetDay - (currentDay === 0 ? 7 : currentDay);
      now.setDate(now.getDate() + diff);
      return now;
    }
  }
  return new Date();
};

export const getChartColors = (theme: Theme) => {
  return {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    background: theme.palette.background.paper,
    text: theme.palette.text.primary,
    textSecondary: theme.palette.text.secondary,
    grid: theme.palette.divider
  };
};

export const formatDateByTimeRange = (timestamp: string | undefined, timeRange: TimeRange, locale = 'cs-CZ'): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {};

  switch (timeRange) {
    case TimeRange.HOUR:
      options.hour = '2-digit';
      options.minute = '2-digit';
      break;
    case TimeRange.DAY:
      options.hour = '2-digit';
      break;
    case TimeRange.WEEK:
      options.weekday = 'short';
      break;
    case TimeRange.MONTH:
    case TimeRange.MAX:
      options.day = '2-digit';
      options.month = '2-digit';
      break;
  }

  return date.toLocaleString(locale, options);
};

export const formatDateByRange = (timestamp: string | undefined, timeRange: TimeRange, locale = 'cs-CZ'): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {};

  switch (timeRange) {
    case TimeRange.HOUR:
      options.hour = '2-digit';
      options.minute = '2-digit';
      break;
    case TimeRange.DAY:
      options.hour = '2-digit';
      break;
    case TimeRange.WEEK:
      options.weekday = 'short';
      break;
    case TimeRange.MONTH:
    case TimeRange.MAX:
      options.day = '2-digit';
      options.month = '2-digit';
      break;
  }

  return date.toLocaleString(locale, options);
};

// Plné formátování data
export const formatFullDate = (timestamp: string | undefined, locale = 'cs-CZ'): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

// Získání jednotky pro metriku
export const getUnitForMetric = (metricName: string | undefined): string => {
  if (!metricName) return '';
  
  switch (metricName) {
    case 'current':
      return 'A';
    case 'apower':
      return 'W';
    case 'voltage':
      return 'V';
    default:
      return '';
  }
};

// Formátování názvu metriky
export const formatMetricName = (metricName: string): string => {
  switch (metricName) {
    case 'current':
      return 'Proud (A)';
    case 'apower':
      return 'Výkon (W)';
    case 'voltage':
      return 'Napětí (V)';
    default:
      return metricName;
  }
};

// Získání názvu grafu podle časového rozsahu
export const getChartTitle = (timeRange: TimeRange): string => {
  switch (timeRange) {
    case TimeRange.HOUR:
      return 'Hodinový přehled';
    case TimeRange.DAY:
      return 'Denní přehled';
    case TimeRange.WEEK:
      return 'Týdenní přehled';
    case TimeRange.MONTH:
      return 'Měsíční přehled';
    case TimeRange.MAX:
      return 'Kompletní přehled';
    default:
      return 'Přehled v reálném čase';
  }
};
