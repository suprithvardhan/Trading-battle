import React from 'react'

const Logo = ({ className = "w-8 h-8", isDark = false }) => {
  return (
    <div className={`${className} relative`}>
      {/* Main logo container */}
      <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-xl flex items-center justify-center relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
        </div>
        
        {/* Chart bars representing trading */}
        <div className="flex items-end space-x-0.5 relative z-10">
          <div className="w-1 bg-white/90 rounded-sm" style={{ height: '40%' }}></div>
          <div className="w-1 bg-white/90 rounded-sm" style={{ height: '60%' }}></div>
          <div className="w-1 bg-white/90 rounded-sm" style={{ height: '80%' }}></div>
          <div className="w-1 bg-white/90 rounded-sm" style={{ height: '45%' }}></div>
          <div className="w-1 bg-white/90 rounded-sm" style={{ height: '70%' }}></div>
        </div>
        
        {/* Battle indicator - small sword/crossed elements */}
        <div className="absolute top-1 right-1 w-2 h-2">
          <div className="w-full h-0.5 bg-white/80 rounded-full transform rotate-45"></div>
          <div className="w-full h-0.5 bg-white/80 rounded-full transform -rotate-45 -mt-0.5"></div>
        </div>
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-sm"></div>
      </div>
    </div>
  )
}

export default Logo
