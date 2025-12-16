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
    // 1. Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user)
      } else {
        setLoading(false)
      }
    })

    // 2. Escuchar cambios (Login, Logout, etc.) automáticamente
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Esta función busca los datos extra (rol, nombre) PERO no bloquea si falla
  const fetchUserProfile = async (authUser: any) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error || !data) {
        console.warn("No se pudo cargar perfil extendido, usando datos básicos.")
        // Fallback: Usamos los datos básicos de la cuenta para que puedas entrar igual
        setUser({
          id: authUser.id,
          email: authUser.email,
          nombre: authUser.user_metadata?.nombre || 'Usuario',
          rol: 'usuario' // Rol por defecto de seguridad
        })
      } else {
        setUser(data)
      }
    } catch (err) {
      console.error("Error crítico leyendo perfil:", err)
    } finally {
      setLoading(false)
    }
  }

  // --- SIGN IN (LOGIN) ---
  const signIn = async (email: string, password: string) => {
    // Solo hacemos el login. El "onAuthStateChange" de arriba se encargará de actualizar el usuario.
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  // --- SIGN UP (REGISTRO) ---
  const signUp = async (email: string, password: string, nombre: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } }
    })
    
    if (error) throw error

    // Intentamos crear el registro en la tabla pública
    if (data.user) {
        await supabase.from('usuarios').insert([{
            id: data.user.id,
            email: email,
            nombre: nombre,
            rol: 'usuario'
        }])
    }
  }

  // --- SIGN OUT (SALIR) ---
  const signOut = async () => {
    await supabase.auth.signOut()
    // No necesitamos setUser(null) aquí, el listener lo hará solo
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