const mongoose = require('mongoose');
const Match = require('./models/Match');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/paper-trading-battle', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkMatches() {
  try {
    console.log('🔍 Checking all matches...');
    
    const allMatches = await Match.find({});
    console.log(`📊 Total matches in database: ${allMatches.length}`);
    
    allMatches.forEach((match, index) => {
      console.log(`\nMatch ${index + 1}:`);
      console.log(`  ID: ${match._id}`);
      console.log(`  Status: ${match.status}`);
      console.log(`  Players: ${match.players.map(p => p.username).join(', ')}`);
      console.log(`  Created: ${match.createdAt}`);
    });
    
    // Check for active matches specifically
    const activeMatches = await Match.find({ status: { $in: ['waiting', 'active'] } });
    console.log(`\n🎮 Active matches: ${activeMatches.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking matches:', error);
    process.exit(1);
  }
}

checkMatches();
