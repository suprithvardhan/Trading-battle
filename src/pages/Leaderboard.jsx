import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import axios from 'axios'
import { 
  Trophy, 
  Medal, 
  Crown,
  TrendingUp,
  Target,
  Award,
  Filter,
  Search,
  Star
} from 'lucide-react'

const Leaderboard = () => {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [leaderboard, setLeaderboard] = useState([])
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/dashboard/leaderboard')
        if (response.data.success) {
          const leaderboardData = response.data.leaderboard.map((player, index) => ({
            rank: index + 1,
            username: player.username,
            tier: player.tier,
            winRate: player.winRate,
            totalMatches: player.wins + player.losses,
            balance: player.balance,
            badges: player.badges?.length || 0
          }))
          setLeaderboard(leaderboardData)
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
        // Fallback to mock data
        const mockData = [
          {
            rank: 1,
            username: 'CryptoKing_99',
            tier: 'Diamond',
            winRate: 89,
            totalMatches: 156,
            balance: 45000,
            badges: 12
          },
          {
            rank: 2,
            username: 'StockMaster_42',
            tier: 'Platinum',
            winRate: 85,
            totalMatches: 134,
            balance: 38000,
            badges: 10
          },
          {
            rank: 3,
            username: 'TradingPro_88',
            tier: 'Platinum',
            winRate: 82,
            totalMatches: 98,
            balance: 32000,
            badges: 8
          },
          {
            rank: 4,
            username: 'MarketWizard_77',
            tier: 'Gold',
            winRate: 78,
            totalMatches: 89,
            balance: 28000,
            badges: 7
          },
          {
            rank: 5,
            username: 'FinanceGuru_55',
            tier: 'Gold',
            winRate: 75,
            totalMatches: 76,
            balance: 25000,
            badges: 6
          },
          {
            rank: 6,
            username: 'TradeMaster_33',
            tier: 'Silver',
            winRate: 72,
            totalMatches: 65,
            balance: 22000,
            badges: 5
          },
          {
            rank: 7,
            username: 'InvestorPro_22',
            tier: 'Silver',
            winRate: 68,
            totalMatches: 54,
            balance: 19000,
            badges: 4
          },
          {
            rank: 8,
            username: 'MarketHero_11',
            tier: 'Bronze',
            winRate: 65,
            totalMatches: 43,
            balance: 16000,
            badges: 3
          }
        ]
        setLeaderboard(mockData)
      }
    }

    fetchLeaderboard()
  }, [])

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Diamond': return 'text-blue-500'
      case 'Platinum': return 'text-gray-500'
      case 'Gold': return 'text-yellow-500'
      case 'Silver': return 'text-gray-400'
      case 'Bronze': return 'text-orange-500'
      default: return 'text-slate-500'
    }
  }

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-500" />
      case 2: return <Medal className="w-6 h-6 text-gray-400" />
      case 3: return <Trophy className="w-6 h-6 text-orange-500" />
      default: return <span className="text-lg font-bold text-slate-500">#{rank}</span>
    }
  }

  const filteredLeaderboard = leaderboard.filter(player => {
    const matchesFilter = filter === 'all' || player.tier === filter
    const matchesSearch = player.username.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className={`text-3xl font-bold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Leaderboard
          </h1>
          <p className={`mt-2 transition-colors duration-300 ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Top traders competing for the crown
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className={`p-6 rounded-2xl border transition-colors duration-300 ${
          isDark 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`} />
              <input
                type="text"
                placeholder="Search traders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-colors duration-300 ${
                  isDark 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                }`}
              />
            </div>
          </div>

          {/* Tier Filter */}
          <div className="flex space-x-2">
            {['all', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze'].map((tier) => (
              <button
                key={tier}
                onClick={() => setFilter(tier)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300 ${
                  filter === tier
                    ? 'bg-blue-600 text-white'
                    : isDark
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tier === 'all' ? 'All Tiers' : tier}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={`rounded-2xl border overflow-hidden transition-colors duration-300 ${
          isDark 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b transition-colors duration-300 ${
          isDark ? 'border-slate-700' : 'border-slate-200'
        }`}>
          <div className="grid grid-cols-6 gap-4 text-sm font-medium">
            <div className={`transition-colors duration-300 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>Rank</div>
            <div className={`transition-colors duration-300 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>Trader</div>
            <div className={`transition-colors duration-300 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>Tier</div>
            <div className={`transition-colors duration-300 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>Win Rate</div>
            <div className={`transition-colors duration-300 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>Matches</div>
            <div className={`transition-colors duration-300 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>Balance</div>
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {filteredLeaderboard.map((player, index) => (
            <motion.div
              key={player.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`px-6 py-4 hover:transition-colors duration-300 ${
                isDark 
                  ? 'hover:bg-slate-700' 
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="grid grid-cols-6 gap-4 items-center">
                {/* Rank */}
                <div className="flex items-center space-x-2">
                  {getRankIcon(player.rank)}
                </div>

                {/* Trader */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {player.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className={`font-medium transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {player.username}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span className={`text-xs transition-colors duration-300 ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {player.badges} badges
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tier */}
                <div className={`font-medium transition-colors duration-300 ${getTierColor(player.tier)}`}>
                  {player.tier}
                </div>

                {/* Win Rate */}
                <div className="flex items-center space-x-2">
                  <div className={`font-semibold transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {player.winRate}%
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>

                {/* Matches */}
                <div className={`transition-colors duration-300 ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {player.totalMatches}
                </div>

                {/* Balance */}
                <div className={`font-semibold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  ${player.balance.toLocaleString()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Your Rank */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className={`p-6 rounded-2xl border transition-colors duration-300 ${
          isDark 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}
      >
        <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          Your Ranking
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-lg font-bold">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className={`font-medium transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {user?.username}
              </div>
              <div className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {user?.tier} Trader
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              #{leaderboard.length + 1}
            </div>
            <div className={`text-sm transition-colors duration-300 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Keep trading to climb!
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Leaderboard