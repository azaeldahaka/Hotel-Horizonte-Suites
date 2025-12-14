import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Habitacion } from '@/types'
import { Calendar, Users, CreditCard, AlertCircle, CheckCircle, Loader2, Clock, ShieldCheck, ArrowRight } from 'lucide-react'
import { logActividad } from '@/utils/loggers'

// Función auxiliar para obtener la fecha local en formato YYYY-MM-DD
const getTodayLocalString = () => {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = (hoy.getMonth() + 1).toString().padStart(2, '0');
  const d = hoy.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const CrearReserva = () => {
  const { id } = useParams()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [habitacion, setHabitacion] = useState<Habitacion | null>(null)
  
  // Estados para fechas y HORAS
  const [fechaEntrada, setFechaEntrada] = useState('')
  const [horaEntrada, setHoraEntrada] = useState('14:00') // Hora default Check-in
  
  const [fechaSalida, setFechaSalida] = useState('')
  const [horaSalida, setHoraSalida] = useState('11:00') // Hora default Check-out
  
  const [numHuespedes, setNumHuespedes] = useState(1)
  const [metodoPago, setMetodoPago] = useState<'tarjeta' | 'efectivo' | 'transferencia'>('tarjeta')
  
  const [datosTarjeta, setDatosTarjeta] = useState({ numero: '', titular: '', expiracion: '', cvv: '' })
  
  const [paso, setPaso] = useState<'detalles' | 'pago' | 'confirmacion'>('detalles')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [noches, setNoches] = useState(0)

  // Fecha mínima de salida (al menos 1 día después de la entrada)
  const getMinFechaSalida = () => {
    if (!fechaEntrada) return getTodayLocalString();
    try {
      const [y, m, d] = fechaEntrada.split('-').map(Number);
      const entradaDate = new Date(y, m - 1, d);
      entradaDate.setDate(entradaDate.getDate() + 1);
      return entradaDate.toISOString().split('T')[0];
    } catch (e) { return getTodayLocalString(); }
  }

  useEffect(() => {
    if (id && !authLoading) cargarHabitacion()
  }, [id, authLoading])

  useEffect(() => {
    calcularTotal()
  }, [fechaEntrada, fechaSalida, habitacion])

  const cargarHabitacion = async () => {
    try {
      const { data } = await supabase.from('habitaciones').select('*').eq('id', id).maybeSingle()
      if (data) setHabitacion(data)
    } catch (error) { console.error('Error:', error) }
  }

  const calcularTotal = () => {
    if (fechaEntrada && fechaSalida && habitacion?.precio_noche) {
      const entrada = new Date(fechaEntrada);
      const salida = new Date(fechaSalida);
      const diffTime = salida.getTime() - entrada.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays > 0) {
        setNoches(diffDays);
        setTotal(diffDays * habitacion.precio_noche);
      } else {
        setNoches(0);
        setTotal(0);
      }
    }
  }

  const validarDisponibilidad = async () => {
    setError('')
    setLoading(true)
    try {
      // Validaciones locales
      if (!fechaEntrada || !fechaSalida) throw new Error('Selecciona las fechas.')
      if (new Date(fechaSalida) <= new Date(fechaEntrada)) throw new Error('La salida debe ser posterior a la entrada.')
      if (numHuespedes < 1 || numHuespedes > (habitacion?.capacidad || 1)) throw new Error(`Máximo ${habitacion?.capacidad} huéspedes.`)

      // Validar con servidor (enviamos solo fechas, la disponibilidad suele ser por día completo)
      const { data } = await supabase.functions.invoke('check-room-availability', {
        body: { habitacion_id: id, fecha_entrada: fechaEntrada, fecha_salida: fechaSalida }
      })
      if (!data?.data?.available) throw new Error('Habitación no disponible en esas fechas.')

      setPaso('pago')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const procesarReserva = async () => {
    setError('')
    setLoading(true)
    try {
      if (metodoPago === 'tarjeta') {
        if (!datosTarjeta.numero || !datosTarjeta.titular || !datosTarjeta.cvv) throw new Error('Datos de tarjeta incompletos')
      }

      // Construimos los timestamps completos (Fecha + Hora)
      const entradaFull = `${fechaEntrada}T${horaEntrada}:00`
      const salidaFull = `${fechaSalida}T${horaSalida}:00`

      // 1. Insertar Reserva
      const { data: reservaData, error: rError } = await supabase.from('reservas').insert([{
        usuario_id: user?.id,
        habitacion_id: id,
        fecha_entrada: entradaFull,
        fecha_salida: salidaFull,
        num_huespedes: numHuespedes,
        estado: 'activa',
        total: total
      }]).select()

      if (rError) throw rError
      const reservaId = reservaData[0]?.id

      // 2. Guardar Pago
      await supabase.from('pagos').insert([{ 
        reserva_id: reservaId, 
        monto: total, 
        metodo_pago: metodoPago, 
        estado: 'completado' 
      }])
      
      // 3. Actualizar estado habitación
      await supabase.from('habitaciones').update({ estado: 'ocupada' }).eq('id', id)

      // 4. Enviar Email de Confirmación
      console.log("Enviando email...");
      await supabase.functions.invoke('send-email', {
        body: {
          email: user?.email,
          nombre: user?.nombre,
          reserva: {
            id: reservaId,
            habitacion_numero: habitacion?.numero,
            habitacion_tipo: habitacion?.tipo,
            fecha_entrada: `${new Date(fechaEntrada).toLocaleDateString('es-ES')} ${horaEntrada}`,
            fecha_salida: `${new Date(fechaSalida).toLocaleDateString('es-ES')} ${horaSalida}`,
            num_huespedes: numHuespedes,
            total: total.toLocaleString('es-ES')
          }
        }
      });

      // 5. NUEVO: Log de Actividad
      await logActividad(
        user?.id,
        'Nueva Reserva Web',
        `Reserva confirmada: Hab. ${habitacion?.numero} - $${total}`,
        'success'
      );

      setPaso('confirmacion')
    } catch (err: any) {
      setError(err.message || 'Error al procesar')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !habitacion) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-teal-600"/></div>

  // Pantalla de Confirmación
  if (paso === 'confirmacion') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center border-t-4 border-teal-500">
          <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">¡Reserva Exitosa!</h2>
          <p className="text-slate-600 mb-8">Tu estancia en Horizonte Suites está confirmada. Te enviamos los detalles por correo.</p>
          <button onClick={() => navigate('/usuario/dashboard')} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all">Ir a Mis Reservas</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Botón Volver */}
        <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-800 mb-6 flex items-center gap-2 font-medium">
          ← Volver atrás
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMNA IZQUIERDA: FORMULARIO (2/3 del ancho) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Indicador de Pasos */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className={`flex items-center gap-2 ${paso === 'detalles' ? 'text-teal-700 font-bold' : 'text-slate-400'}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${paso === 'detalles' ? 'border-teal-600 bg-teal-50' : 'border-slate-300'}`}>1</span>
                  Tu Estadía
                </div>
                <div className="h-px bg-slate-200 flex-1"></div>
                <div className={`flex items-center gap-2 ${paso === 'pago' ? 'text-teal-700 font-bold' : 'text-slate-400'}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${paso === 'pago' ? 'border-teal-600 bg-teal-50' : 'border-slate-300'}`}>2</span>
                  Pago Seguro
                </div>
              </div>

              {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 flex gap-3 items-start"><AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0"/><span>{error}</span></div>}

              {paso === 'detalles' ? (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-900">Elige tus fechas</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Entrada (Fecha + Hora) */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-teal-400 transition-colors cursor-pointer group">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                        <Calendar className="h-3 w-3" /> Llegada
                      </label>
                      <div className="flex flex-col gap-3">
                        <input 
                          type="date" 
                          value={fechaEntrada} 
                          onChange={(e) => setFechaEntrada(e.target.value)} 
                          min={getTodayLocalString()} 
                          className="bg-white w-full outline-none font-medium text-slate-900 p-2 rounded border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500" 
                        />
                        <div className="flex items-center gap-2 text-sm text-slate-600 bg-white p-2 rounded border border-slate-200">
                           <Clock className="h-4 w-4 text-slate-400" />
                           <input 
                            type="time" 
                            value={horaEntrada} 
                            onChange={(e) => setHoraEntrada(e.target.value)} 
                            className="bg-transparent w-full outline-none font-medium text-slate-900" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Salida (Fecha + Hora) */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-teal-400 transition-colors cursor-pointer group">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                        <Calendar className="h-3 w-3" /> Salida
                      </label>
                      <div className="flex flex-col gap-3">
                        <input 
                          type="date" 
                          value={fechaSalida} 
                          onChange={(e) => setFechaSalida(e.target.value)} 
                          min={getMinFechaSalida()} 
                          disabled={!fechaEntrada}
                          className="bg-white w-full outline-none font-medium text-slate-900 p-2 rounded border border-slate-200 focus:border-teal-500 disabled:bg-slate-100 disabled:text-slate-400" 
                        />
                         <div className="flex items-center gap-2 text-sm text-slate-600 bg-white p-2 rounded border border-slate-200">
                           <Clock className="h-4 w-4 text-slate-400" />
                           <input 
                            type="time" 
                            value={horaSalida} 
                            onChange={(e) => setHoraSalida(e.target.value)} 
                            className="bg-transparent w-full outline-none font-medium text-slate-900" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700">Huéspedes</label>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setNumHuespedes(Math.max(1, numHuespedes - 1))} className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100">-</button>
                      <span className="text-xl font-bold w-8 text-center">{numHuespedes}</span>
                      <button onClick={() => setNumHuespedes(Math.min(habitacion.capacidad, numHuespedes + 1))} className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100">+</button>
                      <span className="text-sm text-slate-500 ml-2">Máximo {habitacion.capacidad} personas</span>
                    </div>
                  </div>

                  <button onClick={validarDisponibilidad} disabled={loading || !fechaEntrada || !fechaSalida} className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold text-lg hover:bg-teal-700 transition-all shadow-lg shadow-teal-200 disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="animate-spin"/> : <>Continuar <ArrowRight className="h-5 w-5"/></>}
                  </button>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <h2 className="text-xl font-bold text-slate-900">¿Cómo quieres pagar?</h2>
                  
                  <div className="grid gap-3">
                    {['tarjeta', 'transferencia', 'efectivo'].map((m) => (
                      <div key={m} onClick={() => setMetodoPago(m as any)} className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-4 transition-all ${metodoPago === m ? 'border-teal-600 bg-teal-50' : 'border-slate-200 hover:border-slate-300'}`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${metodoPago === m ? 'border-teal-600' : 'border-slate-300'}`}>
                          {metodoPago === m && <div className="w-2.5 h-2.5 bg-teal-600 rounded-full"/>}
                        </div>
                        <span className="capitalize font-medium text-slate-700">{m}</span>
                        {m === 'tarjeta' && <CreditCard className="ml-auto h-5 w-5 text-slate-400"/>}
                        {m === 'efectivo' && <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Ahorra 10%</span>}
                      </div>
                    ))}
                  </div>

                  {metodoPago === 'tarjeta' && (
                    <div className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-200">
                      <input placeholder="Número de tarjeta" className="w-full p-3 border rounded-lg bg-white" onChange={e => setDatosTarjeta({...datosTarjeta, numero: e.target.value})} />
                      <div className="grid grid-cols-2 gap-4">
                        <input placeholder="MM/AA" className="w-full p-3 border rounded-lg bg-white" onChange={e => setDatosTarjeta({...datosTarjeta, expiracion: e.target.value})} />
                        <input placeholder="CVV" className="w-full p-3 border rounded-lg bg-white" onChange={e => setDatosTarjeta({...datosTarjeta, cvv: e.target.value})} />
                      </div>
                      <input placeholder="Nombre del titular" className="w-full p-3 border rounded-lg bg-white" onChange={e => setDatosTarjeta({...datosTarjeta, titular: e.target.value})} />
                    </div>
                  )}
                  
                  {metodoPago === 'transferencia' && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-sm">
                      <p className="font-bold mb-1">Datos para transferir:</p>
                      <p>Banco: Horizonte Bank</p>
                      <p>CBU: 000000310004832</p>
                      <p>Alias: HORIZONTE.SUITES</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button onClick={() => setPaso('detalles')} className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-xl">Volver</button>
                    <button onClick={procesarReserva} disabled={loading} className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 shadow-lg shadow-teal-200 disabled:opacity-50 flex justify-center gap-2">
                      {loading ? <Loader2 className="animate-spin"/> : 'Confirmar y Pagar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: RESUMEN (STICKY) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 sticky top-24">
              <div className="aspect-video rounded-xl overflow-hidden mb-4 bg-slate-100 relative">
                <img 
                  src={habitacion.imagen_url || "/images/rooms/room-1.jpg"} 
                  alt="Habitación" 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  Ref: {habitacion.numero}
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-1">{habitacion.tipo}</p>
                <h2 className="text-2xl font-serif font-bold text-slate-900">Habitación {habitacion.numero}</h2>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Precio por noche</span>
                  <span className="font-medium">${habitacion.precio_noche.toLocaleString('es-ES')}</span>
                </div>
                {total > 0 && (
                   <div className="flex justify-between text-sm text-green-600">
                     <span>Estadía</span>
                     <span className="font-medium">x {noches} noches</span>
                   </div>
                )}
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Cargos por servicio</span>
                  <span className="font-medium">$0</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-between items-end">
                <span className="font-bold text-slate-900">Total</span>
                <span className="text-3xl font-bold text-teal-700">${total.toLocaleString('es-ES')}</span>
              </div>
              
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="h-4 w-4" />
                Pago 100% Seguro y Encriptado
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}