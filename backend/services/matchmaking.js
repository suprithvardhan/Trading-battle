const User = require('../models/User');
const Match = require('../models/Match');

class MatchmakingService {
  constructor() {
    this.waitingQueue = new Map(); // userId -> user data
    this.activeMatches = new Map(); // matchId -> match data
    this.matchmakingInterval = null; // Interval for checking matches
    this.matchCleanupInterval = null; // Interval for cleaning up expired matches
    this.startMatchmakingProcess();
    this.startMatchCleanupProcess();
  }

  // Start the matchmaking process (runs every 2 seconds)
  startMatchmakingProcess() {
    if (this.matchmakingInterval) {
      clearInterval(this.matchmakingInterval);
    }
    
    this.matchmakingInterval = setInterval(async () => {
      await this.processMatchmaking();
    }, 2000); // Check every 2 seconds
    
    console.log('🔄 Matchmaking process started');
  }

  // Start the match cleanup process (runs every 30 seconds)
  startMatchCleanupProcess() {
    if (this.matchCleanupInterval) {
      clearInterval(this.matchCleanupInterval);
    }
    
    this.matchCleanupInterval = setInterval(async () => {
      await this.cleanupExpiredMatches();
      await this.cleanupOldCompletedMatches();
    }, 30000); // Check every 30 seconds
    
    console.log('🧹 Match cleanup process started');
  }

  // Process matchmaking queue
  async processMatchmaking() {
    if (this.waitingQueue.size < 2) return;
    
    console.log(`🔍 Processing matchmaking queue: ${this.waitingQueue.size} users waiting`);
    
    // Get all users in queue
    const queueUsers = Array.from(this.waitingQueue.values());
    
    // Try to match users
    for (let i = 0; i < queueUsers.length; i++) {
      for (let j = i + 1; j < queueUsers.length; j++) {
        const user1 = queueUsers[i];
        const user2 = queueUsers[j];
        
        // Check if they are compatible
        if (this.areUsersCompatible(user1, user2)) {
          console.log(`✅ Found compatible match: ${user1.username} vs ${user2.username}`);
          
          // Create match
          const match = await this.createMatch(user1.userId, user2.userId, user1, user2);
          
          if (match) {
            // Remove both users from queue
            this.waitingQueue.delete(user1.userId);
            this.waitingQueue.delete(user2.userId);
            
            console.log(`🎮 Match created: ${match._id}`);
            break; // Exit inner loop
          }
        }
      }
    }
  }

  // Check if two users are compatible
  areUsersCompatible(user1, user2) {
    const skillDifference = Math.abs(user1.winRate - user2.winRate);
    const tierMatch = this.isTierCompatible(user1.tier, user2.tier);
    
    return skillDifference <= 20 && tierMatch; // Max 20% skill difference
  }

  // Add user to matchmaking queue
  async addToQueue(userId, preferences = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is already in queue
      if (this.waitingQueue.has(userId)) {
        return { success: false, message: 'Already in queue' };
      }

      // Check if user has active matches
      const activeMatch = await Match.findOne({
        'players.user': userId,
        status: { $in: ['waiting', 'active'] }
      });

      if (activeMatch) {
        return { success: false, message: 'User has active match' };
      }

      // Add to queue with user data and preferences
      this.waitingQueue.set(userId, {
        userId,
        username: user.username,
        tier: user.tier,
        winRate: user.stats.winRate,
        totalMatches: user.stats.totalMatches,
        balance: user.balance,
        preferences: {
          matchType: preferences.matchType || 'quick',
          duration: preferences.duration || 5,
          maxSkillDifference: preferences.maxSkillDifference || 20,
          ...preferences
        },
        joinedAt: new Date()
      });

      console.log(`👤 User ${user.username} added to queue (${this.waitingQueue.size} total)`);
      return { success: true, message: 'Added to queue', position: this.getQueuePosition(userId) };
    } catch (error) {
      console.error('Error adding to queue:', error);
      return { success: false, message: 'Error adding to queue' };
    }
  }

  // Remove user from queue
  removeFromQueue(userId) {
    this.waitingQueue.delete(userId);
    return { success: true, message: 'Removed from queue' };
  }

  // Clear all matches for a user (for testing/cleanup)
  async clearUserMatches(userId) {
    try {
      // Remove from queue
      this.waitingQueue.delete(userId);
      
      // End any active matches for this user
      const activeMatches = await Match.find({
        'players.user': userId,
        status: { $in: ['waiting', 'active'] }
      });

      for (const match of activeMatches) {
        match.status = 'cancelled';
        match.endTime = new Date();
        await match.save();
        this.activeMatches.delete(match._id);
      }

      console.log(`🧹 Cleared all matches for user ${userId}`);
      return { success: true, message: 'All matches cleared' };
    } catch (error) {
      console.error('Error clearing user matches:', error);
      return { success: false, message: 'Error clearing matches' };
    }
  }

  // Clear all in-memory data (for testing)
  clearAllData() {
    this.waitingQueue.clear();
    this.activeMatches.clear();
    console.log('🧹 Cleared all in-memory matchmaking data');
    return { success: true, message: 'All data cleared' };
  }

  // Clean up expired matches
  async cleanupExpiredMatches() {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
      
      // Find matches that are older than 5 minutes and still in waiting status
      const expiredWaitingMatches = await Match.find({
        status: 'waiting',
        createdAt: { $lt: fiveMinutesAgo }
      });

      // Find active matches that have been running for more than 5 minutes
      const expiredActiveMatches = await Match.find({
        status: 'active',
        startTime: { $lt: fiveMinutesAgo }
      });

      const allExpiredMatches = [...expiredWaitingMatches, ...expiredActiveMatches];

      for (const match of allExpiredMatches) {
        console.log(`⏰ Cleaning up expired match: ${match._id} (status: ${match.status})`);
        
        // End the match as a tie
        match.status = 'completed';
        match.endTime = new Date();
        match.winner = null; // No winner (tie)
        match.result = 'tie';
        
        await match.save();
        
        // Remove from active matches
        this.activeMatches.delete(match._id);
        
        // Update user stats for tie
        await this.updateUserStatsForTie(match);
        
        console.log(`✅ Expired match ${match._id} cleaned up as tie`);
      }
      
      if (allExpiredMatches.length > 0) {
        console.log(`🧹 Cleaned up ${allExpiredMatches.length} expired matches`);
      }
    } catch (error) {
      console.error('❌ Error cleaning up expired matches:', error);
    }
  }

  // Update user stats for a tie
  async updateUserStatsForTie(match) {
    try {
      for (const player of match.players) {
        const user = await User.findById(player.user);
        if (user) {
          user.stats.totalMatches += 1;
          user.stats.currentStreak = 0; // Reset streak on tie
          user.stats.winRate = user.calculateWinRate();
          user.tier = user.updateTier();
          await user.save();
        }
      }
      console.log(`📊 Updated stats for tie in match ${match._id}`);
    } catch (error) {
      console.error('❌ Error updating user stats for tie:', error);
    }
  }

  // Clean up old completed matches (older than 24 hours)
  async cleanupOldCompletedMatches() {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
      
      const oldMatches = await Match.find({
        status: 'completed',
        endTime: { $lt: oneDayAgo }
      });

      if (oldMatches.length > 0) {
        await Match.deleteMany({
          status: 'completed',
          endTime: { $lt: oneDayAgo }
        });
        console.log(`🗑️ Cleaned up ${oldMatches.length} old completed matches`);
      }
    } catch (error) {
      console.error('❌ Error cleaning up old completed matches:', error);
    }
  }


  // Create a new match
  async createMatch(userId1, userId2, userData1, userData2) {
    try {
      const match = new Match({
        players: [
          {
            user: userId1,
            username: userData1.username,
            startingBalance: userData1.balance,
            currentBalance: userData1.balance
          },
          {
            user: userId2,
            username: userData2.username,
            startingBalance: userData2.balance,
            currentBalance: userData2.balance
          }
        ],
        duration: userData1.preferences.duration,
        matchType: userData1.preferences.matchType,
        status: 'waiting',
        rules: {
          maxTrades: 50,
          allowedAssets: ['BTC', 'ETH', 'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META'],
          leverage: 1
        }
      });

      await match.save();
      this.activeMatches.set(match._id, match);

      // Auto-start the match after 2 seconds
      setTimeout(async () => {
        try {
          await this.startMatch(match._id);
          console.log(`🚀 Auto-started match: ${match._id}`);
        } catch (error) {
          console.error(`❌ Error auto-starting match ${match._id}:`, error);
        }
      }, 2000);

      return match;
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  }

  // Check if tiers are compatible
  isTierCompatible(tier1, tier2) {
    const tierLevels = {
      'Bronze': 1,
      'Silver': 2,
      'Gold': 3,
      'Platinum': 4,
      'Diamond': 5
    };

    const level1 = tierLevels[tier1] || 1;
    const level2 = tierLevels[tier2] || 1;

    // Allow matches within 2 tier levels
    return Math.abs(level1 - level2) <= 2;
  }

  // Get queue position
  getQueuePosition(userId) {
    const queueArray = Array.from(this.waitingQueue.keys());
    const position = queueArray.indexOf(userId);
    return position >= 0 ? position + 1 : -1;
  }

  // Get queue status
  getQueueStatus() {
    return {
      totalWaiting: this.waitingQueue.size,
      activeMatches: this.activeMatches.size,
      queue: Array.from(this.waitingQueue.values()).map(user => ({
        username: user.username,
        tier: user.tier,
        winRate: user.winRate,
        waitingTime: Date.now() - user.joinedAt.getTime()
      }))
    };
  }

  // Start match (when both players are ready)
  async startMatch(matchId) {
    try {
      const match = await Match.findById(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      if (match.status !== 'waiting') {
        throw new Error('Match is not in waiting status');
      }

      match.status = 'active';
      match.startTime = new Date();
      await match.save();

      this.activeMatches.set(matchId, match);

      return match;
    } catch (error) {
      console.error('Error starting match:', error);
      throw error;
    }
  }

  // End match
  async endMatch(matchId) {
    try {
      const match = await Match.findById(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      await match.endMatch();
      this.activeMatches.delete(matchId);

      // Update user stats
      await this.updateUserStats(match);

      return match;
    } catch (error) {
      console.error('Error ending match:', error);
      throw error;
    }
  }

  // Update user statistics after match
  async updateUserStats(match) {
    try {
      const winner = match.players.find(p => p.user.toString() === match.winner.toString());
      const loser = match.players.find(p => p.user.toString() !== match.winner.toString());

      if (winner) {
        const winnerUser = await User.findById(winner.user);
        if (winnerUser) {
          winnerUser.stats.wins += 1;
          winnerUser.stats.totalMatches += 1;
          winnerUser.stats.currentStreak += 1;
          winnerUser.stats.bestStreak = Math.max(winnerUser.stats.bestStreak, winnerUser.stats.currentStreak);
          winnerUser.stats.winRate = winnerUser.calculateWinRate();
          winnerUser.tier = winnerUser.updateTier();
          winnerUser.balance = winner.currentBalance;
          await winnerUser.save();
        }
      }

      if (loser) {
        const loserUser = await User.findById(loser.user);
        if (loserUser) {
          loserUser.stats.losses += 1;
          loserUser.stats.totalMatches += 1;
          loserUser.stats.currentStreak = 0;
          loserUser.stats.winRate = loserUser.calculateWinRate();
          loserUser.tier = loserUser.updateTier();
          loserUser.balance = loser.currentBalance;
          await loserUser.save();
        }
      }
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  // Get matchmaking statistics
  getStats() {
    return {
      queueSize: this.waitingQueue.size,
      activeMatches: this.activeMatches.size,
      averageWaitTime: this.calculateAverageWaitTime(),
      tierDistribution: this.getTierDistribution()
    };
  }

  // Calculate average wait time
  calculateAverageWaitTime() {
    const now = Date.now();
    let totalWaitTime = 0;
    let count = 0;

    for (const user of this.waitingQueue.values()) {
      totalWaitTime += now - user.joinedAt.getTime();
      count++;
    }

    return count > 0 ? totalWaitTime / count : 0;
  }

  // Get tier distribution in queue
  getTierDistribution() {
    const distribution = {};
    for (const user of this.waitingQueue.values()) {
      distribution[user.tier] = (distribution[user.tier] || 0) + 1;
    }
    return distribution;
  }
}

module.exports = new MatchmakingService();
