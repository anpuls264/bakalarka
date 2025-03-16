import * as mqtt from 'mqtt';
import dotenv from 'dotenv';

dotenv.config();

const mqttServerUrl = process.env.MQTT_SERVER_URL || 'mqtt://localhost';

const brokerOptions: mqtt.IClientOptions = {
  host: '172.31.45.126',
  port: 1883,
  username: 'simatic',
  password: 'vitkovic1',
  protocol: 'mqtt', 
  keepalive: 60,
  reconnectPeriod: 1000,
  connectTimeout: 30 * 1000,
  clean: true
};

export const mqttClient = mqtt.connect(brokerOptions);

// Set up error handling
mqttClient.on('error', (error) => {
  console.error('MQTT connection error:', error);
});

mqttClient.on('reconnect', () => {
  console.log('MQTT client reconnecting');
});

mqttClient.on('close', () => {
  console.log('MQTT connection closed');
});
