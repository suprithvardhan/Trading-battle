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
  Target,
  Search,
  Loader,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Star,
  Crown,
  Shield,
  Sword,
  Flame,
  Sparkles
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
    { id: 1, name: 'CryptoKing_99', avatar: '👑', rating: 1850, wins: 42, tier: 'Gold', icon: Crown },
    { id: 2, name: 'BitcoinBull', avatar: '🐂', rating: 1920, wins: 38, tier: 'Platinum', icon: Shield },
    { id: 3, name: 'EthereumEagle', avatar: '🦅', rating: 1780, wins: 35, tier: 'Gold', icon: TrendingUp },
    { id: 4, name: 'TradingTitan', avatar: '⚡', rating: 2010, wins: 45, tier: 'Diamond', icon: Sword },
    { id: 5, name: 'CryptoNinja', avatar: '🥷', rating: 1890, wins: 40, tier: 'Gold', icon: Star },
    { id: 6, name: 'BlockchainBoss', avatar: '💎', rating: 1950, wins: 43, tier: 'Platinum', icon: Crown },
    { id: 7, name: 'DeFiDragon', avatar: '🐉', rating: 1820, wins: 36, tier: 'Gold', icon: Flame },
    { id: 8, name: 'MoonMaster', avatar: '🌙', rating: 1980, wins: 41, tier: 'Platinum', icon: Sparkles }
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`relative w-full max-w-4xl mx-4 rounded-2xl shadow-2xl overflow-hidden ${
            isDark 
              ? 'bg-slate-900/95 backdrop-blur-xl border border-slate-700/50' 
              : 'bg-white/95 backdrop-blur-xl border border-slate-200/50'
          }`}
        >
          {/* Header */}
          <div className={`p-6 ${
            isDark 
              ? 'bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600/50' 
              : 'bg-gradient-to-r from-blue-600 to-purple-600'
          } text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className={`p-3 rounded-full backdrop-blur-sm ${
                    isDark ? 'bg-slate-600/50' : 'bg-white/20'
                  }`}
                >
                  <Users className="w-8 h-8" />
                </motion.div>
                <div>
                  <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-3xl font-bold"
                  >
                    {matchFound ? 'Match Found!' : 'Finding Match...'}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`text-lg ${
                      isDark ? 'text-slate-300' : 'text-blue-100'
                    }`}
                  >
                    {matchFound ? 'Preparing your battle!' : 'Searching for worthy opponent'}
                  </motion.p>
                </div>
              </div>
              
              {!matchFound && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={cancelMatchmaking}
                  className={`p-3 rounded-full backdrop-blur-sm transition-all duration-300 ${
                    isDark 
                      ? 'bg-slate-600/50 hover:bg-slate-500/50' 
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  <X className="w-6 h-6" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className={`p-6 ${
            isDark 
              ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
              : 'bg-gradient-to-br from-white to-slate-50'
          }`}>
            {!matchFound ? (
              <div className="flex items-center justify-center space-x-12">
                {/* Current User */}
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center space-y-4"
                >
                  {/* Innovative Wow Factor: Floating particles around user */}
                  <div className="relative">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.05, 1],
                        boxShadow: [
                          "0 0 0 0 rgba(59, 130, 246, 0.7)",
                          "0 0 0 15px rgba(59, 130, 246, 0)",
                          "0 0 0 0 rgba(59, 130, 246, 0)"
                        ]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
             className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-2xl ${
               isDark 
                 ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                 : 'bg-gradient-to-br from-blue-500 to-blue-600'
             }`}
                    >
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </motion.div>
                    
                    {/* Floating particles animation */}
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          y: [0, -20, 0],
                          x: [0, Math.sin(i) * 20, 0],
                          opacity: [0.3, 1, 0.3],
                          scale: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 2 + i * 0.3,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.2
                        }}
               className={`absolute w-1.5 h-1.5 rounded-full ${
                 isDark ? 'bg-blue-400' : 'bg-blue-500'
               }`}
                        style={{
                          top: '50%',
                          left: '50%',
                          transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-80px)`
                        }}
                      />
                    ))}
                  </div>
                  
         <div className="text-center">
           <h3 className={`text-xl font-bold mb-2 ${
             isDark ? 'text-white' : 'text-slate-900'
           }`}>
             {user?.username || 'You'}
           </h3>
                    <p className={`mb-3 ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      Rating: {user?.stats?.rating || 1800}
                    </p>
                    <div className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-full ${
                      isDark ? 'bg-yellow-500/20' : 'bg-yellow-50'
                    }`}>
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <span className={`font-semibold ${
                        isDark ? 'text-yellow-300' : 'text-slate-700'
                      }`}>
                        {user?.stats?.wins || 0} wins
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* VS Section with Innovative Wow Factor */}
                <div className="flex flex-col items-center space-y-6">
                  {/* Innovative Wow Factor: Pulsing energy field */}
                  <div className="relative">
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
             className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg ${
               isDark 
                 ? 'bg-gradient-to-br from-slate-600 to-slate-500 text-slate-200' 
                 : 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700'
             }`}
                    >
                      VS
                    </motion.div>
                    
                    {/* Energy field rings */}
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          scale: [1, 1.5 + i * 0.3, 1],
                          opacity: [0.3, 0.8, 0.3]
                        }}
                        transition={{
                          duration: 2 + i * 0.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.3
                        }}
               className={`absolute inset-0 rounded-full border ${
                 isDark ? 'border-blue-400' : 'border-blue-500'
               }`}
                        style={{ scale: 1 + i * 0.3 }}
                      />
                    ))}
                  </div>
                  
                  <div className="text-center">
           <div className="flex items-center justify-center space-x-3 mb-3">
             <motion.div
               animate={{ rotate: 360 }}
               transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
             >
               <Clock className="w-5 h-5 text-yellow-500" />
             </motion.div>
             <span className={`text-xl font-bold ${
               isDark ? 'text-white' : 'text-slate-900'
             }`}>
               {formatTime(waitTime)}
             </span>
           </div>
                    <div className="flex items-center justify-center space-x-2">
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Search className={`w-4 h-4 ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`} />
                      </motion.div>
                      <p className={`font-medium ${
                        isDark ? 'text-slate-300' : 'text-slate-600'
                      }`}>
                        Searching for opponent...
                      </p>
                    </div>
                  </div>
                </div>

                {/* Opponent Animation with Innovative Wow Factor */}
                <motion.div
                  key={currentOpponentIndex}
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="flex flex-col items-center space-y-4"
                >
                  {/* Innovative Wow Factor: Holographic opponent with scanning effect */}
                  <div className="relative">
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
                      className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-2xl"
                    >
                      {mockAvatars[currentOpponentIndex]?.avatar || '👤'}
                    </motion.div>
                    
                    {/* Scanning line effect */}
                    <motion.div
                      animate={{
                        y: [-20, 20, -20],
                        opacity: [0, 1, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute inset-0 rounded-full border-2 border-cyan-400"
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.3), transparent)',
                        clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)'
                      }}
                    />
                    
                    {/* Holographic glitch effect */}
                    <motion.div
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        repeatDelay: 2
                      }}
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
                    />
                  </div>
                  
         <div className="text-center">
           <h3 className={`text-xl font-bold mb-2 ${
             isDark ? 'text-white' : 'text-slate-900'
           }`}>
             {mockAvatars[currentOpponentIndex]?.name || 'Opponent'}
           </h3>
                    <p className={`mb-3 ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      Rating: {mockAvatars[currentOpponentIndex]?.rating || 1800}
                    </p>
                    <div className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-full ${
                      isDark ? 'bg-purple-500/20' : 'bg-purple-50'
                    }`}>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Zap className="w-5 h-5 text-purple-500" />
                      </motion.div>
                      <span className={`font-semibold ${
                        isDark ? 'text-purple-300' : 'text-slate-700'
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
                className="flex flex-col items-center space-y-6"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-32 h-32 rounded-full flex items-center justify-center text-6xl font-bold bg-gradient-to-br from-green-500 to-blue-500 text-white shadow-2xl"
                >
                  ⚡
                </motion.div>
                
                <div className="text-center">
                  <motion.h3
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={`text-3xl font-bold mb-4 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Match Found!
                  </motion.h3>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`text-lg mb-6 ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    Your opponent: <span className={`font-bold ${
                      isDark ? 'text-purple-400' : 'text-purple-600'
                    }`}>
                      {opponent?.username || 'CryptoKing_99'}
                    </span>
                  </motion.p>
                  
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200"
                  >
                    <div className="flex items-center justify-center space-x-8">
                      <div className="text-center">
                        <div className="text-sm text-slate-500 mb-1">Rating</div>
                        <div className="text-2xl font-bold text-slate-900">1,850</div>
                      </div>
                      <div className="w-px h-12 bg-slate-300"></div>
                      <div className="text-center">
                        <div className="text-sm text-slate-500 mb-1">Wins</div>
                        <div className="text-2xl font-bold text-slate-900">42</div>
                      </div>
                      <div className="w-px h-12 bg-slate-300"></div>
                      <div className="text-center">
                        <div className="text-sm text-slate-500 mb-1">Tier</div>
                        <div className="text-2xl font-bold text-yellow-600">Gold</div>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-slate-500 mt-4"
                  >
                    Preparing your trading battle...
                  </motion.p>
                </div>

                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
                />
              </motion.div>
            )}

            {/* Match Info */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`mt-12 p-8 rounded-2xl shadow-lg border ${
                isDark 
                  ? 'bg-slate-800/50 border-slate-700/50' 
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                  }`}>
                    <Target className={`w-8 h-8 ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </div>
                  <p className={`text-sm mb-2 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>Match Type</p>
                  <p className={`text-xl font-bold ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>Quick Battle</p>
                </div>
                <div>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isDark ? 'bg-yellow-500/20' : 'bg-yellow-100'
                  }`}>
                    <Clock className={`w-8 h-8 ${
                      isDark ? 'text-yellow-400' : 'text-yellow-600'
                    }`} />
                  </div>
                  <p className={`text-sm mb-2 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>Duration</p>
                  <p className={`text-xl font-bold ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>5 Minutes</p>
                </div>
                <div>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isDark ? 'bg-yellow-500/20' : 'bg-yellow-100'
                  }`}>
                    <Trophy className={`w-8 h-8 ${
                      isDark ? 'text-yellow-400' : 'text-yellow-600'
                    }`} />
                  </div>
                  <p className={`text-sm mb-2 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>Max Trades</p>
                  <p className={`text-xl font-bold ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>50</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default MatchmakingOverlay