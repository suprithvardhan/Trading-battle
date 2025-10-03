class BinanceWebSocketService {
  constructor() {
    this.ws = null;
    this.subscribers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnected = false;
    this.currentSymbol = null;
    this.reconnectTimeout = null;
  }

  // Connect to Binance WebSocket for a specific symbol
  connect(symbol) {
    try {
      // If already connected to the same symbol, don't reconnect
      if (this.ws && this.ws.readyState === WebSocket.OPEN && this.currentSymbol === symbol) {
        console.log(`✅ Already connected to ${symbol}, skipping reconnection`);
        return;
      }

      // Clear any pending reconnection
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      // Disconnect existing connection first
      if (this.ws) {
        this.disconnect();
      }

      console.log(`🔗 Connecting to Binance WebSocket for ${symbol}...`);
      
      this.currentSymbol = symbol;
      // Binance WebSocket URL for individual symbol ticker
      const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log(`✅ Connected to Binance WebSocket for ${symbol}`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`🔌 WebSocket connection closed for ${symbol}`, event.code, event.reason);
        this.isConnected = false;
        
        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect(symbol);
        }
      };

      this.ws.onerror = (error) => {
        console.error(`❌ WebSocket error for ${symbol}:`, error);
      };

    } catch (error) {
      console.error(`❌ Error connecting to Binance WebSocket for ${symbol}:`, error);
    }
  }

  // Handle incoming WebSocket messages
  handleMessage(data) {
    if (data.e === '24hrTicker') {
      const tickerData = {
        symbol: data.s,
        price: parseFloat(data.c),
        open: parseFloat(data.o),
        high: parseFloat(data.h),
        low: parseFloat(data.l),
        volume: parseFloat(data.v),
        change: parseFloat(data.P),
        changePercent: parseFloat(data.P),
        timestamp: Date.now()
      };

      // Notify all subscribers
      this.subscribers.forEach((callback) => {
        try {
          callback(tickerData);
        } catch (error) {
          console.error('❌ Error in subscriber callback:', error);
        }
      });
    }
  }

  // Subscribe to price updates
  subscribe(callback) {
    const id = Date.now() + Math.random();
    this.subscribers.set(id, callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(id);
    };
  }

  // Attempt to reconnect
  attemptReconnect(symbol) {
    this.reconnectAttempts++;
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect(symbol);
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  // Disconnect WebSocket
  disconnect() {
    // Clear any pending reconnection
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      console.log('🔌 Disconnecting WebSocket...');
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    this.isConnected = false;
    this.currentSymbol = null;
    this.subscribers.clear();
  }

  // Get connection status
  getStatus() {
    return {
      isConnected: this.isConnected,
      subscribers: this.subscribers.size
    };
  }
}

// Create singleton instance
const binanceWebSocketService = new BinanceWebSocketService();

export default binanceWebSocketService;
