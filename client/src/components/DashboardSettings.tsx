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
  SelectChangeEvent,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Grid,
  Tooltip,
  Paper
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
  FiBattery,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import { DashboardLayout, DashboardItem } from '../models/Dashboard';

interface DashboardSettingsProps {
  layout: DashboardLayout;
  onLayoutChange: (newLayout: DashboardLayout) => void;
}

const DashboardSettings: React.FC<DashboardSettingsProps> = ({ layout, onLayoutChange }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
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
        return <FiSliders size={20} />;
      case 'current-value-voltage':
        return <FiZap size={20} />;
      case 'current-value-power':
        return <FiActivity size={20} />;
      case 'current-value-current':
        return <FiBattery size={20} />;
      case 'real-time-graph':
        return <FiActivity size={20} />;
      case 'column-chart':
        return <FiBarChart2 size={20} />;
      case 'line-chart':
        return <FiActivity size={20} />;
      case 'pie-chart':
        return <FiPieChart size={20} />;
      case 'heat-map':
        return <FiThermometer size={20} />;
      case 'expense-box-hour':
      case 'expense-box-day':
      case 'expense-box-week':
      case 'expense-box-month':
        return <FiDollarSign size={20} />;
      default:
        return <FiGrid size={20} />;
    }
  };

  // Get translated component name
  const getComponentName = (type: string) => {
    switch (type) {
      case 'control-panel':
        return 'Ovládací panel';
      case 'current-value-voltage':
        return 'Aktuální napětí';
      case 'current-value-power':
        return 'Aktuální výkon';
      case 'current-value-current':
        return 'Aktuální proud';
      case 'real-time-graph':
        return 'Graf v reálném čase';
      case 'column-chart':
        return 'Sloupcový graf';
      case 'line-chart':
        return 'Čárový graf';
      case 'pie-chart':
        return 'Koláčový graf';
      case 'heat-map':
        return 'Teplotní mapa';
      case 'expense-box-hour':
        return 'Hodinové náklady';
      case 'expense-box-day':
        return 'Denní náklady';
      case 'expense-box-week':
        return 'Týdenní náklady';
      case 'expense-box-month':
        return 'Měsíční náklady';
      default:
        return type;
    }
  };

  // Get width label
  const getWidthLabel = (width: number) => {
    switch (width) {
      case 1:
        return 'Plná šířka';
      case 2:
        return 'Poloviční šířka';
      case 3:
        return 'Třetina šířky';
      case 4:
        return 'Čtvrtina šířky';
      default:
        return `${width} jednotek`;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2, sm: 2 }, 
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            flex: { xs: '1 1 auto', md: '0 0 300px' }
          }}
        >
          <Typography variant="subtitle1" gutterBottom>
            Rozložení dashboardu
          </Typography>
          
          <FormControl fullWidth size="small">
            <InputLabel id="columns-select-label">Počet sloupců</InputLabel>
            <Select
              labelId="columns-select-label"
              id="columns-select"
              value={columns}
              label="Počet sloupců"
              onChange={handleColumnsChange}
            >
              <MenuItem value={1}>1 sloupec</MenuItem>
              <MenuItem value={2}>2 sloupce</MenuItem>
              <MenuItem value={3}>3 sloupce</MenuItem>
              <MenuItem value={4}>4 sloupce</MenuItem>
            </Select>
          </FormControl>
        </Paper>
        
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2, sm: 2 }, 
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <Typography variant="subtitle1" gutterBottom>
            Nápověda
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            • Pomocí přepínačů můžete zobrazit nebo skrýt jednotlivé komponenty
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Šipkami nahoru a dolů můžete měnit pořadí komponent
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Nastavením šířky určíte, kolik místa komponenta zabírá
          </Typography>
        </Paper>
      </Box>
      
      <Typography variant="subtitle1" gutterBottom>
        Komponenty dashboardu
      </Typography>
      
      {isMobile ? (
        // Mobile view - cards
        <Box>
          {items.map((item, index) => (
            <Card 
              key={item.id} 
              sx={{ 
                mb: 2,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: 'none'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 1,
                    borderRadius: 1,
                    bgcolor: theme.palette.action.hover,
                    mr: 2
                  }}>
                    {getItemIcon(item.type)}
                  </Box>
                  <Typography variant="subtitle1">
                    {getComponentName(item.type)}
                  </Typography>
                  <Box sx={{ ml: 'auto' }}>
                    <Switch
                      checked={item.visible}
                      onChange={() => handleVisibilityChange(item.id)}
                      color="primary"
                    />
                  </Box>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Šířka</InputLabel>
                      <Select
                        value={item.width || 4}
                        label="Šířka"
                        onChange={(e) => handleWidthChange(item.id, Number(e.target.value))}
                      >
                        <MenuItem value={1}>Plná šířka</MenuItem>
                        <MenuItem value={2}>Poloviční šířka</MenuItem>
                        <MenuItem value={3}>Třetina šířky</MenuItem>
                        <MenuItem value={4}>Čtvrtina šířky</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Tooltip title="Posunout nahoru">
                    <span>
                      <IconButton 
                        size="small"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        sx={{ mr: 1 }}
                      >
                        <FiArrowUp />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Posunout dolů">
                    <span>
                      <IconButton 
                        size="small"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === items.length - 1}
                      >
                        <FiArrowDown />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        // Desktop view - list
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden'
          }}
        >
          <List disablePadding>
            {items.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem 
                  sx={{ 
                    py: 2,
                    px: { sm: 2, md: 3 }
                  }}
                >
                  <ListItemIcon>
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 1,
                      borderRadius: 1,
                      bgcolor: theme.palette.action.hover
                    }}>
                      {getItemIcon(item.type)}
                    </Box>
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Typography variant="subtitle1">
                        {getComponentName(item.type)}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ 
                        display: 'flex', 
                        mt: 1,
                        flexDirection: isTablet ? 'column' : 'row',
                        alignItems: isTablet ? 'flex-start' : 'center'
                      }}>
                        <FormControl 
                          size="small" 
                          sx={{ 
                            minWidth: 150,
                            mr: isTablet ? 0 : 2,
                            mb: isTablet ? 1 : 0
                          }}
                        >
                          <InputLabel>Šířka</InputLabel>
                          <Select
                            value={item.width || 4}
                            label="Šířka"
                            onChange={(e) => handleWidthChange(item.id, Number(e.target.value))}
                          >
                            <MenuItem value={1}>Plná šířka</MenuItem>
                            <MenuItem value={2}>Poloviční šířka</MenuItem>
                            <MenuItem value={3}>Třetina šířky</MenuItem>
                            <MenuItem value={4}>Čtvrtina šířky</MenuItem>
                          </Select>
                        </FormControl>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          {item.visible ? (
                            <>
                              <FiEye style={{ marginRight: '4px' }} />
                              Viditelné
                            </>
                          ) : (
                            <>
                              <FiEyeOff style={{ marginRight: '4px' }} />
                              Skryté
                            </>
                          )}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      '& > *': { ml: 1 }
                    }}>
                      <Tooltip title="Posunout nahoru">
                        <span>
                          <IconButton 
                            size="small"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                          >
                            <FiArrowUp />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Posunout dolů">
                        <span>
                          <IconButton 
                            size="small"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === items.length - 1}
                          >
                            <FiArrowDown />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={item.visible ? "Skrýt" : "Zobrazit"}>
                        <Switch
                          edge="end"
                          checked={item.visible}
                          onChange={() => handleVisibilityChange(item.id)}
                          color="primary"
                        />
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < items.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default DashboardSettings;
