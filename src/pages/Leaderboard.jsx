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
  ChevronRight,
  Award,
  Target,
  Zap,
  Flame,
  Shield,
  Sparkles,
  Calendar,
  TrendingDown,
  DollarSign,
  BarChart3
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
        setLeaderboard([])
        setUserRank(null)
        setStats(null)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [period, user])

  const getTierIcon = (tier, rank) => {
    if (rank <= 3) {
      switch (rank) {
        case 1: return <Crown className="w-6 h-6 text-yellow-400" />
        case 2: return <Medal className="w-6 h-6 text-gray-300" />
        case 3: return <Medal className="w-6 h-6 text-amber-500" />
        default: return <Trophy className="w-6 h-6 text-blue-400" />
      }
    }
    
    switch (tier) {
      case 'Diamond': return <Crown className="w-5 h-5 text-purple-400" />
      case 'Platinum': return <Star className="w-5 h-5 text-blue-400" />
      case 'Gold': return <Star className="w-5 h-5 text-yellow-400" />
      case 'Silver': return <Star className="w-5 h-5 text-gray-400" />
      default: return <Trophy className="w-5 h-5 text-amber-500" />
    }
  }

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Diamond': return 'text-purple-400'
      case 'Platinum': return 'text-blue-400'
      case 'Gold': return 'text-yellow-400'
      case 'Silver': return 'text-gray-400'
      default: return 'text-amber-500'
    }
  }

  const getTierGradient = (tier) => {
    switch (tier) {
      case 'Diamond': return 'from-purple-500 to-purple-700'
      case 'Platinum': return 'from-blue-500 to-blue-700'
      case 'Gold': return 'from-yellow-500 to-yellow-700'
      case 'Silver': return 'from-gray-400 to-gray-600'
      default: return 'from-amber-500 to-amber-700'
    }
  }

  const getRankBadge = (rank) => {
    if (rank === 1) return { bg: 'bg-gradient-to-r from-yellow-400 to-yellow-600', text: 'text-yellow-900', icon: Crown }
    if (rank === 2) return { bg: 'bg-gradient-to-r from-gray-300 to-gray-500', text: 'text-gray-900', icon: Medal }
    if (rank === 3) return { bg: 'bg-gradient-to-r from-amber-400 to-amber-600', text: 'text-amber-900', icon: Medal }
    if (rank <= 10) return { bg: 'bg-gradient-to-r from-blue-500 to-blue-700', text: 'text-white', icon: Trophy }
    return { bg: 'bg-gray-600', text: 'text-gray-200', icon: Target }
  }

  const filteredLeaderboard = leaderboard.filter(player => 
    player.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-white mb-2">Loading Leaderboard</h3>
          <p className="text-slate-400">Fetching the latest rankings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-yellow-400 mr-3" />
            <h1 className="text-4xl font-bold text-white">
              Global Leaderboard
            </h1>
            <Trophy className="w-8 h-8 text-yellow-400 ml-3" />
          </div>
          <p className="text-xl text-slate-300 mb-8">
            Compete with traders worldwide and climb the rankings
          </p>
          
          {/* Period Selector */}
          <div className="flex justify-center space-x-2">
            {[
              { key: 'all-time', label: 'All Time', icon: Award },
              { key: 'monthly', label: 'Monthly', icon: Calendar },
              { key: 'weekly', label: 'Weekly', icon: Calendar },
              { key: 'daily', label: 'Daily', icon: Calendar }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  period === key
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
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
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
          >
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">
                    {stats.totalUsers || 0}
                  </div>
                  <div className="text-blue-200 text-sm">
                    Total Traders
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Crown className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">
                    {stats.tierDistribution?.find(t => t._id === 'Diamond')?.count || 0}
                  </div>
                  <div className="text-purple-200 text-sm">
                    Diamond Traders
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">
                    {userRank?.rank || 'N/A'}
                  </div>
                  <div className="text-green-200 text-sm">
                    Your Rank
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <Trophy className="w-8 h-8 text-yellow-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">
                    {userRank?.winRate || 0}%
                  </div>
                  <div className="text-yellow-200 text-sm">
                    Win Rate
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
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 mb-8"
        >
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search traders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
              />
            </div>
          </div>
        </motion.div>

        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                    Trader
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                    Tier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                    Win Rate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                    Matches
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredLeaderboard.map((player, index) => {
                  const rankBadge = getRankBadge(player.rank)
                  const IconComponent = rankBadge.icon
                  
                  return (
                    <motion.tr
                      key={player._id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="hover:bg-slate-700/30 transition-colors duration-300"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${rankBadge.bg}`}>
                            <IconComponent className={`w-4 h-4 ${rankBadge.text}`} />
                          </div>
                          <span className="text-lg font-bold text-white">
                            #{player.rank}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white text-sm font-bold">
                              {player.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">
                              {player.username}
                            </div>
                            <div className="text-xs text-slate-400">
                              {player.totalMatches} matches
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getTierIcon(player.tier, player.rank)}
                          <span className={`text-sm font-medium ${getTierColor(player.tier)}`}>
                            {player.tier}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-white">
                            {player.winRate}%
                          </span>
                          <div className="w-20 bg-slate-600 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full"
                              style={{ width: `${Math.min(player.winRate, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-300">
                          {player.totalMatches}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-white">
                          ${player.balance?.toLocaleString()}
                        </span>
                      </td>
                    </motion.tr>
                  )
                })}
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
            className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-8 mt-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-4">
                  {getTierIcon(userRank.tier, userRank.rank)}
                  <div>
                    <div className="text-4xl font-bold text-white">
                      #{userRank.rank}
                    </div>
                    <div className="text-lg text-blue-200">
                      {userRank.username}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg font-bold">
                      {userRank.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-blue-200">
                      {userRank.tier} Tier
                    </div>
                    <div className="text-xs text-slate-400">
                      {userRank.totalMatches} matches
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-white mb-2">
                  {userRank.winRate}% Win Rate
                </div>
                <div className="text-sm text-blue-200">
                  ${userRank.balance?.toLocaleString()} Balance
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && filteredLeaderboard.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center py-12"
          >
            <Trophy className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Results Found</h3>
            <p className="text-slate-400">Try adjusting your search or filter criteria.</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Leaderboard