import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import { Item, DeviceState } from '../types/interfaces';

/**
 * WebSocket service for handling real-time communication with clients
 */
class SocketService {
    private io: SocketIOServer;
    private static instance: SocketService;

    /**
     * Private constructor to enforce singleton pattern
     * @param server HTTP server instance
     */
    private constructor(server: http.Server) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: '*', // Allow all origins
            },
        });
        
        this.setupEventHandlers();
    }

    /**
     * Initialize the SocketService with an HTTP server
     * @param server HTTP server instance
     * @returns SocketService instance
     */
    public static initialize(server: http.Server): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService(server);
        }
        return SocketService.instance;
    }

    /**
     * Get singleton instance of SocketService
     * @throws Error if service is not initialized
     */
    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            throw new Error('SocketService must be initialized with an HTTP server before use');
        }
        return SocketService.instance;
    }

    /**
     * Setup socket event handlers
     */
    private setupEventHandlers(): void {
        this.io.on('connection', (socket) => {
            console.log(`New client connected: ${socket.id}`);
            
            // Handle client disconnection
            socket.on('disconnect', () => {
                console.log(`Client disconnected: ${socket.id}`);
            });
            
            // Log all events for debugging
            socket.onAny((event, ...args) => {
                console.log(`Received event '${event}' from client ${socket.id}:`, args);
            });
        });
    }

    /**
     * Register event handlers for device control
     * @param handlers Object containing event handlers
     */
    public registerDeviceControlHandlers(handlers: {
        turnOnOff: () => void;
        setBrightness: (brightness: number) => void;
        toggleBluetooth: () => void;
    }): void {
        this.io.on('connection', (socket) => {
            // Handle device power toggle
            socket.on('turnof/on', handlers.turnOnOff);
            
            // Handle brightness adjustment
            socket.on('brightness', handlers.setBrightness);
            
            // Handle bluetooth toggle
            socket.on('bluetooth', handlers.toggleBluetooth);
        });
    }

    /**
     * Send initial data to a newly connected client
     * @param socket Socket instance
     * @param items Array of data items
     * @param deviceState Current device state
     */
    public sendInitialData(items: Item[], deviceState: DeviceState): void {
        this.io.emit('initialData', items);
        this.io.emit('updateValues', deviceState);
    }

    /**
     * Send new data to all connected clients
     * @param data New data item
     */
    public broadcastNewData(data: Item): void {
        this.io.emit('newData', data);
    }

    /**
     * Update device state for all connected clients
     * @param deviceState Updated device state
     */
    public updateDeviceState(deviceState: DeviceState): void {
        this.io.emit('updateValues', deviceState);
    }

    /**
     * Get the Socket.IO server instance
     */
    public getIO(): SocketIOServer {
        return this.io;
    }
}

export { SocketService };
