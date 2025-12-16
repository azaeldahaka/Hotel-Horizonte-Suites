import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer' 
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { UsuarioDashboard } from './pages/usuario/UsuarioDashboard'
import { CrearReserva } from './pages/usuario/CrearReserva'
import { Consultas } from './pages/usuario/Consultas'
import { OperadorDashboard } from './pages/operador/OperadorDashboard'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { MiPerfil } from './pages/MiPerfil'
import { Nosotros } from './pages/Nosotros'
// CORRECCIÓN: Importación sin llaves porque es un export default
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* --- AQUÍ ESTÁ LA MAGIA: Esto resetea el scroll al navegar --- */}
        <ScrollToTop />

        <div className="min-h-screen bg-slate-50 flex flex-col">
          {/* La Navbar siempre visible arriba */}
          <Navbar />
          
          {/* El contenido principal crece para empujar el footer */}
          <div className="flex-grow">
            <Routes>
              {/* --- RUTAS PÚBLICAS --- */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/nosotros" element={<Nosotros />} />
              
              {/* --- RUTAS PROTEGIDAS --- */}
              
              {/* Rutas de Usuario */}
              <Route path="/usuario/dashboard" element={
                <ProtectedRoute roles={['usuario']}>
                  <UsuarioDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/usuario/reservar/:id" element={
                <ProtectedRoute roles={['usuario']}>
                  <CrearReserva />
                </ProtectedRoute>
              } />
              
              <Route path="/usuario/consultas" element={
                <ProtectedRoute roles={['usuario']}>
                  <Consultas />
                </ProtectedRoute>
              } />
              
              {/* Rutas de Operador */}
              <Route path="/operador/dashboard" element={
                <ProtectedRoute roles={['operador']}>
                  <OperadorDashboard />
                </ProtectedRoute>
              } />
              
              {/* Rutas de Administrador */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute roles={['administrador']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              {/* Ruta de Perfil (Para todos) */}
              <Route path="/mi-perfil" element={
                <ProtectedRoute roles={['usuario', 'operador', 'administrador']}>
                  <MiPerfil />
                </ProtectedRoute>
              } />
              
              {/* --- RUTA POR DEFECTO --- */}
              <Route path="*" element={<Navigate to="/" replace />} />
              
            </Routes>
          </div>

          {/* Footer siempre abajo */}
          <Footer /> 
          
        </div>
      </Router>
    </AuthProvider>
  )
}

// Componente de seguridad (Sin cambios)
const ProtectedRoute = ({ 
  children, 
  roles 
}: { 
  children: React.ReactNode
  roles: string[] 
}) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!roles.includes(user.rol)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default App