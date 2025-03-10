# IoT Device Monitoring Server

A Node.js server for monitoring and controlling IoT devices, specifically Shelly devices, with real-time data visualization and time-series data storage.

## Architecture

The server is built with a modular architecture:

- **Services**: Encapsulate specific functionality
  - `influxdb.ts`: Time-series database connection and operations
  - `mqtt.ts`: MQTT client for device communication
  - `socket.ts`: WebSocket server for real-time client communication
  - `device.ts`: Device state management and operations

- **Repositories**: Handle data access
  - `deviceRepository.ts`: CRUD operations for device metrics with time-series queries

- **Types**: Shared interfaces
  - `interfaces.ts`: TypeScript interfaces for type safety

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Configure environment variables in `.env` file:
   ```
   # Server configuration
   PORT=3000

   # InfluxDB configuration
   INFLUXDB_URL=http://localhost:8086
   INFLUXDB_TOKEN=your-influxdb-token
   INFLUXDB_ORG=your-organization
   INFLUXDB_BUCKET=device_metrics

   # MQTT configuration
   MQTT_HOST=192.168.0.157
   MQTT_PORT=1883
   MQTT_USERNAME=simatic
   MQTT_PASSWORD=vitkovic1
   ```

3. Build the TypeScript code:
   ```
   npm run build
   ```

4. Start the server:
   ```
   npm start
   ```

## Development

For development with automatic reloading:
```
npm run dev
```

## API Endpoints

### Device Metrics

- `GET /items`: Retrieve all device metrics (with optional limit parameter)
- `GET /items/range`: Get metrics within a time range (parameters: start, end)
- `GET /items/aggregated`: Get aggregated metrics (parameters: start, window)
- `GET /items/latest`: Get the latest metrics

### Shelly Device Control

- `POST /device/power`: Toggle device power (body: `{ "on": boolean }`)
- `POST /device/brightness`: Set device brightness (body: `{ "brightness": number }`)
- `POST /device/bluetooth`: Toggle Bluetooth (body: `{ "enable": boolean }`)
- `POST /device/name`: Set device name (body: `{ "name": string }`)
- `POST /device/led-mode`: Set LED mode (body: `{ "mode": number }`)
- `POST /device/power-on-state`: Set power-on state (body: `{ "state": number }`)
- `POST /device/auto-off-timer`: Set auto-off timer (body: `{ "seconds": number }`)
- `POST /device/auto-on-timer`: Set auto-on timer (body: `{ "seconds": number }`)
- `POST /device/power-limit`: Set power limit (body: `{ "watts": number }`)
- `POST /device/reboot`: Reboot the device
- `GET /device/config`: Get device configuration
- `GET /device/status`: Get device status

## WebSocket Events

### Server to Client

- `initialData`: Initial data sent when a client connects
- `newData`: New device metrics data
- `updateValues`: Device state updates

### Client to Server

- `turnof/on`: Toggle device power
- `brightness`: Adjust device brightness
- `bluetooth`: Toggle device bluetooth

## Architecture Diagram

```
┌─────────────┐     ┌─────────────┐
│   Client    │◄────┤  WebSocket  │
│  (Browser)  │     │   Server    │
└─────────────┘     └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    Express   │
                    │    Server    │
                    └──────┬──────┘
                           │
       ┌───────────┬───────┴───────┬───────────┐
       │           │               │           │
┌──────▼──────┐   ┌▼─────────┐    ┌▼────────┐  ┌▼────────────┐
│  InfluxDB   │   │  Device  │    │  MQTT   │  │ Repository  │
│   Service   │   │ Service  │    │ Service │  │    Layer    │
└─────────────┘   └──────────┘    └─────────┘  └─────────────┘
       │                 │             │               │
       │                 │             │               │
┌──────▼──────┐          │        ┌───▼───┐     ┌─────▼─────┐
│  InfluxDB   │          └────────►  IoT   │     │ Time-Series│
│ Time-Series │                   │ Device │     │   Queries  │
└─────────────┘                   └───────┘     └───────────┘
