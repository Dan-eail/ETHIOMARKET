import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeRole, setActiveRole] = useState(null) // null for unauthenticated guests

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('ethiomarket_token')
      if (token) {
        try {
          const res = await api.getMe()
          setUser(res.user)
          // Set active role based on user roles
          const primaryRole = res.user.roles.find(r => r.isPrimary)?.role || res.user.roles[0]?.role || 'BUYER'
          setActiveRole(primaryRole)
        } catch (err) {
          console.warn('Session expired or invalid token:', err.message)
          localStorage.removeItem('ethiomarket_token')
          setUser(null)
          setActiveRole(null)
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (credentials) => {
    const res = await api.login(credentials)
    localStorage.setItem('ethiomarket_token', res.token)
    setUser(res.user)
    const primary = res.user.roles.find(r => r.isPrimary)?.role || res.user.roles[0]?.role || 'BUYER'
    setActiveRole(primary)
    return res.user
  }

  const register = async (payload) => {
    const res = await api.register(payload)
    localStorage.setItem('ethiomarket_token', res.token)
    setUser(res.user)
    const primary = res.user.roles.find(r => r.isPrimary)?.role || res.user.roles[0]?.role || 'BUYER'
    setActiveRole(primary)
    return res.user
  }

  const demoSwitch = async (role) => {
    setLoading(true)
    try {
      const res = await api.demoLogin(role)
      localStorage.setItem('ethiomarket_token', res.token)
      setUser(res.user)
      setActiveRole(role)
      return res.user
    } catch (err) {
      console.error('Demo switch failed:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('ethiomarket_token')
    setUser(null)
    setActiveRole(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        activeRole,
        setActiveRole,