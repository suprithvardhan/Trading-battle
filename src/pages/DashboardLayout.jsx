import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from '../components/Sidebar'
import PageTransition from '../components/PageTransition'
import LoadingSpinner from '../components/LoadingSpinner'
import Dashboard from './Dashboard'
import Profile from './Profile'
import Leaderboard from './Leaderboard'
import Matches from './Matches'
import Settings from './Settings'

const DashboardLayout = () => {
  const [activePage, setActivePage] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const { isDark } = useTheme()
  const { user } = useAuth()

  // Simulate loading time for smooth transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
          : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'
      }`}>
        <LoadingSpinner 
          size="large" 
          message="Setting up your trading dashboard..." 
        />
      </div>
    )
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />
      case 'profile':
        return <Profile />
      case 'leaderboard':
        return <Leaderboard />
      case 'matches':
        return <Matches />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-gray-900' 
        : 'bg-white'
    }`}>
      <div className="flex">
        {/* Sidebar */}
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
        
        {/* Main Content */}
        <div className="flex-1 ml-64">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-8"
          >
            <AnimatePresence mode="wait">
              <PageTransition key={activePage}>
                {renderPage()}
              </PageTransition>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
