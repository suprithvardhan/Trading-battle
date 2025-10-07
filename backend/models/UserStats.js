const mongoose = require('../db');

const userStatsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Trading Performance
  totalTrades: {
    type: Number,
    default: 0
  },
  totalWins: {
    type: Number,
    default: 0
  },
  totalLosses: {
    type: Number,
    default: 0
  },
  winRate: {
    type: Number,
    default: 0
  },
  
  // P&L Statistics
  totalPnL: {
    type: Number,
    default: 0
  },
  totalVolume: {
    type: Number,
    default: 0
  },
  averageWin: {
    type: Number,
    default: 0
  },
  averageLoss: {
    type: Number,
    default: 0
  },
  bestWin: {
    type: Number,
    default: 0
  },
  worstLoss: {
    type: Number,
    default: 0
  },
  
  // Risk Metrics
  profitFactor: {
    type: Number,
    default: 0
  },
  sharpeRatio: {
    type: Number,
    default: 0
  },
  maxDrawdown: {
    type: Number,
    default: 0
  },
  
  // Streaks
  currentWinStreak: {
    type: Number,
    default: 0
  },
  currentLossStreak: {
    type: Number,
    default: 0
  },
  bestWinStreak: {
    type: Number,
    default: 0
  },
  worstLossStreak: {
    type: Number,
    default: 0
  },
  
  // Time-based Performance
  averageTradeDuration: {
    type: Number, // in seconds
    default: 0
  },
  
  // Monthly/Weekly/Daily Performance
  monthlyPnL: {
    type: Number,
    default: 0
  },
  weeklyPnL: {
    type: Number,
    default: 0
  },
  dailyPnL: {
    type: Number,
    default: 0
  },
  
  // Last updated timestamps
  lastTradeDate: {
    type: Date
  },
  lastWinDate: {
    type: Date
  },
  lastLossDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
userStatsSchema.index({ user: 1 });
userStatsSchema.index({ totalPnL: -1 });
userStatsSchema.index({ winRate: -1 });

// Calculate and update win rate
userStatsSchema.methods.calculateWinRate = function() {
  if (this.totalTrades === 0) return 0;
  return Math.round((this.totalWins / this.totalTrades) * 100 * 100) / 100; // Round to 2 decimal places
};

// Calculate average win
userStatsSchema.methods.calculateAverageWin = function() {
  if (this.totalWins === 0) return 0;
  // This is a simplified calculation - in a real system, you'd track individual wins
  return this.totalWins > 0 ? this.totalPnL / this.totalWins : 0;
};

// Calculate average loss
userStatsSchema.methods.calculateAverageLoss = function() {
  if (this.totalLosses === 0) return 0;
  // This is a simplified calculation - in a real system, you'd track individual losses
  return this.totalLosses > 0 ? this.totalPnL / this.totalLosses : 0;
};

// Calculate profit factor
userStatsSchema.methods.calculateProfitFactor = function() {
  if (this.averageLoss === 0) return this.averageWin > 0 ? 999 : 0;
  return Math.round((this.averageWin / Math.abs(this.averageLoss)) * 100) / 100;
};

// Update streaks
userStatsSchema.methods.updateStreaks = function(isWin) {
  if (isWin) {
    this.currentWinStreak++;
    this.currentLossStreak = 0;
    if (this.currentWinStreak > this.bestWinStreak) {
      this.bestWinStreak = this.currentWinStreak;
    }
  } else {
    this.currentLossStreak++;
    this.currentWinStreak = 0;
    if (this.currentLossStreak > this.worstLossStreak) {
      this.worstLossStreak = this.currentLossStreak;
    }
  }
};

module.exports = mongoose.model('UserStats', userStatsSchema);
