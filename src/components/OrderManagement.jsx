import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Filter,
  Search
} from 'lucide-react'
import axios from 'axios'
import PositionCard from './PositionCard'

const OrderManagement = ({ activeTab, onTabChange, orders, positions, matchId, onPositionClose, onPositionUpdate, onRefreshOrders }) => {
  const { isDark } = useTheme()
  const [filter, setFilter] = useState('all') // all, buy, sell
  const [loading, setLoading] = useState(false)

  // Subscribe to order execution notifications
  useEffect(() => {
    import('../services/orderExecutionService').then(({ default: orderExecutionService }) => {
      const unsubscribeOrder = orderExecutionService.subscribe('order_executed', (data) => {
        console.log('🎯 Order executed in OrderManagement:', data)
        if (onRefreshOrders) {
          onRefreshOrders()
        }
      })

      const unsubscribePosition = orderExecutionService.subscribe('position_closed', (data) => {
        console.log('🔄 Position closed in OrderManagement:', data)
        if (onRefreshOrders) {
          onRefreshOrders()
        }
      })

      const unsubscribePositionCreated = orderExecutionService.subscribe('position_created', (data) => {
        console.log('📊 Position created in OrderManagement:', data)
        if (onRefreshOrders) {
          onRefreshOrders()
        }
      })

      const unsubscribePositionUpdated = orderExecutionService.subscribe('position_updated', (data) => {
        console.log('📊 Position updated in OrderManagement:', data)
        if (onRefreshOrders) {
          onRefreshOrders()
        }
      })
      
      return () => {
        unsubscribeOrder()
        unsubscribePosition()
        unsubscribePositionCreated()
        unsubscribePositionUpdated()
      }
    })
  }, [onRefreshOrders])

  const tabs = [
    { id: 'positions', label: 'Positions', icon: BarChart3, count: positions.length },
    { id: 'open', label: 'Open Orders', icon: Clock, count: orders.open?.length || 0 },
    { id: 'history', label: 'History', icon: CheckCircle, count: orders.history?.length || 0 }
  ]

  const filteredOrders = orders[activeTab]?.filter(order => {
    const matchesFilter = filter === 'all' || order.type === filter
    return matchesFilter
  }) || []

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString()
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'filled':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'rejected':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'filled':
        return 'text-green-500'
      case 'pending':
        return 'text-yellow-500'
      case 'cancelled':
        return 'text-red-500'
      case 'rejected':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const handleCancelOrder = async (orderId) => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ Order cancelled successfully')
        // The parent component will refresh the orders via fetchOrdersAndPositions()
        // No need to manually update state here
      } else {
        console.error('Failed to cancel order:', data.message)
      }
    } catch (error) {
      console.error('Error cancelling order:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePnL = (order) => {
    if (order.status !== 'filled') return 0
    // This would need current market price to calculate P&L
    // For now, return mock P&L
    return Math.random() * 100 - 50
  }

  return (
    <div className={`h-full flex flex-col transition-colors duration-300 ${
      isDark ? 'bg-gray-800' : 'bg-white'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b transition-colors duration-300 ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Order Management
          </h3>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : isDark
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : isDark
                      ? 'bg-gray-600 text-gray-300'
                      : 'bg-gray-200 text-gray-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className={`p-4 border-b transition-colors duration-300 ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-end">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`px-3 py-2 rounded-lg border transition-colors duration-300 ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">All Types</option>
            <option value="buy">Buy Orders</option>
            <option value="sell">Sell Orders</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'positions' ? (
          positions.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className={`text-lg transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  No open positions
                </p>
                <p className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  Your positions will appear here
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {positions.map((position, index) => (
                <PositionCard
                  key={position._id}
                  position={position}
                  onClose={onPositionClose}
                  onUpdateLeverage={(positionId, leverage) => onPositionUpdate(positionId, { leverage })}
                  onUpdateTPSL={(positionId, tp, sl) => onPositionUpdate(positionId, { takeProfitPrice: tp, stopLossPrice: sl })}
                />
              ))}
            </div>
          )
        ) : filteredOrders.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className={`text-lg transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                No {activeTab} orders
              </p>
              <p className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-gray-500' : 'text-gray-500'
              }`}>
                {activeTab === 'open' && 'Your pending orders will appear here'}
                {activeTab === 'history' && 'Your order history will appear here'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <AnimatePresence>
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`p-4 rounded-lg border mb-3 transition-colors duration-300 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Order Type Icon */}
                      <div className={`p-3 rounded-full ${
                        order.isPositionClose 
                          ? 'bg-blue-100 text-blue-600' 
                          : order.side === 'buy' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-red-100 text-red-600'
                      }`}>
                        {order.isPositionClose ? (
                          <XCircle className="w-5 h-5" />
                        ) : order.side === 'buy' ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : (
                          <TrendingDown className="w-5 h-5" />
                        )}
                      </div>

                      {/* Order Details */}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium transition-colors duration-300 ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                            {order.symbol}
                          </span>
                          <span className={`text-sm px-2 py-1 rounded-full ${
                            order.side === 'buy' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {order.side.toUpperCase()}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {order.isPositionClose ? 'POSITION CLOSE' : 
                             order.type === 'stop_market' ? 'STOP' : 
                             order.type.toUpperCase()}
                          </span>
                        </div>
                        <div className={`text-sm transition-colors duration-300 ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {order.quantity} @ {formatPrice(order.price)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      {/* Status */}
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <span className={`text-sm font-medium ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>

                      {/* Total Value */}
                      <div className="text-right">
                        <div className={`font-medium transition-colors duration-300 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          {formatPrice(order.quantity * order.price)}
                        </div>
                        <div className={`text-sm transition-colors duration-300 ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {formatTime(order.executedAt || order.createdAt)}
                        </div>
                      </div>

                      {/* P&L (for current orders) */}
                      {activeTab === 'current' && order.status === 'filled' && (
                        <div className="text-right">
                          <div className={`font-medium ${
                            calculatePnL(order) >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {calculatePnL(order) >= 0 ? '+' : ''}{formatPrice(calculatePnL(order))}
                          </div>
                          <div className={`text-sm ${
                            calculatePnL(order) >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            P&L
                          </div>
                        </div>
                      )}

                      {/* Cancel Button (for open orders) */}
                      {activeTab === 'open' && order.status === 'pending' && (
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={loading}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Summary */}
      {activeTab === 'current' && filteredOrders.length > 0 && (
        <div className={`p-4 border-t transition-colors duration-300 ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className={`text-2xl font-bold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {filteredOrders.length}
              </div>
              <div className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Total Orders
              </div>
            </div>
            <div>
              <div className={`text-2xl font-bold text-green-500`}>
                {formatPrice(filteredOrders.reduce((sum, order) => sum + (calculatePnL(order) > 0 ? calculatePnL(order) : 0), 0))}
              </div>
              <div className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Total Profit
              </div>
            </div>
            <div>
              <div className={`text-2xl font-bold text-red-500`}>
                {formatPrice(Math.abs(filteredOrders.reduce((sum, order) => sum + (calculatePnL(order) < 0 ? calculatePnL(order) : 0), 0)))}
              </div>
              <div className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Total Loss
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderManagement
