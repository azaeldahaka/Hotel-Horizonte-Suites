import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom' // <--- Importante: useNavigate
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react' // Asegúrate de tener ArrowRight importado

export const Login = () => {
  const { signIn, user, loading: authLoading } = useAuth() // <--- Traemos 'user' y 'loading'
  const navigate = useNavigate() // <--- Hook de navegación
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // --- MAGIA AQUÍ: REDIRECCIÓN AUTOMÁTICA ---
  // Si el usuario ya existe (porque se logueó recién o volvió de Google), lo mandamos al dashboard
  useEffect(() => {
    if (user && !authLoading) {
      if (user.rol === 'administrador') navigate('/admin/dashboard')
      else if (user.rol === 'operador') navigate('/operador/dashboard')
      else navigate('/usuario/dashboard') // <--- Aquí va el usuario normal
    }
  }, [user, authLoading, navigate])
  // -------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      // No hace falta navegar aquí manualmente, el useEffect de arriba lo hará solo cuando cambie 'user'
    } catch (error: any) {
      setError('Error al iniciar sesión. Verifica tus datos.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // Importante: Esto asegura que al volver de Google, intente ir al sitio correcto
            redirectTo: window.location.origin 
        }
      })
      if (error) throw error
    } catch (error) {
      console.error(error)
      setError('Error con Google')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-slate-800 mb-2">Bienvenido</h1>
          <p className="text-slate-500">Ingresa a tu cuenta para gestionar tus estancias</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                placeholder="tu@email.com"
                required
              />
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <div className="relative">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                required
              />
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-teal-200 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <>Ingresar <ArrowRight className="h-5 w-5"/></>}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-slate-500">O continúa con</span></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            type="button"
            className="mt-6 w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Google
          </button>
        </div>

        <p className="mt-8 text-center text-slate-600">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-teal-600 font-bold hover:underline">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}