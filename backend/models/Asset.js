const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['stock', 'crypto', 'forex', 'commodity', 'index'],
    required: true
  },
  exchange: {
    type: String,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Price data
  currentPrice: {
    type: Number,
    default: 0
  },
  previousClose: {
    type: Number,
    default: 0
  },
  dayChange: {
    type: Number,
    default: 0
  },
  dayChangePercent: {
    type: Number,
    default: 0
  },
  // Volume data
  volume: {
    type: Number,
    default: 0
  },
  averageVolume: {
    type: Number,
    default: 0
  },
  // Market cap for stocks
  marketCap: {
    type: Number,
    default: 0
  },
  // Price history (for charts)
  priceHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    price: Number,
    volume: Number
  }],
  // Metadata
  description: String,
  sector: String, // For stocks
  country: String,
  website: String,
  // Trading hours
  tradingHours: {
    open: String, // "09:30"
    close: String, // "16:00"
    timezone: String // "America/New_York"
  },
  // Last updated
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Additional indexes for efficient queries (symbol already has unique index)
assetSchema.index({ type: 1, isActive: 1 });
assetSchema.index({ exchange: 1 });
assetSchema.index({ lastUpdated: -1 });

// Virtual for price change
assetSchema.virtual('priceChange').get(function() {
  return this.currentPrice - this.previousClose;
});

// Method to update price
assetSchema.methods.updatePrice = function(newPrice, volume = 0) {
  this.previousClose = this.currentPrice;
  this.currentPrice = newPrice;
  this.dayChange = this.currentPrice - this.previousClose;
  this.dayChangePercent = this.previousClose > 0 ? 
    (this.dayChange / this.previousClose) * 100 : 0;
  this.volume = volume;
  this.lastUpdated = new Date();
  
  // Add to price history
  this.priceHistory.push({
    timestamp: new Date(),
    price: newPrice,
    volume: volume
  });
  
  // Keep only last 1000 price points
  if (this.priceHistory.length > 1000) {
    this.priceHistory = this.priceHistory.slice(-1000);
  }
  
  return this.save();
};

// Method to get price history for charts
assetSchema.methods.getPriceHistory = function(limit = 100) {
  return this.priceHistory
    .slice(-limit)
    .map(point => ({
      timestamp: point.timestamp,
      price: point.price,
      volume: point.volume
    }));
};

// Static method to get popular assets
assetSchema.statics.getPopularAssets = function() {
  return this.find({ isActive: true })
    .sort({ volume: -1, dayChangePercent: -1 })
    .limit(20)
    .select('symbol name type currentPrice dayChangePercent volume');
};

// Static method to search assets
assetSchema.statics.searchAssets = function(query) {
  const regex = new RegExp(query, 'i');
  return this.find({
    $or: [
      { symbol: regex },
      { name: regex }
    ],
    isActive: true
  }).limit(10);
};

module.exports = mongoose.model('Asset', assetSchema);
