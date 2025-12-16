import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Save, Lock, Trash2, AlertCircle, CheckCircle, X, RefreshCw, User as UserIcon, Mail, Shield } from 'lucide-react'

// --- MODAL PARA CAMBIAR CONTRASEÑA ---
const ModalCambiarPassword = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Usamos la API nativa de Supabase (más segura y fácil)
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) throw error;
      
      onSuccess();

    } catch (err: any) {
      setError(err.message || 'Error al actualizar contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Cambiar Contraseña</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex gap-2 items-start">
            <AlertCircle className="h-5 w-5 flex-shrink-0"/> {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nueva Contraseña</label>
            <input 
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Nueva Contraseña</label>
            <input 
              type="password"
              placeholder="Repite la contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} disabled={loading} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium disabled:opacity-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium disabled:opacity-50 flex justify-center items-center gap-2 transition-colors">
              {loading ? <RefreshCw className="animate-spin h-5 w-5" /> : 'Actualizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- MODAL PARA BORRAR CUENTA ---
const ModalBorrarCuenta = ({ user_id, onClose, onSuccess }: { user_id: string, onClose: () => void, onSuccess: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('¿ESTÁS SEGURO? Perderás todas tus reservas y datos.')) return;
    
    setLoading(true);
    try {
      // 1. Intentamos llamar a la Edge Function (si existe)
      const { error: funcError } = await supabase.functions.invoke('delete-account', {
        body: { user_id }
      });
      
      if (funcError) {
         // Si no hay Edge Function configurada, lanzamos error manual para que contacte a soporte
         // (Ya que el cliente no puede borrarse a sí mismo de auth.users por seguridad)
         throw new Error("No se pudo procesar la solicitud automáticamente. Por favor contacta a soporte.");
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border-t-4 border-red-600">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Eliminar Cuenta</h2>
            <p className="text-sm text-slate-500 mt-1">Esta acción es irreversible.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-6 w-6" /></button>
        </div>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
        
        <p className="text-slate-700 mb-6 text-sm">
           Lamentamos que te vayas. Al confirmar, tu sesión se cerrará y tus datos serán eliminados permanentemente.
        </p>

        <div className="flex gap-3">
            <button onClick={onClose} disabled={loading} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium">Cancelar</button>
            <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex justify-center items-center gap-2">
                {loading ? <RefreshCw className="animate-spin h-4 w-4"/> : 'Confirmar Eliminación'}
            </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export const MiPerfil = () => {
  const { user, signOut } = useAuth() // CORREGIDO: 'signOut' en lugar de 'logout'
  const navigate = useNavigate()
  
  if (!user) return null

  const [nombre, setNombre] = useState(user.nombre || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleGuardarNombre = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('');

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ nombre: nombre })
        .eq('id', user.id);

      if (error) throw error

      // Actualizamos localStorage manual para reflejar el cambio inmediato (opcional)
      const updatedUser = { ...user, nombre };
      // Ojo: Esto depende de cómo manejes el auth state, pero visualmente ayuda
      
      setSuccess('¡Nombre actualizado con éxito!');
      // Recargar página para asegurar consistencia
      setTimeout(() => window.location.reload(), 1500);

    } catch (err: any) {
      setError(err.message || 'Error al actualizar.');
    } finally {
      setLoading(false);
    }
  }

  const onPasswordSuccess = () => {
    setShowPasswordModal(false);
    setSuccess('Contraseña actualizada. Por seguridad, inicia sesión nuevamente.');
    setTimeout(async () => {
      await signOut();
      navigate('/login');
    }, 2500);
  }

  const onDeleteSuccess = async () => {
    setShowDeleteModal(false);
    await signOut();
    navigate('/');
  }

  return (
    <>
      {showPasswordModal && <ModalCambiarPassword onClose={() => setShowPasswordModal(false)} onSuccess={onPasswordSuccess} />}
      {showDeleteModal && <ModalBorrarCuenta user_id={user.id} onClose={() => setShowDeleteModal(false)} onSuccess={onDeleteSuccess} />}

      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="bg-teal-600 h-32 relative">
                <div className="absolute -bottom-10 left-8">
                    <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
                        <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                            <UserIcon className="h-10 w-10"/>
                        </div>
                    </div>
                </div>
            </div>
            <div className="pt-12 pb-6 px-8">
                <h1 className="text-2xl font-bold text-slate-900">{user.nombre}</h1>
                <p className="text-slate-500">{user.email}</p>
                <div className="mt-4 flex gap-2">
                    <span className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-bold uppercase rounded-full border border-teal-100">
                        {user.rol}
                    </span>
                </div>
            </div>
          </div>

          {/* Feedback Messages */}
          {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700"><AlertCircle className="h-5 w-5"/>{error}</div>}
          {success && <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700"><CheckCircle className="h-5 w-5"/>{success}</div>}

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Columna Izquierda: Formulario Datos */}
            <div className="md:col-span-2 space-y-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><UserIcon className="h-5 w-5 text-teal-600"/> Información Personal</h2>
                    <form onSubmit={handleGuardarNombre} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
                            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-teal-500 outline-none" required />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed">
                                    <Mail className="h-4 w-4"/> {user.email}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rol</label>
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed capitalize">
                                    <Shield className="h-4 w-4"/> {user.rol}
                                </div>
                            </div>
                        </div>
                        <div className="pt-2 flex justify-end">
                            <button type="submit" disabled={loading || nombre === user.nombre} className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                {loading ? <RefreshCw className="animate-spin h-4 w-4"/> : <Save className="h-4 w-4"/>}
                                Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Columna Derecha: Seguridad */}
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><Lock className="h-5 w-5 text-teal-600"/> Seguridad</h2>
                    <div className="space-y-3">
                        <button onClick={() => setShowPasswordModal(true)} className="w-full px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium flex items-center gap-3 transition-colors text-sm">
                            <Lock className="h-4 w-4 text-slate-400" />
                            Cambiar Contraseña
                        </button>
                        <button onClick={() => setShowDeleteModal(true)} className="w-full px-4 py-3 bg-red-50 border border-red-100 hover:bg-red-100 text-red-700 rounded-lg font-medium flex items-center gap-3 transition-colors text-sm">
                            <Trash2 className="h-4 w-4" />
                            Eliminar Cuenta
                        </button>
                    </div>
                </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}