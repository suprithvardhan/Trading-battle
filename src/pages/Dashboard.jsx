import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import api from '../utils/api'
import MatchmakingOverlay from '../components/MatchmakingOverlay'
import { 
  TrendingUp, 
  Users, 
  Trophy, 
  DollarSign,
  BarChart3,
  Target,
  Award,
  Play,
  Clock,
  Zap,
  Star,
  ArrowRight,
  Plus,
  Minus,
  Search,
  Filter,
  TrendingDown
} from 'lucide-react'

const Dashboard = () => {
  const { user, refreshUser } = useAuth()
  const { isDark } = useTheme()
  const [recentMatches, setRecentMatches] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showMatchmaking, setShowMatchmaking] = useState(false)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const [statsRes, matchesRes, userRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/recent-matches'),
          api.get('/auth/me') // Fetch fresh user data including updated balance
        ])
        
        if (statsRes.data.success) {
          setStats(statsRes.data.stats)
        }
        
        if (userRes.data.success) {
          // Update user context with fresh balance
          const { user: freshUser } = userRes.data
          if (freshUser && user) {
            console.log('💰 Updated user balance from', user.balance, 'to', freshUser.balance)
            // Refresh user data in context
            await refreshUser()
          }
        }
        
        if (matchesRes.data.success) {
          // Limit to last 4 matches
          setRecentMatches(matchesRes.data.matches.slice(0, 4))
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // Fallback to mock data
        const mockMatches = [
          {
            id: 1,
            opponent: 'CryptoKing_99',
            result: 'win',
            profit: 1250,
            duration: '4m 32s',
            timestamp: '2 hours ago',
            asset: 'BTC/USD'
          },
          {
            id: 2,
            opponent: 'CryptoMaster_42',
            result: 'loss',
            profit: -800,
            duration: '6m 15s',
            timestamp: '1 day ago',
            asset: 'ETH/USD'
          },
          {
            id: 3,
            opponent: 'CryptoPro_88',
            result: 'win',
            profit: 2100,
            duration: '3m 45s',
            timestamp: '2 days ago',
            asset: 'BNB/USD'
          }
        ]
        setRecentMatches(mockMatches.slice(0, 4)) // Limit to 4 matches
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const handleStartMatch = () => {
    setShowMatchmaking(true)
  }

  const handleMatchFound = (match) => {
    console.log('Match found in Dashboard:', match)
    setShowMatchmaking(false)
    window.location.href = `/match?matchId=${match.id}`
  }

  const handleCloseMatchmaking = () => {
    setShowMatchmaking(false)
  }

  const formatTimeAgo = (date) => {
    const now = new Date()
    const diff = now - new Date(date)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Loading dashboard...
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
            Welcome back, {user?.username}! 👋
          </h1>
          <p className={`text-sm transition-colors duration-300 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Ready to start your next trading battle?
          </p>
        </div>
        
        {/* Balance Display */}
        <div className={`p-4 rounded-lg border transition-colors duration-300 ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <div className={`text-xs font-medium transition-colors duration-300 ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Balance
              </div>
              <div className={`text-xl font-bold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                ${stats?.balance?.toLocaleString() || user?.balance?.toLocaleString() || '10,000'}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Win Rate Card */}
        <div className={`p-4 rounded-lg border transition-colors duration-300 ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <span className={`text-xs font-medium transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Win Rate
            </span>
          </div>
          <div className={`text-2xl font-bold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {stats?.winRate || 0}%
          </div>
          <div className="text-xs text-blue-500 flex items-center mt-1">
            <BarChart3 className="w-3 h-3 mr-1" />
            {stats?.totalMatches || 0} matches
          </div>
        </div>

        {/* Tier Card */}
        <div className={`p-4 rounded-lg border transition-colors duration-300 ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <span className={`text-xs font-medium transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Tier
            </span>
          </div>
          <div className={`text-2xl font-bold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {stats?.tier || user?.tier || 'Bronze'}
          </div>
          <div className="text-xs text-yellow-500 flex items-center mt-1">
            <Award className="w-3 h-3 mr-1" />
            {stats?.badges?.length || user?.badges?.length || 0} badges
          </div>
        </div>

        {/* Active Battles Card */}
        <div className={`p-4 rounded-lg border transition-colors duration-300 ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <span className={`text-xs font-medium transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Active Battles
            </span>
          </div>
          <div className={`text-2xl font-bold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            0
          </div>
          <div className="text-xs text-blue-500 flex items-center mt-1">
            <Users className="w-3 h-3 mr-1" />
            Ready to battle
          </div>
        </div>

        {/* Today's P&L Card */}
        <div className={`p-4 rounded-lg border transition-colors duration-300 ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <span className={`text-xs font-medium transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Today's P&L
            </span>
          </div>
          <div className={`text-2xl font-bold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            +$0
          </div>
          <div className="text-xs text-green-500 flex items-center mt-1">
            <TrendingUp className="w-3 h-3 mr-1" />
            No trades today
          </div>
        </div>
      </motion.div>

      {/* Main Action Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Start Match Section */}
        <div className="lg:col-span-2">
          <div className={`p-6 rounded-lg border transition-colors duration-300 ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Play className="w-8 h-8 text-white" />
              </div>
              <h2 className={`text-xl font-bold mb-3 transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Ready to Battle?
              </h2>
              <p className={`mb-6 text-sm transition-colors duration-300 ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Find an opponent and start a real-time trading battle. 
                First to double their balance wins!
              </p>
              
              {isSearching ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-100"></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-200"></div>
                  </div>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Searching for opponents...
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleStartMatch}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg text-base font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25 flex items-center space-x-2 mx-auto"
                >
                  <Search className="w-4 h-4" />
                  <span>Find Match</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Recent Matches */}
        <div className="lg:col-span-1">
          <div className={`p-4 rounded-lg border transition-colors duration-300 ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-base font-semibold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Recent Matches
              </h3>
              <button className={`p-1 rounded transition-colors duration-300 ${
                isDark 
                  ? 'hover:bg-gray-700 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}>
                <Filter className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              {recentMatches.map((match) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`p-3 rounded-lg border transition-colors duration-300 ${
                    match.result === 'win' 
                      ? (isDark 
                          ? 'bg-green-900/20 border-green-500/30' 
                          : 'bg-green-50 border-green-200')
                      : match.result === 'loss'
                      ? (isDark 
                          ? 'bg-red-900/20 border-red-500/30' 
                          : 'bg-red-50 border-red-200')
                      : (isDark 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-gray-50 border-gray-200')
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        match.result === 'win' 
                          ? (isDark ? 'bg-green-500/20' : 'bg-green-100')
                          : match.result === 'loss'
                          ? (isDark ? 'bg-red-500/20' : 'bg-red-100')
                          : (isDark ? 'bg-gray-500/20' : 'bg-gray-100')
                      }`}>
                        {match.result === 'win' ? (
                          <Plus className="w-4 h-4 text-green-500" />
                        ) : match.result === 'loss' ? (
                          <Minus className="w-4 h-4 text-red-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <div className={`text-sm font-medium transition-colors duration-300 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          vs {match.opponent || match.players?.find(p => p.user?._id !== user?.id)?.username || 'Unknown'}
                        </div>
                        <div className={`text-xs transition-colors duration-300 ${
                          isDark ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {match.asset || 'BTC/USD'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold px-2 py-1 rounded-full ${
                        match.result === 'win' 
                          ? (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700')
                          : match.result === 'loss'
                          ? (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700')
                          : (isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-700')
                      }`}>
                        {match.result === 'win' ? '+' : ''}${match.profit?.toLocaleString() || '0'}
                      </div>
                      <div className={`text-xs transition-colors duration-300 ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {match.duration || '5m'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`transition-colors duration-300 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {match.endTime ? formatTimeAgo(match.endTime) : match.timestamp}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{match.duration || '5m'}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Matchmaking Overlay */}
      <MatchmakingOverlay
        isOpen={showMatchmaking}
        onClose={handleCloseMatchmaking}
        onMatchFound={handleMatchFound}
      />
    </div>
  )
}

export default Dashboard