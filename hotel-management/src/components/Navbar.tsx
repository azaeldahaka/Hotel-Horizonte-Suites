import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react'

export const Navbar = () => {
  const { user, signOut } = useAuth() // <--- USAMOS signOut, NO logout
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut() // <--- CORRECCIÓN AQUÍ
      navigate('/login')
    } catch (error) {
      console.error('Error al salir', error)
    }
  }

  const getDashboardLink = () => {
    if (!user) return '/login'
    if (user.rol === 'administrador') return '/admin/dashboard'
    if (user.rol === 'operador') return '/operador/dashboard'
    return '/usuario/dashboard'
  }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-serif font-bold text-xl">
                H
              </div>
              <span className="font-serif font-bold text-xl text-slate-800 hidden sm:block">
                Horizonte Suites
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-slate-600 hover:text-teal-600 font-medium transition-colors">Inicio</Link>
            <Link to="/nosotros" className="text-slate-600 hover:text-teal-600 font-medium transition-colors">Nosotros</Link>
            
            {user ? (
              <div className="flex items-center gap-4 ml-4">
                <Link 
                  to={getDashboardLink()}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4"/>
                  Panel
                </Link>
                <div className="relative group">
                    <button className="flex items-center gap-2 text-slate-700 font-medium hover:text-teal-600">
                        <User className="h-5 w-5"/>
                        <span>{user.nombre?.split(' ')[0]}</span>
                    </button>
                    {/* Dropdown simple */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 hidden group-hover:block p-2">
                        <Link to="/mi-perfil" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">Mi Perfil</Link>
                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2">
                            <LogOut className="h-4 w-4"/> Cerrar Sesión
                        </button>
                    </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-4">
                <Link to="/login" className="px-4 py-2 text-slate-700 font-medium hover:text-teal-600 transition-colors">
                  Ingresar
                </Link>
                <Link to="/register" className="px-4 py-2 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition-colors shadow-sm shadow-teal-200">
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 hover:text-slate-900 p-2">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 pb-4 px-4 animate-in slide-in-from-top-5">
          <div className="flex flex-col space-y-2 pt-4">
            <Link to="/" onClick={()=>setIsOpen(false)} className="py-2 text-slate-600 font-medium border-b border-slate-50">Inicio</Link>
            <Link to="/nosotros" onClick={()=>setIsOpen(false)} className="py-2 text-slate-600 font-medium border-b border-slate-50">Nosotros</Link>
            
            {user ? (
              <>
                <Link to={getDashboardLink()} onClick={()=>setIsOpen(false)} className="py-2 text-teal-600 font-bold flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4"/> Ir al Panel
                </Link>
                <Link to="/mi-perfil" onClick={()=>setIsOpen(false)} className="py-2 text-slate-600 font-medium">Mi Perfil</Link>
                <button onClick={() => { handleLogout(); setIsOpen(false); }} className="py-2 text-red-600 font-medium text-left flex items-center gap-2">
                  <LogOut className="h-4 w-4"/> Cerrar Sesión
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Link to="/login" onClick={()=>setIsOpen(false)} className="py-3 text-center rounded-xl bg-slate-100 text-slate-700 font-bold">Ingresar</Link>
                <Link to="/register" onClick={()=>setIsOpen(false)} className="py-3 text-center rounded-xl bg-teal-600 text-white font-bold">Registrarse</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}