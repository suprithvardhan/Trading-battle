const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔄 Testing MongoDB connection...');
    
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: true,
    });
    
    console.log('✅ MongoDB connection successful');
    console.log('📊 Connection state:', mongoose.connection.readyState);
    console.log('🔗 Database name:', mongoose.connection.name);
    
    // Test a simple query
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    console.log('👥 Total users in database:', userCount);
    
    await mongoose.disconnect();
    console.log('✅ Connection test completed successfully');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    process.exit(1);
  }
}

testConnection();
