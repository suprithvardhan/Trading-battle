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
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-white font-semibold">Setting up your trading dashboard...</p>
          <p className="text-slate-400 mt-2">Preparing professional trading environment</p>
        </div>
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
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Sidebar */}
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      
      {/* Main Content */}
      <div className="ml-72">
        <motion.div
          key={activePage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="min-h-screen"
        >
          <AnimatePresence mode="wait">
            {renderPage()}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

export default DashboardLayout