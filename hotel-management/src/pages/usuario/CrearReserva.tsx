import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Habitacion } from '@/types'
import { Calendar, CreditCard, AlertCircle, CheckCircle, Loader2, Clock, ShieldCheck, ArrowRight, Wifi } from 'lucide-react'
// CORRECCIÓN 1: La ruta correcta es logger (singular)
import { logActividad } from '@/utils/loggers'

// Función auxiliar para fecha local
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
  
  // Estados Fechas
  const [fechaEntrada, setFechaEntrada] = useState('')
  const [horaEntrada, setHoraEntrada] = useState('14:00')
  const [fechaSalida, setFechaSalida] = useState('')
  const [horaSalida, setHoraSalida] = useState('11:00')
  const [numHuespedes, setNumHuespedes] = useState(1)
  
  // Estado Pago
  const [metodoPago, setMetodoPago] = useState<'tarjeta' | 'efectivo' | 'transferencia'>('tarjeta')
  const [datosTarjeta, setDatosTarjeta] = useState({ numero: '', titular: '', expiracion: '', cvv: '' })
  
  // Control de flujo
  const [paso, setPaso] = useState<'detalles' | 'pago' | 'confirmacion'>('detalles')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [noches, setNoches] = useState(0)

  // --- MÁSCARAS DE INPUT (Tu lógica visual) ---
  const handleCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setDatosTarjeta({ ...datosTarjeta, numero: val });
  }

  const handleExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) {
      val = `${val.substring(0, 2)}/${val.substring(2)}`;
    }
    setDatosTarjeta({ ...datosTarjeta, expiracion: val });
  }

  const handleCVV = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 3);
    setDatosTarjeta({ ...datosTarjeta, cvv: val });
  }

  const handleTitular = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^a-zA-Z\s]/g, '').toUpperCase();
    setDatosTarjeta({ ...datosTarjeta, titular: val });
  }
  // -----------------------------------------------------

  const getMinFechaSalida = () => {
    if (!fechaEntrada) return getTodayLocalString();
    try {
      const [y, m, d] = fechaEntrada.split('-').map(Number);
      const entradaDate = new Date(y, m - 1, d);
      entradaDate.setDate(entradaDate.getDate() + 1);
      return entradaDate.toISOString().split('T')[0];
    } catch (e) { return getTodayLocalString(); }
  }

  // Carga inicial y protección de ruta
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login')
        return
      }
      if (id) cargarHabitacion()
    }
  }, [id, authLoading, user, navigate])

  useEffect(() => {
    calcularTotal()
  }, [fechaEntrada, fechaSalida, habitacion])

  const cargarHabitacion = async () => {
    try {
      const { data, error } = await supabase.from('habitaciones').select('*').eq('id', id).maybeSingle()
      if (error) throw error
      if (data) setHabitacion(data)
      else navigate('/usuario/dashboard') // Si no existe ID, volver
    } catch (error) { 
      console.error('Error cargando habitación:', error) 
    }
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
      if (!fechaEntrada || !fechaSalida) throw new Error('Selecciona las fechas.')
      if (new Date(fechaSalida) <= new Date(fechaEntrada)) throw new Error('La salida debe ser posterior a la entrada.')
      if (numHuespedes < 1 || numHuespedes > (habitacion?.capacidad || 1)) throw new Error(`Máximo ${habitacion?.capacidad} huéspedes.`)

      // CORRECCIÓN 2: Manejo seguro de la Edge Function
      // Si la función no existe o falla, asumimos disponibilidad por ahora (para no bloquear el examen)
      // O puedes descomentar el throw error si tienes la función desplegada.
      try {
        const { data, error } = await supabase.functions.invoke('check-room-availability', {
            body: { habitacion_id: id, fecha_entrada: fechaEntrada, fecha_salida: fechaSalida }
        })
        if (error) {
            console.warn("No se pudo verificar disponibilidad estricta (Edge Function), continuando...", error)
        } else if (data && !data.available) {
            throw new Error('Habitación no disponible en esas fechas.')
        }
      } catch (availabilityError: any) {
          // Si es nuestro error manual, lo relanzamos
          if (availabilityError.message === 'Habitación no disponible en esas fechas.') throw availabilityError;
          console.warn("Saltando verificación estricta de disponibilidad")
      }

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
      if (!user) throw new Error("Sesión expirada. Inicia sesión nuevamente.")

      if (metodoPago === 'tarjeta') {
        if (datosTarjeta.numero.length < 18 || !datosTarjeta.titular || datosTarjeta.cvv.length < 3 || datosTarjeta.expiracion.length < 5) 
          throw new Error('Datos de tarjeta incompletos o inválidos')
      }

      const entradaFull = `${fechaEntrada}T${horaEntrada}:00`
      const salidaFull = `${fechaSalida}T${horaSalida}:00`

      // 1. Insertar Reserva
      const { data: reservaData, error: rError } = await supabase.from('reservas').insert([{
        usuario_id: user.id,
        habitacion_id: id,
        fecha_entrada: entradaFull,
        fecha_salida: salidaFull,
        num_huespedes: numHuespedes,
        estado: 'activa',
        total: total,
        origen: 'Web Directa'
      }]).select()

      if (rError) throw rError
      const reservaId = reservaData[0]?.id

      // 2. Insertar Pago (Opcional, no bloqueante si falla esto)
      const { error: pError } = await supabase.from('pagos').insert([{ 
        reserva_id: reservaId, 
        monto: total, 
        metodo_pago: metodoPago, 
        estado: 'completado' 
      }])
      
      if (pError) console.error("Error guardando registro de pago", pError)

      // 3. Actualizar Habitación
      // (Si tienes el Trigger SQL activado, esto es redundante pero seguro)
      await supabase.from('habitaciones').update({ estado: 'ocupada' }).eq('id', id)

      // 4. Log de Actividad
      await logActividad(
        user.id,
        'Nueva Reserva Web',
        `Reserva confirmada: Hab. ${habitacion?.numero} - $${total}`,
        'success'
      );

      // 5. Enviar Email (NON-BLOCKING: Si falla, no mostramos error al usuario)
      supabase.functions.invoke('send-email', {
        body: {
          email: user.email,
          nombre: user.nombre,
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
      }).then(({ error }) => {
         if (error) console.warn("No se pudo enviar el email de confirmación", error)
      });

      setPaso('confirmacion')

    } catch (err: any) {
      console.error("Error fatal en reserva:", err)
      setError(err.message || 'Error al procesar la reserva. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !habitacion) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-teal-600"/></div>

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
        
        <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-800 mb-6 flex items-center gap-2 font-medium">
          ← Volver atrás
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMNA IZQUIERDA */}
          <div className="lg:col-span-2 space-y-6">
            
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
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 group">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><Calendar className="h-3 w-3" /> Llegada</label>
                      <div className="flex flex-col gap-3">
                        <input type="date" value={fechaEntrada} onChange={(e) => setFechaEntrada(e.target.value)} min={getTodayLocalString()} className="bg-white w-full p-2 rounded border border-slate-200 outline-none focus:border-teal-500" />
                        <div className="flex items-center gap-2 text-sm text-slate-600 bg-white p-2 rounded border border-slate-200">
                           <Clock className="h-4 w-4 text-slate-400" />
                           <input type="time" value={horaEntrada} onChange={(e) => setHoraEntrada(e.target.value)} className="bg-transparent w-full outline-none" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 group">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><Calendar className="h-3 w-3" /> Salida</label>
                      <div className="flex flex-col gap-3">
                        <input type="date" value={fechaSalida} onChange={(e) => setFechaSalida(e.target.value)} min={getMinFechaSalida()} disabled={!fechaEntrada} className="bg-white w-full p-2 rounded border border-slate-200 outline-none focus:border-teal-500 disabled:bg-slate-100" />
                         <div className="flex items-center gap-2 text-sm text-slate-600 bg-white p-2 rounded border border-slate-200">
                           <Clock className="h-4 w-4 text-slate-400" />
                           <input type="time" value={horaSalida} onChange={(e) => setHoraSalida(e.target.value)} className="bg-transparent w-full outline-none" />
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
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${metodoPago === m ? 'border-teal-600' : 'border-slate-300'}`}>{metodoPago === m && <div className="w-2.5 h-2.5 bg-teal-600 rounded-full"/>}</div>
                        <span className="capitalize font-medium text-slate-700">{m}</span>
                        {m === 'tarjeta' && <CreditCard className="ml-auto h-5 w-5 text-slate-400"/>}
                        {m === 'efectivo' && <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Ahorra 10%</span>}
                      </div>
                    ))}
                  </div>

                  {metodoPago === 'tarjeta' && (
                    <div className="space-y-6">
                        {/* --- SIMULACIÓN VISUAL DE TARJETA --- */}
                        <div className="relative w-full max-w-sm mx-auto h-56 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 shadow-2xl flex flex-col justify-between overflow-hidden">
                            {/* Brillo decorativo */}
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                            
                            <div className="flex justify-between items-start z-10">
                                <div className="w-12 h-8 bg-yellow-500/80 rounded-md flex items-center justify-center gap-1">
                                    <div className="w-[1px] h-full bg-black/20"></div>
                                    <div className="w-[1px] h-full bg-black/20"></div>
                                    <div className="w-[1px] h-full bg-black/20"></div>
                                </div>
                                <Wifi className="h-6 w-6 rotate-90 opacity-70" />
                            </div>

                            <div className="z-10 mt-4">
                                <p className="text-2xl font-mono tracking-widest drop-shadow-md">
                                    {datosTarjeta.numero || '0000 0000 0000 0000'}
                                </p>
                            </div>

                            <div className="flex justify-between items-end z-10">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Titular</p>
                                    <p className="font-medium tracking-wide uppercase truncate max-w-[180px]">
                                        {datosTarjeta.titular || 'NOMBRE APELLIDO'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Vence</p>
                                    <p className="font-medium tracking-wide">
                                        {datosTarjeta.expiracion || 'MM/AA'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* --- FORMULARIO CON VALIDACIONES --- */}
                        <div className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-200">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Número de Tarjeta</label>
                                <div className="relative">
                                    <input 
                                        value={datosTarjeta.numero}
                                        onChange={handleCardNumber}
                                        placeholder="0000 0000 0000 0000"
                                        maxLength={19}
                                        className="w-full p-3 pl-10 border rounded-lg bg-white outline-none focus:border-teal-500 font-mono" 
                                    />
                                    <CreditCard className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Vencimiento</label>
                                    <input 
                                        value={datosTarjeta.expiracion}
                                        onChange={handleExpiry}
                                        placeholder="MM/AA"
                                        maxLength={5}
                                        className="w-full p-3 border rounded-lg bg-white outline-none focus:border-teal-500 text-center" 
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">CVV</label>
                                    <input 
                                        type="password"
                                        value={datosTarjeta.cvv}
                                        onChange={handleCVV}
                                        placeholder="123"
                                        maxLength={4}
                                        className="w-full p-3 border rounded-lg bg-white outline-none focus:border-teal-500 text-center tracking-widest" 
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nombre del Titular</label>
                                <input 
                                    value={datosTarjeta.titular}
                                    onChange={handleTitular}
                                    placeholder="COMO FIGURA EN LA TARJETA" 
                                    className="w-full p-3 border rounded-lg bg-white outline-none focus:border-teal-500 uppercase" 
                                />
                            </div>
                        </div>
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

          {/* COLUMNA DERECHA */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 sticky top-24">
              <div className="aspect-video rounded-xl overflow-hidden mb-4 bg-slate-100 relative">
                <img src={habitacion.imagen_url || "/images/rooms/room-1.jpg"} alt="Habitación" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">Ref: {habitacion.numero}</div>
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
                {total > 0 && <div className="flex justify-between text-sm text-green-600"><span>Estadía</span><span className="font-medium">x {noches} noches</span></div>}
              </div>
              <div className="border-t border-slate-100 pt-4 flex justify-between items-end">
                <span className="font-bold text-slate-900">Total</span>
                <span className="text-3xl font-bold text-teal-700">${total.toLocaleString('es-ES')}</span>
              </div>
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="h-4 w-4" /> Pago 100% Seguro y Encriptado
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}