import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom' // <--- Importante
import { useAuth } from '@/contexts/AuthContext' // <--- Importante: useAuth para detectar cambios
import { supabase } from '@/lib/supabase'
import { Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react'

export const Register = () => {
  // Traemos 'user' del contexto para vigilarlo
  const { signUp, user, loading: authLoading } = useAuth() 
  const navigate = useNavigate()
  
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // --- REDIRECCIÓN AUTOMÁTICA ---
  useEffect(() => {
    if (user && !authLoading) {
       // Si ya hay usuario (se acaba de registrar exitosamente), al dashboard
       navigate('/usuario/dashboard')
    }
  }, [user, authLoading, navigate])
  // ------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signUp(email, password, nombre)
      // La navegación la maneja el useEffect
    } catch (error: any) {
      setError(error.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  // ... (El resto del código de registro y Google Login es igual que en Login) ...
  // Por simplicidad, copia el return visual que ya tienes, 
  // pero asegúrate de mantener el 'useEffect' y el 'useAuth' arriba.

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-slate-800 mb-2">Crear Cuenta</h1>
          <p className="text-slate-500">Únete a Horizonte Suites</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
            <div className="relative">
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl outline-none focus:border-teal-500" placeholder="Juan Pérez" required />
              <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl outline-none focus:border-teal-500" placeholder="tu@email.com" required />
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <div className="relative">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl outline-none focus:border-teal-500" placeholder="••••••••" required />
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-teal-200 transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <>Registrarme <ArrowRight className="h-5 w-5"/></>}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-600">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-teal-600 font-bold hover:underline">Inicia Sesión</Link>
        </p>
      </div>
    </div>
  )
}