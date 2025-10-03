import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import api from '../utils/api'
import MatchResultOverlay from '../components/MatchResultOverlay'
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Search,
  Filter,
  Clock,
  DollarSign,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Pause
} from 'lucide-react'

// Import sub-components
import MatchHeader from '../components/MatchHeader'
import BinanceChart from '../components/BinanceChart'
import TickerSelector from '../components/TickerSelector'
import TradingPanel from '../components/TradingPanel'
import OrderManagement from '../components/OrderManagement'
import PositionCard from '../components/PositionCard'

const MatchPage = () => {
  const { isDark } = useTheme()
  const { user } = useAuth()
  const [matchData, setMatchData] = useState(null)
  const [selectedTicker, setSelectedTicker] = useState('BTCUSDT')
  const [tickerData, setTickerData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showTickerSelector, setShowTickerSelector] = useState(true)
  const [activeOrderTab, setActiveOrderTab] = useState('current')
  const [orders, setOrders] = useState({
    current: [],
    open: [],
    history: []
  })
  const [positions, setPositions] = useState([])
  const [showResultOverlay, setShowResultOverlay] = useState(false)
  const [matchResult, setMatchResult] = useState(null)
  const [matchEnded, setMatchEnded] = useState(false)

  // Fetch match data
  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        setLoading(true)
        // Get match ID from URL params or state
        const matchId = new URLSearchParams(window.location.search).get('matchId') || 'mock-match-id'
        
        const response = await api.get(`/matches/${matchId}`)
        
        if (response.data.success) {
          setMatchData(response.data.match)
        } else {
          console.error('Match not found')
          setMatchData(null)
        }
      } catch (error) {
        console.error('Error fetching match data:', error)
        setMatchData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchMatchData()
  }, [user])

  // Initialize ticker data (no backend polling - WebSocket will provide real-time data)
  useEffect(() => {
    // Set initial ticker data to null - WebSocket will update it
    setTickerData(null)
  }, [selectedTicker])

  // Set up WebSocket for real-time price updates for TradingPanel
  useEffect(() => {
    if (!selectedTicker) return

    let unsubscribe = null

    // Import the WebSocket service
    import('../services/binanceWebSocket').then(({ default: binanceWebSocketService }) => {
      console.log(`📡 Setting up WebSocket for TradingPanel: ${selectedTicker}`)
      
      // Connect to WebSocket
      binanceWebSocketService.connect(selectedTicker)
      
      // Subscribe to price updates
      unsubscribe = binanceWebSocketService.subscribe((tickerData) => {
        console.log(`💰 Price update for TradingPanel:`, tickerData)
        setTickerData(tickerData)
      })
    })

    // Cleanup function
    return () => {
      if (unsubscribe) {
        console.log(`🔌 Cleaning up WebSocket subscription for TradingPanel: ${selectedTicker}`)
        unsubscribe()
      }
    }
  }, [selectedTicker])

  // Fetch orders and positions
  useEffect(() => {
    const fetchOrdersAndPositions = async () => {
      try {
        if (matchData?.id) {
          // Fetch orders
          const ordersResponse = await fetch(`/api/orders/${matchData.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          const ordersData = await ordersResponse.json()
          
          if (ordersData.success) {
            const allOrders = ordersData.orders || []
            setOrders({
              current: allOrders.filter(order => order.status === 'filled'),
              open: allOrders.filter(order => order.status === 'pending'),
              history: allOrders.filter(order => order.status === 'cancelled' || order.status === 'rejected')
            })
          }

          // Fetch positions
          const positionsResponse = await fetch(`/api/positions/${matchData.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          const positionsData = await positionsResponse.json()
          
          if (positionsData.success) {
            setPositions(positionsData.positions || [])
          }
        }
      } catch (error) {
        console.error('Error fetching orders and positions:', error)
        setOrders({
          current: [],
          open: [],
          history: []
        })
        setPositions([])
      }
    }

    fetchOrdersAndPositions()
  }, [matchData])

  const handleQuitMatch = async () => {
    if (window.confirm('Are you sure you want to quit this match? This action cannot be undone.')) {
      try {
        // Clean up WebSocket connection
        import('../services/binanceWebSocket').then(({ default: binanceWebSocketService }) => {
          console.log('🔌 Disconnecting WebSocket on match quit')
          binanceWebSocketService.disconnect()
        })

        if (matchData?.id) {
          await api.post(`/matches/${matchData.id}/quit`)
        }
        // Show result overlay with defeat
        const opponent = matchData?.players?.find(p => {
          const playerUserId = p.user._id ? p.user._id.toString() : p.user.toString();
          return playerUserId !== user?.id;
        });
        setMatchResult({
          winner: opponent?.user,
          userBalance: 10000,
          opponentBalance: 10000,
          userTrades: 0,
          opponentTrades: 0,
          duration: '0:00',
          opponent: opponent
        })
        setShowResultOverlay(true)
      } catch (error) {
        console.error('Error quitting match:', error)
        window.location.href = '/dashboard'
      }
    }
  }

  // Cleanup WebSocket on component unmount
  useEffect(() => {
    return () => {
      // Clean up WebSocket connection when component unmounts
      import('../services/binanceWebSocket').then(({ default: binanceWebSocketService }) => {
        console.log('🔌 Disconnecting WebSocket on component unmount')
        binanceWebSocketService.disconnect()
      })
    }
  }, [])

  // Check for match completion conditions
  useEffect(() => {
    if (matchData) {
      const checkMatchCompletion = () => {
        // Don't check if match already ended
        if (matchEnded) return
        
        const userPlayer = matchData.players?.find(p => {
          const playerUserId = p.user._id ? p.user._id.toString() : p.user.toString();
          return playerUserId === user?.id;
        })
        const opponentPlayer = matchData.players?.find(p => {
          const playerUserId = p.user._id ? p.user._id.toString() : p.user.toString();
          return playerUserId !== user?.id;
        })
        
        if (userPlayer && opponentPlayer) {
          // Check if user doubled their amount
          if (userPlayer.currentBalance >= 20000) {
            console.log('🎯 User doubled amount - ending match')
            endMatch(userPlayer.user, userPlayer, opponentPlayer)
            return
          }
          
          // Check if opponent doubled their amount
          if (opponentPlayer.currentBalance >= 20000) {
            console.log('🎯 Opponent doubled amount - ending match')
            endMatch(opponentPlayer.user, userPlayer, opponentPlayer)
            return
          }
          
          // Check if time is up (5 minutes)
          const matchStartTime = new Date(matchData.startTime)
          const currentTime = new Date()
          const elapsedMinutes = (currentTime - matchStartTime) / (1000 * 60)
          
          console.log(`⏰ Match time check: ${elapsedMinutes.toFixed(2)} minutes elapsed`)
          
          if (elapsedMinutes >= 5) {
            console.log('⏰ Time up - ending match')
            // Time up - winner is whoever has higher balance
            const winner = userPlayer.currentBalance > opponentPlayer.currentBalance 
              ? userPlayer.user 
              : opponentPlayer.currentBalance > userPlayer.currentBalance 
                ? opponentPlayer.user 
                : null // Draw
            endMatch(winner, userPlayer, opponentPlayer)
          }
        }
      }

      // Check every 1 second for more responsive timer
      const interval = setInterval(checkMatchCompletion, 1000)
      return () => clearInterval(interval)
    }
  }, [matchData, user, matchEnded])

  const endMatch = async (winner, userPlayer, opponentPlayer) => {
    // Prevent multiple calls
    if (matchEnded) return
    
    try {
      console.log('🏁 Ending match...', { winner, userBalance: userPlayer.currentBalance, opponentBalance: opponentPlayer.currentBalance })
      setMatchEnded(true)
      
      const response = await api.post(`/matches/${matchData.id}/end`, {
        winner,
        userBalance: userPlayer.currentBalance,
        opponentBalance: opponentPlayer.currentBalance,
        userTrades: userPlayer.trades?.length || 0,
        opponentTrades: opponentPlayer.trades?.length || 0
      })

      if (response.data.success) {
        console.log('✅ Match ended successfully')
        setMatchResult({
          winner,
          userBalance: userPlayer.currentBalance,
          opponentBalance: opponentPlayer.currentBalance,
          userTrades: userPlayer.trades?.length || 0,
          opponentTrades: opponentPlayer.trades?.length || 0,
          duration: '5:00',
          opponent: opponentPlayer
        })
        setShowResultOverlay(true)
      }
    } catch (error) {
      console.error('❌ Error ending match:', error)
      setMatchEnded(false) // Reset on error
    }
  }

  const handleTickerSelect = (ticker) => {
    setSelectedTicker(ticker)
    setShowTickerSelector(false)
  }

  const handlePositionClose = (positionId) => {
    setPositions(prev => prev.filter(pos => pos._id !== positionId))
  }

  const handlePositionUpdate = (positionId, updates) => {
    setPositions(prev => prev.map(pos => 
      pos._id === positionId ? { ...pos, ...updates } : pos
    ))
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Loading match...
          </p>
        </div>
      </div>
    )
  }

  if (!matchData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Match not found
          </p>
        </div>
      </div>
    )
  }

  const userPlayer = matchData.players.find(p => {
    const playerUserId = p.user._id ? p.user._id.toString() : p.user.toString();
    return playerUserId === user?.id;
  })
  const opponentPlayer = matchData.players.find(p => {
    const playerUserId = p.user._id ? p.user._id.toString() : p.user.toString();
    return playerUserId !== user?.id;
  })

  return (
    <div className={`h-screen flex flex-col transition-colors duration-300 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Match Header - Fixed at top */}
      <div className="flex-shrink-0">
        <MatchHeader 
          matchData={matchData}
          userPlayer={userPlayer}
          opponentPlayer={opponentPlayer}
          onQuit={handleQuitMatch}
        />
      </div>

      {/* Main Trading Interface - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Top Row - Chart and Trading Panel */}
        <div className="flex min-h-screen">
          {/* Chart */}
          <div className="flex-1 border-r border-gray-200 dark:border-gray-700 min-w-0">
            <BinanceChart
              ticker={selectedTicker}
              onTickerSelect={() => setShowTickerSelector(true)}
            />
          </div>

          {/* Trading Panel */}
          <div className="w-72 flex-shrink-0">
            <TradingPanel
              ticker={selectedTicker}
              tickerData={tickerData}
              userBalance={userPlayer?.currentBalance || 0}
              matchId={matchData.id}
              onOrderPlaced={() => {
                // Refresh orders
                window.location.reload()
              }}
            />
          </div>
        </div>

        {/* Order Management - Below main interface, requires scrolling */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          <OrderManagement
            activeTab={activeOrderTab}
            onTabChange={setActiveOrderTab}
            orders={orders}
            positions={positions}
            matchId={matchData.id}
            onPositionClose={handlePositionClose}
            onPositionUpdate={handlePositionUpdate}
          />
        </div>
      </div>

      {/* Ticker Selection Modal */}
      {showTickerSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`w-80 max-h-[80vh] rounded-lg shadow-xl transition-colors duration-300 flex flex-col ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <div className="flex-1 overflow-y-auto">
              <TickerSelector
                selectedTicker={selectedTicker}
                onTickerSelect={handleTickerSelect}
                onClose={() => setShowTickerSelector(false)}
              />
            </div>
          </motion.div>
        </div>
      )}

      {/* Match Result Overlay */}
      <MatchResultOverlay
        isOpen={showResultOverlay}
        matchResult={matchResult}
        onClose={() => setShowResultOverlay(false)}
      />
    </div>
  )
}

export default MatchPage
