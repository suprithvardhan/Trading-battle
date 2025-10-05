require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('../backend/db');
const cors = require('cors');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/paper-trading-battle', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB from match-connection-service');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Import models
const Order = require('../backend/models/Order');
const Position = require('../backend/models/Position');
const Match = require('../backend/models/Match');
const User = require('../backend/models/User');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Match rooms management
class MatchRoomManager {
  constructor() {
    this.rooms = new Map(); // matchId -> { users: Set, timer: Timeout, matchData: Object }
  }

  createRoom(matchId, matchData) {
    console.log(`🏠 Creating match room for ${matchId}`);
    
    // Check if room already exists
    if (this.rooms.has(matchId)) {
      console.log(`⚠️ Room ${matchId} already exists, skipping creation`);
      return;
    }
    
    const room = {
      matchId,
      users: new Set(),
      matchData,
      timer: null,
      startTime: new Date(),
      duration: matchData.duration || 5 // minutes
    };
    
    this.rooms.set(matchId, room);
    
    // Set timer to auto-close room after match duration
    room.timer = setTimeout(() => {
      this.closeRoom(matchId);
    }, room.duration * 60 * 1000); // Convert minutes to milliseconds
    
    console.log(`✅ Match room created for ${matchId}, duration: ${room.duration} minutes`);
  }

  addUserToRoom(matchId, userId, socket) {
    const room = this.rooms.get(matchId);
    if (!room) {
      console.log(`❌ Room ${matchId} not found - this means the match hasn't started yet`);
      return false;
    }

    room.users.add(userId);
    socket.join(`match_${matchId}`);
    
    console.log(`👤 User ${userId} joined match room ${matchId}`);
    console.log(`📊 Room ${matchId} now has ${room.users.size} users`);
    
    // Notify all users in the room
    io.to(`match_${matchId}`).emit('user_joined', {
      userId,
      matchId,
      totalUsers: room.users.size
    });

    return true;
  }

  removeUserFromRoom(matchId, userId, socket) {
    const room = this.rooms.get(matchId);
    if (!room) return;

    room.users.delete(userId);
    socket.leave(`match_${matchId}`);
    
    console.log(`👤 User ${userId} left match room ${matchId}`);
    
    // Notify remaining users
    io.to(`match_${matchId}`).emit('user_left', {
      userId,
      matchId,
      totalUsers: room.users.size
    });
  }

  async closeRoom(matchId, reason = 'time_ended') {
    const room = this.rooms.get(matchId);
    if (!room) {
      console.log(`⚠️ Room ${matchId} already closed or doesn't exist`);
      return;
    }

    console.log(`🏁 Closing match room ${matchId} - Reason: ${reason}`);
    
    // Clear timer
    if (room.timer) {
      clearTimeout(room.timer);
    }

    try {
      // 1. Cancel all open orders for this match
      await this.cancelMatchOrders(matchId);
      
      // 2. Close all open positions and calculate PnL
      await this.closeMatchPositions(matchId);
      
      // 3. Wait a moment for database updates to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 4. Determine match winner based on reason
      const matchResult = await this.determineMatchWinner(matchId, reason);
      
      // 4. Update match status in database
      await this.updateMatchStatus(matchId, matchResult, reason);
      
      // 5. Notify all users in the room
      io.to(`match_${matchId}`).emit('match_ended', {
        matchId,
        result: matchResult,
        reason: reason,
        message: this.getMatchEndMessage(reason)
      });
      
      // 6. Clean up room
      this.rooms.delete(matchId);
      
      console.log(`✅ Match room ${matchId} closed successfully`);
      
    } catch (error) {
      console.error(`❌ Error closing match room ${matchId}:`, error);
    }
  }

  getMatchEndMessage(reason) {
    switch (reason) {
      case 'time_ended': return 'Match time ended'
      case 'user_quit': return 'Opponent quit the match'
      case 'user_doubled': return 'Opponent doubled their balance'
      case 'opponent_doubled': return 'You doubled your balance'
      case 'manual_end': return 'Match ended manually'
      default: return 'Match ended'
    }
  }

  async cancelMatchOrders(matchId) {
    try {
      console.log(`🚫 Cancelling all orders for match ${matchId}`);
      
      // First, get all pending orders to calculate total margin to return
      const pendingOrders = await Order.find({
        match: matchId,
        status: 'pending'
      });

      console.log(`📊 Found ${pendingOrders.length} pending orders to cancel`);

      // Calculate total margin to return for each user
      const marginReturns = {};
      for (const order of pendingOrders) {
        const marginRequired = (order.quantity * order.price) / order.leverage;
        if (!marginReturns[order.user]) {
          marginReturns[order.user] = 0;
        }
        marginReturns[order.user] += marginRequired;
        console.log(`💰 Order ${order._id}: Returning margin ${marginRequired} to user ${order.user}`);
      }

      // Return margin to users' global balance
      for (const [userId, totalMargin] of Object.entries(marginReturns)) {
        console.log(`💰 Returning total margin ${totalMargin} to user ${userId}`);
        await User.findByIdAndUpdate(userId, {
          $inc: { balance: totalMargin }
        });
        
        // Also return margin to match balance
        await Match.findByIdAndUpdate(matchId, {
          $inc: { 
            'players.$[elem].currentBalance': totalMargin
          }
        }, {
          arrayFilters: [{ 'elem.user': userId }]
        });

        // Notify about balance update
        await this.notifyBalanceUpdate(matchId, userId, 
          await this.getUpdatedMatchBalance(matchId, userId), 0);
      }

      // Now cancel the orders
      const cancelledOrders = await Order.updateMany({
        match: matchId,
        status: 'pending'
      }, {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: 'match_ended'
      });

      console.log(`✅ Cancelled ${cancelledOrders.modifiedCount} orders for match ${matchId}`);
    } catch (error) {
      console.error('❌ Error cancelling match orders:', error);
    }
  }

  // Helper function to get updated match balance
  async getUpdatedMatchBalance(matchId, userId) {
    try {
      const match = await Match.findById(matchId);
      const player = match.players.find(p => p.user.toString() === userId.toString());
      return player ? player.currentBalance : 0;
    } catch (error) {
      console.error('❌ Error getting updated match balance:', error);
      return 0;
    }
  }

  // Notify all users in a match about balance changes
  async notifyBalanceUpdate(matchId, userId, newBalance, realizedPnL = 0) {
    try {
      console.log(`📢 Notifying match ${matchId} about balance update for user ${userId}: ${newBalance}`);
      
      // Check if room exists
      const room = this.rooms.get(matchId);
      if (!room) {
        console.log(`⚠️ Room ${matchId} not found for balance update notification`);
        return;
      }
      
      console.log(`📊 Room ${matchId} has ${room.users.size} users`);
      
      // Emit to all users in the match room
      const notificationData = {
        matchId,
        userId,
        newBalance,
        realizedPnL,
        timestamp: new Date()
      };
      
      // Send test event first to verify connection
      io.to(`match_${matchId}`).emit('test_balance_update', { message: 'Test balance update', matchId });
      
      // Send actual balance update
      io.to(`match_${matchId}`).emit('balance_updated', notificationData);
      
      console.log(`✅ Balance update notification sent for match ${matchId} to room match_${matchId}`);
      console.log(`📊 Notification data:`, notificationData);
      
      // Also log all connected sockets in this room
      const roomSockets = await io.in(`match_${matchId}`).fetchSockets();
      console.log(`📊 Room ${matchId} has ${roomSockets.length} connected sockets`);
    } catch (error) {
      console.error('❌ Error notifying balance update:', error);
    }
  }

  async closeMatchPositions(matchId) {
    try {
      console.log(`🔄 Closing all positions for match ${matchId}`);
      
      const positions = await Position.find({
        match: matchId,
        status: 'open'
      });

      console.log(`📊 Found ${positions.length} open positions to close`);

      for (const position of positions) {
        console.log(`🔄 Processing position ${position._id} for user ${position.user}`);
        console.log(`📊 Position details:`, {
          symbol: position.symbol,
          side: position.side,
          size: position.size,
          entryPrice: position.entryPrice,
          margin: position.margin,
          status: position.status
        });
        
        // Get current market price for closing
        const currentPrice = await this.getCurrentMarketPrice(position.symbol);
        console.log(`💰 Current market price for ${position.symbol}: ${currentPrice}`);
        
        // Calculate realized PnL
        const realizedPnL = this.calculateRealizedPnL(position, currentPrice);
        console.log(`📈 Calculated realized PnL: ${realizedPnL}`);
        
        // Update position as closed
        await Position.findByIdAndUpdate(position._id, {
          status: 'closed',
          closedAt: new Date(),
          closePrice: currentPrice,
          realizedPnL: realizedPnL
        });

        // For match end, we need to return margin + PnL
        // The margin was deducted when position was opened, so we need to return it
        const totalReturn = position.margin + realizedPnL;
        console.log(`💰 Position ${position._id}: Margin=${position.margin}, PnL=${realizedPnL}, Total Return=${totalReturn}`);

        // Get current user balance before update
        const userBefore = await User.findById(position.user);
        console.log(`💰 User ${position.user} balance before: ${userBefore.balance}`);

        // Update user balance with total return (margin + PnL)
        await User.findByIdAndUpdate(position.user, {
          $inc: { balance: totalReturn }
        });

        // Get updated user balance
        const userAfter = await User.findById(position.user);
        console.log(`💰 User ${position.user} balance after: ${userAfter.balance} (added: ${totalReturn})`);

        // Update match balance with total return
        await Match.findByIdAndUpdate(matchId, {
          $inc: { 
            'players.$[elem].currentBalance': totalReturn,
            'players.$[elem].realizedPnL': realizedPnL 
          }
        }, {
          arrayFilters: [{ 'elem.user': position.user }]
        });

        // Get updated match data to get the new balance
        const updatedMatch = await Match.findById(matchId);
        const updatedPlayer = updatedMatch.players.find(p => p.user.toString() === position.user.toString());
        
        // Notify all users in the match about the balance update
        await this.notifyBalanceUpdate(matchId, position.user, updatedPlayer.currentBalance, realizedPnL);

        console.log(`💰 Position ${position._id} closed: Total Return = ${totalReturn}`);
      }

      console.log(`✅ Closed ${positions.length} positions for match ${matchId}`);
    } catch (error) {
      console.error('❌ Error closing match positions:', error);
    }
  }

  calculateRealizedPnL(position, closePrice) {
    if (position.side === 'long') {
      return (closePrice - position.entryPrice) * position.size;
    } else {
      return (position.entryPrice - closePrice) * position.size;
    }
  }

  async getCurrentMarketPrice(symbol) {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
      const data = await response.json();
      return parseFloat(data.price);
    } catch (error) {
      console.error(`❌ Error fetching price for ${symbol}:`, error);
      return 0;
    }
  }

  async determineMatchWinner(matchId, reason) {
    try {
      // Refresh match data to get latest realized PnL values
      const match = await Match.findById(matchId).populate('players.user');
      if (!match) return null;

      console.log(`🏁 Determining winner for match ${matchId}, reason: ${reason}`);
      console.log(`📊 Match data:`, {
        userBalance: match.players[0].currentBalance,
        opponentBalance: match.players[1].currentBalance,
        userRealizedPnL: match.players[0].realizedPnL,
        opponentRealizedPnL: match.players[1].realizedPnL
      });

      // For time-ended matches, compare realized PnL to determine winner
      // Use the first two players (no need to identify specific user/opponent for time-ended)
      const player1 = match.players[0];
      const player2 = match.players[1];

      if (!player1 || !player2) {
        console.error('❌ Could not find both players');
        return null;
      }

      const userBalance = player1.currentBalance;
      const opponentBalance = player2.currentBalance;

      let winner = null;
      let result = 'draw';

      // Handle different match end reasons
      switch (reason) {
        case 'user_quit':
          // User quit, opponent wins
          winner = player2.user._id;
          result = 'opponent_wins';
          break;
        case 'opponent_quit':
          // Opponent quit, user wins
          winner = player1.user._id;
          result = 'user_wins';
          break;
        case 'user_doubled':
          // User doubled balance, user wins
          winner = player1.user._id;
          result = 'user_wins';
          break;
        case 'opponent_doubled':
          // Opponent doubled balance, opponent wins
          winner = player2.user._id;
          result = 'opponent_wins';
          break;
        case 'time_ended':
          // For time ended, compare realized PnL (trading performance)
          const userRealizedPnL = player1.realizedPnL || 0;
          const opponentRealizedPnL = player2.realizedPnL || 0;
          
          console.log(`📊 Time ended - Comparing realized PnL:`);
          console.log(`Player1: ${userRealizedPnL}, Player2: ${opponentRealizedPnL}`);
          
          if (userRealizedPnL > opponentRealizedPnL) {
            winner = player1.user._id;
            result = 'user_wins';
          } else if (opponentRealizedPnL > userRealizedPnL) {
            winner = player2.user._id;
            result = 'opponent_wins';
          }
          // If equal, result remains 'draw'
          break;
        case 'manual_end':
        default:
          // For manual end, compare absolute balances (as before)
          if (userBalance > opponentBalance) {
            winner = userPlayer.user._id;
            result = 'user_wins';
          } else if (opponentBalance > userBalance) {
            winner = opponentPlayer.user._id;
            result = 'opponent_wins';
          }
          break;
      }

      return {
        winner,
        result,
        userBalance,
        opponentBalance,
        userRealizedPnL: player1.realizedPnL || 0,
        opponentRealizedPnL: player2.realizedPnL || 0,
        userTrades: player1.trades?.length || 0,
        opponentTrades: player2.trades?.length || 0,
        reason,
        // Add user identification for frontend
        userId: player1.user._id,
        opponentId: player2.user._id
      };
    } catch (error) {
      console.error('❌ Error determining match winner:', error);
      return null;
    }
  }

  async updateMatchStatus(matchId, matchResult) {
    try {
      await Match.findByIdAndUpdate(matchId, {
        status: 'completed',
        winner: matchResult.winner,
        endTime: new Date()
      });

      // Update user stats
      if (matchResult.winner) {
        await User.findByIdAndUpdate(matchResult.winner, {
          $inc: { 'stats.wins': 1, 'stats.currentStreak': 1 }
        });
        
        // Update loser stats
        const match = await Match.findById(matchId);
        const loser = match.players.find(p => p.user.toString() !== matchResult.winner.toString());
        if (loser) {
          await User.findByIdAndUpdate(loser.user, {
            $inc: { 'stats.losses': 1 },
            $set: { 'stats.currentStreak': 0 }
          });
        }
      }

      console.log(`✅ Match ${matchId} status updated`);
    } catch (error) {
      console.error('❌ Error updating match status:', error);
    }
  }
}

// Initialize Match Room Manager
const roomManager = new MatchRoomManager();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected to match service: ${socket.id}`);

  socket.on('join_match', (data) => {
    try {
      const { matchId, userId } = data;
      console.log(`👤 User ${userId} joining match ${matchId}`);
      
      // Add user to room
      const success = roomManager.addUserToRoom(matchId, userId, socket);
      
      if (success) {
        socket.emit('joined_match', { matchId, userId });
      } else {
        socket.emit('join_error', { message: 'Match room not found' });
      }
    } catch (error) {
      console.error('❌ Error in join_match:', error);
      socket.emit('join_error', { message: 'Failed to join match' });
    }
  });

  socket.on('leave_match', (data) => {
    try {
      const { matchId, userId } = data;
      console.log(`👤 User ${userId} leaving match ${matchId}`);
      
      roomManager.removeUserFromRoom(matchId, userId, socket);
    } catch (error) {
      console.error('❌ Error in leave_match:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected from match service: ${socket.id}`);
  });
});

// API endpoint to create match room
app.post('/create-room', async (req, res) => {
  try {
    const { matchId, matchData } = req.body;
    
    console.log(`🏠 Creating match room for ${matchId}`);
    roomManager.createRoom(matchId, matchData);
    
    res.json({ success: true, message: 'Match room created' });
  } catch (error) {
    console.error('❌ Error creating match room:', error);
    res.status(500).json({ success: false, message: 'Error creating match room' });
  }
});

// API endpoint to notify balance updates
app.post('/notify-balance-update', async (req, res) => {
  try {
    const { matchId, userId, newBalance, realizedPnL } = req.body;
    
    console.log(`📢 Received balance update notification for match ${matchId}, user ${userId}: ${newBalance}`);
    console.log(`📊 Request body:`, req.body);
    
    // Notify all users in the match about the balance update
    await roomManager.notifyBalanceUpdate(matchId, userId, newBalance, realizedPnL);
    
    console.log(`✅ Balance update notification processed for match ${matchId}`);
    res.json({ success: true, message: 'Balance update notification sent' });
  } catch (error) {
    console.error('❌ Error handling balance update notification:', error);
    res.status(500).json({ success: false, message: 'Error sending balance update notification' });
  }
});

// API endpoint to end match with specific reason
app.post('/end-match', async (req, res) => {
  try {
    const { matchId, reason, userId } = req.body;
    
    console.log(`🏁 Ending match ${matchId} - Reason: ${reason}, User: ${userId}`);
    
    // Determine the correct reason based on who's ending the match
    let endReason = reason;
    if (reason === 'quit') {
      // Need to determine if it's user_quit or opponent_quit
      const match = await Match.findById(matchId);
      if (match) {
        const isUser = match.players.some(p => p.user.toString() === userId);
        endReason = isUser ? 'user_quit' : 'opponent_quit';
      }
    }
    
    await roomManager.closeRoom(matchId, endReason);
    
    res.json({ success: true, message: 'Match ended successfully' });
  } catch (error) {
    console.error('❌ Error ending match:', error);
    res.status(500).json({ success: false, message: 'Error ending match' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    activeRooms: roomManager.rooms.size,
    rooms: Array.from(roomManager.rooms.keys())
  });
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`🚀 Match Connection Service running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for match connections`);
});
