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
  timestamp: string;
  [key: string]: any;
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

export const formatDateByTimeRange = (timestamp: string, timeRange: TimeRange, locale = 'cs-CZ'): string => {
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

export const formatDateByRange = (timestamp: string, timeRange: TimeRange, locale = 'cs-CZ'): string => {
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
export const formatFullDate = (timestamp: string, locale = 'cs-CZ'): string => {
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