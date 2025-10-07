const mongoose = require('../db');

const dailyPerformanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  // Trading Activity
  totalTrades: {
    type: Number,
    default: 0
  },
  wins: {
    type: Number,
    default: 0
  },
  losses: {
    type: Number,
    default: 0
  },
  draws: {
    type: Number,
    default: 0
  },
  
  // P&L
  realizedPnL: {
    type: Number,
    default: 0
  },
  unrealizedPnL: {
    type: Number,
    default: 0
  },
  totalPnL: {
    type: Number,
    default: 0
  },
  
  // Volume
  totalVolume: {
    type: Number,
    default: 0
  },
  
  // Time spent trading (in minutes)
  tradingTime: {
    type: Number,
    default: 0
  },
  
  // Best and worst trades of the day
  bestTrade: {
    type: Number,
    default: 0
  },
  worstTrade: {
    type: Number,
    default: 0
  },
  
  // Win rate for the day
  dailyWinRate: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
dailyPerformanceSchema.index({ user: 1, date: -1 });
dailyPerformanceSchema.index({ date: -1 });
dailyPerformanceSchema.index({ user: 1, date: 1 }, { unique: true });

// Calculate daily win rate
dailyPerformanceSchema.methods.calculateDailyWinRate = function() {
  if (this.totalTrades === 0) return 0;
  return Math.round((this.wins / this.totalTrades) * 100 * 100) / 100;
};

// Update total P&L
dailyPerformanceSchema.methods.updateTotalPnL = function() {
  this.totalPnL = this.realizedPnL + this.unrealizedPnL;
};

// Static method to get user's performance for a date range
dailyPerformanceSchema.statics.getUserPerformance = async function(userId, startDate, endDate) {
  return await this.find({
    user: userId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

// Static method to get monthly performance
dailyPerformanceSchema.statics.getMonthlyPerformance = async function(userId, year, month) {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  
  return await this.getUserPerformance(userId, startDate, endDate);
};

module.exports = mongoose.model('DailyPerformance', dailyPerformanceSchema);
