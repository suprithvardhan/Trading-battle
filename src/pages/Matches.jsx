import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  XCircle,
  Crown,
  Medal,
  Star,
  Target,
  Zap,
  Flame,
  Shield,
  Award,
  DollarSign,
  Timer,
  UserCheck,
  UserX,
  X,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus
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
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [showMatchDetail, setShowMatchDetail] = useState(false)
  const [showUserTrades, setShowUserTrades] = useState(true)
  const [showOpponentTrades, setShowOpponentTrades] = useState(true)

  // Fetch matches data
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true)
        const [activeRes, historyRes, statsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/matches/active', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }),
          axios.get('http://localhost:5000/api/matches/history', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }),
          axios.get('http://localhost:5000/api/dashboard/stats', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          })
        ])
        
        if (activeRes.data.success) {
          setActiveMatches(activeRes.data.matches)
        }
        
        if (historyRes.data.success) {
          setMatchHistory(historyRes.data.matches)
        }
        
        if (statsRes.data.success) {
          // Use stats from match history API (more accurate)
          const matchStats = historyRes.data.success ? historyRes.data.statistics : null
          
          if (matchStats) {
            // Use match history statistics (most accurate)
            const calculatedStats = {
              ...statsRes.data.stats,
              totalMatches: matchStats.total,
              wins: matchStats.wins,
              losses: matchStats.losses,
              draws: matchStats.draws,
              winRate: matchStats.winRate,
              currentStreak: statsRes.data.stats.currentStreak || 0
            }
            
            setStats(calculatedStats)
          } else {
            // Fallback to user stats
            const calculatedStats = {
              ...statsRes.data.stats,
              totalMatches: statsRes.data.stats.totalMatches || 0,
              wins: statsRes.data.stats.wins || 0,
              losses: statsRes.data.stats.losses || 0,
              winRate: statsRes.data.stats.winRate || 0,
              currentStreak: statsRes.data.stats.currentStreak || 0
            }
            
            setStats(calculatedStats)
          }
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
    // Get opponent username from players array with error handling
    const opponent = match.players?.find(p => p.user?._id !== user?.id)?.username || match.opponent || 'Unknown'
    const matchesSearch = opponent && opponent.toLowerCase().includes(searchQuery.toLowerCase())
    
    
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
    if (!date) return 'Unknown time'
    
    const now = new Date()
    const matchDate = new Date(date)
    const diff = now - matchDate
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  const handleMatchClick = (match) => {
    setSelectedMatch(match)
    setShowMatchDetail(true)
  }

  const closeMatchDetail = () => {
    setShowMatchDetail(false)
    setSelectedMatch(null)
  }

  const formatTradeTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getTradeIcon = (type) => {
    if (type === 'buy') {
      return <ArrowUpRight className="w-4 h-4 text-green-400" />
    } else if (type === 'sell') {
      return <ArrowDownRight className="w-4 h-4 text-red-400" />
    }
    return <Activity className="w-4 h-4 text-gray-400" />
  }

  const getTradeColor = (type, pnl) => {
    if (type === 'buy') {
      return 'text-green-400'
    } else if (type === 'sell') {
      return 'text-red-400'
    }
    return 'text-gray-400'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-white mb-2">Loading Matches</h3>
          <p className="text-slate-400">Fetching your trading history...</p>
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
              Match History & Statistics
            </h1>
            <Trophy className="w-8 h-8 text-yellow-400 ml-3" />
          </div>
          <p className="text-xl text-slate-300">
            Track your trading performance and compete with other traders
          </p>
        </motion.div>

        {/* Stats Overview */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          >
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <BarChart3 className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">
                    {stats.totalMatches || 0}
                  </div>
                  <div className="text-blue-200 text-sm">
                    Total Matches
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Trophy className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">
                    {stats.wins || 0}
                  </div>
                  <div className="text-green-200 text-sm">
                    Victories
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">
                    {stats.winRate || 0}%
                  </div>
                  <div className="text-purple-200 text-sm">
                    Win Rate
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <Flame className="w-8 h-8 text-yellow-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">
                    {stats.currentStreak || 0}
                  </div>
                  <div className="text-yellow-200 text-sm">
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
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 mb-8"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Play className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-semibold text-white">
                Active Matches
              </h2>
            </div>
            
            <div className="space-y-4">
              {activeMatches.map((match) => (
                <div key={match.id} className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                          <Play className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            vs {match.players?.find(p => p.user?._id !== user?.id)?.username || 'Unknown'}
                          </div>
                          <div className="text-sm text-slate-400">
                            {formatDuration(match.duration)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-8">
                      <div className="text-center">
                        <div className="text-sm text-slate-300">
                          Your Balance
                        </div>
                        <div className="text-green-400 font-bold text-lg">
                          ${match.players?.find(p => p.user?._id === user?.id)?.currentBalance?.toLocaleString() || '0'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-slate-300">
                          Opponent
                        </div>
                        <div className="text-blue-400 font-bold text-lg">
                          ${match.players?.find(p => p.user?._id !== user?.id)?.currentBalance?.toLocaleString() || '0'}
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
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-semibold text-white">
                Match History
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search opponents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                />
              </div>
              
              {/* Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-3 bg-slate-700/50 border border-slate-600/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
              >
                <option value="all">All Matches</option>
                <option value="win">Wins Only</option>
                <option value="loss">Losses Only</option>
              </select>
            </div>
          </div>
        

          <div className="space-y-4">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-300 mb-2">
                  {filter === 'win' ? 'No Victories Found' : 
                   filter === 'loss' ? 'No Defeats Found' : 
                   'No Matches Found'}
                </h3>
                <p className="text-slate-400">
                  {filter === 'win' ? 'You haven\'t won any matches yet.' : 
                   filter === 'loss' ? 'You haven\'t lost any matches yet.' : 
                   'No match history available.'}
                </p>
              </div>
            ) : (
              filteredHistory.map((match, index) => {
                return (
                <motion.div
                  key={match._id || match.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => handleMatchClick(match)}
                  className={`p-6 rounded-lg border transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-lg ${
                    match.result === 'win' 
                      ? 'bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500/30 hover:from-green-500/15 hover:to-green-600/15'
                      : match.result === 'loss'
                      ? 'bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500/30 hover:from-red-500/15 hover:to-red-600/15'
                      : 'bg-slate-700/50 border-slate-600/50 hover:bg-slate-700/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3">
                        {match.result === 'win' ? (
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                            <Trophy className="w-6 h-6 text-white" />
                          </div>
                        ) : match.result === 'loss' ? (
                          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                            <XCircle className="w-6 h-6 text-white" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                            <Clock className="w-6 h-6 text-white" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-white text-lg">
                            vs {match.players?.find(p => p.user?._id !== user?.id)?.username || match.opponent || 'Unknown'}
                          </div>
                          <div className="text-sm text-slate-400">
                            {match.asset || 'BTC/USD'} • {formatDuration(match.duration)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-8">
                      <div className="text-center">
                        <div className="text-sm text-slate-300 mb-1">
                          Result
                        </div>
                        <div className={`font-bold px-4 py-2 rounded-full text-sm ${
                          match.result === 'win' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : match.result === 'loss'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {match.result === 'win' ? 'Victory' : match.result === 'loss' ? 'Defeat' : 'Draw'}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-slate-300 mb-1">
                          P&L
                        </div>
                        <div className={`font-bold px-4 py-2 rounded-full text-sm ${
                          match.profit > 0 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : match.profit < 0
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {match.profit > 0 ? '+' : ''}${match.profit?.toLocaleString() || '0'}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-slate-300 mb-1">
                          Time
                        </div>
                        <div className="text-sm text-slate-400">
                          {formatTimeAgo(match.endTime || match.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
          </div>
        </motion.div>

        {/* Match Detail Modal */}
        <AnimatePresence>
          {showMatchDetail && selectedMatch && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={closeMatchDetail}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      {selectedMatch.result === 'win' ? (
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-white" />
                        </div>
                      ) : selectedMatch.result === 'loss' ? (
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                          <XCircle className="w-6 h-6 text-white" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                          <Clock className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          Match Details
                        </h2>
                        <p className="text-slate-400">
                          vs {selectedMatch.players?.find(p => p.user?._id !== user?.id)?.username || selectedMatch.opponent || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={closeMatchDetail}
                    className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors duration-200"
                  >
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                  {/* Match Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Match Stats */}
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                        Match Statistics
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Duration:</span>
                          <span className="text-white">{formatDuration(selectedMatch.duration)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Result:</span>
                          <span className={`font-semibold ${
                            selectedMatch.result === 'win' ? 'text-green-400' : 
                            selectedMatch.result === 'loss' ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {selectedMatch.result === 'win' ? 'Victory' : 
                             selectedMatch.result === 'loss' ? 'Defeat' : 'Draw'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">P&L:</span>
                          <span className={`font-semibold ${
                            selectedMatch.profit > 0 ? 'text-green-400' : 
                            selectedMatch.profit < 0 ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {selectedMatch.profit > 0 ? '+' : ''}${selectedMatch.profit?.toFixed(2) || '0'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Ended:</span>
                          <span className="text-white">{formatTimeAgo(selectedMatch.endTime)}</span>
                        </div>
                      </div>
                    </div>

                    {/* User Performance */}
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <UserCheck className="w-5 h-5 mr-2 text-green-400" />
                        Your Performance
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Starting Balance:</span>
                          <span className="text-white">${(selectedMatch.players?.find(p => p.user?._id === user?.id)?.startingBalance || selectedMatch.userBalance || 10000).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Final Balance:</span>
                          <span className="text-white">${(selectedMatch.players?.find(p => p.user?._id === user?.id)?.currentBalance || selectedMatch.userBalance || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Trades:</span>
                          <span className="text-white">{selectedMatch.players?.find(p => p.user?._id === user?.id)?.trades?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Realized P&L:</span>
                          <span className={`font-semibold ${
                            (selectedMatch.players?.find(p => p.user?._id === user?.id)?.realizedPnL || selectedMatch.profit || 0) > 0 ? 'text-green-400' : 
                            (selectedMatch.players?.find(p => p.user?._id === user?.id)?.realizedPnL || selectedMatch.profit || 0) < 0 ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {(selectedMatch.players?.find(p => p.user?._id === user?.id)?.realizedPnL || selectedMatch.profit || 0) > 0 ? '+' : ''}${(selectedMatch.players?.find(p => p.user?._id === user?.id)?.realizedPnL || selectedMatch.profit || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Opponent Performance */}
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <UserX className="w-5 h-5 mr-2 text-blue-400" />
                        Opponent Performance
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Starting Balance:</span>
                          <span className="text-white">${(selectedMatch.players?.find(p => p.user?._id !== user?.id)?.startingBalance || selectedMatch.opponentBalance || 10000).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Final Balance:</span>
                          <span className="text-white">${(selectedMatch.players?.find(p => p.user?._id !== user?.id)?.currentBalance || selectedMatch.opponentBalance || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Trades:</span>
                          <span className="text-white">{selectedMatch.players?.find(p => p.user?._id !== user?.id)?.trades?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Realized P&L:</span>
                          <span className={`font-semibold ${
                            (selectedMatch.players?.find(p => p.user?._id !== user?.id)?.realizedPnL || 0) > 0 ? 'text-green-400' : 
                            (selectedMatch.players?.find(p => p.user?._id !== user?.id)?.realizedPnL || 0) < 0 ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {(selectedMatch.players?.find(p => p.user?._id !== user?.id)?.realizedPnL || 0) > 0 ? '+' : ''}${(selectedMatch.players?.find(p => p.user?._id !== user?.id)?.realizedPnL || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trading Activity */}
                  <div className="space-y-6">
                    {/* User Trades */}
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50">
                      <div 
                        className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-700/30 transition-colors duration-200"
                        onClick={() => setShowUserTrades(!showUserTrades)}
                      >
                        <div className="flex items-center space-x-3">
                          <UserCheck className="w-6 h-6 text-green-400" />
                          <h3 className="text-xl font-semibold text-white">Your Trading Activity</h3>
                          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-sm">
                            {selectedMatch.players?.find(p => p.user?._id === user?.id)?.trades?.length || 0} trades
                          </span>
                        </div>
                        {showUserTrades ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                      </div>
                      
                      {showUserTrades && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-slate-700/50"
                        >
                          {selectedMatch.players?.find(p => p.user?._id === user?.id)?.trades?.length > 0 ? (
                            <div className="p-6">
                              <div className="space-y-3">
                                {selectedMatch.players?.find(p => p.user?._id === user?.id)?.trades?.map((trade, index) => (
                                  <div key={index} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                                    <div className="flex items-center space-x-4">
                                      {getTradeIcon(trade.type)}
                                      <div>
                                        <div className="flex items-center space-x-2">
                                          <span className="text-white font-medium">{trade.symbol}</span>
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            trade.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                          }`}>
                                            {trade.type.toUpperCase()}
                                          </span>
                                        </div>
                                        <div className="text-sm text-slate-400">
                                          {trade.quantity} @ ${trade.price?.toFixed(2)}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm text-slate-400">
                                        {formatTradeTime(trade.timestamp)}
                                      </div>
                                      {trade.pnl !== undefined && trade.pnl !== 0 && (
                                        <div className={`text-sm font-medium ${
                                          trade.pnl > 0 ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                          {trade.pnl > 0 ? '+' : ''}${trade.pnl?.toFixed(2)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-6 text-center">
                              <Activity className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                              <p className="text-slate-400">No trades recorded</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>

                    {/* Opponent Trades */}
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50">
                      <div 
                        className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-700/30 transition-colors duration-200"
                        onClick={() => setShowOpponentTrades(!showOpponentTrades)}
                      >
                        <div className="flex items-center space-x-3">
                          <UserX className="w-6 h-6 text-blue-400" />
                          <h3 className="text-xl font-semibold text-white">
                            {selectedMatch.players?.find(p => p.user?._id !== user?.id)?.username || selectedMatch.opponent || 'Opponent'}'s Trading Activity
                          </h3>
                          <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-sm">
                            {selectedMatch.players?.find(p => p.user?._id !== user?.id)?.trades?.length || 0} trades
                          </span>
                        </div>
                        {showOpponentTrades ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                      </div>
                      
                      {showOpponentTrades && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-slate-700/50"
                        >
                          {selectedMatch.players?.find(p => p.user?._id !== user?.id)?.trades?.length > 0 ? (
                            <div className="p-6">
                              <div className="space-y-3">
                                {selectedMatch.players?.find(p => p.user?._id !== user?.id)?.trades?.map((trade, index) => (
                                  <div key={index} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                                    <div className="flex items-center space-x-4">
                                      {getTradeIcon(trade.type)}
                                      <div>
                                        <div className="flex items-center space-x-2">
                                          <span className="text-white font-medium">{trade.symbol}</span>
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            trade.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                          }`}>
                                            {trade.type.toUpperCase()}
                                          </span>
                                        </div>
                                        <div className="text-sm text-slate-400">
                                          {trade.quantity} @ ${trade.price?.toFixed(2)}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm text-slate-400">
                                        {formatTradeTime(trade.timestamp)}
                                      </div>
                                      {trade.pnl !== undefined && trade.pnl !== 0 && (
                                        <div className={`text-sm font-medium ${
                                          trade.pnl > 0 ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                          {trade.pnl > 0 ? '+' : ''}${trade.pnl?.toFixed(2)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-6 text-center">
                              <Activity className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                              <p className="text-slate-400">No trades recorded</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Matches