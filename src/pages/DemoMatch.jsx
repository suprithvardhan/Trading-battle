import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'
import MatchHeader from '../components/MatchHeader'
import TradingChart from '../components/TradingChart'
import TradingPanel from '../components/TradingPanel'
import OrderManagement from '../components/OrderManagement'
import TickerSelector from '../components/TickerSelector'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Clock,
  Target,
  Zap
} from 'lucide-react'

const DemoMatch = () => {
  const { isDark } = useTheme()
  const [selectedTicker, setSelectedTicker] = useState('BTCUSDT')
  const [showTickerSelector, setShowTickerSelector] = useState(true)
  const [matchData, setMatchData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Mock match data
  useEffect(() => {
    const mockMatchData = {
      id: 'demo_match_123',
      status: 'active',
      duration: 5,
      startTime: new Date(),
      players: [
        {
          user: 'demo_user_1',
          username: 'DemoTrader',
          startingBalance: 10000,
          currentBalance: 12500,
          profit: 2500,
          profitPercent: 25
        },
        {
          user: 'demo_user_2', 
          username: 'CryptoKing',
          startingBalance: 10000,
          currentBalance: 8500,
          profit: -1500,
          profitPercent: -15
        }
      ],
      rules: {
        maxTrades: 50,
        allowedAssets: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT'],
        leverage: 1
      }
    }
    
    setMatchData(mockMatchData)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Loading demo match...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen pt-20 transition-colors duration-300 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Demo Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-lg border-2 border-dashed ${
            isDark 
              ? 'bg-blue-900/20 border-blue-500/50 text-blue-300' 
              : 'bg-blue-50 border-blue-300 text-blue-700'
          }`}
        >
          <div className="flex items-center space-x-3">
            <Zap className="w-6 h-6" />
            <div>
              <h3 className="font-bold text-lg">Demo Match Mode</h3>
              <p className="text-sm">
                This is a demonstration of the match interface with mock data. 
                All trading actions are simulated and won't affect real balances.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Match Header */}
        <MatchHeader 
          matchData={matchData}
          isDemo={true}
        />

        {/* Main Trading Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
          {/* Left Sidebar - Ticker Selector */}
          <div className="lg:col-span-1">
            <TickerSelector
              selectedTicker={selectedTicker}
              onTickerSelect={setSelectedTicker}
              isOpen={showTickerSelector}
              onToggle={() => setShowTickerSelector(!showTickerSelector)}
              isDemo={true}
            />
          </div>

          {/* Center - Chart */}
          <div className="lg:col-span-2">
            <div className={`rounded-lg border transition-colors duration-300 ${
              isDark 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {selectedTicker} Chart
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm transition-colors duration-300 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Demo Mode
                    </span>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
              <div className="h-96">
                <TradingChart
                  ticker={selectedTicker}
                  isDemo={true}
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar - Trading Panel */}
          <div className="lg:col-span-1">
            <TradingPanel
              ticker={selectedTicker}
              matchData={matchData}
              isDemo={true}
            />
          </div>
        </div>

        {/* Bottom - Order Management */}
        <div className="mt-6">
          <OrderManagement
            activeTab="current"
            onTabChange={() => {}}
            orders={{
              current: [
                {
                  id: 'demo_order_1',
                  symbol: 'BTCUSDT',
                  type: 'buy',
                  quantity: 0.1,
                  price: 45000,
                  totalValue: 4500,
                  status: 'filled',
                  executedAt: new Date(),
                  createdAt: new Date()
                },
                {
                  id: 'demo_order_2',
                  symbol: 'ETHUSDT',
                  type: 'sell',
                  quantity: 2,
                  price: 3000,
                  totalValue: 6000,
                  status: 'filled',
                  executedAt: new Date(),
                  createdAt: new Date()
                }
              ],
              open: [],
              history: []
            }}
            matchId={matchData.id}
          />
        </div>

        {/* Demo Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`p-6 rounded-lg border transition-colors duration-300 ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h4 className={`text-lg font-semibold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Your Performance
                </h4>
                <p className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Current match stats
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>Balance:</span>
                <span className={`font-semibold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>$12,500</span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>Profit:</span>
                <span className="font-semibold text-green-500">+$2,500 (+25%)</span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>Trades:</span>
                <span className={`font-semibold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>15</span>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-lg border transition-colors duration-300 ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Target className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h4 className={`text-lg font-semibold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Match Info
                </h4>
                <p className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Demo match details
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>Duration:</span>
                <span className={`font-semibold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>5 minutes</span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>Time Left:</span>
                <span className="font-semibold text-orange-500">2m 30s</span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>Max Trades:</span>
                <span className={`font-semibold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>50</span>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-lg border transition-colors duration-300 ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h4 className={`text-lg font-semibold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Opponent
                </h4>
                <p className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  CryptoKing
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>Balance:</span>
                <span className={`font-semibold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>$8,500</span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>Profit:</span>
                <span className="font-semibold text-red-500">-$1,500 (-15%)</span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>Trades:</span>
                <span className={`font-semibold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>12</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DemoMatch
