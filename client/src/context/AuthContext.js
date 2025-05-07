"use client"

import { createContext, useContext, useState, useEffect } from "react"
import api from "../utils/api"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on mount
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem("token")

        if (token) {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`
          const { data } = await api.get("/api/users/me")
          setUser(data)
        }
      } catch (error) {
        localStorage.removeItem("token")
        delete api.defaults.headers.common["Authorization"]
      }

      setLoading(false)
    }

    checkLoggedIn()
  }, [])

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/api/auth/login", { email, password })
      localStorage.setItem("token", data.token)
      api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`

      // Fetch user data
      const userResponse = await api.get("/api/users/me")
      setUser(userResponse.data)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      }
    }
  }

  const register = async (userData) => {
    try {
      const { data } = await api.post("/api/auth/register", userData)
      localStorage.setItem("token", data.token)
      api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`

      // Fetch user data
      const userResponse = await api.get("/api/users/me")
      setUser(userResponse.data)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      }
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    delete api.defaults.headers.common["Authorization"]
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}
