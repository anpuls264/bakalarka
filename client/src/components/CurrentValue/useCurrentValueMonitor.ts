import { useState, useEffect } from 'react';

export type TrendDirection = 'up' | 'down' | 'stable';

interface CurrentValueState {
  lastValidValue: number | undefined;
  previousValue: number | undefined;
  trend: TrendDirection;
  changePercentage: string;
}

export const useCurrentValueMonitor = (value: number, significantChangeThreshold = 0.5) => {
  const [state, setState] = useState<CurrentValueState>({
    lastValidValue: undefined,
    previousValue: undefined,
    trend: 'stable',
    changePercentage: '0%'
  });

  useEffect(() => {
    if (value !== undefined && !isNaN(value)) {
      setState(prevState => {
        const { lastValidValue } = prevState;
        let trend: TrendDirection = 'stable';
        let changePercentage = '0%';
        
        if (lastValidValue !== undefined) {
          const change = ((value - lastValidValue) / lastValidValue) * 100;
          const isSignificantChange = Math.abs(change) > significantChangeThreshold;
          
          trend = isSignificantChange
            ? (value > lastValidValue ? 'up' : 'down')
            : 'stable';
            
          changePercentage = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
        }
        
        return {
          lastValidValue: value,
          previousValue: lastValidValue,
          trend,
          changePercentage
        };
      });
    }
  }, [value, significantChangeThreshold]);

  // Percentage calculation for progress bar
  const calculatePercentage = (min: number, max: number): number => {
    if (state.lastValidValue === undefined || min === max) return 0;
    const percentage = ((state.lastValidValue - min) / (max - min)) * 100;
    return Math.min(Math.max(percentage, 0), 100); // Clamp between 0-100
  };

  return {
    ...state,
    calculatePercentage
  };
};