import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import axios from 'axios'
import { 
  User, 
  Mail, 
  Lock,
  Bell,
  Shield,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Settings as SettingsIcon,
  Palette,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader,
  Globe,
  Users,
  BarChart3,
  DollarSign,
  Sliders,
  Zap,
  Target,
  AlertCircle
} from 'lucide-react'

const Settings = () => {
  const { user, setUser } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Settings state
  const [settings, setSettings] = useState({
    profile: {
      username: '',
      email: ''
    },
    notifications: {
      email: true,
      push: true,
      matches: true,
      leaderboard: false,
      achievements: true,
      trading: true
    },
    privacy: {
      showStats: true,
      showBalance: false,
      showTrades: true,
      allowDirectMessages: true
    },
    trading: {
      defaultLeverage: 10,
      defaultMarginMode: 'isolated',
      autoCloseOnLoss: false,
      maxLossPercentage: 50
    }
  })

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Delete account state
  const [deleteData, setDeleteData] = useState({
    password: '',
    confirmText: ''
  })

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User, color: 'blue' },
    { id: 'security', label: 'Security', icon: Shield, color: 'green' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'purple' },
    { id: 'privacy', label: 'Privacy', icon: Globe, color: 'orange' },
    { id: 'trading', label: 'Trading', icon: TrendingUp, color: 'emerald' },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, color: 'red' }
  ]

  // Load settings from backend
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        const response = await axios.get('http://localhost:5000/api/settings', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        
        if (response.data.success) {
          setSettings(response.data.settings)
        }
      } catch (error) {
        console.error('Error loading settings:', error)
        setMessage({ type: 'error', text: 'Failed to load settings' })
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  // Show message helper
  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  // Update profile
  const handleProfileUpdate = async () => {
    try {
      setSaving(true)
      const response = await axios.put('http://localhost:5000/api/settings/profile', {
        username: settings.profile.username,
        email: settings.profile.email
      }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })

      if (response.data.success) {
        setUser(response.data.user)
        showMessage('success', 'Profile updated successfully')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      showMessage('error', error.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  // Update password
  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'New passwords do not match')
      return
    }

    try {
      setSaving(true)
      const response = await axios.put('http://localhost:5000/api/settings/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })

      if (response.data.success) {
        showMessage('success', 'Password updated successfully')
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      }
    } catch (error) {
      console.error('Error updating password:', error)
      showMessage('error', error.response?.data?.message || 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  // Update notifications
  const handleNotificationsUpdate = async () => {
    try {
      setSaving(true)
      const response = await axios.put('http://localhost:5000/api/settings/notifications', {
        notifications: settings.notifications
      }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })

      if (response.data.success) {
        showMessage('success', 'Notification preferences updated')
      }
    } catch (error) {
      console.error('Error updating notifications:', error)
      showMessage('error', 'Failed to update notification preferences')
    } finally {
      setSaving(false)
    }
  }

  // Update privacy
  const handlePrivacyUpdate = async () => {
    try {
      setSaving(true)
      const response = await axios.put('http://localhost:5000/api/settings/privacy', {
        privacy: settings.privacy
      }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })

      if (response.data.success) {
        showMessage('success', 'Privacy settings updated')
      }
    } catch (error) {
      console.error('Error updating privacy:', error)
      showMessage('error', 'Failed to update privacy settings')
    } finally {
      setSaving(false)
    }
  }

  // Update trading preferences
  const handleTradingUpdate = async () => {
    try {
      setSaving(true)
      const response = await axios.put('http://localhost:5000/api/settings/trading', {
        trading: settings.trading
      }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })

      if (response.data.success) {
        showMessage('success', 'Trading preferences updated')
      }
    } catch (error) {
      console.error('Error updating trading:', error)
      showMessage('error', 'Failed to update trading preferences')
    } finally {
      setSaving(false)
    }
  }

  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteData.confirmText !== 'DELETE') {
      showMessage('error', 'Please type DELETE to confirm')
      return
    }

    try {
      setSaving(true)
      const response = await axios.delete('http://localhost:5000/api/settings/account', {
        data: { password: deleteData.password },
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })

      if (response.data.success) {
        localStorage.removeItem('token')
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      showMessage('error', error.response?.data?.message || 'Failed to delete account')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Loading Settings</h3>
          <p className="text-slate-400">Fetching your preferences...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <SettingsIcon className="w-8 h-8 text-blue-400 mr-3" />
            <h1 className="text-4xl font-bold text-white">
              Settings
            </h1>
            <SettingsIcon className="w-8 h-8 text-blue-400 ml-3" />
          </div>
          <p className="text-xl text-slate-300">
            Manage your account preferences and security
          </p>
        </motion.div>

        {/* Message */}
        <AnimatePresence>
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-4 rounded-xl border ${
                message.type === 'success' 
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              <div className="flex items-center space-x-3">
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <span>{message.text}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                        isActive
                          ? `bg-${tab.color}-500/20 text-${tab.color}-400 border border-${tab.color}-500/30`
                          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <div className="flex items-center space-x-3 mb-8">
                    <User className="w-6 h-6 text-blue-400" />
                    <h3 className="text-2xl font-bold text-white">Profile Information</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Username
                        </label>
                        <input
                          type="text"
                          value={settings.profile.username}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            profile: { ...prev.profile, username: e.target.value }
                          }))}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={settings.profile.email}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            profile: { ...prev.profile, email: e.target.value }
                          }))}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Theme
                      </label>
                      <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-700/50 border border-slate-600/50 text-white rounded-xl hover:bg-slate-700/70 transition-all duration-300"
                      >
                        <span>Dark Mode</span>
                        <div className={`w-12 h-6 rounded-full transition-colors duration-300 ${
                          isDark ? 'bg-blue-500' : 'bg-slate-600'
                        }`}>
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                            isDark ? 'translate-x-6' : 'translate-x-0.5'
                          } mt-0.5`} />
                        </div>
                      </button>
                    </div>

                    <button
                      onClick={handleProfileUpdate}
                      disabled={saving}
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      <span>{saving ? 'Saving...' : 'Update Profile'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <div className="flex items-center space-x-3 mb-8">
                    <Shield className="w-6 h-6 text-green-400" />
                    <h3 className="text-2xl font-bold text-white">Security Settings</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder="Enter current password"
                          className="w-full px-4 py-3 pr-12 bg-slate-700/50 border border-slate-600/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5 text-slate-400" />
                          ) : (
                            <Eye className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Enter new password"
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm new password"
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handlePasswordUpdate}
                      disabled={saving}
                      className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? <Loader className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                      <span>{saving ? 'Updating...' : 'Update Password'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <div className="flex items-center space-x-3 mb-8">
                    <Bell className="w-6 h-6 text-purple-400" />
                    <h3 className="text-2xl font-bold text-white">Notification Preferences</h3>
                  </div>
                  
                  <div className="space-y-6">
                    {Object.entries(settings.notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                        <div>
                          <div className="font-medium text-white capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()} Notifications
                          </div>
                          <div className="text-sm text-slate-400">
                            Receive notifications about {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </div>
                        </div>
                        <button
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, [key]: !value }
                          }))}
                          className={`w-12 h-6 rounded-full transition-colors duration-300 ${
                            value ? 'bg-purple-500' : 'bg-slate-600'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                            value ? 'translate-x-6' : 'translate-x-0.5'
                          } mt-0.5`} />
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={handleNotificationsUpdate}
                      disabled={saving}
                      className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? <Loader className="w-5 h-5 animate-spin" /> : <Bell className="w-5 h-5" />}
                      <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div>
                  <div className="flex items-center space-x-3 mb-8">
                    <Globe className="w-6 h-6 text-orange-400" />
                    <h3 className="text-2xl font-bold text-white">Privacy Settings</h3>
                  </div>
                  
                  <div className="space-y-6">
                    {Object.entries(settings.privacy).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                        <div>
                          <div className="font-medium text-white capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div className="text-sm text-slate-400">
                            {key === 'showStats' && 'Allow others to see your trading statistics'}
                            {key === 'showBalance' && 'Allow others to see your account balance'}
                            {key === 'showTrades' && 'Allow others to see your trading history'}
                            {key === 'allowDirectMessages' && 'Allow other users to send you direct messages'}
                          </div>
                        </div>
                        <button
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            privacy: { ...prev.privacy, [key]: !value }
                          }))}
                          className={`w-12 h-6 rounded-full transition-colors duration-300 ${
                            value ? 'bg-orange-500' : 'bg-slate-600'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                            value ? 'translate-x-6' : 'translate-x-0.5'
                          } mt-0.5`} />
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={handlePrivacyUpdate}
                      disabled={saving}
                      className="bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? <Loader className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
                      <span>{saving ? 'Saving...' : 'Save Privacy Settings'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Trading Tab */}
              {activeTab === 'trading' && (
                <div>
                  <div className="flex items-center space-x-3 mb-8">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                    <h3 className="text-2xl font-bold text-white">Trading Preferences</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Default Leverage
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="75"
                          value={settings.trading.defaultLeverage}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            trading: { ...prev.trading, defaultLeverage: parseInt(e.target.value) }
                          }))}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Default Margin Mode
                        </label>
                        <select
                          value={settings.trading.defaultMarginMode}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            trading: { ...prev.trading, defaultMarginMode: e.target.value }
                          }))}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300"
                        >
                          <option value="isolated">Isolated</option>
                          <option value="cross">Cross</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                      <div>
                        <div className="font-medium text-white">Auto Close on Loss</div>
                        <div className="text-sm text-slate-400">Automatically close positions when loss limit is reached</div>
                      </div>
                      <button
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          trading: { ...prev.trading, autoCloseOnLoss: !prev.trading.autoCloseOnLoss }
                        }))}
                        className={`w-12 h-6 rounded-full transition-colors duration-300 ${
                          settings.trading.autoCloseOnLoss ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                          settings.trading.autoCloseOnLoss ? 'translate-x-6' : 'translate-x-0.5'
                        } mt-0.5`} />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Max Loss Percentage ({settings.trading.maxLossPercentage}%)
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        value={settings.trading.maxLossPercentage}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          trading: { ...prev.trading, maxLossPercentage: parseInt(e.target.value) }
                        }))}
                        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <button
                      onClick={handleTradingUpdate}
                      disabled={saving}
                      className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? <Loader className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
                      <span>{saving ? 'Saving...' : 'Save Trading Preferences'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Danger Zone Tab */}
              {activeTab === 'danger' && (
                <div>
                  <div className="flex items-center space-x-3 mb-8">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                    <h3 className="text-2xl font-bold text-white">Danger Zone</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <div className="flex items-center space-x-3 mb-4">
                        <AlertCircle className="w-6 h-6 text-red-400" />
                        <h4 className="text-lg font-semibold text-white">Delete Account</h4>
                      </div>
                      <p className="text-slate-300 mb-6">
                        This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                      </p>
                      
                      {!showDeleteConfirm ? (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors duration-300 flex items-center space-x-2"
                        >
                          <Trash2 className="w-5 h-5" />
                          <span>Delete Account</span>
                        </button>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Enter your password to confirm
                            </label>
                            <input
                              type="password"
                              value={deleteData.password}
                              onChange={(e) => setDeleteData(prev => ({ ...prev, password: e.target.value }))}
                              placeholder="Enter your password"
                              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Type "DELETE" to confirm
                            </label>
                            <input
                              type="text"
                              value={deleteData.confirmText}
                              onChange={(e) => setDeleteData(prev => ({ ...prev, confirmText: e.target.value }))}
                              placeholder="Type DELETE"
                              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300"
                            />
                          </div>
                          
                          <div className="flex space-x-4">
                            <button
                              onClick={handleDeleteAccount}
                              disabled={saving || deleteData.confirmText !== 'DELETE'}
                              className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {saving ? <Loader className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                              <span>{saving ? 'Deleting...' : 'Delete Account'}</span>
                            </button>
                            
                            <button
                              onClick={() => setShowDeleteConfirm(false)}
                              className="bg-slate-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-700 transition-colors duration-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Settings
