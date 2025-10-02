import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Users, 
  Trophy, 
  BarChart3, 
  ArrowRight, 
  Play,
  Shield,
  Zap,
  Target,
  Clock,
  DollarSign,
  Award,
  ChevronRight,
  CheckCircle,
  Star
} from 'lucide-react'
import Logo from './components/Logo'
import ThemeToggle from './components/ThemeToggle'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'

const MainApp = () => {
  const [isHovered, setIsHovered] = useState(false)
  const { isDark } = useTheme()

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'
    }`}>
      {/* Navigation */}
      <nav className={`fixed top-0 w-full backdrop-blur-md border-b z-50 transition-colors duration-300 ${
        isDark 
          ? 'bg-slate-900/80 border-slate-700' 
          : 'bg-white/80 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Logo className="w-10 h-10" isDark={isDark} />
              <span className={`text-xl font-bold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                TradeBattle
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className={`transition-colors duration-300 ${
                isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}>Features</a>
              <a href="#how-it-works" className={`transition-colors duration-300 ${
                isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}>How it Works</a>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button className={`transition-colors duration-300 ${
                isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}>Sign In</button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          {/* Gradient Orbs */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
          
          {/* Grid Pattern */}
          <div className={`absolute inset-0 opacity-30 ${
            isDark ? 'bg-grid-slate-800' : 'bg-grid-slate-200'
          }`} style={{
            backgroundImage: `radial-gradient(circle, ${
              isDark ? '#1e293b' : '#e2e8f0'
            } 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}></div>
        </div>

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
                ? 'bg-slate-800/50 border-slate-700 text-slate-300' 
                : 'bg-white/50 border-slate-200 text-slate-600'
            }`}>
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border-2 border-white"></div>
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
            <h1 className={`text-6xl md:text-8xl font-bold mb-6 leading-tight transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              The Future of{' '}
              <span className="relative">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Trading
                </span>
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-full"></div>
              </span>
              <br />
              <span className="text-5xl md:text-7xl">Competition</span>
            </h1>
            
            <p className={`text-xl md:text-2xl mb-8 max-w-4xl mx-auto leading-relaxed transition-colors duration-300 ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Experience real-time paper trading battles with live market data. 
              <span className={`font-semibold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-800'
              }`}> Zero risk, maximum strategy.</span>
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <button 
              className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-blue-500/25 flex items-center space-x-3 overflow-hidden"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Play className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Start Trading Free</span>
              <ArrowRight className={`w-5 h-5 relative z-10 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
            </button>
            
            <button className={`group px-8 py-4 rounded-2xl text-lg font-semibold border-2 transition-all duration-300 hover:shadow-xl flex items-center space-x-3 ${
              isDark 
                ? 'bg-slate-800/50 text-slate-200 border-slate-600 hover:border-slate-500 hover:bg-slate-700/50' 
                : 'bg-white/50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-white'
            }`}>
              <BarChart3 className="w-5 h-5" />
              <span>Watch Demo</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap justify-center items-center gap-8 text-sm"
          >
            <div className={`flex items-center space-x-2 transition-colors duration-300 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <Shield className="w-4 h-4 text-green-500" />
              <span>Bank-level security</span>
            </div>
            <div className={`flex items-center space-x-2 transition-colors duration-300 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>Real-time data</span>
            </div>
            <div className={`flex items-center space-x-2 transition-colors duration-300 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <Award className="w-4 h-4 text-purple-500" />
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
            {/* Floating Elements */}
            <div className="absolute -top-10 -left-10 w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-60 animate-pulse"></div>
            <div className="absolute -top-5 -right-10 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-60 animate-pulse delay-1000"></div>
            
            <div className={`relative rounded-3xl shadow-2xl border overflow-hidden transition-colors duration-300 ${
              isDark 
                ? 'bg-slate-800 border-slate-700' 
                : 'bg-white border-slate-200'
            }`}>
              {/* Mock Dashboard Header */}
              <div className={`px-8 py-6 border-b flex items-center justify-between transition-colors duration-300 ${
                isDark 
                  ? 'bg-slate-700 border-slate-600' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse delay-300"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse delay-700"></div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`text-sm font-medium transition-colors duration-300 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>TradeBattle Pro</div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Mock Dashboard Content */}
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Panel - Match Info */}
                  <div className="lg:col-span-1">
                    <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
                      isDark 
                        ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600' 
                        : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'
                    }`}>
                      <div className="text-center">
                        <div className="relative mb-6">
                          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto flex items-center justify-center shadow-lg">
                            <Users className="w-10 h-10 text-white" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          </div>
                        </div>
                        <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>Live Battle</h3>
                        <p className={`mb-4 transition-colors duration-300 ${
                          isDark ? 'text-slate-300' : 'text-slate-600'
                        }`}>vs CryptoKing_99</p>
                        <div className={`rounded-xl p-4 shadow-lg transition-colors duration-300 ${
                          isDark ? 'bg-slate-600' : 'bg-white'
                        }`}>
                          <div className="flex justify-between items-center mb-3">
                            <span className={`text-sm transition-colors duration-300 ${
                              isDark ? 'text-slate-300' : 'text-slate-600'
                            }`}>Your Balance</span>
                            <span className="font-bold text-green-500 text-lg">$12,450</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-3 mb-2">
                            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full w-3/4 animate-pulse"></div>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className={`transition-colors duration-300 ${
                              isDark ? 'text-slate-400' : 'text-slate-500'
                            }`}>75% to double</span>
                            <span className="text-green-500 font-semibold">+$2,450</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Center Panel - Chart */}
                  <div className="lg:col-span-2">
                    <div className={`rounded-2xl p-6 transition-colors duration-300 ${
                      isDark ? 'bg-slate-700' : 'bg-slate-50'
                    }`}>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className={`text-xl font-bold transition-colors duration-300 ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}>AAPL - Apple Inc.</h3>
                          <p className={`text-sm transition-colors duration-300 ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
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
                          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-green-500" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Enhanced Chart */}
                      <div className={`h-64 rounded-xl p-4 border transition-colors duration-300 ${
                        isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'
                      }`}>
                        <div className="h-full flex items-end space-x-1">
                          {[...Array(30)].map((_, i) => (
                            <div
                              key={i}
                              className="bg-gradient-to-t from-blue-500 to-blue-300 rounded-sm flex-1 hover:from-blue-400 hover:to-blue-200 transition-all duration-300"
                              style={{ 
                                height: `${Math.random() * 70 + 30}%`,
                                animationDelay: `${i * 50}ms`
                              }}
                            ></div>
                          ))}
                        </div>
                        <div className="absolute top-4 right-4 flex space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        </div>
                      </div>

                      {/* Enhanced Trading Panel */}
                      <div className="mt-6 grid grid-cols-2 gap-4">
                        <button className="group bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25 flex items-center justify-center space-x-2">
                          <TrendingUp className="w-5 h-5" />
                          <span>Buy</span>
                        </button>
                        <button className="group bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/25 flex items-center justify-center space-x-2">
                          <TrendingUp className="w-5 h-5 rotate-180" />
                          <span>Sell</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="absolute -bottom-10 left-1/2 transform -translate-x-1/2"
          >
            <div className={`flex items-center space-x-8 px-8 py-4 rounded-2xl border backdrop-blur-sm transition-colors duration-300 ${
              isDark 
                ? 'bg-slate-800/80 border-slate-700' 
                : 'bg-white/80 border-slate-200'
            }`}>
              <div className="text-center">
                <div className={`text-2xl font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>$2.4M</div>
                <div className={`text-xs transition-colors duration-300 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>Traded Today</div>
              </div>
              <div className="w-px h-8 bg-slate-300"></div>
              <div className="text-center">
                <div className={`text-2xl font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>1,247</div>
                <div className={`text-xs transition-colors duration-300 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>Active Battles</div>
              </div>
              <div className="w-px h-8 bg-slate-300"></div>
              <div className="text-center">
                <div className={`text-2xl font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>98.7%</div>
                <div className={`text-xs transition-colors duration-300 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>Uptime</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`py-20 transition-colors duration-300 ${
        isDark ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Why Choose TradeBattle?
            </h2>
            <p className={`text-xl max-w-2xl mx-auto transition-colors duration-300 ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Experience the thrill of trading without the risk
        </p>
      </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={`text-center group p-8 rounded-2xl transition-all duration-300 hover:shadow-lg ${
                isDark 
                  ? 'bg-slate-700 hover:bg-slate-600' 
                  : 'bg-slate-50 hover:bg-white'
              }`}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className={`text-xl font-semibold mb-4 transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>Real Markets</h3>
              <p className={`transition-colors duration-300 ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Trade with real market data across stocks, crypto, and commodities. 
                No fake data, just real market conditions.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className={`text-center group p-8 rounded-2xl transition-all duration-300 hover:shadow-lg ${
                isDark 
                  ? 'bg-slate-700 hover:bg-slate-600' 
                  : 'bg-slate-50 hover:bg-white'
              }`}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className={`text-xl font-semibold mb-4 transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>Battle Mode</h3>
              <p className={`transition-colors duration-300 ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Compete in 1v1 matches where the first to double their balance wins. 
                Strategy meets competition.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={`text-center group p-8 rounded-2xl transition-all duration-300 hover:shadow-lg ${
                isDark 
                  ? 'bg-slate-700 hover:bg-slate-600' 
                  : 'bg-slate-50 hover:bg-white'
              }`}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className={`text-xl font-semibold mb-4 transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>Track Progress</h3>
              <p className={`transition-colors duration-300 ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Earn badges, climb leaderboards, and track your trading skills. 
                Turn trading into a game.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className={`py-20 transition-colors duration-300 ${
        isDark ? 'bg-slate-900' : 'bg-slate-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              How It Works
            </h2>
            <p className={`text-xl max-w-2xl mx-auto transition-colors duration-300 ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Get started in minutes and start competing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="relative mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto flex items-center justify-center text-white font-bold text-xl">
                  1
                </div>
                <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              </div>
              <h3 className={`text-xl font-semibold mb-4 transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>Sign Up Free</h3>
              <p className={`transition-colors duration-300 ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Create your account and get $10,000 in fake money to start trading
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="relative mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mx-auto flex items-center justify-center text-white font-bold text-xl">
                  2
                </div>
                <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-green-500 to-blue-500"></div>
              </div>
              <h3 className={`text-xl font-semibold mb-4 transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>Find a Match</h3>
              <p className={`transition-colors duration-300 ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Get matched with another trader for a 1v1 battle
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="relative mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto flex items-center justify-center text-white font-bold text-xl">
                  3
                </div>
                <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              </div>
              <h3 className={`text-xl font-semibold mb-4 transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>Trade & Compete</h3>
              <p className={`transition-colors duration-300 ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Use real market data to make trades and be the first to double your balance
              </p>
            </motion.div>

            {/* Step 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center"
            >
              <div className="relative mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mx-auto flex items-center justify-center text-white font-bold text-xl">
                  4
                </div>
              </div>
              <h3 className={`text-xl font-semibold mb-4 transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>Win & Climb</h3>
              <p className={`transition-colors duration-300 ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Earn badges, climb leaderboards, and prove your trading skills
              </p>
            </motion.div>
          </div>

          {/* Additional Info */}
          <div className="mt-16 text-center">
            <div className={`inline-flex items-center space-x-2 px-6 py-3 rounded-full transition-colors duration-300 ${
              isDark 
                ? 'bg-slate-800 text-slate-300' 
                : 'bg-white text-slate-600'
            }`}>
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-medium">No real money at risk • Real market data • Instant matches</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center text-white">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-blue-100">Active Traders</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-blue-100">Battles Fought</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="text-4xl font-bold mb-2">$2M+</div>
              <div className="text-blue-100">Fake Money Traded</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-blue-100">User Satisfaction</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-20 transition-colors duration-300 ${
        isDark ? 'bg-slate-800' : 'bg-slate-50'
      }`}>
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className={`text-4xl font-bold mb-6 transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Ready to Start Trading?
            </h2>
            <p className={`text-xl mb-8 transition-colors duration-300 ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Join thousands of traders competing in real-time battles. 
              No risk, maximum strategy.
            </p>
            <button className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
              Get Started Free
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Logo className="w-10 h-10" isDark={true} />
                <span className="text-xl font-bold">TradeBattle</span>
              </div>
              <p className="text-slate-400">
                The ultimate paper trading competition platform. Free to play, real market data.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 TradeBattle. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  )
}

export default App
