import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import axios from 'axios'
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Users,
  BarChart3,
  Calendar,
  Filter,
  Search,
  Play,
  Pause,
  CheckCircle,
  XCircle
} from 'lucide-react'

const Matches = () => {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [activeMatches, setActiveMatches] = useState([])
  const [matchHistory, setMatchHistory] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, wins, losses
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch matches data
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true)
        const [activeRes, historyRes, statsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/matches/active'),
          axios.get('http://localhost:5000/api/matches/history'),
          axios.get('http://localhost:5000/api/dashboard/stats')
        ])
        
        if (activeRes.data.success) {
          setActiveMatches(activeRes.data.matches)
        }
        
        if (historyRes.data.success) {
          setMatchHistory(historyRes.data.matches)
        }
        
        if (statsRes.data.success) {
          setStats(statsRes.data.stats)
        }
      } catch (error) {
        console.error('Error fetching matches:', error)
        // Fallback to mock data
        const mockActiveMatches = [
          {
            id: 1,
            opponent: 'CryptoKing_99',
            status: 'active',
            duration: '2m 30s',
            startTime: new Date(Date.now() - 150000),
            userBalance: 12500,
            opponentBalance: 11800
          }
        ]
        
        const mockHistory = [
          {
            id: 2,
            opponent: 'CryptoMaster_42',
            result: 'win',
            profit: 1250,
            duration: '4m 32s',
            endTime: new Date(Date.now() - 7200000),
            asset: 'BTC/USD'
          },
          {
            id: 3,
            opponent: 'CryptoPro_88',
            result: 'loss',
            profit: -800,
            duration: '6m 15s',
            endTime: new Date(Date.now() - 86400000),
            asset: 'ETH/USD'
          },
          {
            id: 4,
            opponent: 'TradingWizard_77',
            result: 'win',
            profit: 2100,
            duration: '3m 45s',
            endTime: new Date(Date.now() - 172800000),
            asset: 'BNB/USD'
          }
        ]
        
        setActiveMatches(mockActiveMatches)
        setMatchHistory(mockHistory)
        setStats({
          totalMatches: 15,
          wins: 10,
          losses: 5,
          winRate: 66.7,
          totalProfit: 5500,
          bestStreak: 5,
          currentStreak: 2
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [])

  const filteredHistory = matchHistory.filter(match => {
    const matchesSearch = match.opponent.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === 'all' || match.result === filter
    return matchesSearch && matchesFilter
  })

  const getResultIcon = (result) => {
    switch (result) {
      case 'win':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'loss':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getResultColor = (result) => {
    switch (result) {
      case 'win':
        return 'text-green-500'
      case 'loss':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const formatDuration = (duration) => {
    if (typeof duration === 'string') return duration
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    return `${minutes}m ${seconds}s`
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
            Loading matches...
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
            Matches & Statistics
          </h1>
          <p className={`text-sm transition-colors duration-300 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Track your trading performance and match history
          </p>
        </div>
      </motion.div>

      {/* Stats Overview */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className={`p-4 rounded-lg border transition-colors duration-300 ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8 text-blue-500" />
              <div>
                <div className={`text-2xl font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {stats.totalMatches}
                </div>
                <div className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Total Matches
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
              <Trophy className="w-8 h-8 text-green-500" />
              <div>
                <div className={`text-2xl font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {stats.wins}
                </div>
                <div className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Wins
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
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <div>
                <div className={`text-2xl font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {stats.winRate}%
                </div>
                <div className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Win Rate
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
              <TrendingUp className="w-8 h-8 text-yellow-500" />
              <div>
                <div className={`text-2xl font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {stats.currentStreak}
                </div>
                <div className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Current Streak
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Active Matches */}
      {activeMatches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`p-6 rounded-lg border transition-colors duration-300 ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}
        >
          <h2 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Active Matches
          </h2>
          
          <div className="space-y-4">
            {activeMatches.map((match) => (
              <div key={match.id} className={`p-4 rounded-lg border transition-colors duration-300 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Play className="w-5 h-5 text-green-500" />
                      <span className={`font-medium transition-colors duration-300 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        vs {match.opponent}
                      </span>
                    </div>
                    <div className={`text-sm transition-colors duration-300 ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {formatDuration(match.duration)}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className={`text-sm font-medium transition-colors duration-300 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        Your Balance
                      </div>
                      <div className="text-green-500 font-bold">
                        ${match.userBalance?.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-medium transition-colors duration-300 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        Opponent
                      </div>
                      <div className="text-blue-500 font-bold">
                        ${match.opponentBalance?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Match History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className={`p-6 rounded-lg border transition-colors duration-300 ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-lg font-semibold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Match History
          </h2>
          
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Search opponents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 pr-4 py-2 rounded-lg border transition-colors duration-300 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
            
            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg border transition-colors duration-300 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Matches</option>
              <option value="win">Wins Only</option>
              <option value="loss">Losses Only</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-3">
          {filteredHistory.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`p-4 rounded-lg border transition-colors duration-300 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getResultIcon(match.result)}
                  <div>
                    <div className={`font-medium transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      vs {match.opponent}
                    </div>
                    <div className={`text-sm transition-colors duration-300 ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {match.asset} • {formatDuration(match.duration)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className={`text-sm transition-colors duration-300 ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Result
                    </div>
                    <div className={`font-bold ${getResultColor(match.result)}`}>
                      {match.result === 'win' ? 'Won' : 'Lost'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-sm transition-colors duration-300 ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      P&L
                    </div>
                    <div className={`font-bold ${
                      match.profit > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {match.profit > 0 ? '+' : ''}${match.profit}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-sm transition-colors duration-300 ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Time
                    </div>
                    <div className={`text-sm transition-colors duration-300 ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {formatTimeAgo(match.endTime)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default Matches