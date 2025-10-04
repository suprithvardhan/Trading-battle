const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Match = require('../models/Match');
const User = require('../models/User');
const Trade = require('../models/Trade');
const Asset = require('../models/Asset');
const Order = require('../models/Order');

// @route   GET /api/matches/active
// @desc    Get user's active matches
// @access  Private
router.get('/active', auth, async (req, res) => {
  try {
    const activeMatches = await Match.find({
      'players.user': req.user.id,
      status: { $in: ['waiting', 'active'] }
    })
    .populate('players.user', 'username tier')
    .sort({ createdAt: -1 });

    res.json({ success: true, matches: activeMatches });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/matches/history
// @desc    Get user's match history
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const matches = await Match.find({
      'players.user': req.user.id,
      status: 'completed'
    })
    .populate('players.user', 'username tier')
    .populate('winner', 'username')
    .sort({ endTime: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    // Add result field to each match
    const matchesWithResults = matches.map(match => {
      const matchObj = match.toObject();
      const userPlayer = match.players.find(p => p.user._id.toString() === req.user.id);
      const opponentPlayer = match.players.find(p => p.user._id.toString() !== req.user.id);
      
      // Determine result based on winner
      if (match.winner && match.winner.toString() === req.user.id) {
        matchObj.result = 'win';
        matchObj.profit = userPlayer.realizedPnL || 0;
      } else if (match.winner && match.winner.toString() !== req.user.id) {
        matchObj.result = 'loss';
        matchObj.profit = userPlayer.realizedPnL || 0;
      } else {
        matchObj.result = 'draw';
        matchObj.profit = 0;
      }
      
      // Add opponent info
      matchObj.opponent = opponentPlayer?.username || 'Unknown';
      matchObj.asset = 'BTC/USD'; // Default asset
      matchObj.duration = matchObj.duration || 5; // Default duration
      
      return matchObj;
    });

    const total = await Match.countDocuments({
      'players.user': req.user.id,
      status: 'completed'
    });

    res.json({ 
      success: true, 
      matches: matchesWithResults,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/matches/:id
// @desc    Get specific match details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('players.user', 'username tier')
      .populate('winner', 'username');

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    // Check if user is part of this match
    const isParticipant = match.players.some(player => {
      // Handle both ObjectId and populated user object
      const playerUserId = player.user._id ? player.user._id.toString() : player.user.toString();
      return playerUserId === req.user.id.toString();
    });

    if (!isParticipant) {
      console.log(`❌ Access denied for user ${req.user.id} to match ${req.params.id}`);
      console.log(`Match players:`, match.players.map(p => ({ 
        user: p.user._id ? p.user._id.toString() : p.user.toString(), 
        username: p.username 
      })));
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get trades for this match
    const trades = await Trade.find({ match: match._id })
      .populate('asset', 'symbol name type')
      .sort({ executedAt: -1 });

    res.json({ 
      success: true, 
      match,
      trades
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/matches/create
// @desc    Create a new match
// @access  Private
router.post('/create', auth, async (req, res) => {
  try {
    const { duration = 5, matchType = 'quick', rules = {} } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Create new match
    const match = new Match({
      players: [{
        user: req.user.id,
        username: user.username,
        startingBalance: user.balance,
        currentBalance: user.balance
      }],
      duration,
      matchType,
      rules: {
        maxTrades: rules.maxTrades || 50,
        allowedAssets: rules.allowedAssets || ['BTC', 'ETH', 'AAPL', 'TSLA', 'MSFT'],
        leverage: rules.leverage || 1
      }
    });

    await match.save();

    res.json({ 
      success: true, 
      message: 'Match created successfully',
      match 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/matches/:id/join
// @desc    Join an existing match
// @access  Private
router.post('/:id/join', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    if (match.status !== 'waiting') {
      return res.status(400).json({ success: false, message: 'Match is not available' });
    }

    if (match.players.length >= 2) {
      return res.status(400).json({ success: false, message: 'Match is full' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Add player to match
    match.players.push({
      user: req.user.id,
      username: user.username,
      startingBalance: user.balance,
      currentBalance: user.balance
    });

    // Start match if we have 2 players
    if (match.players.length === 2) {
      match.status = 'active';
      match.startTime = new Date();
    }

    await match.save();

    res.json({ 
      success: true, 
      message: 'Joined match successfully',
      match 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/matches/:id/trade
// @desc    Execute a trade in a match
// @access  Private
router.post('/:id/trade', auth, async (req, res) => {
  try {
    const { symbol, type, quantity, price } = req.body;
    
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    if (match.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Match is not active' });
    }

    // Check if user is part of this match
    const player = match.players.find(p => p.user.toString() === req.user.id);
    if (!player) {
      return res.status(403).json({ success: false, message: 'Not a participant' });
    }

    // Check if match is still active
    const now = new Date();
    const matchEndTime = new Date(match.startTime.getTime() + match.duration * 60000);
    if (now >= matchEndTime) {
      match.status = 'completed';
      match.endTime = now;
      await match.save();
      return res.status(400).json({ success: false, message: 'Match has ended' });
    }

    // Get asset
    const asset = await Asset.findOne({ symbol: symbol.toUpperCase() });
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Calculate trade value
    const totalValue = quantity * price;

    // Check if user has enough balance
    if (type === 'buy' && player.currentBalance < totalValue) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Create trade
    const trade = new Trade({
      user: req.user.id,
      match: match._id,
      asset: asset._id,
      symbol: symbol.toUpperCase(),
      type,
      quantity,
      price,
      totalValue,
      status: 'filled'
    });

    await trade.save();

    // Update player balance
    if (type === 'buy') {
      player.currentBalance -= totalValue;
    } else {
      player.currentBalance += totalValue;
    }

    // Add trade to player's trades
    player.trades.push({
      symbol: symbol.toUpperCase(),
      type,
      quantity,
      price,
      timestamp: new Date()
    });

    // Update match total volume
    match.totalVolume += totalValue;

    await match.save();

    res.json({ 
      success: true, 
      message: 'Trade executed successfully',
      trade,
      newBalance: player.currentBalance
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/matches/:id/leaderboard
// @desc    Get match leaderboard
// @access  Private
router.get('/:id/leaderboard', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    // Check if user is part of this match
    const isParticipant = match.players.some(player => {
      // Handle both ObjectId and populated user object
      const playerUserId = player.user._id ? player.user._id.toString() : player.user.toString();
      return playerUserId === req.user.id.toString();
    });

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const leaderboard = match.getLeaderboard();

    res.json({ 
      success: true, 
      leaderboard 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/matches/:id/quit
// @desc    Quit a match
// @access  Private
router.post('/:id/quit', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const match = await Match.findById(id);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    if (match.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Match is not active' });
    }

    // Check if user is in this match
    const player = match.players.find(p => {
      const playerUserId = p.user._id ? p.user._id.toString() : p.user.toString();
      return playerUserId === userId.toString();
    });
    if (!player) {
      return res.status(403).json({ success: false, message: 'You are not in this match' });
    }

    // Set match as completed with opponent as winner
    match.status = 'completed';
    match.winner = match.players.find(p => {
      const playerUserId = p.user._id ? p.user._id.toString() : p.user.toString();
      return playerUserId !== userId.toString();
    })?.user;
    match.endTime = new Date();

    await match.save();

    // Notify match connection service to end match
    try {
      await fetch('http://localhost:5002/end-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matchId: id,
          reason: 'quit',
          userId: userId
        })
      });
      console.log(`🏁 Notified match connection service to end match ${id} due to quit`);
    } catch (error) {
      console.error('❌ Error notifying match connection service:', error);
    }

    res.json({ success: true, message: 'Match quit successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/matches/:id/end
// @desc    End a match (called when conditions are met)
// @access  Private
router.post('/:id/end', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { winner, userBalance, opponentBalance, userTrades, opponentTrades } = req.body;
    const userId = req.user.id;

    const match = await Match.findById(id);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    if (match.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Match is not active' });
    }

    console.log(`🏁 Ending match ${id} with winner: ${winner}`);

    // Update match with final results
    match.status = 'completed';
    match.winner = winner;
    match.endTime = new Date();

    // Update player balances
    const userPlayer = match.players.find(p => {
      const playerUserId = p.user._id ? p.user._id.toString() : p.user.toString();
      return playerUserId === userId.toString();
    });
    const opponentPlayer = match.players.find(p => {
      const playerUserId = p.user._id ? p.user._id.toString() : p.user.toString();
      return playerUserId !== userId.toString();
    });
    
    if (userPlayer) {
      userPlayer.currentBalance = userBalance;
    }
    if (opponentPlayer) {
      opponentPlayer.currentBalance = opponentBalance;
    }

    await match.save();

    // Notify match connection service to end match
    try {
      await fetch('http://localhost:5002/end-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matchId: id,
          reason: 'manual_end',
          userId: userId
        })
      });
      console.log(`🏁 Notified match connection service to end match ${id}`);
    } catch (error) {
      console.error('❌ Error notifying match connection service:', error);
    }

    // Cancel all open orders for this match
    await cancelMatchOrders(id);

    // Update user stats
    if (winner === userId) {
      await User.findByIdAndUpdate(userId, { $inc: { 'stats.wins': 1, 'stats.currentStreak': 1 } });
    } else if (winner) {
      await User.findByIdAndUpdate(userId, { $inc: { 'stats.losses': 1 }, $set: { 'stats.currentStreak': 0 } });
    }

    console.log(`✅ Match ${id} ended successfully`);
    res.json({ success: true, match });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper function to cancel all open orders for a match
async function cancelMatchOrders(matchId) {
  try {
    console.log(`🚫 Cancelling all open orders for match ${matchId}`);
    
    // Cancel all pending orders for this match
    const cancelledOrders = await Order.updateMany({
      match: matchId,
      status: 'pending'
    }, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: 'match_ended'
    });

    console.log(`✅ Cancelled ${cancelledOrders.modifiedCount} orders for match ${matchId}`);
    
    // Notify order execution service to stop processing orders for this match
    try {
      await fetch('http://localhost:5001/notify-match-ended', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matchId: matchId
        })
      });
      console.log(`📨 Notified execution service of match end for ${matchId}`);
    } catch (error) {
      console.error('❌ Error notifying execution service:', error);
    }
    
  } catch (error) {
    console.error('❌ Error cancelling match orders:', error);
  }
}

module.exports = router;
