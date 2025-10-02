import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Menu, Bell, Search } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import ThemeToggle from '../components/ThemeToggle'

const DashboardLayout = ({ children, currentPage }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const { isDark } = useTheme()

  const handleNavigate = (path) => {
    // Navigation will be handled by React Router
    window.location.href = path
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-slate-900' 
        : 'bg-slate-50'
    }`}>
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentPage={currentPage}
        onNavigate={handleNavigate}
      />

      {/* Main Content */}
      <div className="lg:pl-80">
        {/* Top Navigation */}
        <header className={`sticky top-0 z-30 border-b transition-colors duration-300 ${
          isDark 
            ? 'bg-slate-900/80 border-slate-700 backdrop-blur-md' 
            : 'bg-white/80 border-slate-200 backdrop-blur-md'
        }`}>
          <div className="flex items-center justify-between px-4 py-4 lg:px-8">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className={`p-2 rounded-lg transition-colors duration-300 ${
                  isDark 
                    ? 'hover:bg-slate-800 text-slate-300' 
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Search Bar */}
              <div className="hidden md:flex items-center space-x-2">
                <div className={`relative transition-colors duration-300 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search traders, matches..."
                    className={`pl-10 pr-4 py-2 rounded-lg border transition-colors duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-400' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className={`relative p-2 rounded-lg transition-colors duration-300 ${
                isDark 
                  ? 'hover:bg-slate-800 text-slate-300' 
                  : 'hover:bg-slate-100 text-slate-600'
              }`}>
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-300 ${
                  isDark ? 'bg-slate-800' : 'bg-slate-100'
                }`}>
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-sm font-medium transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {user?.username}
                    </p>
                    <p className={`text-xs transition-colors duration-300 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {user?.tier} Tier
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className={`p-2 rounded-lg transition-colors duration-300 ${
                    isDark 
                      ? 'hover:bg-slate-800 text-slate-300' 
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
