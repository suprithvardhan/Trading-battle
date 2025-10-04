const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Position = require('../models/Position');
const User = require('../models/User');
const Match = require('../models/Match');
const auth = require('../middleware/auth');

// Function to get current market price
const getCurrentPrice = async (symbol) => {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`)
    const data = await response.json()
    return parseFloat(data.price)
  } catch (error) {
    console.error('Error fetching current price:', error)
    return 0
  }
}

// Create new order
router.post('/', auth, async (req, res) => {
  try {
    console.log('📊 Received order request:', req.body);
    console.log('📊 Request headers:', req.headers);
    console.log('📊 Content-Type:', req.get('Content-Type'));
    console.log('📊 Body type:', typeof req.body);
    console.log('📊 Body keys:', Object.keys(req.body || {}));
    
    const {
      matchId,
      symbol,
      side,
      type,
      quantity,
      price,
      stopPrice,
      marginMode,
      leverage,
      takeProfitPrice,
      stopLossPrice,
      timeInForce,
      reduceOnly
    } = req.body;

    console.log('🔍 Extracted fields:', {
      matchId,
      symbol,
      side,
      type,
      quantity,
      price,
      leverage
    });

    // Validate required fields
    if (!matchId || !symbol || !side || !type || !quantity || !price || !leverage) {
      console.log('❌ Missing required fields:', {
        matchId: !!matchId,
        symbol: !!symbol,
        side: !!side,
        type: !!type,
        quantity: !!quantity,
        price: !!price,
        leverage: !!leverage
      });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get current market price for the symbol
    const currentPrice = await getCurrentPrice(symbol)
    
    // For market orders, use current price
    const orderPrice = type === 'market' ? currentPrice : parseFloat(price)
    
    // Create order
    const orderData = {
      user: req.userId,
      match: mongoose.isValidObjectId(matchId) ? new mongoose.Types.ObjectId(matchId) : matchId,
      symbol,
      side,
      type,
      quantity: parseFloat(quantity),
      price: orderPrice,
      stopPrice: stopPrice ? parseFloat(stopPrice) : undefined,
      marginMode: marginMode || 'cross',
      leverage: parseInt(leverage),
      takeProfitPrice: takeProfitPrice ? parseFloat(takeProfitPrice) : undefined,
      stopLossPrice: stopLossPrice ? parseFloat(stopLossPrice) : undefined,
      timeInForce: timeInForce || 'GTC',
      reduceOnly: reduceOnly || false,
      // Store the market price when order was placed
      marketPriceAtPlacement: currentPrice
    };
    
    console.log('📊 Creating order with data:', orderData);
    
    const order = new Order(orderData);

    console.log('📊 Saving order...');
    await order.save();
    console.log('✅ Order saved successfully:', order._id);

    // Deduct margin from user balance AND match balance
    const marginRequired = (parseFloat(quantity) * orderPrice) / parseInt(leverage);
    console.log(`💰 Deducting margin: ${marginRequired} USDT from user balance and match balance`);
    
    // Update global user balance
    await User.findByIdAndUpdate(req.userId, {
      $inc: { balance: -marginRequired }
    });
    
    // Update match balance for this player
    await Match.findByIdAndUpdate(matchId, {
      $inc: {
        'players.$[elem].currentBalance': -marginRequired
      }
    }, {
      arrayFilters: [{ 'elem.user': req.userId }]
    });
    
    console.log(`✅ User balance and match balance updated: -${marginRequired} USDT`);

    // If market order, execute immediately
    if (type === 'market') {
      console.log('📊 Executing market order...');
      await executeOrder(order);
    } else {
      // Notify execution service of new order
      try {
        await fetch('http://localhost:5001/notify-new-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: req.userId,
            matchId: matchId,
            symbol: symbol
          })
        });
        console.log('📨 Notified execution service of new order');
      } catch (error) {
        console.error('❌ Error notifying execution service:', error);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
});

// Get user's orders
router.get('/:matchId', auth, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { status } = req.query;
    
    const orders = await Order.getUserOrders(req.userId, mongoose.isValidObjectId(matchId) ? new mongoose.Types.ObjectId(matchId) : matchId, status);
    
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
});

// Cancel order
router.put('/:orderId/cancel', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    console.log(`🚫 Cancelling order ${orderId} for user ${userId}`);
    
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      status: 'pending'
    });

    if (!order) {
      console.log(`❌ Order ${orderId} not found or cannot be cancelled`);
      return res.status(404).json({
        success: false,
        message: 'Order not found or cannot be cancelled'
      });
    }

    // Update order status directly
    await Order.findByIdAndUpdate(orderId, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: 'user_cancelled',
      updatedAt: new Date()
    });

    // Notify order execution service to cleanup connections if needed
    try {
      await fetch('http://localhost:5001/check-cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: order.symbol })
      });
    } catch (error) {
      console.error('❌ Error notifying execution service:', error);
    }

    console.log(`✅ Order ${orderId} cancelled successfully`);

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order: {
        _id: orderId,
        status: 'cancelled',
        cancelledAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
});

// Update order TP/SL
router.put('/:orderId/tpsl', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { takeProfitPrice, stopLossPrice } = req.body;
    
    const order = await Order.findOne({
      _id: orderId,
      user: req.userId,
      status: 'pending'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (takeProfitPrice) order.takeProfitPrice = parseFloat(takeProfitPrice);
    if (stopLossPrice) order.stopLossPrice = parseFloat(stopLossPrice);

    await order.save();

    res.json({
      success: true,
      message: 'Order TP/SL updated successfully',
      order
    });
  } catch (error) {
    console.error('Error updating order TP/SL:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order TP/SL',
      error: error.message
    });
  }
});

// Execute order function
async function executeOrder(order) {
  try {
    // Get current market price (in real implementation, this would come from WebSocket)
    const executionPrice = order.price; // For market orders, use current price
    const executionQuantity = order.quantity;

    // Execute the order
    await order.execute(executionPrice, executionQuantity);

    // Create or update position
    await createOrUpdatePosition(order, executionPrice, executionQuantity);

    // Check for TP/SL orders
    if (order.takeProfitPrice || order.stopLossPrice) {
      await createTPSLOrders(order);
    }

    return order;
  } catch (error) {
    console.error('Error executing order:', error);
    await order.reject();
    throw error;
  }
}

// Create or update position
async function createOrUpdatePosition(order, executionPrice, executionQuantity) {
  try {
    const existingPosition = await Position.findOne({
      user: order.user,
      match: mongoose.isValidObjectId(order.match) ? new mongoose.Types.ObjectId(order.match) : order.match,
      symbol: order.symbol,
      status: 'open'
    });

    if (existingPosition) {
      // Update existing position
      const newSize = order.side === 'buy' 
        ? existingPosition.size + executionQuantity
        : existingPosition.size - executionQuantity;

      if (newSize <= 0) {
        // Close position
        await existingPosition.close(executionPrice);
      } else {
        // Update position
        existingPosition.size = newSize;
        existingPosition.entryPrice = (existingPosition.entryPrice * existingPosition.size + executionPrice * executionQuantity) / newSize;
        await existingPosition.save();
      }
    } else {
      // Create new position
      const position = new Position({
        user: order.user,
        match: mongoose.isValidObjectId(order.match) ? new mongoose.Types.ObjectId(order.match) : order.match,
        symbol: order.symbol,
        side: order.side === 'buy' ? 'long' : 'short',
        size: executionQuantity,
        entryPrice: executionPrice,
        markPrice: executionPrice,
        marginMode: order.marginMode,
        leverage: order.leverage,
        margin: (executionQuantity * executionPrice) / order.leverage,
        marginRatio: 0,
        liquidationPrice: calculateLiquidationPrice(executionPrice, order.leverage, order.marginMode),
        takeProfitPrice: order.takeProfitPrice,
        stopLossPrice: order.stopLossPrice
      });

      await position.save();
    }
  } catch (error) {
    console.error('Error creating/updating position:', error);
    throw error;
  }
}

// Create TP/SL orders
async function createTPSLOrders(order) {
  try {
    if (order.takeProfitPrice) {
      const tpOrder = new Order({
        user: order.user,
        match: mongoose.isValidObjectId(order.match) ? new mongoose.Types.ObjectId(order.match) : order.match,
        symbol: order.symbol,
        side: order.side === 'buy' ? 'sell' : 'buy',
        type: 'limit',
        quantity: order.quantity,
        price: order.takeProfitPrice,
        marginMode: order.marginMode,
        leverage: order.leverage,
        timeInForce: 'GTC'
      });
      await tpOrder.save();
    }

    if (order.stopLossPrice) {
      const slOrder = new Order({
        user: order.user,
        match: mongoose.isValidObjectId(order.match) ? new mongoose.Types.ObjectId(order.match) : order.match,
        symbol: order.symbol,
        side: order.side === 'buy' ? 'sell' : 'buy',
        type: 'stop_limit',
        quantity: order.quantity,
        price: order.stopLossPrice,
        stopPrice: order.stopLossPrice,
        marginMode: order.marginMode,
        leverage: order.leverage,
        timeInForce: 'GTC'
      });
      await slOrder.save();
    }
  } catch (error) {
    console.error('Error creating TP/SL orders:', error);
    throw error;
  }
}

// Calculate liquidation price
function calculateLiquidationPrice(entryPrice, leverage, marginMode) {
  const maintenanceMarginRate = 0.004; // 0.4%
  
  if (marginMode === 'cross') {
    // Cross margin calculation
    return entryPrice * (1 - (1/leverage) + maintenanceMarginRate);
  } else {
    // Isolated margin calculation
    return entryPrice * (1 - (1/leverage) + maintenanceMarginRate);
  }
}

// Execute order
router.post('/:orderId/execute', auth, async (req, res) => {
  try {
    const { orderId } = req.params
    const { executionPrice, executionQuantity } = req.body
    const userId = req.userId

    console.log(`🎯 Executing order ${orderId} at price ${executionPrice}`)
    console.log(`👤 User ID: ${userId}`)

    // Find the order
    const order = await Order.findById(orderId)
    if (!order) {
      console.log(`❌ Order not found: ${orderId}`)
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }

    console.log(`📋 Order found:`, {
      id: order._id,
      user: order.user.toString(),
      status: order.status,
      side: order.side,
      type: order.type,
      price: order.price
    })

    // Check if user owns the order
    if (order.user.toString() !== userId) {
      console.log(`❌ Unauthorized: Order user ${order.user.toString()} !== Request user ${userId}`)
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to execute this order'
      })
    }

    // Check if order can be executed
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be executed'
      })
    }

    // Execute the order
    const quantity = executionQuantity || order.quantity
    await order.execute(executionPrice, quantity)

    // Create or update position
    await createOrUpdatePosition(order, executionPrice, quantity)

    // Create TP/SL orders if specified
    if (order.takeProfitPrice || order.stopLossPrice) {
      await createTPSLOrders(order, executionPrice, quantity)
    }

    console.log(`✅ Order ${orderId} executed successfully`)

    res.json({
      success: true,
      message: 'Order executed successfully',
      order
    })
  } catch (error) {
    console.error('Error executing order:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Cancel order
router.post('/:orderId/cancel', auth, async (req, res) => {
  try {
    const { orderId } = req.params
    const userId = req.user.id

    console.log(`📋 Cancelling order ${orderId} for user ${userId}`)

    // Find the order
    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }

    // Check if user owns the order
    if (order.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to cancel this order'
      })
    }

    // Check if order can be cancelled
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled'
      })
    }

    // Cancel the order
    await order.cancel()

    console.log(`✅ Order ${orderId} cancelled successfully`)

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order
    })
  } catch (error) {
    console.error('Error cancelling order:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

module.exports = router;
