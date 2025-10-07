const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Match = require('../models/Match');
const User = require('../models/User');
const Trade = require('../models/Trade');
const Asset = require('../models/Asset');
const Order = require('../models/Order');
const UserStatsService = require('../services/userStatsService');

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

// @route   GET /api/matches/debug
// @desc    Debug match data for specific user
// @access  Private
router.get('/debug', auth, async (req, res) => {
  try {
    console.log('🔍 DEBUG: User ID from request:', req.user.id);
    console.log('🔍 DEBUG: User ID type:', typeof req.user.id);
    
    // Find matches where this user is a player
    const matches = await Match.find({
      'players.user': req.user.id,
      status: 'completed'
    })
    .populate('players.user', 'username _id')
    .populate('winner', 'username _id')
    .sort({ endTime: -1 })
    .limit(5);

    console.log('🔍 DEBUG: Found matches:', matches.length);
    
    const debugData = matches.map(match => {
      const userPlayer = match.players.find(p => p.user._id.toString() === req.user.id);
      const opponentPlayer = match.players.find(p => p.user._id.toString() !== req.user.id);
      
      return {
        matchId: match._id,
        winner: match.winner,
        winnerId: match.winner ? match.winner.toString() : null,
        winnerUsername: match.winner ? match.winner.username : null,
        userPlayer: userPlayer ? {
          id: userPlayer.user._id.toString(),
          username: userPlayer.user.username
        } : null,
        opponentPlayer: opponentPlayer ? {
          id: opponentPlayer.user._id.toString(),
          username: opponentPlayer.user.username
        } : null,
        isWinner: match.winner && match.winner.toString() === req.user.id,
        status: match.status,
        endTime: match.endTime
      };
    });

    res.json({ 
      success: true, 
      debug: {
        userId: req.user.id,
        userIdType: typeof req.user.id,
        matches: debugData
      }
    });
  } catch (err) {
    console.error('Debug error:', err.message);
    res.status(500).json({ success: false, message: 'Debug error' });
  }
});

// @route   GET /api/matches/history
// @desc    Get user's match history
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    console.log('🔍 Fetching match history for user:', req.user.id);

    // Get all completed matches where user is a player
    const matches = await Match.find({
      'players.user': req.user.id,
      status: 'completed'
    })
    .populate('players.user', 'username _id')
    .populate('winner', 'username _id')
    .sort({ endTime: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    console.log('📊 Found matches:', matches.length);

    // Format matches with clear win/loss/draw status
    const formattedMatches = matches.map(match => {
      const userPlayer = match.players.find(p => p.user._id.toString() === req.user.id);
      const opponentPlayer = match.players.find(p => p.user._id.toString() !== req.user.id);
      
      // Determine result from user's perspective
      let result = 'draw';
      let profit = 0;
      
      if (match.winner) {
        const winnerId = match.winner._id ? match.winner._id.toString() : match.winner.toString();
        const userId = req.user.id.toString();
        
        console.log('🎯 Match result check:', {
          matchId: match._id,
          winnerId,
          userId,
          winnerUsername: match.winner.username,
          userUsername: userPlayer?.user?.username,
          opponentUsername: opponentPlayer?.user?.username
        });
        
        if (winnerId === userId) {
          result = 'win';
          profit = userPlayer?.realizedPnL || 0;
          console.log('✅ USER WON:', match._id);
        } else {
          result = 'loss';
          profit = userPlayer?.realizedPnL || 0;
          console.log('❌ USER LOST:', match._id);
        }
      } else {
        console.log('🤝 DRAW:', match._id);
      }

      return {
        _id: match._id,
        result,
        profit,
        opponent: opponentPlayer?.user?.username || 'Unknown',
        asset: 'BTC/USD',
        duration: match.duration || 5,
        endTime: match.endTime,
        startTime: match.startTime,
        userBalance: userPlayer?.currentBalance || 0,
        opponentBalance: opponentPlayer?.currentBalance || 0,
        // Include full match data for detailed view
        players: match.players.map(player => ({
          user: {
            _id: player.user._id,
            username: player.user.username
          },
          startingBalance: player.startingBalance || 0,
          currentBalance: player.currentBalance || 0,
          realizedPnL: player.realizedPnL || 0,
          trades: player.trades || []
        })),
        winner: match.winner,
        // Include raw data for debugging
        debug: {
          winnerId: match.winner?._id?.toString() || match.winner?.toString(),
          userId: req.user.id,
          userPlayerId: userPlayer?.user?._id?.toString(),
          opponentPlayerId: opponentPlayer?.user?._id?.toString()
        }
      };
    });

    // Calculate statistics
    const wins = formattedMatches.filter(m => m.result === 'win').length;
    const losses = formattedMatches.filter(m => m.result === 'loss').length;
    const draws = formattedMatches.filter(m => m.result === 'draw').length;
    const totalMatches = formattedMatches.length;

    console.log('📈 Match statistics:', { wins, losses, draws, totalMatches });

    const total = await Match.countDocuments({
      'players.user': req.user.id,
      status: 'completed'
    });

    res.json({
      success: true,
      matches: formattedMatches,
      statistics: {
        total: totalMatches,
        wins,
        losses,
        draws,
        winRate: totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0
      },
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    console.error('❌ Match history error:', err.message);
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

    // Get trades from the match document (stored by microservices)
    // Also get trades from Trade collection for backward compatibility
    const tradeCollection = await Trade.find({ match: match._id })
      .populate('asset', 'symbol name type')
      .sort({ executedAt: -1 });

    // Extract trades from match players
    const matchTrades = [];
    match.players.forEach(player => {
      if (player.trades && player.trades.length > 0) {
        player.trades.forEach(trade => {
          matchTrades.push({
            ...trade,
            user: player.user,
            username: player.user.username || 'Unknown'
          });
        });
      }
    });

    // Sort match trades by timestamp
    matchTrades.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ 
      success: true, 
      match,
      trades: matchTrades, // Use trades from match document
      tradeCollection // Keep for backward compatibility
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

    // Update user stats using UserStatsService
    const userPlayerForStats = match.players.find(p => p.user._id.toString() === userId);
    const opponentPlayerForStats = match.players.find(p => p.user._id.toString() !== userId);
    
    let matchResult = 'draw';
    if (winner === userId) {
      matchResult = 'win';
    } else if (winner) {
      matchResult = 'loss';
    }
    
    // Get P&L data for the user
    const userPnL = userPlayerForStats.realizedPnL || 0;
    const userVolume = userPlayerForStats.totalVolume || 0;
    
    // Update user stats using the new service
    try {
      await UserStatsService.updateUserStats(userId, matchResult, userPnL, userVolume);
      
      // Also update opponent stats if they exist
      if (opponentPlayerForStats) {
        const opponentResult = matchResult === 'win' ? 'loss' : matchResult === 'loss' ? 'win' : 'draw';
        const opponentPnL = opponentPlayerForStats.realizedPnL || 0;
        const opponentVolume = opponentPlayerForStats.totalVolume || 0;
        
        await UserStatsService.updateUserStats(opponentPlayerForStats.user._id, opponentResult, opponentPnL, opponentVolume);
      }
      
      console.log(`📊 Updated stats for match ${id}: User result: ${matchResult}, P&L: ${userPnL}`);
    } catch (error) {
      console.error('Error updating user stats:', error);
      // Don't fail the match end if stats update fails
    }
    
    // Keep the old User model updates for backward compatibility
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
