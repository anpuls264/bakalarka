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
      
      if (topic === `${this.config.mqttTopic}/status/switch:0`) {
        // Zpracování dat o spotřebě
        this.handlePowerData(data);
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
      totalEnergy: totalEnergy
    });
    
    // Publikování metrik pro uložení do databáze
    this.publishMetrics({
      apower: data.apower,
      voltage: data.voltage,
      current: data.current,
      total: totalEnergy
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
      this.publishMqttMessage(`${this.config.mqttTopic}/rpc`, JSON.stringify(payload));
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
        
        this.publishMqttMessage(`${this.config.mqttTopic}/rpc`, JSON.stringify(payload));
        // Pro lepší UX aktualizujeme stav okamžitě, bude opraven, pokud se skutečný stav liší
        this.updateState({ deviceTurnOnOff: turnOn });
      },
      
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
      
      setBrightness: (brightness: number) => {
        const payload = {
          id: 125,
          src: "user_1",
          method: "Light.Set",
          params: { id: 0, brightness }
        };
        
        this.publishMqttMessage(`${this.config.mqttTopic}/rpc`, JSON.stringify(payload));
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
          // Poznámka: Toto je jen ukázka, ve skutečnosti by bylo potřeba přidat posluchače do MQTT klienta
          // a později ho odstranit. V této implementaci to není možné, protože nemáme přímý přístup k MQTT klientovi.
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
      }
    };
  }
}
