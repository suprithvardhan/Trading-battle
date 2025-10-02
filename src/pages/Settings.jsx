import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { 
  User, 
  Mail, 
  Lock,
  Bell,
  Shield,
  Trash2,
  Save,
  Eye,
  EyeOff
} from 'lucide-react'

const Settings = () => {
  const { user } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    matches: true,
    leaderboard: false
  })

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'danger', label: 'Danger Zone', icon: Trash2 }
  ]

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className={`text-3xl font-bold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Settings
          </h1>
          <p className={`mt-2 transition-colors duration-300 ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Manage your account preferences and security
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={`lg:col-span-1 p-6 rounded-2xl border transition-colors duration-300 ${
            isDark 
              ? 'bg-slate-800 border-slate-700' 
              : 'bg-white border-slate-200'
          }`}
        >
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : isDark
                        ? 'text-slate-300 hover:bg-slate-700 hover:text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-3"
        >
          {activeTab === 'profile' && (
            <div className={`p-6 rounded-2xl border transition-colors duration-300 ${
              isDark 
                ? 'bg-slate-800 border-slate-700' 
                : 'bg-white border-slate-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-6 transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Profile Information
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Username
                  </label>
                  <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors duration-300 ${
                    isDark ? 'bg-slate-700' : 'bg-slate-50'
                  }`}>
                    <User className={`w-5 h-5 transition-colors duration-300 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`} />
                    <span className={`transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {user?.username}
                    </span>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Email
                  </label>
                  <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors duration-300 ${
                    isDark ? 'bg-slate-700' : 'bg-slate-50'
                  }`}>
                    <Mail className={`w-5 h-5 transition-colors duration-300 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`} />
                    <span className={`transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {user?.email}
                    </span>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Theme
                  </label>
                  <button
                    onClick={toggleTheme}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors duration-300 ${
                      isDark 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <span>Dark Mode</span>
                    <div className={`w-12 h-6 rounded-full transition-colors duration-300 ${
                      isDark ? 'bg-blue-600' : 'bg-slate-300'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                        isDark ? 'translate-x-6' : 'translate-x-0.5'
                      } mt-0.5`} />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className={`p-6 rounded-2xl border transition-colors duration-300 ${
              isDark 
                ? 'bg-slate-800 border-slate-700' 
                : 'bg-white border-slate-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-6 transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Security Settings
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Change Password
                  </label>
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Current password"
                        className={`w-full px-4 py-3 rounded-xl border transition-colors duration-300 ${
                          isDark 
                            ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                        }`}
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showPassword ? (
                          <EyeOff className={`w-5 h-5 transition-colors duration-300 ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`} />
                        ) : (
                          <Eye className={`w-5 h-5 transition-colors duration-300 ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`} />
                        )}
                      </button>
                    </div>
                    <input
                      type="password"
                      placeholder="New password"
                      className={`w-full px-4 py-3 rounded-xl border transition-colors duration-300 ${
                        isDark 
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                      }`}
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className={`w-full px-4 py-3 rounded-xl border transition-colors duration-300 ${
                        isDark 
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                      }`}
                    />
                  </div>
                </div>

                <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-300 flex items-center space-x-2">
                  <Save className="w-5 h-5" />
                  <span>Update Password</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className={`p-6 rounded-2xl border transition-colors duration-300 ${
              isDark 
                ? 'bg-slate-800 border-slate-700' 
                : 'bg-white border-slate-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-6 transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Notification Preferences
              </h3>
              
              <div className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <div className={`font-medium transition-colors duration-300 ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {key.charAt(0).toUpperCase() + key.slice(1)} Notifications
                      </div>
                      <div className={`text-sm transition-colors duration-300 ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Receive notifications about {key}
                      </div>
                    </div>
                    <button
                      onClick={() => handleNotificationChange(key)}
                      className={`w-12 h-6 rounded-full transition-colors duration-300 ${
                        value ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                        value ? 'translate-x-6' : 'translate-x-0.5'
                      } mt-0.5`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className={`p-6 rounded-2xl border transition-colors duration-300 ${
              isDark 
                ? 'bg-slate-800 border-slate-700' 
                : 'bg-white border-slate-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-6 transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Danger Zone
              </h3>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border transition-colors duration-300 ${
                  isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-medium transition-colors duration-300 ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        Delete Account
                      </div>
                      <div className={`text-sm transition-colors duration-300 ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Permanently delete your account and all data
                      </div>
                    </div>
                    <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors duration-300 flex items-center space-x-2">
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default Settings
