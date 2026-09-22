import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireStaffSession } from "@/lib/requireStaffSession";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function serviceClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * POST /api/ai/publicidad/hide
 * Soft-delete marketing events: sets hidden_at = now().
 * body: { eventIds: string[] }
 */
export async function POST(request: Request) {
  try {
    if (!(await requireStaffSession(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const raw = Array.isArray(body.eventIds)
      ? body.eventIds
      : body.eventId
        ? [body.eventId]
        : [];
    const eventIds = [
      ...new Set(
        raw
          .map((id: unknown) => String(id || "").trim())
          .filter((id: string) => UUID_RE.test(id)),
      ),
    ];

    if (eventIds.length === 0) {
      return NextResponse.json(
        { error: "Falta eventIds (UUID)." },
        { status: 400 },
      );
    }
    if (eventIds.length > 100) {
      return NextResponse.json(
        { error: "Máximo 100 eventos por solicitud." },
        { status: 400 },
      );
    }

    const supabase = serviceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase no configurado." },
        { status: 503 },
      );
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("ai_marketing_events")
      .update({ hidden_at: now })
      .in("id", eventIds)
      .is("hidden_at", null)
      .select("id");

    if (error) {
      console.warn("publicidad/hide", error.message);
      return NextResponse.json(
        {
          error:
            error.message.includes("hidden_at")
              ? "Falta columna hidden_at — aplica la migración 0039 en Supabase."
              : "No se pudo ocultar.",
        },
        { status: 500 },
      );
    }

    const updated = (data || []).length;
    return NextResponse.json({ ok: true, updated, eventIds: (data || []).map((r) => r.id) });
  } catch (err) {
    console.error("publicidad/hide", err);
    return NextResponse.json(
      { error: "Error al ocultar eventos." },
      { status: 500 },
    );
  }
}
