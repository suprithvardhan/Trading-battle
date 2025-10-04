import React, { useEffect, useRef, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'

const BinanceChart = ({ ticker, onTickerSelect }) => {
  const { isDark } = useTheme()
  const chartRef = useRef()
  const canvasRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPrice, setCurrentPrice] = useState(0)
  const [priceChange, setPriceChange] = useState(0)
  const [priceChangePercent, setPriceChangePercent] = useState(0)
  const [selectedInterval, setSelectedInterval] = useState('1m')
  const [isLiveMode, setIsLiveMode] = useState(false)
  const [liveData, setLiveData] = useState([])
  const [isRealData, setIsRealData] = useState(false)
  const [persistent1sConnection, setPersistent1sConnection] = useState(null)
  const [currentTimeframeWs, setCurrentTimeframeWs] = useState(null)
  const [dataCache, setDataCache] = useState({})
  const [cacheLoading, setCacheLoading] = useState(false)

  // Available intervals
  const intervals = [
    { value: '1s', label: '1 Second' },
    { value: '1m', label: '1 Minute' },
    { value: '15m', label: '15 Minutes' },
    { value: '30m', label: '30 Minutes' }
  ]
  
  // Supported timeframes for caching
  const supportedTimeframes = ['1s', '1m', '15m', '30m']

  // Helper function to get interval in milliseconds
  const getIntervalMs = (interval) => {
    switch (interval) {
      case '1s': return 1000
      case '1m': return 60 * 1000
      case '5m': return 5 * 60 * 1000
      case '15m': return 15 * 60 * 1000
      case '1h': return 60 * 60 * 1000
      case '4h': return 4 * 60 * 60 * 1000
      case '1d': return 24 * 60 * 60 * 1000
      default: return 60 * 1000 // Default to 1 minute
    }
  }

  // Helper function to check if two times are within the same timeframe
  const isWithinSameTimeframe = (candleTime, currentTime, interval) => {
    const candleTimestamp = candleTime.getTime()
    const currentTimestamp = currentTime.getTime()
    
    switch (interval) {
      case '1s':
        return Math.floor(candleTimestamp / 1000) === Math.floor(currentTimestamp / 1000)
      case '1m':
        return Math.floor(candleTimestamp / 60000) === Math.floor(currentTimestamp / 60000)
      case '15m':
        return Math.floor(candleTimestamp / 900000) === Math.floor(currentTimestamp / 900000)
      case '30m':
        return Math.floor(candleTimestamp / 1800000) === Math.floor(currentTimestamp / 1800000)
      default:
        return false
    }
  }

  // Helper function to create a new timeframe candle
  const createTimeframeCandle = (oneSecondCandle, interval) => {
    const currentTime = new Date()
    let timeframeStart
    
    switch (interval) {
      case '1m':
        timeframeStart = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 
                                 currentTime.getHours(), currentTime.getMinutes(), 0, 0)
        break
      case '15m':
        const minutes = Math.floor(currentTime.getMinutes() / 15) * 15
        timeframeStart = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 
                                 currentTime.getHours(), minutes, 0, 0)
        break
      case '30m':
        const minutes30 = Math.floor(currentTime.getMinutes() / 30) * 30
        timeframeStart = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 
                                 currentTime.getHours(), minutes30, 0, 0)
        break
      default:
        timeframeStart = currentTime
    }
    
    return [
      timeframeStart.getTime(), // timeframe start timestamp
      oneSecondCandle[1], // open (from 1s candle)
      oneSecondCandle[2], // high (from 1s candle)
      oneSecondCandle[3], // low (from 1s candle)
      oneSecondCandle[4]  // close (from 1s candle)
    ]
  }

  // Fetch historical data from Binance REST API
  const fetchBinanceHistoricalData = async (symbol, interval, limit = 100) => {
    try {
      console.log(`📡 Fetching historical data for ${symbol} (${interval})...`)
      
      const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      const formattedData = data.map(kline => [
        kline[0], // timestamp
        parseFloat(kline[1]), // open
        parseFloat(kline[2]), // high
        parseFloat(kline[3]), // low
        parseFloat(kline[4])  // close
      ])
      
      console.log(`✅ Fetched ${formattedData.length} historical candles from Binance`)
      return formattedData
      
    } catch (error) {
      console.error('❌ Error fetching Binance data:', error)
      throw error
    }
  }

  // Connect to Binance WebSocket for real-time data
  const connectBinanceWebSocket = (symbol, interval) => {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🔗 Connecting to Binance WebSocket for ${symbol} (${interval})...`)
        
        const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`
        console.log(`🌐 WebSocket URL: ${wsUrl}`)
        const ws = new WebSocket(wsUrl)
        
        ws.onopen = () => {
          console.log(`✅ Binance WebSocket connected for ${symbol} (${interval})`)
          resolve(ws)
        }
        
        ws.onerror = (error) => {
          console.error('❌ Binance WebSocket error:', error)
          reject(error)
        }
        
        ws.onclose = () => {
          console.log('🔌 Binance WebSocket closed')
        }
        
      } catch (error) {
        console.error('❌ Error creating WebSocket:', error)
        reject(error)
      }
    })
  }

  // Connect to persistent 1-second WebSocket for continuous live data
  const connectPersistent1sWebSocket = (symbol) => {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🔗 Connecting to persistent 1s WebSocket for ${symbol}...`)
        
        const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_1s`
        console.log(`🌐 Persistent 1s WebSocket URL: ${wsUrl}`)
        const ws = new WebSocket(wsUrl)
        
        ws.onopen = () => {
          console.log(`✅ Persistent 1s WebSocket connected for ${symbol}`)
          resolve(ws)
        }
        
        ws.onerror = (error) => {
          console.error('❌ Persistent 1s WebSocket error:', error)
          reject(error)
        }
        
        ws.onclose = () => {
          console.log('🔌 Persistent 1s WebSocket closed')
        }
        
        setPersistent1sConnection(ws)
        
      } catch (error) {
        console.error('❌ Error creating persistent 1s WebSocket:', error)
        reject(error)
      }
    })
  }

  // Pre-load historical data for all supported timeframes
  const preloadHistoricalData = async (symbol) => {
    try {
      setCacheLoading(true)
      console.log(`🚀 Pre-loading historical data for ${symbol}...`)
      
      const cache = {}
      const promises = supportedTimeframes.map(async (timeframe) => {
        try {
          console.log(`📡 Loading ${timeframe} data for ${symbol}...`)
          const data = await fetchBinanceHistoricalData(symbol, timeframe, 100)
          cache[timeframe] = data
          console.log(`✅ Cached ${data.length} candles for ${symbol} (${timeframe})`)
          return { timeframe, data }
        } catch (error) {
          console.log(`⚠️ Failed to load ${timeframe} data for ${symbol}:`, error.message)
          return { timeframe, data: [] }
        }
      })
      
      await Promise.all(promises)
      
      setDataCache(prevCache => ({
        ...prevCache,
        [symbol]: cache
      }))
      
      setCacheLoading(false)
      console.log(`✅ All timeframes cached for ${symbol}!`)
      
    } catch (error) {
      console.error('❌ Error pre-loading data:', error)
      setCacheLoading(false)
    }
  }

  // Stop live mode and close WebSockets
  const stopLiveMode = () => {
    console.log('🛑 Stopping live mode...')
    
    if (currentTimeframeWs) {
      console.log('🔌 Closing current timeframe WebSocket connection...')
      currentTimeframeWs.close()
      setCurrentTimeframeWs(null)
    }
    
    setIsLiveMode(false)
    console.log('✅ Live mode stopped completely')
  }

  // Switch to a different timeframe with proper WebSocket management
  const switchTimeframe = async (newInterval) => {
    try {
      console.log(`🔄 Switching timeframe from ${selectedInterval} to ${newInterval}...`)
      
      // Stop current live mode and close existing WebSockets
      stopLiveMode()
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Fetch fresh data for the new timeframe
      console.log(`📡 Fetching fresh data for ${ticker} (${newInterval})...`)
      const freshData = await fetchBinanceHistoricalData(ticker, newInterval, 100)
      console.log(`✅ Got fresh data: ${freshData.length} candles for ${newInterval}`)
      
      // Update cache with fresh data
      setDataCache(prevCache => ({
        ...prevCache,
        [ticker]: {
          ...prevCache[ticker],
          [newInterval]: freshData
        }
      }))
      
      // Set the fresh data
      setLiveData(freshData)
      setIsRealData(true)
      
      // Update price info
      const latest = freshData[freshData.length - 1]
      setCurrentPrice(latest[4])
      
      const first = freshData[0]
      const change = latest[4] - first[4]
      const changePercent = (change / first[4]) * 100
      setPriceChange(change)
      setPriceChangePercent(changePercent)
      
      // Connect to the new timeframe WebSocket
      console.log(`🔗 Connecting to ${newInterval} WebSocket...`)
      const timeframeWs = await connectBinanceWebSocket(ticker, newInterval)
      setCurrentTimeframeWs(timeframeWs)
      
      // Handle timeframe-specific kline data
      timeframeWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.k) {
            const kline = data.k
            const newCandle = [
              kline.t, // timestamp
              parseFloat(kline.o), // open
              parseFloat(kline.h), // high
              parseFloat(kline.l), // low
              parseFloat(kline.c)  // close
            ]
            
            console.log(`🕯️ New ${newInterval} candle:`, newCandle)
            console.log(`🕯️ Candle interval:`, kline.i)
            console.log(`🕯️ Candle is closed:`, kline.x)
            
            setLiveData(prevData => {
              const lastCandle = prevData[prevData.length - 1]
              
              // If it's the same candle (same timestamp), update it
              if (lastCandle && lastCandle[0] === newCandle[0]) {
                console.log(`🔄 Updating existing ${newInterval} candle`)
                return [...prevData.slice(0, -1), newCandle]
              } else {
                console.log(`➕ Adding new ${newInterval} candle`)
                const updatedData = [...prevData, newCandle]
                return updatedData.length > 120 ? updatedData.slice(-120) : updatedData
              }
            })
          }
        } catch (error) {
          console.error(`❌ Error processing ${newInterval} WebSocket message:`, error)
        }
      }
      
      // Price updates are handled by persistent 1s WebSocket
      
      // Start live mode
      setIsLiveMode(true)
      console.log(`✅ Successfully switched to ${newInterval} timeframe with live formation`)
      
    } catch (error) {
      console.error(`❌ Error switching to ${newInterval} timeframe:`, error)
      setError(`Failed to switch timeframe: ${error.message}`)
    }
  }

  // Initialize chart with cached data and live mode
  const initializeChart = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🎯 Starting chart initialization...')
      console.log(`📊 Target: ${ticker} (${selectedInterval})`)

      // Check if we have cached data
      if (dataCache[ticker] && dataCache[ticker][selectedInterval]) {
        console.log(`📦 Using cached data for ${ticker} (${selectedInterval})`)
        const cachedData = dataCache[ticker][selectedInterval]
        console.log(`📊 Cached data: ${cachedData.length} candles`)
        setLiveData(cachedData)
        setIsRealData(true)
        
        // Set current price from latest candle
        const latest = cachedData[cachedData.length - 1]
        setCurrentPrice(latest[4])
        
        // Calculate price change
        const first = cachedData[0]
        const change = latest[4] - first[4]
        const changePercent = (change / first[4]) * 100
        setPriceChange(change)
        setPriceChangePercent(changePercent)
        
        // Start live mode immediately
        setIsLiveMode(true)
        console.log('✅ Live mode started with cached data')
        
        // Use switchTimeframe to establish proper WebSocket connection
        setTimeout(() => {
          switchTimeframe(selectedInterval)
        }, 100)
      } else {
        console.log(`📡 No cached data found, pre-loading for ${ticker}...`)
        await preloadHistoricalData(ticker)
        
        // After pre-loading, use the cached data
        if (dataCache[ticker] && dataCache[ticker][selectedInterval]) {
          const cachedData = dataCache[ticker][selectedInterval]
          console.log(`📊 Using pre-loaded data: ${cachedData.length} candles`)
          setLiveData(cachedData)
          setIsRealData(true)
          
          const latest = cachedData[cachedData.length - 1]
          setCurrentPrice(latest[4])
          
          const first = cachedData[0]
          const change = latest[4] - first[4]
          const changePercent = (change / first[4]) * 100
          setPriceChange(change)
          setPriceChangePercent(changePercent)
          
          // Start live mode immediately
          setIsLiveMode(true)
          console.log('✅ Live mode started with pre-loaded data')
          
          // Use switchTimeframe to establish proper WebSocket connection
          setTimeout(() => {
            switchTimeframe(selectedInterval)
          }, 100)
        } else {
          console.log('⚠️ No cached data available, fetching real data...')
          try {
            const realData = await fetchBinanceHistoricalData(ticker, selectedInterval, 100)
            console.log(`✅ Fetched real data: ${realData.length} candles`)
            setLiveData(realData)
            setIsRealData(true)
            
            const latest = realData[realData.length - 1]
            setCurrentPrice(latest[4])
            
            const first = realData[0]
            const change = latest[4] - first[4]
            const changePercent = (change / first[4]) * 100
            setPriceChange(change)
            setPriceChangePercent(changePercent)
            
            // Start live mode immediately
            setIsLiveMode(true)
            console.log('✅ Live mode started with fresh data')
            
            // Use switchTimeframe to establish proper WebSocket connection
            setTimeout(() => {
              switchTimeframe(selectedInterval)
            }, 100)
          } catch (error) {
            console.log('⚠️ Real data failed, using empty data')
            setLiveData([])
            setIsRealData(false)
          }
        }
      }

      setLoading(false)
      console.log(`✅ Chart initialization completed for ${ticker}`)

    } catch (error) {
      console.error('❌ Error initializing chart:', error)
      setError(`Failed to load chart: ${error.message}`)
      setLoading(false)
    }
  }

  // Initialize chart on mount
  useEffect(() => {
    if (ticker) {
      initializeChart()
    }
  }, [ticker])

  // Handle timeframe switching
  useEffect(() => {
    if (isLiveMode && ticker) {
      console.log(`🔄 Timeframe switched to ${ticker} (${selectedInterval})`)
      
      // Use the switchTimeframe function for clean switching
      switchTimeframe(selectedInterval)
    }
  }, [selectedInterval])

  // Establish persistent 1-second WebSocket connection
  useEffect(() => {
    if (!ticker) return

    const establishPersistentConnection = async () => {
      try {
        console.log('🚀 Establishing persistent 1s WebSocket connection...')
        const persistentWs = await connectPersistent1sWebSocket(ticker)
        
        // Handle 1-second kline data
        persistentWs.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.k) {
              const kline = data.k
              const newCandle = [
                kline.t, // timestamp
                parseFloat(kline.o), // open
                parseFloat(kline.h), // high
                parseFloat(kline.l), // low
                parseFloat(kline.c)  // close
              ]
              
              // Always update price from 1s WebSocket data
              setCurrentPrice(parseFloat(kline.c))
              
              // Update live data based on current timeframe
              if (isLiveMode) {
                if (selectedInterval === '1s') {
                  console.log('⚡ Processing 1s candle for 1s timeframe')
                  setLiveData(prevData => {
                    const lastCandle = prevData[prevData.length - 1]
                    
                    // If it's the same candle (same timestamp), update it
                    if (lastCandle && lastCandle[0] === newCandle[0]) {
                      console.log('🔄 Updating existing 1s candle')
                      return [...prevData.slice(0, -1), newCandle]
                    } else {
                      console.log('➕ Adding new 1s candle')
                      const updatedData = [...prevData, newCandle]
                      return updatedData.length > 120 ? updatedData.slice(-120) : updatedData
                    }
                  })
                } else {
                  // For other timeframes, update the current candle with 1s data
                  console.log(`⚡ Updating ${selectedInterval} candle with 1s data`)
                  setLiveData(prevData => {
                    if (prevData.length === 0) return prevData
                    
                    const lastCandle = prevData[prevData.length - 1]
                    const currentTime = new Date()
                    const candleTime = new Date(lastCandle[0])
                    
                    // Check if we're still in the same timeframe period
                    const isSameTimeframe = isWithinSameTimeframe(candleTime, currentTime, selectedInterval)
                    
                    if (isSameTimeframe) {
                      // Update the existing candle with new price data
                      const updatedCandle = [
                        lastCandle[0], // Keep original timestamp
                        lastCandle[1], // Keep original open
                        Math.max(lastCandle[2], parseFloat(kline.h)), // Update high
                        Math.min(lastCandle[3], parseFloat(kline.l)), // Update low
                        parseFloat(kline.c) // Update close with current price
                      ]
                      
                      console.log(`🔄 Updating ${selectedInterval} candle:`, updatedCandle)
                      return [...prevData.slice(0, -1), updatedCandle]
                    } else {
                      // Timeframe boundary crossed, add new candle
                      const newTimeframeCandle = createTimeframeCandle(newCandle, selectedInterval)
                      console.log(`➕ Adding new ${selectedInterval} candle:`, newTimeframeCandle)
                      const updatedData = [...prevData, newTimeframeCandle]
                      return updatedData.length > 120 ? updatedData.slice(-120) : updatedData
                    }
                  })
                }
              }
            }
          } catch (error) {
            console.error('❌ Error processing persistent 1s WebSocket message:', error)
          }
        }
        
        console.log('✅ Persistent 1s WebSocket established and ready')
        
      } catch (error) {
        console.error('❌ Failed to establish persistent 1s WebSocket:', error)
      }
    }
    
    if (ticker) {
      establishPersistentConnection()
    }

    // Cleanup function
    return () => {
      if (persistent1sConnection) {
        console.log('🔌 Closing persistent 1s WebSocket...')
        persistent1sConnection.close()
        setPersistent1sConnection(null)
      }
    }
  }, [ticker]) // Only depend on ticker

  // Cleanup current timeframe WebSocket on unmount
  useEffect(() => {
    return () => {
      if (currentTimeframeWs) {
        console.log('🔌 Closing current timeframe WebSocket...')
        currentTimeframeWs.close()
        setCurrentTimeframeWs(null)
      }
    }
  }, [currentTimeframeWs])

  // Professional fallback chart component with zoom
  const FallbackChart = () => {
    const [zoomLevel, setZoomLevel] = useState(1)
    const [panOffset, setPanOffset] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [lastMouseX, setLastMouseX] = useState(0)
    const [lastRenderTime, setLastRenderTime] = useState(0)
    const renderTimeoutRef = useRef(null)
    const lastDataHashRef = useRef('')
    
    const dataToShow = isLiveMode ? liveData : (liveData.length > 0 ? liveData : [])
    
    // Reset zoom and pan when switching between live and static data
    useEffect(() => {
      setZoomLevel(1)
      setPanOffset(0)
    }, [isLiveMode])
    
    // Debounced render function to prevent flashing
    const renderChart = () => {
      if (!canvasRef.current) {
        console.log('⚠️ Canvas not ready')
        return
      }
      
      if (dataToShow.length === 0) {
        console.log('⚠️ No data to show')
        return
      }
      
      const now = Date.now()
      const timeSinceLastRender = now - lastRenderTime
      
      // Create a simple hash of the data to detect significant changes
      const dataHash = `${dataToShow.length}-${dataToShow[dataToShow.length - 1]?.[4] || 0}-${zoomLevel}-${panOffset}`
      
      // Only render if data has changed significantly or enough time has passed
      if (dataHash === lastDataHashRef.current && timeSinceLastRender < 200) {
        if (renderTimeoutRef.current) {
          cancelAnimationFrame(renderTimeoutRef.current)
        }
        renderTimeoutRef.current = requestAnimationFrame(renderChart)
        return
      }
      
      lastDataHashRef.current = dataHash
      
      setLastRenderTime(now)
      
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const rect = canvas.getBoundingClientRect()
      
      // Set canvas size
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      
      // Clear canvas
      ctx.clearRect(0, 0, rect.width, rect.height)
      
      if (dataToShow.length === 0) return
      
      // Find min/max values
      let minPrice = Infinity
      let maxPrice = -Infinity
      dataToShow.forEach(candle => {
        minPrice = Math.min(minPrice, candle[2], candle[3]) // high, low
        maxPrice = Math.max(maxPrice, candle[2], candle[3]) // high, low
      })
      
      const padding = 60
      const chartWidth = rect.width - padding * 2
      const chartHeight = rect.height - padding * 2
      const priceRange = maxPrice - minPrice
      
      // Draw background
      ctx.fillStyle = isDark ? '#1a1a1a' : '#ffffff'
      ctx.fillRect(0, 0, rect.width, rect.height)
      
      // Draw grid
      ctx.strokeStyle = isDark ? '#333333' : '#e1e1e1'
      ctx.lineWidth = 1
      for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i
        ctx.beginPath()
        ctx.moveTo(padding, y)
        ctx.lineTo(rect.width - padding, y)
        ctx.stroke()
      }
      
      // Draw vertical grid lines
      for (let i = 0; i <= 10; i++) {
        const x = padding + (chartWidth / 10) * i
        ctx.beginPath()
        ctx.moveTo(x, padding)
        ctx.lineTo(x, rect.height - padding)
        ctx.stroke()
      }
      
      // Calculate visible range based on zoom and pan
      const visibleCandles = Math.ceil(dataToShow.length / zoomLevel)
      
      // For live mode, position the last candle in the middle-right with space for new candles
      let startIndex, endIndex
      if (isLiveMode) {
        // Show last 60% of data, leaving 40% space for new candles
        const totalCandles = dataToShow.length
        const showCandles = Math.floor(totalCandles * 0.6) // Show 60% of data
        startIndex = Math.max(0, totalCandles - showCandles)
        endIndex = totalCandles
      } else {
        // For static data, use normal pan/zoom
        startIndex = Math.max(0, Math.floor(panOffset))
        endIndex = Math.min(dataToShow.length, startIndex + visibleCandles)
      }
      
      const visibleData = dataToShow.slice(startIndex, endIndex)
      
      // Draw candlesticks
      const candleWidth = Math.max(2, (chartWidth / visibleCandles) - 1)
      
      // For live mode, leave space on the right for new candles
      const availableWidth = isLiveMode ? chartWidth * 0.6 : chartWidth // Use 60% of width for live mode
      const candleSpacing = availableWidth / visibleData.length
      
      visibleData.forEach((candle, index) => {
        const x = padding + candleSpacing * index + candleWidth / 2
        const open = candle[1]
        const high = candle[2]
        const low = candle[3]
        const close = candle[4]
        
        const openY = padding + chartHeight - ((open - minPrice) / priceRange) * chartHeight
        const closeY = padding + chartHeight - ((close - minPrice) / priceRange) * chartHeight
        const highY = padding + chartHeight - ((high - minPrice) / priceRange) * chartHeight
        const lowY = padding + chartHeight - ((low - minPrice) / priceRange) * chartHeight
        
        const isGreen = close >= open
        const isLastCandle = index === visibleData.length - 1 && isLiveMode
        
        // Draw wick
        ctx.strokeStyle = isGreen ? '#26a69a' : '#ef5350'
        ctx.lineWidth = Math.max(1, candleWidth / 3)
        if (isLastCandle) {
          ctx.lineWidth = Math.max(2, candleWidth / 2) // Thicker for live candle
        }
        ctx.beginPath()
        ctx.moveTo(x, highY)
        ctx.lineTo(x, lowY)
        ctx.stroke()
        
        // Draw body
        ctx.fillStyle = isGreen ? '#26a69a' : '#ef5350'
        if (isLastCandle) {
          ctx.fillStyle = isGreen ? '#4caf50' : '#f44336' // Brighter for live candle
        }
        const bodyHeight = Math.abs(closeY - openY)
        const bodyY = Math.min(openY, closeY)
        ctx.fillRect(x - candleWidth/2, bodyY, candleWidth, Math.max(1, bodyHeight))
        
        // Draw body border
        ctx.strokeStyle = isGreen ? '#1e8a7a' : '#d32f2f'
        if (isLastCandle) {
          ctx.strokeStyle = isGreen ? '#2e7d32' : '#c62828' // Darker border for live candle
        }
        ctx.lineWidth = isLastCandle ? 2 : 1
        ctx.strokeRect(x - candleWidth/2, bodyY, candleWidth, Math.max(1, bodyHeight))
        
        // Draw live indicator for current candle
        if (isLastCandle) {
          ctx.fillStyle = '#ffeb3b'
          ctx.font = 'bold 10px Inter, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('LIVE', x, highY - 5)
        }
      })
      
      // Draw price labels
      ctx.fillStyle = isDark ? '#ffffff' : '#000000'
      ctx.font = '12px Inter, sans-serif'
      ctx.textAlign = 'right'
      for (let i = 0; i <= 5; i++) {
        const price = maxPrice - (priceRange / 5) * i
        const y = padding + (chartHeight / 5) * i + 4
        ctx.fillText(price.toFixed(2), padding - 10, y)
      }
      
      // Draw title with live indicator
      ctx.fillStyle = isDark ? '#ffffff' : '#000000'
      ctx.font = 'bold 16px Inter, sans-serif'
      ctx.textAlign = 'left'
      const title = `${ticker} Candlestick Chart${isLiveMode ? ' (LIVE)' : ''}`
      ctx.fillText(title, padding, 25)
      
      // Draw zoom info
      ctx.font = '12px Inter, sans-serif'
      ctx.fillText(`Zoom: ${zoomLevel.toFixed(1)}x`, rect.width - 100, 25)
      
      // Draw space indicator for new candles in live mode
      if (isLiveMode) {
        const spaceStartX = padding + availableWidth
        const spaceEndX = rect.width - padding
        
        // Draw dashed line to show space for new candles
        ctx.strokeStyle = isDark ? '#666666' : '#cccccc'
        ctx.lineWidth = 1
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(spaceStartX, padding)
        ctx.lineTo(spaceStartX, rect.height - padding)
        ctx.stroke()
        ctx.setLineDash([])
        
        // Draw "New Candles" label
        ctx.fillStyle = isDark ? '#888888' : '#666666'
        ctx.font = '10px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('New Candles', (spaceStartX + spaceEndX) / 2, padding + 15)
      }
    }
    
    useEffect(() => {
      console.log('🎨 FallbackChart render:', {
        isLiveMode,
        liveDataLength: liveData.length,
        dataToShowLength: dataToShow.length,
        ticker,
        selectedInterval
      })
      
      // Use debounced render function
      renderChart()
      
    }, [dataToShow, isDark, ticker, isLiveMode, zoomLevel, panOffset, liveData.length])
    
    // Cleanup animation frame on unmount
    useEffect(() => {
      return () => {
        if (renderTimeoutRef.current) {
          cancelAnimationFrame(renderTimeoutRef.current)
        }
      }
    }, [])
    
    // Mouse wheel zoom
    const handleWheel = (e) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setZoomLevel(prev => Math.max(0.1, Math.min(10, prev * delta)))
    }
    
    // Mouse drag pan
    const handleMouseDown = (e) => {
      setIsDragging(true)
      setLastMouseX(e.clientX)
    }
    
    const handleMouseMove = (e) => {
      if (isDragging) {
        const deltaX = e.clientX - lastMouseX
        setPanOffset(prev => Math.max(0, prev - deltaX * 0.1))
        setLastMouseX(e.clientX)
      }
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
    }
    
    return (
      <div className="w-full h-full flex items-center justify-center relative">
        <canvas
          key={`chart-${ticker}-${selectedInterval}-${liveData.length}`}
          ref={canvasRef}
          className="w-full h-full cursor-grab"
          style={{ maxHeight: '500px' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading chart...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-2">❌</div>
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chart Header */}
      <div className={`p-2 border-b transition-colors duration-300 ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onTickerSelect}
              className={`flex items-center space-x-2 px-2 py-1.5 rounded-md transition-colors duration-300 ${
                isDark 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              <span className="font-medium text-sm">{ticker}</span>
            </button>

            {currentPrice > 0 && (
              <div className="flex items-center space-x-2">
                <span className={`text-lg font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <div className={`flex items-center space-x-1 ${
                  priceChange >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  <span className="font-medium text-sm">
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              {intervals.map((interval) => (
                <button
                  key={interval.value}
                  onClick={() => setSelectedInterval(interval.value)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors duration-300 ${
                    selectedInterval === interval.value
                      ? 'bg-blue-600 text-white'
                      : isDark
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {interval.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 relative">
        <div className="w-full h-full" style={{ minHeight: '500px' }}>
          <FallbackChart />
        </div>
      </div>

      {/* Chart Footer */}
      <div className={`p-1 border-t transition-colors duration-300 ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between text-xs">
          <div className={`transition-colors duration-300 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <div className="flex items-center space-x-3">
            <div className={`transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Real-time data via WebSocket
            </div>
            {isLiveMode && (
              <div className="flex items-center space-x-1 text-green-500">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs">LIVE</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BinanceChart
