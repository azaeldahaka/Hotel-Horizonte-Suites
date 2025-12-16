import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
// Si tienes problemas con el tipo Usuario, cámbialo por 'any' aquí abajo
import { Usuario } from '@/types' 

interface AuthContextType {
  user: Usuario | null
  token: string | null
  loading: boolean
  // Usamos los nombres estándar para que funcionen con tu Login.tsx y Navbar.tsx actuales
  signIn: (email: string, password: string) => Promise<void> 
  signUp: (email: string, password: string, nombre: string) => Promise<void>
  signOut: () => Promise<void> // Promesa para compatibilidad
  loginWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Cargar sesión existente (localStorage)
    const savedUser = localStorage.getItem('hotel_user')
    const savedToken = localStorage.getItem('hotel_token')
    
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser))
        setToken(savedToken)
      } catch (e) {
        console.error("Error parseando usuario local", e)
      }
    }
    setLoading(false)

    // 2. DETECTAR LOGIN DE GOOGLE (Tu lógica original "La Magia")
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Solo sincronizamos si no tenemos token propio o es diferente
        const currentToken = localStorage.getItem('hotel_token');
        
        // Evitamos bucles infinitos si ya estamos logueados
        if (currentToken === session.access_token) return;

        setLoading(true)
        try {
          // ¡Llamamos al PUENTE que creamos!
          const { data, error } = await supabase.functions.invoke('auth-google-sync', {
            body: { 
              email: session.user.email,
              nombre: session.user.user_metadata.full_name,
              google_token: session.access_token 
            }
          })

          if (error) throw error
          
          // Guardamos el usuario de NUESTRA tabla
          const appUser = data.user
          
          setUser(appUser)
          setToken(session.access_token)
          
          localStorage.setItem('hotel_user', JSON.stringify(appUser))
          localStorage.setItem('hotel_token', session.access_token)
          
        } catch (error) {
          console.error('Error sincronizando Google:', error)
          supabase.auth.signOut() // Si falla, lo sacamos
        } finally {
          setLoading(false)
        }
      } else if (event === 'SIGNED_OUT') {
          // Limpieza al salir
          setUser(null)
          setToken(null)
          localStorage.removeItem('hotel_user')
          localStorage.removeItem('hotel_token')
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  // --- TU LÓGICA ORIGINAL ---

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('auth-login', { body: { email, password } })
      if (error) throw error
      const responseData = data?.data || data
      
      setUser(responseData.user)
      setToken(responseData.token)
      localStorage.setItem('hotel_user', JSON.stringify(responseData.user))
      localStorage.setItem('hotel_token', responseData.token)
    } catch (error: any) {
      throw new Error(error.message || 'Error al iniciar sesión')
    }
  }

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin 
      }
    })
    if (error) throw error
  }

  const register = async (email: string, password: string, nombre: string) => {
     try {
      const { data, error } = await supabase.functions.invoke('auth-register', { body: { email, password, nombre } })
      if (error) throw error
      const responseData = data?.data || data

      setUser(responseData.user)
      setToken(responseData.token)
      localStorage.setItem('hotel_user', JSON.stringify(responseData.user))
      localStorage.setItem('hotel_token', responseData.token)
    } catch (error: any) {
      throw new Error(error.message || 'Error al registrarse')
    }
  }

  const logout = async () => {
    await supabase.auth.signOut() 
    setUser(null)
    setToken(null)
    localStorage.removeItem('hotel_user')
    localStorage.removeItem('hotel_token')
  }

  return (
    <AuthContext.Provider value={{ 
        user, 
        token, 
        loading, 
        // ALIAS PARA COMPATIBILIDAD (Conectamos tus funciones viejas con los nombres nuevos)
        signIn: login, 
        signUp: register, 
        signOut: logout, 
        loginWithGoogle 
    }}>
      {children}
    </AuthContext.Provider>
  )
}