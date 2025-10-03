const axios = require('axios');

class RealTimeDataService {
  constructor() {
    this.binanceApiUrl = 'https://api.binance.com/api/v3';
    this.cache = new Map();
    this.cacheTimeout = 5000; // 5 seconds cache
  }

  // Get real-time price from Binance API
  async getRealTimePrice(symbol) {
    try {
      const cacheKey = `price_${symbol}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const response = await axios.get(`${this.binanceApiUrl}/ticker/price?symbol=${symbol}`);
      
      const priceData = {
        symbol: response.data.symbol,
        price: parseFloat(response.data.price),
        timestamp: Date.now()
      };

      this.cache.set(cacheKey, { data: priceData, timestamp: Date.now() });
      return priceData;
    } catch (error) {
      console.error(`❌ Error fetching real-time price for ${symbol}:`, error.message);
      
      // Return mock data as fallback
      return {
        symbol: symbol,
        price: this.getMockPrice(symbol),
        timestamp: Date.now()
      };
    }
  }

  // Get 24hr ticker statistics
  async getTickerStats(symbol) {
    try {
      const cacheKey = `stats_${symbol}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const response = await axios.get(`${this.binanceApiUrl}/ticker/24hr?symbol=${symbol}`);
      
      const stats = {
        symbol: response.data.symbol,
        price: parseFloat(response.data.lastPrice),
        open: parseFloat(response.data.openPrice),
        high: parseFloat(response.data.highPrice),
        low: parseFloat(response.data.lowPrice),
        volume: parseFloat(response.data.volume),
        change: parseFloat(response.data.priceChange),
        changePercent: parseFloat(response.data.priceChangePercent),
        timestamp: Date.now()
      };

      this.cache.set(cacheKey, { data: stats, timestamp: Date.now() });
      return stats;
    } catch (error) {
      console.error(`❌ Error fetching ticker stats for ${symbol}:`, error.message);
      
      // Return mock data as fallback
      return this.getMockStats(symbol);
    }
  }

  // Get kline/candlestick data
  async getKlineData(symbol, interval = '1m', limit = 100) {
    try {
      const cacheKey = `kline_${symbol}_${interval}_${limit}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < 10000) { // 10 seconds cache for klines
        return cached.data;
      }

      const response = await axios.get(`${this.binanceApiUrl}/klines`, {
        params: {
          symbol: symbol,
          interval: interval,
          limit: limit
        }
      });

      const klineData = response.data.map(kline => ({
        timestamp: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5])
      }));

      this.cache.set(cacheKey, { data: klineData, timestamp: Date.now() });
      return klineData;
    } catch (error) {
      console.error(`❌ Error fetching kline data for ${symbol}:`, error.message);
      
      // Return mock data as fallback
      return this.getMockKlineData(symbol, limit);
    }
  }

  // Get all trading pairs
  async getAllSymbols() {
    try {
      const cacheKey = 'all_symbols';
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes cache
        return cached.data;
      }

      const response = await axios.get(`${this.binanceApiUrl}/exchangeInfo`);
      
      const symbols = response.data.symbols
        .filter(symbol => 
          symbol.status === 'TRADING' && 
          symbol.symbol.endsWith('USDT') &&
          symbol.isSpotTradingAllowed
        )
        .map(symbol => ({
          symbol: symbol.symbol,
          baseAsset: symbol.baseAsset,
          quoteAsset: symbol.quoteAsset,
          status: symbol.status
        }))
        .slice(0, 50); // Limit to top 50 for performance

      this.cache.set(cacheKey, { data: symbols, timestamp: Date.now() });
      return symbols;
    } catch (error) {
      console.error('❌ Error fetching all symbols:', error.message);
      
      // Return mock symbols as fallback
      return [
        { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', status: 'TRADING' },
        { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', status: 'TRADING' },
        { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', status: 'TRADING' },
        { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', status: 'TRADING' },
        { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', status: 'TRADING' }
      ];
    }
  }

  // Mock data fallbacks
  getMockPrice(symbol) {
    const mockPrices = {
      'BTCUSDT': 45000,
      'ETHUSDT': 3000,
      'BNBUSDT': 300,
      'ADAUSDT': 0.5,
      'SOLUSDT': 100
    };
    return mockPrices[symbol] || 100;
  }

  getMockStats(symbol) {
    const basePrice = this.getMockPrice(symbol);
    const change = (Math.random() - 0.5) * basePrice * 0.1;
    
    return {
      symbol: symbol,
      price: basePrice,
      open: basePrice - change,
      high: basePrice + Math.abs(change) * 1.5,
      low: basePrice - Math.abs(change) * 1.5,
      volume: Math.random() * 1000000,
      change: change,
      changePercent: (change / basePrice) * 100,
      timestamp: Date.now()
    };
  }

  getMockKlineData(symbol, limit) {
    const basePrice = this.getMockPrice(symbol);
    const data = [];
    
    for (let i = 0; i < limit; i++) {
      const timestamp = Date.now() - (limit - i) * 60000; // 1 minute intervals
      const open = basePrice + (Math.random() - 0.5) * basePrice * 0.1;
      const close = open + (Math.random() - 0.5) * basePrice * 0.05;
      const high = Math.max(open, close) + Math.random() * basePrice * 0.02;
      const low = Math.min(open, close) - Math.random() * basePrice * 0.02;
      
      data.push({
        timestamp,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: Math.random() * 1000000
      });
    }
    
    return data;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new RealTimeDataService();
