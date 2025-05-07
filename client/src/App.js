"use client"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"

// Pages
import Login from "./pages/Login"
import Register from "./pages/Register"
import CreatorDashboard from "./pages/CreatorDashboard"
import Feed from "./pages/Feed"
import PhotoDetail from "./pages/PhotoDetail"
import Profile from "./pages/Profile"
import NotFound from "./pages/NotFound"
import TrendingPage from "./pages/TrendingPage"

// Components
import Navbar from "./components/Navbar"

// Protected route components
const CreatorRoute = ({ children }) => {
  const { user } = useAuth()

  if (!user || user.role !== "creator") {
    return <Navigate to="/login" />
  }

  return children
}

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" />
  }

  return children
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Feed />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/trending"
                element={
                  <ProtectedRoute>
                    <TrendingPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/photo/:id"
                element={
                  <ProtectedRoute>
                    <PhotoDetail />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile/:id"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Creator-only routes */}
              <Route
                path="/dashboard"
                element={
                  <CreatorRoute>
                    <CreatorDashboard />
                  </CreatorRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
