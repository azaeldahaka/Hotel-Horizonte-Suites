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
    // 1. Verificar sesión inicial
    checkUser()

    // 2. Escuchar cambios (Login, Logout, Auto-refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth Event:", event); // DEBUG
      
      if (session?.user) {
        // Si hay sesión de Supabase, buscamos los datos del perfil
        await fetchUserProfile(session.user)
      } else {
        // Si no hay sesión (Logout), limpiamos
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
        await fetchUserProfile(session.user)
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error("Error checking session:", error)
      setLoading(false)
    }
  }

  const fetchUserProfile = async (authUser: any) => {
    try {
      // Intentamos obtener el rol y nombre desde la tabla 'usuarios'
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) {
        console.warn("⚠️ Usuario autenticado pero no encontrado en tabla pública:", error.message)
        // FALLBACK CRÍTICO: Si falla la BDD, igual dejamos entrar al usuario con datos básicos
        // Esto evita que te quedes fuera si la tabla 'usuarios' tiene problemas
        setUser({
          id: authUser.id,
          email: authUser.email,
          nombre: authUser.user_metadata?.nombre || 'Usuario', // Intentamos sacar nombre de metadata
          rol: 'usuario' // Rol por defecto si no se encuentra
        })
      } else {
        // Todo correcto, usamos los datos de la base de datos
        setUser(data)
      }
    } catch (err) {
      console.error("Error fetching profile:", err)
    } finally {
      setLoading(false)
    }
  }

  // --- LOGIN ---
  const signIn = async (email: string, password: string) => {
    // Usamos el login estándar de Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
        console.error("Login Error:", error.message)
        throw error
    }
    
    // Si el login es exitoso, forzamos la carga del perfil inmediatamente
    if (data.user) {
        await fetchUserProfile(data.user)
    }
  }

  // --- REGISTRO ---
  const signUp = async (email: string, password: string, nombre: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre } // Guardamos nombre en metadata de Supabase Auth
      }
    })
    
    if (error) throw error

    // Intentamos crear el registro en la tabla pública manualmente
    // (Por si el Trigger de la base de datos falla o no existe)
    if (data.user) {
        const { error: dbError } = await supabase.from('usuarios').insert([{
            id: data.user.id,
            email: email,
            nombre: nombre,
            rol: 'usuario'
        }])
        
        if (dbError) console.log("Nota: El usuario quizás ya fue creado por un Trigger DB", dbError.message)
        
        // Auto-login (Cargar perfil)
        await fetchUserProfile(data.user)
    }
  }

  // --- LOGOUT ---
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