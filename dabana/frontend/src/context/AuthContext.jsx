import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const stored = localStorage.getItem('dabana_auth')
    return stored ? JSON.parse(stored) : null
  })

  const login = useCallback((authData) => {
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
