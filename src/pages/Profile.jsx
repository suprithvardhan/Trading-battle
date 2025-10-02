import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { 
  User, 
  Mail, 
  Calendar,
  Trophy,
  Target,
  TrendingUp,
  Award,
  Star,
  Edit,
  Save,
  X
} from 'lucide-react'

const Profile = () => {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    username: user?.username || '',
    email: user?.email || ''
  })

  const badges = [
    { name: 'First Win', description: 'Won your first match', earned: true, icon: '🏆' },
    { name: 'Win Streak', description: '5 wins in a row', earned: true, icon: '🔥' },
    { name: 'Quick Draw', description: 'Won in under 2 minutes', earned: true, icon: '⚡' },
    { name: 'High Roller', description: 'Traded over $50k', earned: false, icon: '💎' },
    { name: 'Unstoppable', description: '10 win streak', earned: false, icon: '🚀' }
  ]

  const handleSave = () => {
    // Here you would typically make an API call to update the profile
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditData({
      username: user?.username || '',
      email: user?.email || ''
    })
    setIsEditing(false)
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
            Profile
          </h1>
          <p className={`mt-2 transition-colors duration-300 ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Manage your account and view your trading statistics
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`p-6 rounded-2xl border transition-colors duration-300 ${
              isDark 
                ? 'bg-slate-800 border-slate-700' 
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <h2 className={`text-xl font-bold mb-2 transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {user?.username}
              </h2>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors duration-300 ${
                isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
              }`}>
                <Trophy className="w-4 h-4 mr-2" />
                {user?.tier} Trader
              </div>
            </div>

            {/* Profile Stats */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Member since
                </span>
                <span className={`font-medium transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Jan 2024
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Total matches
                </span>
                <span className={`font-medium transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {user?.stats?.totalMatches || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Win rate
                </span>
                <span className={`font-medium transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {user?.stats?.winRate || 0}%
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Account Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`p-6 rounded-2xl border transition-colors duration-300 ${
              isDark 
                ? 'bg-slate-800 border-slate-700' 
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Account Information
              </h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className={`p-2 rounded-lg transition-colors duration-300 ${
                    isDark 
                      ? 'hover:bg-slate-700 text-slate-400' 
                      : 'hover:bg-slate-100 text-slate-500'
                  }`}
                >
                  <Edit className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Username
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.username}
                    onChange={(e) => setEditData({...editData, username: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border transition-colors duration-300 ${
                      isDark 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                ) : (
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
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border transition-colors duration-300 ${
                      isDark 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                ) : (
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
                )}
              </div>
            </div>
          </motion.div>

          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className={`p-6 rounded-2xl border transition-colors duration-300 ${
              isDark 
                ? 'bg-slate-800 border-slate-700' 
                : 'bg-white border-slate-200'
            }`}
          >
            <h3 className={`text-lg font-semibold mb-6 transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Badges & Achievements
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {badges.map((badge, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`p-4 rounded-xl border transition-all duration-300 ${
                    badge.earned
                      ? isDark
                        ? 'bg-slate-700 border-slate-600'
                        : 'bg-slate-50 border-slate-200'
                      : isDark
                        ? 'bg-slate-800 border-slate-700 opacity-50'
                        : 'bg-slate-100 border-slate-200 opacity-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{badge.icon}</div>
                    <div className="flex-1">
                      <div className={`font-medium transition-colors duration-300 ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {badge.name}
                      </div>
                      <div className={`text-sm transition-colors duration-300 ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {badge.description}
                      </div>
                    </div>
                    {badge.earned && (
                      <div className="text-green-500">
                        <Award className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Profile
