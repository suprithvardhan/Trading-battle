import React, { useEffect, useRef, useState } from 'react'
import { createChart } from 'lightweight-charts'
import { useTheme } from '../contexts/ThemeContext'
import api from '../utils/api'
import binanceWebSocketService from '../services/binanceWebSocket'

const RealTimeChart = ({ ticker, onTickerSelect, onTickerDataUpdate }) => {
  const { isDark } = useTheme()
  const chartContainerRef = useRef()
  const chartRef = useRef()
  const candlestickSeriesRef = useRef()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPrice, setCurrentPrice] = useState(0)
  const [priceChange, setPriceChange] = useState(0)
  const [priceChangePercent, setPriceChangePercent] = useState(0)
  const [volume, setVolume] = useState(0)

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    console.log('🎨 Initializing chart with container:', chartContainerRef.current)
    console.log('📏 Container dimensions:', {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight
    })

    // Ensure container has proper dimensions
    if (chartContainerRef.current.clientWidth === 0) {
      console.log('⚠️ Container width is 0, waiting for proper dimensions...')
      const checkDimensions = () => {
        if (chartContainerRef.current && chartContainerRef.current.clientWidth > 0) {
          initializeChart()
        } else {
          setTimeout(checkDimensions, 100)
        }
      }
      checkDimensions()
      return
    }

    initializeChart()

    function initializeChart() {
      try {
        console.log('🎯 Starting chart initialization...')
        console.log('📦 Container element:', chartContainerRef.current)
        console.log('📏 Container dimensions:', {
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        })

        const chart = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth,
          height: 500,
          layout: {
            background: { type: 'solid', color: isDark ? '#1a1a1a' : '#ffffff' },
            textColor: isDark ? '#ffffff' : '#000000',
          },
          grid: {
            vertLines: { color: isDark ? '#2a2a2a' : '#e1e1e1' },
            horzLines: { color: isDark ? '#2a2a2a' : '#e1e1e1' },
          },
          crosshair: {
            mode: 1,
          },
          rightPriceScale: {
            borderColor: isDark ? '#2a2a2a' : '#e1e1e1',
          },
          timeScale: {
            borderColor: isDark ? '#2a2a2a' : '#e1e1e1',
            timeVisible: true,
            secondsVisible: false,
          },
        })

        console.log('✅ Chart created successfully:', chart)

        const candlestickSeries = chart.addCandlestickSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderDownColor: '#ef5350',
          borderUpColor: '#26a69a',
          wickDownColor: '#ef5350',
          wickUpColor: '#26a69a',
        })

        console.log('📊 Candlestick series created:', candlestickSeries)

        // Set references immediately
        chartRef.current = chart
        candlestickSeriesRef.current = candlestickSeries

        console.log('✅ Chart references set:')
        console.log('  - chartRef.current:', chartRef.current)
        console.log('  - candlestickSeriesRef.current:', candlestickSeriesRef.current)

        // Test if we can set data immediately
        const testData = [{
          time: Math.floor(Date.now() / 1000),
          open: 119000,
          high: 119100,
          low: 118900,
          close: 119050
        }]
        
        try {
          candlestickSeriesRef.current.setData(testData)
          console.log('✅ Test data set successfully')
        } catch (testError) {
          console.error('❌ Error setting test data:', testError)
        }

        // Handle resize
        const handleResize = () => {
          if (chartContainerRef.current) {
            chart.applyOptions({ 
              width: chartContainerRef.current.clientWidth 
            })
          }
        }

        window.addEventListener('resize', handleResize)

        return () => {
          window.removeEventListener('resize', handleResize)
          chart.remove()
        }
      } catch (error) {
        console.error('❌ Error creating chart:', error)
        setError('Failed to initialize chart')
      }
    }
  }, [isDark])

  // Fetch historical data for initial chart display
  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!ticker) return
      
      try {
        setLoading(true)
        setError(null)
        
        // Fetch historical data from backend (one-time only)
        const response = await api.get(`/assets/${ticker}?history=true&interval=1m&limit=100`)
        
        if (response.data.success && response.data.priceHistory) {
          console.log(`📊 Fetched ${response.data.priceHistory.length} historical candles for ${ticker}`)
          const formattedData = response.data.priceHistory.map(candle => ({
            time: Math.floor(candle.timestamp / 1000),
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          }))
          
          console.log('📈 Formatted chart data:', formattedData.slice(0, 3)) // Log first 3 candles
          
          // Wait for chart to be ready, then set data
          let retryCount = 0
          const maxRetries = 50 // 5 seconds max
          const setChartData = () => {
            if (candlestickSeriesRef.current) {
              candlestickSeriesRef.current.setData(formattedData)
              console.log('✅ Chart data set successfully')
            } else if (retryCount < maxRetries) {
              retryCount++
              console.log(`⏳ Chart series not ready yet, retrying in 100ms... (${retryCount}/${maxRetries})`)
              setTimeout(setChartData, 100)
            } else {
              console.error('❌ Chart series never became ready after 5 seconds')
              setError('Chart failed to initialize properly')
            }
          }
          
          setChartData()
        } else {
          // Fallback to mock data if API fails
          const mockData = generateMockData()
          let mockRetryCount = 0
          const maxMockRetries = 50
          const setMockData = () => {
            if (candlestickSeriesRef.current) {
              candlestickSeriesRef.current.setData(mockData)
              console.log('✅ Mock chart data set successfully')
            } else if (mockRetryCount < maxMockRetries) {
              mockRetryCount++
              console.log(`⏳ Chart series not ready for mock data, retrying in 100ms... (${mockRetryCount}/${maxMockRetries})`)
              setTimeout(setMockData, 100)
            } else {
              console.error('❌ Chart series never became ready for mock data after 5 seconds')
              setError('Chart failed to initialize properly')
            }
          }
          setMockData()
        }
      } catch (error) {
        console.error('Error fetching chart data:', error)
        setError('Failed to load chart data')
        
        // Use mock data as fallback
        const mockData = generateMockData()
        let errorRetryCount = 0
        const maxErrorRetries = 50
        const setMockData = () => {
          if (candlestickSeriesRef.current) {
            candlestickSeriesRef.current.setData(mockData)
            console.log('✅ Mock chart data set successfully after error')
          } else if (errorRetryCount < maxErrorRetries) {
            errorRetryCount++
            console.log(`⏳ Chart series not ready for mock data after error, retrying in 100ms... (${errorRetryCount}/${maxErrorRetries})`)
            setTimeout(setMockData, 100)
          } else {
            console.error('❌ Chart series never became ready for mock data after error after 5 seconds')
            setError('Chart failed to initialize properly')
          }
        }
        setMockData()
      } finally {
        setLoading(false)
      }
    }

    // Add a small delay to ensure chart is initialized
    const timeoutId = setTimeout(fetchHistoricalData, 500)
    return () => clearTimeout(timeoutId)
  }, [ticker])

  // Real-time updates via Binance WebSocket
  useEffect(() => {
    if (!ticker) return

    console.log(`📡 Setting up real-time updates for ${ticker}`)
    
    // Small delay to prevent rapid connections
    const connectTimeout = setTimeout(() => {
      // Connect to Binance WebSocket for this ticker
      binanceWebSocketService.connect(ticker)
      
      // Subscribe to real-time price updates
      const unsubscribe = binanceWebSocketService.subscribe((tickerData) => {
        console.log(`📈 Real-time update for ${ticker}:`, tickerData)
        
        // Update state with real-time data
        setCurrentPrice(tickerData.price)
        setPriceChange(tickerData.change)
        setPriceChangePercent(tickerData.changePercent)
        setVolume(tickerData.volume)
        
        // Pass ticker data to parent component
        if (onTickerDataUpdate) {
          onTickerDataUpdate(tickerData)
        }
        
        // Update chart with real-time price
        if (candlestickSeriesRef.current) {
          const now = Math.floor(Date.now() / 1000)
          const currentMinute = Math.floor(now / 60) * 60
          
          // Create a more realistic candlestick update
          const realTimeCandle = {
            time: currentMinute,
            open: tickerData.price,
            high: Math.max(tickerData.price, currentPrice || tickerData.price),
            low: Math.min(tickerData.price, currentPrice || tickerData.price),
            close: tickerData.price,
          }
          
          // Update the last candle or add a new one
          candlestickSeriesRef.current.update(realTimeCandle)
        }
      })

      // Store unsubscribe function for cleanup
      window.currentUnsubscribe = unsubscribe
    }, 100)

    // Cleanup on unmount or ticker change
    return () => {
      console.log(`🔌 Cleaning up WebSocket for ${ticker}`)
      clearTimeout(connectTimeout)
      if (window.currentUnsubscribe) {
        window.currentUnsubscribe()
        window.currentUnsubscribe = null
      }
      binanceWebSocketService.disconnect()
    }
  }, [ticker])

  const generateMockData = () => {
    const data = []
    let basePrice = 119000 // Use current BTC price as base
    const now = Date.now()
    
    for (let i = 100; i >= 0; i--) {
      const time = Math.floor((now - i * 60000) / 1000) // 1 minute intervals
      const open = basePrice
      const close = basePrice + (Math.random() - 0.5) * 1000
      const high = Math.max(open, close) + Math.random() * 500
      const low = Math.min(open, close) - Math.random() * 500
      
      data.push({
        time,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
      })
      
      basePrice = close
    }
    
    console.log('🎲 Generated mock data with', data.length, 'candles')
    return data
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chart...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chart Header */}
      <div className={`p-4 border-b transition-colors duration-300 ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onTickerSelect}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-300 ${
                isDark 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              <span className="font-medium">{ticker}</span>
            </button>

            <div className="flex items-center space-x-2">
              <span className={`text-2xl font-bold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <div className={`flex items-center space-x-1 ${
                priceChange >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                <span className="font-medium">
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
                <button
                  key={tf}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-300 ${
                    tf === '1m'
                      ? 'bg-blue-600 text-white'
                      : isDark
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={`text-sm mt-2 transition-colors duration-300 ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Volume: {volume.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 })}
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        <div 
          ref={chartContainerRef} 
          className="w-full h-full"
          style={{ minHeight: '500px', height: '500px' }}
        />
        
        {/* Fallback chart display if lightweight-charts fails */}
        {!chartRef.current && !loading && (
          <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-gray-600 dark:text-gray-400">Chart loading...</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                If this persists, there may be an issue with chart initialization
              </p>
            </div>
          </div>
        )}
        
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
            <div>Chart Ref: {chartRef.current ? '✅' : '❌'}</div>
            <div>Series Ref: {candlestickSeriesRef.current ? '✅' : '❌'}</div>
            <div>Container: {chartContainerRef.current ? '✅' : '❌'}</div>
          </div>
        )}
      </div>

      {/* Chart Footer */}
      <div className={`p-4 border-t transition-colors duration-300 ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between text-sm">
          <div className={`transition-colors duration-300 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <div className="flex items-center space-x-4">
            <div className={`transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              High: $48,356.10
            </div>
            <div className={`transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Low: $41,448.25
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RealTimeChart
