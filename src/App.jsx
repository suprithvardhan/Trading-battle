import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Play, 
  ArrowRight, 
  BarChart3, 
  Shield, 
  Zap, 
  Award,
  TrendingUp,
  Users,
  Target
} from 'lucide-react'
import Logo from './components/Logo'
import ThemeToggle from './components/ThemeToggle'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import DashboardLayout from './pages/DashboardLayout'
import MatchPage from './pages/MatchPage'
import DemoMatch from './pages/DemoMatch'
import DemoChart from './pages/DemoChart'
import ProtectedRoute from './components/ProtectedRoute'

const MainApp = () => {
  const [isHovered, setIsHovered] = useState(false)
  const { isDark } = useTheme()

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-gray-900 text-white' 
        : 'bg-white text-gray-900'
    }`}>
      {/* Navigation */}
      <nav className={`fixed top-0 w-full backdrop-blur-md border-b z-50 transition-colors duration-300 ${
        isDark 
          ? 'bg-gray-900/90 border-gray-700' 
          : 'bg-white/90 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Logo className="w-8 h-8" isDark={isDark} />
              <span className="text-xl font-bold">
                TradeBattle
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className={`transition-colors duration-300 ${
                isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}>Features</a>
              <a href="#how-it-works" className={`transition-colors duration-300 ${
                isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}>How it Works</a>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <a 
                href="/login"
                className={`transition-colors duration-300 ${
                  isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign In
              </a>
              <a 
                href="/signup"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Get Started
        </a>
      </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative">
          {/* Social Proof Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-8"
          >
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full border transition-colors duration-300 ${
              isDark 
                ? 'bg-gray-800 border-gray-700 text-gray-300' 
                : 'bg-gray-100 border-gray-200 text-gray-600'
            }`}>
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white"></div>
                ))}
              </div>
              <span className="text-sm font-medium">Join 10,000+ traders competing daily</span>
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <h1 className={`text-5xl md:text-7xl font-bold mb-6 leading-tight transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Professional{' '}
              <span className="relative">
                <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                  Trading
                </span>
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>
              </span>
              <br />
              <span className="text-4xl md:text-6xl">Competition</span>
            </h1>
            
            <p className={`text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Experience real-time paper trading battles with live market data. 
              <span className={`font-semibold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}> Zero risk, maximum strategy.</span>
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <a 
              href="/signup"
              className="group relative bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25 flex items-center space-x-3"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <Play className="w-5 h-5" />
              <span>Start Trading Free</span>
              <ArrowRight className={`w-5 h-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
            </a>
            
            <a 
              href="/demomatch"
              className={`group px-8 py-4 rounded-lg text-lg font-semibold border transition-all duration-300 hover:shadow-lg flex items-center space-x-3 ${
                isDark 
                  ? 'bg-gray-800 text-white border-gray-600 hover:border-gray-500' 
                  : 'bg-white text-gray-900 border-gray-200 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Watch Demo</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </a>
            
            <a 
              href="/demochart"
              className={`group px-8 py-4 rounded-lg text-lg font-semibold border transition-all duration-300 hover:shadow-lg flex items-center space-x-3 ${
                isDark 
                  ? 'bg-gray-800 text-white border-gray-600 hover:border-gray-500' 
                  : 'bg-white text-gray-900 border-gray-200 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span>Test Charts</span>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </a>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap justify-center items-center gap-8 text-sm"
          >
            <div className={`flex items-center space-x-2 transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <Shield className="w-4 h-4 text-green-500" />
              <span>Bank-level security</span>
            </div>
            <div className={`flex items-center space-x-2 transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>Real-time data</span>
            </div>
            <div className={`flex items-center space-x-2 transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <Award className="w-4 h-4 text-blue-500" />
              <span>Free forever</span>
            </div>
          </motion.div>

          {/* Visual Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="relative max-w-6xl mx-auto mt-20"
          >
            <div className={`relative rounded-2xl shadow-2xl border overflow-hidden transition-colors duration-300 ${
              isDark 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              {/* Mock Dashboard Header */}
              <div className={`px-8 py-6 border-b flex items-center justify-between transition-colors duration-300 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse delay-300"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse delay-700"></div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`text-sm font-medium transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>TradeBattle Pro</div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Mock Dashboard Content */}
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Panel - Match Info */}
                  <div className="lg:col-span-1">
                    <div className={`rounded-xl p-6 border transition-colors duration-300 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="text-center">
                        <div className="relative mb-6">
                          <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto flex items-center justify-center shadow-lg">
                            <Users className="w-8 h-8 text-white" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          </div>
                        </div>
                        <h3 className={`text-lg font-bold mb-2 transition-colors duration-300 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>Live Battle</h3>
                        <p className={`mb-4 transition-colors duration-300 ${
                          isDark ? 'text-gray-300' : 'text-gray-600'
                        }`}>vs CryptoKing_99</p>
                        <div className={`rounded-lg p-4 shadow-lg transition-colors duration-300 ${
                          isDark ? 'bg-gray-800' : 'bg-white'
                        }`}>
                          <div className="flex justify-between items-center mb-3">
                            <span className={`text-sm transition-colors duration-300 ${
                              isDark ? 'text-gray-300' : 'text-gray-600'
                            }`}>Your Balance</span>
                            <span className="font-bold text-green-500 text-lg">$12,450</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full w-3/4 animate-pulse"></div>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className={`transition-colors duration-300 ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>75% to double</span>
                            <span className="text-green-500 font-semibold">+$2,450</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Center Panel - Chart */}
                  <div className="lg:col-span-2">
                    <div className={`rounded-xl p-6 transition-colors duration-300 ${
                      isDark ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className={`text-lg font-bold transition-colors duration-300 ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>AAPL - Apple Inc.</h3>
                          <p className={`text-sm transition-colors duration-300 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>NASDAQ • Real-time</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-500">$189.45</div>
                            <div className="text-sm text-green-500 flex items-center">
                              <TrendingUp className="w-4 h-4 mr-1" />
                              +2.4% (+$4.32)
                            </div>
                          </div>
                          <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Enhanced Chart */}
                      <div className={`h-48 rounded-lg p-4 border transition-colors duration-300 ${
                        isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                      }`}>
                        <div className="h-full flex items-end space-x-1">
                          {[...Array(30)].map((_, i) => (
                            <div
                              key={i}
                              className="bg-gradient-to-t from-green-500 to-green-300 rounded-sm flex-1 hover:from-green-400 hover:to-green-200 transition-all duration-300"
                              style={{ 
                                height: `${Math.random() * 70 + 30}%`,
                                animationDelay: `${i * 50}ms`
                              }}
                            ></div>
                          ))}
                        </div>
                      </div>

                      {/* Trading Panel */}
                      <div className="mt-6 grid grid-cols-2 gap-4">
                        <button className="group bg-green-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25 flex items-center justify-center space-x-2">
                          <TrendingUp className="w-5 h-5" />
                          <span>Buy</span>
                        </button>
                        <button className="group bg-red-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/25 flex items-center justify-center space-x-2">
                          <TrendingUp className="w-5 h-5 rotate-180" />
                          <span>Sell</span>
        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="absolute -bottom-10 left-1/2 transform -translate-x-1/2"
              >
                <div className={`flex items-center space-x-8 px-8 py-4 rounded-2xl border backdrop-blur-sm transition-colors duration-300 ${
                  isDark 
                    ? 'bg-gray-800/80 border-gray-700' 
                    : 'bg-white/80 border-gray-200'
                }`}>
                  <div className="text-center">
                    <div className={`text-2xl font-bold transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>$2.4M</div>
                    <div className={`text-xs transition-colors duration-300 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>Traded Today</div>
                  </div>
                  <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>1,247</div>
                    <div className={`text-xs transition-colors duration-300 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>Active Battles</div>
                  </div>
                  <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>98.7%</div>
                    <div className={`text-xs transition-colors duration-300 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>Uptime</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Why Choose TradeBattle?
            </h2>
            <p className={`text-xl transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Professional trading tools for serious traders
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: 'Real-time Battles',
                description: 'Compete against other traders in real-time with live market data'
              },
              {
                icon: TrendingUp,
                title: 'Advanced Analytics',
                description: 'Track your performance with detailed statistics and insights'
              },
              {
                icon: Users,
                title: 'Global Leaderboard',
                description: 'Climb the ranks and prove you\'re the best trader'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`p-8 rounded-xl border transition-colors duration-300 ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className={`text-xl font-bold mb-4 transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {feature.title}
                </h3>
                <p className={`transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              How It Works
            </h2>
            <p className={`text-xl transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Get started in minutes
        </p>
      </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Sign Up', description: 'Create your free account' },
              { step: '2', title: 'Find Match', description: 'Get matched with another trader' },
              { step: '3', title: 'Start Trading', description: 'Trade with real market data' },
              { step: '4', title: 'Win & Climb', description: 'Climb the leaderboard' }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">{step.step}</span>
                </div>
                <h3 className={`text-xl font-bold mb-4 transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {step.title}
                </h3>
                <p className={`transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 px-4 sm:px-6 lg:px-8 border-t transition-colors duration-300 ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Logo className="w-8 h-8" isDark={isDark} />
            <span className={`text-xl font-bold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              TradeBattle
            </span>
          </div>
          <p className={`transition-colors duration-300 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            © 2024 TradeBattle. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Routes>
            <Route path="/" element={<MainApp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            } />
            <Route path="/match" element={
              <ProtectedRoute>
                <MatchPage />
              </ProtectedRoute>
            } />
            <Route path="/demomatch" element={<DemoMatch />} />
            <Route path="/demochart" element={<DemoChart />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  )
}

export default App