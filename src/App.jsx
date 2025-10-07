import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import DashboardLayout from './pages/DashboardLayout'
import MatchPage from './pages/MatchPage'
import DemoMatch from './pages/DemoMatch'
import DemoChart from './pages/DemoChart'
import LandingPage from './pages/LandingPage'
import ProtectedRoute from './components/ProtectedRoute'

const MainApp = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      } />
      <Route path="/match/:id" element={
        <ProtectedRoute>
          <MatchPage />
        </ProtectedRoute>
      } />
      <Route path="/demomatch" element={<DemoMatch />} />
      <Route path="/demochart" element={<DemoChart />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

const App = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <MainApp />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  )
}

export default App