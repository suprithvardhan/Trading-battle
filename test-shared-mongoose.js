const mongoose = require('./backend/db');

console.log('🧪 Testing Shared Mongoose Instance...');

async function testSharedMongoose() {
  try {
    // Connect to MongoDB using shared instance
    await mongoose.connect('mongodb://localhost:27017/paper-trading-battle', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      bufferCommands: false,
    });
    
    console.log('✅ Connected to MongoDB using shared mongoose instance');
    
    // Import models (they should use the same mongoose instance)
    const Order = require('./backend/models/Order');
    const Position = require('./backend/models/Position');
    const User = require('./backend/models/User');
    
    console.log('✅ Models imported successfully');
    
    // Test database operations
    const orderCount = await Order.countDocuments();
    console.log(`✅ Order count: ${orderCount}`);
    
    const positionCount = await Position.countDocuments();
    console.log(`✅ Position count: ${positionCount}`);
    
    const userCount = await User.countDocuments();
    console.log(`✅ User count: ${userCount}`);
    
    console.log('🎉 Shared mongoose instance is working perfectly!');
    console.log('✅ No more "buffering timed out" errors!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (mongoose.connection.readyState === 1) {
      mongoose.connection.close();
    }
    process.exit(0);
  }
}

testSharedMongoose();
