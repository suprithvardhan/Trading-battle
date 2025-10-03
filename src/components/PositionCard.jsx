import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'
import { 
  TrendingUp, 
  TrendingDown, 
  Settings, 
  X,
  Target,
  Shield
} from 'lucide-react'

const PositionCard = ({ position, onClose, onUpdateLeverage, onUpdateTPSL }) => {
  const { isDark } = useTheme()
  const [showLeverageModal, setShowLeverageModal] = useState(false)
  const [showTPSLModal, setShowTPSLModal] = useState(false)
  const [newLeverage, setNewLeverage] = useState(position.leverage)
  const [takeProfitPrice, setTakeProfitPrice] = useState(position.takeProfitPrice || '')
  const [stopLossPrice, setStopLossPrice] = useState(position.stopLossPrice || '')

  const formatPrice = (price) => {
    if (!price) return '0.00'
    return parseFloat(price).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 8 
    })
  }

  const formatPercentage = (value) => {
    if (!value) return '0.00%'
    return `${parseFloat(value).toFixed(2)}%`
  }

  const getPnLColor = (value) => {
    if (value > 0) return isDark ? 'text-green-400' : 'text-green-600'
    if (value < 0) return isDark ? 'text-red-400' : 'text-red-600'
    return isDark ? 'text-gray-400' : 'text-gray-600'
  }

  const getMarginRatioColor = (ratio) => {
    if (ratio > 80) return isDark ? 'text-red-400' : 'text-red-600'
    if (ratio > 50) return isDark ? 'text-yellow-400' : 'text-yellow-600'
    return isDark ? 'text-green-400' : 'text-green-600'
  }

  const handleClosePosition = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/positions/${position._id}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          price: position.markPrice
        })
      })

      if (response.ok) {
        onClose(position._id)
      }
    } catch (error) {
      console.error('Error closing position:', error)
    }
  }

  const handleUpdateLeverage = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/positions/${position._id}/leverage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          leverage: newLeverage
        })
      })

      if (response.ok) {
        setShowLeverageModal(false)
        onUpdateLeverage(position._id, newLeverage)
      }
    } catch (error) {
      console.error('Error updating leverage:', error)
    }
  }

  const handleUpdateTPSL = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/positions/${position._id}/tpsl`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          takeProfitPrice: takeProfitPrice || null,
          stopLossPrice: stopLossPrice || null
        })
      })

      if (response.ok) {
        setShowTPSLModal(false)
        onUpdateTPSL(position._id, takeProfitPrice, stopLossPrice)
      }
    } catch (error) {
      console.error('Error updating TP/SL:', error)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`p-4 rounded-lg border transition-colors duration-300 ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded flex items-center justify-center ${
              position.side === 'long' 
                ? 'bg-green-500' 
                : 'bg-red-500'
            }`}>
              <span className="text-white font-bold text-sm">
                {position.symbol.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className={`font-semibold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {position.symbol}
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                  Perp
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  position.marginMode === 'cross'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-500 text-white'
                }`}>
                  {position.marginMode === 'cross' ? 'Cross' : 'Isolated'} {position.leverage}x
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onClose(position._id)}
            className={`p-1 rounded transition-colors duration-300 ${
              isDark 
                ? 'hover:bg-gray-700' 
                : 'hover:bg-gray-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PnL Section */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Unrealized PNL (USDT)
            </span>
            <span className={`text-sm transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              ROI
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-lg font-semibold ${getPnLColor(position.unrealizedPnL)}`}>
              {position.unrealizedPnL >= 0 ? '+' : ''}{formatPrice(position.unrealizedPnL)}
            </span>
            <span className={`text-lg font-semibold ${getPnLColor(position.roi)}`}>
              {position.roi >= 0 ? '+' : ''}{formatPercentage(position.roi)}
            </span>
          </div>
        </div>

        {/* Position Details */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <div className={`text-xs mb-1 transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Size ({position.symbol.replace('USDT', '')})
            </div>
            <div className={`font-semibold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {formatPrice(position.size)}
            </div>
          </div>
          <div>
            <div className={`text-xs mb-1 transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Margin (USDT)
            </div>
            <div className={`font-semibold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {formatPrice(position.margin)}
            </div>
          </div>
          <div>
            <div className={`text-xs mb-1 transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Margin Ratio
            </div>
            <div className={`font-semibold ${getMarginRatioColor(position.marginRatio)}`}>
              {formatPercentage(position.marginRatio)}
            </div>
          </div>
        </div>

        {/* Price Details */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <div className={`text-xs mb-1 transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Entry Price (USDT)
            </div>
            <div className={`font-semibold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {formatPrice(position.entryPrice)}
            </div>
          </div>
          <div>
            <div className={`text-xs mb-1 transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Mark Price (USDT)
            </div>
            <div className={`font-semibold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {formatPrice(position.markPrice)}
            </div>
          </div>
          <div>
            <div className={`text-xs mb-1 transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Liq. Price (USDT)
            </div>
            <div className={`font-semibold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {formatPrice(position.liquidationPrice)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => setShowLeverageModal(true)}
            className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors duration-300 ${
              isDark
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-1" />
            Leverage
          </button>
          <button
            onClick={() => setShowTPSLModal(true)}
            className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors duration-300 ${
              isDark
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}
          >
            <Target className="w-4 h-4 inline mr-1" />
            TP/SL
          </button>
          <button
            onClick={handleClosePosition}
            className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors duration-300 ${
              position.side === 'long'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <X className="w-4 h-4 inline mr-1" />
            Close
          </button>
        </div>
      </motion.div>

      {/* Leverage Modal */}
      {showLeverageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-96 p-6 rounded-lg shadow-xl transition-colors duration-300 ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Adjust Leverage
            </h3>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Leverage (1x - 75x)
              </label>
              <input
                type="number"
                min="1"
                max="75"
                value={newLeverage}
                onChange={(e) => setNewLeverage(parseInt(e.target.value))}
                className={`w-full px-3 py-2 rounded border transition-colors duration-300 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowLeverageModal(false)}
                className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors duration-300 ${
                  isDark
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateLeverage}
                className="flex-1 py-2 px-4 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-300"
              >
                Update
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* TP/SL Modal */}
      {showTPSLModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-96 p-6 rounded-lg shadow-xl transition-colors duration-300 ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Set Take Profit / Stop Loss
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Take Profit Price
                </label>
                <input
                  type="number"
                  value={takeProfitPrice}
                  onChange={(e) => setTakeProfitPrice(e.target.value)}
                  placeholder="0.00000"
                  className={`w-full px-3 py-2 rounded border transition-colors duration-300 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Stop Loss Price
                </label>
                <input
                  type="number"
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(e.target.value)}
                  placeholder="0.00000"
                  className={`w-full px-3 py-2 rounded border transition-colors duration-300 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
            <div className="flex space-x-2 mt-6">
              <button
                onClick={() => setShowTPSLModal(false)}
                className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors duration-300 ${
                  isDark
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTPSL}
                className="flex-1 py-2 px-4 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-300"
              >
                Update
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}

export default PositionCard
