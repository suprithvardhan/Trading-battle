import { io } from 'socket.io-client';

class OrderExecutionService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.subscribers = new Map();
  }

  connect(userId, matchId) {
    // Disconnect existing connection first
    if (this.socket) {
      console.log('🔌 Disconnecting existing order execution service connection');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }

    console.log(`🔌 Connecting to order execution service for user ${userId}, match ${matchId}`);
    
    this.socket = io('http://localhost:5001', {
      transports: ['websocket'],
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to order execution service');
      this.isConnected = true;
      
      // Subscribe to orders
      this.socket.emit('subscribe_orders', { userId, matchId });
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from order execution service');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error to order execution service:', error);
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error from order execution service:', error);
    });

    // Listen for price updates
    this.socket.on('price_update', (data) => {
      // Price update received
      this.notifySubscribers('price_update', data);
    });

    // Listen for order executions
    this.socket.on('order_executed', (data) => {
      console.log('🎯 Order executed notification:', data);
      this.notifySubscribers('order_executed', data);
    });

    // Listen for position closures
    this.socket.on('position_closed', (data) => {
      console.log('🔄 Position closed notification:', data);
      this.notifySubscribers('position_closed', data);
    });

    // Listen for position creation
    this.socket.on('position_created', (data) => {
      // Position created notification
      this.notifySubscribers('position_created', data);
    });

    // Listen for order cancellations
    this.socket.on('orders_cancelled', (data) => {
      console.log('🚫 Orders cancelled notification:', data);
      this.notifySubscribers('orders_cancelled', data);
    });

    // Listen for position updates
    this.socket.on('position_updated', (data) => {
      // Position updated notification
      this.notifySubscribers('position_updated', data);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting from order execution service');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event).add(callback);

    return () => {
      if (this.subscribers.has(event)) {
        this.subscribers.get(event).delete(callback);
      }
    };
  }

  notifySubscribers(event, data) {
    if (this.subscribers.has(event)) {
      this.subscribers.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ Error in subscriber callback:', error);
        }
      });
    }
  }

  isServiceConnected() {
    return this.isConnected;
  }
}

// Create singleton instance
const orderExecutionService = new OrderExecutionService();

export default orderExecutionService;
