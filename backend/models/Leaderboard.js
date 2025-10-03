const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  // Ranking metrics
  rank: {
    type: Number,
    required: true
  },
  previousRank: {
    type: Number,
    default: 0
  },
  // Performance metrics
  winRate: {
    type: Number,
    default: 0
  },
  totalMatches: {
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
  // Financial metrics
  balance: {
    type: Number,
    default: 10000
  },
  totalProfit: {
    type: Number,
    default: 0
  },
  // Streak metrics
  currentStreak: {
    type: Number,
    default: 0
  },
  bestStreak: {
    type: Number,
    default: 0
  },
  // Tier and badges
  tier: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
    default: 'Bronze'
  },
  badges: [{
    name: String,
    description: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Activity metrics
  lastActive: {
    type: Date,
    default: Date.now
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  // Ranking period
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'all-time'],
    default: 'all-time'
  },
  // Last updated
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
leaderboardSchema.index({ rank: 1, period: 1 });
leaderboardSchema.index({ user: 1, period: 1 });
leaderboardSchema.index({ tier: 1, rank: 1 });
leaderboardSchema.index({ lastUpdated: -1 });

// Virtual for rank change
leaderboardSchema.virtual('rankChange').get(function() {
  if (this.previousRank === 0) return 0;
  return this.previousRank - this.rank; // Positive means moved up
});

// Method to update ranking
leaderboardSchema.methods.updateRanking = function(newRank) {
  this.previousRank = this.rank;
  this.rank = newRank;
  this.lastUpdated = new Date();
  return this.save();
};

// Method to update metrics
leaderboardSchema.methods.updateMetrics = function(userStats) {
  this.winRate = userStats.winRate;
  this.totalMatches = userStats.totalMatches;
  this.wins = userStats.wins;
  this.losses = userStats.losses;
  this.balance = userStats.balance;
  this.totalProfit = userStats.totalProfit;
  this.currentStreak = userStats.currentStreak;
  this.bestStreak = userStats.bestStreak;
  this.tier = userStats.tier;
  this.badges = userStats.badges;
  this.lastActive = new Date();
  this.lastUpdated = new Date();
  return this.save();
};

// Static method to get leaderboard
leaderboardSchema.statics.getLeaderboard = function(period = 'all-time', limit = 50) {
  return this.find({ period })
    .populate('user', 'username tier')
    .sort({ rank: 1 })
    .limit(limit);
};

// Static method to get user's rank
leaderboardSchema.statics.getUserRank = function(userId, period = 'all-time') {
  return this.findOne({ user: userId, period })
    .populate('user', 'username tier');
};

// Static method to update all rankings
leaderboardSchema.statics.updateAllRankings = async function(period = 'all-time') {
  const users = await this.find({ period }).sort({ 
    winRate: -1, 
    totalMatches: -1, 
    balance: -1 
  });
  
  // Update rankings
  for (let i = 0; i < users.length; i++) {
    users[i].previousRank = users[i].rank;
    users[i].rank = i + 1;
    users[i].lastUpdated = new Date();
    await users[i].save();
  }
  
  return users;
};

// Static method to get top performers
leaderboardSchema.statics.getTopPerformers = function(period = 'all-time', limit = 10) {
  return this.find({ period })
    .populate('user', 'username tier')
    .sort({ rank: 1 })
    .limit(limit);
};

// Static method to get tier distribution
leaderboardSchema.statics.getTierDistribution = function(period = 'all-time') {
  return this.aggregate([
    { $match: { period } },
    {
      $group: {
        _id: '$tier',
        count: { $sum: 1 },
        avgRank: { $avg: '$rank' }
      }
    },
    { $sort: { avgRank: 1 } }
  ]);
};

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
