import * as mqtt from 'mqtt';
import dotenv from 'dotenv';

dotenv.config();

const mqttServerUrl = process.env.MQTT_SERVER_URL || 'mqtt://localhost';

const brokerOptions: mqtt.IClientOptions = {
  host: '192.168.0.157',
  port: 1883,
  username: 'simatic',
  password: 'vitkovic1',
  protocol: 'mqtt', 
};

export const mqttClient = mqtt.connect(brokerOptions);