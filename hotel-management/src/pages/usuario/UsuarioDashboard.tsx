import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Habitacion, Servicio, Reserva } from '@/types'
import { Calendar, Users, Clock, CheckCircle, XCircle, Mail, Edit, AlertCircle, Send, RefreshCw, Check, Info, X, Filter, Search, DollarSign } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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

  // Obtenemos tipos únicos para el select
  const tiposDisponibles = [...new Set(habitaciones.map(h => h.tipo))];
  const consultasPendientesCount = consultas.filter(c => c.estado === 'pendiente').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">
              Hola, {user?.nombre.split(' ')[0]}
            </h1>
            <p className="text-slate-600">¿Listo para tu próxima estancia?</p>
          </div>
          <button
            onClick={() => navigate('/usuario/consultas')}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-teal-200 hover:text-teal-700 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-all w-full md:w-auto justify-center"
          >
            <Mail className="h-5 w-5" />
            Mis Consultas
            {consultasPendientesCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold animate-pulse">
                {consultasPendientesCount}
              </span>
            )}
          </button>
        </div>

        {/* Mis Reservas */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-teal-600" /> Mis Reservas Activas
          </h2>
          {reservas.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-slate-100">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Calendar className="h-8 w-8" />
              </div>
              <p className="text-slate-500">Aún no tienes reservas. ¡Explora nuestras habitaciones!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {reservas.map((reserva) => (
                <ReservaCard 
                  key={reserva.id} 
                  reserva={reserva} 
                  habitaciones={habitaciones}
                  consultas={consultas}
                  onSolicitarCambio={() => handleAbrirSolicitud(reserva)}
                />
              ))}
            </div>
          )}
        </section>

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
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Tipo de Habitación</label>
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
                    <option value="">Cualquier capacidad</option>
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
                <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
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

// --- COMPONENTE RESERVACARD (Igual que antes, necesario para que compile) ---
const ReservaCard = ({ reserva, habitaciones, consultas, onSolicitarCambio }: any) => {
  const habitacionInfo = habitaciones.find((h:any) => h.id === reserva.habitacion_id);
  const tieneCambioPendiente = consultas.some((c:any) => c.estado === 'pendiente' && (c.asunto.includes(reserva.id.slice(0,8)) || c.mensaje.includes(reserva.id)));
  const cambioAprobado = consultas.some((c:any) => c.estado === 'respondida' && (c.asunto.includes(reserva.id.slice(0,8)) || c.mensaje.includes(reserva.id)) && (c.respuesta && c.respuesta.includes('APROBADA')));
  const getEstadoColor = (st:string) => st==='activa'?'bg-green-100 text-green-700':st==='completada'?'bg-blue-100 text-blue-700':'bg-red-100 text-red-700';
  const getEstadoIcon = (st:string) => st==='activa'?<CheckCircle className="h-5 w-5"/>:st==='completada'?<Clock className="h-5 w-5"/>:<XCircle className="h-5 w-5"/>;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-all border-l-4 border-l-teal-500">
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">
              {habitacionInfo ? `Habitación ${habitacionInfo.numero} (${habitacionInfo.tipo})` : `Reserva #${reserva.id.slice(0, 8)}`}
            </h3>
            <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">ID: {reserva.id.slice(0, 8)}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getEstadoColor(reserva.estado)} md:hidden`}>{getEstadoIcon(reserva.estado)}<span className="capitalize">{reserva.estado}</span></span>
        </div>
        <div className="text-sm text-slate-600 space-y-1">
           <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-teal-500"/> {new Date(reserva.fecha_entrada).toLocaleDateString()} ➔ {new Date(reserva.fecha_salida).toLocaleDateString()}</p>
           <p className="flex items-center gap-2"><Users className="h-4 w-4 text-teal-500"/> {reserva.num_huespedes} personas</p>
           <p className="font-bold text-amber-600 mt-2">Total: ${reserva.total.toLocaleString('es-ES')}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 w-full md:w-auto">
        <span className={`hidden md:flex px-3 py-1 rounded-full text-xs font-bold items-center gap-1 ${getEstadoColor(reserva.estado)}`}>{getEstadoIcon(reserva.estado)}<span className="capitalize">{reserva.estado}</span></span>
        {tieneCambioPendiente ? ( <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 w-full md:w-auto justify-center"><RefreshCw className="h-4 w-4 animate-spin-slow" /><span className="font-medium text-sm">Solicitud Pendiente</span></div> ) : cambioAprobado ? ( <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 w-full md:w-auto justify-center"><CheckDouble className="h-4 w-4" /><span className="font-medium text-sm">Cambio Realizado</span></div> ) : ( reserva.estado === 'activa' && ( <button onClick={onSolicitarCambio} className="w-full md:w-auto px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors border border-slate-300 shadow-sm hover:shadow"><Edit className="h-4 w-4" />Solicitar Cambio</button> ) )}
      </div>
    </div>
  )
}

// --- COMPONENTE HABITACION CARD (Con imagen y diseño mejorado) ---
const HabitacionCard = ({ habitacion, navigate }: { habitacion: Habitacion, navigate: any }) => {
  // Imagen por defecto si no tiene
  const imgSrc = habitacion.imagen_url || "/images/rooms/room-1.jpg";

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 group">
      <div className="relative h-56 overflow-hidden">
        <img src={imgSrc} alt={habitacion.tipo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm">
          <span className="font-bold text-slate-900">#{habitacion.numero}</span>
        </div>
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-4">
           <h3 className="text-xl font-serif font-bold text-white">{habitacion.tipo}</h3>
        </div>
      </div>
      
      <div className="p-6">
        <p className="text-slate-600 text-sm mb-4 line-clamp-2">{habitacion.descripcion}</p>
        
        <div className="flex items-center gap-4 mb-6 text-sm text-slate-500">
          <div className="flex items-center gap-1"><Users className="h-4 w-4 text-teal-500"/> {habitacion.capacidad} pax</div>
          {/* Mostramos la primera amenidad si existe */}
          {habitacion.amenidades && habitacion.amenidades.length > 0 && (
             <div className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-teal-500"/> {habitacion.amenidades[0]}</div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
          <div>
            <p className="text-2xl font-bold text-teal-700">${habitacion.precio_noche?.toLocaleString('es-ES')}</p>
            <p className="text-xs text-slate-400 font-medium">PRECIO POR NOCHE</p>
          </div>
          <button onClick={() => navigate(`/usuario/reservar/${habitacion.id}`)} className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-lg shadow-slate-200 hover:shadow-slate-300 transform hover:-translate-y-0.5">
            Reservar
          </button>
        </div>
      </div>
    </div>
  )
}


// --- MODAL SOLICITAR CAMBIO (ESTRUCTURADO) ---
const ModalSolicitarCambio = ({
  reserva,
  habitaciones,
  onClose,
  onSuccess,
  user_id
}: {
  reserva: Reserva
  habitaciones: Habitacion[]
  onClose: () => void
  onSuccess: () => void
  user_id: string | undefined
}) => {
  const [formData, setFormData] = useState({
    habitacion_id: reserva.habitacion_id,
    fecha_entrada: reserva.fecha_entrada,
    fecha_salida: reserva.fecha_salida,
  });
  
  const habActual = habitaciones.find(h => h.id === reserva.habitacion_id);
  const [selectedTipo, setSelectedTipo] = useState(habActual?.tipo || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [nuevoTotal, setNuevoTotal] = useState(reserva.total);
  const [diferencia, setDiferencia] = useState(0);

  const tiposDisponibles = [...new Set(habitaciones.map(h => h.tipo))];
  const habitacionesFiltradas = habitaciones.filter(h => h.tipo === selectedTipo);

  useEffect(() => {
    try {
      const { fecha_entrada, fecha_salida, habitacion_id } = formData;
      const habInfo = habitaciones.find(h => h.id === habitacion_id);
      
      if (fecha_entrada && fecha_salida && habInfo) {
        const entrada = new Date(fecha_entrada + 'T00:00:00');
        const salida = new Date(fecha_salida + 'T00:00:00');
        const noches = Math.ceil((salida.getTime() - entrada.getTime()) / (1000 * 60 * 60 * 24));
        
        if (noches > 0) {
          const totalCalc = noches * habInfo.precio_noche;
          setNuevoTotal(totalCalc);
          setDiferencia(totalCalc - reserva.total);
        }
      }
    } catch (e) { console.error(e); }
  }, [formData, habitaciones, reserva.total]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoTipo = e.target.value;
    setSelectedTipo(nuevoTipo);
    const primeraHabDelTipo = habitaciones.find(h => h.tipo === nuevoTipo);
    if (primeraHabDelTipo) {
      setFormData(prev => ({ ...prev, habitacion_id: primeraHabDelTipo.id }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const entrada = new Date(formData.fecha_entrada);
      const salida = new Date(formData.fecha_salida);
      if (salida <= entrada) throw new Error("La salida debe ser posterior a la entrada");

      const { data, error: funcError } = await supabase.functions.invoke('check-room-availability', {
        body: {
          habitacion_id: formData.habitacion_id,
          fecha_entrada: formData.fecha_entrada,
          fecha_salida: formData.fecha_salida,
          reserva_id_excluir: reserva.id
        }
      });

      if (funcError) throw new Error("Error al verificar disponibilidad");
      const responseData = data?.data || data;
      if (!responseData?.available) {
        throw new Error(`Lo sentimos, no hay disponibilidad para ${selectedTipo} en esas fechas.`);
      }

      const habOriginal = habitaciones.find(h => h.id === reserva.habitacion_id);
      const habNueva = habitaciones.find(h => h.id === formData.habitacion_id);
      
      // CREAMOS EL JSON ESTRUCTURADO PARA EL ADMIN
      const mensajeStruct = JSON.stringify({
        type: 'SOLICITUD_CAMBIO_ESTRUCTURADA',
        reservaId: reserva.id,
        original: {
          habNumero: habOriginal?.numero,
          habTipo: habOriginal?.tipo,
          entrada: reserva.fecha_entrada,
          salida: reserva.fecha_salida,
          total: reserva.total
        },
        nuevo: {
          habitacion_id: habNueva?.id,
          habNumero: habNueva?.numero,
          habTipo: habNueva?.tipo,
          entrada: formData.fecha_entrada,
          salida: formData.fecha_salida,
          total: nuevoTotal,
          diferencia: diferencia
        }
      });

      await supabase.from('consultas').insert([{
        usuario_id: user_id,
        asunto: `Solicitud Cambio - Reserva #${reserva.id.slice(0,8)}`,
        mensaje: mensajeStruct,
        estado: 'pendiente',
        fecha_consulta: new Date().toISOString()
      }]);

      setSuccess(true);

    } catch (err: any) {
      setError(err.message || "Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Solicitud Enviada!</h2>
          <p className="text-slate-600 mb-6">
            El operador revisará tu solicitud. Si se aprueba, verás el estado actualizado.
          </p>
          <button onClick={onSuccess} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium">
            Entendido
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-xl w-full">
        <h2 className="text-xl font-bold mb-6">Solicitar Cambio de Reserva</h2>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2"><AlertCircle className="h-5 w-5" />{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Nueva Entrada</label><input type="date" name="fecha_entrada" value={new Date(formData.fecha_entrada).toISOString().split('T')[0]} onChange={handleChange} min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Nueva Salida</label><input type="date" name="fecha_salida" value={new Date(formData.fecha_salida).toISOString().split('T')[0]} onChange={handleChange} min={formData.fecha_entrada} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Habitación</label><select value={selectedTipo} onChange={handleTipoChange} className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-medium">{tiposDisponibles.map(tipo => (<option key={tipo} value={tipo}>{tipo}</option>))}</select></div>
          <div className="hidden"><select name="habitacion_id" value={formData.habitacion_id} onChange={handleChange}>{habitacionesFiltradas.map(h => <option key={h.id} value={h.id}>{h.numero}</option>)}</select></div>
          <div className="bg-slate-50 p-4 rounded-lg space-y-2 border border-slate-200">
            <div className="flex justify-between text-sm"><span>Nuevo Total Estimado:</span><span className="font-bold">${nuevoTotal.toLocaleString('es-ES')}</span></div>
            <div className={`flex justify-between font-bold ${diferencia > 0 ? 'text-red-600' : 'text-green-600'}`}><span>{diferencia > 0 ? 'Diferencia a Pagar:' : 'A favor:'}</span><span>${Math.abs(diferencia).toLocaleString('es-ES')}</span></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50">{loading ? <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"/> : <Send className="h-4 w-4" />} Enviar Solicitud</button>
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// --- MODAL DETALLE DE SERVICIO ---
const ModalDetalleServicio = ({ servicio, onClose }: { servicio: Servicio, onClose: () => void }) => {
  const imageMap: Record<string, string> = { 'Spa & Wellness': '/images/services/spa.jpg', 'Restaurante Gourmet': '/images/services/restaurant.jpg', 'Gimnasio Premium': '/images/services/gym.jpg', 'Piscina Infinita': '/images/services/pool.jpg' }
  const imgSrc = servicio.imagen_url || imageMap[servicio.nombre] || '/images/services/spa.jpg';
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors z-10"><X className="h-5 w-5" /></button>
        <div className="h-64 relative"><img src={imgSrc} alt={servicio.nombre} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" /><div className="absolute bottom-0 left-0 p-6"><h2 className="text-3xl font-serif font-bold text-white">{servicio.nombre}</h2></div></div>
        <div className="p-8"><div className="prose prose-slate mb-6"><p className="text-lg text-slate-600 leading-relaxed">{servicio.descripcion}</p></div><div className="flex items-center justify-between pt-6 border-t border-slate-100"><div><span className="block text-sm text-slate-500 uppercase tracking-wider font-semibold">Precio</span>{servicio.precio && servicio.precio > 0 ? (<span className="text-2xl font-bold text-teal-600">${servicio.precio.toLocaleString('es-ES')}</span>) : (<span className="text-2xl font-bold text-green-600">Incluido</span>)}</div><button onClick={onClose} className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors">Cerrar</button></div></div>
      </div>
    </div>
  )
}


const ServicioCard = ({ servicio, onClick }: { servicio: Servicio, onClick: () => void }) => {
  const imageMap: Record<string, string> = { 'Spa & Wellness': '/images/services/spa.jpg', 'Restaurante Gourmet': '/images/services/restaurant.jpg', 'Gimnasio Premium': '/images/services/gym.jpg', 'Piscina Infinita': '/images/services/pool.jpg', }
  return ( <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow group cursor-pointer" onClick={onClick}><div className="relative h-48"><img src={servicio.imagen_url || imageMap[servicio.nombre] || '/images/services/spa.jpg'} alt={servicio.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/></div><div className="p-6"><h3 className="text-xl font-serif font-bold text-slate-900 mb-2">{servicio.nombre}</h3><p className="text-slate-600 text-sm mb-4 line-clamp-2">{servicio.descripcion}</p><div className="flex justify-between items-center">{servicio.precio && servicio.precio > 0 ? (<p className="text-xl font-bold text-teal-600">${servicio.precio.toLocaleString('es-ES')}</p>) : (<p className="text-sm text-green-600 font-semibold">Incluido</p>)}<button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors">Más Info</button></div></div></div> )
}

