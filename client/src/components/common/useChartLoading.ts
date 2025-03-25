// src/components/common/useChartLoading.ts
import { useState, useEffect, useRef } from 'react';

interface ChartData {
  timestamp: string;
  [key: string]: any;
}

export const useChartLoading = (data: ChartData[]) => {
  const [loading, setLoading] = useState(true);
  const initialLoadRef = useRef(true);
  
  useEffect(() => {
    // Skip loading state for subsequent data updates
    if (!initialLoadRef.current && data !== undefined) {
      setLoading(false);
      return;
    }
    
    // Show loading state only on initial load or when data becomes undefined
    if (data === undefined) {
      setLoading(true);
      return;
    }
    
    // Initial load with minimum display time
    const timer = setTimeout(() => {
      setLoading(false);
      initialLoadRef.current = false;
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [data]);
  
  return loading;
};
