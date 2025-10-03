const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Match = require('../models/Match');
const Trade = require('../models/Trade');
const Leaderboard = require('../models/Leaderboard');
const Asset = require('../models/Asset');

// @route   GET /api/dashboard/stats
// @desc    Get user dashboard statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get user's ranking
    const userRank = await Leaderboard.findOne({ user: req.user.id, period: 'all-time' });
    
    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayMatches = await Match.find({
      'players.user': req.user.id,
      status: 'completed',
      endTime: { $gte: today }
    });

    const todayTrades = await Trade.find({
      user: req.user.id,
      status: 'filled',
      executedAt: { $gte: today }
    });

    // Calculate today's P&L
    const todayPnL = todayTrades.reduce((total, trade) => {
      return total + (trade.type === 'buy' ? -trade.totalValue : trade.totalValue);
    }, 0);

    // Get active matches
    const activeMatches = await Match.find({
      'players.user': req.user.id,
      status: { $in: ['waiting', 'active'] }
    }).countDocuments();

    const stats = {
      balance: user.balance,
      wins: user.stats.wins,
      losses: user.stats.losses,
      totalMatches: user.stats.totalMatches,
      winRate: user.stats.winRate,
      tier: user.tier,
      badges: user.badges || [],
      joinDate: user.createdAt,
      rank: userRank ? userRank.rank : null,
      todayPnL: Math.round(todayPnL * 100) / 100,
      todayTrades: todayTrades.length,
      activeMatches,
      currentStreak: user.stats.currentStreak,
      bestStreak: user.stats.bestStreak,
      totalProfit: user.stats.totalProfit || 0
    };

    res.json({ success: true, stats });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/dashboard/recent-matches
// @desc    Get user's recent matches
// @access  Private
router.get('/recent-matches', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const recentMatches = await Match.find({
      'players.user': req.user.id,
      status: 'completed'
    })
    .populate('players.user', 'username')
    .populate('winner', 'username')
    .sort({ endTime: -1 })
    .limit(parseInt(limit));

    const formattedMatches = recentMatches.map(match => {
      const userPlayer = match.players.find(p => p.user.toString() === req.user.id);
      const opponent = match.players.find(p => p.user.toString() !== req.user.id);
      const isWinner = match.winner && match.winner.toString() === req.user.id;
      
      return {
        id: match._id,
        opponent: opponent ? opponent.username : 'Unknown',
        result: isWinner ? 'win' : 'loss',
        profit: userPlayer ? userPlayer.profit : 0,
        duration: match.durationInMinutes ? `${match.durationInMinutes}m` : '0m',
        timestamp: match.endTime,
        asset: 'Mixed', // Could be enhanced to show most traded asset
        matchType: match.matchType
      };
    });

    res.json({ success: true, matches: formattedMatches });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/dashboard/leaderboard
// @desc    Get global leaderboard
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await User.find({})
      .sort({ wins: -1, winRate: -1, balance: -1 })
      .limit(50)
      .select('-password -email -badges');

    res.json({ success: true, leaderboard });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/dashboard/start-match
// @desc    Start a new match (mock implementation)
// @access  Private
router.post('/start-match', auth, async (req, res) => {
  try {
    // Mock matchmaking - in a real app, you'd implement proper matchmaking logic
    const mockOpponents = [
      'CryptoKing_99',
      'StockMaster_42', 
      'TradingPro_88',
      'MarketWizard_77',
      'FinanceGuru_55'
    ];
    
    const randomOpponent = mockOpponents[Math.floor(Math.random() * mockOpponents.length)];
    
    // Simulate match creation
    const match = {
      id: Date.now(),
      opponent: randomOpponent,
      status: 'searching',
      createdAt: new Date()
    };

    res.json({ 
      success: true, 
      message: 'Match found!',
      match 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
