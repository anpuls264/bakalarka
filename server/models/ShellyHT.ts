import { Device, DeviceConfig, DeviceCommands } from './Device';

export class ShellyHT extends Device {
  constructor(config: DeviceConfig) {
    super(config);
    
    // Inicializace výchozího stavu
    this.state = {
      ...this.state,
      temperature: 0,
      humidity: 0,
      battery: 100,
      wifiName: null,
      bluetoothEnable: false,
      mqttEnable: false
    };
  }

  // Zpracování MQTT zpráv
  handleMessage(topic: string, message: Buffer): void {
    console.log(`ShellyHT (${this.config.id}) received message on topic ${topic}`);
    
    try {
      const messageStr = message.toString();
      const data = JSON.parse(messageStr);
      
      if (topic === `${this.config.mqttTopic}/status/temperature:0`) {
        // Zpracování dat o teplotě
        this.handleTemperatureData(data);
      } else if (topic === `${this.config.mqttTopic}/status/humidity:0`) {
        // Zpracování dat o vlhkosti
        this.handleHumidityData(data);
      } else if (topic === `${this.config.mqttTopic}/status/devicepower:0`) {
        // Zpracování dat o baterii
        this.handleBatteryData(data);
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
    
    // Publikování metrik pro uložení do databáze
    this.publishMetrics({
      temperature: data.tC
    });
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
    
    // Publikování metrik pro uložení do databáze
    this.publishMetrics({
      humidity: data.rh
    });
  }

  // Zpracování dat o baterii
  private handleBatteryData(data: any): void {
    if (data.battery?.percent === undefined) {
      return;
    }
    
    // Aktualizace stavu
    this.updateState({
      battery: data.battery.percent
    });
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
      this.publishMqttMessage(`${this.config.mqttTopic}/rpc`, JSON.stringify(payload));
    });
    
    // Požadavek na aktuální hodnoty
    this.publishMqttMessage(`${this.config.mqttTopic}/command`, JSON.stringify({
      id: 1,
      src: "user_1",
      method: "Temperature.GetStatus"
    }));
    
    this.publishMqttMessage(`${this.config.mqttTopic}/command`, JSON.stringify({
      id: 2,
      src: "user_1",
      method: "Humidity.GetStatus"
    }));
    
    this.publishMqttMessage(`${this.config.mqttTopic}/command`, JSON.stringify({
      id: 3,
      src: "user_1",
      method: "Battery.GetStatus"
    }));
  }

  // Dostupné příkazy pro zařízení
  getCommands(): DeviceCommands {
    return {
      toggleBluetooth: (enable: boolean) => {
        const payload = {
          id: 124,
          src: "user_1",
          method: "Bluetooth.SetConfig",
          params: { enable }
        };
        
        this.publishMqttMessage(`${this.config.mqttTopic}/rpc`, JSON.stringify(payload));
        this.updateState({ bluetoothEnable: enable });
      },
      
      scanWifi: async () => {
        return new Promise((resolve, reject) => {
          const payload = {
            id: 126,
            src: "user_1",
            method: "Wifi.Scan"
          };
          
          // Nastavíme timeout pro případ, že nedostaneme odpověď
          const timeoutId = setTimeout(() => {
            reject(new Error('WiFi scan timed out'));
          }, 10000);
          
          // Jednorázový posluchač pro odpověď
          const handleResponse = (topic: string, message: Buffer) => {
            if (topic === 'user_1/rpc') {
              try {
                const data = JSON.parse(message.toString());
                
                if (data.id === 126 && data.result && data.result.results) {
                  clearTimeout(timeoutId);
                  
                  // Transformace výsledků do očekávaného formátu
                  const networks = data.result.results.map((network: any) => ({
                    ssid: network.ssid,
                    rssi: network.rssi,
                    secure: network.auth_mode !== 0
                  }));
                  
                  resolve({ networks });
                }
              } catch (error) {
                console.error('Error parsing scan response:', error);
              }
            }
          };
          
          // Přidáme posluchače a odešleme příkaz
          this.publishMqttMessage(`${this.config.mqttTopic}/rpc`, JSON.stringify(payload));
        });
      },
      
      connectWifi: async (ssid: string, password?: string) => {
        return new Promise((resolve, reject) => {
          const wifiConfig: any = { ssid };
          
          if (password) {
            wifiConfig.password = password;
          }
          
          const payload = {
            id: 127,
            src: "user_1",
            method: "Wifi.SetConfig",
            params: {
              config: {
                sta: wifiConfig
              }
            }
          };
          
          // Nastavíme timeout pro případ, že nedostaneme odpověď
          const timeoutId = setTimeout(() => {
            reject(new Error('WiFi connection timed out'));
          }, 15000);
          
          // Jednorázový posluchač pro odpověď
          const handleResponse = (topic: string, message: Buffer) => {
            if (topic === 'user_1/rpc') {
              try {
                const data = JSON.parse(message.toString());
                
                if (data.id === 127) {
                  clearTimeout(timeoutId);
                  
                  if (data.error) {
                    reject(new Error(data.error.message || 'Failed to connect to WiFi'));
                  } else {
                    this.updateState({ wifiName: ssid });
                    resolve(data.result);
                  }
                }
              } catch (error) {
                console.error('Error parsing connect response:', error);
              }
            }
          };
          
          // Přidáme posluchače a odešleme příkaz
          this.publishMqttMessage(`${this.config.mqttTopic}/rpc`, JSON.stringify(payload));
        });
      },
      
      getWifiStatus: async () => {
        return new Promise((resolve, reject) => {
          const payload = {
            id: 129,
            src: "user_1",
            method: "Wifi.GetStatus"
          };
          
          // Nastavíme timeout pro případ, že nedostaneme odpověď
          const timeoutId = setTimeout(() => {
            reject(new Error('WiFi status request timed out'));
          }, 5000);
          
          // Jednorázový posluchač pro odpověď
          const handleResponse = (topic: string, message: Buffer) => {
            if (topic === 'user_1/rpc') {
              try {
                const data = JSON.parse(message.toString());
                
                if (data.id === 129) {
                  clearTimeout(timeoutId);
                  
                  if (data.error) {
                    reject(new Error(data.error.message || 'Failed to get WiFi status'));
                  } else {
                    resolve(data.result);
                  }
                }
              } catch (error) {
                console.error('Error parsing status response:', error);
              }
            }
          };
          
          // Přidáme posluchače a odešleme příkaz
          this.publishMqttMessage(`${this.config.mqttTopic}/rpc`, JSON.stringify(payload));
        });
      },
      
      // Specifické příkazy pro ShellyHT
      getTemperature: () => {
        const payload = {
          id: 1,
          src: "user_1",
          method: "Temperature.GetStatus"
        };
        
        this.publishMqttMessage(`${this.config.mqttTopic}/command`, JSON.stringify(payload));
      },
      
      getHumidity: () => {
        const payload = {
          id: 2,
          src: "user_1",
          method: "Humidity.GetStatus"
        };
        
        this.publishMqttMessage(`${this.config.mqttTopic}/command`, JSON.stringify(payload));
      },
      
      getBattery: () => {
        const payload = {
          id: 3,
          src: "user_1",
          method: "Battery.GetStatus"
        };
        
        this.publishMqttMessage(`${this.config.mqttTopic}/command`, JSON.stringify(payload));
      }
    };
  }
}
