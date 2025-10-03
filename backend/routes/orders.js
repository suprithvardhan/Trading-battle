const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Position = require('../models/Position');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Create new order
router.post('/', auth, async (req, res) => {
  try {
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

    // Validate required fields
    if (!matchId || !symbol || !side || !type || !quantity || !price || !leverage) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create order
    const order = new Order({
      user: req.user.id,
      match: matchId,
      symbol,
      side,
      type,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      stopPrice: stopPrice ? parseFloat(stopPrice) : undefined,
      marginMode: marginMode || 'cross',
      leverage: parseInt(leverage),
      takeProfitPrice: takeProfitPrice ? parseFloat(takeProfitPrice) : undefined,
      stopLossPrice: stopLossPrice ? parseFloat(stopLossPrice) : undefined,
      timeInForce: timeInForce || 'GTC',
      reduceOnly: reduceOnly || false
    });

    await order.save();

    // If market order, execute immediately
    if (type === 'market') {
      await executeOrder(order);
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
    
    const orders = await Order.getUserOrders(req.user.id, matchId, status);
    
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
    
    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id,
      status: 'pending'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or cannot be cancelled'
      });
    }

    await order.cancel();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order
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
      user: req.user.id,
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
      match: order.match,
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
        match: order.match,
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
        match: order.match,
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
        match: order.match,
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

module.exports = router;
