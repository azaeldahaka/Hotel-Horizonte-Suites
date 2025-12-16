import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// 1. Definimos qué forma tiene nuestro contexto (incluyendo las funciones que faltaban)
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
    // Verificar sesión actual al cargar
    checkUser()

    // Escuchar cambios (login, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email)
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  // Busca los datos extra (rol, nombre) en la tabla 'usuarios'
  const fetchUserProfile = async (userId: string, email: string | undefined) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !data) {
        // Si el usuario existe en Auth pero no en la tabla pública (raro, pero posible)
        console.warn("Usuario no encontrado en tabla publica, usando datos básicos")
        setUser({ id: userId, email: email, rol: 'usuario', nombre: 'Usuario' }) // Fallback
      } else {
        setUser(data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // --- FUNCIÓN SIGN IN (LOGIN) ---
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  // --- FUNCIÓN SIGN UP (REGISTRO) ---
  const signUp = async (email: string, password: string, nombre: string) => {
    // 1. Crear usuario en Auth de Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre } // Guardamos el nombre en la metadata por si acaso
      }
    })
    if (error) throw error

    // 2. Insertar en nuestra tabla pública 'usuarios'
    // (Esto es necesario si no tienes un Trigger automático en la base de datos)
    if (data.user) {
      const { error: dbError } = await supabase.from('usuarios').insert([
        {
          id: data.user.id,
          email: email,
          nombre: nombre,
          rol: 'usuario' // Rol por defecto
        }
      ])
      
      // Si falla la inserción en DB pública, es crítico (pero si ya tienes un Trigger, esto dará error de duplicado que podemos ignorar)
      if (dbError && !dbError.message.includes('duplicate')) {
         console.error("Error creando perfil público:", dbError)
      }
    }
  }

  // --- FUNCIÓN SIGN OUT (SALIR) ---
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const value = {
    user,
    loading,
    signIn, // <--- Ahora sí las exportamos
    signUp, // <--- Ahora sí las exportamos
    signOut // <--- Ahora sí las exportamos
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}