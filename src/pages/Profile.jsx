import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import axios from 'axios'
import { 
  User, 
  Mail, 
  Trophy, 
  TrendingUp, 
  Award,
  Calendar,
  Target,
  BarChart3,
  Edit,
  Save,
  X
} from 'lucide-react'

const Profile = () => {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    username: '',
    email: ''
  })

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const response = await axios.get('http://localhost:5000/api/user/profile')
        
        if (response.data.success) {
          setProfile(response.data.user)
          setEditForm({
            username: response.data.user.username,
            email: response.data.user.email
          })
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        // Fallback to user data from context
        setProfile(user)
        setEditForm({
          username: user?.username || '',
          email: user?.email || ''
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const handleEdit = () => {
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
    setEditForm({
      username: profile?.username || '',
      email: profile?.email || ''
    })
  }

  const handleSave = async () => {
    try {
      const response = await axios.put('http://localhost:5000/api/user/profile', editForm)
      
      if (response.data.success) {
        setProfile(response.data.user)
        setEditing(false)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const handleInputChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    })
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Loading profile...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className={`text-2xl font-bold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Profile Settings
          </h1>
          <p className={`text-sm transition-colors duration-300 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Manage your account information and preferences
          </p>
        </div>
        
        {!editing && (
          <button
            onClick={handleEdit}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        )}
      </motion.div>

      {/* Profile Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Personal Information */}
        <div className="lg:col-span-2">
          <div className={`p-6 rounded-lg border transition-colors duration-300 ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Personal Information
            </h2>
            
            <div className="space-y-4">
              {/* Username */}
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Username
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="username"
                    value={editForm.username}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                ) : (
                  <div className={`px-3 py-2 rounded-lg transition-colors duration-300 ${
                    isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'
                  }`}>
                    {profile?.username || 'N/A'}
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email Address
                </label>
                {editing ? (
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                ) : (
                  <div className={`px-3 py-2 rounded-lg transition-colors duration-300 ${
                    isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'
                  }`}>
                    {profile?.email || 'N/A'}
                  </div>
                )}
              </div>

              {/* Join Date */}
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Member Since
                </label>
                <div className={`px-3 py-2 rounded-lg transition-colors duration-300 ${
                  isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'
                }`}>
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>

            {/* Edit Actions */}
            {editing && (
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="lg:col-span-1">
          <div className={`p-6 rounded-lg border transition-colors duration-300 ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Trading Stats
            </h2>
            
            <div className="space-y-4">
              {/* Tier */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span className={`text-sm transition-colors duration-300 ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>Tier</span>
                </div>
                <span className={`font-semibold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {profile?.tier || 'Bronze'}
                </span>
              </div>

              {/* Win Rate */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  <span className={`text-sm transition-colors duration-300 ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>Win Rate</span>
                </div>
                <span className={`font-semibold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {profile?.stats?.winRate || 0}%
                </span>
              </div>

              {/* Total Matches */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-green-500" />
                  <span className={`text-sm transition-colors duration-300 ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>Matches</span>
                </div>
                <span className={`font-semibold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {profile?.stats?.totalMatches || 0}
                </span>
              </div>

              {/* Current Streak */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  <span className={`text-sm transition-colors duration-300 ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>Streak</span>
                </div>
                <span className={`font-semibold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {profile?.stats?.currentStreak || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Badges Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={`p-6 rounded-lg border transition-colors duration-300 ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}
      >
        <h2 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Achievements & Badges
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {profile?.badges?.length > 0 ? (
            profile.badges.map((badge, index) => (
              <div key={index} className={`p-4 rounded-lg border transition-colors duration-300 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  <span className={`font-medium transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {badge.name}
                  </span>
                </div>
                <p className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {badge.description}
                </p>
              </div>
            ))
          ) : (
            <div className={`col-span-full text-center py-8 transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No badges earned yet. Start trading to earn achievements!</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default Profile