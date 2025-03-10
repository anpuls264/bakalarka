import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, useTheme, Tooltip, IconButton, Fade, Slider, TextField, InputAdornment } from '@mui/material';
import { FiInfo, FiEdit2, FiCheck } from 'react-icons/fi';

interface ExpenseBoxProps {
  amount: number;
  den: string;
}

const ExpenseBox: React.FC<ExpenseBoxProps> = ({ amount, den }) => {
  const theme = useTheme();
  const [value, setValue] = useState<number>(() => {
    // Load initial value from localStorage for key 'myNumber'
    const storedValue = localStorage.getItem('myNumber');
    return storedValue ? parseFloat(storedValue) : 1;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [showAnimation, setShowAnimation] = useState(false);

  // Function to update value in localStorage and state
  const updateValue = (newValue: number) => {
    localStorage.setItem('myNumber', newValue.toString());
    setValue(newValue);
    setShowAnimation(true);
  };

  // Reset animation state after it plays
  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => setShowAnimation(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [showAnimation]);

  // Get appropriate label based on time period
  const getLabel = () => {
    switch (den) {
      case 'hodinu':
        return 'Útrata za poslední hodinu';
      case 'den':
        return 'Útrata za poslední den';
      case 'týden':
        return 'Útrata za poslední týden';
      case 'měsíc':
        return 'Útrata za poslední měsíc';
      default:
        return `Útrata za poslední ${den}`;
    }
  };

  // Handle editing rate
  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      updateValue(tempValue);
    } else {
      // Start editing
      setTempValue(value);
    }
    setIsEditing(!isEditing);
  };

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value);
    if (!isNaN(newValue) && newValue > 0) {
      setTempValue(newValue);
    }
  };

  // Calculate the expense, handling NaN values
  const calculateExpense = () => {
    if (isNaN(amount) || amount === 0) return '0.00';
    return ((amount / 1000) * value).toFixed(2);
  };
  
  const expense = calculateExpense();
  
  // Determine color based on amount (higher values are more red)
  const getAmountColor = () => {
    if (isNaN(parseFloat(expense))) return theme.palette.primary.main;
    
    const normalizedAmount = Math.min(parseFloat(expense) / 100, 1); // Normalize to 0-1 range
    return normalizedAmount > 0.7 ? theme.palette.error.main : 
           normalizedAmount > 0.4 ? theme.palette.warning.main : 
           theme.palette.primary.main;
  };

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      p: 2,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Title with info tooltip */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography 
          variant="subtitle1" 
          color="text.secondary"
          sx={{ textAlign: 'center' }}
        >
          {getLabel()}
        </Typography>
        <Tooltip title="Cena je vypočítána na základě aktuální sazby za kWh">
          <IconButton size="small" sx={{ ml: 0.5 }}>
            <FiInfo size={16} />
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* Amount display with animation */}
      <Typography 
        variant="h4" 
        fontWeight="bold"
        sx={{ 
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
          textAlign: 'center',
          color: getAmountColor(),
          transition: 'transform 0.3s, color 0.3s',
          transform: showAnimation ? 'scale(1.1)' : 'scale(1)'
        }}
      >
        {expense} CZK
      </Typography>
      
      {/* Rate editor */}
      <Box sx={{ mt: 2, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isEditing ? (
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <TextField
              size="small"
              label="Sazba"
              type="number"
              value={tempValue}
              onChange={handleValueChange}
              InputProps={{
                endAdornment: <InputAdornment position="end">Kč/kWh</InputAdornment>,
              }}
              sx={{ width: '80%' }}
            />
            <IconButton onClick={handleEditToggle} color="primary" sx={{ ml: 1 }}>
              <FiCheck />
            </IconButton>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Sazba: {value} Kč/kWh
            </Typography>
            <IconButton onClick={handleEditToggle} size="small" sx={{ ml: 0.5 }}>
              <FiEdit2 size={14} />
            </IconButton>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ExpenseBox;
