const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
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
  // Order details
  side: {
    type: String,
    enum: ['buy', 'sell'],
    required: true
  },
  type: {
    type: String,
    enum: ['limit', 'market', 'stop_limit', 'stop_market'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.000001
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stopPrice: {
    type: Number,
    min: 0
  },
  // Futures specific
  marginMode: {
    type: String,
    enum: ['cross', 'isolated'],
    default: 'cross'
  },
  leverage: {
    type: Number,
    required: true,
    min: 1,
    max: 75
  },
  // Order status
  status: {
    type: String,
    enum: ['pending', 'filled', 'cancelled', 'rejected', 'expired'],
    default: 'pending'
  },
  // Execution details
  filledAt: Date,
  filledPrice: Number,
  filledQuantity: Number,
  // Store the market price when order was placed
  marketPriceAtPlacement: Number,
  // TP/SL
  takeProfitPrice: Number,
  stopLossPrice: Number,
  // Order options
  timeInForce: {
    type: String,
    enum: ['GTC', 'IOC', 'FOK'],
    default: 'GTC'
  },
  reduceOnly: {
    type: Boolean,
    default: false
  },
  // Fees
  fees: {
    type: Number,
    default: 0
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ user: 1, match: 1, status: 1 });
orderSchema.index({ symbol: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

// Virtual for order value
orderSchema.virtual('orderValue').get(function() {
  return this.quantity * this.price;
});

// Method to execute order
orderSchema.methods.execute = function(executionPrice, executionQuantity) {
  this.status = 'filled';
  this.filledAt = new Date();
  this.filledPrice = executionPrice;
  this.filledQuantity = executionQuantity;
  this.updatedAt = new Date();
  return this.save();
};

// Method to cancel order
orderSchema.methods.cancel = function() {
  this.status = 'cancelled';
  this.updatedAt = new Date();
  return this.save();
};

// Method to reject order
orderSchema.methods.reject = function() {
  this.status = 'rejected';
  this.updatedAt = new Date();
  return this.save();
};

// Static method to get user's orders
orderSchema.statics.getUserOrders = function(userId, matchId, status = null, limit = 50) {
  const query = { user: userId, match: matchId };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get orders by symbol
orderSchema.statics.getOrdersBySymbol = function(symbol, status = 'pending') {
  return this.find({ symbol, status }).sort({ createdAt: 1 });
};

module.exports = mongoose.model('Order', orderSchema);
