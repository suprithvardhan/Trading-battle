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
  Plus,
  Minus,
  Search,
  Filter,
  TrendingDown,
  Activity,
  Shield,
  Globe,
  ChevronRight,
  Timer,
  LineChart,
  PieChart,
  CheckCircle2,
  Flame,
  Crown,
  Medal,
  TrendingUp as TrendingUpIcon,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Star,
  ArrowRight,
  ChevronDown,
  MoreHorizontal,
  ExternalLink,
  RefreshCw,
  Settings,
  Bell,
  Menu,
  X,
  ChevronUp,
  ChevronLeft,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Check,
  AlertCircle,
  Info,
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  Lock,
  Unlock,
  Key,
  User,
  UserCheck,
  UserX,
  UserPlus,
  UserMinus,
  UserCog,
  UserSearch
} from 'lucide-react'

const Dashboard = () => {
  const { user, refreshUser } = useAuth()
  const { isDark } = useTheme()
  const [recentMatches, setRecentMatches] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showMatchmaking, setShowMatchmaking] = useState(false)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Helper function to format duration
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  }

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
    window.location.href = `/match/${match._id}`
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header Section */}
      <div className="bg-slate-900/50 border-b border-slate-800">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Trading Dashboard</h1>
              <p className="text-slate-400 text-sm">Welcome back, {user?.username}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <RefreshCw className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Balance & Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Balance Card */}
          <div className="lg:col-span-2 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-1">Total Balance</h3>
                <div className="text-3xl font-bold text-white">
                  ${stats?.balance?.toLocaleString() || user?.balance?.toLocaleString() || '10,000'}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center text-green-400 text-sm">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +2.5%
                </div>
                <div className="text-xs text-slate-400">Today</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Available for trading</span>
              <span className="text-white font-medium">$6,919.70</span>
            </div>
          </div>

          {/* Win Rate */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xs text-slate-400 uppercase tracking-wide">Win Rate</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stats?.winRate || 0}%
            </div>
            <div className="text-sm text-slate-400">
              {stats?.totalMatches || 0} matches
            </div>
            <div className="mt-3 bg-slate-800 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{width: `${stats?.winRate || 0}%`}}></div>
            </div>
          </div>

          {/* Tier Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Crown className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-xs text-slate-400 uppercase tracking-wide">Tier</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stats?.tier || user?.tier || 'Bronze'}
            </div>
            <div className="text-sm text-slate-400">
              {stats?.badges?.length || user?.badges?.length || 0} badges
            </div>
            <div className="mt-3 flex items-center text-xs text-yellow-400">
              <Star className="w-3 h-3 mr-1" />
              <span>Rising trader</span>
            </div>
          </div>
        </div>

        {/* Trading Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUpIcon className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-xs text-slate-400">Today's P&L</span>
            </div>
            <div className={`text-xl font-bold ${
              (stats?.todayPnL || 0) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {(stats?.todayPnL || 0) >= 0 ? '+' : ''}${stats?.todayPnL || 0}
            </div>
            <div className="text-xs text-slate-400">
              {stats?.todayTrades || 0} trades today
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-xs text-slate-400">Active Battles</span>
            </div>
            <div className="text-xl font-bold text-white">{stats?.activeMatches || 0}</div>
            <div className="text-xs text-slate-400">
              {stats?.activeMatches > 0 ? 'In progress' : 'Ready to trade'}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Trophy className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-xs text-slate-400">Best Streak</span>
            </div>
            <div className="text-xl font-bold text-white">{stats?.bestStreak || 0}</div>
            <div className="text-xs text-slate-400">
              {stats?.currentStreak > 0 ? `Current: ${stats.currentStreak}` : 'Wins in a row'}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-xs text-slate-400">Avg. Duration</span>
            </div>
            <div className="text-xl font-bold text-white">
              {stats?.averageDuration ? formatDuration(stats.averageDuration) : '0m 0s'}
            </div>
            <div className="text-xs text-slate-400">Per match</div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Start Trading Section */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Start Trading Battle</h2>
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live matching</span>
                </div>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-slate-800 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  <Play className="w-10 h-10 text-blue-400" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">
                  Ready to Battle?
                </h3>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                  Find an opponent and compete in real-time trading. 
                  First to double their balance wins the match.
                </p>
                
                {/* Trading Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="flex flex-col items-center p-4 rounded-lg border border-slate-700 bg-slate-800/50">
                    <Shield className="w-6 h-6 text-emerald-400 mb-2" />
                    <span className="text-sm text-slate-300 font-medium">Secure</span>
                    <span className="text-xs text-slate-400">Bank-level security</span>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg border border-slate-700 bg-slate-800/50">
                    <Zap className="w-6 h-6 text-yellow-400 mb-2" />
                    <span className="text-sm text-slate-300 font-medium">Real-time</span>
                    <span className="text-xs text-slate-400">Live market data</span>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg border border-slate-700 bg-slate-800/50">
                    <Globe className="w-6 h-6 text-cyan-400 mb-2" />
                    <span className="text-sm text-slate-300 font-medium">Global</span>
                    <span className="text-xs text-slate-400">Worldwide markets</span>
                  </div>
                </div>
                
                {isSearching ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-100"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-200"></div>
                    </div>
                    <p className="text-slate-400">Searching for opponents...</p>
                    <p className="text-xs text-slate-500">Finding the best match for your skill level</p>
                  </div>
                ) : (
                  <button
                    onClick={handleStartMatch}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25 flex items-center space-x-3 mx-auto"
                  >
                    <Search className="w-5 h-5" />
                    <span>Find Match</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Recent Matches & Activity */}
          <div className="space-y-6">
            {/* Recent Matches */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Matches</h3>
                <button className="p-1 hover:bg-slate-800 rounded transition-colors">
                  <Filter className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              
              <div className="space-y-3">
                {recentMatches.length > 0 ? (
                  recentMatches.map((match) => (
                    <div
                      key={match.id}
                      className={`p-3 rounded-lg border ${
                        match.result === 'win' 
                          ? 'bg-emerald-500/5 border-emerald-500/20' 
                          : match.result === 'loss'
                          ? 'bg-red-500/5 border-red-500/20'
                          : 'bg-slate-800/50 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            match.result === 'win' 
                              ? 'bg-emerald-500/10'
                              : match.result === 'loss'
                              ? 'bg-red-500/10'
                              : 'bg-slate-700'
                          }`}>
                            {match.result === 'win' ? (
                              <Plus className="w-4 h-4 text-emerald-400" />
                            ) : match.result === 'loss' ? (
                              <Minus className="w-4 h-4 text-red-400" />
                            ) : (
                              <Clock className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">
                              vs {match.opponent || 'Unknown'}
                            </div>
                            <div className="text-xs text-slate-400">
                              {match.asset || 'BTC/USD'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${
                            match.result === 'win' 
                              ? 'text-emerald-400'
                              : match.result === 'loss'
                              ? 'text-red-400'
                              : 'text-slate-400'
                          }`}>
                            {match.result === 'win' ? '+' : ''}${match.profit?.toLocaleString() || '0'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>
                          {match.endTime ? formatTimeAgo(match.endTime) : match.timestamp}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Timer className="w-3 h-3" />
                          <span>{match.duration || '5m'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-slate-800 rounded-lg mx-auto mb-3 flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-400 text-sm">No matches yet</p>
                    <p className="text-xs text-slate-500 mt-1">Start your first battle!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Award className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">Trading Academy</div>
                      <div className="text-xs text-slate-400">Learn strategies</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <LineChart className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">Market Analysis</div>
                      <div className="text-xs text-slate-400">Real-time insights</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">Leaderboard</div>
                      <div className="text-xs text-slate-400">Top traders</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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