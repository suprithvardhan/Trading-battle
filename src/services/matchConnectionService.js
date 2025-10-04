import { io } from 'socket.io-client';

class MatchConnectionService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.subscribers = new Map();
  }

  connect(userId, matchId) {
    // Disconnect existing connection first
    if (this.socket) {
      console.log('🔌 Disconnecting existing match service connection');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }

    console.log(`🔌 Connecting to match service for user ${userId}, match ${matchId}`);
    
    this.socket = io('http://localhost:5002', {
      transports: ['websocket'],
      timeout: 20000,
      forceNew: true
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to match service');
      this.isConnected = true;
      
      // Join the match room
      this.socket.emit('join_match', { matchId, userId });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Match service connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('❌ Match service error:', error);
    });

    this.socket.on('joined_match', (data) => {
      console.log('✅ Joined match room:', data);
      this.notifySubscribers('joined_match', data);
    });

    this.socket.on('join_error', (data) => {
      console.error('❌ Failed to join match room:', data);
      this.notifySubscribers('join_error', data);
    });

    this.socket.on('user_joined', (data) => {
      console.log('👤 User joined match:', data);
      this.notifySubscribers('user_joined', data);
    });

    this.socket.on('user_left', (data) => {
      console.log('👤 User left match:', data);
      this.notifySubscribers('user_left', data);
    });

    this.socket.on('match_ended', (data) => {
      console.log('🏁 Match ended:', data);
      this.notifySubscribers('match_ended', data);
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from match service');
      this.isConnected = false;
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting from match service');
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
          console.error(`❌ Error in ${event} callback:`, error);
        }
      });
    }
  }
}

export default new MatchConnectionService();
