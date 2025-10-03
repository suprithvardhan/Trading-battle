import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'
import api from '../utils/api'
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Star,
  Filter,
  X
} from 'lucide-react'

const TickerSelector = ({ selectedTicker, onTickerSelect, onClose }) => {
  const { isDark } = useTheme()
  const [tickers, setTickers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all') // all, crypto, stocks, forex
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState(['BTCUSDT', 'ETHUSDT', 'BNBUSDT'])

  // Fetch available tickers from database (stored once)
  useEffect(() => {
    const fetchTickers = async () => {
      try {
        setLoading(true)
        // Load tickers from database (no real-time API calls)
        const response = await api.get('/assets?type=crypto&limit=50')
        
        if (response.data.success) {
          setTickers(response.data.assets)
        } else {
          // Fallback to mock data
          setTickers([
            { symbol: 'BTCUSDT', name: 'Bitcoin', type: 'crypto', currentPrice: 45000, dayChangePercent: 2.5 },
            { symbol: 'ETHUSDT', name: 'Ethereum', type: 'crypto', currentPrice: 3000, dayChangePercent: 1.8 },
            { symbol: 'BNBUSDT', name: 'Binance Coin', type: 'crypto', currentPrice: 300, dayChangePercent: -0.5 },
            { symbol: 'ADAUSDT', name: 'Cardano', type: 'crypto', currentPrice: 0.5, dayChangePercent: 3.2 },
            { symbol: 'SOLUSDT', name: 'Solana', type: 'crypto', currentPrice: 100, dayChangePercent: 5.1 }
          ])
        }
      } catch (error) {
        console.error('Error fetching tickers:', error)
        // Fallback to mock data
        setTickers([
          { symbol: 'BTCUSDT', name: 'Bitcoin', type: 'crypto', currentPrice: 45000, dayChangePercent: 2.5 },
          { symbol: 'ETHUSDT', name: 'Ethereum', type: 'crypto', currentPrice: 3000, dayChangePercent: 1.8 },
          { symbol: 'BNBUSDT', name: 'Binance Coin', type: 'crypto', currentPrice: 300, dayChangePercent: -0.5 },
          { symbol: 'ADAUSDT', name: 'Cardano', type: 'crypto', currentPrice: 0.5, dayChangePercent: 3.2 },
          { symbol: 'SOLUSDT', name: 'Solana', type: 'crypto', currentPrice: 100, dayChangePercent: 5.1 }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchTickers()
  }, [])

  const filteredTickers = tickers.filter(ticker => {
    const matchesSearch = ticker.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        ticker.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === 'all' || ticker.type === filter
    return matchesSearch && matchesFilter
  })

  const formatPrice = (price) => {
    // Handle undefined/null prices
    if (!price || isNaN(price)) {
      return '$0.00'
    }
    
    if (price >= 1) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(price)
    } else {
      return `$${parseFloat(price).toFixed(6)}`
    }
  }

  const toggleFavorite = (symbol) => {
    setFavorites(prev => 
      prev.includes(symbol) 
        ? prev.filter(fav => fav !== symbol)
        : [...prev, symbol]
    )
  }

  const getTickerIcon = (symbol) => {
    const icons = {
      'BTCUSDT': '₿',
      'ETHUSDT': 'Ξ',
      'BNBUSDT': 'B',
      'ADAUSDT': '₳',
      'SOLUSDT': '◎'
    }
    return icons[symbol] || symbol.charAt(0)
  }

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`h-full flex flex-col transition-colors duration-300 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}
    >
      {/* Header */}
      <div className={`p-4 border-b transition-colors duration-300 ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Select Ticker
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors duration-300 ${
              isDark 
                ? 'hover:bg-gray-700 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            placeholder="Search tickers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors duration-300 ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>

        {/* Filter */}
        <div className="flex space-x-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'crypto', label: 'Crypto' },
            { value: 'stocks', label: 'Stocks' },
            { value: 'forex', label: 'Forex' }
          ].map((filterOption) => (
            <button
              key={filterOption.value}
              onClick={() => setFilter(filterOption.value)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-300 ${
                filter === filterOption.value
                  ? 'bg-blue-600 text-white'
                  : isDark
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ticker List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
              <p className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Loading tickers...
              </p>
            </div>
          </div>
        ) : (
          <div className="p-2">
            {/* Favorites */}
            {favorites.length > 0 && (
              <div className="mb-4">
                <h4 className={`text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Favorites
                </h4>
                <div className="space-y-1">
                  {favorites.map(symbol => {
                    const ticker = tickers.find(t => t.symbol === symbol)
                    if (!ticker) return null
                    
                    return (
                      <TickerItem
                        key={symbol}
                        ticker={ticker}
                        isSelected={selectedTicker === symbol}
                        isFavorite={true}
                        onSelect={onTickerSelect}
                        onToggleFavorite={toggleFavorite}
                        getTickerIcon={getTickerIcon}
                        formatPrice={formatPrice}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* All Tickers */}
            <div className="space-y-1">
              {filteredTickers.map((ticker) => (
                <TickerItem
                  key={ticker.symbol}
                  ticker={ticker}
                  isSelected={selectedTicker === ticker.symbol}
                  isFavorite={favorites.includes(ticker.symbol)}
                  onSelect={onTickerSelect}
                  onToggleFavorite={toggleFavorite}
                  getTickerIcon={getTickerIcon}
                  formatPrice={formatPrice}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

const TickerItem = ({ 
  ticker, 
  isSelected, 
  isFavorite, 
  onSelect, 
  onToggleFavorite, 
  getTickerIcon, 
  formatPrice 
}) => {
  const { isDark } = useTheme()

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(ticker.symbol)}
      className={`p-3 rounded-lg cursor-pointer transition-colors duration-300 ${
        isSelected
          ? 'bg-blue-600 text-white'
          : isDark
            ? 'hover:bg-gray-700 text-white'
            : 'hover:bg-gray-100 text-gray-900'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            isSelected 
              ? 'bg-white text-blue-600' 
              : 'bg-blue-600 text-white'
          }`}>
            {getTickerIcon(ticker.symbol)}
          </div>
          <div>
            <div className={`font-medium transition-colors duration-300 ${
              isSelected ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {ticker.symbol}
            </div>
            <div className={`text-xs transition-colors duration-300 ${
              isSelected ? 'text-blue-100' : isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {ticker.name}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className={`font-medium transition-colors duration-300 ${
            isSelected ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {formatPrice(ticker.currentPrice || 0)}
          </div>
          <div className={`text-xs flex items-center space-x-1 ${
            (ticker.dayChangePercent || 0) >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {(ticker.dayChangePercent || 0) >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>
              {(ticker.dayChangePercent || 0) >= 0 ? '+' : ''}{((ticker.dayChangePercent || 0)).toFixed(2)}%
            </span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite(ticker.symbol)
          }}
          className={`p-1 rounded transition-colors duration-300 ${
            isFavorite
              ? 'text-yellow-500 hover:text-yellow-400'
              : isSelected
                ? 'text-blue-100 hover:text-white'
                : isDark
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>
    </motion.div>
  )
}

export default TickerSelector
