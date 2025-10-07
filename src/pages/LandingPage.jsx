import React, { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { 
  Play, 
  ArrowRight, 
  BarChart3, 
  Shield, 
  Zap, 
  Award,
  TrendingUp,
  Users,
  Target,
  Star,
  CheckCircle,
  Globe,
  Lock,
  Activity,
  DollarSign,
  Trophy,
  Clock,
  Sparkles,
  ChevronDown,
  TrendingDown,
  Timer,
  LineChart,
  PieChart,
  ArrowUpRight,
  CheckCircle2,
  Quote,
  ExternalLink
} from 'lucide-react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../contexts/ThemeContext'

const LandingPage = () => {
  const { isDark } = useTheme()
  const [isHovered, setIsHovered] = useState(false)
  const [currentPrice, setCurrentPrice] = useState(43250.50)
  const [priceChange, setPriceChange] = useState(2.34)
  
  // Refs for smooth scrolling
  const featuresRef = useRef(null)
  const howItWorksRef = useRef(null)
  const pricingRef = useRef(null)
  const testimonialsRef = useRef(null)
  const statsRef = useRef(null)
  
  // Smooth scroll function
  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    })
  }
  
  // Animate price changes
  useEffect(() => {
    const interval = setInterval(() => {
      const change = (Math.random() - 0.5) * 100
      setCurrentPrice(prev => prev + change)
      setPriceChange(prev => prev + (Math.random() - 0.5) * 0.5)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const stats = [
    { label: 'Active Traders', value: '12,847', icon: Users, color: 'text-blue-500' },
    { label: 'Total Matches', value: '45,231', icon: Trophy, color: 'text-yellow-500' },
    { label: 'Avg. Win Rate', value: '68.4%', icon: Target, color: 'text-green-500' },
    { label: 'Live Sessions', value: '1,234', icon: Activity, color: 'text-purple-500' }
  ]

  const features = [
    {
      icon: BarChart3,
      title: 'Real-Time Trading',
      description: 'Live market data with professional-grade charts and indicators',
      color: 'text-blue-500'
    },
    {
      icon: Shield,
      title: 'Zero Risk',
      description: 'Paper trading with real market conditions - no real money at risk',
      color: 'text-green-500'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Sub-second order execution with institutional-grade infrastructure',
      color: 'text-yellow-500'
    },
    {
      icon: Trophy,
      title: 'Competitive',
      description: 'Battle against skilled traders and climb the leaderboards',
      color: 'text-purple-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full backdrop-blur-xl border-b border-slate-700/50 bg-slate-900/80 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Logo className="w-8 h-8" isDark={isDark} />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TradeBattle
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection(featuresRef)} 
                className="text-slate-300 hover:text-blue-400 transition-colors duration-300"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection(howItWorksRef)} 
                className="text-slate-300 hover:text-blue-400 transition-colors duration-300"
              >
                How it Works
              </button>
              <button 
                onClick={() => scrollToSection(pricingRef)} 
                className="text-slate-300 hover:text-blue-400 transition-colors duration-300"
              >
                Pricing
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <a 
                href="/login"
                className="text-slate-300 hover:text-white transition-colors duration-300"
              >
                Sign In
              </a>
              <a 
                href="/signup"
                className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-300 font-medium shadow-lg hover:shadow-blue-500/25"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-600/10 to-cyan-600/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative">
          {/* Social Proof Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center space-x-3 px-6 py-3 rounded-full border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm text-slate-300">
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full border-2 border-slate-700 shadow-lg"></div>
                ))}
              </div>
              <span className="text-sm font-medium">Join 12,847+ professional traders</span>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-sm font-bold">4.9/5</span>
              </div>
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight text-white">
              Master{' '}
              <span className="relative">
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Trading
                </span>
                <motion.div 
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </span>
              <br />
              <span className="text-5xl md:text-7xl text-slate-200">Through Competition</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto leading-relaxed text-slate-300">
              Experience institutional-grade trading with{' '}
              <span className="font-semibold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                real-time market data
              </span>
              . Battle against skilled traders, climb leaderboards, and master the markets.
            </p>
          </motion.div>

          {/* Live Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="p-4 rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm transition-all duration-300 hover:bg-slate-800/70"
              >
                <div className="flex items-center space-x-3">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <div>
                    <div className="text-lg font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-slate-400">{stat.label}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <a 
              href="/signup"
              className="group relative bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-blue-500/25 flex items-center space-x-3"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <Play className="w-5 h-5" />
              <span>Start Trading Free</span>
              <ArrowRight className={`w-5 h-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
            </a>
            
            <a 
              href="/demomatch"
              className="group px-8 py-4 rounded-xl text-lg font-semibold border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm text-white hover:bg-slate-800/70 hover:border-slate-600/50 transition-all duration-300 hover:shadow-lg flex items-center space-x-3"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Watch Demo</span>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            </a>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap justify-center items-center gap-8 text-sm mb-16"
          >
            <div className="flex items-center space-x-2 text-slate-400">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Bank-level security</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-400">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>Real-time data</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-400">
              <Award className="w-4 h-4 text-blue-500" />
              <span>Free forever</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-400">
              <Globe className="w-4 h-4 text-cyan-500" />
              <span>Global markets</span>
            </div>
          </motion.div>

          {/* Live Trading Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="relative max-w-7xl mx-auto"
          >
            <div className="relative rounded-3xl shadow-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
              {/* Mock Trading Interface Header */}
              <div className="px-8 py-6 border-b border-slate-700/50 bg-slate-700/50 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse delay-300"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse delay-700"></div>
                  </div>
                  <div className="text-sm font-medium text-white">Live Trading Session</div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-slate-300">BTC/USDT</div>
                    <div className="text-lg font-bold text-white">${currentPrice.toLocaleString()}</div>
                    <div className={`text-sm font-medium ${
                      priceChange >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Mock Trading Interface Content */}
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Panel - Match Info */}
                  <div className="lg:col-span-1">
                    <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
                      isDark 
                        ? 'bg-gray-700/50 border-gray-600/50' 
                        : 'bg-gray-50/50 border-gray-200/50'
                    }`}>
                      <div className="text-center mb-6">
                        <div className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>Battle #1247</div>
                        <div className={`text-sm transition-colors duration-300 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>5:00 remaining</div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">A</div>
                            <span className={`text-sm font-medium transition-colors duration-300 ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>Trader A</span>
                          </div>
                          <div className={`text-sm font-bold transition-colors duration-300 ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>$12,450</div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">B</div>
                            <span className={`text-sm font-medium transition-colors duration-300 ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>Trader B</span>
                          </div>
                          <div className={`text-sm font-bold transition-colors duration-300 ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>$11,890</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Center Panel - Chart */}
                  <div className="lg:col-span-2">
                    <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
                      isDark 
                        ? 'bg-gray-700/50 border-gray-600/50' 
                        : 'bg-gray-50/50 border-gray-200/50'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`text-lg font-bold transition-colors duration-300 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>BTC/USDT</div>
                        <div className="flex space-x-2">
                          {['1m', '5m', '15m', '1h'].map((timeframe) => (
                            <button
                              key={timeframe}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-300 ${
                                timeframe === '5m'
                                  ? 'bg-blue-500 text-white'
                                  : isDark
                                    ? 'text-gray-400 hover:text-white'
                                    : 'text-gray-500 hover:text-gray-900'
                              }`}
                            >
                              {timeframe}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Mock Chart */}
                      <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl flex items-center justify-center">
                        <div className="text-center">
                          <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <div className={`text-sm transition-colors duration-300 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>Live Trading Chart</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Professional Trading
              <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Made Simple
              </span>
            </h2>
            <p className="text-xl max-w-3xl mx-auto text-slate-300">
              Everything you need to master trading, from real-time data to competitive battles
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="p-6 rounded-2xl border border-slate-700/50 bg-slate-800/50 hover:bg-slate-800/70 hover:border-slate-600/50 transition-all duration-300 hover:shadow-lg"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.color} bg-opacity-10`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-sm text-slate-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section ref={howItWorksRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              How It Works
              <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Simple Steps to Success
              </span>
            </h2>
            <p className="text-xl max-w-3xl mx-auto text-slate-300">
              Get started in minutes and begin your trading journey
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Sign Up & Create Account",
                description: "Join thousands of traders in seconds with our simple registration process",
                icon: Users,
                color: "text-blue-500"
              },
              {
                step: "02", 
                title: "Find Your Match",
                description: "Get matched with skilled traders based on your skill level and preferences",
                icon: Target,
                color: "text-cyan-500"
              },
              {
                step: "03",
                title: "Start Trading",
                description: "Battle in real-time with live market data and professional tools",
                icon: TrendingUp,
                color: "text-emerald-500"
              }
            ].map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600 flex items-center justify-center">
                    <step.icon className={`w-8 h-8 ${step.color}`} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{step.title}</h3>
                <p className="text-slate-300">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Trusted by Traders
              <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Worldwide
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "50K+", label: "Active Traders", icon: Users, color: "text-blue-500" },
              { number: "1M+", label: "Trades Executed", icon: BarChart3, color: "text-cyan-500" },
              { number: "99.9%", label: "Uptime", icon: Shield, color: "text-emerald-500" },
              { number: "150+", label: "Countries", icon: Globe, color: "text-purple-500" }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center p-6 rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300"
              >
                <stat.icon className={`w-12 h-12 mx-auto mb-4 ${stat.color}`} />
                <div className="text-3xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-slate-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section ref={testimonialsRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              What Traders Say
              <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                About TradeBattle
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Chen",
                role: "Professional Trader",
                avatar: "SC",
                content: "TradeBattle transformed my trading skills. The real-time competition and live market data made me a better trader in just weeks.",
                rating: 5
              },
              {
                name: "Marcus Rodriguez", 
                role: "Day Trader",
                avatar: "MR",
                content: "The platform is incredible. I've improved my win rate from 45% to 78% since joining. The community is amazing too.",
                rating: 5
              },
              {
                name: "Alex Thompson",
                role: "Crypto Enthusiast", 
                avatar: "AT",
                content: "Best trading platform I've used. The interface is clean, fast, and the educational aspect through competition is brilliant.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="p-6 rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-blue-500 mb-4" />
                <p className="text-slate-300 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-slate-400">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Simple Pricing
              <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Free Forever
              </span>
            </h2>
            <p className="text-xl max-w-3xl mx-auto text-slate-300">
              No hidden fees, no subscriptions. Start trading today.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative p-8 rounded-3xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm"
            >
              <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-2 rounded-bl-2xl rounded-tr-2xl text-sm font-semibold">
                Most Popular
              </div>
              
              <div className="text-center mb-8">
                <div className="text-6xl font-bold text-white mb-2">Free</div>
                <div className="text-slate-400">Forever</div>
              </div>

              <div className="space-y-6 mb-8">
                {[
                  "Unlimited trading battles",
                  "Real-time market data",
                  "Professional charting tools", 
                  "Community leaderboards",
                  "Educational resources",
                  "Mobile & desktop access",
                  "24/7 customer support"
                ].map((feature, index) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-slate-300">{feature}</span>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-center"
              >
                <a 
                  href="/signup"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-blue-500/25"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5" />
                </a>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to Start Trading?
              <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Join the Battle Today
              </span>
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Join thousands of traders competing in real-time battles with live market data.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href="/signup"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-blue-500/25"
              >
                <Play className="w-5 h-5" />
                <span>Start Trading Free</span>
              </a>
              
              <a 
                href="/demomatch"
                className="inline-flex items-center space-x-2 border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300"
              >
                <ExternalLink className="w-5 h-5" />
                <span>Watch Demo</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-700/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Logo className="w-8 h-8" isDark={true} />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  TradeBattle
                </span>
              </div>
              <p className="text-slate-400 mb-4">
                Professional trading competition platform with real-time market data.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-700/50 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 TradeBattle. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
