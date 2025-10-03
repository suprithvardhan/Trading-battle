import React, { useEffect, useState, useRef } from 'react'
import { useTheme } from '../contexts/ThemeContext'

// Dynamic import for Highcharts to avoid loading issues
let Highcharts = null
let HighchartsReact = null
let HighchartsStock = null

// Load Highcharts dynamically
const loadHighcharts = async () => {
  try {
    const highchartsModule = await import('highcharts')
    const highchartsReactModule = await import('highcharts-react-official')
    const highchartsStockModule = await import('highcharts/modules/stock')
    
    Highcharts = highchartsModule.default
    HighchartsReact = highchartsReactModule.default
    HighchartsStock = highchartsStockModule.default
    
    // Initialize Highcharts Stock module
    HighchartsStock(Highcharts)
    
    return true
  } catch (error) {
    console.error('Failed to load Highcharts:', error)
    return false
  }
}

const DemoChart = () => {
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT')
  const [selectedInterval, setSelectedInterval] = useState('1s')
  const [currentPrice, setCurrentPrice] = useState(0)
  const [priceChange, setPriceChange] = useState(0)
  const [priceChangePercent, setPriceChangePercent] = useState(0)
  const [chartData, setChartData] = useState([])
  const [highchartsLoaded, setHighchartsLoaded] = useState(false)
  const [useFallbackChart, setUseFallbackChart] = useState(false)
  const [isLiveMode, setIsLiveMode] = useState(false)
  const [liveData, setLiveData] = useState([])
  const [isRealData, setIsRealData] = useState(false)
  const [wsConnection, setWsConnection] = useState(null)
  const [priceWsConnection, setPriceWsConnection] = useState(null)
  const [persistent1sConnection, setPersistent1sConnection] = useState(null)
  const [currentTimeframeWs, setCurrentTimeframeWs] = useState(null)
  const [dataCache, setDataCache] = useState({})
  const [cacheLoading, setCacheLoading] = useState(false)
  const chartRef = useRef(null)
  const canvasRef = useRef(null)
  const liveIntervalRef = useRef(null)

  // Available symbols and intervals (optimized for fast loading)
  const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT']
  const intervals = [
    { value: '1s', label: '1 Second' },
    { value: '1m', label: '1 Minute' },
    { value: '15m', label: '15 Minutes' },
    { value: '30m', label: '30 Minutes' }
  ]
  
  // Supported timeframes for caching
  const supportedTimeframes = ['1s', '1m', '15m', '30m']

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

  // Helper function to get volatility based on interval
  const getVolatilityForInterval = (interval) => {
    switch (interval) {
      case '1s': return 0.0001  // Very small for 1 second
      case '1m': return 0.001   // Small for 1 minute
      case '15m': return 0.01   // Larger for 15 minutes
      case '30m': return 0.02   // Large for 30 minutes
      default: return 0.001
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
          // Generate fallback data
          const fallbackData = generateSampleDataForTimeframe(symbol, timeframe, 100)
          cache[timeframe] = fallbackData
          console.log(`📊 Generated ${fallbackData.length} sample candles for ${symbol} (${timeframe})`)
          return { timeframe, data: fallbackData }
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

  // Generate sample data for specific timeframe
  const generateSampleDataForTimeframe = (symbol, timeframe, count) => {
    const data = []
    const basePrice = symbol === 'BTCUSDT' ? 50000 : 
                     symbol === 'ETHUSDT' ? 3000 :
                     symbol === 'BNBUSDT' ? 300 :
                     symbol === 'ADAUSDT' ? 0.5 : 100
    
    let currentPrice = basePrice
    const intervalMs = getIntervalMs(timeframe)
    const volatility = getVolatilityForInterval(timeframe)
    
    for (let i = count; i >= 0; i--) {
      const time = new Date(Date.now() - (i * intervalMs))
      const priceChange = currentPrice * (Math.random() - 0.5) * volatility
      currentPrice += priceChange
      
      data.push([
        time.getTime(),
        currentPrice - priceChange,
        currentPrice + Math.random() * currentPrice * 0.005,
        currentPrice - Math.random() * currentPrice * 0.005,
        currentPrice
      ])
    }
    
    return data
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
        
        setWsConnection(ws)
        
      } catch (error) {
        console.error('❌ Error creating WebSocket:', error)
        reject(error)
      }
    })
  }

  // Connect to Binance ticker WebSocket for real-time price updates (every second)
  const connectPriceWebSocket = (symbol) => {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🔗 Connecting to price WebSocket for ${symbol}...`)
        
        const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`
        const ws = new WebSocket(wsUrl)
        
        ws.onopen = () => {
          console.log(`✅ Price WebSocket connected for ${symbol}`)
          resolve(ws)
        }
        
        ws.onerror = (error) => {
          console.error('❌ Price WebSocket error:', error)
          reject(error)
        }
        
        ws.onclose = () => {
          console.log('🔌 Price WebSocket closed')
        }
        
        setPriceWsConnection(ws)
        
      } catch (error) {
        console.error('❌ Error creating price WebSocket:', error)
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

  // Generate 100 minutes of sample candlestick data (fallback)
  const generateSampleData = (symbol = 'BTCUSDT', minutes = 100) => {
    const data = []
    const basePrice = symbol === 'BTCUSDT' ? 50000 : 
                     symbol === 'ETHUSDT' ? 3000 :
                     symbol === 'BNBUSDT' ? 300 :
                     symbol === 'ADAUSDT' ? 0.5 : 100
    
    let currentPrice = basePrice
    const now = new Date()
    
    for (let i = minutes; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * 60 * 1000)) // 1 minute intervals
      
      // Generate realistic price movement
      const volatility = 0.02 // 2% volatility
      const trend = Math.sin(i / 20) * 0.01 // Slight trend
      const random = (Math.random() - 0.5) * volatility
      const priceChange = currentPrice * (trend + random)
      
      const open = currentPrice
      const close = currentPrice + priceChange
      const high = Math.max(open, close) + Math.random() * currentPrice * 0.005
      const low = Math.min(open, close) - Math.random() * currentPrice * 0.005
      
      data.push([
        time.getTime(), // Highcharts expects timestamp
        open,
        high,
        low,
        close
      ])
      
      currentPrice = close
    }
    
    return data
  }

  // Initialize chart with cached data and live mode
  const initializeChart = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🎯 Starting chart initialization...')
      console.log(`⏰ Initialization time: ${new Date().toLocaleTimeString()}`)
      console.log(`📊 Target: ${selectedSymbol} (${selectedInterval})`)

      // Always start with 1-second data and live mode
      console.log(`🚀 Starting with 1-second live mode for ${selectedSymbol}...`)
      
      // Check if we have cached 1-second data
      if (dataCache[selectedSymbol] && dataCache[selectedSymbol]['1s']) {
        console.log(`📦 Using cached 1s data for ${selectedSymbol}`)
        const cachedData = dataCache[selectedSymbol]['1s']
        console.log(`📊 Cached 1s data: ${cachedData.length} candles`)
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
        console.log('✅ 1-second live mode started with cached data')
        
        // Use switchTimeframe to establish proper WebSocket connection
        setTimeout(() => {
          switchTimeframe('1s')
        }, 100)
      } else {
        console.log(`📡 No cached data found, pre-loading for ${selectedSymbol}...`)
        await preloadHistoricalData(selectedSymbol)
        
        // After pre-loading, use the 1-second cached data
        if (dataCache[selectedSymbol] && dataCache[selectedSymbol]['1s']) {
          const cachedData = dataCache[selectedSymbol]['1s']
          console.log(`📊 Using pre-loaded 1s data: ${cachedData.length} candles`)
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
          console.log('✅ 1-second live mode started with pre-loaded data')
          
          // Use switchTimeframe to establish proper WebSocket connection
          setTimeout(() => {
            switchTimeframe('1s')
          }, 100)
        } else {
          console.log('⚠️ No cached 1s data available, fetching real 1s data...')
          // Try to fetch real 1-second data first
          try {
            const realData = await fetchBinanceHistoricalData(selectedSymbol, '1s', 100)
            console.log(`✅ Fetched real 1s data: ${realData.length} candles`)
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
            console.log('✅ 1-second live mode started with fresh data')
            
            // Use switchTimeframe to establish proper WebSocket connection
            setTimeout(() => {
              switchTimeframe('1s')
            }, 100)
          } catch (error) {
            console.log('⚠️ Real 1s data failed, using sample 1s data as fallback')
            // Generate sample 1-second data as fallback
            const sampleData = generateSampleDataForTimeframe(selectedSymbol, '1s', 100)
            setLiveData(sampleData)
            setIsRealData(false)
            
            const latest = sampleData[sampleData.length - 1]
            setCurrentPrice(latest[4])
            
            const first = sampleData[0]
            const change = latest[4] - first[4]
            const changePercent = (change / first[4]) * 100
            setPriceChange(change)
            setPriceChangePercent(changePercent)
            
            // Start live mode immediately
            setIsLiveMode(true)
            console.log('✅ 1-second live mode started with sample data')
            
            // Use switchTimeframe to establish proper WebSocket connection
            setTimeout(() => {
              switchTimeframe('1s')
            }, 100)
          }
        }
      }

      setLoading(false)
      console.log(`✅ Chart initialization completed for ${selectedSymbol}`)

    } catch (error) {
      console.error('❌ Error initializing chart:', error)
      setError(`Failed to load chart: ${error.message}`)
      setLoading(false)
    }
  }

  // Highcharts configuration
  const chartOptions = {
    chart: {
      type: 'candlestick',
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      style: {
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }
    },
    title: {
      text: `${selectedSymbol} Candlestick Chart`,
      style: {
        color: isDark ? '#ffffff' : '#000000',
        fontSize: '18px',
        fontWeight: '600'
      }
    },
    xAxis: {
      type: 'datetime',
      labels: {
        style: {
          color: isDark ? '#ffffff' : '#000000'
        }
      },
      lineColor: isDark ? '#333333' : '#cccccc',
      tickColor: isDark ? '#333333' : '#cccccc'
    },
    yAxis: {
      title: {
        text: 'Price',
        style: {
          color: isDark ? '#ffffff' : '#000000'
        }
      },
      labels: {
        style: {
          color: isDark ? '#ffffff' : '#000000'
        },
        formatter: function() {
          return this.value.toFixed(2)
        }
      },
      lineColor: isDark ? '#333333' : '#cccccc',
      gridLineColor: isDark ? '#2a2a2a' : '#e1e1e1'
    },
    plotOptions: {
      candlestick: {
        color: '#ef5350', // Down candles (red)
        upColor: '#26a69a', // Up candles (green)
        lineColor: '#ef5350',
        upLineColor: '#26a69a',
        dataLabels: {
          enabled: false
        },
        states: {
          hover: {
            lineWidth: 2
          }
        }
      }
    },
    series: [{
      name: selectedSymbol,
      type: 'candlestick',
      data: chartData,
      color: '#ef5350',
      upColor: '#26a69a',
      lineColor: '#ef5350',
      upLineColor: '#26a69a',
      dataGrouping: {
        enabled: false
      }
    }],
    tooltip: {
      backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
      borderColor: isDark ? '#444444' : '#cccccc',
      style: {
        color: isDark ? '#ffffff' : '#000000'
      },
      formatter: function() {
        const point = this.point
        const open = point.open
        const high = point.high
        const low = point.low
        const close = point.close
        const change = close - open
        const changePercent = ((change / open) * 100).toFixed(2)
        
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${selectedSymbol}</div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>Open:</span>
              <span style="font-weight: bold;">$${open.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>High:</span>
              <span style="font-weight: bold;">$${high.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>Low:</span>
              <span style="font-weight: bold;">$${low.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Close:</span>
              <span style="font-weight: bold;">$${close.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: ${change >= 0 ? '#26a69a' : '#ef5350'}; font-weight: bold;">
              <span>Change:</span>
              <span>${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent}%)</span>
            </div>
          </div>
        `
      }
    },
    rangeSelector: {
      enabled: true,
      buttons: [{
        type: 'minute',
        count: 15,
        text: '15m'
      }, {
        type: 'minute',
        count: 30,
        text: '30m'
      }, {
        type: 'hour',
        count: 1,
        text: '1h'
      }, {
        type: 'hour',
        count: 4,
        text: '4h'
      }, {
        type: 'day',
        count: 1,
        text: '1d'
      }, {
        type: 'all',
        text: 'All'
      }],
      inputEnabled: true,
      inputDateFormat: '%Y-%m-%d',
      inputEditDateFormat: '%Y-%m-%d',
      selected: 2, // Default to 1h
      buttonTheme: {
        fill: isDark ? '#2a2a2a' : '#f7f7f7',
        stroke: isDark ? '#444444' : '#cccccc',
        style: {
          color: isDark ? '#ffffff' : '#000000'
        },
        states: {
          hover: {
            fill: isDark ? '#333333' : '#e6e6e6',
            stroke: isDark ? '#555555' : '#999999'
          },
          select: {
            fill: isDark ? '#444444' : '#d4d4d4',
            stroke: isDark ? '#666666' : '#999999',
            style: {
              color: isDark ? '#ffffff' : '#000000'
            }
          }
        }
      },
      inputStyle: {
        backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
        border: `1px solid ${isDark ? '#444444' : '#cccccc'}`
      }
    },
    navigator: {
      enabled: true,
      height: 40,
      xAxis: {
        labels: {
          style: {
            color: isDark ? '#ffffff' : '#000000'
          }
        }
      },
      handles: {
        backgroundColor: isDark ? '#666666' : '#cccccc',
        borderColor: isDark ? '#888888' : '#999999'
      },
      outlineColor: isDark ? '#666666' : '#cccccc',
      maskFill: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'
    },
    scrollbar: {
      enabled: true,
      barBackgroundColor: isDark ? '#444444' : '#cccccc',
      barBorderRadius: 0,
      buttonBackgroundColor: isDark ? '#666666' : '#999999',
      buttonBorderColor: isDark ? '#888888' : '#bbbbbb',
      rifleColor: isDark ? '#ffffff' : '#000000',
      trackBackgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
      trackBorderColor: isDark ? '#444444' : '#cccccc'
    },
    credits: {
      enabled: false
    },
    legend: {
      enabled: false
    },
    responsive: {
      rules: [{
        condition: {
          maxWidth: 768
        },
        chartOptions: {
          rangeSelector: {
            buttonTheme: {
              style: {
                fontSize: '10px'
              }
            }
          }
        }
      }]
    }
  }

  // Load Highcharts on mount
  useEffect(() => {
    const loadCharts = async () => {
      console.log('🔄 Loading Highcharts...')
      const loaded = await loadHighcharts()
      if (loaded) {
        console.log('✅ Highcharts loaded successfully')
        setHighchartsLoaded(true)
      } else {
        console.log('⚠️ Highcharts failed to load, using fallback chart')
        setUseFallbackChart(true)
      }
    }
    
    loadCharts()
  }, [])

  // Initialize chart on mount
  useEffect(() => {
    // Add a small delay to ensure the component is mounted
    setTimeout(() => {
      initializeChart()
    }, 100)
  }, [])

  // Establish persistent 1-second WebSocket connection
  useEffect(() => {
    const establishPersistentConnection = async () => {
      try {
        console.log('🚀 Establishing persistent 1s WebSocket connection...')
        const persistentWs = await connectPersistent1sWebSocket(selectedSymbol)
        
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
              
              console.log('⚡ Persistent 1s candle:', newCandle)
              console.log('⚡ Candle interval:', kline.i)
              console.log('⚡ Candle is closed:', kline.x)
              
              // Always update price from 1s WebSocket data
              setCurrentPrice(parseFloat(kline.c))
              console.log(`💰 Price update from 1s WebSocket: $${parseFloat(kline.c)}`)
              
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
    
    establishPersistentConnection()
  }, [selectedSymbol, isLiveMode])

  // Price updates are now handled by the 1s WebSocket connection

  // Pre-load data for all symbols on mount (background loading)
  useEffect(() => {
    const preloadAllSymbols = async () => {
      console.log('🚀 Pre-loading data for all symbols in background...')
      for (const symbol of symbols) {
        if (symbol !== selectedSymbol) { // Don't reload current symbol
          try {
            await preloadHistoricalData(symbol)
            console.log(`✅ Background loaded ${symbol}`)
          } catch (error) {
            console.log(`⚠️ Failed to background load ${symbol}:`, error.message)
          }
        }
      }
      console.log('✅ All symbols pre-loaded in background!')
    }
    
    // Start background loading after a delay
    setTimeout(preloadAllSymbols, 2000)
  }, [])

  // Reinitialize when symbol or interval changes
  useEffect(() => {
    if (isLiveMode) {
      console.log(`🔄 Timeframe switched to ${selectedSymbol} (${selectedInterval})`)
      
      // Use the new switchTimeframe function for clean switching
      switchTimeframe(selectedInterval)
    } else if (chartData.length > 0) {
      initializeChart()
    }
  }, [selectedSymbol, selectedInterval])

  // Cleanup live mode and WebSocket on unmount
  useEffect(() => {
    return () => {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current)
      }
      if (wsConnection) {
        wsConnection.close()
      }
      if (currentTimeframeWs) {
        console.log('🔌 Closing current timeframe WebSocket...')
        currentTimeframeWs.close()
      }
      if (priceWsConnection) {
        priceWsConnection.close()
      }
      if (persistent1sConnection) {
        console.log('🔌 Closing persistent 1s WebSocket...')
        persistent1sConnection.close()
      }
    }
  }, [wsConnection, currentTimeframeWs, priceWsConnection, persistent1sConnection])

  // Switch to a different timeframe with proper WebSocket management
  const switchTimeframe = async (newInterval) => {
    try {
      console.log(`🔄 Switching timeframe from ${selectedInterval} to ${newInterval}...`)
      
      // Stop current live mode and close existing WebSockets
      stopLiveMode()
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Fetch fresh data for the new timeframe
      console.log(`📡 Fetching fresh data for ${selectedSymbol} (${newInterval})...`)
      const freshData = await fetchBinanceHistoricalData(selectedSymbol, newInterval, 100)
      console.log(`✅ Got fresh data: ${freshData.length} candles for ${newInterval}`)
      
      // Update cache with fresh data
      setDataCache(prevCache => ({
        ...prevCache,
        [selectedSymbol]: {
          ...prevCache[selectedSymbol],
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
      const timeframeWs = await connectBinanceWebSocket(selectedSymbol, newInterval)
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

  // Start live mode with cached data (instant switching)
  const startLiveModeWithCachedData = async () => {
    try {
      // Stop any existing live mode
      stopLiveMode()
      
      setIsLiveMode(true)
      console.log(`🚀 Starting live mode with cached data for ${selectedSymbol} (${selectedInterval})...`)
      console.log(`⏰ Current time: ${new Date().toLocaleTimeString()}`)
      console.log(`📊 Starting with ${liveData.length} candles`)
      
      // Special handling for 1-second timeframes
      if (selectedInterval === '1s') {
        console.log('⚡ 1-second timeframe detected - ensuring proper WebSocket connection...')
      }
      
      // Connect to both kline and ticker WebSockets
      try {
        // Connect to kline WebSocket for candle data
        const klineWs = await connectBinanceWebSocket(selectedSymbol, selectedInterval)
        
        klineWs.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('📊 WebSocket kline data received:', data)
            if (data.k) {
              const kline = data.k
              const newCandle = [
                kline.t, // timestamp
                parseFloat(kline.o), // open
                parseFloat(kline.h), // high
                parseFloat(kline.l), // low
                parseFloat(kline.c)  // close
              ]
              
              console.log('🕯️ New candle from WebSocket:', newCandle)
              
              setLiveData(prevData => {
                const lastCandle = prevData[prevData.length - 1]
                console.log('📈 Previous data length:', prevData.length)
                console.log('🕯️ Last candle:', lastCandle)
                console.log('🕯️ New candle timestamp:', newCandle[0])
                console.log('🕯️ New candle time:', new Date(newCandle[0]).toLocaleTimeString())
                
                // If it's the same candle (same timestamp), update it
                if (lastCandle && lastCandle[0] === newCandle[0]) {
                  console.log('🔄 Updating existing candle')
                  return [...prevData.slice(0, -1), newCandle]
                } else {
                  console.log('➕ Adding new candle - timeframe boundary crossed!')
                  // Add new candle and keep only last 120 candles
                  const updatedData = [...prevData, newCandle]
                  console.log('📊 New data length:', updatedData.length)
                  return updatedData.length > 120 ? updatedData.slice(-120) : updatedData
                }
              })
            }
          } catch (error) {
            console.error('❌ Error processing kline WebSocket message:', error)
          }
        }
        
        // Connect to ticker WebSocket for real-time price updates (every second)
        const priceWs = await connectPriceWebSocket(selectedSymbol)
        
        priceWs.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.c) { // current price
              setCurrentPrice(parseFloat(data.c))
            }
          } catch (error) {
            console.error('❌ Error processing price WebSocket message:', error)
          }
        }
        
        console.log(`✅ Live mode started with cached data for ${selectedSymbol} (${selectedInterval})`)
        
        // Add a timeout to check if we're receiving new candles
        setTimeout(() => {
          console.log('🔍 Checking if new candles are forming...')
          console.log(`📊 Current liveData length: ${liveData.length}`)
          
          // If no new candles after 30 seconds, try to refresh data
          if (liveData.length === 100) { // Assuming we started with 100 candles
            console.log('⚠️ No new candles detected, refreshing data...')
            initializeChart()
          }
        }, 30000) // Check after 30 seconds
        
        // Special check for 1-second timeframes
        if (selectedInterval === '1s') {
          setTimeout(() => {
            console.log('⚡ 1-second check: Looking for new candles...')
            console.log(`📊 Live data length: ${liveData.length}`)
            if (liveData.length === 100) {
              console.log('⚠️ No 1-second candles detected, forcing refresh...')
              initializeChart()
            }
          }, 5000) // Check after 5 seconds for 1-second timeframes
        }
        
      } catch (wsError) {
        console.log('⚠️ WebSocket failed, using simulated live data:', wsError.message)
        
        // Fallback to simulated live data with correct timeframe
        const intervalMs = getIntervalMs(selectedInterval)
        console.log(`🔄 Using simulated data for ${selectedInterval} (${intervalMs}ms interval)`)
        
        liveIntervalRef.current = setInterval(() => {
          setLiveData(prevData => {
            const lastCandle = prevData[prevData.length - 1]
            const lastPrice = lastCandle[4]
            
            const volatility = getVolatilityForInterval(selectedInterval)
            const priceChange = lastPrice * (Math.random() - 0.5) * volatility
            const newPrice = lastPrice + priceChange
            
            const newCandle = [
              Date.now(),
              lastPrice,
              Math.max(lastPrice, newPrice) + Math.random() * lastPrice * 0.0005,
              Math.min(lastPrice, newPrice) - Math.random() * lastPrice * 0.0005,
              newPrice
            ]
            
            console.log(`🕯️ Simulated candle for ${selectedInterval}:`, newCandle)
            
            const updatedData = [...prevData, newCandle]
            return updatedData.length > 120 ? updatedData.slice(-120) : updatedData
          })
        }, intervalMs) // Use correct interval for simulation
      }
      
    } catch (error) {
      console.error('❌ Error starting live mode with cached data:', error)
      setError(`Failed to start live mode: ${error.message}`)
    }
  }

  // Start live mode with real Binance WebSocket data for specific timeframe
  const startLiveMode = async () => {
    try {
      // Stop any existing live mode
      stopLiveMode()
      
      setIsLiveMode(true)
      console.log(`🚀 Starting live mode for ${selectedSymbol} (${selectedInterval})...`)
      
      // First, get historical data for the selected timeframe
      let historicalData = []
      try {
        console.log(`📡 Fetching historical data for ${selectedInterval} timeframe...`)
        historicalData = await fetchBinanceHistoricalData(selectedSymbol, selectedInterval, 100)
        console.log(`✅ Got ${historicalData.length} historical candles for ${selectedInterval}`)
        setIsRealData(true)
      } catch (error) {
        console.log('⚠️ Historical data failed, using sample data')
        setIsRealData(false)
        // Generate sample data as fallback for the selected timeframe
        const basePrice = selectedSymbol === 'BTCUSDT' ? 50000 : 
                         selectedSymbol === 'ETHUSDT' ? 3000 :
                         selectedSymbol === 'BNBUSDT' ? 300 :
                         selectedSymbol === 'ADAUSDT' ? 0.5 : 100
        
        let currentPrice = basePrice
        const intervalMs = getIntervalMs(selectedInterval)
        
        for (let i = 100; i >= 0; i--) {
          const time = new Date(Date.now() - (i * intervalMs))
          const volatility = getVolatilityForInterval(selectedInterval)
          const priceChange = currentPrice * (Math.random() - 0.5) * volatility
          currentPrice += priceChange
          
          historicalData.push([
            time.getTime(),
            currentPrice - priceChange,
            currentPrice + Math.random() * currentPrice * 0.005,
            currentPrice - Math.random() * currentPrice * 0.005,
            currentPrice
          ])
        }
      }
      
      setLiveData(historicalData)
      
      // Connect to both kline and ticker WebSockets
      try {
        // Connect to kline WebSocket for candle data
        const klineWs = await connectBinanceWebSocket(selectedSymbol, selectedInterval)
        
        klineWs.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('📊 WebSocket kline data received:', data)
            if (data.k) {
              const kline = data.k
              const newCandle = [
                kline.t, // timestamp
                parseFloat(kline.o), // open
                parseFloat(kline.h), // high
                parseFloat(kline.l), // low
                parseFloat(kline.c)  // close
              ]
              
              console.log('🕯️ New candle from WebSocket:', newCandle)
              
              setLiveData(prevData => {
                const lastCandle = prevData[prevData.length - 1]
                console.log('📈 Previous data length:', prevData.length)
                console.log('🕯️ Last candle:', lastCandle)
                console.log('🕯️ New candle timestamp:', newCandle[0])
                console.log('🕯️ New candle time:', new Date(newCandle[0]).toLocaleTimeString())
                
                // If it's the same candle (same timestamp), update it
                if (lastCandle && lastCandle[0] === newCandle[0]) {
                  console.log('🔄 Updating existing candle')
                  return [...prevData.slice(0, -1), newCandle]
                } else {
                  console.log('➕ Adding new candle - timeframe boundary crossed!')
                  // Add new candle and keep only last 120 candles
                  const updatedData = [...prevData, newCandle]
                  console.log('📊 New data length:', updatedData.length)
                  return updatedData.length > 120 ? updatedData.slice(-120) : updatedData
                }
              })
            }
          } catch (error) {
            console.error('❌ Error processing kline WebSocket message:', error)
          }
        }
        
        // Connect to ticker WebSocket for real-time price updates (every second)
        const priceWs = await connectPriceWebSocket(selectedSymbol)
        
        priceWs.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.c) { // current price
              setCurrentPrice(parseFloat(data.c))
            }
          } catch (error) {
            console.error('❌ Error processing price WebSocket message:', error)
          }
        }
        
        console.log(`✅ Live mode started with real Binance data for ${selectedSymbol} (${selectedInterval})`)
        
      } catch (wsError) {
        console.log('⚠️ WebSocket failed, using simulated live data:', wsError.message)
        
        // Fallback to simulated live data with correct timeframe
        let currentPrice = historicalData[historicalData.length - 1][4]
        const intervalMs = getIntervalMs(selectedInterval)
        
        liveIntervalRef.current = setInterval(() => {
          setLiveData(prevData => {
            const lastCandle = prevData[prevData.length - 1]
            const lastPrice = lastCandle[4]
            
            const volatility = getVolatilityForInterval(selectedInterval)
            const priceChange = lastPrice * (Math.random() - 0.5) * volatility
            const newPrice = lastPrice + priceChange
            
            const newCandle = [
              Date.now(),
              lastPrice,
              Math.max(lastPrice, newPrice) + Math.random() * lastPrice * 0.0005,
              Math.min(lastPrice, newPrice) - Math.random() * lastPrice * 0.0005,
              newPrice
            ]
            
            const updatedData = [...prevData, newCandle]
            return updatedData.length > 120 ? updatedData.slice(-120) : updatedData
          })
        }, intervalMs) // Use correct interval for simulation
      }
      
    } catch (error) {
      console.error('❌ Error starting live mode:', error)
      setError(`Failed to start live mode: ${error.message}`)
    }
  }

  const stopLiveMode = () => {
    console.log('🛑 Stopping live mode...')
    
    if (liveIntervalRef.current) {
      console.log('🔄 Clearing live interval...')
      clearInterval(liveIntervalRef.current)
      liveIntervalRef.current = null
    }
    
    if (wsConnection) {
      console.log('🔌 Closing kline WebSocket connection...')
      wsConnection.close()
      setWsConnection(null)
    }
    
    if (currentTimeframeWs) {
      console.log('🔌 Closing current timeframe WebSocket connection...')
      currentTimeframeWs.close()
      setCurrentTimeframeWs(null)
    }
    
    if (priceWsConnection) {
      console.log('🔌 Closing price WebSocket connection...')
      priceWsConnection.close()
      setPriceWsConnection(null)
    }
    
    setIsLiveMode(false)
    console.log('✅ Live mode stopped completely')
  }

  // Professional fallback chart component with zoom
  const FallbackChart = () => {
    const [zoomLevel, setZoomLevel] = useState(1)
    const [panOffset, setPanOffset] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [lastMouseX, setLastMouseX] = useState(0)
    
    const dataToShow = isLiveMode ? liveData : (liveData.length > 0 ? liveData : chartData)
    
    // Reset zoom and pan when switching between live and static data
    useEffect(() => {
      setZoomLevel(1)
      setPanOffset(0)
    }, [isLiveMode])
    
    useEffect(() => {
      console.log('🎨 FallbackChart render:', {
        isLiveMode,
        liveDataLength: liveData.length,
        chartDataLength: chartData.length,
        dataToShowLength: dataToShow.length,
        selectedSymbol,
        selectedInterval
      })
      
      if (!canvasRef.current) {
        console.log('⚠️ Canvas not ready')
        return
      }
      
      if (dataToShow.length === 0) {
        console.log('⚠️ No data to show, generating sample data')
        // Generate sample data as fallback
        const sampleData = generateSampleDataForTimeframe(selectedSymbol, selectedInterval, 100)
        setLiveData(sampleData)
        return
      }
      
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
      const title = `${selectedSymbol} Candlestick Chart${isLiveMode ? ' (LIVE)' : ''}`
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
      
    }, [dataToShow, isDark, selectedSymbol, isLiveMode, zoomLevel, panOffset, liveData.length])
    
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
          key={`chart-${selectedSymbol}-${selectedInterval}-${liveData.length}`}
          ref={canvasRef}
          className="w-full h-full cursor-grab"
          style={{ maxHeight: '500px' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        
        {/* Zoom controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <button
            onClick={() => setZoomLevel(prev => Math.min(10, prev * 1.2))}
            className={`px-3 py-1 text-xs rounded transition-colors duration-300 ${
              isDark 
                ? 'bg-gray-700 text-white hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Zoom In
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.max(0.1, prev * 0.8))}
            className={`px-3 py-1 text-xs rounded transition-colors duration-300 ${
              isDark 
                ? 'bg-gray-700 text-white hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Zoom Out
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className={`px-3 py-1 text-xs rounded transition-colors duration-300 ${
              isDark 
                ? 'bg-gray-700 text-white hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Reset
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading Highcharts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-2">❌</div>
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button 
            onClick={() => initializeChart()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <div className={`p-6 border-b transition-colors duration-300 ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Demo Chart - Highcharts
            </h1>
            <p className={`text-sm transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Professional candlestick charts with zoom, pan, and range selection
            </p>
          </div>

          {/* Price Display */}
          {currentPrice > 0 && (
            <div className="text-right">
              <div className={`text-2xl font-bold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={`flex items-center space-x-1 ${
                priceChange >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                <span className="font-medium">
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className={`p-4 border-b transition-colors duration-300 ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center space-x-4">
          {/* Symbol Selector */}
          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Symbol
            </label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className={`px-3 py-2 rounded-lg border transition-colors duration-300 ${
                isDark 
                  ? 'bg-gray-800 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              {symbols.map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>
          </div>

          {/* Interval Selector */}
          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Interval
            </label>
            <select
              value={selectedInterval}
              onChange={(e) => setSelectedInterval(e.target.value)}
              className={`px-3 py-2 rounded-lg border transition-colors duration-300 ${
                isDark 
                  ? 'bg-gray-800 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              {intervals.map(interval => (
                <option key={interval.value} value={interval.value}>{interval.label}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="ml-auto flex items-center space-x-4">
            <div className={`flex items-center space-x-2 text-sm transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Professional Charts</span>
            </div>
            
            {/* Manual refresh button */}
            <button
              onClick={() => initializeChart()}
              className={`px-3 py-1 text-xs rounded transition-colors duration-300 ${
                isDark 
                  ? 'bg-gray-700 text-white hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Refresh Data
            </button>
            
            {/* Regenerate sample data button */}
            <button
              onClick={() => {
                const newData = generateSampleData(selectedSymbol, 100)
                setChartData(newData)
                const latest = newData[newData.length - 1]
                setCurrentPrice(latest[4])
                const first = newData[0]
                const change = latest[4] - first[4]
                const changePercent = (change / first[4]) * 100
                setPriceChange(change)
                setPriceChangePercent(changePercent)
              }}
              className={`px-3 py-1 text-xs rounded transition-colors duration-300 ${
                isDark 
                  ? 'bg-blue-700 text-white hover:bg-blue-600' 
                  : 'bg-blue-200 text-blue-700 hover:bg-blue-300'
              }`}
            >
              New Data
            </button>
            
            {/* Live status indicator */}
            <div className={`flex items-center space-x-2 text-sm transition-colors duration-300 ${
              isLiveMode ? 'text-green-500' : 'text-gray-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isLiveMode ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span>{isLiveMode ? 'Live Data' : 'Static Data'}</span>
            </div>
            
            {/* Cache status indicator */}
            {cacheLoading && (
              <div className="flex items-center space-x-2 text-sm text-blue-500">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span>Loading Cache...</span>
              </div>
            )}
            
            {/* Refresh real data button */}
            <button
              onClick={() => initializeChart()}
              className={`px-3 py-1 text-xs rounded transition-colors duration-300 ${
                isDark 
                  ? 'bg-purple-700 text-white hover:bg-purple-600' 
                  : 'bg-purple-200 text-purple-700 hover:bg-purple-300'
              }`}
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="p-4">
        <div className="w-full rounded-lg border transition-colors duration-300 bg-white dark:bg-gray-800 overflow-hidden" style={{ height: '500px' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading chart...</p>
              </div>
            </div>
          ) : (
            <FallbackChart />
          )}
        </div>
      </div>

      {/* Info */}
      <div className={`p-4 border-t transition-colors duration-300 ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className={`text-sm transition-colors duration-300 ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <p><strong>Data Source:</strong> {isLiveMode ? 'Binance WebSocket (Real-time)' : isRealData ? 'Binance REST API (Historical)' : 'Generated Sample Data'}</p>
          <p><strong>Chart Library:</strong> {highchartsLoaded ? 'Highcharts Stock' : 'HTML5 Canvas (Fallback)'}</p>
          <p><strong>Features:</strong> {highchartsLoaded ? 'Zoom, Pan, Range Selector, Navigator' : 'Professional Candlesticks, Grid, Price Labels, Mouse Zoom, Drag Pan'}</p>
          <p><strong>Symbol:</strong> {selectedSymbol} | <strong>Interval:</strong> {isLiveMode ? `${selectedInterval} (LIVE)` : selectedInterval}</p>
          <p><strong>Data Points:</strong> {isLiveMode ? liveData.length : (liveData.length > 0 ? liveData.length : chartData.length)} candles</p>
          <p><strong>Debug:</strong> LiveData: {liveData.length}, ChartData: {chartData.length}, IsLive: {isLiveMode ? 'Yes' : 'No'}</p>
          <p><strong>Status:</strong> {loading ? 'Loading...' : cacheLoading ? 'Loading Cache...' : isLiveMode ? 'AUTO LIVE - Cached Data!' : isRealData ? 'Real Binance Data' : 'Sample Data'}</p>
          {cacheLoading && (
            <p className="text-blue-500 font-semibold">📦 Pre-loading all timeframes for instant switching!</p>
          )}
          {isLiveMode && !cacheLoading && (
            <p className="text-green-500 font-semibold">🔥 Auto Live Mode! Cached data with instant timeframe switching! New candles form in the middle-right with space for future candles!</p>
          )}
          {isRealData && !isLiveMode && (
            <p className="text-blue-500 font-semibold">📡 Real Binance historical data loaded!</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default DemoChart