import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import axios from 'axios'
import { 
  Trophy, 
  Medal, 
  Crown, 
  Star,
  TrendingUp,
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const Leaderboard = () => {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [leaderboard, setLeaderboard] = useState([])
  const [userRank, setUserRank] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all-time')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true)
        const [leaderboardRes, userRankRes, statsRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/leaderboard?period=${period}&limit=50`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }),
          axios.get(`http://localhost:5000/api/leaderboard/me?period=${period}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }),
          axios.get('http://localhost:5000/api/leaderboard/stats', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          })
        ])
        
        if (leaderboardRes.data.success) {
          setLeaderboard(leaderboardRes.data.leaderboard)
        }
        
        if (userRankRes.data.success) {
          setUserRank(userRankRes.data.userRank)
        }
        
        if (statsRes.data.success) {
          setStats(statsRes.data.stats)
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
        // Fallback to mock data
        const mockLeaderboard = [
          { rank: 1, username: 'CryptoKing_99', tier: 'Diamond', winRate: 95, totalMatches: 150, balance: 50000 },
          { rank: 2, username: 'TradingMaster_88', tier: 'Diamond', winRate: 92, totalMatches: 120, balance: 45000 },
          { rank: 3, username: 'MarketWizard_77', tier: 'Platinum', winRate: 88, totalMatches: 100, balance: 40000 },
          { rank: 4, username: 'FinanceGuru_66', tier: 'Platinum', winRate: 85, totalMatches: 90, balance: 35000 },
          { rank: 5, username: 'CryptoPro_55', tier: 'Gold', winRate: 82, totalMatches: 80, balance: 30000 }
        ]
        setLeaderboard(mockLeaderboard)
        setUserRank({ rank: 15, username: user?.username, tier: user?.tier, winRate: 65, totalMatches: 25, balance: 15000 })
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [period, user])

  const getTierIcon = (tier, rank) => {
    if (rank <= 3) {
      switch (rank) {
        case 1: return <Crown className="w-5 h-5 text-yellow-500" />
        case 2: return <Medal className="w-5 h-5 text-gray-400" />
        case 3: return <Medal className="w-5 h-5 text-amber-600" />
        default: return <Trophy className="w-5 h-5 text-blue-500" />
      }
    }
    
    switch (tier) {
      case 'Diamond': return <Crown className="w-5 h-5 text-purple-500" />
      case 'Platinum': return <Star className="w-5 h-5 text-blue-500" />
      case 'Gold': return <Star className="w-5 h-5 text-yellow-500" />
      case 'Silver': return <Star className="w-5 h-5 text-gray-400" />
      default: return <Trophy className="w-5 h-5 text-amber-600" />
    }
  }

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Diamond': return 'text-purple-500'
      case 'Platinum': return 'text-blue-500'
      case 'Gold': return 'text-yellow-500'
      case 'Silver': return 'text-gray-400'
      default: return 'text-amber-600'
    }
  }

  const filteredLeaderboard = leaderboard.filter(player => 
    player.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Loading leaderboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className={`text-2xl font-bold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Global Leaderboard
          </h1>
          <p className={`text-sm transition-colors duration-300 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            See how you rank against other traders worldwide
          </p>
        </div>
        
        {/* Period Selector */}
        <div className="flex space-x-2">
          {['all-time', 'monthly', 'weekly', 'daily'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-300 ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stats Overview */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className={`p-4 rounded-lg border transition-colors duration-300 ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <div className={`text-2xl font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {stats.totalUsers}
                </div>
                <div className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Total Traders
                </div>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border transition-colors duration-300 ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <div>
                <div className={`text-2xl font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {stats.tierDistribution?.find(t => t._id === 'Diamond')?.count || 0}
                </div>
                <div className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Diamond Traders
                </div>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border transition-colors duration-300 ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div>
                <div className={`text-2xl font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {userRank?.rank || 'N/A'}
                </div>
                <div className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Your Rank
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={`p-4 rounded-lg border transition-colors duration-300 ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search traders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors duration-300 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        </div>
      </motion.div>

      {/* Leaderboard Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className={`rounded-lg border overflow-hidden transition-colors duration-300 ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`transition-colors duration-300 ${
              isDark ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Rank
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Trader
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Tier
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Win Rate
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Matches
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLeaderboard.map((player, index) => (
                <motion.tr
                  key={player._id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`transition-colors duration-300 ${
                    isDark 
                      ? 'hover:bg-gray-700' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getTierIcon(player.tier, player.rank)}
                      <span className={`text-sm font-medium transition-colors duration-300 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        #{player.rank}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {player.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className={`text-sm font-medium transition-colors duration-300 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          {player.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getTierColor(player.tier)}`}>
                      {player.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium transition-colors duration-300 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {player.winRate}%
                      </span>
                      <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${Math.min(player.winRate, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm transition-colors duration-300 ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {player.totalMatches}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      ${player.balance?.toLocaleString()}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* User's Rank Card */}
      {userRank && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className={`p-6 rounded-lg border transition-colors duration-300 ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}
        >
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Your Ranking
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getTierIcon(userRank.tier, userRank.rank)}
              <div>
                <div className={`text-2xl font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  #{userRank.rank}
                </div>
                <div className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {userRank.username}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-lg font-semibold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {userRank.winRate}% Win Rate
              </div>
              <div className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {userRank.totalMatches} matches
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default Leaderboard