import React, { useEffect, useState } from 'react';
import { useTheme, Box, Typography, Button, Paper } from '@mui/material';
import './Tabs.css';
import DashboardSettings from './DashboardSettings';
import { dashboardService } from '../services/DashboardService';
import { DashboardLayout } from '../models/Dashboard';

const Tabs: React.FC = () => {
  const theme = useTheme();
  const [dashboardLayout, setDashboardLayout] = useState<DashboardLayout | null>(null);
  
  // Load dashboard layout
  useEffect(() => {
    const unsubscribe = dashboardService.subscribeToLayout((layout) => {
      setDashboardLayout(layout);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  const handleDashboardLayoutChange = (newLayout: DashboardLayout) => {
    dashboardService.updateLayout(newLayout);
  };

  const handleSaveButtonClick = () => {
    // Save dashboard layout
    if (dashboardLayout) {
      dashboardService.updateLayout(dashboardLayout);
    }
  };

  if (!dashboardLayout) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        p: 3
      }}>
        <Typography>Načítání...</Typography>
      </Box>
    );
  }

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        width: '100%',
        height: '100%',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.background.paper,
        borderRadius: 2
      }}
    >
      <Typography 
        variant="h5" 
        component="h2" 
        sx={{ 
          textAlign: 'center',
          fontWeight: 'medium',
          p: { xs: 2, sm: 3 },
          pb: { xs: 1, sm: 2 },
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        Nastavení dashboardu
      </Typography>
      
      <Box 
        sx={{ 
          flexGrow: 1,
          overflow: 'auto',
          p: { xs: 2, sm: 3 },
          pt: { xs: 2, sm: 2 }
        }}
      >
        <DashboardSettings 
          layout={dashboardLayout}
          onLayoutChange={handleDashboardLayoutChange}
        />
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center',
        p: { xs: 2, sm: 3 },
        pt: { xs: 1, sm: 2 },
        borderTop: `1px solid ${theme.palette.divider}`
      }}>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleSaveButtonClick}
          sx={{ 
            minWidth: 120,
            py: 1
          }}
        >
          Uložit změny
        </Button>
      </Box>
    </Paper>
  );
};

export default Tabs;
