import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import api from '../utils/api'
import { 
  User, 
  Mail, 
  Trophy, 
  TrendingUp, 
  Award,
  Calendar,
  Target,
  BarChart3,
  Edit,
  Save,
  X,
  DollarSign,
  TrendingDown,
  Clock,
  Star,
  Shield,
  Zap,
  Globe,
  Activity,
  PieChart,
  LineChart,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Settings,
  Bell,
  Key,
  Lock,
  Unlock,
  UserCheck,
  Award as AwardIcon,
  Trophy as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Calendar as CalendarIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Activity as ActivityIcon,
  Target as TargetIcon,
  Award as AwardIcon2,
  Trophy as TrophyIcon2,
  TrendingUp as TrendingUpIcon2,
  TrendingDown as TrendingDownIcon2,
  Calendar as CalendarIcon2,
  BarChart as BarChartIcon2,
  PieChart as PieChartIcon2,
  LineChart as LineChartIcon2,
  Activity as ActivityIcon2,
  Target as TargetIcon2,
  Award as AwardIcon3,
  Trophy as TrophyIcon3,
  TrendingUp as TrendingUpIcon3,
  TrendingDown as TrendingDownIcon3,
  Calendar as CalendarIcon3,
  BarChart as BarChartIcon3,
  PieChart as PieChartIcon3,
  LineChart as LineChartIcon3,
  Activity as ActivityIcon3,
  Target as TargetIcon3,
  Award as AwardIcon4,
  Trophy as TrophyIcon4,
  TrendingUp as TrendingUpIcon4,
  TrendingDown as TrendingDownIcon4,
  Calendar as CalendarIcon4,
  BarChart as BarChartIcon4,
  PieChart as PieChartIcon4,
  LineChart as LineChartIcon4,
  Activity as ActivityIcon4,
  Target as TargetIcon4,
  Award as AwardIcon5,
  Trophy as TrophyIcon5,
  TrendingUp as TrendingUpIcon5,
  TrendingDown as TrendingDownIcon5,
  Calendar as CalendarIcon5,
  BarChart as BarChartIcon5,
  PieChart as PieChartIcon5,
  LineChart as LineChartIcon5,
  Activity as ActivityIcon5,
  Target as TargetIcon5,
  Award as AwardIcon6,
  Trophy as TrophyIcon6,
  TrendingUp as TrendingUpIcon6,
  TrendingDown as TrendingDownIcon6,
  Calendar as CalendarIcon6,
  BarChart as BarChartIcon6,
  PieChart as PieChartIcon6,
  LineChart as LineChartIcon6,
  Activity as ActivityIcon6,
  Target as TargetIcon6,
  Award as AwardIcon7,
  Trophy as TrophyIcon7,
  TrendingUp as TrendingUpIcon7,
  TrendingDown as TrendingDownIcon7,
  Calendar as CalendarIcon7,
  BarChart as BarChartIcon7,
  PieChart as PieChartIcon7,
  LineChart as LineChartIcon7,
  Activity as ActivityIcon7,
  Target as TargetIcon7,
  Award as AwardIcon8,
  Trophy as TrophyIcon8,
  TrendingUp as TrendingUpIcon8,
  TrendingDown as TrendingDownIcon8,
  Calendar as CalendarIcon8,
  BarChart as BarChartIcon8,
  PieChart as PieChartIcon8,
  LineChart as LineChartIcon8,
  Activity as ActivityIcon8,
  Target as TargetIcon8,
  Award as AwardIcon9,
  Trophy as TrophyIcon9,
  TrendingUp as TrendingUpIcon9,
  TrendingDown as TrendingDownIcon9,
  Calendar as CalendarIcon9,
  BarChart as BarChartIcon9,
  PieChart as PieChartIcon9,
  LineChart as LineChartIcon9,
  Activity as ActivityIcon9,
  Target as TargetIcon9,
  Award as AwardIcon10,
  Trophy as TrophyIcon10,
  TrendingUp as TrendingUpIcon10,
  TrendingDown as TrendingDownIcon10,
  Calendar as CalendarIcon10,
  BarChart as BarChartIcon10,
  PieChart as PieChartIcon10,
  LineChart as LineChartIcon10,
  Activity as ActivityIcon10,
  Target as TargetIcon10
} from 'lucide-react'

const Profile = () => {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [activeTab, setActiveTab] = useState('overview')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showBalance, setShowBalance] = useState(true)
  const [calendarView, setCalendarView] = useState('pnl') // 'pnl' or 'wins'
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [monthlyData, setMonthlyData] = useState([])
  const [achievements, setAchievements] = useState([])

  useEffect(() => {
    fetchProfileData()
  }, [])

  useEffect(() => {
    fetchMonthlyData()
  }, [currentMonth])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/profile/stats')
      
      if (response.data.success) {
        const { user: userData, stats: statsData, achievements: achievementsData, monthlyData: monthlyDataFromAPI } = response.data.data
        
        setStats({
          ...statsData,
          user: userData
        })
        setAchievements(achievementsData)
        setMonthlyData(monthlyDataFromAPI)
      }
    } catch (error) {
      console.error('Error fetching profile data:', error)
      // Fallback to mock data for development
      setStats({
        totalTrades: statsData?.totalTrades || 0,
        winRate: statsData?.winRate || 0,
        totalPnL: statsData?.totalPnL || 0,
        monthlyPnL: statsData?.monthlyPnL || 0,
        weeklyPnL: statsData?.weeklyPnL || 0,
        dailyPnL: statsData?.dailyPnL || 0,
        bestWin: statsData?.bestWin || 0,
        worstLoss: statsData?.worstLoss || 0,
        avgWin: statsData?.avgWin || 0,
        avgLoss: statsData?.avgLoss || 0,
        profitFactor: statsData?.profitFactor || 0,
        sharpeRatio: statsData?.sharpeRatio || 0,
        maxDrawdown: statsData?.maxDrawdown || 0,
        consecutiveWins: statsData?.consecutiveWins || 0,
        consecutiveLosses: statsData?.consecutiveLosses || 0,
        totalVolume: statsData?.totalVolume || 0,
        avgTradeDuration: statsData?.avgTradeDuration || 0,
        user: {
          username: user?.username,
          email: user?.email,
          balance: user?.balance,
          tier: user?.tier || 'Bronze',
          badges: user?.badges || []
        }
      })
      setAchievements([
        { name: 'First Win', description: 'Win your first trade', icon: 'trending-up', category: 'profit', rarity: 'common' },
        { name: 'Hot Streak', description: 'Win 3 trades in a row', icon: 'flame', category: 'streak', rarity: 'common' },
        { name: 'Profit Maker', description: 'Make $1,000 total profit', icon: 'dollar-sign', category: 'profit', rarity: 'uncommon' }
      ])
      setMonthlyData(generateMockMonthlyData())
    } finally {
      setLoading(false)
    }
  }

  const fetchMonthlyData = async () => {
    try {
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth() + 1
      
      const response = await api.get(`/profile/monthly/${year}/${month}`)
      
      if (response.data.success) {
        setMonthlyData(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching monthly data:', error)
      setMonthlyData(generateMockMonthlyData())
    }
  }

  const generateMockMonthlyData = () => {
    const data = []
    const today = new Date()
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      const isFuture = date > today
      
      if (isFuture) {
        data.push({ day, date, pnl: null, trades: null, wins: null, losses: null, isFuture: true })
      } else if (isWeekend) {
        data.push({ day, date, pnl: 0, trades: 0, wins: 0, losses: 0, isWeekend: true })
      } else {
        const pnl = Math.random() > 0.4 ? 
          (Math.random() * 200 - 50) : 
          (Math.random() * 100 - 25)
        const trades = Math.floor(Math.random() * 8) + 1
        const wins = Math.floor(Math.random() * trades)
        const losses = trades - wins
        data.push({ 
          day, 
          date, 
          pnl: Math.round(pnl * 100) / 100, 
          trades,
          wins,
          losses,
          isWeekend: false,
          isFuture: false
        })
      }
    }
    return data
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getPnLColor = (pnl) => {
    if (pnl > 0) return 'text-green-400'
    if (pnl < 0) return 'text-red-400'
    return 'text-slate-400'
  }

  const getPnLBackground = (pnl) => {
    if (pnl > 0) return 'bg-green-500/10 border-green-500/20'
    if (pnl < 0) return 'bg-red-500/10 border-red-500/20'
    return 'bg-slate-800/50 border-slate-700'
  }

  const getWinLossBackground = (wins, losses) => {
    if (wins > losses) return 'bg-green-500/10 border-green-500/20'
    if (losses > wins) return 'bg-red-500/10 border-red-500/20'
    return 'bg-slate-800/50 border-slate-700'
  }

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 font-medium">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-800">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Profile & Analytics</h1>
              <p className="text-slate-400 text-sm">Trading performance and statistics</p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                {showBalance ? <Eye className="w-4 h-4 text-slate-400" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* User Info Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                {stats?.user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">{stats?.user?.username}</h2>
              <p className="text-slate-400 mb-2">{stats?.user?.email}</p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-slate-300">{stats?.user?.tier || 'Bronze'} Trader</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-slate-300">Member since {new Date().getFullYear()}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400 mb-1">Total Balance</div>
              <div className="text-3xl font-bold text-white">
                {showBalance ? formatCurrency(stats?.user?.balance || 10000) : '••••••'}
              </div>
              <div className="flex items-center text-sm text-green-400">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>+{stats?.totalPnL || 0}% all time</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xs text-slate-400 uppercase tracking-wide">Win Rate</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stats?.winRate || 0}%</div>
            <div className="text-sm text-slate-400">{stats?.totalTrades || 0} total trades</div>
            <div className="mt-3 bg-slate-800 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{width: `${stats?.winRate || 0}%`}}></div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-xs text-slate-400 uppercase tracking-wide">Total P&L</span>
            </div>
            <div className={`text-2xl font-bold mb-1 ${getPnLColor(stats?.totalPnL || 0)}`}>
              {showBalance ? formatCurrency(stats?.totalPnL || 0) : '••••••'}
            </div>
            <div className="text-sm text-slate-400">All time</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-xs text-slate-400 uppercase tracking-wide">Profit Factor</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stats?.profitFactor || 0}</div>
            <div className="text-sm text-slate-400">Risk adjusted</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-xs text-slate-400 uppercase tracking-wide">Best Streak</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stats?.consecutiveWins || 0}</div>
            <div className="text-sm text-slate-400">Wins in a row</div>
          </div>
        </div>

        {/* Monthly Calendar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Monthly Performance</h3>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </button>
              <span className="text-white font-medium">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Calendar Toggle */}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-slate-800 rounded-lg p-1 flex">
              <button
                onClick={() => setCalendarView('pnl')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  calendarView === 'pnl' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                P&L
              </button>
              <button
                onClick={() => setCalendarView('wins')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  calendarView === 'wins' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Win/Loss
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm text-slate-400 py-2">
                {day}
              </div>
            ))}
            {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }, (_, i) => (
              <div key={`empty-${i}`} className="h-12"></div>
            ))}
            {monthlyData?.map((dayData) => (
              <motion.div
                key={dayData.day}
                whileHover={{ scale: 1.05 }}
                className={`h-12 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  dayData.isFuture 
                    ? 'bg-slate-800/30 border-slate-700 text-slate-500' 
                    : dayData.isWeekend
                    ? 'bg-slate-800/50 border-slate-700 text-slate-400'
                    : calendarView === 'pnl' 
                      ? getPnLBackground(dayData.pnl)
                      : getWinLossBackground(dayData.wins, dayData.losses)
                }`}
              >
                <div className="text-xs font-medium">{dayData.day}</div>
                {!dayData.isFuture && !dayData.isWeekend && (
                  <div className={`text-xs ${
                    calendarView === 'pnl' 
                      ? getPnLColor(dayData.pnl)
                      : dayData.wins > dayData.losses 
                        ? 'text-green-400' 
                        : dayData.losses > dayData.wins 
                          ? 'text-red-400' 
                          : 'text-slate-400'
                  }`}>
                    {calendarView === 'pnl' 
                      ? `${dayData.pnl > 0 ? '+' : ''}${dayData.pnl.toFixed(4)}`
                      : `${dayData.wins}W/${dayData.losses}L`
                    }
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 text-sm">
            {calendarView === 'pnl' ? (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500/20 border border-green-500/40 rounded"></div>
                  <span className="text-slate-400">Profit</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500/20 border border-red-500/40 rounded"></div>
                  <span className="text-slate-400">Loss</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-slate-800/50 border border-slate-700 rounded"></div>
                  <span className="text-slate-400">No trades</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-slate-800/30 border border-slate-700 rounded"></div>
                  <span className="text-slate-400">Future</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500/20 border border-green-500/40 rounded"></div>
                  <span className="text-slate-400">More wins</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500/20 border border-red-500/40 rounded"></div>
                  <span className="text-slate-400">More losses</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-slate-800/50 border border-slate-700 rounded"></div>
                  <span className="text-slate-400">No trades</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-slate-800/30 border border-slate-700 rounded"></div>
                  <span className="text-slate-400">Future</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trading Statistics */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Trading Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Trades</span>
                <span className="text-white font-medium">{stats?.totalTrades || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Average Win</span>
                <span className="text-green-400 font-medium">{formatCurrency(stats?.avgWin || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Average Loss</span>
                <span className="text-red-400 font-medium">{formatCurrency(stats?.avgLoss || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Best Win</span>
                <span className="text-green-400 font-medium">{formatCurrency(stats?.bestWin || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Worst Loss</span>
                <span className="text-red-400 font-medium">{formatCurrency(stats?.worstLoss || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Max Drawdown</span>
                <span className="text-red-400 font-medium">{stats?.maxDrawdown || 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Avg Trade Duration</span>
                <span className="text-white font-medium">{formatDuration(stats?.avgTradeDuration || 0)}</span>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Achievements</h3>
            <div className="grid grid-cols-1 gap-3">
              {achievements?.map((achievement, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-lg">
                  <div className={`p-2 rounded-lg ${
                    achievement.rarity === 'legendary' ? 'bg-yellow-500/10' :
                    achievement.rarity === 'epic' ? 'bg-purple-500/10' :
                    achievement.rarity === 'rare' ? 'bg-blue-500/10' :
                    achievement.rarity === 'uncommon' ? 'bg-green-500/10' :
                    'bg-slate-500/10'
                  }`}>
                    <Award className={`w-4 h-4 ${
                      achievement.rarity === 'legendary' ? 'text-yellow-400' :
                      achievement.rarity === 'epic' ? 'text-purple-400' :
                      achievement.rarity === 'rare' ? 'text-blue-400' :
                      achievement.rarity === 'uncommon' ? 'text-green-400' :
                      'text-slate-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{achievement.name}</div>
                    <div className="text-xs text-slate-400">{achievement.description}</div>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    achievement.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-400' :
                    achievement.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400' :
                    achievement.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400' :
                    achievement.rarity === 'uncommon' ? 'bg-green-500/20 text-green-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {achievement.rarity}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile