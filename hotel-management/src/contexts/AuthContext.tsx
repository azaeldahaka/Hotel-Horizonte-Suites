import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, nombre: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const useAuth = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificación inicial
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          await fetchUserProfile(session.user)
        } else {
          setLoading(false)
        }
      } catch (error) {
        setLoading(false)
      }
    }

    initSession()

    // Escuchar cambios
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (authUser: any) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (data && !error) {
        setUser(data)
      } else {
        // Fallback
        setUser({
          id: authUser.id,
          email: authUser.email,
          nombre: authUser.user_metadata?.nombre || 'Usuario',
          rol: 'usuario'
        })
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
  }

  // --- AQUÍ ESTABA EL ERROR, YA ESTÁ CORREGIDO ---
  const signUp = async (email: string, password: string, nombre: string) => {
    // 1. Crear en Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } }
    })
    if (error) throw error

    // 2. Crear en Tabla Usuarios (CORREGIDO: Sin usar .catch directo)
    if (data.user) {
      const { error: dbError } = await supabase.from('usuarios').insert([{
        id: data.user.id,
        email: email,
        nombre: nombre,
        rol: 'usuario'
      }])
      
      // Manejo de error manual en lugar de .catch()
      if (dbError) {
        console.log('Error creando perfil DB (posible duplicado o trigger):', dbError.message)
      }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}