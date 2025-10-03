const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true
  },
  // Position details
  side: {
    type: String,
    enum: ['long', 'short'],
    required: true
  },
  size: {
    type: Number,
    required: true,
    min: 0.000001
  },
  entryPrice: {
    type: Number,
    required: true,
    min: 0
  },
  markPrice: {
    type: Number,
    required: true,
    min: 0
  },
  // Futures specific
  marginMode: {
    type: String,
    enum: ['cross', 'isolated'],
    required: true
  },
  leverage: {
    type: Number,
    required: true,
    min: 1,
    max: 75
  },
  margin: {
    type: Number,
    required: true,
    min: 0
  },
  marginRatio: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  liquidationPrice: {
    type: Number,
    required: true,
    min: 0
  },
  // PnL calculations
  unrealizedPnL: {
    type: Number,
    default: 0
  },
  roi: {
    type: Number,
    default: 0
  },
  // TP/SL
  takeProfitPrice: Number,
  stopLossPrice: Number,
  // Position status
  status: {
    type: String,
    enum: ['open', 'closed', 'liquidated'],
    default: 'open'
  },
  // Execution details
  openedAt: {
    type: Date,
    default: Date.now
  },
  closedAt: Date,
  closedPrice: Number,
  // Fees
  fees: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
positionSchema.index({ user: 1, match: 1, status: 1 });
positionSchema.index({ symbol: 1, status: 1 });
positionSchema.index({ openedAt: -1 });

// Virtual for position value
positionSchema.virtual('positionValue').get(function() {
  return this.size * this.markPrice;
});

// Virtual for notional value
positionSchema.virtual('notionalValue').get(function() {
  return this.size * this.entryPrice;
});

// Method to update mark price and recalculate PnL
positionSchema.methods.updateMarkPrice = function(newMarkPrice) {
  this.markPrice = newMarkPrice;
  
  // Calculate unrealized PnL
  if (this.side === 'long') {
    this.unrealizedPnL = (newMarkPrice - this.entryPrice) * this.size;
  } else {
    this.unrealizedPnL = (this.entryPrice - newMarkPrice) * this.size;
  }
  
  // Calculate ROI
  this.roi = (this.unrealizedPnL / this.margin) * 100;
  
  // Update margin ratio (simplified calculation)
  this.marginRatio = (this.margin / (this.size * newMarkPrice)) * 100;
  
  return this.save();
};

// Method to close position
positionSchema.methods.close = function(closePrice) {
  this.status = 'closed';
  this.closedAt = new Date();
  this.closedPrice = closePrice;
  
  // Calculate final PnL
  if (this.side === 'long') {
    this.unrealizedPnL = (closePrice - this.entryPrice) * this.size;
  } else {
    this.unrealizedPnL = (this.entryPrice - closePrice) * this.size;
  }
  
  this.roi = (this.unrealizedPnL / this.margin) * 100;
  
  return this.save();
};

// Method to liquidate position
positionSchema.methods.liquidate = function() {
  this.status = 'liquidated';
  this.closedAt = new Date();
  this.closedPrice = this.liquidationPrice;
  
  // Calculate final PnL (usually negative)
  if (this.side === 'long') {
    this.unrealizedPnL = (this.liquidationPrice - this.entryPrice) * this.size;
  } else {
    this.unrealizedPnL = (this.entryPrice - this.liquidationPrice) * this.size;
  }
  
  this.roi = (this.unrealizedPnL / this.margin) * 100;
  
  return this.save();
};

// Static method to get user's positions
positionSchema.statics.getUserPositions = function(userId, matchId, status = 'open') {
  return this.find({ user: userId, match: matchId, status })
    .sort({ openedAt: -1 });
};

// Static method to get positions by symbol
positionSchema.statics.getPositionsBySymbol = function(symbol, status = 'open') {
  return this.find({ symbol, status });
};

// Static method to check for liquidation
positionSchema.statics.checkLiquidation = function() {
  return this.find({ status: 'open' }).then(positions => {
    const liquidatedPositions = [];
    
    positions.forEach(position => {
      if (position.side === 'long' && position.markPrice <= position.liquidationPrice) {
        liquidatedPositions.push(position);
      } else if (position.side === 'short' && position.markPrice >= position.liquidationPrice) {
        liquidatedPositions.push(position);
      }
    });
    
    return Promise.all(liquidatedPositions.map(pos => pos.liquidate()));
  });
};

module.exports = mongoose.model('Position', positionSchema);
