export interface Usuario {
  id: string
  email: string
  nombre: string
  rol: 'usuario' | 'operador' | 'administrador'
  fecha_creacion?: string
}

export interface Habitacion {
  id: string
  numero: string
  tipo: string
  precio_noche: number
  capacidad: number
  amenidades: string[]
  estado: 'disponible' | 'ocupada' | 'mantenimiento'
  imagen_url?: string
  descripcion?: string
  creado_en?: string
}

export interface Servicio {
  id: string
  nombre: string
  descripcion?: string
  precio?: number
  imagen_url?: string
  disponible: boolean
  creado_en?: string
}

export interface Reserva {
  id: string
  usuario_id: string
  habitacion_id: string
  fecha_entrada: string
  fecha_salida: string
  num_huespedes: number
  estado: 'activa' | 'completada' | 'cancelada'
  total: number
  fecha_reserva?: string
  origen?: string
}

export interface Consulta {
  id: string
  usuario_id: string
  asunto: string
  mensaje: string
  respuesta?: string
  estado: 'pendiente' | 'respondida'
  fecha_consulta?: string
  fecha_respuesta?: string
}

export interface Pago {
  id: string
  reserva_id: string
  monto: number
  metodo_pago: 'tarjeta' | 'efectivo' | 'transferencia'
  estado: 'pendiente' | 'completado' | 'fallido'
  fecha_pago?: string
}

export interface TipoHabitacion {
  id: string
  nombre: string
  descripcion?: string
}

export interface Amenidad {
  id: string
  nombre: string
  icono?: string
}

export interface Actividad {
  id: string
  usuario_id: string
  accion: string
  detalles: string | null
  tipo: 'info' | 'success' | 'warning' | 'alert'
  created_at: string
  usuarios?: { nombre: string } // Para mostrar el nombre en el log
}

