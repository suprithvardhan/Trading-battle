const mongoose = require('../db'); // Use shared mongoose instance

const tradeSchema = new mongoose.Schema({
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
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ['buy', 'sell'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.000001 // Minimum trade size
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  totalValue: {
    type: Number,
    required: true
  },
  // Trade status
  status: {
    type: String,
    enum: ['pending', 'filled', 'cancelled', 'rejected'],
    default: 'pending'
  },
  // Trade execution details
  filledAt: Date,
  filledPrice: Number,
  filledQuantity: Number,
  // Fees (for future implementation)
  fees: {
    type: Number,
    default: 0
  },
  // Trade metadata
  notes: String,
  // Timestamps
  executedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
tradeSchema.index({ user: 1, match: 1 });
tradeSchema.index({ symbol: 1, executedAt: -1 });
tradeSchema.index({ status: 1 });
tradeSchema.index({ executedAt: -1 });

// Virtual for trade value
tradeSchema.virtual('tradeValue').get(function() {
  return this.quantity * this.price;
});

// Method to execute trade
tradeSchema.methods.execute = function() {
  this.status = 'filled';
  this.filledAt = new Date();
  this.filledPrice = this.price;
  this.filledQuantity = this.quantity;
  return this.save();
};

// Method to cancel trade
tradeSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Static method to get user's trading history
tradeSchema.statics.getUserTrades = function(userId, matchId = null, limit = 50) {
  const query = { user: userId };
  if (matchId) {
    query.match = matchId;
  }
  
  return this.find(query)
    .populate('asset', 'symbol name type')
    .populate('match', 'status startTime endTime')
    .sort({ executedAt: -1 })
    .limit(limit);
};

// Static method to get trade statistics
tradeSchema.statics.getTradeStats = function(userId, matchId = null) {
  const query = { user: userId, status: 'filled' };
  if (matchId) {
    query.match = matchId;
  }
  
  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalTrades: { $sum: 1 },
        totalVolume: { $sum: '$totalValue' },
        avgTradeSize: { $avg: '$totalValue' },
        buyTrades: {
          $sum: {
            $cond: [{ $eq: ['$type', 'buy'] }, 1, 0]
          }
        },
        sellTrades: {
          $sum: {
            $cond: [{ $eq: ['$type', 'sell'] }, 1, 0]
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Trade', tradeSchema);
