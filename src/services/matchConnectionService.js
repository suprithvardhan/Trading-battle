import { io } from 'socket.io-client';

class MatchConnectionService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.subscribers = new Map();
  }

  async connect(userId, matchId, retryCount = 0) {
    const maxRetries = 5;
    const retryDelay = 2000; // 2 seconds

    // Disconnect existing connection first
    if (this.socket) {
      console.log('🔌 Disconnecting existing match service connection');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }

    console.log(`🔌 Connecting to match service for user ${userId}, match ${matchId} (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    // Check if room is ready first
    try {
      const response = await fetch(`http://localhost:5002/room-status/${matchId}`);
      const roomStatus = await response.json();
      
      if (!roomStatus.ready) {
        console.log(`⏳ Room not ready: ${roomStatus.message}`);
        if (retryCount < maxRetries) {
          console.log(`🔄 Retrying room check in ${retryDelay}ms...`);
          setTimeout(() => {
            this.connect(userId, matchId, retryCount + 1);
          }, retryDelay);
          return;
        } else {
          console.error('❌ Max room readiness retries exceeded');
          this.notifySubscribers('connection_failed', { error: 'Room not ready after max retries' });
          return;
        }
      }
      
      console.log(`✅ Room is ready for match ${matchId}`);
    } catch (error) {
      console.error('❌ Error checking room status:', error);
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying room check in ${retryDelay}ms...`);
        setTimeout(() => {
          this.connect(userId, matchId, retryCount + 1);
        }, retryDelay);
        return;
      }
    }
    
    this.socket = io('http://localhost:5002', {
      transports: ['websocket'],
      timeout: 20000,
      forceNew: true
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to match service');
      this.isConnected = true;
      
      // Join the match room with retry mechanism
      this.joinMatchRoom(userId, matchId, retryCount);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Match service connection error:', error);
      this.isConnected = false;
      
      // Retry connection if we haven't exceeded max retries
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying connection in ${retryDelay}ms...`);
        setTimeout(() => {
          this.connect(userId, matchId, retryCount + 1);
        }, retryDelay);
      } else {
        console.error('❌ Max connection retries exceeded');
        this.notifySubscribers('connection_failed', { error: 'Max retries exceeded' });
      }
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
      
      // Retry joining if room not found and we haven't exceeded max retries
      if (data.error === 'Room not found' && retryCount < maxRetries) {
        console.log(`🔄 Room not found, retrying in ${retryDelay}ms...`);
        setTimeout(() => {
          this.joinMatchRoom(userId, matchId, retryCount + 1);
        }, retryDelay);
      } else {
        this.notifySubscribers('join_error', data);
      }
    });

    // Listen for balance update events
    this.socket.on('balance_updated', (data) => {
      console.log('💰 Balance update received in matchConnectionService:', data);
      this.notifySubscribers('balance_updated', data);
    });

    // Listen for test balance update events
    this.socket.on('test_balance_update', (data) => {
      console.log('🧪 Test balance update received in matchConnectionService:', data);
    });

    // Listen for any other events for debugging
    this.socket.onAny((eventName, ...args) => {
      console.log(`🔍 Match service event received: ${eventName}`, args);
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

  joinMatchRoom(userId, matchId, retryCount = 0) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Cannot join match room: not connected to service');
      return;
    }

    console.log(`🏠 Joining match room: ${matchId} for user: ${userId}`);
    this.socket.emit('join_match', { matchId, userId });
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
