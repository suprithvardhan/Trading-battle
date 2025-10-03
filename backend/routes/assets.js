const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const marketDataService = require('../services/marketData');
const realTimeDataService = require('../services/realTimeData');

// @route   GET /api/assets
// @desc    Get all available assets from database (optimized - no real-time API calls)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      type = null, 
      exchange = null, 
      limit = 100, 
      page = 1,
      search = null 
    } = req.query;

    let query = { isActive: true };
    
    if (type) {
      query.type = type;
    }
    
    if (exchange) {
      query.exchange = exchange;
    }

    if (search) {
      query.$or = [
        { symbol: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    // Get assets from database (stored once, no real-time API calls)
    const assets = await Asset.find(query)
      .select('symbol name type exchange baseAsset quoteAsset')
      .sort({ symbol: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Asset.countDocuments(query);

    res.json({ 
      success: true, 
      assets,
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

// @route   GET /api/assets/popular
// @desc    Get popular assets
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const popularAssets = await Asset.getPopularAssets()
      .limit(parseInt(limit));

    res.json({ success: true, assets: popularAssets });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/assets/search
// @desc    Search assets
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const searchResults = await Asset.searchAssets(q)
      .limit(parseInt(limit));

    res.json({ success: true, assets: searchResults });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/assets/:symbol
// @desc    Get specific asset details
// @access  Public
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { history = false, limit = 100, interval = '1m' } = req.query;

    const asset = await Asset.findOne({ 
      symbol: symbol.toUpperCase(),
      isActive: true 
    });

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    let response = { asset };

    if (history === 'true') {
      const priceHistory = await realTimeDataService.getKlineData(symbol, interval, parseInt(limit));
      response.priceHistory = priceHistory;
    }

    res.json({ success: true, ...response });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/assets/:symbol/price
// @desc    Get asset current price
// @access  Public
router.get('/:symbol/price', async (req, res) => {
  try {
    const { symbol } = req.params;

    const priceData = await realTimeDataService.getRealTimePrice(symbol);

    res.json({ 
      success: true, 
      price: priceData
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/assets/types
// @desc    Get available asset types
// @access  Public
router.get('/types', async (req, res) => {
  try {
    const types = await Asset.distinct('type', { isActive: true });
    const exchanges = await Asset.distinct('exchange', { isActive: true });

    res.json({ 
      success: true, 
      types,
      exchanges
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/assets/trending
// @desc    Get trending assets
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const trendingAssets = await Asset.find({ 
      isActive: true,
      dayChangePercent: { $gt: 0 }
    })
    .select('symbol name type currentPrice dayChange dayChangePercent volume')
    .sort({ dayChangePercent: -1 })
    .limit(parseInt(limit));

    res.json({ success: true, assets: trendingAssets });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/assets/declining
// @desc    Get declining assets
// @access  Public
router.get('/declining', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const decliningAssets = await Asset.find({ 
      isActive: true,
      dayChangePercent: { $lt: 0 }
    })
    .select('symbol name type currentPrice dayChange dayChangePercent volume')
    .sort({ dayChangePercent: 1 })
    .limit(parseInt(limit));

    res.json({ success: true, assets: decliningAssets });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/assets/symbols
// @desc    Get all available trading symbols from Binance
// @access  Public
router.get('/symbols', async (req, res) => {
  try {
    const symbols = await realTimeDataService.getAllSymbols();
    res.json({ success: true, symbols });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/assets/:symbol/stats
// @desc    Get 24hr ticker statistics
// @access  Public
router.get('/:symbol/stats', async (req, res) => {
  try {
    const { symbol } = req.params;
    const stats = await realTimeDataService.getTickerStats(symbol);
    res.json({ success: true, stats });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
