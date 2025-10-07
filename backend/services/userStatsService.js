const UserStats = require('../models/UserStats');
const DailyPerformance = require('../models/DailyPerformance');
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');

class UserStatsService {
  // Update user stats after a match result
  static async updateUserStats(userId, matchResult, pnl = 0, volume = 0) {
    try {
      let userStats = await UserStats.findOne({ user: userId });
      
      if (!userStats) {
        userStats = new UserStats({ user: userId });
      }

      const isWin = matchResult === 'win';
      const isLoss = matchResult === 'loss';
      
      // Update basic stats
      if (isWin || isLoss) {
        userStats.totalTrades += 1;
        if (isWin) {
          userStats.totalWins += 1;
        } else {
          userStats.totalLosses += 1;
        }
        
        // Update win rate
        userStats.winRate = userStats.calculateWinRate();
        
        // Update streaks
        userStats.updateStreaks(isWin);
      }

      // Update P&L statistics
      userStats.totalPnL += pnl;
      userStats.totalVolume += volume;
      
      // Update win/loss specific stats
      if (isWin && pnl > 0) {
        userStats.bestWin = Math.max(userStats.bestWin, pnl);
        userStats.averageWin = userStats.calculateAverageWin();
      } else if (isLoss && pnl < 0) {
        userStats.worstLoss = Math.min(userStats.worstLoss, pnl);
        userStats.averageLoss = userStats.calculateAverageLoss();
      }
      
      // Update profit factor
      userStats.profitFactor = userStats.calculateProfitFactor();
      
      // Update daily performance
      await this.updateDailyPerformance(userId, matchResult, pnl, volume);
      
      // Update all P&L calculations (daily, weekly, monthly)
      await this.updateAllPnLCalculations(userId);
      
      // Save updated stats
      await userStats.save();
      
      // Check for new achievements
      await this.checkAndAwardAchievements(userId);
      
      console.log(`📊 Updated user stats for ${userId}: P&L=${pnl}, Total P&L=${userStats.totalPnL}`);
      
      return userStats;
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }

  // Update daily performance record
  static async updateDailyPerformance(userId, matchResult, pnl = 0, volume = 0) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let dailyPerf = await DailyPerformance.findOne({
        user: userId,
        date: today
      });
      
      if (!dailyPerf) {
        dailyPerf = new DailyPerformance({
          user: userId,
          date: today
        });
      }

      // Update daily stats
      dailyPerf.totalTrades += 1;
      
      if (matchResult === 'win') {
        dailyPerf.wins += 1;
      } else if (matchResult === 'loss') {
        dailyPerf.losses += 1;
      } else {
        dailyPerf.draws += 1;
      }

      // Update P&L
      dailyPerf.realizedPnL += pnl;
      dailyPerf.totalPnL = dailyPerf.realizedPnL + dailyPerf.unrealizedPnL;
      
      // Update volume
      dailyPerf.totalVolume += volume;
      
      // Calculate daily win rate
      dailyPerf.dailyWinRate = dailyPerf.calculateDailyWinRate();
      
      await dailyPerf.save();
      
      return dailyPerf;
    } catch (error) {
      console.error('Error updating daily performance:', error);
      throw error;
    }
  }

  // Check and award achievements
  static async checkAndAwardAchievements(userId) {
    try {
      const newAchievements = await Achievement.checkUserAchievements(userId);
      
      const awardedAchievements = [];
      for (const achievement of newAchievements) {
        const userAchievement = await UserAchievement.awardAchievement(userId, achievement._id);
        if (userAchievement) {
          awardedAchievements.push(achievement);
        }
      }
      
      return awardedAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      throw error;
    }
  }

  // Calculate monthly P&L
  static async calculateMonthlyPnL(userId, year, month) {
    try {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      
      const monthlyData = await DailyPerformance.find({
        user: userId,
        date: {
          $gte: startDate,
          $lte: endDate
        }
      });
      
      const totalPnL = monthlyData.reduce((sum, day) => sum + day.realizedPnL, 0);
      
      // Update user stats with monthly P&L
      await UserStats.findOneAndUpdate(
        { user: userId },
        { monthlyPnL: totalPnL }
      );
      
      return totalPnL;
    } catch (error) {
      console.error('Error calculating monthly P&L:', error);
      throw error;
    }
  }

  // Calculate weekly P&L
  static async calculateWeeklyPnL(userId) {
    try {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weeklyData = await DailyPerformance.find({
        user: userId,
        date: {
          $gte: weekStart,
          $lte: weekEnd
        }
      });
      
      const totalPnL = weeklyData.reduce((sum, day) => sum + day.realizedPnL, 0);
      
      // Update user stats with weekly P&L
      await UserStats.findOneAndUpdate(
        { user: userId },
        { weeklyPnL: totalPnL }
      );
      
      return totalPnL;
    } catch (error) {
      console.error('Error calculating weekly P&L:', error);
      throw error;
    }
  }

  // Calculate daily P&L
  static async calculateDailyPnL(userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const dailyPerf = await DailyPerformance.findOne({
        user: userId,
        date: today
      });
      
      const dailyPnL = dailyPerf ? dailyPerf.realizedPnL : 0;
      
      // Update user stats with daily P&L
      await UserStats.findOneAndUpdate(
        { user: userId },
        { dailyPnL: dailyPnL }
      );
      
      return dailyPnL;
    } catch (error) {
      console.error('Error calculating daily P&L:', error);
      throw error;
    }
  }

  // Update all P&L calculations
  static async updateAllPnLCalculations(userId) {
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      await Promise.all([
        this.calculateDailyPnL(userId),
        this.calculateWeeklyPnL(userId),
        this.calculateMonthlyPnL(userId, year, month)
      ]);
    } catch (error) {
      console.error('Error updating P&L calculations:', error);
      throw error;
    }
  }

  // Get user performance summary
  static async getUserPerformanceSummary(userId) {
    try {
      const userStats = await UserStats.findOne({ user: userId });
      const achievements = await UserAchievement.getUserAchievements(userId);
      
      return {
        stats: userStats,
        achievements: achievements
      };
    } catch (error) {
      console.error('Error getting user performance summary:', error);
      throw error;
    }
  }
}

module.exports = UserStatsService;
