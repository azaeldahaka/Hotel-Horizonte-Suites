import { supabase } from '@/lib/supabase' // <--- ESTA ES LA LÍNEA QUE FALTABA

// Definimos los tipos permitidos para el color del icono
type TipoLog = 'info' | 'success' | 'warning' | 'alert';

export const logActividad = async (
  usuarioId: string | undefined, 
  accion: string, 
  detalles: string, 
  tipo: TipoLog = 'info'
) => {
  // Si no hay usuario (ej. error de sistema), no guardamos o guardamos como anónimo
  if (!usuarioId) {
    console.warn('Intento de log sin usuario:', accion);
    return;
  }

  try {
    const { error } = await supabase.from('historial_actividad').insert([
      {
        usuario_id: usuarioId,
        accion: accion,
        detalles: detalles,
        tipo: tipo
      }
    ]);

    if (error) {
      console.error('Error al guardar log en Supabase:', error.message);
    }
  } catch (err) {
    console.error('Error inesperado en logger:', err);
  }
};