const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const matchmakingService = require('../services/matchmaking');
const Match = require('../models/Match');

// @route   POST /api/matchmaking/join
// @desc    Join matchmaking queue
// @access  Private
router.post('/join', auth, async (req, res) => {
  try {
    const { preferences = {} } = req.body;
    
    const result = await matchmakingService.addToQueue(req.user.id, preferences);
    
    if (result.success && result.match) {
      // Match found immediately
      res.json({
        success: true,
        message: 'Match found!',
        match: result.match
      });
    } else {
      // Added to queue
      res.json({
        success: true,
        message: 'Added to matchmaking queue',
        position: result.position,
        estimatedWaitTime: result.position * 30 // 30 seconds per position
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/matchmaking/leave
// @desc    Leave matchmaking queue
// @access  Private
router.post('/leave', auth, async (req, res) => {
  try {
    const result = matchmakingService.removeFromQueue(req.user.id);
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/matchmaking/clear
// @desc    Clear all matches for user (for testing)
// @access  Private
router.post('/clear', auth, async (req, res) => {
  try {
    const result = await matchmakingService.clearUserMatches(req.user.id);
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/matchmaking/clear-all
// @desc    Clear all matchmaking data (for testing)
// @access  Private
router.post('/clear-all', auth, async (req, res) => {
  try {
    const result = matchmakingService.clearAllData();
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/matchmaking/cleanup
// @desc    Manually cleanup expired matches (for testing)
// @access  Private
router.post('/cleanup', auth, async (req, res) => {
  try {
    await matchmakingService.cleanupExpiredMatches();
    res.json({ success: true, message: 'Cleanup completed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/matchmaking/status
// @desc    Get matchmaking status
// @access  Private
router.get('/status', auth, async (req, res) => {
  try {
    // Check if user has an active match in database
    const activeMatch = await Match.findOne({
      'players.user': req.user.id,
      status: { $in: ['waiting', 'active'] }
    }).populate('players.user', 'username');

    if (activeMatch) {
      // User has an active match
      const opponent = activeMatch.players.find(player => 
        player.user._id.toString() !== req.user.id
      );
      
      return res.json({
        success: true,
        match: {
          _id: activeMatch._id,
          status: activeMatch.status,
          opponent: {
            username: opponent.username,
            userId: opponent.user._id
          },
          startTime: activeMatch.startTime,
          duration: activeMatch.duration,
          players: activeMatch.players
        }
      });
    }

    // Check if user is in the in-memory queue
    const queueStatus = matchmakingService.getQueueStatus();
    const userInQueue = queueStatus.queue.find(user => user.userId === req.user.id.toString());
    
    if (userInQueue) {
      // User is in queue
      const userPosition = queueStatus.queue.findIndex(user => user.userId === req.user.id.toString());
      return res.json({
        success: true,
        status: {
          ...queueStatus,
          userPosition: userPosition >= 0 ? userPosition + 1 : null,
          estimatedWaitTime: userPosition >= 0 ? (userPosition + 1) * 30 : 0
        }
      });
    }

    // User is not in queue and has no active match
    res.json({
      success: true,
      status: {
        totalWaiting: queueStatus.totalWaiting,
        activeMatches: queueStatus.activeMatches,
        queue: queueStatus.queue,
        userPosition: null,
        estimatedWaitTime: 0
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/matchmaking/stats
// @desc    Get matchmaking statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const stats = matchmakingService.getStats();
    res.json({ success: true, stats });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/matchmaking/start-match/:id
// @desc    Start a match
// @access  Private
router.post('/start-match/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is part of this match
    const match = await Match.findById(id);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    const isParticipant = match.players.some(player => {
      // Handle both ObjectId and populated user object
      const playerUserId = player.user._id ? player.user._id.toString() : player.user.toString();
      return playerUserId === req.user.id.toString();
    });

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not a participant' });
    }

    const startedMatch = await matchmakingService.startMatch(id);
    
    res.json({
      success: true,
      message: 'Match started!',
      match: startedMatch
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/matchmaking/end-match/:id
// @desc    End a match
// @access  Private
router.post('/end-match/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is part of this match
    const match = await Match.findById(id);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    const isParticipant = match.players.some(player => {
      // Handle both ObjectId and populated user object
      const playerUserId = player.user._id ? player.user._id.toString() : player.user.toString();
      return playerUserId === req.user.id.toString();
    });

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not a participant' });
    }

    const endedMatch = await matchmakingService.endMatch(id);
    
    res.json({
      success: true,
      message: 'Match ended!',
      match: endedMatch
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/matchmaking/queue
// @desc    Get current queue (for debugging)
// @access  Private
router.get('/queue', auth, async (req, res) => {
  try {
    const status = matchmakingService.getQueueStatus();
    res.json({ success: true, queue: status });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
