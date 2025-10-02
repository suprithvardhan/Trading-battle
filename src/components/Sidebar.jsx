import React from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { 
  LayoutDashboard, 
  User, 
  Trophy, 
  BarChart3,
  Settings,
  LogOut,
  TrendingUp,
  Users,
  Award
} from 'lucide-react'
import Logo from './Logo'

const Sidebar = ({ activePage, setActivePage }) => {
  const { isDark } = useTheme()
  const { user, logout } = useAuth()

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'matches', label: 'Matches', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  const handleLogout = () => {
    logout()
  }

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className={`h-screen w-64 fixed left-0 top-0 border-r transition-colors duration-300 ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Logo className="w-8 h-8" isDark={isDark} />
          <span className={`text-xl font-bold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            TradeBattle
          </span>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className={`font-semibold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {user?.username}
            </div>
            <div className={`text-sm transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {user?.tier} Trader
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activePage === item.id
          
          return (
            <motion.button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : isDark
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="w-2 h-2 bg-white rounded-full ml-auto"
                />
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* Stats Section */}
      <div className="p-4 mt-auto">
        <div className={`p-4 rounded-lg transition-colors duration-300 ${
          isDark ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-medium transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Balance
            </span>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className={`text-2xl font-bold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            ${user?.balance?.toLocaleString() || '10,000'}
          </div>
          <div className="text-sm text-green-500 flex items-center mt-1">
            <span>+$0 today</span>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
            isDark
              ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </motion.div>
  )
}

export default Sidebar