import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  // Function to refresh user data
  const refreshUser = async () => {
    if (token) {
      try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setUser(data.user)
            console.log('💰 User data refreshed, new balance:', data.user.balance)
          }
        }
      } catch (error) {
        console.error('Failed to refresh user data:', error)
      }
    }
  }

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await fetch('http://localhost:5000/api/auth/verify-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token })
          })

          if (response.ok) {
            const data = await response.json()
            setUser(data.user)
          } else {
            localStorage.removeItem('token')
            setToken(null)
          }
        } catch (error) {
          console.error('Auth check failed:', error)
          localStorage.removeItem('token')
          setToken(null)
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [token])

  const login = async (usernameOrEmail, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usernameOrEmail, password })
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem('token', data.token)
        return { success: true, user: data.user }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: 'Login failed. Please try again.' }
    }
  }

  const register = async (username, email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password })
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem('token', data.token)
        return { success: true, user: data.user }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, message: 'Registration failed. Please try again.' }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
