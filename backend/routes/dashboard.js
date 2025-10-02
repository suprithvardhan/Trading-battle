const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /api/dashboard/stats
// @desc    Get user dashboard statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Calculate additional stats
    const totalMatches = user.wins + user.losses;
    const winRate = totalMatches > 0 ? (user.wins / totalMatches) * 100 : 0;
    
    const stats = {
      balance: user.balance,
      wins: user.wins,
      losses: user.losses,
      totalMatches: totalMatches,
      winRate: Math.round(winRate * 10) / 10, // Round to 1 decimal
      tier: user.tier,
      badges: user.badges || [],
      joinDate: user.joinDate
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
    // For now, return mock data. In a real app, you'd have a Match model
    const mockMatches = [
      {
        id: 1,
        opponent: 'CryptoKing_99',
        result: 'win',
        profit: 1250,
        duration: '4m 32s',
        timestamp: '2 hours ago',
        asset: 'BTC/USD'
      },
      {
        id: 2,
        opponent: 'StockMaster_42',
        result: 'loss',
        profit: -800,
        duration: '6m 15s',
        timestamp: '1 day ago',
        asset: 'AAPL'
      },
      {
        id: 3,
        opponent: 'TradingPro_88',
        result: 'win',
        profit: 2100,
        duration: '3m 45s',
        timestamp: '2 days ago',
        asset: 'TSLA'
      }
    ];

    res.json({ success: true, matches: mockMatches });
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
