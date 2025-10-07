const mongoose = require('../db');

const achievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: 'trophy'
  },
  category: {
    type: String,
    enum: ['trading', 'streak', 'volume', 'profit', 'special'],
    required: true
  },
  criteria: {
    type: {
      type: String,
      enum: ['total_trades', 'win_rate', 'total_pnl', 'streak', 'volume', 'matches_won', 'consecutive_wins'],
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    operator: {
      type: String,
      enum: ['>=', '>', '=', '<=', '<'],
      default: '>='
    }
  },
  reward: {
    type: {
      type: String,
      enum: ['badge', 'tier_boost', 'bonus_balance'],
      default: 'badge'
    },
    value: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  }
}, {
  timestamps: true
});

// Index for efficient queries
achievementSchema.index({ category: 1 });
achievementSchema.index({ isActive: 1 });

// Static method to check if user qualifies for an achievement
achievementSchema.statics.checkUserAchievements = async function(userId) {
  const UserStats = require('./UserStats');
  const User = require('./User');
  const UserAchievement = require('./UserAchievement');
  
  const userStats = await UserStats.findOne({ user: userId });
  const user = await User.findById(userId);
  
  if (!userStats || !user) return [];
  
  const achievements = await this.find({ isActive: true });
  const newAchievements = [];
  
  for (const achievement of achievements) {
    // Check if user already has this achievement
    const existingAchievement = await UserAchievement.findOne({
      user: userId,
      achievement: achievement._id
    });
    
    if (existingAchievement) continue;
    
    let qualifies = false;
    const { type, value, operator } = achievement.criteria;
    
    switch (type) {
      case 'total_trades':
        qualifies = this.evaluateCriteria(userStats.totalTrades, value, operator);
        break;
      case 'win_rate':
        qualifies = this.evaluateCriteria(userStats.winRate, value, operator);
        break;
      case 'total_pnl':
        qualifies = this.evaluateCriteria(userStats.totalPnL, value, operator);
        break;
      case 'streak':
        qualifies = this.evaluateCriteria(userStats.bestWinStreak, value, operator);
        break;
      case 'volume':
        qualifies = this.evaluateCriteria(userStats.totalVolume, value, operator);
        break;
      case 'matches_won':
        qualifies = this.evaluateCriteria(userStats.totalWins, value, operator);
        break;
      case 'consecutive_wins':
        qualifies = this.evaluateCriteria(userStats.currentWinStreak, value, operator);
        break;
    }
    
    if (qualifies) {
      newAchievements.push(achievement);
    }
  }
  
  return newAchievements;
};

// Helper method to evaluate criteria
achievementSchema.statics.evaluateCriteria = function(userValue, targetValue, operator) {
  switch (operator) {
    case '>=':
      return userValue >= targetValue;
    case '>':
      return userValue > targetValue;
    case '=':
      return userValue === targetValue;
    case '<=':
      return userValue <= targetValue;
    case '<':
      return userValue < targetValue;
    default:
      return false;
  }
};

module.exports = mongoose.model('Achievement', achievementSchema);
