import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import axios from 'axios'
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
  Filter
} from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [recentMatches, setRecentMatches] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const [statsRes, matchesRes] = await Promise.all([
          axios.get('http://localhost:5000/api/dashboard/stats'),
          axios.get('http://localhost:5000/api/dashboard/recent-matches')
        ])
        
        setStats(statsRes.data.stats)
        setRecentMatches(matchesRes.data.matches)
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
            opponent: 'StockMaster_42',
            result: 'loss',
            profit: -800,
            duration: '6m 15s',
            timestamp: '1 day ago',
            asset: 'AAPL'
          },
          {
            id: 3,
            opponent: 'TradingPro_88',
            result: 'win',
            profit: 2100,
            duration: '3m 45s',
            timestamp: '2 days ago',
            asset: 'TSLA'
          }
        ]
        setRecentMatches(mockMatches)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const handleStartMatch = async () => {
    setIsSearching(true)
    try {
      const response = await axios.post('http://localhost:5000/api/dashboard/start-match')
      if (response.data.success) {
        setTimeout(() => {
          setIsSearching(false)
          setShowMatchModal(true)
        }, 2000)
      }
    } catch (error) {
      console.error('Error starting match:', error)
      setIsSearching(false)
    }
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
            isDark ? 'text-white' : 'text-neutral-900'
          }`}>
            Welcome back, {user?.username}! 👋
          </h1>
          <p className={`text-sm transition-colors duration-300 ${
            isDark ? 'text-neutral-300' : 'text-neutral-600'
          }`}>
            Ready to start your next trading battle?
          </p>
        </div>
        
        {/* Balance Display */}
        <div className={`p-4 rounded-lg border transition-colors duration-300 ${
          isDark 
            ? 'bg-neutral-800 border-neutral-700' 
            : 'bg-white border-neutral-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-success-500/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-success-500" />
            </div>
            <div>
              <div className={`text-xs font-medium transition-colors duration-300 ${
                isDark ? 'text-neutral-400' : 'text-neutral-500'
              }`}>
                Balance
              </div>
              <div className={`text-xl font-bold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-neutral-900'
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
            ? 'bg-neutral-800 border-neutral-700' 
            : 'bg-white border-neutral-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-primary-500/20 rounded-lg">
              <Target className="w-5 h-5 text-primary-500" />
            </div>
            <span className={`text-xs font-medium transition-colors duration-300 ${
              isDark ? 'text-neutral-400' : 'text-neutral-500'
            }`}>
              Win Rate
            </span>
          </div>
          <div className={`text-2xl font-bold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-neutral-900'
          }`}>
            {stats?.winRate || 0}%
          </div>
          <div className="text-xs text-primary-500 flex items-center mt-1">
            <BarChart3 className="w-3 h-3 mr-1" />
            {stats?.totalMatches || 0} matches
          </div>
        </div>

        {/* Tier Card */}
        <div className={`p-4 rounded-lg border transition-colors duration-300 ${
          isDark 
            ? 'bg-neutral-800 border-neutral-700' 
            : 'bg-white border-neutral-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-warning-500/20 rounded-lg">
              <Trophy className="w-5 h-5 text-warning-500" />
            </div>
            <span className={`text-xs font-medium transition-colors duration-300 ${
              isDark ? 'text-neutral-400' : 'text-neutral-500'
            }`}>
              Tier
            </span>
          </div>
          <div className={`text-2xl font-bold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-neutral-900'
          }`}>
            {stats?.tier || user?.tier || 'Bronze'}
          </div>
          <div className="text-xs text-warning-500 flex items-center mt-1">
            <Award className="w-3 h-3 mr-1" />
            {stats?.badges?.length || user?.badges?.length || 0} badges
          </div>
        </div>

        {/* Active Battles Card */}
        <div className={`p-4 rounded-lg border transition-colors duration-300 ${
          isDark 
            ? 'bg-neutral-800 border-neutral-700' 
            : 'bg-white border-neutral-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-primary-500/20 rounded-lg">
              <Users className="w-5 h-5 text-primary-500" />
            </div>
            <span className={`text-xs font-medium transition-colors duration-300 ${
              isDark ? 'text-neutral-400' : 'text-neutral-500'
            }`}>
              Active Battles
            </span>
          </div>
          <div className={`text-2xl font-bold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-neutral-900'
          }`}>
            0
          </div>
          <div className="text-xs text-primary-500 flex items-center mt-1">
            <Users className="w-3 h-3 mr-1" />
            Ready to battle
          </div>
        </div>

        {/* Today's P&L Card */}
        <div className={`p-4 rounded-lg border transition-colors duration-300 ${
          isDark 
            ? 'bg-neutral-800 border-neutral-700' 
            : 'bg-white border-neutral-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-success-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-success-500" />
            </div>
            <span className={`text-xs font-medium transition-colors duration-300 ${
              isDark ? 'text-neutral-400' : 'text-neutral-500'
            }`}>
              Today's P&L
            </span>
          </div>
          <div className={`text-2xl font-bold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-neutral-900'
          }`}>
            +$0
          </div>
          <div className="text-xs text-success-500 flex items-center mt-1">
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
              ? 'bg-neutral-800 border-neutral-700' 
              : 'bg-white border-neutral-200'
          }`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Play className="w-8 h-8 text-white" />
              </div>
              <h2 className={`text-xl font-bold mb-3 transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-neutral-900'
              }`}>
                Ready to Battle?
              </h2>
              <p className={`mb-6 text-sm transition-colors duration-300 ${
                isDark ? 'text-neutral-300' : 'text-neutral-600'
              }`}>
                Find an opponent and start a real-time trading battle. 
                First to double their balance wins!
              </p>
              
              {isSearching ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse"></div>
                    <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse delay-100"></div>
                    <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse delay-200"></div>
                  </div>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDark ? 'text-neutral-400' : 'text-neutral-500'
                  }`}>
                    Searching for opponents...
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleStartMatch}
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg text-base font-semibold hover:bg-primary-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-primary-500/25 flex items-center space-x-2 mx-auto"
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
              ? 'bg-neutral-800 border-neutral-700' 
              : 'bg-white border-neutral-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-base font-semibold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-neutral-900'
              }`}>
                Recent Matches
              </h3>
              <button className={`p-1 rounded transition-colors duration-300 ${
                isDark 
                  ? 'hover:bg-neutral-700 text-neutral-400' 
                  : 'hover:bg-neutral-100 text-neutral-500'
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
                    isDark 
                      ? 'bg-neutral-700 border-neutral-600' 
                      : 'bg-neutral-50 border-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        match.result === 'win' 
                          ? 'bg-success-500/20' 
                          : 'bg-danger-500/20'
                      }`}>
                        {match.result === 'win' ? (
                          <Plus className="w-3 h-3 text-success-500" />
                        ) : (
                          <Minus className="w-3 h-3 text-danger-500" />
                        )}
                      </div>
                      <div>
                        <div className={`text-sm font-medium transition-colors duration-300 ${
                          isDark ? 'text-white' : 'text-neutral-900'
                        }`}>
                          vs {match.opponent}
                        </div>
                        <div className={`text-xs transition-colors duration-300 ${
                          isDark ? 'text-neutral-400' : 'text-neutral-500'
                        }`}>
                          {match.asset}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${
                        match.result === 'win' ? 'text-success-500' : 'text-danger-500'
                      }`}>
                        {match.result === 'win' ? '+' : ''}${match.profit}
                      </div>
                      <div className={`text-xs transition-colors duration-300 ${
                        isDark ? 'text-neutral-400' : 'text-neutral-500'
                      }`}>
                        {match.duration}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`transition-colors duration-300 ${
                      isDark ? 'text-neutral-400' : 'text-neutral-500'
                    }`}>
                      {match.timestamp}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{match.duration}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Dashboard
