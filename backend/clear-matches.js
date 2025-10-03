const mongoose = require('mongoose');
const Match = require('./models/Match');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/paper-trading-battle', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function clearAllMatches() {
  try {
    console.log('🧹 Clearing all matches...');
    
    // Update all matches to cancelled status
    const result = await Match.updateMany(
      { status: { $in: ['waiting', 'active'] } },
      { 
        $set: { 
          status: 'cancelled',
          endTime: new Date()
        }
      }
    );
    
    console.log(`✅ Cleared ${result.modifiedCount} matches`);
    
    // Show remaining matches
    const remainingMatches = await Match.find({ status: 'cancelled' });
    console.log(`📊 Total cancelled matches: ${remainingMatches.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing matches:', error);
    process.exit(1);
  }
}

clearAllMatches();
