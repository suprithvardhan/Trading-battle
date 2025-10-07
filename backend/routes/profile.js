const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const UserStats = require('../models/UserStats');
const DailyPerformance = require('../models/DailyPerformance');
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');

// Get user profile with detailed stats
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user basic info
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Get or create user stats
    let userStats = await UserStats.findOne({ user: userId });
    if (!userStats) {
      userStats = new UserStats({ user: userId });
      await userStats.save();
    }
    
    // Get user achievements
    const achievements = await UserAchievement.getUserAchievements(userId);
    
    // Get monthly performance data
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthlyData = await DailyPerformance.getMonthlyPerformance(userId, year, month);
    
    // Format monthly data for calendar
    const calendarData = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayData = monthlyData.find(d => d.date.getDate() === day);
      
      if (dayData) {
        calendarData.push({
          day,
          date,
          pnl: dayData.realizedPnL,
          trades: dayData.totalTrades,
          wins: dayData.wins,
          losses: dayData.losses,
          isWeekend: date.getDay() === 0 || date.getDay() === 6,
          isFuture: false
        });
      } else {
        calendarData.push({
          day,
          date,
          pnl: 0,
          trades: 0,
          wins: 0,
          losses: 0,
          isWeekend: date.getDay() === 0 || date.getDay() === 6,
          isFuture: date > currentDate
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          balance: user.balance,
          tier: user.tier,
          badges: user.badges,
          createdAt: user.createdAt
        },
        stats: {
          totalTrades: userStats.totalTrades,
          winRate: userStats.winRate,
          totalPnL: userStats.totalPnL,
          monthlyPnL: userStats.monthlyPnL,
          weeklyPnL: userStats.weeklyPnL,
          dailyPnL: userStats.dailyPnL,
          bestWin: userStats.bestWin,
          worstLoss: userStats.worstLoss,
          avgWin: userStats.averageWin,
          avgLoss: userStats.averageLoss,
          profitFactor: userStats.profitFactor,
          sharpeRatio: userStats.sharpeRatio,
          maxDrawdown: userStats.maxDrawdown,
          consecutiveWins: userStats.currentWinStreak,
          consecutiveLosses: userStats.currentLossStreak,
          totalVolume: userStats.totalVolume,
          avgTradeDuration: userStats.averageTradeDuration
        },
        achievements: achievements.map(ua => ({
          id: ua.achievement._id,
          name: ua.achievement.name,
          description: ua.achievement.description,
          icon: ua.achievement.icon,
          category: ua.achievement.category,
          rarity: ua.achievement.rarity,
          earnedAt: ua.earnedAt
        })),
        monthlyData: calendarData
      }
    });
  } catch (error) {
    console.error('Error fetching profile stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get monthly performance data
router.get('/monthly/:year/:month', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, month } = req.params;
    
    const monthlyData = await DailyPerformance.getMonthlyPerformance(userId, parseInt(year), parseInt(month));
    
    // Format for calendar display
    const calendarData = [];
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(parseInt(year), parseInt(month) - 1, day);
      const dayData = monthlyData.find(d => d.date.getDate() === day);
      
      if (dayData) {
        calendarData.push({
          day,
          date,
          pnl: dayData.realizedPnL,
          trades: dayData.totalTrades,
          wins: dayData.wins,
          losses: dayData.losses,
          isWeekend: date.getDay() === 0 || date.getDay() === 6,
          isFuture: false
        });
      } else {
        calendarData.push({
          day,
          date,
          pnl: 0,
          trades: 0,
          wins: 0,
          losses: 0,
          isWeekend: date.getDay() === 0 || date.getDay() === 6,
          isFuture: date > new Date()
        });
      }
    }
    
    res.json({
      success: true,
      data: calendarData
    });
  } catch (error) {
    console.error('Error fetching monthly data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update user profile
router.put('/update', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email } = req.body;
    
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Check and award achievements
router.post('/check-achievements', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check for new achievements
    const newAchievements = await Achievement.checkUserAchievements(userId);
    
    // Award new achievements
    const awardedAchievements = [];
    for (const achievement of newAchievements) {
      const userAchievement = await UserAchievement.awardAchievement(userId, achievement._id);
      if (userAchievement) {
        awardedAchievements.push({
          id: achievement._id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category,
          rarity: achievement.rarity
        });
      }
    }
    
    res.json({
      success: true,
      message: `Found ${awardedAchievements.length} new achievements`,
      achievements: awardedAchievements
    });
  } catch (error) {
    console.error('Error checking achievements:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
