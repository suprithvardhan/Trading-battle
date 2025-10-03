import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import api from '../utils/api'
import { 
  X, 
  Clock, 
  Users, 
  Trophy,
  Zap,
  Target
} from 'lucide-react'

const MatchmakingOverlay = ({ isOpen, onClose, onMatchFound }) => {
  const { isDark } = useTheme()
  const { user } = useAuth()
  const [isSearching, setIsSearching] = useState(false)
  const [waitTime, setWaitTime] = useState(0)
  const [opponentAvatars, setOpponentAvatars] = useState([])
  const [currentOpponentIndex, setCurrentOpponentIndex] = useState(0)
  const [matchFound, setMatchFound] = useState(false)
  const [opponent, setOpponent] = useState(null)
  const [statusCheckInterval, setStatusCheckInterval] = useState(null)

  // Mock opponent avatars for animation
  const mockAvatars = [
    { id: 1, name: 'CryptoKing_99', avatar: '👑', rating: 1850 },
    { id: 2, name: 'BitcoinBull', avatar: '🐂', rating: 1920 },
    { id: 3, name: 'EthereumEagle', avatar: '🦅', rating: 1780 },
    { id: 4, name: 'TradingTitan', avatar: '⚡', rating: 2010 },
    { id: 5, name: 'CryptoNinja', avatar: '🥷', rating: 1890 },
    { id: 6, name: 'BlockchainBoss', avatar: '💎', rating: 1950 },
    { id: 7, name: 'DeFiDragon', avatar: '🐉', rating: 1820 },
    { id: 8, name: 'MoonMaster', avatar: '🌙', rating: 1980 }
  ]

  useEffect(() => {
    if (isOpen) {
      startMatchmaking()
    } else {
      // Clean up when overlay is closed
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval)
        setStatusCheckInterval(null)
      }
      setIsSearching(false)
      setMatchFound(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (isSearching) {
      // Start wait timer
      const timer = setInterval(() => {
        setWaitTime(prev => prev + 1)
      }, 1000)

      // Animate opponent avatars
      const avatarInterval = setInterval(() => {
        setCurrentOpponentIndex(prev => (prev + 1) % mockAvatars.length)
      }, 2000)

      return () => {
        clearInterval(timer)
        clearInterval(avatarInterval)
      }
    }
  }, [isSearching])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval)
      }
    }
  }, [statusCheckInterval])

  const startMatchmaking = async () => {
    setIsSearching(true)
    setWaitTime(0)
    setOpponentAvatars(mockAvatars)
    setCurrentOpponentIndex(0)

    try {
      // Join matchmaking queue
      const response = await api.post('/matchmaking/join', {
        preferences: {
          matchType: 'quick',
          duration: 5,
          maxSkillDifference: 20
        }
      })

      if (response.data.success) {
        console.log('✅ Successfully joined matchmaking queue')
        // Start continuous polling
        startStatusPolling()
      }
    } catch (error) {
      console.error('Error joining matchmaking:', error)
      setIsSearching(false)
    }
  }

  const startStatusPolling = () => {
    console.log('🔄 Starting status polling...')
    
    // Use setInterval for continuous polling
    const intervalId = setInterval(async () => {
      try {
        const statusResponse = await api.get('/matchmaking/status')
        console.log('🔄 Polling status:', statusResponse.data)
        
        if (statusResponse.data.success && statusResponse.data.match) {
          console.log('🎉 Match found!', statusResponse.data.match)
          setMatchFound(true)
          setOpponent(statusResponse.data.match.opponent)
          
          // Stop polling
          clearInterval(intervalId)
          setStatusCheckInterval(null)
          
          // Show match found animation for 3 seconds then redirect
          setTimeout(() => {
            onMatchFound(statusResponse.data.match)
          }, 3000)
        }
      } catch (error) {
        console.error('❌ Error checking match status:', error)
      }
    }, 1000) // Poll every 1 second
    
    setStatusCheckInterval(intervalId)
  }

  const cancelMatchmaking = async () => {
    try {
      await api.post('/matchmaking/leave')
      console.log('✅ Left matchmaking queue')
    } catch (error) {
      console.error('Error leaving matchmaking:', error)
    }
    
    // Stop polling
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval)
      setStatusCheckInterval(null)
    }
    
    setIsSearching(false)
    setMatchFound(false)
    onClose()
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className={`relative w-full max-w-4xl mx-4 rounded-2xl overflow-hidden ${
            isDark ? 'bg-gray-900' : 'bg-white'
          }`}
        >
          {/* Header */}
          <div className={`p-6 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  isDark ? 'bg-blue-600' : 'bg-blue-500'
                }`}>
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {matchFound ? 'Match Found!' : 'Finding Match...'}
                  </h2>
                  <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {matchFound ? 'Preparing your battle!' : 'Searching for worthy opponent'}
                  </p>
                </div>
              </div>
              
              {!matchFound && (
                <button
                  onClick={cancelMatchmaking}
                  className={`p-2 rounded-full transition-colors duration-300 ${
                    isDark 
                      ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="p-8">
            {!matchFound ? (
              <div className="flex items-center justify-center space-x-16">
                {/* Current User */}
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="flex flex-col items-center space-y-4"
                >
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold ${
                    isDark ? 'bg-blue-600' : 'bg-blue-500'
                  } text-white`}>
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="text-center">
                    <h3 className={`text-xl font-bold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {user?.username || 'You'}
                    </h3>
                    <p className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Rating: {user?.stats?.rating || 1800}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className={`text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {user?.stats?.wins || 0} wins
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* VS Section */}
                <div className="flex flex-col items-center space-y-4">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold ${
                      isDark ? 'bg-gray-800' : 'bg-gray-100'
                    }`}
                  >
                    <span className={`${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>VS</span>
                  </motion.div>
                  
                  <div className="text-center">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span className={`text-sm font-medium ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {formatTime(waitTime)}
                      </span>
                    </div>
                    <p className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Searching for opponent...
                    </p>
                  </div>
                </div>

                {/* Opponent Animation */}
                <motion.div
                  key={currentOpponentIndex}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center space-y-4"
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                  >
                    {mockAvatars[currentOpponentIndex]?.avatar || '👤'}
                  </motion.div>
                  <div className="text-center">
                    <h3 className={`text-xl font-bold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {mockAvatars[currentOpponentIndex]?.name || 'Opponent'}
                    </h3>
                    <p className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Rating: {mockAvatars[currentOpponentIndex]?.rating || 1800}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className={`text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Searching...
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : (
              /* Match Found Animation */
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center space-y-8"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-32 h-32 rounded-full flex items-center justify-center text-6xl font-bold bg-gradient-to-br from-green-500 to-blue-500 text-white"
                >
                  ⚡
                </motion.div>
                
                <div className="text-center">
                  <h3 className={`text-3xl font-bold mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Match Found!
                  </h3>
                  <p className={`text-lg ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Your opponent: <span className="font-bold text-purple-500">
                      {opponent?.username || 'CryptoKing_99'}
                    </span>
                  </p>
                  <div className={`mt-4 p-4 rounded-lg ${
                    isDark ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                    <div className="flex items-center justify-center space-x-4">
                      <div className="text-center">
                        <div className={`text-sm transition-colors duration-300 ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>Rating</div>
                        <div className={`font-bold transition-colors duration-300 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>1,850</div>
                      </div>
                      <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                      <div className="text-center">
                        <div className={`text-sm transition-colors duration-300 ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>Wins</div>
                        <div className={`font-bold transition-colors duration-300 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>42</div>
                      </div>
                      <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                      <div className="text-center">
                        <div className={`text-sm transition-colors duration-300 ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>Tier</div>
                        <div className="font-bold text-yellow-500">Gold</div>
                      </div>
                    </div>
                  </div>
                  <p className={`text-sm mt-2 ${
                    isDark ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    Preparing your trading battle...
                  </p>
                </div>

                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
                />
              </motion.div>
            )}

            {/* Match Info */}
            <div className={`mt-8 p-6 rounded-xl ${
              isDark ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <Target className={`w-6 h-6 mx-auto mb-2 ${
                    isDark ? 'text-blue-400' : 'text-blue-500'
                  }`} />
                  <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Match Type</p>
                  <p className={`font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>Quick Battle</p>
                </div>
                <div>
                  <Clock className={`w-6 h-6 mx-auto mb-2 ${
                    isDark ? 'text-yellow-400' : 'text-yellow-500'
                  }`} />
                  <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Duration</p>
                  <p className={`font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>5 Minutes</p>
                </div>
                <div>
                  <Trophy className={`w-6 h-6 mx-auto mb-2 ${
                    isDark ? 'text-yellow-400' : 'text-yellow-500'
                  }`} />
                  <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Max Trades</p>
                  <p className={`font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>50</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default MatchmakingOverlay