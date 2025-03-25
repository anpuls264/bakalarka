// src/components/HeatMap/HeatMap.tsx
import React, { useState, useMemo } from 'react';
import { Box, Typography, Paper, useTheme, useMediaQuery } from '@mui/material';
import { TimeRange } from '../common/ChartUtils';
import TimeRangeSelector from '../common/TimeRangeSelector';
import HoverTooltip from './HoverTooltip';
import Legend from './Legend';
import { useHeatMapData, HeatMapCell } from './useHeatMapData';

interface HeatMapProps {
  deviceId: string;
}

const HeatMap: React.FC<HeatMapProps> = ({ deviceId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.WEEK);
  
  const {
    processedData,
    dayLabels,
    hourLabels,
    getCellColor,
    hoveredCell,
    setHoveredCell,
    consumptionColors,
    loading,
    error
  } = useHeatMapData(deviceId, timeRange);

  // Memoize styles
  const paperStyles = useMemo(() => ({
    p: { xs: 1.5, sm: 2.5 },
    borderRadius: 2,
    bgcolor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.05)' 
      : 'rgba(0, 0, 0, 0.02)',
    width: '100%',
    height: '100%',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
  }), [theme.palette.mode]);

  const loadingStyles = useMemo(() => ({
    ...paperStyles,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }), [paperStyles]);

  const gridContainerStyles = useMemo(() => ({ 
    display: 'flex', 
    flexDirection: 'column', 
    width: '100%', 
    height: { xs: 300, sm: 400 },
    position: 'relative',
    mt: 1
  }), []);

  const dayLabelStyles = useMemo(() => ({ 
    display: 'flex', 
    flexDirection: 'column', 
    mr: 1,
    width: { xs: 30, sm: 40 }
  }), []);

  const hourLabelStyles = useMemo(() => ({ 
    display: 'flex', 
    ml: { xs: 4, sm: 6 }, 
    mb: 0.5
  }), []);

  // Check for loading state and errors
  if (loading) {
    return (
      <Paper elevation={1} sx={loadingStyles}>
        <Typography>Loading...</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={1} sx={loadingStyles}>
        <Typography color="error">Error: {error}</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={1} sx={paperStyles}>
      <Typography 
        variant="h6" 
        align="center" 
        sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, mb: 1 }}
      >
        Vzorce spotřeby energie
      </Typography>
      
      <TimeRangeSelector 
        currentRange={timeRange} 
        onRangeChange={setTimeRange}
        showHour={false}
        showMax={false}
        customLabels={{
          [TimeRange.WEEK]: 'Týden',
          [TimeRange.MONTH]: 'Měsíc'
        }}
      />
      
      <Legend consumptionColors={consumptionColors} />
      
      <Box sx={gridContainerStyles}>
        
        {/* Hlavní mřížka s popisky dnů */}
        <Box sx={{ 
          display: 'flex', 
          flex: 1
        }}>
          {/* Popisky dnů (vlevo) */}
          <Box sx={dayLabelStyles}>
            {dayLabels.map((label, i) => (
              <Box 
                key={`day-${i}`} 
                sx={{ 
                  flex: 1, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  fontWeight: 'medium',
                  color: theme.palette.text.primary
                }}
              >
                {label}
              </Box>
            ))}
          </Box>
          
          {/* Mřížka heatmapy */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            flex: 1,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            overflow: 'hidden'
          }}>
            {processedData.map((dayRow: HeatMapCell[], day: number) => (
              <Box 
                key={`row-${day}`} 
                sx={{ 
                  display: 'flex', 
                  flex: 1,
                  borderBottom: day < 6 ? `1px solid ${theme.palette.divider}` : 'none'
                }}
              >
                {dayRow.map((cell: HeatMapCell, hour: number) => (
                  <Box 
                    key={`cell-${day}-${hour}`} 
                    sx={{ 
                      flex: 1,
                      bgcolor: getCellColor(cell.level),
                      borderRight: hour < 23 ? `1px solid ${theme.palette.divider}` : 'none',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        opacity: 0.8,
                        cursor: 'pointer',
                        boxShadow: 'inset 0 0 0 2px rgba(255, 255, 255, 0.2)'
                      }
                    }}
                    onMouseEnter={() => setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                ))}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Popisky hodin (nahoře) - responsive */}
        <Box sx={hourLabelStyles}>
          {hourLabels.map((label, i) => (
            <Box 
              key={`hour-${i}`} 
              sx={{ 
                flex: 1, 
                textAlign: 'center',
                fontSize: { xs: '0.6rem', sm: '0.7rem' },
                color: theme.palette.text.secondary,
                // Na mobilech zobrazit méně popisků
                ...(isMobile 
                  ? { display: i % 6 === 0 ? 'block' : 'none' }
                  : { display: i % 3 === 0 ? 'block' : 'none' })
              }}
            >
              {isMobile 
                ? (i % 6 === 0 ? label : '') 
                : (i % 3 === 0 ? label : '')}
            </Box>
          ))}
        </Box>
        
        {/* Tooltip - optimalizovaný pro mobilní zařízení */}
        {hoveredCell && hoveredCell.count > 0 && (
          <HoverTooltip cell={hoveredCell} dayLabels={dayLabels} isMobile={isMobile} />
        )}
      </Box>
    </Paper>
  );
};

export default React.memo(HeatMap);
