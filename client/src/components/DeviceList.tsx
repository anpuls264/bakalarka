import React, { useEffect, useState } from 'react';
import { 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton, 
  Typography, 
  Paper, 
  Box,
  Chip,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  SelectChangeEvent
} from '@mui/material';
import { FiPower, FiThermometer, FiDroplet, FiZap, FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import { deviceService } from '../services/DeviceService';
import { Device } from '../models/Device';

interface DeviceListProps {
  onSelectDevice?: (device: Device) => void;
}

const DeviceList: React.FC<DeviceListProps> = ({ onSelectDevice }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  
  // Formulářová data pro přidání/úpravu zařízení
  const [formData, setFormData] = useState({
    name: '',
    type: 'shelly-plug-s',
    mqttTopic: '',
    capabilities: ['power', 'bluetooth', 'wifi']
  });
  
  // Načíst zařízení
  const loadDevices = async () => {
    try {
      setLoading(true);
      const fetchedDevices = await deviceService.fetchAllDevices();
      setDevices(fetchedDevices);
      setError(null);
    } catch (err: any) {
      setError('Nepodařilo se načíst zařízení');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Načíst zařízení při načtení komponenty
  useEffect(() => {
    loadDevices();
    
    // Nastavit interval pro pravidelné obnovení seznamu zařízení
    const intervalId = setInterval(loadDevices, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Získat ikonu podle typu zařízení
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'shelly-plug-s':
        return <FiZap />;
      case 'shelly-ht':
        return <FiThermometer />;
      default:
        return <FiZap />;
    }
  };

  // Získat status chip podle stavu zařízení
  const getStatusChip = (device: Device) => {
    if (device.type === 'shelly-plug-s') {
      return (
        <Chip 
          size="small" 
          color={device.state?.deviceTurnOnOff ? "success" : "default"}
          label={device.state?.deviceTurnOnOff ? "Zapnuto" : "Vypnuto"}
        />
      );
    } else if (device.type === 'shelly-ht') {
      return (
        <Chip 
          size="small" 
          color="info"
          label={`${device.state?.temperature || 0}°C / ${device.state?.humidity || 0}%`}
        />
      );
    }
    
    return null;
  };

  // Otevřít dialog pro přidání zařízení
  const handleOpenAddDialog = () => {
    setFormData({
      name: '',
      type: 'shelly-plug-s',
      mqttTopic: '',
      capabilities: ['power', 'bluetooth', 'wifi']
    });
    setOpenAddDialog(true);
  };

  // Otevřít dialog pro úpravu zařízení
  const handleOpenEditDialog = (device: Device) => {
    setSelectedDevice(device);
    setFormData({
      name: device.name,
      type: device.type,
      mqttTopic: device.state?.mqttTopic || '',
      capabilities: ['power', 'bluetooth', 'wifi'] // Toto by mělo být načteno ze zařízení
    });
    setOpenEditDialog(true);
  };

  // Otevřít dialog pro odstranění zařízení
  const handleOpenDeleteDialog = (device: Device) => {
    setSelectedDevice(device);
    setOpenDeleteDialog(true);
  };

  // Zpracovat změnu formuláře pro textová pole
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Zpracovat změnu formuláře pro select
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Přidat nové zařízení
  const handleAddDevice = async () => {
    try {
      setLoading(true);
      const newDevice = await deviceService.addDevice(
        formData.name,
        formData.type,
        formData.mqttTopic,
        formData.capabilities
      );
      
      if (newDevice) {
        setDevices(prev => [...prev, newDevice]);
        setOpenAddDialog(false);
      } else {
        setError('Nepodařilo se přidat zařízení');
      }
    } catch (err: any) {
      setError('Nepodařilo se přidat zařízení');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Upravit zařízení
  const handleEditDevice = async () => {
    if (!selectedDevice) return;
    
    try {
      setLoading(true);
      const updatedDevice = await deviceService.updateDeviceConfig(
        selectedDevice.id,
        {
          name: formData.name,
          mqttTopic: formData.mqttTopic,
          capabilities: formData.capabilities
        }
      );
      
      if (updatedDevice) {
        setDevices(prev => prev.map(d => d.id === updatedDevice.id ? updatedDevice : d));
        setOpenEditDialog(false);
      } else {
        setError('Nepodařilo se upravit zařízení');
      }
    } catch (err: any) {
      setError('Nepodařilo se upravit zařízení');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Odstranit zařízení
  const handleDeleteDevice = async () => {
    if (!selectedDevice) return;
    
    try {
      setLoading(true);
      const success = await deviceService.deleteDevice(selectedDevice.id);
      
      if (success) {
        setDevices(prev => prev.filter(d => d.id !== selectedDevice.id));
        setOpenDeleteDialog(false);
      } else {
        setError('Nepodařilo se odstranit zařízení');
      }
    } catch (err: any) {
      setError('Nepodařilo se odstranit zařízení');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && devices.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Moje zařízení</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<FiPlus />}
          onClick={handleOpenAddDialog}
        >
          Přidat zařízení
        </Button>
      </Box>
      
      {error && (
        <Box sx={{ p: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}
      
      {devices.length === 0 ? (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Žádná zařízení nebyla nalezena
          </Typography>
        </Box>
      ) : (
        <List>
          {devices.map((device) => (
            <ListItem 
              key={device.id}
              onClick={() => onSelectDevice && onSelectDevice(device)}
              sx={{ 
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  cursor: 'pointer'
                }
              }}
            >
              <Box sx={{ mr: 2, color: 'primary.main' }}>
                {getDeviceIcon(device.type)}
              </Box>
              
              <ListItemText 
                primary={device.name} 
                secondary={device.type === 'shelly-plug-s' 
                  ? `${device.state?.currentPower || 0} W` 
                  : `Teplota: ${device.state?.temperature || 0}°C`
                } 
              />
              
              <ListItemSecondaryAction>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getStatusChip(device)}
                  
                  <IconButton 
                    edge="end" 
                    aria-label="edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditDialog(device);
                    }}
                    sx={{ ml: 1 }}
                  >
                    <FiEdit />
                  </IconButton>
                  
                  <IconButton 
                    edge="end" 
                    aria-label="delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDeleteDialog(device);
                    }}
                    sx={{ ml: 1 }}
                  >
                    <FiTrash2 />
                  </IconButton>
                </Box>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
      
      {/* Dialog pro přidání zařízení */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle>Přidat nové zařízení</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              margin="normal"
              label="Název zařízení"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              required
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Typ zařízení</InputLabel>
              <Select
                name="type"
                value={formData.type}
                onChange={handleSelectChange}
                label="Typ zařízení"
              >
                <MenuItem value="shelly-plug-s">Shelly Plug S</MenuItem>
                <MenuItem value="shelly-ht">Shelly H&T</MenuItem>
              </Select>
              <FormHelperText>Vyberte typ zařízení</FormHelperText>
            </FormControl>
            
            <TextField
              fullWidth
              margin="normal"
              label="MQTT téma"
              name="mqttTopic"
              value={formData.mqttTopic}
              onChange={handleFormChange}
              required
              helperText="Např. shelly1, shelly2, atd."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Zrušit</Button>
          <Button 
            onClick={handleAddDevice} 
            variant="contained" 
            color="primary"
            disabled={!formData.name || !formData.mqttTopic || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Přidat'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog pro úpravu zařízení */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Upravit zařízení</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              margin="normal"
              label="Název zařízení"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              required
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="MQTT téma"
              name="mqttTopic"
              value={formData.mqttTopic}
              onChange={handleFormChange}
              required
              helperText="Např. shelly1, shelly2, atd."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Zrušit</Button>
          <Button 
            onClick={handleEditDevice} 
            variant="contained" 
            color="primary"
            disabled={!formData.name || !formData.mqttTopic || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Uložit'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog pro odstranění zařízení */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Odstranit zařízení</DialogTitle>
        <DialogContent>
          <Typography>
            Opravdu chcete odstranit zařízení "{selectedDevice?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Zrušit</Button>
          <Button 
            onClick={handleDeleteDevice} 
            variant="contained" 
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Odstranit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default DeviceList;
