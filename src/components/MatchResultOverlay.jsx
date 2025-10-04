import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  TrendingDown,
  Clock,
  DollarSign,
  BarChart3,
  Star,
  Zap,
  Crown
} from 'lucide-react'

const MatchResultOverlay = ({ isOpen, matchResult, onClose }) => {
  const { isDark } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showStats, setShowStats] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)

  useEffect(() => {
    if (isOpen && matchResult) {
      // Start animation sequence
      setTimeout(() => setShowStats(true), 1000)
      setTimeout(() => setAnimationComplete(true), 3000)
    }
  }, [isOpen, matchResult])

  const handleContinue = () => {
    onClose()
    navigate('/dashboard')
  }

  if (!isOpen || !matchResult) return null

  const isWinner = matchResult.winner === user?.id
  const isDraw = matchResult.winner === null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className={`relative w-full max-w-2xl mx-4 rounded-xl overflow-hidden shadow-2xl ${
            isDark ? 'bg-gray-900' : 'bg-white'
          }`}
        >
          {/* Result Header */}
          <div className={`p-6 text-center ${
            isWinner 
              ? 'bg-gradient-to-r from-green-500 to-blue-500' 
              : isDraw 
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                : 'bg-gradient-to-r from-red-500 to-pink-500'
          }`}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              className="text-4xl mb-3"
            >
              {isWinner ? '🏆' : isDraw ? '🤝' : '😔'}
            </motion.div>
            
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-3xl font-bold text-white mb-2"
            >
              {isWinner ? 'Victory!' : isDraw ? 'Draw!' : 'Defeat!'}
            </motion.h1>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-lg text-white/90"
            >
              {isWinner 
                ? 'Congratulations! You dominated the market!' 
                : isDraw 
                  ? 'Great battle! You both performed equally well!'
                  : 'Better luck next time! The market is unpredictable.'
              }
            </motion.p>
          </div>

          {/* Match Stats */}
          <div className="p-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="grid grid-cols-2 gap-4 mb-6"
            >
              {/* Your Performance */}
              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                    isDark ? 'bg-blue-600' : 'bg-blue-500'
                  } text-white`}>
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {user?.username || 'You'}
                    </h3>
                    <p className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Final Balance
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Starting</span>
                    <span className={`text-sm font-bold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>${matchResult.startingBalance?.toLocaleString() || '10,000'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Final</span>
                    <span className={`text-sm font-bold ${
                      matchResult.userBalance >= 10000 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      ${matchResult.userBalance?.toLocaleString() || '10,000'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Realized P&L</span>
                    <span className={`text-sm font-bold flex items-center ${
                      (matchResult.userRealizedPnL || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {(matchResult.userRealizedPnL || 0) >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      ${(matchResult.userRealizedPnL || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Opponent Performance */}
              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    {matchResult.opponent?.username?.charAt(0).toUpperCase() || 'O'}
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {matchResult.opponent?.username || 'Opponent'}
                    </h3>
                    <p className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Final Balance
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Starting</span>
                    <span className={`text-sm font-bold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>${matchResult.opponentStartingBalance?.toLocaleString() || '10,000'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Final</span>
                    <span className={`text-sm font-bold ${
                      matchResult.opponentBalance >= (matchResult.opponentStartingBalance || 10000) ? 'text-green-500' : 'text-red-500'
                    }`}>
                      ${matchResult.opponentBalance?.toLocaleString() || '10,000'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Realized P&L</span>
                    <span className={`text-sm font-bold flex items-center ${
                      (matchResult.opponentRealizedPnL || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {(matchResult.opponentRealizedPnL || 0) >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      ${(matchResult.opponentRealizedPnL || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Match Details */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.5 }}
              className={`p-4 rounded-lg ${
                isDark ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <Clock className={`w-5 h-5 mx-auto mb-1 ${
                    isDark ? 'text-blue-400' : 'text-blue-500'
                  }`} />
                  <p className={`text-xs ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Duration</p>
                  <p className={`text-sm font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {matchResult.duration || '5:00'}
                  </p>
                </div>
                
                <div className="text-center">
                  <BarChart3 className={`w-5 h-5 mx-auto mb-1 ${
                    isDark ? 'text-green-400' : 'text-green-500'
                  }`} />
                  <p className={`text-xs ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Your Trades</p>
                  <p className={`text-sm font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {matchResult.userTrades || 0}
                  </p>
                </div>
                
                <div className="text-center">
                  <Target className={`w-5 h-5 mx-auto mb-1 ${
                    isDark ? 'text-purple-400' : 'text-purple-500'
                  }`} />
                  <p className={`text-xs ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Opponent</p>
                  <p className={`text-sm font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {matchResult.opponentTrades || 0}
                  </p>
                </div>
                
                <div className="text-center">
                  <Trophy className={`w-5 h-5 mx-auto mb-1 ${
                    isDark ? 'text-yellow-400' : 'text-yellow-500'
                  }`} />
                  <p className={`text-xs ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Winner</p>
                  <p className={`text-sm font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {isWinner ? 'You' : isDraw ? 'Draw' : matchResult.opponent?.username || 'Opponent'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Continue Button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.8 }}
              className="mt-6 text-center"
            >
              <button
                onClick={handleContinue}
                className={`px-6 py-3 rounded-lg font-bold text-base transition-all duration-300 ${
                  isWinner
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white'
                    : isDraw
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
                      : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white'
                }`}
              >
                Continue to Dashboard
              </button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default MatchResultOverlay
