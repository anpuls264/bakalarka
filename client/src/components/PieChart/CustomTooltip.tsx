import React from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { TooltipProps } from 'recharts';

interface CustomPieTooltipProps extends TooltipProps<number, string> {
  formatValue: (value: number) => string;
}

// Aktualizované rozhraní, které lépe odpovídá reálné struktuře dat
interface PieChartPayload {
  name: string;
  value: number;
  color?: string;
  fill?: string;
  percent?: number; // Naše vlastní vypočítaná hodnota
  payload?: {  // Nepovinné pole payload pro kompatibilitu
    name: string;
    value: number;
    color?: string;
    percent?: number;
    payload?: any; // Může obsahovat další vnořený payload
  };
}

const CustomPieTooltip: React.FC<CustomPieTooltipProps> = ({ 
  active, 
  payload, 
  formatValue 
}) => {
  const theme = useTheme();
  
  if (!active || !payload || !payload.length) return null;
  
  // Pro debugování - můžete odkomentovat, pokud potřebujete vidět strukturu
  // console.log("DEBUG Tooltip payload:", JSON.stringify(payload, null, 2));
  
  // Bezpečně přistupujeme k prvnímu datovému objektu a typujeme jej
  const data = payload[0] as any;
  
  // Bezpečně extrahujeme hodnotu procent
  // Nejprve zkusíme najít naše vlastní vypočítaná procenta
  const percentValue = 
    data.percent || // Naše vlastní vypočítaná procenta (přímo v datech)
    (data.payload && data.payload.percent) || // Procenta v payload
    0; // Fallback na 0
  
  // Bezpečný přístup k hodnotě s fallbackem
  const value = typeof data.value === 'number' ? data.value : 0;
  
  // Bezpečné získání barvy
  const itemColor = 
    data.color || 
    data.fill ||
    (data.payload && data.payload.color) || 
    theme.palette.primary.main; // Fallback na hlavní barvu
  
  // Bezpečné získání názvu
  const name = data.name || (data.payload && data.payload.name) || '';

  return (
    <Paper
      elevation={3}
      sx={{
        p: 1.5,
        borderRadius: 1,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        minWidth: 150
      }}
    >
      <Typography 
        variant="subtitle2" 
        sx={{ 
          fontWeight: 'bold',
          color: itemColor
        }}
      >
        {`${name}: ${formatValue(value)}`}
      </Typography>
      
      <Typography 
        variant="body2"
        sx={{ mt: 0.5 }}
      >
        {`${(percentValue * 100).toFixed(1)}%`}
      </Typography>
    </Paper>
  );
};

export default React.memo(CustomPieTooltip);