import React from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'

const LoadingSpinner = ({ size = 'default', message = 'Loading...' }) => {
  const { isDark } = useTheme()
  
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12'
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* LinkedIn-style spinner */}
      <div className="relative">
        <div className={`${sizeClasses[size]} border-4 border-slate-200 dark:border-slate-700 rounded-full animate-spin`}>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </div>
      
      {/* Loading message with fade animation */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`text-sm font-medium transition-colors duration-300 ${
          isDark ? 'text-slate-300' : 'text-slate-600'
        }`}
      >
        {message}
      </motion.p>
      
      {/* Progress dots */}
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-blue-600 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default LoadingSpinner