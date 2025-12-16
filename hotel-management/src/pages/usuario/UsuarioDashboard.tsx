import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Habitacion, Servicio, Reserva } from '@/types'
import { Calendar, Users, Clock, CheckCircle, XCircle, Mail, Edit, AlertCircle, Send, RefreshCw, Info, X, Filter, ChevronDown, ChevronUp, Trash2, CreditCard } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { logActividad } from '@/utils/loggers'

export const UsuarioDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // Datos
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [consultas, setConsultas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroCapacidad, setFiltroCapacidad] = useState('')
  const [filtroPrecioMax, setFiltroPrecioMax] = useState('')
  const [habitacionesFiltradas, setHabitacionesFiltradas] = useState<Habitacion[]>([])

  // Estados UI
  const [expandirActivas, setExpandirActivas] = useState(true)

  // Modales
  const [showModalReserva, setShowModalReserva] = useState(false)
  const [reservaAEditar, setReservaAEditar] = useState<Reserva | null>(null)
  const [showModalServicio, setShowModalServicio] = useState(false)
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(null)

  useEffect(() => {
    if (user) {
      cargarDatos()
    }
  }, [user])

  // Lógica de filtrado en tiempo real
  useEffect(() => {
    let resultado = habitaciones.filter(h => h.estado === 'disponible');

    if (filtroTipo) {
      resultado = resultado.filter(h => h.tipo === filtroTipo);
    }
    if (filtroCapacidad) {
      resultado = resultado.filter(h => h.capacidad >= parseInt(filtroCapacidad));
    }
    if (filtroPrecioMax) {
      resultado = resultado.filter(h => h.precio_noche <= parseFloat(filtroPrecioMax));
    }

    setHabitacionesFiltradas(resultado);
  }, [habitaciones, filtroTipo, filtroCapacidad, filtroPrecioMax]);

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const habPromise = supabase.from('habitaciones').select('*').order('numero')
      const servPromise = supabase.from('servicios').select('*').eq('disponible', true)
      const resPromise = supabase.from('reservas').select('*').eq('usuario_id', user?.id).order('fecha_reserva', { ascending: false })
      const consPromise = supabase.from('consultas').select('*').eq('usuario_id', user?.id)

      const [habData, servData, resData, consData] = await Promise.all([
        habPromise, servPromise, resPromise, consPromise
      ])

      setHabitaciones(habData.data || [])
      setServicios(servData.data || [])
      setReservas(resData.data || [])
      setConsultas(consData.data || [])

    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAbrirSolicitud = (reserva: Reserva) => {
    setReservaAEditar(reserva)
    setShowModalReserva(true)
  }
  
  const handleSolicitudEnviada = () => {
    setShowModalReserva(false)
    cargarDatos()
  }

  const handleCancelarReserva = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres cancelar esta reserva? Esta acción no se puede deshacer.")) return;

    try {
      const { error } = await supabase.from('reservas').update({ estado: 'cancelada' }).eq('id', id);
      if (error) throw error;

      await logActividad(user?.id, 'Cancelación Usuario', `El usuario canceló su reserva #${id.slice(0,4)}`, 'warning');
      
      alert("Reserva cancelada correctamente.");
      cargarDatos();
    } catch (e: any) {
      alert("Error al cancelar: " + e.message);
    }
  }

  const handleVerServicio = (servicio: Servicio) => {
    setServicioSeleccionado(servicio)
    setShowModalServicio(true)
  }

  const limpiarFiltros = () => {
    setFiltroTipo('')
    setFiltroCapacidad('')
    setFiltroPrecioMax('')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando tu experiencia...</p>
        </div>
      </div>
    )
  }

  const tiposDisponibles = [...new Set(habitaciones.map(h => h.tipo))];
  const consultasPendientesCount = consultas.filter(c => c.estado === 'pendiente').length;
  
  const reservasActivas = reservas.filter(r => r.estado === 'activa');
  const historialReservas = reservas.filter(r => r.estado !== 'activa');

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900 mb-1">
              Hola, {user?.nombre.split(' ')[0]}
            </h1>
            <p className="text-slate-600">Bienvenido a tu panel de control.</p>
          </div>
          <div className="flex gap-3">
            <button
                onClick={() => navigate('/usuario/consultas')}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-teal-200 hover:text-teal-700 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-all"
            >
                <Mail className="h-5 w-5" />
                <span className="hidden sm:inline">Mensajes</span>
                {consultasPendientesCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold animate-pulse">
                    {consultasPendientesCount}
                </span>
                )}
            </button>
            {/* Botón de Logout eliminado como pediste */}
          </div>
        </header>

        {/* SECCIÓN RESERVAS ACTIVAS (ACORDEÓN) */}
        <section className="mb-12">
          <div 
            onClick={() => setExpandirActivas(!expandirActivas)}
            className="flex justify-between items-center bg-teal-600 text-white p-4 rounded-t-xl cursor-pointer hover:bg-teal-700 transition-colors shadow-lg select-none"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full"><Calendar className="h-5 w-5" /></div>
              <div>
                <h2 className="font-bold text-lg">Reservas Activas</h2>
                <p className="text-xs text-teal-100 opacity-90">
                  {reservasActivas.length === 0 ? 'No tienes reservas próximas' : `Tienes ${reservasActivas.length} reserva(s) en curso`}
                </p>
              </div>
            </div>
            {expandirActivas ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
          </div>

          {expandirActivas && (
            <div className="bg-white border-x border-b border-slate-200 rounded-b-xl p-4 sm:p-6 shadow-sm animate-in slide-in-from-top-2 duration-300">
              {reservasActivas.length > 0 ? (
                <div className="space-y-6">
                  {reservasActivas.map((reserva) => (
                    <ReservaCard 
                      key={reserva.id} 
                      reserva={reserva} 
                      habitaciones={habitaciones}
                      consultas={consultas}
                      onSolicitarCambio={() => handleAbrirSolicitud(reserva)}
                      onCancelar={() => handleCancelarReserva(reserva.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <p>No hay reservas activas en este momento.</p>
                  <button onClick={() => {
                      const el = document.getElementById('reservar');
                      el?.scrollIntoView({ behavior: 'smooth' });
                  }} className="mt-4 text-teal-600 font-bold hover:underline">
                    ¡Haz una reserva ahora!
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* SECCIÓN HISTORIAL */}
        {historialReservas.length > 0 && (
            <section className="mb-12">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-400" /> Historial de Reservas
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                
                {/* --- CAMBIO AQUÍ: Wrapper para Scroll Horizontal --- */}
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-sm text-left min-w-[600px]"> {/* min-w evita que se aplaste */}
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                            <th className="px-4 py-3 whitespace-nowrap">Fecha</th>
                            <th className="px-4 py-3 whitespace-nowrap">Habitación</th>
                            <th className="px-4 py-3 whitespace-nowrap">Estado</th>
                            <th className="px-4 py-3 text-right whitespace-nowrap">Total</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {historialReservas.map(r => {
                            const hab = habitaciones.find(h => h.id === r.habitacion_id)
                            return (
                            <tr key={r.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                    {new Date(r.fecha_reserva).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                                    {hab ? `Hab. ${hab.numero}` : 'N/A'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${r.estado === 'completada' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {r.estado}
                                </span>
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                                    ${r.total.toLocaleString()}
                                </td>
                            </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>
                {/* ----------------------------------------------- */}

            </div>
            </section>
        )}
        
        {/* Habitaciones Disponibles con Filtros */}
        <section className="mb-12" id="reservar">
          <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
            <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              Encuentra tu Habitación Ideal
            </h2>
          </div>

          {/* BARRA DE FILTROS */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
              {/* Filtro Tipo */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Tipo</label>
                <div className="relative">
                  <select 
                    value={filtroTipo} 
                    onChange={e => setFiltroTipo(e.target.value)} 
                    className="w-full pl-3 pr-8 py-3 bg-slate-50 border-transparent hover:bg-slate-100 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all appearance-none cursor-pointer outline-none"
                  >
                    <option value="">Todos los tipos</option>
                    {tiposDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">
                    <Filter className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Filtro Capacidad */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Huéspedes</label>
                <div className="relative">
                  <select 
                    value={filtroCapacidad} 
                    onChange={e => setFiltroCapacidad(e.target.value)} 
                    className="w-full pl-3 pr-8 py-3 bg-slate-50 border-transparent hover:bg-slate-100 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all appearance-none cursor-pointer outline-none"
                  >
                    <option value="">Cualquiera</option>
                    <option value="1">1 Persona</option>
                    <option value="2">2 Personas</option>
                    <option value="3">3 Personas</option>
                    <option value="4">4+ Personas</option>
                  </select>
                  <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Filtro Precio */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Presupuesto Máx.</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-slate-400">$</span>
                  <input 
                    type="number" 
                    placeholder="Sin límite" 
                    value={filtroPrecioMax} 
                    onChange={e => setFiltroPrecioMax(e.target.value)} 
                    className="w-full pl-7 pr-3 py-3 bg-slate-50 border-transparent hover:bg-slate-100 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all outline-none placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Botón Limpiar */}
              <div className="flex justify-end md:justify-start">
                {(filtroTipo || filtroCapacidad || filtroPrecioMax) && (
                  <button 
                    onClick={limpiarFiltros}
                    className="text-red-500 hover:text-red-700 font-medium text-sm flex items-center gap-1 px-3 py-3 hover:bg-red-50 rounded-xl transition-colors w-full justify-center md:w-auto"
                  >
                    <X className="h-4 w-4" /> Borrar filtros
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* RESULTADOS */}
          <div className="mb-4 text-sm text-slate-500 font-medium">
            Mostrando {habitacionesFiltradas.length} habitaciones disponibles
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habitacionesFiltradas.length > 0 ? (
              habitacionesFiltradas.map((habitacion) => (
                <HabitacionCard key={habitacion.id} habitacion={habitacion} navigate={navigate} />
              ))
            ) : (
              <div className="col-span-full text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <Info className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-700">No encontramos resultados</h3>
                <p className="text-slate-500 mb-4">Intenta ajustar los filtros de búsqueda.</p>
                <button onClick={limpiarFiltros} className="text-teal-600 font-bold hover:underline">Ver todas las habitaciones</button>
              </div>
            )}
          </div>
        </section>

        {/* Servicios */}
        <section>
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6">
            Nuestros Servicios Exclusivos
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicios.map((servicio) => (
              <ServicioCard 
                key={servicio.id} 
                servicio={servicio} 
                onClick={() => handleVerServicio(servicio)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Modales */}
      {showModalReserva && reservaAEditar && (
        <ModalSolicitarCambio
          reserva={reservaAEditar}
          habitaciones={habitaciones}
          onClose={() => setShowModalReserva(false)}
          onSuccess={handleSolicitudEnviada}
          user_id={user?.id}
        />
      )}

      {showModalServicio && servicioSeleccionado && (
        <ModalDetalleServicio 
          servicio={servicioSeleccionado} 
          onClose={() => setShowModalServicio(false)} 
        />
      )}
    </div>
  )
}

const ReservaCard = ({ reserva, habitaciones, consultas, onSolicitarCambio, onCancelar }: any) => {
  const habitacionInfo = habitaciones.find((h:any) => h.id === reserva.habitacion_id);
  const tieneCambioPendiente = consultas.some((c:any) => c.estado === 'pendiente' && (c.asunto.includes(reserva.id.slice(0,8)) || c.mensaje.includes(reserva.id)));
  const cambioAprobado = consultas.some((c:any) => c.estado === 'respondida' && (c.asunto.includes(reserva.id.slice(0,8)) || c.mensaje.includes(reserva.id)) && (c.respuesta && c.respuesta.includes('APROBADA')));
  
  return (
    <div className="border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow relative overflow-hidden">
        {/* Borde estado */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-teal-500"></div>
        
        <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-xl text-slate-800">
                {habitacionInfo ? `Habitación ${habitacionInfo.numero} - ${habitacionInfo.tipo}` : 'Habitación Asignada'}
            </h3>
            <span className="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wide">Confirmada</span>
            </div>
            
            <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-600 mb-4">
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-teal-500"/> Entrada: {new Date(reserva.fecha_entrada).toLocaleDateString()}</div>
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-teal-500"/> Salida: {new Date(reserva.fecha_salida).toLocaleDateString()}</div>
            <div className="flex items-center gap-2"><Users className="h-4 w-4 text-teal-500"/> {reserva.num_huespedes} Huéspedes</div>
            <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-teal-500"/> Total: ${reserva.total.toLocaleString()}</div>
            </div>
        </div>

        <div className="flex flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
            {tieneCambioPendiente ? ( 
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 justify-center">
                    <RefreshCw className="h-4 w-4 animate-spin-slow" />
                    <span className="font-medium text-sm">Solicitud Pendiente</span>
                </div> 
            ) : (
                <button 
                    onClick={onSolicitarCambio}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors w-full"
                >
                    <Edit className="h-4 w-4" /> Solicitar Cambios
                </button>
            )}
            
            <button 
                onClick={onCancelar}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors w-full"
            >
                <Trash2 className="h-4 w-4" /> Cancelar Reserva
            </button>
        </div>
    </div>
  )
}

const ModalSolicitarCambio = ({ reserva, habitaciones, onClose, onSuccess, user_id }: any) => {
  const [formData, setFormData] = useState({ habitacion_id: reserva.habitacion_id, fecha_entrada: reserva.fecha_entrada, fecha_salida: reserva.fecha_salida });
  const habActual = habitaciones.find((h:any) => h.id === reserva.habitacion_id);
  const [selectedTipo, setSelectedTipo] = useState(habActual?.tipo || '');
  const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState(false);
  const [nuevoTotal, setNuevoTotal] = useState(reserva.total); const [diferencia, setDiferencia] = useState(0);
  const [motivo, setMotivo] = useState('');

  const tiposDisponibles = [...new Set(habitaciones.map((h:any) => h.tipo))];

  useEffect(() => {
    try { const { fecha_entrada, fecha_salida, habitacion_id } = formData; const habInfo = habitaciones.find((h:any) => h.id === habitacion_id); if (fecha_entrada && fecha_salida && habInfo) { const dias = Math.ceil((new Date(fecha_salida).getTime() - new Date(fecha_entrada).getTime())/(1000*60*60*24)); if(dias>0){const tot=dias*habInfo.precio_noche; setNuevoTotal(tot); setDiferencia(tot-reserva.total);} } } catch (e) { console.error(e); }
  }, [formData, habitaciones, reserva.total]);

  const handleChange = (e: any) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
  const handleTipoChange = (e: any) => { const nuevoTipo = e.target.value; setSelectedTipo(nuevoTipo); const primeraHabDelTipo = habitaciones.find((h:any) => h.tipo === nuevoTipo); if (primeraHabDelTipo) { setFormData(prev => ({ ...prev, habitacion_id: primeraHabDelTipo.id })); } };

  const handleSubmit = async (e: any) => { 
      e.preventDefault(); setLoading(true); setError(''); 
      try { 
          if(new Date(formData.fecha_salida) <= new Date(formData.fecha_entrada)) throw new Error("Fechas inválidas"); 
          
          // Crear un mensaje detallado para la consulta
          const habOriginal = habitaciones.find((h:any) => h.id === reserva.habitacion_id); 
          const habNueva = habitaciones.find((h:any) => h.id === formData.habitacion_id); 
          
          const detallesCambio = `
            SOLICITUD DE CAMBIO DE RESERVA #${reserva.id.slice(0,8)}
            ------------------------------------------------
            Motivo del huésped: ${motivo}
            
            CAMBIOS SOLICITADOS:
            - Fechas: De ${new Date(reserva.fecha_entrada).toLocaleDateString()} -> ${new Date(reserva.fecha_salida).toLocaleDateString()} 
                      A ${new Date(formData.fecha_entrada).toLocaleDateString()} -> ${new Date(formData.fecha_salida).toLocaleDateString()}
            - Habitación: De ${habOriginal?.tipo} (${habOriginal?.numero}) -> ${habNueva?.tipo} (${habNueva?.numero})
            
            IMPACTO FINANCIERO ESTIMADO:
            - Total Original: $${reserva.total}
            - Nuevo Total: $${nuevoTotal}
            - Diferencia a pagar: $${diferencia}
          `;

          await supabase.from('consultas').insert([{ 
              usuario_id: user_id, 
              asunto: `Solicitud Cambio - Reserva #${reserva.id.slice(0,8)}`, 
              mensaje: detallesCambio, 
              estado: 'pendiente', 
              fecha_consulta: new Date().toISOString() 
          }]); 
          
          setSuccess(true); 
      } catch (err: any) { setError(err.message); } finally { setLoading(false); } 
  };

  if (success) return <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-xl p-8 max-w-md w-full text-center"><CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" /><h2 className="text-2xl font-bold text-slate-900 mb-2">¡Solicitud Enviada!</h2><p className="text-slate-600 mb-4">Recepción revisará tu solicitud y te contactará pronto.</p><button onClick={onSuccess} className="px-6 py-2 bg-teal-600 text-white rounded-lg font-medium">Entendido</button></div></div>;
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-xl w-full relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="h-6 w-6"/></button>
            
            <h2 className="text-xl font-bold mb-1 text-slate-900">Modificar Reserva</h2>
            <p className="text-sm text-slate-500 mb-6">Solicita cambios en fechas o tipo de habitación.</p>
            
            {error && <p className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex gap-2"><AlertCircle className="h-5 w-5"/>{error}</p>}
            
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nueva Entrada</label>
                        <input type="date" name="fecha_entrada" value={new Date(formData.fecha_entrada).toISOString().split('T')[0]} onChange={handleChange} className="w-full border border-slate-300 p-2 rounded-lg text-sm focus:border-teal-500 outline-none"/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nueva Salida</label>
                        <input type="date" name="fecha_salida" value={new Date(formData.fecha_salida).toISOString().split('T')[0]} onChange={handleChange} className="w-full border border-slate-300 p-2 rounded-lg text-sm focus:border-teal-500 outline-none"/>
                    </div>
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Habitación</label>
                    <select value={selectedTipo} onChange={handleTipoChange} className="w-full border border-slate-300 p-2 rounded-lg text-sm bg-white focus:border-teal-500 outline-none">
                        {tiposDisponibles.map((t:any)=><option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Motivo del Cambio</label>
                    <textarea 
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder="Ej: Necesito una cama extra o cambio de fechas por vuelo..."
                        className="w-full border border-slate-300 p-2 rounded-lg text-sm h-20 resize-none focus:border-teal-500 outline-none"
                        required
                    />
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-slate-500 uppercase">Diferencia estimada</p>
                        <p className={`font-bold ${diferencia > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                            {diferencia > 0 ? `+ $${diferencia.toLocaleString()}` : `- $${Math.abs(diferencia).toLocaleString()}`}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase">Nuevo Total</p>
                        <p className="font-bold text-slate-900 text-lg">${nuevoTotal.toLocaleString()}</p>
                    </div>
                </div>
                
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 bg-white border border-slate-300 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors">Cancelar</button>
                    <button type="submit" disabled={loading} className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-medium hover:bg-teal-700 shadow-lg shadow-teal-200 transition-all flex items-center justify-center gap-2">
                        {loading ? <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div> : <Send className="h-4 w-4"/>}
                        Enviar Solicitud
                    </button>
                </div>
            </form>
        </div>
    </div>
  )
}

const ModalDetalleServicio = ({ servicio, onClose }: any) => { return <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}><div className="bg-white p-8 rounded-2xl max-w-md w-full relative shadow-2xl animate-in zoom-in-95 duration-200" onClick={e=>e.stopPropagation()}><button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="h-6 w-6"/></button><h2 className="text-2xl font-serif font-bold mb-4 text-slate-900">{servicio.nombre}</h2><p className="text-slate-600 leading-relaxed">{servicio.descripcion}</p><div className="mt-6 flex justify-between items-center pt-6 border-t border-slate-100"><p className="text-2xl font-bold text-teal-600">${servicio.precio}</p><button onClick={onClose} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors">Cerrar</button></div></div></div> }
const HabitacionCard = ({ habitacion, navigate }: any) => { return <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group"><div className="relative h-56 overflow-hidden"><img src={habitacion.imagen_url || '/images/rooms/room-1.jpg'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/><div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-slate-800 shadow-sm">{habitacion.numero}</div><div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4"><span className="text-white text-xs font-bold uppercase tracking-wider bg-teal-600 px-2 py-1 rounded">{habitacion.tipo}</span></div></div><div className="p-6"><div className="flex justify-between items-start mb-4"><div><h3 className="text-xl font-bold text-slate-900 mb-1">{habitacion.tipo}</h3><div className="flex items-center gap-1 text-slate-500 text-xs"><Users className="h-3 w-3"/> Capacidad: {habitacion.capacidad}</div></div><div className="text-right"><p className="text-2xl font-bold text-teal-600">${habitacion.precio_noche}</p><p className="text-xs text-slate-400">/ noche</p></div></div><p className="text-slate-600 text-sm mb-6 line-clamp-2">{habitacion.descripcion || "Disfruta de una estancia inolvidable con todas las comodidades."}</p><button onClick={()=>navigate(`/usuario/reservar/${habitacion.id}`)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-teal-600 transition-colors flex items-center justify-center gap-2 group-hover:shadow-lg">Reservar Ahora <ArrowRight className="h-4 w-4"/></button></div></div> }
const ServicioCard = ({ servicio, onClick }: any) => { return <div onClick={onClick} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-teal-100 cursor-pointer transition-all group"><div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mb-4 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors"><Info className="h-6 w-6"/></div><h3 className="font-bold text-lg text-slate-900 mb-2">{servicio.nombre}</h3><p className="text-sm text-slate-500 mb-4 line-clamp-2">{servicio.descripcion}</p><p className="text-teal-600 font-bold text-lg">${servicio.precio}</p></div> }

// Icono auxiliar para tarjetas
import { ArrowRight } from 'lucide-react';