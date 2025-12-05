// supabase/functions/send-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.7"; // <-- Usamos Nodemailer

const GMAIL_USER = Deno.env.get("GMAIL_USER");
const GMAIL_PASS = Deno.env.get("GMAIL_PASS");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, nombre, reserva } = await req.json();

    // 1. Configurar el "Transportador" (Tu cuenta de Gmail)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS,
      },
    });

    // 2. Diseño del correo (HTML)
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e0e0e0;">
          <h1 style="color: #0F766E; margin: 0;">HORIZONTE SUITES</h1>
          <p style="color: #666; margin: 5px 0;">Confirmación de Reserva</p>
        </div>

        <div style="padding: 20px 0;">
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>¡Gracias por elegirnos! Tu reserva ha sido confirmada exitosamente.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #334155; margin-top: 0;">Detalles del Alojamiento</h3>
            <p style="margin: 5px 0;"><strong>🏨 Habitación:</strong> ${reserva.habitacion_numero} - ${reserva.habitacion_tipo}</p>
            <p style="margin: 5px 0;"><strong>📅 Entrada:</strong> ${reserva.fecha_entrada}</p>
            <p style="margin: 5px 0;"><strong>📅 Salida:</strong> ${reserva.fecha_salida}</p>
            <p style="margin: 5px 0;"><strong>👥 Huéspedes:</strong> ${reserva.num_huespedes}</p>
            <hr style="border: 0; border-top: 1px dashed #ccc; margin: 15px 0;">
            <p style="font-size: 18px; color: #0F766E; font-weight: bold; margin: 0;">Total Pagado: $${reserva.total}</p>
          </div>

          <p>Te esperamos para brindarte la mejor experiencia en Salta.</p>
        </div>

        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px;">
          <p>Av. San Martín 1234, Salta, Argentina</p>
          <p>Si tienes dudas, responde a este correo o contáctanos por la web.</p>
        </div>
      </div>
    `;

    // 3. Enviar el correo
    const info = await transporter.sendMail({
      from: `"Horizonte Suites" <${GMAIL_USER}>`, // Remitente bonito
      to: email, // AHORA SÍ: Al email del cliente real
      subject: `¡Reserva Confirmada! #${reserva.id.slice(0, 8)}`,
      html: htmlContent,
    });

    return new Response(JSON.stringify({ message: "Email enviado", info }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error enviando email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});