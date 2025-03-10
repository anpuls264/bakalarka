import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  ListItemSecondaryAction,
  Switch,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { 
  FiArrowUp, 
  FiArrowDown, 
  FiGrid, 
  FiBarChart2, 
  FiPieChart, 
  FiActivity, 
  FiThermometer,
  FiDollarSign,
  FiSliders,
  FiZap,
  FiBattery
} from 'react-icons/fi';
import { DashboardItem, DashboardLayout } from '../types/types';

interface DashboardSettingsProps {
  layout: DashboardLayout;
  onLayoutChange: (newLayout: DashboardLayout) => void;
}

const DashboardSettings: React.FC<DashboardSettingsProps> = ({ layout, onLayoutChange }) => {
  const [items, setItems] = useState<DashboardItem[]>(layout.items);
  const [columns, setColumns] = useState<number>(layout.columns);

  // Update local state when layout prop changes
  useEffect(() => {
    setItems(layout.items);
    setColumns(layout.columns);
  }, [layout]);

  const handleVisibilityChange = (id: string) => {
    const newItems = items.map(item => 
      item.id === id ? { ...item, visible: !item.visible } : item
    );
    
    updateLayout(newItems, columns);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    
    // Update order property
    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      order: idx
    }));
    
    updateLayout(updatedItems, columns);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    
    // Update order property
    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      order: idx
    }));
    
    updateLayout(updatedItems, columns);
  };

  const handleWidthChange = (id: string, width: number) => {
    const newItems = items.map(item => 
      item.id === id ? { ...item, width } : item
    );
    
    updateLayout(newItems, columns);
  };

  const handleColumnsChange = (event: SelectChangeEvent<number>) => {
    const newColumns = event.target.value as number;
    setColumns(newColumns);
    updateLayout(items, newColumns);
  };

  const updateLayout = (newItems: DashboardItem[], newColumns: number) => {
    setItems(newItems);
    onLayoutChange({
      items: newItems,
      columns: newColumns
    });
  };

  // Get icon for dashboard item type
  const getItemIcon = (type: string) => {
    switch (type) {
      case 'control-panel':
        return <FiSliders />;
      case 'current-value-voltage':
        return <FiZap />;
      case 'current-value-power':
        return <FiActivity />;
      case 'current-value-current':
        return <FiBattery />;
      case 'real-time-graph':
        return <FiActivity />;
      case 'column-chart':
        return <FiBarChart2 />;
      case 'line-chart':
        return <FiActivity />;
      case 'pie-chart':
        return <FiPieChart />;
      case 'heat-map':
        return <FiThermometer />;
      case 'expense-box-hour':
      case 'expense-box-day':
      case 'expense-box-week':
      case 'expense-box-month':
        return <FiDollarSign />;
      default:
        return <FiGrid />;
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Dashboard Layout
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel id="columns-select-label">Grid Columns</InputLabel>
          <Select
            labelId="columns-select-label"
            id="columns-select"
            value={columns}
            label="Grid Columns"
            onChange={handleColumnsChange}
          >
            <MenuItem value={1}>1 Column</MenuItem>
            <MenuItem value={2}>2 Columns</MenuItem>
            <MenuItem value={3}>3 Columns</MenuItem>
            <MenuItem value={4}>4 Columns</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <Typography variant="subtitle1" gutterBottom>
        Dashboard Components
      </Typography>
      
      <List>
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            <ListItem>
              <ListItemIcon>
                {getItemIcon(item.type)}
              </ListItemIcon>
              <ListItemText 
                primary={item.title} 
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="caption" sx={{ mr: 1 }}>Width:</Typography>
                    <Select
                      size="small"
                      value={item.width || 4}
                      onChange={(e) => handleWidthChange(item.id, Number(e.target.value))}
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value={1}>Full Width</MenuItem>
                      <MenuItem value={2}>Half Width</MenuItem>
                      <MenuItem value={3}>One Third</MenuItem>
                      <MenuItem value={4}>One Quarter</MenuItem>
                    </Select>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton 
                    edge="end" 
                    aria-label="move up"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <FiArrowUp />
                  </IconButton>
                  <IconButton 
                    edge="end" 
                    aria-label="move down"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === items.length - 1}
                  >
                    <FiArrowDown />
                  </IconButton>
                  <Switch
                    edge="end"
                    checked={item.visible}
                    onChange={() => handleVisibilityChange(item.id)}
                    inputProps={{ 'aria-labelledby': `switch-list-label-${item.id}` }}
                  />
                </Box>
              </ListItemSecondaryAction>
            </ListItem>
            {index < items.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default DashboardSettings;
