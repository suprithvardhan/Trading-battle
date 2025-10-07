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
  Award,
  Eye,
  EyeOff,
  ChevronRight,
  Bell,
  Shield,
  Zap,
  Globe
} from 'lucide-react'
import Logo from './Logo'

const Sidebar = ({ activePage, setActivePage }) => {
  const { isDark } = useTheme()
  const { user, logout } = useAuth()
  const [showBalance, setShowBalance] = React.useState(true)

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
      className="h-screen w-72 fixed left-0 top-0 bg-slate-900 border-r border-slate-800 z-50"
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <div>
            <span className="text-xl font-bold text-white">TradeBattle</span>
            <div className="text-xs text-slate-400">Professional Trading</div>
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <div className="text-white font-semibold">{user?.username}</div>
            <div className="text-sm text-slate-400">Bronze Trader</div>
          </div>
        </div>
        
        {/* Balance Section */}
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Balance</span>
            <button 
              onClick={() => setShowBalance(!showBalance)}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
            >
              {showBalance ? <Eye className="w-4 h-4 text-slate-400" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {showBalance ? `$${user?.balance?.toLocaleString() || '10,000'}` : '••••••'}
          </div>
          <div className="flex items-center text-sm text-green-400">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+$0 today</span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 px-4 py-6">
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activePage === item.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {activePage === item.id && (
                <div className="w-2 h-2 bg-white rounded-full ml-auto"></div>
              )}
            </motion.button>
          ))}
        </nav>
      </div>


      {/* Logout Button */}
      <div className="p-4 border-t border-slate-800">
        <motion.button
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
          <ChevronRight className="w-4 h-4 ml-auto" />
        </motion.button>
      </div>
    </motion.div>
  )
}

export default Sidebar