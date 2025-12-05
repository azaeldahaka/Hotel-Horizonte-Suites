import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Habitacion, Usuario, Reserva, TipoHabitacion, Amenidad, Servicio } from '@/types'
// Usamos Shield para evitar el error de 'Lock' y todos los iconos necesarios
import { Home, Users, BarChart3, Plus, Edit, Trash2, X, Save, TrendingUp, DollarSign, Calendar, Filter, AlertCircle, RefreshCw, XCircle, CheckCircle, Coffee, Shield, PieChart as PieIcon } from 'lucide-react'
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts'

export const AdminDashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'habitaciones' | 'servicios' | 'operadores' | 'estadisticas' | 'reservas'>('habitaciones')
  
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([])
  const [operadores, setOperadores] = useState<Usuario[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [clientes, setClientes] = useState<Usuario[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [tiposHabitacion, setTiposHabitacion] = useState<TipoHabitacion[]>([])
  const [amenidades, setAmenidades] = useState<Amenidad[]>([])
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    if (habitaciones.length === 0) setLoading(true);
    try {
      const [habResult, opResult, resResult, cliResult, servResult, tiposResult, amenidadesResult] = await Promise.all([
        supabase.from('habitaciones').select('*').order('numero'),
        supabase.from('usuarios').select('*').eq('rol', 'operador').order('nombre'),
        supabase.from('reservas').select('*').order('fecha_reserva', { ascending: false }),
        supabase.from('usuarios').select('id, nombre, email, rol').eq('rol', 'usuario'),
        supabase.from('servicios').select('*').order('nombre'),
        supabase.from('tipos_habitacion').select('*').order('nombre'),
        supabase.from('amenidades').select('*').order('nombre')
      ]);
      
      setHabitaciones(habResult.data || [])
      setOperadores(opResult.data || [])
      setReservas(resResult.data || [])
      setClientes(cliResult.data || [])
      setServicios(servResult.data || [])
      setTiposHabitacion(tiposResult.data || [])
      setAmenidades(amenidadesResult.data || [])

    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">
            Panel de Administrador
          </h1>
          <p className="text-slate-500">Gestión integral de Horizonte Suites</p>
        </div>

        {/* Tabs de Navegación */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-200 pb-1 overflow-x-auto">
          {[
            { id: 'habitaciones', icon: Home, label: 'Habitaciones' },
            { id: 'servicios', icon: Coffee, label: 'Servicios' },
            { id: 'reservas', icon: Calendar, label: 'Reservas' },
            { id: 'operadores', icon: Users, label: 'Operadores' },
            { id: 'estadisticas', icon: BarChart3, label: 'Estadísticas' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium flex items-center gap-2 rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-white text-teal-700 border-teal-600 shadow-sm' 
                  : 'text-slate-500 border-transparent hover:text-teal-600 hover:bg-slate-100'
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'habitaciones' && <GestionHabitaciones habitaciones={habitaciones} tipos={tiposHabitacion} amenidadesDisponibles={amenidades} onRecargar={cargarDatos} />}
          {activeTab === 'servicios' && <GestionServicios servicios={servicios} onRecargar={cargarDatos} />}
          {activeTab === 'reservas' && <GestionReservas reservas={reservas} habitaciones={habitaciones} clientes={clientes} onRecargar={cargarDatos} />}
          {activeTab === 'operadores' && <GestionOperadores operadores={operadores} onRecargar={cargarDatos} />}
          {activeTab === 'estadisticas' && <Estadisticas habitaciones={habitaciones} reservas={reservas} />}
        </div>
      </div>
    </div>
  )
}

// --- ESTADÍSTICAS (CORREGIDO: DATOS REALES + MONEDA ARS + TEMA TEAL) ---
const Estadisticas = ({ habitaciones, reservas }: { habitaciones: Habitacion[], reservas: any[] }) => {
  // KPIs
  const ingresosCompletadas = reservas
    .filter(r => r.estado === 'completada')
    .reduce((sum, r) => sum + r.total, 0)

  const ingresosPendientes = reservas
    .filter(r => r.estado === 'activa')
    .reduce((sum, r) => sum + r.total, 0)

  const reservasActivas = reservas.filter(r => r.estado === 'activa').length
  const totalHabitaciones = habitaciones.length
  const habitacionesDisponibles = habitaciones.filter(h => h.estado === 'disponible').length

  // Formateador de Moneda ARS
  const formatMoney = (amount: number) => {
    return amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });
  }

  // Datos para Gráfico de Barras (Ingresos Mensuales)
  const getIngresosPorMes = () => {
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const data = meses.map((mes, idx) => {
      const totalMes = reservas
        .filter(r => {
           const d = new Date(r.fecha_reserva);
           return !isNaN(d.getTime()) && r.estado === 'completada' && d.getMonth() === idx;
        })
        .reduce((acc, r) => acc + r.total, 0);
      return { name: mes, Ingresos: totalMes };
    });
    return data;
  };
  const dataIngresos = getIngresosPorMes();

  // Datos para Gráfico de Torta (Tipos de Habitación Reservados)
  // FIX: Agrupa habitaciones borradas para que el total coincida
  const getReservasPorTipo = () => {
    const tipos = reservas.reduce((acc: any, r: any) => {
      const habitacion = habitaciones.find(h => h.id === r.habitacion_id);
      const tipo = habitacion ? habitacion.tipo : 'Otras / Eliminadas'; 
      
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(tipos).map(([name, value]) => ({ name, value }));
  };
  
  const dataTipos = getReservasPorTipo();
  // Paleta Teal y complementarios
  const COLORS = ['#0F766E', '#2DD4BF', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6', '#94A3B8'];

  return (
    <div className="space-y-8 pb-10">
      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ingresos Totales */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Ingresos Totales</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatMoney(ingresosCompletadas)}</h3>
            </div>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg group-hover:bg-teal-100 transition-colors"><DollarSign className="h-5 w-5"/></div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500">
            <span className="text-amber-600 font-medium mr-1">{formatMoney(ingresosPendientes)}</span> pendientes de cobro
          </div>
        </div>

        {/* Ocupación */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Ocupación Actual</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalHabitaciones - habitacionesDisponibles}/{totalHabitaciones}</h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors"><Home className="h-5 w-5"/></div>
          </div>
          {totalHabitaciones > 0 && (
            <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${((totalHabitaciones - habitacionesDisponibles) / totalHabitaciones) * 100}%` }}></div>
            </div>
          )}
        </div>

        {/* Reservas Activas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Reservas Activas</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{reservasActivas}</h3>
            </div>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-100 transition-colors"><Calendar className="h-5 w-5"/></div>
          </div>
          <p className="mt-4 text-xs text-slate-500">Reservas en curso o futuras</p>
        </div>

        {/* Disponibilidad */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Disponibilidad Hoy</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{habitacionesDisponibles}</h3>
            </div>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-100 transition-colors"><CheckCircle className="h-5 w-5"/></div>
          </div>
          <p className="mt-4 text-xs text-slate-500">Habitaciones libres para check-in</p>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico 1: Ingresos Mensuales */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-teal-600" /> Evolución de Ingresos
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataIngresos}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  formatter={(value: number) => [formatMoney(value), 'Ingresos']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="Ingresos" fill="#0F766E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Tipos de Habitación */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <PieIcon className="h-5 w-5 text-teal-600" /> Preferencias de Clientes
          </h3>
          <div className="h-[300px] w-full">
            {dataTipos.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataTipos}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dataTipos.map((entry:any, index:number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <PieIcon className="h-10 w-10 mb-2 opacity-20" />
                <p>No hay datos de reservas aún</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// --- GESTIÓN DE HABITACIONES (TEAL + FILTROS) ---
const GestionHabitaciones = ({ 
  habitaciones,
  tipos,
  amenidadesDisponibles,
  onRecargar 
}: { 
  habitaciones: Habitacion[]
  tipos: TipoHabitacion[]
  amenidadesDisponibles: Amenidad[]
  onRecargar: () => void 
}) => {
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Habitacion | null>(null)
  const [nuevaAmenidad, setNuevaAmenidad] = useState('')
  
  // Estados de filtros
  const [filtroNumero, setFiltroNumero] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroAmenidad, setFiltroAmenidad] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroPrecioMax, setFiltroPrecioMax] = useState('')
  const [filtroCapacidad, setFiltroCapacidad] = useState('')
  
  const [habitacionesFiltradas, setHabitacionesFiltradas] = useState(habitaciones)

  useEffect(() => {
    let resultado = habitaciones;
    if (filtroNumero) resultado = resultado.filter(h => h.numero.toLowerCase().includes(filtroNumero.toLowerCase()));
    if (filtroTipo) resultado = resultado.filter(h => h.tipo === filtroTipo);
    if (filtroEstado) resultado = resultado.filter(h => h.estado === filtroEstado);
    if (filtroAmenidad) resultado = resultado.filter(h => h.amenidades && h.amenidades.includes(filtroAmenidad));
    if (filtroPrecioMax) resultado = resultado.filter(h => h.precio_noche <= parseFloat(filtroPrecioMax));
    if (filtroCapacidad) resultado = resultado.filter(h => h.capacidad >= parseInt(filtroCapacidad));
    setHabitacionesFiltradas(resultado);
  }, [habitaciones, filtroNumero, filtroTipo, filtroEstado, filtroAmenidad, filtroPrecioMax, filtroCapacidad]);
  
  const limpiarFiltros = () => {
    setFiltroNumero(''); setFiltroTipo(''); setFiltroEstado(''); setFiltroAmenidad(''); setFiltroPrecioMax(''); setFiltroCapacidad('');
  }

  const [formData, setFormData] = useState({
    numero: '', tipo: tipos.length > 0 ? tipos[0].nombre : '', precio_noche: '', capacidad: '', amenidades: [] as string[], descripcion: '', estado: 'disponible'
  })

  const resetForm = () => {
    setFormData({ numero: '', tipo: tipos.length > 0 ? tipos[0].nombre : '', precio_noche: '', capacidad: '', amenidades: [], descripcion: '', estado: 'disponible' })
    setEditando(null)
    setShowModal(false)
  }

  const handleEdit = (hab: Habitacion) => {
    setEditando(hab)
    setFormData({ numero: hab.numero, tipo: hab.tipo, precio_noche: hab.precio_noche?.toString() || '', capacidad: hab.capacidad?.toString() || '', amenidades: hab.amenidades || [], descripcion: hab.descripcion || '', estado: hab.estado })
    setShowModal(true)
  }

  const handleAmenidadChange = (nombreAmenidad: string) => {
    setFormData(prev => ({
      ...prev,
      amenidades: prev.amenidades.includes(nombreAmenidad) ? prev.amenidades.filter(a => a !== nombreAmenidad) : [...prev.amenidades, nombreAmenidad]
    }))
  }

  const handleCrearAmenidad = async () => {
    if (!nuevaAmenidad.trim()) return;
    try { await supabase.from('amenidades').insert([{ nombre: nuevaAmenidad.trim() }]); setNuevaAmenidad(''); onRecargar(); } catch (error) { console.error(error); alert('Error creando amenidad.'); }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const dataToSave = { numero: formData.numero, tipo: formData.tipo, precio_noche: parseFloat(formData.precio_noche), capacidad: parseInt(formData.capacidad), amenidades: formData.amenidades, descripcion: formData.descripcion, estado: formData.estado }
    try {
      if (editando) await supabase.from('habitaciones').update(dataToSave).eq('id', editando.id)
      else await supabase.from('habitaciones').insert([dataToSave])
      resetForm(); onRecargar();
    } catch (error) { console.error(error) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta habitación?')) return
    try { await supabase.from('habitaciones').delete().eq('id', id); onRecargar(); } catch (e) { console.error(e) }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div><h2 className="text-xl font-bold text-slate-800">Inventario de Habitaciones</h2><p className="text-slate-500 text-sm">Total: {habitacionesFiltradas.length}</p></div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium flex items-center gap-2 shadow-md transition-all w-full md:w-auto justify-center"><Plus className="h-5 w-5" /> Nueva Habitación</button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold border-b border-slate-100 pb-2"><Filter className="h-4 w-4 text-teal-600" /> Filtros</div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
          <div className="col-span-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Número</label><div className="relative"><input type="text" placeholder="Ej: 101" value={filtroNumero} onChange={e => setFiltroNumero(e.target.value)} className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg outline-none text-sm"/><Home className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" /></div></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label><select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm bg-white"><option value="">Todos</option>{tipos.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}</select></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Personas</label><input type="number" placeholder="Mín" value={filtroCapacidad} onChange={e => setFiltroCapacidad(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm"/></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado</label><select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm bg-white"><option value="">Cualquiera</option><option value="disponible">Disponible</option><option value="ocupada">Ocupada</option><option value="mantenimiento">Mantenimiento</option></select></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio Máx.</label><input type="number" placeholder="$" value={filtroPrecioMax} onChange={e => setFiltroPrecioMax(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm"/></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amenidad</label><select value={filtroAmenidad} onChange={e => setFiltroAmenidad(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm bg-white"><option value="">Cualquiera</option>{amenidadesDisponibles.map(a => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}</select></div>
        </div>
        {(filtroNumero || filtroTipo || filtroEstado || filtroAmenidad || filtroPrecioMax || filtroCapacidad) && (<div className="mt-4 pt-3 border-t border-slate-100 flex justify-end"><button onClick={limpiarFiltros} className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1 hover:underline"><X className="h-3 w-3" /> Limpiar filtros</button></div>)}
      </div>

      {/* Grilla */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habitacionesFiltradas.map((hab) => (
          <div key={hab.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div><h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">{hab.numero}<span className="text-xs font-normal text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full">{hab.tipo}</span></h3></div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${hab.estado === 'disponible' ? 'bg-green-100 text-green-700' : hab.estado === 'ocupada' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{hab.estado}</span>
            </div>
            <div className="mb-3">
              <p className="text-2xl font-bold text-teal-600">${hab.precio_noche?.toLocaleString('es-AR')} <span className="text-sm text-slate-400 font-normal">/ noche</span></p>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1"><Users className="h-3 w-3" /> Capacidad: {hab.capacidad} pax</p>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4 flex-grow content-start">
              {hab.amenidades?.slice(0, 4).map((am, i) => (<span key={i} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium">{am}</span>))}
              {(hab.amenidades?.length || 0) > 4 && <span className="text-[11px] text-slate-400 px-1 py-1">+{hab.amenidades!.length - 4} más</span>}
            </div>
            <div className="flex gap-2 pt-4 border-t border-slate-100 mt-auto">
              <button onClick={() => handleEdit(hab)} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"><Edit className="h-4 w-4"/> Editar</button>
              <button onClick={() => handleDelete(hab.id)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"><Trash2 className="h-4 w-4"/> Borrar</button>
            </div>
          </div>
        ))}
      </div>
      
      {habitacionesFiltradas.length === 0 && <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl"><Home className="h-10 w-10 text-slate-300 mx-auto mb-2"/><p className="text-slate-500">No se encontraron habitaciones.</p><button onClick={limpiarFiltros} className="text-teal-600 font-medium mt-2 hover:underline">Limpiar búsqueda</button></div>}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">{editando ? 'Editar' : 'Nueva'} Habitación</h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-slate-700">Número</label><input value={formData.numero} onChange={e => setFormData({...formData, numero: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg" required /></div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Tipo</label>
                  <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg" required>
                    <option value="">Seleccionar...</option>
                    {tipos.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                  </select>
                </div>
                <div><label className="text-sm font-medium text-slate-700">Precio</label><input type="number" value={formData.precio_noche} onChange={e => setFormData({...formData, precio_noche: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg" required /></div>
                <div><label className="text-sm font-medium text-slate-700">Capacidad</label><input type="number" value={formData.capacidad} onChange={e => setFormData({...formData, capacidad: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg" required /></div>
                <div><label className="text-sm font-medium text-slate-700">Estado</label><select value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg"><option value="disponible">Disponible</option><option value="ocupada">Ocupada</option><option value="mantenimiento">Mantenimiento</option></select></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-2">Amenidades</label><div className="flex gap-2 mb-2"><input placeholder="Agregar nueva (ej: Netflix)" value={nuevaAmenidad} onChange={e => setNuevaAmenidad(e.target.value)} className="flex-1 border border-slate-300 p-2 rounded-lg text-sm" /><button type="button" onClick={handleCrearAmenidad} className="bg-green-600 hover:bg-green-700 text-white px-3 rounded-lg font-bold transition-colors">+</button></div><div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border border-slate-300 rounded-lg bg-slate-50 max-h-40 overflow-y-auto">{amenidadesDisponibles.map(amenidad => (<label key={amenidad.id} className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={formData.amenidades.includes(amenidad.nombre)} onChange={() => handleAmenidadChange(amenidad.nombre)} className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4" /><span className="text-sm text-slate-700">{amenidad.nombre}</span></label>))}</div></div>
              <div><label className="text-sm font-medium text-slate-700">Descripción</label><textarea value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg" rows={3} /></div>
              <div className="flex gap-3 pt-4"><button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg font-medium">Guardar</button><button type="button" onClick={resetForm} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 rounded-lg font-medium">Cancelar</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// --- GESTIÓN DE SERVICIOS (TEAL) ---
const GestionServicios = ({ servicios, onRecargar }: { servicios: Servicio[], onRecargar: () => void }) => {
  const [showModal, setShowModal] = useState(false); const [editando, setEditando] = useState<Servicio | null>(null); const [formData, setFormData] = useState({ nombre: '', descripcion: '', precio: '', imagen_url: '' });
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); const dataToSave = { nombre: formData.nombre, descripcion: formData.descripcion, precio: parseFloat(formData.precio), imagen_url: formData.imagen_url, disponible: true }; try { if (editando) await supabase.from('servicios').update(dataToSave).eq('id', editando.id); else await supabase.from('servicios').insert([dataToSave]); setFormData({ nombre: '', descripcion: '', precio: '', imagen_url: '' }); setEditando(null); setShowModal(false); onRecargar(); } catch (error) { console.error(error) } }
  const handleDelete = async (id: string) => { if (!confirm('¿Borrar servicio?')) return; await supabase.from('servicios').delete().eq('id', id); onRecargar(); }
  return ( <div> <div className="mb-6"><button onClick={() => {setEditando(null); setFormData({ nombre: '', descripcion: '', precio: '', imagen_url: '' }); setShowModal(true)}} className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-2 shadow-lg transition-colors w-full md:w-auto justify-center"><Plus className="h-5 w-5" /> Nuevo Servicio</button></div> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{servicios.map((s) => (<div key={s.id} className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow"><h3 className="font-bold text-lg text-slate-900">{s.nombre}</h3><p className="text-sm text-slate-600 mb-2 line-clamp-2">{s.descripcion}</p><p className="font-bold text-amber-600 mb-4">${s.precio.toLocaleString('es-AR')}</p><div className="flex gap-2"><button onClick={() => { setEditando(s); setFormData({ nombre: s.nombre, descripcion: s.descripcion, precio: s.precio.toString(), imagen_url: s.imagen_url || '' }); setShowModal(true) }} className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 rounded-lg text-sm font-medium transition-colors">Editar</button><button onClick={() => handleDelete(s.id)} className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg text-sm font-medium transition-colors">Eliminar</button></div></div>))}</div> {showModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><div className="bg-white p-6 rounded-xl max-w-md w-full shadow-2xl"><h2 className="text-2xl font-bold mb-4 text-slate-900">{editando ? 'Editar' : 'Nuevo'} Servicio</h2><form onSubmit={handleSubmit} className="space-y-4"><input placeholder="Nombre" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg" required /><textarea placeholder="Descripción" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg" required /><input type="number" placeholder="Precio" value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg" required /><div className="flex gap-2 pt-2"><button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg font-medium transition-colors">Guardar</button><button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 rounded-lg font-medium transition-colors">Cancelar</button></div></form></div></div>)} </div> )
}

// --- GESTIÓN DE RESERVAS (TEAL + 3 BOTONES) ---
const GestionReservas = ({ reservas, habitaciones, clientes, onRecargar }: any) => {
  const [fechaInicio, setFIni] = useState(''); const [fechaFin, setFFin] = useState(''); const [fNombre, setFNom] = useState(''); const [fTipo, setFTipo] = useState('');
  const [filtradas, setFiltradas] = useState(reservas); const [showModal, setShowModal] = useState(false); const [reservaAEditar, setReservaAEditar] = useState<any>(null);
  const tiposDeHabitacion = [...new Set(habitaciones.map((h:any) => h.tipo))];
  useEffect(() => {
    let res = reservas; let tsIni = fechaInicio ? new Date(fechaInicio.split('-').map(Number) as any).setHours(0,0,0,0) : 0; let tsFin = fechaFin ? new Date(fechaFin.split('-').map(Number) as any).setHours(23,59,59) : Infinity;
    res = res.filter((r:any) => { const d = new Date(r.fecha_reserva).getTime(); return d >= tsIni && d <= tsFin; });
    if (fNombre) res = res.filter((r:any) => clientes.find((c:any) => c.id === r.usuario_id)?.nombre.toLowerCase().includes(fNombre.toLowerCase()));
    if (fTipo) res = res.filter((r:any) => habitaciones.find((h:any) => h.id === r.habitacion_id)?.tipo === fTipo);
    setFiltradas(res);
  }, [reservas, fechaInicio, fechaFin, fNombre, fTipo, clientes, habitaciones]);
  const handleLimpiar = () => { setFIni(''); setFFin(''); setFNom(''); setFTipo(''); };
  const handleOp = async (id:string, op:string) => { if(confirm(`¿Estás seguro de marcar como ${op}?`)) { await supabase.from('reservas').update({estado:op}).eq('id', id); onRecargar(); }};
  return ( <div> <div className="bg-white p-4 rounded-lg shadow-sm mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end border border-slate-200"> <div><label className="text-sm font-medium text-slate-700 mb-1">Desde</label><input type="date" value={fechaInicio} onChange={e=>setFIni(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg"/></div> <div><label className="text-sm font-medium text-slate-700 mb-1">Hasta</label><input type="date" value={fechaFin} onChange={e=>setFFin(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg"/></div> <div><label className="text-sm font-medium text-slate-700 mb-1">Huésped</label><input placeholder="Buscar..." value={fNombre} onChange={e=>setFNom(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg"/></div> <div><label className="text-sm font-medium text-slate-700 mb-1">Tipo</label><select value={fTipo} onChange={e=>setFTipo(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg"><option value="">Todos</option>{tiposDeHabitacion.map((t:any)=><option key={t} value={t}>{t}</option>)}</select></div> <div className="md:col-span-4 flex gap-2"><button onClick={handleLimpiar} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors">Limpiar Filtros</button></div> </div> <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {filtradas.map((r:any) => { const c = clientes.find((u:any) => u.id === r.usuario_id); const h = habitaciones.find((ha:any) => ha.id === r.habitacion_id); return ( <div key={r.id} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow"> <div className="flex justify-between items-start mb-2"> <div><h3 className="font-bold text-lg text-slate-900">{c?.nombre || `ID: ${r.usuario_id.slice(0,8)}`}</h3><p className="text-sm text-slate-500">{c?.email || 'Email no disponible'}</p></div> <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${r.estado==='activa'?'bg-green-100 text-green-800':r.estado==='completada'?'bg-blue-100 text-blue-800':'bg-red-100 text-red-800'}`}>{r.estado}</span> </div> <p className="font-semibold text-slate-700 mb-2">{h ? `Habitación ${h.numero} (${h.tipo})` : 'Habitación eliminada'}</p> <div className="text-sm text-slate-600 space-y-1 mb-4"><p>Check-in: {new Date(r.fecha_entrada).toLocaleDateString()}</p><p>Check-out: {new Date(r.fecha_salida).toLocaleDateString()}</p><p>Huéspedes: {r.num_huespedes}</p><p className="font-bold text-amber-600 pt-1">Total: ${r.total.toLocaleString('es-AR')}</p><p className="text-xs text-slate-400">Reservado: {new Date(r.fecha_reserva).toLocaleDateString()}</p></div> <div className="grid grid-cols-3 gap-2"> <button onClick={()=>handleOp(r.id, 'completada')} disabled={r.estado!=='activa'} className="bg-green-100 hover:bg-green-200 text-green-700 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"><CheckCircle className="h-4 w-4"/> Ok</button> <button onClick={()=>{setReservaAEditar(r);setShowModal(true)}} disabled={r.estado!=='activa'} className="bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"><Edit className="h-4 w-4"/> Edit</button> <button onClick={()=>handleOp(r.id, 'cancelada')} disabled={r.estado!=='activa'} className="bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"><XCircle className="h-4 w-4"/> X</button> </div> </div> ) })} </div> {showModal && <ModalEditarReserva reserva={reservaAEditar} habitaciones={habitaciones} clientes={clientes} onClose={()=>setShowModal(false)} onSave={()=>{setShowModal(false);onRecargar()}}/>} </div> )
}

const ModalEditarReserva = ({ reserva, habitaciones, clientes, onClose, onSave }: any) => {
  const [formData, setFormData] = useState({ habitacion_id: reserva.habitacion_id, fecha_entrada: reserva.fecha_entrada, fecha_salida: reserva.fecha_salida, num_huespedes: reserva.num_huespedes });
  const [total, setTotal] = useState(reserva.total); const [error, setError] = useState(''); const cliente = clientes.find((c:any) => c.id === reserva.usuario_id);
  useEffect(() => { const h = habitaciones.find((x:any)=>x.id===formData.habitacion_id); if(h && formData.fecha_entrada && formData.fecha_salida) { const dias = Math.ceil((new Date(formData.fecha_salida + 'T00:00:00').getTime() - new Date(formData.fecha_entrada + 'T00:00:00').getTime())/(1000*60*60*24)); setTotal(dias > 0 ? dias * h.precio_noche : 0); } }, [formData, habitaciones]);
  const handleSubmit = async (e:any) => { e.preventDefault(); setError(''); try { if(new Date(formData.fecha_salida) <= new Date(formData.fecha_entrada)) throw new Error("Fechas inválidas"); const {data} = await supabase.functions.invoke('check-room-availability', { body: {...formData, reserva_id_excluir: reserva.id} }); if(!data?.data?.available) throw new Error('No disponible en esas fechas'); await supabase.from('reservas').update({...formData, total}).eq('id', reserva.id); onSave(); } catch(err:any) { setError(err.message); } };
  return ( <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"> <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl"> <h2 className="font-bold text-xl mb-2 text-slate-900">Editar Reserva</h2> <p className="text-sm text-slate-500 mb-4">Cliente: {cliente?.nombre || 'Desconocido'}</p> <form onSubmit={handleSubmit} className="space-y-4"> {error && <p className="text-red-700 bg-red-50 p-3 rounded-lg text-sm flex gap-2"><AlertCircle className="h-4 w-4"/>{error}</p>} <div><label className="block text-sm font-medium text-slate-700 mb-1">Habitación</label><select value={formData.habitacion_id} onChange={e=>setFormData({...formData, habitacion_id:e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg">{habitaciones.map((h:any)=><option key={h.id} value={h.id}>{h.numero} - {h.tipo} (${h.precio_noche})</option>)}</select></div> <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">Entrada</label><input type="date" value={formData.fecha_entrada} onChange={e=>setFormData({...formData, fecha_entrada:e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg"/></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Salida</label><input type="date" value={formData.fecha_salida} onChange={e=>setFormData({...formData, fecha_salida:e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg"/></div></div> <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center"><span className="text-sm text-slate-600">Nuevo Total:</span><span className="font-bold text-amber-600 text-lg">${total.toLocaleString('es-AR')}</span></div> <div className="flex gap-3 pt-2"><button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg font-medium transition-colors">Guardar</button><button type="button" onClick={onClose} className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg hover:bg-slate-300 font-medium">Cancelar</button></div> </form> </div> </div> )
}

// --- GESTIÓN DE OPERADORES (TEAL + SHIELD) ---
const GestionOperadores = ({ operadores, onRecargar }: any) => {
  const [showCreate, setShowCreate] = useState(false); const [showEdit, setShowEdit] = useState(false); const [opEdit, setOpEdit] = useState<any>(null);
  const [form, setForm] = useState({email:'', nombre:'', password:''}); const [error, setError] = useState('');
  const submitCreate = async (e:any) => { e.preventDefault(); setError(''); try { const {error} = await supabase.functions.invoke('create-user', {body:{...form, rol:'operador'}}); if(error) throw error; setForm({email:'',nombre:'',password:''}); setShowCreate(false); onRecargar(); } catch(err:any) { setError(err.message); }};
  const handleEditClick = (op: any) => { setOpEdit(op); setShowEdit(true); }
  const handleDelete = async (id: string) => { if (!confirm('¿Estás seguro?')) return; try { await supabase.from('usuarios').delete().eq('id', id); onRecargar(); } catch (error) { console.error('Error:', error) } }
  return ( <div> <div className="mb-6"><button onClick={()=>{setError('');setShowCreate(true)}} className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-2 shadow-lg transition-colors w-full md:w-auto justify-center"><Plus className="h-5 w-5"/>Nuevo Operador</button></div> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{operadores.map((o:any)=><div key={o.id} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow"><h3 className="font-bold text-lg text-slate-900">{o.nombre}</h3><p className="text-sm text-slate-600 mb-4">{o.email}</p><div className="flex gap-2"><button onClick={()=>handleEditClick(o)} className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 rounded-lg text-sm font-medium transition-colors">Editar</button><button onClick={()=>handleDelete(o.id)} className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg text-sm font-medium transition-colors">Eliminar</button></div></div>)}</div> {showCreate && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl"><h2 className="text-2xl font-bold mb-4">Nuevo Operador</h2><form onSubmit={submitCreate} className="space-y-4">{error && <p className="text-red-700 bg-red-50 p-2 rounded text-sm">{error}</p>}<input placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg" required/><input placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg" required/><input type="password" placeholder="Pass" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg" required minLength={6}/><div className="flex gap-2 pt-2"><button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg font-medium">Crear</button><button type="button" onClick={()=>setShowCreate(false)} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 rounded-lg font-medium">Cancelar</button></div></form></div></div>} {showEdit && opEdit && <ModalEditarOperador operador={opEdit} onClose={()=>setShowEdit(false)} onSave={()=>{setShowEdit(false);onRecargar()}} />} </div> )
}

const ModalEditarOperador = ({ operador, onClose, onSave }: any) => {
  const { user: adminUser } = useAuth(); const [formData, setFormData] = useState({ nombre: operador.nombre, email: operador.email, rol: operador.rol });
  const [pass, setPass] = useState(''); const [adminPass, setAdminPass] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const handleSubmit = async (e: any) => { e.preventDefault(); setLoading(true); setError(''); try { const { error: funcError } = await supabase.functions.invoke('admin-update-user', { body: { admin_id: adminUser?.id, admin_password: adminPass, target_user_id: operador.id, ...formData, nueva_password: pass || undefined } }); if (funcError) { const err = await funcError.context.json(); throw new Error(err.error.message); } onSave(); } catch (e: any) { setError(e.message); } finally { setLoading(false); } };
  return ( <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl"><h2 className="text-2xl font-bold mb-4">Editar Operador</h2><form onSubmit={handleSubmit} className="space-y-4">{error && <p className="text-red-700 bg-red-50 p-2 rounded text-sm">{error}</p>}<input value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg" placeholder="Nombre"/><input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg" placeholder="Email"/><select value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value as any})} className="w-full border border-slate-300 p-2 rounded-lg"><option value="operador">Operador</option><option value="administrador">Administrador</option></select><input type="password" placeholder="Nueva contraseña (opcional)" value={pass} onChange={e => setPass(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg"/><div className="bg-amber-50 p-3 rounded-lg border border-amber-200"><label className="text-sm font-bold text-amber-800 flex gap-2 items-center mb-1"><Shield className="h-4 w-4"/>Confirmar con TU contraseña:</label><input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} className="w-full border border-amber-300 p-2 rounded-lg bg-white" required/></div><div className="flex gap-2 pt-2"><button disabled={loading} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg font-medium disabled:opacity-50">Guardar</button><button type="button" onClick={onClose} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 rounded-lg font-medium disabled:opacity-50">Cancelar</button></div></form></div></div> )
}