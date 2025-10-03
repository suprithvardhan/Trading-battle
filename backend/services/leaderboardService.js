const User = require('../models/User');
const Leaderboard = require('../models/Leaderboard');

class LeaderboardService {
  constructor() {
    this.updateInterval = 300000; // 5 minutes
    this.isUpdating = false;
  }

  // Initialize leaderboard service
  async initialize() {
    console.log('🏆 Initializing Leaderboard Service...');
    
    // Create leaderboard entries for all users
    await this.initializeLeaderboard();
    
    // Start periodic updates
    this.startPeriodicUpdates();
    
    console.log('✅ Leaderboard Service initialized');
  }

  // Initialize leaderboard entries for all users
  async initializeLeaderboard() {
    try {
      const users = await User.find({ isActive: true });
      
      for (const user of users) {
        await this.updateUserLeaderboard(user);
      }
      
      // Update all rankings
      await this.updateAllRankings();
      
      console.log(`✅ Initialized leaderboard for ${users.length} users`);
    } catch (error) {
      console.error('❌ Error initializing leaderboard:', error);
    }
  }

  // Update user's leaderboard entry
  async updateUserLeaderboard(user) {
    try {
      const userStats = {
        winRate: user.stats.winRate,
        totalMatches: user.stats.totalMatches,
        wins: user.stats.wins,
        losses: user.stats.losses,
        balance: user.balance,
        totalProfit: user.stats.totalProfit || 0,
        currentStreak: user.stats.currentStreak,
        bestStreak: user.stats.bestStreak,
        tier: user.tier,
        badges: user.badges || []
      };

      // Update or create leaderboard entry
      let leaderboardEntry = await Leaderboard.findOne({ 
        user: user._id, 
        period: 'all-time' 
      });

      if (leaderboardEntry) {
        await leaderboardEntry.updateMetrics(userStats);
      } else {
        leaderboardEntry = new Leaderboard({
          user: user._id,
          username: user.username,
          period: 'all-time',
          ...userStats
        });
        await leaderboardEntry.save();
      }

      return leaderboardEntry;
    } catch (error) {
      console.error(`❌ Error updating leaderboard for user ${user.username}:`, error);
    }
  }

  // Update all rankings
  async updateAllRankings() {
    try {
      const periods = ['all-time', 'monthly', 'weekly', 'daily'];
      
      for (const period of periods) {
        await this.updateRankingsForPeriod(period);
      }
      
      console.log('✅ Updated all rankings');
    } catch (error) {
      console.error('❌ Error updating rankings:', error);
    }
  }

  // Update rankings for specific period
  async updateRankingsForPeriod(period) {
    try {
      const users = await Leaderboard.find({ period })
        .sort({ 
          winRate: -1, 
          totalMatches: -1, 
          balance: -1,
          currentStreak: -1
        });

      // Update rankings
      for (let i = 0; i < users.length; i++) {
        users[i].previousRank = users[i].rank;
        users[i].rank = i + 1;
        users[i].lastUpdated = new Date();
        await users[i].save();
      }

      console.log(`✅ Updated ${period} rankings for ${users.length} users`);
    } catch (error) {
      console.error(`❌ Error updating ${period} rankings:`, error);
    }
  }

  // Start periodic updates
  startPeriodicUpdates() {
    if (this.isUpdating) return;
    
    this.isUpdating = true;
    console.log('⏰ Starting periodic leaderboard updates...');
    
    // Update immediately
    this.performUpdate();
    
    // Set interval for updates
    setInterval(() => {
      this.performUpdate();
    }, this.updateInterval);
  }

  // Perform leaderboard update
  async performUpdate() {
    try {
      console.log('🔄 Updating leaderboard...');
      
      // Update all user entries
      const users = await User.find({ isActive: true });
      for (const user of users) {
        await this.updateUserLeaderboard(user);
      }
      
      // Update rankings
      await this.updateAllRankings();
      
      console.log('✅ Leaderboard update completed');
    } catch (error) {
      console.error('❌ Error in leaderboard update:', error);
    }
  }

  // Get leaderboard for specific period
  async getLeaderboard(period = 'all-time', limit = 50) {
    try {
      return await Leaderboard.find({ period })
        .populate('user', 'username tier')
        .sort({ rank: 1 })
        .limit(parseInt(limit));
    } catch (error) {
      console.error(`❌ Error getting ${period} leaderboard:`, error);
      throw error;
    }
  }

  // Get user's ranking
  async getUserRank(userId, period = 'all-time') {
    try {
      return await Leaderboard.findOne({ 
        user: userId, 
        period 
      }).populate('user', 'username tier');
    } catch (error) {
      console.error(`❌ Error getting user rank:`, error);
      throw error;
    }
  }

  // Get tier distribution
  async getTierDistribution(period = 'all-time') {
    try {
      return await Leaderboard.aggregate([
        { $match: { period } },
        {
          $group: {
            _id: '$tier',
            count: { $sum: 1 },
            avgRank: { $avg: '$rank' },
            avgWinRate: { $avg: '$winRate' }
          }
        },
        { $sort: { avgRank: 1 } }
      ]);
    } catch (error) {
      console.error(`❌ Error getting tier distribution:`, error);
      throw error;
    }
  }

  // Get top performers
  async getTopPerformers(period = 'all-time', limit = 10) {
    try {
      return await Leaderboard.find({ period })
        .populate('user', 'username tier')
        .sort({ rank: 1 })
        .limit(parseInt(limit));
    } catch (error) {
      console.error(`❌ Error getting top performers:`, error);
      throw error;
    }
  }

  // Get users around specific user
  async getUsersAround(userId, period = 'all-time', range = 5) {
    try {
      const userRank = await Leaderboard.findOne({ 
        user: userId, 
        period 
      });

      if (!userRank) {
        throw new Error('User not found in leaderboard');
      }

      const startRank = Math.max(1, userRank.rank - parseInt(range));
      const endRank = userRank.rank + parseInt(range);

      const aroundUsers = await Leaderboard.find({
        period,
        rank: { $gte: startRank, $lte: endRank }
      })
      .populate('user', 'username tier')
      .sort({ rank: 1 });

      return {
        aroundUsers,
        userRank: userRank.rank
      };
    } catch (error) {
      console.error(`❌ Error getting users around:`, error);
      throw error;
    }
  }

  // Get leaderboard statistics
  async getLeaderboardStats(period = 'all-time') {
    try {
      const [
        totalUsers,
        tierDistribution,
        topPerformers
      ] = await Promise.all([
        Leaderboard.countDocuments({ period }),
        this.getTierDistribution(period),
        this.getTopPerformers(period, 5)
      ]);

      return {
        totalUsers,
        tierDistribution,
        topPerformers
      };
    } catch (error) {
      console.error(`❌ Error getting leaderboard stats:`, error);
      throw error;
    }
  }

  // Search users in leaderboard
  async searchUsers(query, period = 'all-time', limit = 10) {
    try {
      return await Leaderboard.find({
        period,
        username: { $regex: query, $options: 'i' }
      })
      .populate('user', 'username tier')
      .sort({ rank: 1 })
      .limit(parseInt(limit));
    } catch (error) {
      console.error(`❌ Error searching users:`, error);
      throw error;
    }
  }

  // Update user after match completion
  async updateUserAfterMatch(userId, matchResult) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      await this.updateUserLeaderboard(user);
      
      // Update rankings for this user's tier
      await this.updateRankingsForPeriod('all-time');
      
      console.log(`✅ Updated leaderboard for user ${user.username} after match`);
    } catch (error) {
      console.error(`❌ Error updating user after match:`, error);
    }
  }

  // Stop periodic updates
  stopUpdates() {
    this.isUpdating = false;
    console.log('⏹️ Leaderboard updates stopped');
  }
}

module.exports = new LeaderboardService();
