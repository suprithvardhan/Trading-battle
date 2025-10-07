const mongoose = require('../db');

const userAchievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  achievement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate achievements
userAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true });
userAchievementSchema.index({ user: 1, earnedAt: -1 });

// Static method to award achievement to user
userAchievementSchema.statics.awardAchievement = async function(userId, achievementId) {
  try {
    const userAchievement = new this({
      user: userId,
      achievement: achievementId
    });
    
    await userAchievement.save();
    
    // Apply any rewards
    const Achievement = require('./Achievement');
    const User = require('./User');
    const achievement = await Achievement.findById(achievementId);
    
    if (achievement && achievement.reward.type === 'bonus_balance') {
      await User.findByIdAndUpdate(userId, {
        $inc: { balance: achievement.reward.value }
      });
    }
    
    return userAchievement;
  } catch (error) {
    if (error.code === 11000) {
      // Achievement already exists
      return null;
    }
    throw error;
  }
};

// Static method to get user's achievements
userAchievementSchema.statics.getUserAchievements = async function(userId) {
  return await this.find({ user: userId })
    .populate('achievement')
    .sort({ earnedAt: -1 });
};

module.exports = mongoose.model('UserAchievement', userAchievementSchema);
