// src/components/common/useChartLoading.ts
import { useState, useEffect } from 'react';

export const useChartLoading = (data: any[]) => {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Inicializace jako načítající
    setLoading(true);
    
    // Simulace načítání na začátku nebo při změně dat
    const timer = setTimeout(() => {
      // Pokud máme data nebo explicitně prázdné pole, už nenačítáme
      setLoading(data === undefined);
    }, 1000); // Dáme uživateli aspoň 1 vteřinu, aby viděl skeletony
    
    return () => clearTimeout(timer);
  }, [data]);
  
  return loading;
};