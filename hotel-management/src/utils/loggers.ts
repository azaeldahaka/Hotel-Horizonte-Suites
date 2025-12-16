import { supabase } from '@/lib/supabase'

export const logActividad = async (
  usuario_id: string | undefined, 
  accion: string, 
  detalles: string, 
  tipo: 'success' | 'warning' | 'alert' | 'info' = 'info'
) => {
  if (!usuario_id) return; // Si no hay usuario, no logueamos

  try {
    const { error } = await supabase.from('historial_actividad').insert([
      {
        usuario_id,
        accion,
        detalles,
        tipo
      }
    ]);

    if (error) {
      console.error("❌ Error guardando log:", error.message);
    } else {
      console.log("✅ Actividad guardada:", accion);
    }
  } catch (err) {
    console.error("Error crítico en logger:", err);
  }
}