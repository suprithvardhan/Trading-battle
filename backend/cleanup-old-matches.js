const mongoose = require('mongoose');
const Match = require('./models/Match');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const cleanupOldMatches = async () => {
  try {
    await connectDB();
    
    console.log('🧹 Starting cleanup of old matches...');
    
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Find all matches that should be cleaned up
    const expiredWaitingMatches = await Match.find({
      status: 'waiting',
      createdAt: { $lt: fiveMinutesAgo }
    });
    
    const expiredActiveMatches = await Match.find({
      status: 'active',
      startTime: { $lt: fiveMinutesAgo }
    });
    
    const oldCompletedMatches = await Match.find({
      status: 'completed',
      endTime: { $lt: oneDayAgo }
    });
    
    console.log(`📊 Found ${expiredWaitingMatches.length} expired waiting matches`);
    console.log(`📊 Found ${expiredActiveMatches.length} expired active matches`);
    console.log(`📊 Found ${oldCompletedMatches.length} old completed matches`);
    
    // Clean up expired waiting matches
    for (const match of expiredWaitingMatches) {
      match.status = 'completed';
      match.endTime = new Date();
      match.winner = null;
      match.result = 'tie';
      await match.save();
      console.log(`✅ Cleaned up expired waiting match: ${match._id}`);
    }
    
    // Clean up expired active matches
    for (const match of expiredActiveMatches) {
      match.status = 'completed';
      match.endTime = new Date();
      match.winner = null;
      match.result = 'tie';
      await match.save();
      console.log(`✅ Cleaned up expired active match: ${match._id}`);
    }
    
    // Delete old completed matches - DISABLED to preserve match history
    // if (oldCompletedMatches.length > 0) {
    //   await Match.deleteMany({
    //     status: 'completed',
    //     endTime: { $lt: oneDayAgo }
    //   });
    //   console.log(`🗑️ Deleted ${oldCompletedMatches.length} old completed matches`);
    // }
    console.log(`📊 Found ${oldCompletedMatches.length} old completed matches (preserved for history)`);
    
    console.log('🎉 Cleanup completed successfully!');
    
    // Show final stats
    const totalMatches = await Match.countDocuments();
    const activeMatches = await Match.countDocuments({ status: 'active' });
    const waitingMatches = await Match.countDocuments({ status: 'waiting' });
    const completedMatches = await Match.countDocuments({ status: 'completed' });
    
    console.log('\n📊 Final match statistics:');
    console.log(`Total matches: ${totalMatches}`);
    console.log(`Active matches: ${activeMatches}`);
    console.log(`Waiting matches: ${waitingMatches}`);
    console.log(`Completed matches: ${completedMatches}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

cleanupOldMatches();
