require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('../backend/db'); // Use shared mongoose instance
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  },

  
});

app.use(cors());
app.use(express.json());

// Connect to MongoDB FIRST
mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/paper-trading-battle', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferCommands: false, // Disable mongoose buffering
});

mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Disconnected from MongoDB');
});

// Import models AFTER connecting to MongoDB
const Order = require('../backend/models/Order');
const Position = require('../backend/models/Position');
const User = require('../backend/models/User');

// WebSocket Manager for Binance connections
class WebSocketManager {
  constructor() {
    this.connections = new Map(); // ticker -> WebSocket
    this.subscribers = new Map(); // ticker -> Set of user IDs
    this.priceData = new Map(); // ticker -> latest price
  }

  subscribe(ticker, userId) {
    console.log(`📡 Subscribing user ${userId} to ${ticker}`);
    
    if (!this.subscribers.has(ticker)) {
      this.subscribers.set(ticker, new Set());
    }
    this.subscribers.get(ticker).add(userId);

    // Only connect if we don't have an active connection
    if (!this.connections.has(ticker)) {
      this.connectToBinance(ticker);
    }
  }

  unsubscribe(ticker, userId) {
    console.log(`📡 Unsubscribing user ${userId} from ${ticker}`);
    
    if (this.subscribers.has(ticker)) {
      this.subscribers.get(ticker).delete(userId);
      
      // Only disconnect if no more subscribers
      if (this.subscribers.get(ticker).size === 0) {
        console.log(`🔌 No more subscribers for ${ticker}, disconnecting...`);
        this.disconnectFromBinance(ticker);
      }
    }
  }

  connectToBinance(ticker) {
    console.log(`🔗 Connecting to Binance WebSocket for ${ticker}`);
    
    const wsUrl = `wss://stream.binance.com:9443/ws/${ticker.toLowerCase()}@ticker`;
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      console.log(`✅ Connected to Binance WebSocket for ${ticker}`);
      this.connections.set(ticker, ws);
    });

    ws.on('message', (data) => {
      try {
        const tickerData = JSON.parse(data);
        const price = parseFloat(tickerData.c); // Current price
        
        this.priceData.set(ticker, price);
        
        // Process orders for this ticker
        this.processOrdersForTicker(ticker, price);
        
        // Update positions with new mark price
        this.updatePositionsWithMarkPrice(ticker, price);
        
        // Notify subscribers
        this.notifySubscribers(ticker, price);
      } catch (error) {
        console.error(`❌ Error processing Binance data for ${ticker}:`, error);
      }
    });

    ws.on('close', () => {
      console.log(`🔌 Binance WebSocket closed for ${ticker}, reconnecting...`);
      this.connections.delete(ticker);
      setTimeout(() => this.connectToBinance(ticker), 5000);
    });

    ws.on('error', (error) => {
      console.error(`❌ Binance WebSocket error for ${ticker}:`, error);
    });
  }

  disconnectFromBinance(ticker) {
    console.log(`🔌 Disconnecting from Binance WebSocket for ${ticker}`);
    
    if (this.connections.has(ticker)) {
      this.connections.get(ticker).close();
      this.connections.delete(ticker);
    }
    this.subscribers.delete(ticker);
    this.priceData.delete(ticker);
  }

  async processOrdersForTicker(ticker, currentPrice) {
    try {
      // Check if MongoDB is connected
      if (mongoose.connection.readyState !== 1) {
        console.log(`⏳ MongoDB not connected, skipping order processing for ${ticker}`);
        return;
      }

      // Get all pending orders for this ticker (exclude executing to prevent duplicates)
      const pendingOrders = await Order.find({
        symbol: ticker,
        status: { $in: ['pending'] },
        type: { $in: ['limit', 'stop_market'] }
      }).lean();

      // Processing orders for ticker at current price

      for (const order of pendingOrders) {
        if (this.shouldExecuteOrder(order, currentPrice)) {
          console.log(`🎯 Executing order ${order._id} at price ${currentPrice}`);
          
          // Mark order as executing to prevent duplicate execution
          await Order.findByIdAndUpdate(order._id, { status: 'executing' });
          
          await this.executeOrder(order, currentPrice);
        }
      }

      // Update PnL for all open positions of this ticker
      await this.updatePositionsPnL(ticker, currentPrice);
    } catch (error) {
      console.error(`❌ Error processing orders for ${ticker}:`, error);
    }
  }

  shouldExecuteOrder(order, currentPrice) {
    const marketPriceAtPlacement = order.marketPriceAtPlacement || 0;
    const limitPrice = order.price;

    console.log(`🔍 Checking order ${order._id}:`, {
      side: order.side,
      type: order.type,
      limitPrice,
      marketPriceAtPlacement,
      currentPrice,
      condition: marketPriceAtPlacement < limitPrice ? 'breakout' : 'pullback'
    });

    // BUY ORDERS
    if (order.side === 'buy') {
      if (order.type === 'limit') {
        if (marketPriceAtPlacement < limitPrice) {
          // Breakout: Execute when current price >= limit price
          const shouldExecute = currentPrice >= limitPrice;
          // BUY breakout logic
          return shouldExecute;
        } else {
          // Pullback: Execute when current price <= limit price
          const shouldExecute = currentPrice <= limitPrice;
          // BUY pullback logic
          return shouldExecute;
        }
      } else if (order.type === 'stop_market') {
        // Stop market: Execute when current price >= stop price (breakout)
        const shouldExecute = currentPrice >= limitPrice;
        // BUY stop logic
        return shouldExecute;
      }
    }
    // SELL ORDERS
    else if (order.side === 'sell') {
      if (order.type === 'limit') {
        if (marketPriceAtPlacement > limitPrice) {
          // Pullback: Execute when current price <= limit price
          const shouldExecute = currentPrice <= limitPrice;
          // SELL pullback logic
          return shouldExecute;
        } else {
          // Breakout: Execute when current price >= limit price
          const shouldExecute = currentPrice >= limitPrice;
          // SELL breakout logic
          return shouldExecute;
        }
      } else if (order.type === 'stop_market') {
        // Stop market: Execute when current price <= stop price (breakdown)
        const shouldExecute = currentPrice <= limitPrice;
        // SELL stop logic
        return shouldExecute;
      }
    }

    return false;
  }

  async executeOrder(order, executionPrice) {
    try {
      // Check if MongoDB is connected
      if (mongoose.connection.readyState !== 1) {
        console.log(`⏳ MongoDB not connected, skipping order execution for ${order._id}`);
        return;
      }

      console.log(`🎯 Executing order ${order._id}: ${order.side} ${order.quantity} ${order.symbol} at ${executionPrice}`);

      // Double-check order is still executing to prevent duplicate execution
      const currentOrder = await Order.findById(order._id);
      if (!currentOrder || currentOrder.status !== 'executing') {
        console.log(`⚠️ Order ${order._id} already processed or not in executing state`);
        return;
      }

      // Update order status atomically
      const updatedOrder = await Order.findByIdAndUpdate(order._id, {
        status: 'filled',
        filledAt: new Date(),
        filledPrice: executionPrice,
        filledQuantity: order.quantity
      }, { new: true });

      if (!updatedOrder) {
        console.log(`⚠️ Order ${order._id} not found during execution`);
        return;
      }

      // Check if this is a TP/SL order that should close a position
      if (order.reduceOnly) {
        console.log(`🔄 Processing TP/SL order for position closure`);
        await this.closePosition(order, executionPrice);
      } else {
        // Create or update position for regular orders
        await this.createOrUpdatePosition(order, executionPrice, order.quantity);

        // Create TP/SL orders if specified
        if (order.takeProfitPrice || order.stopLossPrice) {
          await this.createTPSLOrders(order, executionPrice, order.quantity);
        }
      }

      // Notify user about execution
      this.notifyUserExecution(order.user, {
        type: 'ORDER_EXECUTED',
        orderId: order._id,
        symbol: order.symbol,
        side: order.side,
        executionPrice,
        quantity: order.quantity,
        isTPSL: order.reduceOnly || false
      });

      console.log(`✅ Order ${order._id} executed successfully`);
    } catch (error) {
      console.error(`❌ Error executing order ${order._id}:`, error);
    }
  }

  async createOrUpdatePosition(order, executionPrice, executionQuantity) {
    try {
      console.log(`📊 Creating/updating position for ${order.symbol}: ${order.side} ${executionQuantity} @ ${executionPrice}`);
      
      const existingPosition = await Position.findOne({
        user: order.user,
        match: order.match,
        symbol: order.symbol,
        side: order.side === 'buy' ? 'long' : 'short',
        status: 'open'
      });

      if (existingPosition) {
        // Update existing position
        const totalSize = existingPosition.size + executionQuantity;
        const totalValue = (existingPosition.size * existingPosition.entryPrice) + (executionQuantity * executionPrice);
        const avgPrice = totalValue / totalSize;
        
        // Calculate unrealized PnL
        const unrealizedPnL = this.calculateUnrealizedPnL(existingPosition.side, avgPrice, executionPrice, totalSize);
        const roi = (unrealizedPnL / (totalValue / order.leverage)) * 100;
        const marginRatio = (Math.abs(unrealizedPnL) / (totalValue / order.leverage)) * 100;

        const updatedPosition = await Position.findByIdAndUpdate(existingPosition._id, {
          size: totalSize,
          entryPrice: avgPrice,
          markPrice: executionPrice,
          margin: totalValue / order.leverage,
          unrealizedPnL: unrealizedPnL,
          roi: roi,
          marginRatio: marginRatio
        }, { new: true });

        console.log(`📊 Updated existing position for ${order.symbol}: PnL=${unrealizedPnL}, ROI=${roi}%`);

        // Notify frontend about position update
        io.to(`user_${order.user}`).emit('position_updated', {
          positionId: existingPosition._id,
          updates: {
            size: totalSize,
            entryPrice: avgPrice,
            markPrice: executionPrice,
            margin: totalValue / order.leverage,
            unrealizedPnL: unrealizedPnL,
            roi: roi,
            marginRatio: marginRatio
          }
        });
      } else {
        // Create new position
        const unrealizedPnL = 0; // New position has no PnL initially
        const roi = 0;
        const marginRatio = 0;
        
        const newPosition = new Position({
          user: order.user,
          match: order.match,
          symbol: order.symbol,
          side: order.side === 'buy' ? 'long' : 'short',
          size: executionQuantity,
          entryPrice: executionPrice,
          markPrice: executionPrice,
          marginMode: order.marginMode,
          leverage: order.leverage,
          margin: (executionQuantity * executionPrice) / order.leverage,
          status: 'open',
          unrealizedPnL: unrealizedPnL,
          roi: roi,
          marginRatio: marginRatio,
          liquidationPrice: this.calculateLiquidationPrice(order.side === 'buy' ? 'long' : 'short', executionPrice, order.leverage, order.marginMode)
        });

        const savedPosition = await newPosition.save();
        console.log(`📊 Created new position ${savedPosition._id} for ${order.symbol}`);
        
        // Notify frontend about new position
        io.to(`user_${order.user}`).emit('position_created', {
          positionId: savedPosition._id,
          symbol: order.symbol,
          side: savedPosition.side,
          size: executionQuantity,
          entryPrice: executionPrice
        });
      }
    } catch (error) {
      console.error('❌ Error creating/updating position:', error);
    }
  }

  calculateUnrealizedPnL(side, entryPrice, markPrice, size) {
    if (side === 'long') {
      return (markPrice - entryPrice) * size;
    } else {
      return (entryPrice - markPrice) * size;
    }
  }

  async updatePositionsPnL(ticker, currentPrice) {
    try {
      // Get all open positions for this ticker
      const positions = await Position.find({
        symbol: ticker,
        status: 'open'
      });

      for (const position of positions) {
        // Calculate new PnL
        const unrealizedPnL = this.calculateUnrealizedPnL(position.side, position.entryPrice, currentPrice, position.size);
        const roi = (unrealizedPnL / position.margin) * 100;
        const marginRatio = (Math.abs(unrealizedPnL) / position.margin) * 100;

        // Update position
        await Position.findByIdAndUpdate(position._id, {
          markPrice: currentPrice,
          unrealizedPnL: unrealizedPnL,
          roi: roi,
          marginRatio: marginRatio
        });

        // Notify frontend about position update
        io.to(`user_${position.user}`).emit('position_updated', {
          positionId: position._id,
          updates: {
            markPrice: currentPrice,
            unrealizedPnL: unrealizedPnL,
            roi: roi,
            marginRatio: marginRatio
          }
        });
      }
    } catch (error) {
      console.error(`❌ Error updating positions PnL for ${ticker}:`, error);
    }
  }

  calculateLiquidationPrice(side, entryPrice, leverage, marginMode) {
    if (marginMode === 'cross') {
      // Cross margin liquidation - simplified calculation
      // In reality, this depends on total portfolio value
      return side === 'long' ? entryPrice * 0.5 : entryPrice * 1.5;
    } else {
      // Isolated margin liquidation - proper formula
      if (side === 'long') {
        // Long liquidation: entryPrice * (1 - 1/leverage)
        return entryPrice * (1 - (1 / leverage));
      } else {
        // Short liquidation: entryPrice * (1 + 1/leverage)
        return entryPrice * (1 + (1 / leverage));
      }
    }
  }

  async createTPSLOrders(order, executionPrice, executionQuantity) {
    try {
      const tpSlOrders = [];
      
      if (order.takeProfitPrice) {
        const tpOrder = new Order({
          user: order.user,
          match: order.match,
          symbol: order.symbol,
          side: order.side === 'buy' ? 'sell' : 'buy',
          type: 'limit',
          quantity: executionQuantity,
          price: order.takeProfitPrice,
          marginMode: order.marginMode,
          leverage: order.leverage,
          status: 'pending',
          timeInForce: 'GTC',
          reduceOnly: true,
          parentOrder: order._id, // Link to parent order
          orderType: 'take_profit'
        });
        await tpOrder.save();
        tpSlOrders.push(tpOrder._id);
        console.log(`📈 Created TP order ${tpOrder._id} for ${order.symbol}`);
      }

      if (order.stopLossPrice) {
        const slOrder = new Order({
          user: order.user,
          match: order.match,
          symbol: order.symbol,
          side: order.side === 'buy' ? 'sell' : 'buy',
          type: 'stop_market',
          quantity: executionQuantity,
          price: order.stopLossPrice,
          marginMode: order.marginMode,
          leverage: order.leverage,
          status: 'pending',
          timeInForce: 'GTC',
          reduceOnly: true,
          parentOrder: order._id, // Link to parent order
          orderType: 'stop_loss'
        });
        await slOrder.save();
        tpSlOrders.push(slOrder._id);
        console.log(`📉 Created SL order ${slOrder._id} for ${order.symbol}`);
      }

      // Update parent order with TP/SL order references
      if (tpSlOrders.length > 0) {
        await Order.findByIdAndUpdate(order._id, {
          tpSlOrders: tpSlOrders
        });
        console.log(`🔗 Linked ${tpSlOrders.length} TP/SL orders to parent order ${order._id}`);
      }
    } catch (error) {
      console.error('❌ Error creating TP/SL orders:', error);
    }
  }

  async closePosition(order, executionPrice) {
    try {
      console.log(`🔄 Closing position for ${order.symbol} at ${executionPrice}`);
      
      // Find the position to close
      const position = await Position.findOne({
        user: order.user,
        match: order.match,
        symbol: order.symbol,
        status: 'open'
      });

      if (!position) {
        console.log(`⚠️ No open position found for ${order.symbol}`);
        return;
      }

      // Calculate PnL
      const pnl = this.calculatePnL(position, executionPrice, order.quantity);
      
      // Update position as closed
      await Position.findByIdAndUpdate(position._id, {
        status: 'closed',
        closedAt: new Date(),
        closePrice: executionPrice,
        pnl: pnl,
        realizedPnL: pnl
      });

      // Cancel any remaining TP/SL orders for this position
      await this.cancelRemainingTPSLOrders(order.user, order.match, order.symbol);

      // Calculate total return (margin + PnL)
      const totalReturn = position.margin + pnl;
      console.log(`💰 Position close via TP/SL: Margin=${position.margin}, PnL=${pnl}, Total Return=${totalReturn}`);
      
      // Update user balance with total return (margin + PnL)
      await this.updateUserBalance(order.user, totalReturn, order.match);

      // Update match's realizedPnL tracking for this player
      await Match.findByIdAndUpdate(order.match, {
        $inc: { 
          'players.$[elem].realizedPnL': pnl 
        }
      }, {
        arrayFilters: [{ 'elem.user': order.user }]
      });

      // Add trade to match's trades array for this player
      await Match.findByIdAndUpdate(order.match, {
        $push: {
          'players.$[elem].trades': {
            symbol: order.symbol,
            type: order.side === 'long' ? 'sell' : 'buy', // Opposite side to close position
            quantity: order.quantity,
            price: executionPrice,
            timestamp: new Date(),
            pnl: pnl,
            positionId: position._id
          }
        }
      }, {
        arrayFilters: [{ 'elem.user': order.user }]
      });

      console.log(`📊 Added trade to match trades array: ${order.symbol} ${order.side === 'long' ? 'sell' : 'buy'} ${order.quantity} @ ${executionPrice}`);


      console.log(`✅ Position closed: PnL = ${pnl}`);
      
      // Notify user about position closure
      this.notifyUserExecution(order.user, {
        type: 'POSITION_CLOSED',
        positionId: position._id,
        symbol: order.symbol,
        pnl: pnl,
        closePrice: executionPrice
      });

      // Also emit position_closed event for frontend
      io.to(`user_${order.user}`).emit('position_closed', {
        positionId: position._id,
        symbol: order.symbol,
        pnl: pnl,
        closePrice: executionPrice
      });

    } catch (error) {
      console.error('❌ Error closing position:', error);
    }
  }

  calculatePnL(position, closePrice, quantity) {
    const entryPrice = position.entryPrice;
    const size = Math.min(position.size, quantity);
    
    if (position.side === 'long') {
      return (closePrice - entryPrice) * size;
    } else {
      return (entryPrice - closePrice) * size;
    }
  }

  async cancelRemainingTPSLOrders(userId, matchId, symbol) {
    try {
      // Cancel all pending TP/SL orders for this symbol
      const cancelledOrders = await Order.updateMany({
        user: userId,
        match: matchId,
        symbol: symbol,
        status: 'pending',
        reduceOnly: true
      }, {
        status: 'cancelled',
        cancelledAt: new Date()
      });

      console.log(`🚫 Cancelled ${cancelledOrders.modifiedCount} remaining TP/SL orders for ${symbol}`);
      
      // Check if we should cleanup connections for this symbol
      await this.checkAndCleanupSymbol(symbol);
    } catch (error) {
      console.error('❌ Error cancelling TP/SL orders:', error);
    }
  }

  async checkAndCleanupSymbol(symbol) {
    try {
      // Check if there are any pending orders for this symbol
      const pendingOrders = await Order.countDocuments({
        symbol: symbol,
        status: 'pending'
      });
      
      if (pendingOrders === 0) {
        console.log(`🧹 No pending orders for ${symbol}, cleaning up connection...`);
        this.disconnectFromBinance(symbol);
      }
    } catch (error) {
      console.error(`❌ Error checking orders for ${symbol}:`, error);
    }
  }

  async updateUserBalance(userId, pnl, matchId) {
    try {
      const User = require('../backend/models/User');
      const Match = require('../backend/models/Match');
      
      // Update global user balance
      await User.findByIdAndUpdate(userId, {
        $inc: { balance: pnl }
      });
      
      // Update match balance for this player
      if (matchId) {
        await Match.findByIdAndUpdate(matchId, {
          $inc: {
            'players.$[elem].currentBalance': pnl
          }
        }, {
          arrayFilters: [{ 'elem.user': userId }]
        });
      }
      
      console.log(`💰 Updated user balance and match balance: +${pnl}`);
    } catch (error) {
      console.error('❌ Error updating user balance:', error);
    }
  }

  async updatePositionsWithMarkPrice(ticker, markPrice) {
    try {
      // Check if MongoDB is connected
      if (mongoose.connection.readyState !== 1) {
        return;
      }

      // Find all open positions for this ticker
      const positions = await Position.find({
        symbol: ticker,
        status: 'open'
      });

      for (const position of positions) {
        // Calculate unrealized PnL
        const unrealizedPnL = this.calculateUnrealizedPnL(position.side, position.entryPrice, markPrice, position.size);
        
        // Calculate ROI
        const roi = (unrealizedPnL / position.margin) * 100;
        
        // Calculate margin ratio
        const marginRatio = (Math.abs(unrealizedPnL) / position.margin) * 100;
        
        // Calculate liquidation price
        const liquidationPrice = this.calculateLiquidationPrice(
          position.side, 
          position.entryPrice, 
          position.leverage, 
          position.marginMode
        );

        // Update position
        await Position.findByIdAndUpdate(position._id, {
          markPrice: markPrice,
          unrealizedPnL: unrealizedPnL,
          roi: roi,
          marginRatio: marginRatio,
          liquidationPrice: liquidationPrice
        });

        // Notify user about position update
        io.to(`user_${position.user}`).emit('position_updated', {
          positionId: position._id,
          symbol: ticker,
          markPrice: markPrice,
          unrealizedPnL: unrealizedPnL,
          roi: roi,
          marginRatio: marginRatio
        });
      }
    } catch (error) {
      console.error(`❌ Error updating positions for ${ticker}:`, error);
    }
  }

  notifySubscribers(ticker, price) {
    if (this.subscribers.has(ticker)) {
      this.subscribers.get(ticker).forEach(userId => {
        io.to(`user_${userId}`).emit('price_update', {
          symbol: ticker,
          price,
          timestamp: Date.now()
        });
      });
    }
  }

  notifyUserExecution(userId, data) {
    io.to(`user_${userId}`).emit('order_executed', data);
  }

  async stopProcessingForMatch(matchId) {
    try {
      console.log(`🛑 Stopping order processing for match ${matchId}`);
      
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
      
      // Notify all users in this match about order cancellations
      const matchOrders = await Order.find({ match: matchId }).distinct('user');
      matchOrders.forEach(userId => {
        io.to(`user_${userId}`).emit('orders_cancelled', {
          matchId: matchId,
          reason: 'match_ended',
          count: cancelledOrders.modifiedCount
        });
      });

      // Clean up unused WebSocket connections
      this.cleanupUnusedConnections();
      
    } catch (error) {
      console.error('❌ Error stopping processing for match:', error);
    }
  }

  async cleanupUnusedConnections() {
    console.log(`🧹 Cleaning up unused WebSocket connections...`);
    
    // Check each connection and disconnect if no subscribers
    for (const [ticker, subscribers] of this.subscribers.entries()) {
      if (subscribers.size === 0) {
        console.log(`🔌 No subscribers for ${ticker}, disconnecting...`);
        this.disconnectFromBinance(ticker);
      }
    }
    
    // Check for tickers with no pending orders and disconnect
    for (const [ticker, connection] of this.connections.entries()) {
      try {
        const pendingOrders = await Order.countDocuments({
          symbol: ticker,
          status: 'pending'
        });
        
        if (pendingOrders === 0) {
          console.log(`🔌 No pending orders for ${ticker}, disconnecting...`);
          this.disconnectFromBinance(ticker);
        }
      } catch (error) {
        console.error(`❌ Error checking orders for ${ticker}:`, error);
      }
    }
    
    console.log(`✅ Cleanup completed. Active connections: ${this.connections.size}`);
  }
}

// Initialize WebSocket Manager
const wsManager = new WebSocketManager();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on('subscribe_orders', (data) => {
    try {
      const { userId, matchId } = data;
      console.log(`📡 User ${userId} subscribing to orders for match ${matchId}`);
      
      socket.join(`user_${userId}`);
      
      // Subscribe to all tickers for this user's orders
      subscribeToUserOrders(userId, matchId);
    } catch (error) {
      console.error('❌ Error in subscribe_orders:', error);
      socket.emit('error', { message: 'Failed to subscribe to orders' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });
});

// Subscribe to user's orders
async function subscribeToUserOrders(userId, matchId) {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log(`⏳ MongoDB not connected, skipping order subscription for user ${userId}`);
      return;
    }

    const orders = await Order.find({
      user: userId,
      match: matchId,
      status: 'pending'
    }).distinct('symbol');

    orders.forEach(symbol => {
      wsManager.subscribe(symbol, userId);
    });

    console.log(`📡 Subscribed to ${orders.length} symbols for user ${userId}`);
  } catch (error) {
    console.error('❌ Error subscribing to user orders:', error);
  }
}

// API endpoint to notify execution service of new orders
app.post('/notify-new-order', async (req, res) => {
  try {
    const { userId, matchId, symbol } = req.body;
    
    console.log(`📨 New order notification: User ${userId}, Match ${matchId}, Symbol ${symbol}`);
    
    // Subscribe to this symbol if not already subscribed
    wsManager.subscribe(symbol, userId);
    
    res.json({ success: true, message: 'Order notification received' });
  } catch (error) {
    console.error('❌ Error processing new order notification:', error);
    res.status(500).json({ success: false, message: 'Error processing notification' });
  }
});

// API endpoint to notify execution service of match end
app.post('/notify-match-ended', async (req, res) => {
  try {
    const { matchId } = req.body;
    
    console.log(`🏁 Match ended notification: Match ${matchId}`);
    
    // Stop processing orders for this match
    await wsManager.stopProcessingForMatch(matchId);
    
    res.json({ success: true, message: 'Match end notification received' });
  } catch (error) {
    console.error('❌ Error processing match end notification:', error);
    res.status(500).json({ success: false, message: 'Error processing notification' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    connections: wsManager.connections.size,
    subscribers: Array.from(wsManager.subscribers.keys())
  });
});

// Check cleanup endpoint
app.post('/check-cleanup', async (req, res) => {
  try {
    const { symbol } = req.body;
    
    if (symbol) {
      await wsManager.checkAndCleanupSymbol(symbol);
    } else {
      await wsManager.cleanupUnusedConnections();
    }
    
    res.json({ success: true, message: 'Cleanup completed' });
  } catch (error) {
    console.error('❌ Error in cleanup:', error);
    res.status(500).json({ success: false, message: 'Cleanup failed' });
  }
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Order Execution Service running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
});
