// src/app/api/ai/resumen-clinico/route.ts
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';
import { logLearningEvent } from '@/lib/ai-learning';
import { requireStaffSession } from '@/lib/requireStaffSession';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const supabaseUrl        = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service-role client — reads clinical notes across all patients, bypassing
// RLS. Only reachable after requireStaffSession() below passes. Without
// that check, this route read and returned a patient's clinical notes (via
// Groq) to anyone who supplied that patient's email, with no session
// required at all.
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    if (!(await requireStaffSession(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { patientEmail, patientName } = await request.json();

    if (!patientEmail) {
      return NextResponse.json({ error: "Falta el email del paciente." }, { status: 400 });
    }

    // 1. Obtener el historial de citas (notas y servicios) del paciente
    const { data: citas, error } = await supabase
      .from('bookings')
      .select('date, service_id, notes, status')
      .eq('patient_email', patientEmail)
      .eq('status', 'completed')
      .order('date', { ascending: true });

    if (error || !citas || citas.length === 0) {
      return NextResponse.json({ 
        resumen: "No hay suficiente historial clínico completado para generar un análisis." 
      });
    }

    // 2. Formatear el historial para el LLM
    const historialTexto = citas.map((cita) => 
      `- Fecha: ${cita.date}\n  Servicio: ${cita.service_id}\n  Notas clínicas: ${cita.notes || "Sin notas adicionales."}`
    ).join('\n\n');

    // 3. Prompt del Sistema
    const systemPrompt = `
      Eres un asistente médico experto en osteopatía, trabajando para la clínica de Katya Heras.
      Analiza el siguiente historial clínico de citas y notas del paciente ${patientName}.
      
      Devuelve un análisis en formato JSON estricto con las siguientes claves:
      - "resumen": Un párrafo sintético (máximo 3 oraciones) sobre la evolución del paciente.
      - "observaciones": Un array de strings con 2 o 3 patrones detectados en su tratamiento.
      - "recomendaciones": Un array de strings con sugerencias específicas para la próxima sesión (ej. enfocar en área lumbar, mantener terapia cráneo-sacral).
      
      Responde SOLO con el objeto JSON válido. No incluyas texto antes o después.
    `;

    // 4. Llamada a Groq (Usando llama3-8b-8192 o mixtral, ajusta según prefieras)
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Historial de ${patientName}:\n${historialTexto}` }
      ],
      model: "llama3-8b-8192",
      temperature: 0.3, // Temperatura baja para respuestas clínicas precisas
      response_format: { type: "json_object" } // Fuerza la salida JSON
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "{}";
    const result = JSON.parse(aiResponse);

    const eventId = await logLearningEvent({
      source: 'resumen_clinico',
      event_type: 'conclusion',
      topic_or_question: `Resumen clínico: ${patientName || patientEmail}`,
      output_preview: typeof result.resumen === 'string' ? result.resumen : JSON.stringify(result).slice(0, 800),
      meta: {
        patientEmailHash: patientEmail ? patientEmail.length : 0,
        observaciones: Array.isArray(result.observaciones) ? result.observaciones.length : 0,
        recomendaciones: Array.isArray(result.recomendaciones) ? result.recomendaciones.length : 0,
      },
    });

    return NextResponse.json({ ...result, eventId });

  } catch (error) {
    console.error("Error en la API de Groq:", error);
    return NextResponse.json({ error: "Error al generar el análisis clínico." }, { status: 500 });
  }
}