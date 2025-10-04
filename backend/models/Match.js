const mongoose = require('../db'); // Use shared mongoose instance

const matchSchema = new mongoose.Schema({
  // Match participants
  players: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    },
    startingBalance: {
      type: Number,
      default: 10000
    },
    currentBalance: {
      type: Number,
      default: 10000
    },
    profit: {
      type: Number,
      default: 0
    },
    realizedPnL: {
      type: Number,
      default: 0
    },
    trades: [{
      symbol: String,
      type: String, // 'buy' or 'sell'
      quantity: Number,
      price: Number,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  
  // Match details
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'cancelled'],
    default: 'waiting'
  },
  
  // Match settings
  duration: {
    type: Number, // in minutes
    default: 5
  },
  
  // Match results
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Timestamps
  startTime: Date,
  endTime: Date,
  
  // Match statistics
  totalVolume: {
    type: Number,
    default: 0
  },
  
  // Match type
  matchType: {
    type: String,
    enum: ['quick', 'ranked', 'tournament'],
    default: 'quick'
  },
  
  // Match rules
  rules: {
    maxTrades: {
      type: Number,
      default: 50
    },
    allowedAssets: [String], // ['BTC', 'ETH', 'AAPL', 'TSLA', etc.]
    leverage: {
      type: Number,
      default: 1
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
matchSchema.index({ status: 1, createdAt: -1 });
matchSchema.index({ 'players.user': 1 });
matchSchema.index({ winner: 1 });

// Virtual for match duration
matchSchema.virtual('durationInMinutes').get(function() {
  if (this.startTime && this.endTime) {
    return Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  return 0;
});

// Method to get match leaderboard
matchSchema.methods.getLeaderboard = function() {
  return this.players
    .sort((a, b) => b.currentBalance - a.currentBalance)
    .map((player, index) => ({
      rank: index + 1,
      username: player.username,
      balance: player.currentBalance,
      profit: player.profit,
      trades: player.trades.length
    }));
};

// Method to check if match is active
matchSchema.methods.isActive = function() {
  return this.status === 'active' && this.startTime && !this.endTime;
};

// Method to end match
matchSchema.methods.endMatch = function() {
  this.status = 'completed';
  this.endTime = new Date();
  
  // Determine winner
  const sortedPlayers = this.players.sort((a, b) => b.currentBalance - a.currentBalance);
  if (sortedPlayers.length > 0) {
    this.winner = sortedPlayers[0].user;
  }
  
  return this.save();
};

module.exports = mongoose.model('Match', matchSchema);
