const mongoose = require('mongoose');
const axios = require('axios');
const dotenv = require('dotenv');
const Asset = require('../models/Asset');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Check if MONGODB_URL is available
    if (!process.env.MONGODB_URL) {
      console.error('❌ MONGODB_URL is required. Please create a .env file with your MongoDB connection string.');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    console.log('📍 Using connection string:', process.env.MONGODB_URL.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in log
    
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.log('💡 Make sure MongoDB is running and MONGODB_URL is correct in .env file');
    process.exit(1);
  }
};

// Fetch and store all crypto tickers from Binance
const seedTickers = async () => {
  try {
    console.log('🌱 Starting ticker seeding process...');
    
    // Clear existing assets
    await Asset.deleteMany({ type: 'crypto' });
    console.log('🗑️ Cleared existing crypto assets');
    
    // Fetch all trading pairs from Binance
    const response = await axios.get('https://api.binance.com/api/v3/exchangeInfo');
    
    if (!response.data || !response.data.symbols) {
      throw new Error('Failed to fetch symbols from Binance');
    }
    
    const symbols = response.data.symbols
      .filter(symbol => 
        symbol.status === 'TRADING' && 
        symbol.symbol.endsWith('USDT') &&
        symbol.isSpotTradingAllowed
      )
      .slice(0, 200) // Store 200+ tickers as requested
      .map(symbol => ({
        symbol: symbol.symbol,
        name: symbol.baseAsset,
        type: 'crypto',
        exchange: 'Binance',
        baseAsset: symbol.baseAsset,
        quoteAsset: symbol.quoteAsset,
        currentPrice: 0,
        previousClose: 0,
        volume: 0,
        averageVolume: 0,
        isActive: true
      }));
    
    // Insert all symbols into database
    await Asset.insertMany(symbols);
    console.log(`✅ Successfully seeded ${symbols.length} crypto tickers`);
    
    // Display some examples
    console.log('\n📊 Sample tickers:');
    symbols.slice(0, 5).forEach(ticker => {
      console.log(`  ${ticker.symbol} - ${ticker.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding tickers:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seeding process
const run = async () => {
  await connectDB();
  await seedTickers();
};

run();
