import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'
import api from '../utils/api'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Settings,
  Maximize2
} from 'lucide-react'

const TradingChart = ({ ticker, tickerData, onTickerSelect }) => {
  const { isDark } = useTheme()
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('1m')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const chartRef = useRef(null)
  const wsRef = useRef(null)

  // Fetch historical data
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/assets/${ticker}?history=true&interval=${timeframe}&limit=100`)
        
        if (response.data.success && response.data.priceHistory) {
          setChartData(response.data.priceHistory)
        } else {
          throw new Error('No chart data received')
        }
      } catch (error) {
        console.error('Error fetching chart data:', error)
        // Fallback to empty data
        setChartData([])
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [ticker, timeframe])

  // Real-time updates are handled by WebSocket in parent component
  // No backend polling needed

  const generateMockCandlestickData = (count) => {
    const data = []
    let basePrice = 45000
    const now = Date.now()
    
    for (let i = count; i >= 0; i--) {
      const timestamp = now - (i * 60000) // 1 minute intervals
      const open = basePrice
      const close = basePrice + (Math.random() - 0.5) * 200
      const high = Math.max(open, close) + Math.random() * 100
      const low = Math.min(open, close) - Math.random() * 100
      const volume = Math.random() * 10000
      
      data.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume
      })
      
      basePrice = close
    }
    
    return data
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  }

  const formatVolume = (volume) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`
    }
    return volume.toFixed(0)
  }

  const getPriceChange = () => {
    if (chartData.length < 2) return { change: 0, changePercent: 0 }
    const first = chartData[0].close
    const last = chartData[chartData.length - 1].close
    const change = last - first
    const changePercent = (change / first) * 100
    return { change, changePercent }
  }

  const renderCandlestickChart = () => {
    if (chartData.length === 0) return null

    const maxPrice = Math.max(...chartData.map(d => d.high))
    const minPrice = Math.min(...chartData.map(d => d.low))
    const priceRange = maxPrice - minPrice
    const chartHeight = 300
    const chartWidth = 800

    return (
      <svg width="100%" height={chartHeight} className="overflow-hidden">
        {chartData.map((candle, index) => {
          const x = (index / (chartData.length - 1)) * chartWidth
          const y = ((maxPrice - candle.high) / priceRange) * chartHeight
          const height = ((candle.high - candle.low) / priceRange) * chartHeight
          const bodyHeight = Math.max(1, ((Math.abs(candle.close - candle.open)) / priceRange) * chartHeight)
          const bodyY = ((maxPrice - Math.max(candle.open, candle.close)) / priceRange) * chartHeight
          
          const isGreen = candle.close >= candle.open
          const color = isGreen ? '#10b981' : '#ef4444'
          
          return (
            <g key={index}>
              {/* Wick */}
              <line
                x1={x}
                y1={y}
                x2={x}
                y2={y + height}
                stroke={color}
                strokeWidth="1"
              />
              {/* Body */}
              <rect
                x={x - 2}
                y={bodyY}
                width="4"
                height={bodyHeight}
                fill={color}
              />
            </g>
          )
        })}
      </svg>
    )
  }

  const timeframes = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
    { value: '1d', label: '1d' }
  ]

  const { change, changePercent } = getPriceChange()

  return (
    <div className={`h-full flex flex-col transition-colors duration-300 ${
      isDark ? 'bg-gray-800' : 'bg-white'
    }`}>
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
              <BarChart3 className="w-4 h-4" />
              <span className="font-medium">{ticker}</span>
            </button>

            {tickerData && (
              <div className="flex items-center space-x-2">
                <span className={`text-2xl font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {formatPrice(tickerData.price)}
                </span>
                <div className={`flex items-center space-x-1 ${
                  change >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {change >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="font-medium">
                    {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Timeframe Selector */}
            <div className="flex space-x-1">
              {timeframes.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-300 ${
                    timeframe === tf.value
                      ? 'bg-blue-600 text-white'
                      : isDark
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-2 rounded-lg transition-colors duration-300 ${
                isDark 
                  ? 'hover:bg-gray-700 text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Volume */}
        {tickerData && (
          <div className={`text-sm mt-2 transition-colors duration-300 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Volume: {formatVolume(tickerData.volume)}
          </div>
        )}
      </div>

      {/* Chart Area */}
      <div className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
              <p className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Loading chart data...
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full">
            {renderCandlestickChart()}
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
              High: {formatPrice(Math.max(...chartData.map(d => d.high)))}
            </div>
            <div className={`transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Low: {formatPrice(Math.min(...chartData.map(d => d.low)))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TradingChart
