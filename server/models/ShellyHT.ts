import { Device, DeviceConfig, DeviceCommands } from './Device';

export class ShellyHT extends Device {
  private pendingMetrics: {
    temperature?: number;
    humidity?: number;
    lastUpdate: number;
  } = {
    lastUpdate: Date.now()
  };
  
  private metricsUpdateTimeout: NodeJS.Timeout | null = null;
  private readonly METRICS_TIMEOUT = 10000; // 10 sekund na čekání na kompletní data
  
  constructor(config: DeviceConfig) {
    super(config);
    
    // Inicializace výchozího stavu
    this.state = {
      ...this.state,
      temperature: 0,
      humidity: 0,
      battery: 100,
      bluetoothEnable: false,
      mqttEnable: false,
      wifiName: null,
      wifiConnected: false,
    };
  }

  // Zpracování MQTT zpráv
  handleMessage(topic: string, message: Buffer): void {
    console.log(`ShellyHT (${this.config.id}) received message on topic ${topic}`);
    
    try {
      const messageStr = message.toString();
      const data = JSON.parse(messageStr);
      
      if (topic === `${this.config.mqttPrefix}/status/temperature:0`) {
        // Zpracování dat o teplotě
        this.handleTemperatureData(data);
      } else if (topic === `${this.config.mqttPrefix}/status/humidity:0`) {
        // Zpracování dat o vlhkosti
        this.handleHumidityData(data);
      } else if (topic === `${this.config.mqttPrefix}/status/devicepower:0`) {
        // Zpracování dat o baterii
        this.handleBatteryData(data);
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
      console.error(`Error processing message for ShellyHT (${this.config.id}):`, error);
    }
  }

  // Zpracování dat o teplotě
  private handleTemperatureData(data: any): void {
    if (data.tC === undefined) {
      return;
    }
    
    // Aktualizace stavu
    this.updateState({
      temperature: data.tC
    });
    
    // Uložení do dočasných metrik
    this.pendingMetrics.temperature = data.tC;
    this.pendingMetrics.lastUpdate = Date.now();
    
    // Pokus o odeslání kompletních metrik
    this.tryPublishCompleteMetrics();
  }

  // Zpracování dat o vlhkosti
  private handleHumidityData(data: any): void {
    if (data.rh === undefined) {
      return;
    }
    
    // Aktualizace stavu
    this.updateState({
      humidity: data.rh
    });
    
    // Uložení do dočasných metrik
    this.pendingMetrics.humidity = data.rh;
    this.pendingMetrics.lastUpdate = Date.now();
    
    // Pokus o odeslání kompletních metrik
    this.tryPublishCompleteMetrics();
  }

  // Metoda pro kontrolu a odeslání kompletních metrik
  private tryPublishCompleteMetrics(): void {
    // Zrušení předchozího timeoutu, pokud existuje
    if (this.metricsUpdateTimeout) {
      clearTimeout(this.metricsUpdateTimeout);
      this.metricsUpdateTimeout = null;
    }
    
    // Kontrola, zda máme oba typy dat
    if (this.pendingMetrics.temperature !== undefined && this.pendingMetrics.humidity !== undefined) {
      // Máme kompletní data, můžeme publikovat
      this.publishEnvironmentalMetrics({
        temperature: this.pendingMetrics.temperature,
        humidity: this.pendingMetrics.humidity
      });
      
      console.log(`ShellyHT (${this.config.id}): Published complete metrics - Temp: ${this.pendingMetrics.temperature}°C, Humidity: ${this.pendingMetrics.humidity}%`);
      
      // Reset pending metrik
      this.pendingMetrics = { lastUpdate: Date.now() };
    } else {
      // Nemáme kompletní data, nastavíme timeout na odeslání částečných dat
      this.metricsUpdateTimeout = setTimeout(() => {
        // Pokud uplynul timeout a nemáme kompletní data, pošleme co máme
        console.log(`ShellyHT (${this.config.id}): Metrics timeout - sending partial data`);
        
        if (this.pendingMetrics.temperature !== undefined || this.pendingMetrics.humidity !== undefined) {
          this.publishEnvironmentalMetrics({
            temperature: this.pendingMetrics.temperature ?? this.state.temperature,
            humidity: this.pendingMetrics.humidity ?? this.state.humidity
          });
          
          // Reset pending metrik
          this.pendingMetrics = { lastUpdate: Date.now() };
        }
        
        this.metricsUpdateTimeout = null;
      }, this.METRICS_TIMEOUT);
    }
  }

  // Zpracování dat o baterii
  private handleBatteryData(data: any): void {
    if (!data.battery) {
      return;
    }
    
    const updates: any = {};
    
    if (data.battery.percent !== undefined) {
      updates.battery = data.battery.percent;
    }
    
    this.updateState(updates);
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
    
    // Požadavek na aktuální hodnoty
    this.publishMqttMessage(`${this.config.mqttPrefix}/command`, JSON.stringify({
      id: 1,
      src: "user_1",
      method: "Temperature.GetStatus"
    }));
    
    this.publishMqttMessage(`${this.config.mqttPrefix}/command`, JSON.stringify({
      id: 2,
      src: "user_1",
      method: "Humidity.GetStatus"
    }));
    
    this.publishMqttMessage(`${this.config.mqttPrefix}/command`, JSON.stringify({
      id: 3,
      src: "user_1",
      method: "Battery.GetStatus"
    }));
  }

  // Dostupné příkazy pro zařízení (zjednodušené)
  getCommands(): DeviceCommands {
    return {
    
    }
  }
}
