import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent,
  Calculator,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  ArrowUpDown,
  Info
} from 'lucide-react'
import axios from 'axios'

const TradingPanel = ({ ticker, tickerData, userBalance, matchId, onOrderPlaced }) => {
  const { isDark } = useTheme()
  
  // Futures trading states
  const [marginMode, setMarginMode] = useState('cross') // cross, isolated
  const [leverage, setLeverage] = useState(20) // 1x to 75x
  const [orderType, setOrderType] = useState('limit') // limit, market, stop_limit
  const [side, setSide] = useState('buy') // buy, sell
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [stopPrice, setStopPrice] = useState('')
  const [percentage, setPercentage] = useState(0)
  const [tpslEnabled, setTpslEnabled] = useState(false)
  const [reduceOnly, setReduceOnly] = useState(false)
  const [timeInForce, setTimeInForce] = useState('GTC') // GTC, IOC, FOK
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showLeverageModal, setShowLeverageModal] = useState(false)
  const [showTpslSection, setShowTpslSection] = useState(false)
  const [takeProfitPrice, setTakeProfitPrice] = useState('')
  const [stopLossPrice, setStopLossPrice] = useState('')

  // Update price when ticker changes (only for market orders or when price is empty)
  useEffect(() => {
    if (tickerData?.price && (orderType !== 'limit' || !price)) {
      setPrice(tickerData.price.toFixed(2))
    }
  }, [tickerData, orderType, price])

  // Futures trading calculations (like Binance)
  const calculateMargin = () => {
    if (!quantity || !price) return 0
    const notionalValue = parseFloat(quantity) * parseFloat(price)
    return notionalValue / leverage
  }

  const calculateMaxQuantity = () => {
    if (!price) return 0
    const maxNotional = userBalance * leverage
    return (maxNotional / parseFloat(price)).toFixed(6)
  }

  const calculateLiquidationPrice = () => {
    if (!quantity || !price) return { long: 0, short: 0 }
    
    const entryPrice = parseFloat(price)
    const positionSize = parseFloat(quantity)
    const notionalValue = positionSize * entryPrice
    const margin = notionalValue / leverage
    
    // Binance-style liquidation calculation
    const maintenanceMarginRate = 0.004 // 0.4% maintenance margin rate
    
    if (marginMode === 'cross') {
      // Cross margin: uses total account balance as collateral
      // Formula: (Wallet Balance + Total Unrealized PnL - Maintenance Margin of Other Positions) / (Position Size * Maintenance Margin Rate)
      // For new position with no other positions: Wallet Balance / (Position Size * Maintenance Margin Rate)
      const totalBalance = userBalance
      const maintenanceMarginRequired = notionalValue * maintenanceMarginRate
      
      // Long position liquidation price
      // When price goes down, we lose money, so liquidation happens when:
      // (EntryPrice - LiqPrice) * PositionSize = TotalBalance - MaintenanceMargin
      // Solving for LiqPrice: LiqPrice = EntryPrice - (TotalBalance - MaintenanceMargin) / PositionSize
      const longLiqPrice = entryPrice - (totalBalance - maintenanceMarginRequired) / positionSize
      
      // Short position liquidation price  
      // When price goes up, we lose money, so liquidation happens when:
      // (LiqPrice - EntryPrice) * PositionSize = TotalBalance - MaintenanceMargin
      // Solving for LiqPrice: LiqPrice = EntryPrice + (TotalBalance - MaintenanceMargin) / PositionSize
      const shortLiqPrice = entryPrice + (totalBalance - maintenanceMarginRequired) / positionSize
      
      return {
        long: Math.max(0, longLiqPrice),
        short: shortLiqPrice
      }
    } else {
      // Isolated margin: uses only the margin allocated to this position
      // Formula: (Isolated Margin + Unrealized PnL) / (Position Size * Maintenance Margin Rate)
      // For new position: Isolated Margin / (Position Size * Maintenance Margin Rate)
      const isolatedMargin = margin
      const maintenanceMarginRequired = notionalValue * maintenanceMarginRate
      
      // Long position liquidation price
      // When price goes down, we lose money, so liquidation happens when:
      // (EntryPrice - LiqPrice) * PositionSize = IsolatedMargin - MaintenanceMargin
      // Solving for LiqPrice: LiqPrice = EntryPrice - (IsolatedMargin - MaintenanceMargin) / PositionSize
      const longLiqPrice = entryPrice - (isolatedMargin - maintenanceMarginRequired) / positionSize
      
      // Short position liquidation price  
      // When price goes up, we lose money, so liquidation happens when:
      // (LiqPrice - EntryPrice) * PositionSize = IsolatedMargin - MaintenanceMargin
      // Solving for LiqPrice: LiqPrice = EntryPrice + (IsolatedMargin - MaintenanceMargin) / PositionSize
      const shortLiqPrice = entryPrice + (isolatedMargin - maintenanceMarginRequired) / positionSize
      
      return {
        long: Math.max(0, longLiqPrice),
        short: shortLiqPrice
      }
    }
  }

  const handleQuantityChange = (value) => {
    setQuantity(value)
    if (value && price) {
      const total = parseFloat(value) * parseFloat(price)
      const maxNotional = userBalance * leverage
      setPercentage((total / maxNotional) * 100)
    }
  }

  const handlePercentageChange = (value) => {
    const numValue = Number(value)
    setPercentage(numValue)
    if (numValue && price) {
      const maxNotional = userBalance * leverage
      const notional = (maxNotional * numValue) / 100
      const qty = notional / parseFloat(price)
      setQuantity(qty.toFixed(6))
    }
  }

  const getAvailableBalance = () => {
    return userBalance.toFixed(2)
  }

  const calculateProfitLoss = (targetPrice, type) => {
    if (!price || !targetPrice) return '0.00'
    
    const entryPrice = parseFloat(price)
    const target = parseFloat(targetPrice)
    
    if (type === 'profit') {
      // For long positions: profit when target > entry
      const profitPercent = ((target - entryPrice) / entryPrice) * 100
      return profitPercent.toFixed(2)
    } else {
      // For stop loss: loss when target < entry
      const lossPercent = ((entryPrice - target) / entryPrice) * 100
      return `-${lossPercent.toFixed(2)}`
    }
  }

  const handleSubmitOrder = async () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      setError('Please enter a valid quantity')
      return
    }

    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) {
      setError('Please enter a valid price for limit order')
      return
    }

    if (orderType === 'stop_limit' && (!stopPrice || parseFloat(stopPrice) <= 0)) {
      setError('Please enter a valid stop price')
      return
    }

    const margin = calculateMargin()
    if (margin > userBalance) {
      setError('Insufficient margin')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const orderData = {
        matchId,
        symbol: ticker,
        side,
        type: orderType,
        quantity: parseFloat(quantity),
        price: orderType === 'market' ? tickerData?.price : parseFloat(price),
        stopPrice: orderType === 'stop_limit' ? parseFloat(stopPrice) : undefined,
        marginMode,
        leverage,
        timeInForce,
        reduceOnly,
        takeProfitPrice: tpslEnabled && takeProfitPrice ? parseFloat(takeProfitPrice) : undefined,
        stopLossPrice: tpslEnabled && stopLossPrice ? parseFloat(stopLossPrice) : undefined
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('Futures order placed successfully!')
        setQuantity('')
        setPrice('')
        setStopPrice('')
        setPercentage(0)
        setTakeProfitPrice('')
        setStopLossPrice('')
        setTpslEnabled(false)
        setShowTpslSection(false)
        
        // Notify parent component
        if (onOrderPlaced) {
          onOrderPlaced()
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(result.message || 'Failed to place order')
      }
    } catch (error) {
      console.error('Error placing order:', error)
      setError('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  }

  return (
    <div className={`h-full flex flex-col transition-colors duration-300 ${
      isDark ? 'bg-gray-800' : 'bg-white'
    }`}>
      {/* Futures Trading Header */}
      <div className={`p-2 border-b transition-colors duration-300 ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-1">
          <h3 className={`text-sm font-semibold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {ticker} Futures
          </h3>
          <button
            onClick={() => setShowLeverageModal(true)}
            className={`p-1.5 rounded-md transition-colors duration-300 ${
              isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
        
        {/* Margin Mode & Leverage */}
        <div className="flex items-center space-x-2 mb-1">
          <div className="flex space-x-1">
            <button
              onClick={() => setMarginMode('cross')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors duration-300 ${
                marginMode === 'cross'
                  ? 'bg-yellow-500 text-black'
                  : isDark
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Cross
            </button>
            <button
              onClick={() => setMarginMode('isolated')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors duration-300 ${
                marginMode === 'isolated'
                  ? 'bg-yellow-500 text-black'
                  : isDark
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Isolated
            </button>
          </div>
          
          <button
            onClick={() => setShowLeverageModal(true)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors duration-300 ${
              isDark
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}
          >
            {leverage}x
          </button>
        </div>
        
        {/* Available Balance */}
        <div className={`text-xs transition-colors duration-300 ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <div className="flex items-center justify-between">
            <span>Avbl {getAvailableBalance()} USDT</span>
            <button className="flex items-center space-x-1 text-blue-500 hover:text-blue-400">
              <ArrowUpDown className="w-2.5 h-2.5" />
              <span className="text-xs">Transfer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Order Type Selector */}
      <div className="p-2">
        <div className="flex space-x-1 mb-2">
          {[
            { value: 'limit', label: 'Limit' },
            { value: 'market', label: 'Market' },
            { value: 'stop_limit', label: 'Stop Limit' }
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => setOrderType(type.value)}
              className={`px-2 py-1.5 rounded text-xs font-medium transition-colors duration-300 ${
                orderType === type.value
                  ? 'bg-yellow-500 text-black'
                  : isDark
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {type.label}
              {type.value === 'stop_limit' && (
                <Info className="w-2.5 h-2.5 inline ml-1" />
              )}
            </button>
          ))}
        </div>

        {/* Price Input */}
        <div className="mb-2">
          <label className={`block text-xs font-medium mb-1 transition-colors duration-300 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Price
          </label>
          <div className="flex space-x-1">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00000"
              step="0.00001"
              className={`flex-1 px-2 py-1.5 rounded-md border transition-colors duration-300 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
            <button 
              onClick={() => setPrice(tickerData?.price?.toFixed(2) || '0.00')}
              className={`px-2 py-1.5 rounded text-xs font-medium transition-colors duration-300 ${
                isDark
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              {orderType === 'limit' ? 'Set' : 'USDT'}
            </button>
          </div>
        </div>

        {/* Size Input */}
        <div className="mb-2">
          <label className={`block text-xs font-medium mb-1 transition-colors duration-300 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Size
          </label>
          <div className="flex space-x-1">
            <div className="flex-1 relative">
              <input
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                placeholder="0.000000"
                step="0.000001"
                className={`w-full px-2 py-1.5 rounded-md border transition-colors duration-300 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
              <button
                onClick={() => setQuantity(calculateMaxQuantity())}
                className={`absolute right-1 top-1/2 transform -translate-y-1/2 px-1.5 py-0.5 text-xs rounded transition-colors duration-300 ${
                  isDark 
                    ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                MAX
              </button>
            </div>
            <div className={`px-2 py-1.5 rounded text-xs font-medium transition-colors duration-300 ${
              isDark
                ? 'bg-gray-700 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}>
              {ticker?.replace('USDT', '')}
            </div>
          </div>
          <div className={`text-xs mt-1 transition-colors duration-300 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Max: {calculateMaxQuantity()} {ticker?.replace('USDT', '')}
          </div>
        </div>

        {/* Percentage Slider */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Size
            </span>
            <span className={`text-xs font-medium transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {Number(percentage).toFixed(0)}%
            </span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              value={percentage}
              onChange={(e) => handlePercentageChange(e.target.value)}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between mt-1">
              {[0, 25, 50, 75, 100].map((value) => (
                <button
                  key={value}
                  onClick={() => handlePercentageChange(value)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                    percentage >= value
                      ? 'bg-yellow-500'
                      : isDark
                        ? 'bg-gray-600'
                        : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Buy/Sell Buttons */}
        <div className="flex space-x-1 mb-2">
          <button
            onClick={() => setSide('buy')}
            className={`flex-1 py-2 rounded-md font-medium transition-colors duration-300 ${
              side === 'buy'
                ? 'bg-green-600 text-white'
                : isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 inline mr-1" />
            <span className="text-sm">Buy/Long</span>
          </button>
          <button
            onClick={() => setSide('sell')}
            className={`flex-1 py-2 rounded-md font-medium transition-colors duration-300 ${
              side === 'sell'
                ? 'bg-red-600 text-white'
                : isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 inline mr-1" />
            <span className="text-sm">Sell/Short</span>
          </button>
        </div>

        {/* Order Options */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={tpslEnabled}
                onChange={(e) => {
                  setTpslEnabled(e.target.checked)
                  setShowTpslSection(e.target.checked)
                }}
                className="rounded w-3 h-3"
              />
              <span className={`text-xs transition-colors duration-300 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                TP/SL
              </span>
            </label>
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={reduceOnly}
                onChange={(e) => setReduceOnly(e.target.checked)}
                className="rounded w-3 h-3"
              />
              <span className={`text-xs transition-colors duration-300 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Reduce-Only
              </span>
            </label>
          </div>
          <div className="flex items-center space-x-1">
            <span className={`text-xs transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              TIF
            </span>
            <select
              value={timeInForce}
              onChange={(e) => setTimeInForce(e.target.value)}
              className={`px-1.5 py-1 rounded text-xs transition-colors duration-300 ${
                isDark
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <option value="GTC">GTC</option>
              <option value="IOC">IOC</option>
              <option value="FOK">FOK</option>
            </select>
          </div>
        </div>

        {/* TP/SL Section with Smooth Animation */}
        <motion.div
          initial={false}
          animate={{ 
            height: showTpslSection ? 'auto' : 0,
            opacity: showTpslSection ? 1 : 0
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className={`p-3 rounded-lg mb-3 transition-colors duration-300 ${
            isDark ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="space-y-3">
              {/* Take Profit */}
              <div>
                <label className={`block text-xs font-medium mb-1 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Take Profit
                </label>
                <div className="flex space-x-1">
                  <input
                    type="number"
                    value={takeProfitPrice}
                    onChange={(e) => setTakeProfitPrice(e.target.value)}
                    placeholder="0.00000"
                    step="0.00001"
                    className={`flex-1 px-2 py-1.5 rounded-md border transition-colors duration-300 ${
                      isDark 
                        ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <button 
                    onClick={() => setTakeProfitPrice(tickerData?.price?.toFixed(2) || '0.00')}
                    className={`px-2 py-1.5 rounded text-xs font-medium transition-colors duration-300 ${
                      isDark
                        ? 'bg-gray-600 text-white hover:bg-gray-500'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    USDT
                  </button>
                  <button 
                    onClick={() => setTakeProfitPrice(tickerData?.price?.toFixed(2) || '0.00')}
                    className={`px-2 py-1.5 rounded text-xs font-medium transition-colors duration-300 ${
                      isDark
                        ? 'bg-gray-600 text-white hover:bg-gray-500'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Mark
                  </button>
                </div>
                {/* Take Profit Display */}
                {takeProfitPrice && (
                  <div className="mt-1 flex justify-between text-xs">
                    <span className={`transition-colors duration-300 ${
                      isDark ? 'text-green-400' : 'text-green-600'
                    }`}>
                      Profit: {calculateProfitLoss(takeProfitPrice, 'profit')}%
                    </span>
                    <span className={`transition-colors duration-300 ${
                      isDark ? 'text-green-400' : 'text-green-600'
                    }`}>
                      ${((parseFloat(takeProfitPrice) - parseFloat(price)) * parseFloat(quantity)).toFixed(2)} USDT
                    </span>
                  </div>
                )}
              </div>

              {/* Stop Loss */}
              <div>
                <label className={`block text-xs font-medium mb-1 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Stop Loss
                </label>
                <div className="flex space-x-1">
                  <input
                    type="number"
                    value={stopLossPrice}
                    onChange={(e) => setStopLossPrice(e.target.value)}
                    placeholder="0.00000"
                    step="0.00001"
                    className={`flex-1 px-2 py-1.5 rounded-md border transition-colors duration-300 ${
                      isDark 
                        ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <button 
                    onClick={() => setStopLossPrice(tickerData?.price?.toFixed(2) || '0.00')}
                    className={`px-2 py-1.5 rounded text-xs font-medium transition-colors duration-300 ${
                      isDark
                        ? 'bg-gray-600 text-white hover:bg-gray-500'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    USDT
                  </button>
                  <button 
                    onClick={() => setStopLossPrice(tickerData?.price?.toFixed(2) || '0.00')}
                    className={`px-2 py-1.5 rounded text-xs font-medium transition-colors duration-300 ${
                      isDark
                        ? 'bg-gray-600 text-white hover:bg-gray-500'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Mark
                  </button>
                </div>
                {/* Stop Loss Display */}
                {stopLossPrice && (
                  <div className="mt-1 flex justify-between text-xs">
                    <span className={`transition-colors duration-300 ${
                      isDark ? 'text-red-400' : 'text-red-600'
                    }`}>
                      Loss: {calculateProfitLoss(stopLossPrice, 'loss')}%
                    </span>
                    <span className={`transition-colors duration-300 ${
                      isDark ? 'text-red-400' : 'text-red-600'
                    }`}>
                      ${((parseFloat(price) - parseFloat(stopLossPrice)) * parseFloat(quantity)).toFixed(2)} USDT
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Profit/Loss Display */}
            {tpslEnabled && (takeProfitPrice || stopLossPrice) && (
              <div className="mt-4 pt-4 border-t border-gray-600 dark:border-gray-500">
                <div className="grid grid-cols-2 gap-4">
                  {takeProfitPrice && (
                    <div className="text-center">
                      <div className={`text-xs transition-colors duration-300 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Take Profit
                      </div>
                      <div className={`text-sm font-medium transition-colors duration-300 ${
                        isDark ? 'text-green-400' : 'text-green-600'
                      }`}>
                        +{calculateProfitLoss(takeProfitPrice, 'profit')}%
                      </div>
                    </div>
                  )}
                  {stopLossPrice && (
                    <div className="text-center">
                      <div className={`text-xs transition-colors duration-300 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Stop Loss
                      </div>
                      <div className={`text-sm font-medium transition-colors duration-300 ${
                        isDark ? 'text-red-400' : 'text-red-600'
                      }`}>
                        {calculateProfitLoss(stopLossPrice, 'loss')}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Trade Details */}
        <div className={`p-2 rounded-lg mb-2 transition-colors duration-300 ${
          isDark ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <div className="grid grid-cols-2 gap-4">
            {/* Buy/Long Details */}
            <div className="space-y-1">
              <div className={`text-xs font-medium mb-1 transition-colors duration-300 ${
                isDark ? 'text-green-400' : 'text-green-600'
              }`}>
                Buy/Long
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-xs transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Liq Price
                </span>
                <span className={`text-xs font-medium transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {formatPrice(calculateLiquidationPrice().long)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-xs transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Cost
                </span>
                <span className={`text-xs font-medium transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {formatPrice(calculateMargin())}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-xs transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Max
                </span>
                <span className={`text-xs font-medium transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {calculateMaxQuantity()} {ticker?.replace('USDT', '')}
                </span>
              </div>
            </div>
            
            {/* Sell/Short Details */}
            <div className="space-y-1">
              <div className={`text-xs font-medium mb-1 transition-colors duration-300 ${
                isDark ? 'text-red-400' : 'text-red-600'
              }`}>
                Sell/Short
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-xs transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Liq Price
                </span>
                <span className={`text-xs font-medium transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {formatPrice(calculateLiquidationPrice().short)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-xs transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Cost
                </span>
                <span className={`text-xs font-medium transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {formatPrice(calculateMargin())}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-xs transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Max
                </span>
                <span className={`text-xs font-medium transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {calculateMaxQuantity()} {ticker?.replace('USDT', '')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stop Price Input (for stop limit orders) */}
        {orderType === 'stop_limit' && (
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Stop Price
            </label>
            <input
              type="number"
              value={stopPrice}
              onChange={(e) => setStopPrice(e.target.value)}
              placeholder="0.00000"
              step="0.00001"
              className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 p-3 bg-red-100 text-red-700 rounded-lg mb-4"
          >
            <XCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 p-3 bg-green-100 text-green-700 rounded-lg mb-4"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">{success}</span>
          </motion.div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmitOrder}
          disabled={loading || !quantity}
          className={`w-full py-2 rounded-md font-medium transition-colors duration-300 ${
            side === 'buy'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          } ${
            loading || !quantity
              ? 'opacity-50 cursor-not-allowed'
              : ''
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Placing Order...</span>
            </div>
          ) : (
            <span className="text-sm">{side === 'buy' ? 'Buy/Long' : 'Sell/Short'} {ticker?.replace('USDT', '')}</span>
          )}
        </button>
      </div>

      {/* Leverage Modal */}
      {showLeverageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-md w-full mx-4 transition-colors duration-300 ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Adjust Leverage
            </h3>
            
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Leverage: {leverage}x
              </label>
              <input
                type="range"
                min="1"
                max="75"
                value={leverage}
                onChange={(e) => setLeverage(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs mt-1">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>1x</span>
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>75x</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setShowLeverageModal(false)}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors duration-300 ${
                  isDark
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowLeverageModal(false)}
                className="flex-1 py-2 px-4 rounded-lg bg-yellow-500 text-black hover:bg-yellow-400 transition-colors duration-300"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default TradingPanel
