import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { 
  Play, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Target,
  Users,
  Search,
  Filter,
  Calendar,
  DollarSign
} from 'lucide-react'

const Matches = () => {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [matches, setMatches] = useState([])
  const [filter, setFilter] = useState('all')
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    // Mock matches data
    const mockMatches = [
      {
        id: 1,
        opponent: 'CryptoKing_99',
        result: 'win',
        profit: 1250,
        duration: '4m 32s',
        timestamp: '2 hours ago',
        asset: 'BTC/USD',
        status: 'completed'
      },
      {
        id: 2,
        opponent: 'StockMaster_42',
        result: 'loss',
        profit: -800,
        duration: '6m 15s',
        timestamp: '1 day ago',
        asset: 'AAPL',
        status: 'completed'
      },
      {
        id: 3,
        opponent: 'TradingPro_88',
        result: 'win',
        profit: 2100,
        duration: '3m 45s',
        timestamp: '2 days ago',
        asset: 'TSLA',
        status: 'completed'
      },
      {
        id: 4,
        opponent: 'MarketWizard_77',
        result: 'win',
        profit: 1800,
        duration: '5m 12s',
        timestamp: '3 days ago',
        asset: 'GOOGL',
        status: 'completed'
      },
      {
        id: 5,
        opponent: 'FinanceGuru_55',
        result: 'loss',
        profit: -1200,
        duration: '7m 30s',
        timestamp: '1 week ago',
        asset: 'MSFT',
        status: 'completed'
      }
    ]
    setMatches(mockMatches)
  }, [])

  const handleStartMatch = () => {
    setIsSearching(true)
    // Simulate matchmaking
    setTimeout(() => {
      setIsSearching(false)
    }, 3000)
  }

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true
    if (filter === 'wins') return match.result === 'win'
    if (filter === 'losses') return match.result === 'loss'
    return true
  })

  const winCount = matches.filter(match => match.result === 'win').length
  const lossCount = matches.filter(match => match.result === 'loss').length
  const totalProfit = matches.reduce((sum, match) => sum + match.profit, 0)

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
            Matches
          </h1>
          <p className={`mt-2 transition-colors duration-300 ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Track your trading battles and performance
          </p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div className={`p-6 rounded-2xl border transition-colors duration-300 ${
          isDark 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <Target className="w-6 h-6 text-green-500" />
            </div>
            <span className={`text-sm font-medium transition-colors duration-300 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Total Matches
            </span>
          </div>
          <div className={`text-3xl font-bold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            {matches.length}
          </div>
        </div>

        <div className={`p-6 rounded-2xl border transition-colors duration-300 ${
          isDark 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
            <span className={`text-sm font-medium transition-colors duration-300 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Wins
            </span>
          </div>
          <div className={`text-3xl font-bold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            {winCount}
          </div>
        </div>

        <div className={`p-6 rounded-2xl border transition-colors duration-300 ${
          isDark 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-500/20 rounded-xl">
              <TrendingDown className="w-6 h-6 text-red-500" />
            </div>
            <span className={`text-sm font-medium transition-colors duration-300 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Losses
            </span>
          </div>
          <div className={`text-3xl font-bold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            {lossCount}
          </div>
        </div>

        <div className={`p-6 rounded-2xl border transition-colors duration-300 ${
          isDark 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <DollarSign className="w-6 h-6 text-purple-500" />
            </div>
            <span className={`text-sm font-medium transition-colors duration-300 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Total P&L
            </span>
          </div>
          <div className={`text-3xl font-bold transition-colors duration-300 ${
            totalProfit >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {totalProfit >= 0 ? '+' : ''}${totalProfit.toLocaleString()}
          </div>
        </div>
      </motion.div>

      {/* Start New Match */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={`p-8 rounded-2xl border transition-colors duration-300 ${
          isDark 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center">
            <Play className="w-10 h-10 text-white" />
          </div>
          <h2 className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Ready for Another Battle?
          </h2>
          <p className={`mb-8 transition-colors duration-300 ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Challenge another trader and prove your skills
          </p>
          
          {isSearching ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse delay-100"></div>
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse delay-200"></div>
              </div>
              <p className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Searching for opponents...
              </p>
            </div>
          ) : (
            <button
              onClick={handleStartMatch}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25 flex items-center space-x-3 mx-auto"
            >
              <Search className="w-5 h-5" />
              <span>Find Match</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Match History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className={`rounded-2xl border transition-colors duration-300 ${
          isDark 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b transition-colors duration-300 ${
          isDark ? 'border-slate-700' : 'border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-semibold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Match History
            </h3>
            <div className="flex space-x-2">
              {['all', 'wins', 'losses'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-300 ${
                    filter === filterType
                      ? 'bg-blue-600 text-white'
                      : isDark
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Match List */}
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {filteredMatches.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`px-6 py-4 hover:transition-colors duration-300 ${
                isDark 
                  ? 'hover:bg-slate-700' 
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    match.result === 'win' 
                      ? 'bg-green-500/20' 
                      : 'bg-red-500/20'
                  }`}>
                    {match.result === 'win' ? (
                      <TrendingUp className="w-6 h-6 text-green-500" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                  <div>
                    <div className={`font-medium transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      vs {match.opponent}
                    </div>
                    <div className={`text-sm transition-colors duration-300 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {match.asset} • {match.timestamp}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className={`font-semibold ${
                      match.result === 'win' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {match.result === 'win' ? '+' : ''}${match.profit}
                    </div>
                    <div className={`text-sm transition-colors duration-300 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {match.duration}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    match.result === 'win'
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-red-500/20 text-red-500'
                  }`}>
                    {match.result === 'win' ? 'Victory' : 'Defeat'}
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
