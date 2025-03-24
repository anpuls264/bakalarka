// src/components/HeatMap/useHeatMapData.ts
import { useMemo, useState } from 'react';
import { useTheme } from '@mui/material';
import { ChartItem, TimeRange, getTimeRangeInMs } from '../common/ChartUtils';

export interface HeatMapCell {
  day: number;
  hour: number;
  power: number;
  count: number;
  samples: ChartItem[];
  level: ConsumptionLevel;
}

// Více stupňů spotřeby pro lepší granularitu
export enum ConsumptionLevel {
  NONE = 'none',
  VERY_LOW = 'veryLow',
  LOW = 'low',
  MEDIUM_LOW = 'mediumLow',
  MEDIUM = 'medium',
  MEDIUM_HIGH = 'mediumHigh',
  HIGH = 'high',
  VERY_HIGH = 'veryHigh'
}

export const useHeatMapData = (data: ChartItem[], timeRange: TimeRange) => {
  const theme = useTheme();
  const [hoveredCell, setHoveredCell] = useState<HeatMapCell | null>(null);

  // Konstanty pro popisky
  const dayLabels = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
  const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);

  // Zpracování dat pro heatmapu
  const heatMapData = useMemo(() => {
    if (data.length === 0) return [];

    const currentTime = new Date().getTime();
    const timeRangeMs = getTimeRangeInMs(timeRange);
    const startTime = currentTime - timeRangeMs;
    
    const filteredData = data.filter(item => {
      const itemTime = new Date(item.timestamp).getTime();
      return itemTime >= startTime && itemTime <= currentTime;
    });

    // Vytvoření 2D mřížky pro dny a hodiny
    const grid: HeatMapCell[][] = Array.from({ length: 7 }, (_, day) => 
      Array.from({ length: 24 }, (_, hour) => ({
        day,
        hour,
        power: 0,
        count: 0,
        samples: [],
        level: ConsumptionLevel.NONE
      }))
    );

    // Agregace dat podle dne a hodiny
    filteredData.forEach(item => {
      const date = new Date(item.timestamp);
      const day = date.getDay();
      const hour = date.getHours();
      
      if (!isNaN(item.apower)) {
        grid[day][hour].power += item.apower;
        grid[day][hour].count += 1;
        grid[day][hour].samples.push(item);
      }
    });

    // Výpočet průměrného výkonu pro každou buňku
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        if (grid[day][hour].count > 0) {
          grid[day][hour].power = grid[day][hour].power / grid[day][hour].count;
        }
      }
    }

    return grid;
  }, [data, timeRange]);

  // Nalezení maximální hodnoty výkonu pro škálování barev
  const maxPower = useMemo(() => {
    if (!heatMapData.length) return 0;
    
    let max = 0;
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        if (heatMapData[day][hour].count > 0 && heatMapData[day][hour].power > max) {
          max = heatMapData[day][hour].power;
        }
      }
    }
    return max;
  }, [heatMapData]);

  // Určení úrovně spotřeby pro každou buňku
  const processedData = useMemo(() => {
    if (!heatMapData.length) return [];
    
    // Kopie dat
    const processed = JSON.parse(JSON.stringify(heatMapData));
    
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const cell = processed[day][hour];
        if (cell.count > 0) {
          const normalizedValue = cell.power / maxPower;
          
          // Přiřazení úrovně spotřeby podle normalizované hodnoty
          if (normalizedValue <= 0.001) {
            cell.level = ConsumptionLevel.NONE;
          } else if (normalizedValue <= 0.125) {
            cell.level = ConsumptionLevel.VERY_LOW;
          } else if (normalizedValue <= 0.25) {
            cell.level = ConsumptionLevel.LOW;
          } else if (normalizedValue <= 0.375) {
            cell.level = ConsumptionLevel.MEDIUM_LOW;
          } else if (normalizedValue <= 0.5) {
            cell.level = ConsumptionLevel.MEDIUM;
          } else if (normalizedValue <= 0.625) {
            cell.level = ConsumptionLevel.MEDIUM_HIGH;
          } else if (normalizedValue <= 0.75) {
            cell.level = ConsumptionLevel.HIGH;
          } else {
            cell.level = ConsumptionLevel.VERY_HIGH;
          }
        }
      }
    }
    
    return processed;
  }, [heatMapData, maxPower]);

  // Barvy pro různé úrovně spotřeby optimalizované pro tmavý režim
  const consumptionColors = useMemo(() => {
    const isDark = theme.palette.mode === 'dark';
    
    return {
      [ConsumptionLevel.NONE]: theme.palette.mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.03)' 
        : 'rgba(0, 0, 0, 0.03)',
      [ConsumptionLevel.VERY_LOW]: isDark 
        ? 'rgba(41, 121, 255, 0.2)' 
        : 'rgba(33, 150, 243, 0.1)',
      [ConsumptionLevel.LOW]: isDark 
        ? 'rgba(41, 121, 255, 0.3)' 
        : 'rgba(33, 150, 243, 0.2)',
      [ConsumptionLevel.MEDIUM_LOW]: isDark 
        ? 'rgba(41, 121, 255, 0.4)' 
        : 'rgba(33, 150, 243, 0.3)',
      [ConsumptionLevel.MEDIUM]: isDark 
        ? 'rgba(41, 121, 255, 0.5)' 
        : 'rgba(33, 150, 243, 0.5)',
      [ConsumptionLevel.MEDIUM_HIGH]: isDark 
        ? 'rgba(41, 121, 255, 0.65)' 
        : 'rgba(33, 150, 243, 0.65)',
      [ConsumptionLevel.HIGH]: isDark 
        ? 'rgba(41, 121, 255, 0.8)' 
        : 'rgba(33, 150, 243, 0.8)',
      [ConsumptionLevel.VERY_HIGH]: isDark 
        ? 'rgba(41, 121, 255, 0.95)' 
        : 'rgba(33, 150, 243, 0.95)'
    };
  }, [theme.palette.mode]);

  // Výpočet barvy buňky na základě úrovně spotřeby
  const getCellColor = (level: ConsumptionLevel) => {
    return consumptionColors[level];
  };

  return {
    processedData,
    dayLabels,
    hourLabels,
    maxPower,
    getCellColor,
    hoveredCell,
    setHoveredCell,
    consumptionColors
  };
};