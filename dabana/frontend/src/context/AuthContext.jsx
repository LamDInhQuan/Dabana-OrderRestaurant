import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const stored = localStorage.getItem('dabana_auth')
    if (!stored || stored === 'undefined' || stored === 'null') return null
    try {
      return JSON.parse(stored)
    } catch {
      localStorage.removeItem('dabana_auth')
      return null
    }
  })

  const login = useCallback((authData) => {
    if (!authData) {
      console.error('login() được gọi với authData rỗng, bỏ qua việc lưu localStorage')
      return
    }
    localStorage.setItem('dabana_auth', JSON.stringify(authData))
    setAuth(authData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('dabana_auth')
    setAuth(null)
  }, [])

  const isRole = (role) => auth?.role === role

  return (
    <AuthContext.Provider value={{ auth, login, logout, isRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
