import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Habitacion, Usuario, Reserva } from '@/types'
import { Calendar, Users, CheckCircle, XCircle, Clock, MessageSquare, Send, X, Mail, User as UserIcon, Bed, Edit, RefreshCw, AlertCircle, Check, Filter } from 'lucide-react'

export const OperadorDashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'reservas' | 'consultas'>('reservas')
  
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([])
  const [clientes, setClientes] = useState<Usuario[]>([])
  const [consultas, setConsultas] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const resPromise = supabase.from('reservas').select('*').order('fecha_reserva', { ascending: false })
      const habPromise = supabase.from('habitaciones').select('*').order('numero')
      const cliPromise = supabase.from('usuarios').select('*').eq('rol', 'usuario')
      const consPromise = supabase.from('consultas').select('*').order('fecha_consulta', { ascending: false })

      const [resData, habData, cliData, consData] = await Promise.all([
        resPromise, habPromise, cliPromise, consPromise
      ])

      setReservas(resData.data || [])
      setHabitaciones(habData.data || [])
      setClientes(cliData.data || [])
      setConsultas(consData.data || [])

    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">
            Panel de Operador
          </h1>
          <p className="text-slate-600">Gestión operativa diaria</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-200 pb-1">
          <button
            onClick={() => setActiveTab('reservas')}
            className={`px-4 py-3 text-sm md:text-base font-medium transition-colors flex items-center gap-2 rounded-t-lg ${
              activeTab === 'reservas'
                ? 'bg-white text-teal-600 border-b-2 border-teal-600 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="h-5 w-5" />
            Reservas
            <span className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded-full ml-2">
              {reservas.filter(r => r.estado === 'activa').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('consultas')}
            className={`px-4 py-3 text-sm md:text-base font-medium transition-colors flex items-center gap-2 rounded-t-lg ${
              activeTab === 'consultas'
                ? 'bg-white text-teal-600 border-b-2 border-teal-600 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            Consultas
            {consultas.filter(c => c.estado === 'pendiente').length > 0 && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full ml-2 animate-pulse">
                {consultas.filter(c => c.estado === 'pendiente').length}
              </span>
            )}
          </button>
        </div>

        {/* Contenido */}
        {activeTab === 'reservas' && (
          <ListaReservas 
            reservas={reservas} 
            habitaciones={habitaciones} 
            clientes={clientes}
            onRecargar={cargarDatos} 
          />
        )}
        
        {activeTab === 'consultas' && (
          <ListaConsultas 
            consultas={consultas} 
            clientes={clientes}
            onRecargar={cargarDatos} 
          />
        )}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// LISTA DE RESERVAS (CON FILTROS Y EDICIÓN)
// ------------------------------------------------------------------
const ListaReservas = ({ 
  reservas, 
  habitaciones, 
  clientes, 
  onRecargar 
}: { 
  reservas: Reserva[], 
  habitaciones: Habitacion[], 
  clientes: Usuario[], 
  onRecargar: () => void 
}) => {
  const [showModal, setShowModal] = useState(false)
  const [reservaAEditar, setReservaAEditar] = useState<Reserva | null>(null)

  // --- ESTADOS DE FILTROS ---
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [filtroNombre, setFiltroNombre] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [reservasFiltradas, setReservasFiltradas] = useState(reservas)

  const tiposDeHabitacion = [...new Set(habitaciones.map(h => h.tipo))];

  // --- LÓGICA DE FILTRADO (Igual que Admin) ---
  useEffect(() => {
    let res = reservas;
    
    // Filtro Fecha Inicio
    if (fechaInicio) {
      const [y, m, d] = fechaInicio.split('-').map(Number);
      const tsIni = new Date(y, m - 1, d, 0, 0, 0).getTime();
      res = res.filter((r) => new Date(r.fecha_reserva).getTime() >= tsIni);
    }
    // Filtro Fecha Fin
    if (fechaFin) {
      const [y, m, d] = fechaFin.split('-').map(Number);
      const tsFin = new Date(y, m - 1, d, 23, 59, 59).getTime();
      res = res.filter((r) => new Date(r.fecha_reserva).getTime() <= tsFin);
    }
    // Filtro Nombre
    if (filtroNombre) {
      res = res.filter((r) => {
        const c = clientes.find((u) => u.id === r.usuario_id);
        return c?.nombre.toLowerCase().includes(filtroNombre.toLowerCase());
      });
    }
    // Filtro Tipo
    if (filtroTipo) {
      res = res.filter((r) => {
        const h = habitaciones.find((ha) => ha.id === r.habitacion_id);
        return h?.tipo === filtroTipo;
      });
    }

    setReservasFiltradas(res);
  }, [reservas, fechaInicio, fechaFin, filtroNombre, filtroTipo, clientes, habitaciones]);

  const handleLimpiar = () => {
    setFechaInicio(''); setFechaFin(''); setFiltroNombre(''); setFiltroTipo('');
  };

  const handleEstado = async (id: string, nuevoEstado: string) => {
    const accion = nuevoEstado === 'completada' ? 'finalizar (check-out)' : 'cancelar';
    if (!confirm(`¿Estás seguro de que deseas ${accion} esta reserva?`)) return
    try {
      await supabase.from('reservas').update({ estado: nuevoEstado }).eq('id', id)
      onRecargar()
    } catch (error) { console.error('Error:', error) }
  }

  const handleEditar = (reserva: Reserva) => {
    setReservaAEditar(reserva)
    setShowModal(true)
  }

  return (
    <>
      {/* --- BARRA DE FILTROS --- */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-slate-200">
        <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold border-b border-slate-100 pb-2">
          <Filter className="h-4 w-4 text-teal-600" />
          Filtros de Búsqueda
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Desde (Reserva)</label>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hasta (Reserva)</label>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Huésped</label>
            <input type="text" placeholder="Buscar..." value={filtroNombre} onChange={(e) => setFiltroNombre(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo Hab.</label>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm bg-white">
              <option value="">Todos</option>
              {tiposDeHabitacion.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="md:col-span-4 flex gap-2">
            <button onClick={handleLimpiar} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium text-sm transition-colors">Limpiar Filtros</button>
          </div>
        </div>
      </div>

      {/* --- LISTA DE RESERVAS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reservasFiltradas.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500">No se encontraron reservas con esos filtros.</p>
          </div>
        )}

        {reservasFiltradas.map((reserva) => {
          const cliente = clientes.find(c => c.id === reserva.usuario_id)
          const habitacion = habitaciones.find(h => h.id === reserva.habitacion_id)

          return (
            <div key={reserva.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full">
              
              <div className="flex justify-between items-start gap-3 mb-4">
                <div className="flex items-start gap-3 overflow-hidden">
                  <div className="bg-slate-100 p-2 rounded-full flex-shrink-0">
                    <UserIcon className="h-6 w-6 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg text-slate-900 truncate">
                      {cliente ? cliente.nombre : 'Cliente Desconocido'}
                    </h3>
                    <p className="text-sm text-slate-500 truncate">
                      {cliente ? cliente.email : 'Email no disponible'}
                    </p>
                  </div>
                </div>
                
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex-shrink-0 ${
                  reserva.estado === 'activa' ? 'bg-green-100 text-green-700' :
                  reserva.estado === 'completada' ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {reserva.estado}
                </span>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 mb-4 space-y-3 text-sm flex-grow">
                <div className="flex items-center gap-2 text-slate-700">
                  <Bed className="h-4 w-4 text-teal-600 flex-shrink-0" />
                  <span className="font-medium truncate">
                    {habitacion ? `Hab. ${habitacion.numero} - ${habitacion.tipo}` : 'Habitación no encontrada'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {new Date(reserva.fecha_entrada).toLocaleDateString('es-ES')} 
                    {' ➔ '} 
                    {new Date(reserva.fecha_salida).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span>{reserva.num_huespedes} huéspedes</span>
                </div>
                <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-slate-500">Total:</span>
                  <span className="text-lg font-bold text-teal-600">${reserva.total.toLocaleString('es-ES')}</span>
                </div>
              </div>

              {reserva.estado === 'activa' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-auto">
                  <button onClick={() => handleEstado(reserva.id, 'completada')} className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm">
                    <CheckCircle className="h-4 w-4" /> <span className="sm:hidden lg:inline">Check-out</span>
                  </button>
                  <button onClick={() => handleEditar(reserva)} className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm">
                    <Edit className="h-4 w-4" /> <span className="sm:hidden lg:inline">Editar</span>
                  </button>
                  <button onClick={() => handleEstado(reserva.id, 'cancelada')} className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm">
                    <XCircle className="h-4 w-4" /> <span className="sm:hidden lg:inline">Cancelar</span>
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {showModal && reservaAEditar && <ModalEditarReserva reserva={reservaAEditar} habitaciones={habitaciones} clientes={clientes} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); onRecargar(); }} />}
    </>
  )
}

// ------------------------------------------------------------------
// MODAL EDITAR RESERVA (Reutilizado del Admin)
// ------------------------------------------------------------------
const ModalEditarReserva = ({ reserva, habitaciones, clientes, onClose, onSave }: any) => {
  const [formData, setFormData] = useState({ habitacion_id: reserva.habitacion_id, fecha_entrada: reserva.fecha_entrada, fecha_salida: reserva.fecha_salida, num_huespedes: reserva.num_huespedes });
  const [total, setTotal] = useState(reserva.total); const [error, setError] = useState(''); const cliente = clientes.find((c:any) => c.id === reserva.usuario_id);
  
  useEffect(() => {
    const h = habitaciones.find((x:any)=>x.id===formData.habitacion_id);
    if(h && formData.fecha_entrada && formData.fecha_salida) {
      const dias = Math.ceil((new Date(formData.fecha_salida + 'T00:00:00').getTime() - new Date(formData.fecha_entrada + 'T00:00:00').getTime())/(1000*60*60*24));
      setTotal(dias > 0 ? dias * h.precio_noche : 0);
    }
  }, [formData, habitaciones]);

  const handleSubmit = async (e:any) => { e.preventDefault(); setError('');
    try {
      if(new Date(formData.fecha_salida) <= new Date(formData.fecha_entrada)) throw new Error("Fechas inválidas");
      const {data} = await supabase.functions.invoke('check-room-availability', { body: {...formData, reserva_id_excluir: reserva.id} });
      if(!data?.data?.available) throw new Error('No disponible en esas fechas');
      await supabase.from('reservas').update({...formData, total}).eq('id', reserva.id); onSave();
    } catch(err:any) { setError(err.message); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"><div className="flex justify-between items-center mb-4"><h2 className="font-bold text-xl text-slate-900">Editar Reserva</h2><button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-6 w-6" /></button></div><p className="text-sm text-slate-500 mb-4">Cliente: {cliente?.nombre || 'Desconocido'}</p><form onSubmit={handleSubmit} className="space-y-4 flex-1">{error && <p className="text-red-700 bg-red-50 p-3 rounded-lg text-sm flex gap-2"><AlertCircle className="h-4 w-4"/>{error}</p>}<div><label className="block text-sm font-medium text-slate-700 mb-1">Habitación</label><select value={formData.habitacion_id} onChange={e=>setFormData({...formData, habitacion_id:e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg">{habitaciones.map((h:any)=><option key={h.id} value={h.id}>{h.numero} - {h.tipo} (${h.precio_noche})</option>)}</select></div><div className="grid grid-cols-2 gap-2"><div><label className="block text-sm font-medium text-slate-700 mb-1">Entrada</label><input type="date" value={formData.fecha_entrada} onChange={e=>setFormData({...formData, fecha_entrada:e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg"/></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Salida</label><input type="date" value={formData.fecha_salida} onChange={e=>setFormData({...formData, fecha_salida:e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg"/></div></div><div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center"><span className="text-sm text-slate-600">Nuevo Total:</span><span className="font-bold text-teal-600 text-lg">${total.toLocaleString('es-ES')}</span></div><div className="flex gap-3 pt-2"><button type="submit" className="flex-1 bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 font-medium">Guardar</button><button type="button" onClick={onClose} className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg hover:bg-slate-300 font-medium">Cancelar</button></div></form></div></div>
  )
}

// --- GESTIÓN DE CONSULTAS (SE MANTIENE IGUAL) ---
const ListaConsultas = ({ consultas, clientes, onRecargar }: any) => {
  const [consultaSeleccionada, setConsultaSeleccionada] = useState<any | null>(null)
  const parseMensaje = (mensaje: string) => { try { const data = JSON.parse(mensaje); if (data && data.type === 'SOLICITUD_CAMBIO_ESTRUCTURADA') return { esEstructurado: true, data: data }; } catch (e) {} return { esEstructurado: false, texto: mensaje }; };

  return (
    <>
      <div className="space-y-4">
        {consultas.length === 0 && <div className="text-center py-12 bg-white rounded-xl border border-slate-200"><Mail className="h-12 w-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No hay consultas pendientes.</p></div>}
        {consultas.map((c: any) => {
          const cli = clientes.find((u: any) => u.id === c.usuario_id); const contenido = parseMensaje(c.mensaje);
          return (
            <div key={c.id} onClick={() => setConsultaSeleccionada(c)} className={`bg-white p-6 rounded-xl border cursor-pointer hover:shadow-md ${c.estado === 'pendiente' ? 'border-l-4 border-l-teal-500' : 'opacity-75'}`}>
              <div className="flex justify-between mb-2"><div><h3 className="font-bold text-slate-900">{c.asunto}</h3><p className="text-sm text-slate-500">De: {cli?.nombre}</p></div>{c.estado === 'pendiente' ? <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs">Pendiente</span> : <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Respondida</span>}</div>
              {contenido.esEstructurado ? (<div className="bg-blue-50 p-3 rounded text-blue-800 text-sm flex items-center gap-2"><RefreshCw className="h-4 w-4"/> Solicitud de Cambio: {contenido.data.original.habTipo} ➔ {contenido.data.nuevo.habTipo}</div>) : (<p className="text-slate-700 line-clamp-2">{c.mensaje}</p>)}
            </div>
          )
        })}
      </div>
      {consultaSeleccionada && <ModalResponderConsulta consulta={consultaSeleccionada} cliente={clientes.find((c: any) => c.id === consultaSeleccionada.usuario_id)} onClose={() => setConsultaSeleccionada(null)} onSuccess={() => { setConsultaSeleccionada(null); onRecargar() }} />}
    </>
  )
}

const ModalResponderConsulta = ({ consulta, cliente, onClose, onSuccess }: any) => {
  const [respuesta, setRespuesta] = useState(consulta.respuesta || ''); const [loading, setLoading] = useState(false);
  
  // Intentar parsear solicitud
  let solicitudData = null; try { const parsed = JSON.parse(consulta.mensaje); if (parsed.type === 'SOLICITUD_CAMBIO_ESTRUCTURADA') solicitudData = parsed; } catch (e) {}

  const handleResponder = async (e:any) => { e.preventDefault(); setLoading(true); try { await supabase.from('consultas').update({ respuesta, estado: 'respondida', fecha_respuesta: new Date().toISOString() }).eq('id', consulta.id); onSuccess(); } catch(e) { console.error(e) } finally { setLoading(false) } };
  
  const handleAprobar = async () => { if(!confirm('¿Aprobar cambio?')) return; setLoading(true); try { await supabase.from('reservas').update({ habitacion_id: solicitudData.nuevo.habitacion_id, fecha_entrada: solicitudData.nuevo.entrada, fecha_salida: solicitudData.nuevo.salida, total: solicitudData.nuevo.total }).eq('id', solicitudData.reservaId); await supabase.from('consultas').update({ respuesta: `[SISTEMA] Solicitud APROBADA. Cambios aplicados.`, estado: 'respondida', fecha_respuesta: new Date().toISOString() }).eq('id', consulta.id); onSuccess(); } catch(e:any) { alert(e.message) } finally { setLoading(false) } };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]"><div className="flex justify-between mb-4 border-b pb-2"><h2 className="font-bold text-xl">Responder</h2><button onClick={onClose}><X className="h-5 w-5 text-slate-400"/></button></div><div className="overflow-y-auto flex-1 pr-2">{solicitudData ? (<div className="bg-blue-50 p-4 rounded mb-4"><p className="font-bold text-blue-800 mb-2">Solicitud de Cambio</p><p className="text-sm">Nuevo Total: ${solicitudData.nuevo.total}</p>{consulta.estado === 'pendiente' && <div className="flex gap-2 mt-2"><button onClick={handleAprobar} className="bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"><Check className="h-3 w-3"/> Aprobar</button></div>}</div>) : (<div className="bg-slate-50 p-4 rounded mb-4 text-slate-800 whitespace-pre-wrap">{consulta.mensaje}</div>)}<form onSubmit={handleResponder}><textarea className="w-full border p-3 rounded h-32 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Respuesta..." value={respuesta} onChange={e=>setRespuesta(e.target.value)} required readOnly={consulta.estado==='respondida'}/><div className="flex justify-end gap-2 mt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 rounded">Cerrar</button>{consulta.estado!=='respondida' && <button disabled={loading} className="px-6 py-2 bg-teal-600 text-white rounded flex items-center gap-2"><Send className="h-4 w-4"/> Enviar</button>}</div></form></div></div></div>
  )
}