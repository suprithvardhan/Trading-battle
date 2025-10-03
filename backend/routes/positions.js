const express = require('express');
const router = express.Router();
const Position = require('../models/Position');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

// Get user's positions
router.get('/:matchId', auth, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { status = 'open' } = req.query;
    
    const positions = await Position.getUserPositions(req.user.id, matchId, status);
    
    res.json({
      success: true,
      positions
    });
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching positions',
      error: error.message
    });
  }
});

// Close position
router.post('/:positionId/close', auth, async (req, res) => {
  try {
    const { positionId } = req.params;
    const { price } = req.body;
    
    const position = await Position.findOne({
      _id: positionId,
      user: req.user.id,
      status: 'open'
    });

    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Position not found or already closed'
      });
    }

    const closePrice = price || position.markPrice;
    await position.close(closePrice);

    // Update user balance
    await updateUserBalance(req.user.id, position.unrealizedPnL);

    res.json({
      success: true,
      message: 'Position closed successfully',
      position
    });
  } catch (error) {
    console.error('Error closing position:', error);
    res.status(500).json({
      success: false,
      message: 'Error closing position',
      error: error.message
    });
  }
});

// Update position TP/SL
router.put('/:positionId/tpsl', auth, async (req, res) => {
  try {
    const { positionId } = req.params;
    const { takeProfitPrice, stopLossPrice } = req.body;
    
    const position = await Position.findOne({
      _id: positionId,
      user: req.user.id,
      status: 'open'
    });

    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Position not found'
      });
    }

    if (takeProfitPrice) position.takeProfitPrice = parseFloat(takeProfitPrice);
    if (stopLossPrice) position.stopLossPrice = parseFloat(stopLossPrice);

    await position.save();

    // Create TP/SL orders if needed
    if (takeProfitPrice || stopLossPrice) {
      await createTPSLOrdersForPosition(position);
    }

    res.json({
      success: true,
      message: 'Position TP/SL updated successfully',
      position
    });
  } catch (error) {
    console.error('Error updating position TP/SL:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating position TP/SL',
      error: error.message
    });
  }
});

// Update position leverage
router.put('/:positionId/leverage', auth, async (req, res) => {
  try {
    const { positionId } = req.params;
    const { leverage } = req.body;
    
    const position = await Position.findOne({
      _id: positionId,
      user: req.user.id,
      status: 'open'
    });

    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Position not found'
      });
    }

    position.leverage = parseInt(leverage);
    position.margin = (position.size * position.entryPrice) / position.leverage;
    position.liquidationPrice = calculateLiquidationPrice(position.entryPrice, position.leverage, position.marginMode);

    await position.save();

    res.json({
      success: true,
      message: 'Position leverage updated successfully',
      position
    });
  } catch (error) {
    console.error('Error updating position leverage:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating position leverage',
      error: error.message
    });
  }
});

// Update all positions with new mark prices
router.post('/update-prices', auth, async (req, res) => {
  try {
    const { priceUpdates } = req.body; // Array of {symbol, price}
    
    const updatePromises = priceUpdates.map(async ({ symbol, price }) => {
      const positions = await Position.getPositionsBySymbol(symbol, 'open');
      
      return Promise.all(positions.map(position => 
        position.updateMarkPrice(price)
      ));
    });

    await Promise.all(updatePromises);

    // Check for liquidations
    await Position.checkLiquidation();

    res.json({
      success: true,
      message: 'Positions updated successfully'
    });
  } catch (error) {
    console.error('Error updating positions:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating positions',
      error: error.message
    });
  }
});

// Create TP/SL orders for position
async function createTPSLOrdersForPosition(position) {
  try {
    // Cancel existing TP/SL orders for this position
    await Order.updateMany({
      user: position.user,
      match: position.match,
      symbol: position.symbol,
      status: 'pending'
    }, { status: 'cancelled' });

    // Create new TP order
    if (position.takeProfitPrice) {
      const tpOrder = new Order({
        user: position.user,
        match: position.match,
        symbol: position.symbol,
        side: position.side === 'long' ? 'sell' : 'buy',
        type: 'limit',
        quantity: position.size,
        price: position.takeProfitPrice,
        marginMode: position.marginMode,
        leverage: position.leverage,
        timeInForce: 'GTC'
      });
      await tpOrder.save();
    }

    // Create new SL order
    if (position.stopLossPrice) {
      const slOrder = new Order({
        user: position.user,
        match: position.match,
        symbol: position.symbol,
        side: position.side === 'long' ? 'sell' : 'buy',
        type: 'stop_limit',
        quantity: position.size,
        price: position.stopLossPrice,
        stopPrice: position.stopLossPrice,
        marginMode: position.marginMode,
        leverage: position.leverage,
        timeInForce: 'GTC'
      });
      await slOrder.save();
    }
  } catch (error) {
    console.error('Error creating TP/SL orders for position:', error);
    throw error;
  }
}

// Update user balance
async function updateUserBalance(userId, pnl) {
  try {
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (user) {
      user.currentBalance += pnl;
      await user.save();
    }
  } catch (error) {
    console.error('Error updating user balance:', error);
    throw error;
  }
}

// Calculate liquidation price
function calculateLiquidationPrice(entryPrice, leverage, marginMode) {
  const maintenanceMarginRate = 0.004; // 0.4%
  
  if (marginMode === 'cross') {
    return entryPrice * (1 - (1/leverage) + maintenanceMarginRate);
  } else {
    return entryPrice * (1 - (1/leverage) + maintenanceMarginRate);
  }
}

module.exports = router;
