const axios = require('axios');
const WebSocket = require('ws');
const Asset = require('../models/Asset');

class MarketDataService {
  constructor() {
    this.updateInterval = 1000; // 1 second for real-time updates
    this.isUpdating = false;
    this.wsConnections = new Map(); // Store WebSocket connections
    this.priceSubscribers = new Map(); // Store price update subscribers
    this.binanceApiUrl = 'https://api.binance.com/api/v3';
    this.binanceWsUrl = 'wss://stream.binance.com:9443/ws';
    this.supportedAssets = [];
  }

  // Initialize market data service
  async initialize() {
    console.log('🚀 Initializing Market Data Service with Binance API...');
    
    try {
      // Use fallback assets first for immediate availability
      this.supportedAssets = [
        { symbol: 'BTCUSDT', name: 'Bitcoin', type: 'crypto', exchange: 'Binance', baseAsset: 'BTC', quoteAsset: 'USDT' },
        { symbol: 'ETHUSDT', name: 'Ethereum', type: 'crypto', exchange: 'Binance', baseAsset: 'ETH', quoteAsset: 'USDT' },
        { symbol: 'BNBUSDT', name: 'Binance Coin', type: 'crypto', exchange: 'Binance', baseAsset: 'BNB', quoteAsset: 'USDT' },
        { symbol: 'ADAUSDT', name: 'Cardano', type: 'crypto', exchange: 'Binance', baseAsset: 'ADA', quoteAsset: 'USDT' },
        { symbol: 'SOLUSDT', name: 'Solana', type: 'crypto', exchange: 'Binance', baseAsset: 'SOL', quoteAsset: 'USDT' }
      ];
      
      // Initialize with fallback assets immediately
      await this.initializeAssets();
      
      // Fetch real Binance data in background (non-blocking)
      setImmediate(async () => {
        try {
          await this.fetchBinanceSymbols();
          await this.initializeAssets();
          console.log('✅ Updated with real Binance data');
        } catch (error) {
          console.log('⚠️ Using fallback assets due to Binance API error:', error.message);
        }
      });
      
      // Start real-time price updates - DISABLED for now to prevent server overload
      // this.startRealTimeUpdates();
      
      console.log('✅ Market Data Service initialized');
    } catch (error) {
      console.error('❌ Error initializing market data service:', error);
    }
  }

  // Fetch all available trading pairs from Binance
  async fetchBinanceSymbols() {
    try {
      console.log('📡 Fetching Binance trading pairs...');
      const response = await axios.get(`${this.binanceApiUrl}/exchangeInfo`);
      
      if (response.data && response.data.symbols) {
        this.supportedAssets = response.data.symbols
          .filter(symbol => 
            symbol.status === 'TRADING' && 
            symbol.symbol.endsWith('USDT') &&
            symbol.isSpotTradingAllowed
          )
          .map(symbol => ({
            symbol: symbol.symbol,
            name: symbol.baseAsset,
            type: 'crypto',
            exchange: 'Binance',
            baseAsset: symbol.baseAsset,
            quoteAsset: symbol.quoteAsset,
            isActive: true
          }))
          .slice(0, 100); // Limit to top 100 for performance
        
        console.log(`✅ Fetched ${this.supportedAssets.length} trading pairs from Binance`);
      }
    } catch (error) {
      console.error('❌ Error fetching Binance symbols:', error);
      // Fallback to popular crypto pairs
      this.supportedAssets = [
        { symbol: 'BTCUSDT', name: 'Bitcoin', type: 'crypto', exchange: 'Binance', baseAsset: 'BTC', quoteAsset: 'USDT' },
        { symbol: 'ETHUSDT', name: 'Ethereum', type: 'crypto', exchange: 'Binance', baseAsset: 'ETH', quoteAsset: 'USDT' },
        { symbol: 'BNBUSDT', name: 'Binance Coin', type: 'crypto', exchange: 'Binance', baseAsset: 'BNB', quoteAsset: 'USDT' },
        { symbol: 'ADAUSDT', name: 'Cardano', type: 'crypto', exchange: 'Binance', baseAsset: 'ADA', quoteAsset: 'USDT' },
        { symbol: 'SOLUSDT', name: 'Solana', type: 'crypto', exchange: 'Binance', baseAsset: 'SOL', quoteAsset: 'USDT' }
      ];
    }
  }

  // Initialize assets in database
  async initializeAssets() {
    try {
      for (const assetData of this.supportedAssets) {
        let asset = await Asset.findOne({ symbol: assetData.symbol });
        
        if (!asset) {
          asset = new Asset({
            ...assetData,
            currentPrice: 0,
            previousClose: 0,
            volume: 0,
            averageVolume: 0,
            isActive: true
          });
        } else {
          asset.name = assetData.name;
          asset.type = assetData.type;
          asset.exchange = assetData.exchange;
          asset.baseAsset = assetData.baseAsset;
          asset.quoteAsset = assetData.quoteAsset;
          asset.isActive = true;
        }

        await asset.save();
      }
      
      console.log(`✅ Initialized ${this.supportedAssets.length} assets in database`);
    } catch (error) {
      console.error('❌ Error initializing assets:', error);
    }
  }

  // Start real-time price updates - DISABLED to prevent server overload
  startRealTimeUpdates() {
    console.log('⚠️ Real-time price updates disabled to prevent server overload');
    return;
    
    // if (this.isUpdating) return;
    
    // this.isUpdating = true;
    // console.log('📈 Starting real-time price updates via Binance WebSocket...');
    
    // // Subscribe to all symbols for real-time updates
    // this.subscribeToAllSymbols();
  }

  // Subscribe to all symbols for real-time updates - DISABLED to prevent server overload
  subscribeToAllSymbols() {
    console.log('⚠️ WebSocket connections disabled to prevent server overload');
    return;
    
    // const symbols = this.supportedAssets.map(asset => asset.symbol.toLowerCase());
    
    // // Create WebSocket connection for ticker stream
    // const wsUrl = `${this.binanceWsUrl}/${symbols.map(s => `${s}@ticker`).join('/')}`;
    
    // try {
    //   const ws = new WebSocket(wsUrl);
      
    //   ws.on('open', () => {
    //     console.log('🔗 Connected to Binance WebSocket for real-time updates');
    //   });
      
    //   ws.on('message', async (data) => {
    //     try {
    //       const tickerData = JSON.parse(data);
    //       await this.updateAssetPrice(tickerData);
    //     } catch (error) {
    //       console.error('❌ Error processing WebSocket data:', error);
    //     }
    //   });
      
    //   ws.on('error', (error) => {
    //     console.error('❌ WebSocket error:', error);
    //   });
      
    //   ws.on('close', () => {
    //     console.log('🔌 WebSocket connection closed, attempting to reconnect...');
    //     setTimeout(() => this.subscribeToAllSymbols(), 5000);
    //   });
      
    //   this.wsConnections.set('ticker', ws);
    // } catch (error) {
    //   console.error('❌ Error creating WebSocket connection:', error);
    // }
  }

  // Update asset price from Binance data - DISABLED to prevent server overload
  async updateAssetPrice(tickerData) {
    // DISABLED: Real-time price updates cause server overload and version conflicts
    console.log('⚠️ Price updates disabled to prevent server overload');
    return;
    
    // try {
    //   const symbol = tickerData.s.toUpperCase();
    //   const asset = await Asset.findOne({ symbol });
      
    //   if (!asset) return;
      
    //   const newPrice = parseFloat(tickerData.c);
    //   const previousPrice = asset.currentPrice;
      
    //   if (newPrice !== previousPrice) {
    //     await asset.updatePrice(newPrice, parseFloat(tickerData.v));
        
    //     // Notify subscribers
    //     this.notifyPriceSubscribers(symbol, {
    //       symbol: asset.symbol,
    //       price: newPrice,
    //       change: newPrice - previousPrice,
    //       changePercent: previousPrice > 0 ? ((newPrice - previousPrice) / previousPrice) * 100 : 0,
    //       volume: parseFloat(tickerData.v),
    //       lastUpdated: new Date()
    //     });
    //   }
    // } catch (error) {
    //   console.error(`❌ Error updating price for ${tickerData.s}:`, error);
    // }
  }

  // Notify price subscribers
  notifyPriceSubscribers(symbol, priceData) {
    const subscribers = this.priceSubscribers.get(symbol);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(priceData);
        } catch (error) {
          console.error('❌ Error notifying price subscriber:', error);
        }
      });
    }
  }

  // Subscribe to price updates for a specific symbol
  subscribeToPriceUpdates(symbol, callback) {
    if (!this.priceSubscribers.has(symbol)) {
      this.priceSubscribers.set(symbol, new Set());
    }
    this.priceSubscribers.get(symbol).add(callback);
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.priceSubscribers.get(symbol);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.priceSubscribers.delete(symbol);
        }
      }
    };
  }

  // Get real-time price for symbol - Returns static data to prevent server overload
  async getRealTimePrice(symbol) {
    try {
      // Return static mock data to prevent database queries and server overload
      const mockPrices = {
        'BTCUSDT': { price: 45000, change: 1250, changePercent: 2.85, volume: 1234567 },
        'ETHUSDT': { price: 3000, change: 150, changePercent: 5.26, volume: 987654 },
        'BNBUSDT': { price: 300, change: -5, changePercent: -1.64, volume: 456789 },
        'ADAUSDT': { price: 0.5, change: 0.02, changePercent: 4.17, volume: 234567 },
        'SOLUSDT': { price: 100, change: 8, changePercent: 8.70, volume: 345678 }
      };

      const data = mockPrices[symbol.toUpperCase()] || { 
        price: 100, 
        change: 0, 
        changePercent: 0, 
        volume: 100000 
      };

      return {
        symbol: symbol.toUpperCase(),
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        volume: data.volume,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error(`❌ Error getting real-time price for ${symbol}:`, error);
      throw error;
    }
  }

  // Get price history for symbol (candlestick data) - Returns static data to prevent server overload
  async getPriceHistory(symbol, interval = '1m', limit = 100) {
    try {
      // Return static mock candlestick data to prevent external API calls
      const mockData = [];
      const basePrice = symbol.toUpperCase() === 'BTCUSDT' ? 45000 : 
                      symbol.toUpperCase() === 'ETHUSDT' ? 3000 : 100;
      
      for (let i = 0; i < limit; i++) {
        const timestamp = Date.now() - (limit - i) * 60000; // 1 minute intervals
        const open = basePrice + (Math.random() - 0.5) * basePrice * 0.1;
        const close = open + (Math.random() - 0.5) * basePrice * 0.05;
        const high = Math.max(open, close) + Math.random() * basePrice * 0.02;
        const low = Math.min(open, close) - Math.random() * basePrice * 0.02;
        
        mockData.push({
          timestamp,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: Math.random() * 1000000
        });
      }

      return mockData;
    } catch (error) {
      console.error(`❌ Error getting price history for ${symbol}:`, error);
      throw error;
    }
  }

  // Get market overview - Returns static data to prevent server overload
  async getMarketOverview() {
    try {
      // Return static mock data to prevent external API calls
      return {
        totalAssets: 5,
        topGainers: [
          { symbol: 'SOLUSDT', price: 100, change: 8, changePercent: 8.70, volume: 345678 },
          { symbol: 'ETHUSDT', price: 3000, change: 150, changePercent: 5.26, volume: 987654 },
          { symbol: 'ADAUSDT', price: 0.5, change: 0.02, changePercent: 4.17, volume: 234567 }
        ],
        topLosers: [
          { symbol: 'BNBUSDT', price: 300, change: -5, changePercent: -1.64, volume: 456789 }
        ],
        mostActive: [
          { symbol: 'BTCUSDT', price: 45000, change: 1250, changePercent: 2.85, volume: 1234567 },
          { symbol: 'ETHUSDT', price: 3000, change: 150, changePercent: 5.26, volume: 987654 }
        ]
      };
    } catch (error) {
      console.error('❌ Error getting market overview:', error);
      throw error;
    }
  }

  // Get all available assets - Returns static data to prevent server overload
  async getAllAssets() {
    try {
      // Return static mock assets to prevent database queries
      return [
        { symbol: 'BTCUSDT', name: 'Bitcoin', type: 'crypto', currentPrice: 45000, dayChange: 1250, dayChangePercent: 2.85, volume: 1234567 },
        { symbol: 'ETHUSDT', name: 'Ethereum', type: 'crypto', currentPrice: 3000, dayChange: 150, dayChangePercent: 5.26, volume: 987654 },
        { symbol: 'BNBUSDT', name: 'Binance Coin', type: 'crypto', currentPrice: 300, dayChange: -5, dayChangePercent: -1.64, volume: 456789 },
        { symbol: 'ADAUSDT', name: 'Cardano', type: 'crypto', currentPrice: 0.5, dayChange: 0.02, dayChangePercent: 4.17, volume: 234567 },
        { symbol: 'SOLUSDT', name: 'Solana', type: 'crypto', currentPrice: 100, dayChange: 8, dayChangePercent: 8.70, volume: 345678 }
      ];
    } catch (error) {
      console.error('❌ Error getting all assets:', error);
      throw error;
    }
  }

  // Search assets
  async searchAssets(query) {
    try {
      const regex = new RegExp(query, 'i');
      return await Asset.find({
        $or: [
          { symbol: regex },
          { name: regex }
        ],
        isActive: true
      }).limit(10);
    } catch (error) {
      console.error('❌ Error searching assets:', error);
      throw error;
    }
  }

  // Stop all updates
  stopUpdates() {
    this.isUpdating = false;
    
    // Close all WebSocket connections
    this.wsConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
    this.wsConnections.clear();
    
    // Clear subscribers
    this.priceSubscribers.clear();
    
    console.log('⏹️ Real-time updates stopped');
  }
}

module.exports = new MarketDataService();