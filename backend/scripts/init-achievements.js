const mongoose = require('../db');
const Achievement = require('../models/Achievement');

const achievements = [
  // Trading Milestones
  {
    name: 'First Trade',
    description: 'Complete your first trade',
    icon: 'play',
    category: 'trading',
    criteria: { type: 'total_trades', value: 1, operator: '>=' },
    rarity: 'common'
  },
  {
    name: 'Getting Started',
    description: 'Complete 10 trades',
    icon: 'target',
    category: 'trading',
    criteria: { type: 'total_trades', value: 10, operator: '>=' },
    rarity: 'common'
  },
  {
    name: 'Active Trader',
    description: 'Complete 50 trades',
    icon: 'activity',
    category: 'trading',
    criteria: { type: 'total_trades', value: 50, operator: '>=' },
    rarity: 'uncommon'
  },
  {
    name: 'Trading Veteran',
    description: 'Complete 100 trades',
    icon: 'award',
    category: 'trading',
    criteria: { type: 'total_trades', value: 100, operator: '>=' },
    rarity: 'rare'
  },
  {
    name: 'Trading Master',
    description: 'Complete 500 trades',
    icon: 'trophy',
    category: 'trading',
    criteria: { type: 'total_trades', value: 500, operator: '>=' },
    rarity: 'epic'
  },
  
  // Win Rate Achievements
  {
    name: 'First Win',
    description: 'Win your first trade',
    icon: 'trending-up',
    category: 'profit',
    criteria: { type: 'matches_won', value: 1, operator: '>=' },
    rarity: 'common'
  },
  {
    name: 'Consistent Winner',
    description: 'Achieve 60% win rate',
    icon: 'target',
    category: 'profit',
    criteria: { type: 'win_rate', value: 60, operator: '>=' },
    rarity: 'uncommon'
  },
  {
    name: 'Sharp Shooter',
    description: 'Achieve 75% win rate',
    icon: 'target',
    category: 'profit',
    criteria: { type: 'win_rate', value: 75, operator: '>=' },
    rarity: 'rare'
  },
  {
    name: 'Trading Legend',
    description: 'Achieve 90% win rate',
    icon: 'crown',
    category: 'profit',
    criteria: { type: 'win_rate', value: 90, operator: '>=' },
    rarity: 'legendary'
  },
  
  // Streak Achievements
  {
    name: 'Hot Streak',
    description: 'Win 3 trades in a row',
    icon: 'flame',
    category: 'streak',
    criteria: { type: 'consecutive_wins', value: 3, operator: '>=' },
    rarity: 'common'
  },
  {
    name: 'On Fire',
    description: 'Win 5 trades in a row',
    icon: 'flame',
    category: 'streak',
    criteria: { type: 'consecutive_wins', value: 5, operator: '>=' },
    rarity: 'uncommon'
  },
  {
    name: 'Unstoppable',
    description: 'Win 10 trades in a row',
    icon: 'flame',
    category: 'streak',
    criteria: { type: 'consecutive_wins', value: 10, operator: '>=' },
    rarity: 'rare'
  },
  {
    name: 'Perfect Storm',
    description: 'Win 20 trades in a row',
    icon: 'flame',
    category: 'streak',
    criteria: { type: 'consecutive_wins', value: 20, operator: '>=' },
    rarity: 'epic'
  },
  
  // Profit Achievements
  {
    name: 'First Profit',
    description: 'Make your first $100 profit',
    icon: 'dollar-sign',
    category: 'profit',
    criteria: { type: 'total_pnl', value: 100, operator: '>=' },
    rarity: 'common'
  },
  {
    name: 'Profit Maker',
    description: 'Make $1,000 total profit',
    icon: 'dollar-sign',
    category: 'profit',
    criteria: { type: 'total_pnl', value: 1000, operator: '>=' },
    rarity: 'uncommon'
  },
  {
    name: 'Money Maker',
    description: 'Make $5,000 total profit',
    icon: 'dollar-sign',
    category: 'profit',
    criteria: { type: 'total_pnl', value: 5000, operator: '>=' },
    rarity: 'rare'
  },
  {
    name: 'Profit King',
    description: 'Make $10,000 total profit',
    icon: 'crown',
    category: 'profit',
    criteria: { type: 'total_pnl', value: 10000, operator: '>=' },
    rarity: 'epic'
  },
  {
    name: 'Trading Millionaire',
    description: 'Make $50,000 total profit',
    icon: 'crown',
    category: 'profit',
    criteria: { type: 'total_pnl', value: 50000, operator: '>=' },
    rarity: 'legendary'
  },
  
  // Volume Achievements
  {
    name: 'Volume Trader',
    description: 'Trade $10,000 total volume',
    icon: 'bar-chart',
    category: 'volume',
    criteria: { type: 'volume', value: 10000, operator: '>=' },
    rarity: 'common'
  },
  {
    name: 'High Volume',
    description: 'Trade $50,000 total volume',
    icon: 'bar-chart',
    category: 'volume',
    criteria: { type: 'volume', value: 50000, operator: '>=' },
    rarity: 'uncommon'
  },
  {
    name: 'Volume King',
    description: 'Trade $100,000 total volume',
    icon: 'bar-chart',
    category: 'volume',
    criteria: { type: 'volume', value: 100000, operator: '>=' },
    rarity: 'rare'
  },
  {
    name: 'Volume Legend',
    description: 'Trade $500,000 total volume',
    icon: 'bar-chart',
    category: 'volume',
    criteria: { type: 'volume', value: 500000, operator: '>=' },
    rarity: 'epic'
  },
  
  // Special Achievements
  {
    name: 'Risk Manager',
    description: 'Maintain positive P&L for 7 consecutive days',
    icon: 'shield',
    category: 'special',
    criteria: { type: 'total_pnl', value: 0, operator: '>=' },
    rarity: 'rare'
  },
  {
    name: 'Weekend Warrior',
    description: 'Trade on a weekend',
    icon: 'calendar',
    category: 'special',
    criteria: { type: 'total_trades', value: 1, operator: '>=' },
    rarity: 'uncommon'
  },
  {
    name: 'Early Bird',
    description: 'Make your first trade before 9 AM',
    icon: 'sun',
    category: 'special',
    criteria: { type: 'total_trades', value: 1, operator: '>=' },
    rarity: 'uncommon'
  },
  {
    name: 'Night Owl',
    description: 'Make your first trade after 10 PM',
    icon: 'moon',
    category: 'special',
    criteria: { type: 'total_trades', value: 1, operator: '>=' },
    rarity: 'uncommon'
  }
];

async function initializeAchievements() {
  try {
    console.log('Initializing achievements...');
    
    for (const achievementData of achievements) {
      const existingAchievement = await Achievement.findOne({ name: achievementData.name });
      
      if (!existingAchievement) {
        const achievement = new Achievement(achievementData);
        await achievement.save();
        console.log(`Created achievement: ${achievementData.name}`);
      } else {
        console.log(`Achievement already exists: ${achievementData.name}`);
      }
    }
    
    console.log('Achievements initialization completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing achievements:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeAchievements();
}

module.exports = { initializeAchievements };
