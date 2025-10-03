const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Leaderboard = require('../models/Leaderboard');
const User = require('../models/User');

// @route   GET /api/leaderboard
// @desc    Get global leaderboard
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { period = 'all-time', limit = 50, tier = null } = req.query;
    
    let query = { period };
    if (tier) {
      query.tier = tier;
    }

    const leaderboard = await Leaderboard.find(query)
      .populate('user', 'username tier')
      .sort({ rank: 1 })
      .limit(parseInt(limit));

    res.json({ success: true, leaderboard });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/top
// @desc    Get top performers
// @access  Public
router.get('/top', async (req, res) => {
  try {
    const { period = 'all-time', limit = 10 } = req.query;

    const topPerformers = await Leaderboard.find({ period })
      .populate('user', 'username tier')
      .sort({ rank: 1 })
      .limit(parseInt(limit));

    res.json({ success: true, topPerformers });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/user/:userId
// @desc    Get specific user's ranking
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const { period = 'all-time' } = req.query;
    const { userId } = req.params;

    const userRank = await Leaderboard.findOne({ 
      user: userId, 
      period 
    }).populate('user', 'username tier');

    if (!userRank) {
      return res.status(404).json({ success: false, message: 'User not found in leaderboard' });
    }

    res.json({ success: true, userRank });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/me
// @desc    Get current user's ranking
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const { period = 'all-time' } = req.query;

    const userRank = await Leaderboard.findOne({ 
      user: req.user.id, 
      period 
    }).populate('user', 'username tier');

    if (!userRank) {
      return res.status(404).json({ success: false, message: 'User not found in leaderboard' });
    }

    res.json({ success: true, userRank });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/tiers
// @desc    Get tier distribution
// @access  Public
router.get('/tiers', async (req, res) => {
  try {
    const { period = 'all-time' } = req.query;

    const tierDistribution = await Leaderboard.getTierDistribution(period);

    res.json({ success: true, tierDistribution });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/around/:userId
// @desc    Get users around a specific user in ranking
// @access  Public
router.get('/around/:userId', async (req, res) => {
  try {
    const { period = 'all-time', range = 5 } = req.query;
    const { userId } = req.params;

    const userRank = await Leaderboard.findOne({ 
      user: userId, 
      period 
    });

    if (!userRank) {
      return res.status(404).json({ success: false, message: 'User not found in leaderboard' });
    }

    const startRank = Math.max(1, userRank.rank - parseInt(range));
    const endRank = userRank.rank + parseInt(range);

    const aroundUsers = await Leaderboard.find({
      period,
      rank: { $gte: startRank, $lte: endRank }
    })
    .populate('user', 'username tier')
    .sort({ rank: 1 });

    res.json({ 
      success: true, 
      aroundUsers,
      userRank: userRank.rank
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/stats
// @desc    Get leaderboard statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const { period = 'all-time' } = req.query;

    const [
      totalUsers,
      tierDistribution,
      topPerformers
    ] = await Promise.all([
      Leaderboard.countDocuments({ period }),
      Leaderboard.getTierDistribution(period),
      Leaderboard.getTopPerformers(period, 5)
    ]);

    res.json({ 
      success: true, 
      stats: {
        totalUsers,
        tierDistribution,
        topPerformers
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/leaderboard/update
// @desc    Update leaderboard rankings (admin only)
// @access  Private
router.post('/update', auth, async (req, res) => {
  try {
    const { period = 'all-time' } = req.body;

    // Update all rankings
    await Leaderboard.updateAllRankings(period);

    res.json({ 
      success: true, 
      message: 'Leaderboard updated successfully' 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/search
// @desc    Search users in leaderboard
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, period = 'all-time', limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const searchResults = await Leaderboard.find({
      period,
      username: { $regex: q, $options: 'i' }
    })
    .populate('user', 'username tier')
    .sort({ rank: 1 })
    .limit(parseInt(limit));

    res.json({ success: true, searchResults });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
