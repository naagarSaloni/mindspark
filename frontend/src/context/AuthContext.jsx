import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState('')

  // Load from localStorage safely
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedToken !== 'undefined') {
      setToken(storedToken)
    }

    if (storedUser && storedUser !== 'undefined') {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.log('Invalid user in localStorage, clearing it')
        localStorage.removeItem('user')
      }
    }
  }, [])

  const login = (authData) => {
    setToken(authData.access_token)
    setUser(authData.user)

    localStorage.setItem('token', authData.access_token)
    localStorage.setItem('user', JSON.stringify(authData.user))
  }

  const logout = () => {
    setUser(null)
    setToken('')

    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const value = useMemo(
    () => ({ user, token, login, logout }),
    [user, token]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}