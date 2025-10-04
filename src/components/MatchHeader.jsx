import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'
import { 
  X, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Trophy,
  Users
} from 'lucide-react'

const MatchHeader = ({ matchData, userPlayer, opponentPlayer, onQuit, optimisticBalance }) => {
  const { isDark } = useTheme()
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [matchProgress, setMatchProgress] = useState(0)

  // Calculate time remaining
  useEffect(() => {
    if (matchData?.startTime && matchData?.duration) {
      const startTime = new Date(matchData.startTime).getTime()
      const durationMs = matchData.duration * 60 * 1000 // Convert minutes to milliseconds
      const endTime = startTime + durationMs
      
      const updateTimer = () => {
        const now = Date.now()
        const remaining = Math.max(0, endTime - now)
        setTimeRemaining(remaining)
        
        const elapsed = now - startTime
        const progress = Math.min(100, (elapsed / durationMs) * 100)
        setMatchProgress(progress)
      }

      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    }
  }, [matchData])

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-red-500'
    if (progress >= 60) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getTimeColor = (timeRemaining) => {
    const minutes = Math.floor(timeRemaining / 60000)
    if (minutes < 1) return 'text-red-500'
    if (minutes < 2) return 'text-yellow-500'
    return 'text-green-500'
  }

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`border-b transition-colors duration-300 ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left - Quit Button */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onQuit}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-300 ${
                isDark 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-red-100 hover:bg-red-200 text-red-700'
              }`}
            >
              <X className="w-4 h-4" />
              <span className="font-medium">Quit Match</span>
            </button>

            {/* Match Status */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium transition-colors duration-300 ${
              matchData?.status === 'active'
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                matchData?.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              <span>{matchData?.status === 'active' ? 'Live' : 'Waiting'}</span>
            </div>
          </div>

          {/* Center - Match Progress */}
          <div className="flex-1 max-w-4xl mx-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Match Progress
                </span>
              </div>
              <div className={`flex items-center space-x-2 text-sm font-medium transition-colors duration-300 ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <Clock className="w-4 h-4" />
                <span className={getTimeColor(timeRemaining)}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className={`w-full h-2 rounded-full overflow-hidden transition-colors duration-300 ${
              isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <motion.div
                className={`h-full ${getProgressColor(matchProgress)}`}
                initial={{ width: 0 }}
                animate={{ width: `${matchProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Right - Match Info */}
          <div className="flex items-center space-x-4">
            <div className={`text-sm transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Duration: {matchData?.duration}m
            </div>
            <div className={`text-sm transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Max Trades: {matchData?.rules?.maxTrades || 50}
            </div>
          </div>
        </div>

        {/* Player Progress Bars */}
        <div className="mt-3 grid grid-cols-2 gap-4">
          {/* User Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {userPlayer?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className={`font-medium transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {userPlayer?.username || 'You'}
                </span>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  ${(optimisticBalance !== null ? optimisticBalance : userPlayer?.currentBalance || 0).toLocaleString()}
                </div>
                <div className={`text-sm flex items-center space-x-1 ${
                  (userPlayer?.profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {(userPlayer?.profit || 0) >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>
                    {(userPlayer?.profit || 0) >= 0 ? '+' : ''}${userPlayer?.profit || 0}
                  </span>
                </div>
              </div>
            </div>
            
            {/* User Progress Bar */}
            <div className={`w-full h-2 rounded-full overflow-hidden transition-colors duration-300 ${
              isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ 
                  width: `${Math.min(100, ((optimisticBalance !== null ? optimisticBalance : userPlayer?.currentBalance || 0) / 10000) * 100)}%` 
                }}
              />
            </div>
          </div>

          {/* Opponent Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {opponentPlayer?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className={`font-medium transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {opponentPlayer?.username || 'Opponent'}
                </span>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  ${opponentPlayer?.currentBalance?.toLocaleString() || '0'}
                </div>
                <div className={`text-sm flex items-center space-x-1 ${
                  (opponentPlayer?.profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {(opponentPlayer?.profit || 0) >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>
                    {(opponentPlayer?.profit || 0) >= 0 ? '+' : ''}${opponentPlayer?.profit || 0}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Opponent Progress Bar */}
            <div className={`w-full h-2 rounded-full overflow-hidden transition-colors duration-300 ${
              isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div 
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ 
                  width: `${Math.min(100, ((opponentPlayer?.currentBalance || 0) / 10000) * 100)}%` 
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default MatchHeader
