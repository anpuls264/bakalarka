import { Device, DeviceConfig, DeviceCommands } from './Device';

export class ShellyPlugS extends Device {
  private lastTotalValue: number | null = null;

  constructor(config: DeviceConfig) {
    super(config);
    
    // Inicializace výchozího stavu
    this.state = {
      ...this.state,
      deviceTurnOnOff: true,
      bluetoothEnable: false,
      mqttEnable: false,
      wifiName: null,
      wifiConnected: false,
      currentPower: 0,
      currentVoltage: 0,
      currentCurrent: 0,
      totalEnergy: 0
    };
  }

  // Zpracování MQTT zpráv
  handleMessage(topic: string, message: Buffer): void {
    console.log(`ShellyPlugS (${this.config.id}) received message on topic ${topic}`);
    
    try {
      const messageStr = message.toString();
      const data = JSON.parse(messageStr);
      
      if (topic === `${this.config.mqttPrefix}/status/switch:0`) {
        // Zpracování dat o spotřebě
        this.handlePowerData(data);
      } else if (topic === `${this.config.mqttPrefix}/status/wifi`) {
        // Zpracování dat o WiFi
        this.handleWifiData(data);
      } else if (topic === `${this.config.mqttPrefix}/status/ble`) {
        // Zpracování dat o Bluetooth
        this.handleBluetoothData(data);
      } else if (topic === `${this.config.mqttPrefix}/status/mqtt`) {
        // Zpracování dat o MQTT
        this.handleMqttData(data);
      } else if (topic === 'user_1/rpc') {
        // Zpracování RPC odpovědí
        this.handleRpcResponse(data);
      }
    } catch (error) {
      console.error(`Error processing message for ShellyPlugS (${this.config.id}):`, error);
    }
  }

  // Zpracování dat o spotřebě
  private handlePowerData(data: any): void {
    if (!data.apower || !data.voltage || !data.current || !data.aenergy?.total) {
      return;
    }
    
    // Úprava celkové energie, pokud došlo k resetu
    let totalEnergy = data.aenergy.total;
    if (this.lastTotalValue !== null && totalEnergy < this.lastTotalValue) {
      totalEnergy += this.lastTotalValue;
    }
    this.lastTotalValue = totalEnergy;
    
    // Aktualizace stavu
    this.updateState({
      currentPower: data.apower,
      currentVoltage: data.voltage,
      currentCurrent: data.current,
      totalEnergy: totalEnergy,
      deviceTurnOnOff: data.output === true
    });
    
    // Publikování metrik pro uložení do databáze
    this.publishElectricalMetrics({
      apower: data.apower,
      voltage: data.voltage,
      current: data.current,
      total: totalEnergy
    });
  }

  // Zpracování dat o WiFi
  private handleWifiData(data: any): void {
    const updates: any = {};
    
    if (data.ssid) {
      updates.wifiName = data.ssid;
    }
    
    if (data.status) {
      updates.wifiConnected = data.status === 'got ip' || data.status === 'connected';
    }
    
    this.updateState(updates);
  }

  // Zpracování dat o Bluetooth
  private handleBluetoothData(data: any): void {
    if (typeof data === 'object' && Object.keys(data).length > 0) {
      this.updateState({
        bluetoothEnable: true
      });
    } else {
      // Prázdný objekt {} často znamená, že Bluetooth je vypnutý
      this.updateState({
        bluetoothEnable: false
      });
    }
  }

  // Zpracování dat o MQTT
  private handleMqttData(data: any): void {
    if (data.connected !== undefined) {
      this.updateState({
        mqttEnable: data.connected
      });
    }
  }

  // Zpracování RPC odpovědí
  private handleRpcResponse(data: any): void {
    if (!data.id || !data.result) {
      return;
    }
    
    // Zpracování různých typů odpovědí podle ID
    switch (data.id) {
      case 123: // Shelly.GetConfig
        if (data.result.name) {
          this.updateState({ deviceName: data.result.name });
        }
        if (data.result.mqtt?.enable !== undefined) {
          this.updateState({ mqttEnable: data.result.mqtt.enable });
        }
        if (data.result.ble?.enable !== undefined) {
          this.updateState({ bluetoothEnable: data.result.ble.enable });
        }
        break;
        
      case 130: // Wifi.GetStatus
      case 131: // Wifi.GetConfig
        if (data.result.wifi?.sta?.ssid) {
          this.updateState({ wifiName: data.result.wifi.sta.ssid });
        }
        break;
        
      case 125: // Switch.Set
        if (data.result && typeof data.result.output === 'boolean') {
          this.updateState({ deviceTurnOnOff: data.result.output });
        }
        break;
    }
  }

  // Publikování počátečních MQTT zpráv
  publishInitialMessages(): void {
    const initialPayloads = [
      { id: 123, src: "user_1", method: "Shelly.GetConfig" },
      { id: 130, src: "user_1", method: "Wifi.GetStatus" },
      { id: 131, src: "user_1", method: "Wifi.GetConfig" }
    ];
    
    initialPayloads.forEach(payload => {
      this.publishMqttMessage(`${this.config.mqttPrefix}/rpc`, JSON.stringify(payload));
    });
  }

  // Dostupné příkazy pro zařízení
  getCommands(): DeviceCommands {
    return {
      togglePower: (turnOn: boolean) => {
        const payload = {
          id: 125,
          src: "user_1",
          method: "Switch.Set",
          params: { id: 0, on: turnOn }
        };
        
        this.publishMqttMessage(`${this.config.mqttPrefix}/rpc`, JSON.stringify(payload));
        // Pro lepší UX aktualizujeme stav okamžitě, bude opraven, pokud se skutečný stav liší
        this.updateState({ deviceTurnOnOff: turnOn });
      },
    }
  }
}