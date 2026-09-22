import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  RESUMEN_PROMPT_VERSION,
  groqChatWithFallback,
  logClinicalAudit,
  logClinicalEvent,
} from "@/lib/ai-learning";
import { requireStaffSession } from "@/lib/requireStaffSession";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service-role client — reads clinical notes across all patients, bypassing
// RLS. Only reachable after requireStaffSession() below passes.
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    if (!(await requireStaffSession(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const patientEmail = body.patientEmail
      ? String(body.patientEmail).trim()
      : "";
    const patientName = body.patientName
      ? String(body.patientName).trim()
      : "";
    const patientId = body.patientId ? String(body.patientId) : null;

    if (!patientEmail) {
      return NextResponse.json(
        { error: "Falta el email del paciente." },
        { status: 400 },
      );
    }

    const groqKey = String(process.env.GROQ_API_KEY ?? "").trim();
    if (!groqKey) {
      return NextResponse.json(
        { error: "Falta GROQ_API_KEY en el servidor." },
        { status: 503 },
      );
    }

    // 1. Obtener el historial de citas (notas y servicios) del paciente
    const { data: citas, error } = await supabase
      .from("bookings")
      .select("date, service_id, notes, status")
      .eq("patient_email", patientEmail)
      .eq("status", "completed")
      .order("date", { ascending: true });

    if (error || !citas || citas.length === 0) {
      return NextResponse.json({
        resumen:
          "No hay suficiente historial clínico completado para generar un análisis.",
      });
    }

    // 2. Formatear el historial para el LLM (no log PHI into ML tables)
    const historialTexto = citas
      .map(
        (cita) =>
          `- Fecha: ${cita.date}\n  Servicio: ${cita.service_id}\n  Notas clínicas: ${cita.notes || "Sin notas adicionales."}`,
      )
      .join("\n\n");

    const systemPrompt = `
      Eres un asistente médico experto en osteopatía, trabajando para la clínica de Katya Heras.
      Analiza el siguiente historial clínico de citas y notas del paciente.
      
      Devuelve un análisis en formato JSON estricto con las siguientes claves:
      - "resumen": Un párrafo sintético (máximo 3 oraciones) sobre la evolución del paciente.
      - "observaciones": Un array de strings con 2 o 3 patrones detectados en su tratamiento.
      - "recomendaciones": Un array de strings con sugerencias específicas para la próxima sesión (ej. enfocar en área lumbar, mantener terapia cráneo-sacral).
      
      Responde SOLO con el objeto JSON válido. No incluyas texto antes o después.
    `;

    const { raw, model } = await groqChatWithFallback({
      apiKey: groqKey,
      temperature: 0.3,
      json: true,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Historial${patientName ? ` de ${patientName}` : ""}:\n${historialTexto}`,
        },
      ],
    });

    let result: Record<string, unknown>;
    try {
      result = JSON.parse(raw || "{}");
    } catch {
      return NextResponse.json(
        { error: "La IA no devolvió JSON válido." },
        { status: 502 },
      );
    }

    const outputDraft =
      typeof result.resumen === "string"
        ? result.resumen
        : JSON.stringify(result).slice(0, 800);

    const eventId = await logClinicalEvent({
      source: "resumen_clinico",
      event_type: "conclusion",
      topic_or_question: "Resumen clínico",
      prompt_version: RESUMEN_PROMPT_VERSION,
      model,
      output_draft: outputDraft,
      meta: {
        citas_count: citas.length,
        observaciones: Array.isArray(result.observaciones)
          ? result.observaciones.length
          : 0,
        recomendaciones: Array.isArray(result.recomendaciones)
          ? result.recomendaciones.length
          : 0,
      },
    });

    if (patientId && eventId) {
      await logClinicalAudit({
        patient_id: patientId,
        clinical_event_id: eventId,
        source: "resumen_clinico",
        note: "resumen generado",
        meta: { citas_count: citas.length },
      });
    }

    return NextResponse.json({
      ...result,
      eventId,
      model,
      prompt_version: RESUMEN_PROMPT_VERSION,
    });
  } catch (error) {
    console.error("Error en la API de Groq:", error);
    return NextResponse.json(
      { error: "Error al generar el análisis clínico." },
      { status: 500 },
    );
  }
}
