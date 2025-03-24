// src/components/common/TimeRangeSelector.tsx
import React from 'react';
import { Box, useTheme } from '@mui/material';
import { TimeRange } from './ChartUtils';

interface TimeRangeSelectorProps {
  currentRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  showHour?: boolean;
  showMax?: boolean;
  customLabels?: Partial<Record<TimeRange, string>>;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ 
  currentRange, 
  onRangeChange,
  showHour = true,
  showMax = false,
  customLabels = {} 
}) => {
  const theme = useTheme();
  
  // Definice všech možných rozsahů
  const allRanges = [
    { value: TimeRange.HOUR, label: customLabels[TimeRange.HOUR] || '1H', show: showHour },
    { value: TimeRange.DAY, label: customLabels[TimeRange.DAY] || '1D', show: true },
    { value: TimeRange.WEEK, label: customLabels[TimeRange.WEEK] || '1W', show: true },
    { value: TimeRange.MONTH, label: customLabels[TimeRange.MONTH] || '1M', show: true },
    { value: TimeRange.MAX, label: customLabels[TimeRange.MAX] || 'Max', show: showMax }
  ];
  
  // Filtrované rozsahy podle nastavení zobrazení
  const ranges = allRanges.filter(range => range.show);

  return (
    <Box sx={{ 
      display: 'flex', 
      marginBottom: '10px', 
      justifyContent: 'flex-end' 
    }}>
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onRangeChange(range.value)}
          className={currentRange === range.value ? 'active' : ''}
          style={{
            color: currentRange === range.value ? theme.palette.primary.main : '#666',
            background: 'none',
            border: 'none',
            padding: '8px 16px',
            cursor: 'pointer',
            borderBottom: currentRange === range.value 
              ? `3px solid ${theme.palette.primary.main}` 
              : 'none'
          }}
        >
          {range.label}
        </button>
      ))}
    </Box>
  );
};

export default React.memo(TimeRangeSelector);