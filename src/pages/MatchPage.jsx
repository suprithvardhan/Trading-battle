import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
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
  const { id: matchId } = useParams()
  const { isDark } = useTheme()
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
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
  const [optimisticBalance, setOptimisticBalance] = useState(null)
  const [closingPosition, setClosingPosition] = useState(null)

  // Derive userPlayer and opponentPlayer from matchData
  const userPlayer = matchData?.players?.find(p => {
    const playerUserId = p.user._id ? p.user._id.toString() : p.user.toString();
    return playerUserId === user?.id;
  })

  const opponentPlayer = matchData?.players?.find(p => {
    const playerUserId = p.user._id ? p.user._id.toString() : p.user.toString();
    return playerUserId !== user?.id;
  })

  // Fetch match data function
  const fetchMatchData = async () => {
    try {
      setLoading(true)
      // Get match ID from URL params
      if (!matchId) {
        console.error('No match ID provided')
        setMatchData(null)
        return
      }
      
      const response = await api.get(`/matches/${matchId}`)
      
      if (response.data.success) {
        // Match data loaded successfully
        setMatchData(response.data.match)
        // Reset optimistic balance after getting real data
        setOptimisticBalance(null)
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

  // Fetch match data on component mount
  useEffect(() => {
    fetchMatchData()
  }, [user, matchId])

  // Handle optimistic balance updates
  const handleOptimisticBalanceUpdate = (marginDeduction) => {
    if (matchData && userPlayer) {
      const newBalance = (userPlayer.currentBalance || 0) - marginDeduction
      setOptimisticBalance(newBalance)
      // Optimistic balance update
    }
  }

  // Update balance without full re-render
  const updateBalanceOnly = async () => {
    try {
      if (!matchId) {
        console.error('No match ID available for balance update')
        return
      }
      const response = await api.get(`/matches/${matchId}`)
      
      if (response.data.success && response.data.match) {
        // Update only the userPlayer balance without full re-render
        setMatchData(prevData => ({
          ...prevData,
          players: prevData.players.map(player => 
            player.user._id === user?.id 
              ? { ...player, currentBalance: response.data.match.players.find(p => p.user._id === user?.id)?.currentBalance || player.currentBalance }
              : player
          )
        }))
        // Reset optimistic balance
        setOptimisticBalance(null)
      }
    } catch (error) {
      console.error('Error updating balance:', error)
    }
  }

  // Get current balance (optimistic or real)
  const getCurrentBalance = () => {
    if (optimisticBalance !== null) {
      return optimisticBalance
    }
    return userPlayer?.currentBalance || 0
  }


  // Initialize ticker data (no backend polling - WebSocket will provide real-time data)
  useEffect(() => {
    // Set initial ticker data to null - WebSocket will update it
    setTickerData(null)
  }, [selectedTicker])

  // Memoized price update handler to prevent unnecessary re-renders
  const handlePriceUpdate = useCallback((tickerData) => {
    // Only update if the data has actually changed
    setTickerData(prevData => {
      if (!prevData || prevData.price !== tickerData.price) {
        return tickerData
      }
      return prevData
    })
  }, [])

  // Set up WebSocket for real-time price updates for TradingPanel
  useEffect(() => {
    if (!selectedTicker || !matchData || loading) return

    let unsubscribe = null

    // Import the WebSocket service with error handling and timeout
    const importPromise = import('../services/binanceWebSocket')
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('WebSocket service import timeout')), 5000)
    )
    
    Promise.race([importPromise, timeoutPromise]).then(({ default: binanceWebSocketService }) => {
      try {
        console.log(`📡 Setting up WebSocket for TradingPanel: ${selectedTicker}`)
        
        // Connect to WebSocket
        binanceWebSocketService.connect(selectedTicker)
        
        // Subscribe to price updates
        unsubscribe = binanceWebSocketService.subscribe(handlePriceUpdate)
      } catch (error) {
        console.error('❌ Error setting up WebSocket:', error)
      }
    }).catch(error => {
      console.error('❌ Error importing WebSocket service:', error)
    })

    // Cleanup function
    return () => {
      if (unsubscribe) {
        console.log(`🔌 Cleaning up WebSocket subscription for TradingPanel: ${selectedTicker}`)
        unsubscribe()
      }
    }
  }, [selectedTicker, handlePriceUpdate, matchData, loading])

  // Set up Match Connection Service
  useEffect(() => {
    if (!matchData?._id || !user?.id || loading) return

    console.log(`🔌 Connecting to match connection service for user ${user.id}, match ${matchData._id}`)
    
    let unsubscribeMatchEnded = null
    let unsubscribeBalanceUpdated = null
    
    // Add a small delay to ensure the room is created on the server
    const connectWithDelay = () => {
      setTimeout(() => {
        // Import and connect to match connection service with error handling
        import('../services/matchConnectionService').then(({ default: matchConnectionService }) => {
          try {
            matchConnectionService.connect(user.id, matchData._id)
          } catch (error) {
            console.error('❌ Error connecting to match connection service:', error)
          }
        }).catch(error => {
          console.error('❌ Error importing match connection service:', error)
        })
      }, 1000) // 1 second delay to ensure room is created
    }
    
    // Start the connection process
    connectWithDelay()
    
    // Import and set up event listeners
    import('../services/matchConnectionService').then(({ default: matchConnectionService }) => {
      // Subscribe to balance update events
      unsubscribeBalanceUpdated = matchConnectionService.subscribe('balance_updated', (data) => {
        console.log('💰 Balance update notification received:', data)
        console.log('💰 Current user ID:', user.id, 'Data user ID:', data.userId)
        console.log('💰 Match ID:', matchData._id, 'Data match ID:', data.matchId)
        console.log('💰 Notification timestamp:', data.timestamp)
        
        // Update opponent's balance in real-time
        if (data.userId !== user.id) {
          console.log(`📊 Updating opponent balance: ${data.newBalance}`)
          setMatchData(prevData => {
            const updatedData = {
              ...prevData,
              players: prevData.players.map(player => {
                const playerUserId = player.user._id ? player.user._id.toString() : player.user.toString();
                if (playerUserId === data.userId) {
                  console.log(`📊 Updating player ${playerUserId} balance from ${player.currentBalance} to ${data.newBalance}`)
                  return { ...player, currentBalance: data.newBalance, realizedPnL: data.realizedPnL }
                }
                return player
              })
            }
            console.log('📊 Updated match data:', updatedData)
            return updatedData
          })
        } else {
          console.log('📊 Balance update is for current user, skipping opponent update')
        }
      })

      // Subscribe to match ended events
      unsubscribeMatchEnded = matchConnectionService.subscribe('match_ended', (data) => {
        console.log('🏁 Match ended notification received:', data)
        
        // Set match result and show overlay
        // The backend sends data in a specific order, we need to map it correctly
        const currentUserPlayer = matchData.players.find(p => p.user._id === user.id)
        const opponentPlayer = matchData.players.find(p => p.user._id !== user.id)
        
        // The backend sends userBalance/opponentBalance based on database order
        // We need to map them to the current user's perspective
        const isCurrentUserFirst = currentUserPlayer === matchData.players[0]
        
        setMatchResult({
          winner: data.result.winner,
          // Map balances based on player order in database
          userBalance: isCurrentUserFirst ? data.result.userBalance : data.result.opponentBalance,
          opponentBalance: isCurrentUserFirst ? data.result.opponentBalance : data.result.userBalance,
          userRealizedPnL: isCurrentUserFirst ? data.result.userRealizedPnL : data.result.opponentRealizedPnL,
          opponentRealizedPnL: isCurrentUserFirst ? data.result.opponentRealizedPnL : data.result.userRealizedPnL,
          userTrades: isCurrentUserFirst ? data.result.userTrades : data.result.opponentTrades,
          opponentTrades: isCurrentUserFirst ? data.result.opponentTrades : data.result.userTrades,
          duration: '5:00',
          opponent: opponentPlayer,
          startingBalance: currentUserPlayer?.startingBalance || 10000,
          opponentStartingBalance: opponentPlayer?.startingBalance || 10000,
          reason: data.reason,
          message: data.message
        })
        setShowResultOverlay(true)
        setMatchEnded(true)
      })
    }).catch(error => {
      console.error('❌ Error importing match connection service:', error)
    })
    
    // Cleanup function
    return () => {
      if (unsubscribeMatchEnded) unsubscribeMatchEnded()
      if (unsubscribeBalanceUpdated) unsubscribeBalanceUpdated()
      
      import('../services/matchConnectionService').then(({ default: matchConnectionService }) => {
        matchConnectionService.disconnect()
      }).catch(error => {
        console.error('❌ Error disconnecting match connection service:', error)
      })
    }
  }, [matchData, user, loading])

  // Set up Order Execution Service connection
  useEffect(() => {
    if (!matchData?._id || !user?.id || loading) return

    console.log(`🔌 Connecting to order execution service for user ${user.id}, match ${matchData._id}`)
    
    let unsubscribeExecutions = null
    let unsubscribePrices = null
    let unsubscribePositionClosed = null
    let unsubscribePositionUpdated = null
    
    // Import and connect to order execution service with error handling
    import('../services/orderExecutionService').then(({ default: orderExecutionService }) => {
      try {
        orderExecutionService.connect(user.id, matchData._id)
      } catch (error) {
        console.error('❌ Error connecting to order execution service:', error)
      }
      
      // Subscribe to order executions
      unsubscribeExecutions = orderExecutionService.subscribe('order_executed', (data) => {
        console.log('🎯 Order executed notification received:', data)
        // Reset optimistic balance since real balance is now updated
        setOptimisticBalance(null)
        // Update balance only (no full re-render)
        setTimeout(() => {
          updateBalanceOnly()
        }, 500)
        // Refresh orders and positions with debouncing
        debouncedFetchOrdersAndPositions()
      })
      
      // Subscribe to position closures
      unsubscribePositionClosed = orderExecutionService.subscribe('position_closed', (data) => {
        console.log('🔄 Position closed notification received:', data)
        // Reset optimistic balance since real balance is now updated
        setOptimisticBalance(null)
        // Update balance only (no full re-render)
        setTimeout(() => {
          updateBalanceOnly()
        }, 500)
        // Refresh orders and positions with debouncing
        debouncedFetchOrdersAndPositions()
      })

      // Subscribe to position updates for real-time PnL updates
      unsubscribePositionUpdated = orderExecutionService.subscribe('position_updated', (data) => {
        console.log('📊 Position updated notification received:', data)
        // Update positions in real-time
        setPositions(prev => prev.map(pos => 
          pos._id === data.positionId 
            ? { ...pos, ...data.updates }
            : pos
        ))
      })
      
      // Subscribe to price updates from execution service
      unsubscribePrices = orderExecutionService.subscribe('price_update', (data) => {
        if (data.symbol === selectedTicker) {
          setTickerData(prev => ({
            ...prev,
            price: data.price,
            timestamp: data.timestamp
          }))
        }
      })
    }).catch(error => {
      console.error('❌ Error importing order execution service:', error)
    })
    
    // Cleanup function
    return () => {
      if (unsubscribeExecutions) unsubscribeExecutions()
      if (unsubscribePrices) unsubscribePrices()
      if (unsubscribePositionClosed) unsubscribePositionClosed()
      if (unsubscribePositionUpdated) unsubscribePositionUpdated()
      
      import('../services/orderExecutionService').then(({ default: orderExecutionService }) => {
        orderExecutionService.disconnect()
      }).catch(error => {
        console.error('❌ Error disconnecting order execution service:', error)
      })
    }
  }, [matchData, user, selectedTicker, loading])

  // Fetch orders and positions with debouncing
  const fetchOrdersAndPositions = useCallback(async () => {
    try {
      if (matchData?._id) {
        // Fetch orders
        const ordersResponse = await fetch(`http://localhost:5000/api/orders/${matchData._id}`, {
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
            history: allOrders.filter(order => 
              order.status === 'cancelled' || 
              order.status === 'rejected' || 
              order.status === 'filled'
            )
          })
        }

        // Fetch positions
        const positionsResponse = await fetch(`http://localhost:5000/api/positions/${matchData._id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        const positionsData = await positionsResponse.json()
        
        if (positionsData.success) {
          // Deduplicate positions by _id to prevent duplicate cards
          const uniquePositions = (positionsData.positions || []).reduce((acc, position) => {
            if (!acc.find(p => p._id === position._id)) {
              acc.push(position)
            }
            return acc
          }, [])
          setPositions(uniquePositions)
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
  }, [matchData?._id])

  // Light debouncing only for rapid successive calls
  const debounceTimeoutRef = useRef(null)
  
  const debouncedFetchOrdersAndPositions = useCallback(() => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    // Set new timeout with shorter delay
    debounceTimeoutRef.current = setTimeout(() => {
      fetchOrdersAndPositions()
      debounceTimeoutRef.current = null
    }, 100) // Reduced to 100ms for faster updates
  }, [fetchOrdersAndPositions])

  useEffect(() => {
    fetchOrdersAndPositions()
  }, [fetchOrdersAndPositions])

  const handleQuitMatch = async () => {
    if (window.confirm('Are you sure you want to quit this match? This action cannot be undone.')) {
      try {
        // Clean up WebSocket connection
        import('../services/binanceWebSocket').then(({ default: binanceWebSocketService }) => {
          console.log('🔌 Disconnecting WebSocket on match quit')
          binanceWebSocketService.disconnect()
        })

        if (matchData?._id) {
          await api.post(`/matches/${matchData._id}/quit`)
        }
        
        // The match connection service will handle the rest and notify both users
        console.log('🏁 Match quit request sent, waiting for match connection service to handle...')
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
      
      // Clean up order execution service
      import('../services/orderExecutionService').then(({ default: orderExecutionService }) => {
        console.log('🔌 Disconnecting order execution service on component unmount')
        orderExecutionService.disconnect()
      })

      // Clean up match connection service
      import('../services/matchConnectionService').then(({ default: matchConnectionService }) => {
        console.log('🔌 Disconnecting match connection service on component unmount')
        matchConnectionService.disconnect()
      })
    }
  }, [])

  // Note: Match timing is now handled by the match-connection-service
  // Frontend only listens for match_ended events

  const endMatch = async (winner, userPlayer, opponentPlayer) => {
    // Prevent multiple calls
    if (matchEnded) return
    
    try {
      console.log('🏁 Ending match...', { winner, userBalance: userPlayer.currentBalance, opponentBalance: opponentPlayer.currentBalance })
      setMatchEnded(true)
      
      const response = await api.post(`/matches/${matchData._id}/end`, {
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

  const handlePositionClose = useCallback(async (positionId) => {
    // Prevent multiple close attempts
    if (closingPosition === positionId) {
      console.log('⚠️ Position close already in progress')
      return
    }

    try {
      setClosingPosition(positionId)
      console.log(`🔄 Closing position ${positionId}`)
      
      // Find the position to close
      const position = positions.find(pos => pos._id === positionId)
      if (!position) {
        console.error('Position not found')
        showError(
          'Position Not Found',
          'The position you are trying to close no longer exists.',
          4000
        )
        return
      }

      // Get current market price for the position's symbol
      const currentPrice = tickerData?.price || position.markPrice
      if (!currentPrice) {
        console.error('Current price not available')
        showError(
          'Price Not Available',
          'Current market price is not available. Please try again.',
          4000
        )
        return
      }

      console.log(`💰 Closing position at price: ${currentPrice}`)

      // Call backend to close position
      const response = await api.post(`/positions/${positionId}/close`, {
        price: currentPrice
      })

      if (response.data.success) {
        console.log('✅ Position closed successfully')
        // Backend response received
        
        // Get the total return from backend response (margin + PnL)
        const totalReturn = response.data.position.totalReturn || 0
        const realizedPnL = response.data.position.realizedPnL || 0
        const margin = response.data.position.margin || 0
        
        // Show success toast with position close details
        const isProfit = realizedPnL > 0
        const pnlText = isProfit ? `+$${realizedPnL.toFixed(2)}` : `-$${Math.abs(realizedPnL).toFixed(2)}`
        
        showSuccess(
          `Position Closed Successfully`,
          `${position.symbol} ${position.side.toUpperCase()} • ${pnlText} PnL • Total Return: $${totalReturn.toFixed(2)}`,
          6000 // 6 second duration for important feedback
        )
        
        // Position closed with total return
        
        // Remove position from frontend state
        setPositions(prev => prev.filter(pos => pos._id !== positionId))
        
        // Update balance optimistically with total return (margin + PnL)
        if (matchData && userPlayer) {
          const currentBalance = userPlayer.currentBalance || 0
          const newBalance = currentBalance + totalReturn
          console.log(`💰 Balance update: ${currentBalance} + ${totalReturn} = ${newBalance}`)
          setOptimisticBalance(newBalance)
          // Updated balance optimistically
          
          // Also update the matchData state immediately for instant UI update
          setMatchData(prevData => ({
            ...prevData,
            players: prevData.players.map(player => 
              player.user._id === user?.id 
                ? { ...player, currentBalance: newBalance }
                : player
            )
          }))
        }
        
        // Refresh match data to get updated balance
        setTimeout(() => {
          updateBalanceOnly()
        }, 500)
        
        // Refresh orders and positions to show the new market order in history
        // Add delay to ensure backend processing is complete
        setTimeout(() => {
          console.log('🔄 Refreshing orders after position close...')
          debouncedFetchOrdersAndPositions()
        }, 1000) // 1 second delay to ensure order is saved
        
        // Also try a second refresh after a longer delay to ensure order appears
        setTimeout(() => {
          console.log('🔄 Second refresh of orders after position close...')
          debouncedFetchOrdersAndPositions()
        }, 2000) // 2 second delay as backup
      } else {
        console.error('Failed to close position:', response.data.message)
        showError(
          'Position Close Failed',
          response.data.message || 'Unable to close position. Please try again.',
          5000
        )
      }
    } catch (error) {
      console.error('Error closing position:', error)
      showError(
        'Position Close Error',
        'An error occurred while closing the position. Please try again.',
        5000
      )
    } finally {
      // Clear the closing state
      setClosingPosition(null)
    }
  }, [positions, tickerData, matchData, user, closingPosition])

  const handlePositionUpdate = useCallback((positionId, updates) => {
    setPositions(prev => prev.map(pos => 
      pos._id === positionId ? { ...pos, ...updates } : pos
    ))
  }, [])

  // Memoized components to prevent unnecessary re-renders
  const memoizedBinanceChart = useMemo(() => (
    <BinanceChart
      ticker={selectedTicker}
      onTickerSelect={() => setShowTickerSelector(true)}
    />
  ), [selectedTicker])

  const memoizedOrderManagement = useMemo(() => (
    <OrderManagement
      activeTab={activeOrderTab}
      onTabChange={setActiveOrderTab}
      orders={orders}
      positions={positions}
      matchId={matchData?._id}
      onPositionClose={handlePositionClose}
      onPositionUpdate={handlePositionUpdate}
      onRefreshOrders={debouncedFetchOrdersAndPositions}
      closingPosition={closingPosition}
    />
  ), [activeOrderTab, orders, positions, matchData?._id, handlePositionClose, handlePositionUpdate, closingPosition])

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

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
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
          optimisticBalance={optimisticBalance}
        />
      </div>

      {/* Main Trading Interface - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Top Row - Chart and Trading Panel */}
        <div className="flex min-h-screen">
          {/* Chart */}
          <div className="flex-1 border-r border-gray-200 dark:border-gray-700 min-w-0">
            {memoizedBinanceChart}
          </div>

          {/* Trading Panel */}
          <div className="w-72 flex-shrink-0">
            <TradingPanel
              ticker={selectedTicker}
              tickerData={tickerData}
              userBalance={getCurrentBalance()}
              matchId={matchData?._id || 'mock-match-id'}
              onOrderPlaced={(marginDeduction) => {
                // Show success toast for order placement
                showSuccess(
                  'Order Placed Successfully',
                  `Order submitted and margin deducted: $${marginDeduction.toFixed(2)}`,
                  4000
                )
                // Update balance optimistically
                handleOptimisticBalanceUpdate(marginDeduction)
                // Update balance only (no full re-render)
                setTimeout(() => {
                  updateBalanceOnly()
                }, 500)
                // Refresh orders and positions with debouncing
                debouncedFetchOrdersAndPositions()
              }}
              onOrderFailed={() => {
                // Show error toast for order failure
                showError(
                  'Order Failed',
                  'Unable to place order. Please check your balance and try again.',
                  5000
                )
                // Reset optimistic balance on failure
                setOptimisticBalance(null)
              }}
            />
          </div>
        </div>

        {/* Order Management - Below main interface, requires scrolling */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          {memoizedOrderManagement}
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
