// One-time content migration: copies the rich copy that used to live only
// in src/data/services.ts (SERVICE_DETAIL — timeline, "ideal for", "not
// for", FAQs, and the hero tagline/lede) into the matching row of the
// "services" table, so the same content that used to be hardcoded per
// service id is now editable from /admin/servicios.
//
// Non-destructive: for each service, a field is written ONLY if it is
// currently empty in the database. Anything an admin already typed into
// the CMS is left untouched.
//
// Matching uses an EXPLICIT id mapping — SERVICE_ID_MAP below. An earlier
// version tried to match by title (e.g. 'estructural' -> title_es =
// 'Osteopatía estructural'), which is unreliable: a live catalog can have
// been renamed since, so it can silently miss or hit the wrong row.
//
// Two-slugs-one-row case: when more than one legacy slug maps to the same
// services.id (here, 'estructural' and 'visceral' both point at the
// combined "Osteopatía Estructural y Visceral" service), filling fields
// slug-by-slug would silently lose content — once the first slug's pass
// fills e.g. `timeline`, the field is no longer empty, so the second
// slug's very different timeline (visceral work, not structural) would
// never get written even though it describes different content entirely.
// To avoid that, run() below detects this case and, per merged row:
//   - concatenates the list fields (timeline, ideal_for, not_for, faqs)
//     from every contributing slug, so nothing is dropped;
//   - takes subtitle_es/en and description_es/en from only the FIRST
//     slug (in SERVICE_ID_MAP's declared order) and prints an explicit
//     warning, since neither original single-technique tagline/lede
//     accurately describes the combined session — that pair needs a
//     human to rewrite it in /admin/servicios, this script won't guess.
//
// Run once, locally, against your real project:
//   node --env-file=.env.local scripts/seed-service-detail-content.mjs
//
// Requires SUPABASE_SERVICE_ROLE_KEY (bypasses RLS — this script is never
// bundled into the app, so that's safe; it's the only way to write here
// since a script has no logged-in browser session to satisfy the
// "authenticated" RLS policies on public.services).
//
// Do NOT delete src/data/services.ts until you've confirmed in
// /admin/servicios that each service's Estructura/FAQ tabs now show this
// content.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
    "Run with: node --env-file=.env.local scripts/seed-service-detail-content.mjs",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// ============================================================================
// Mapping confirmed by the clinic (2026-09-19), matching
// 0023_map_legacy_booking_service_ids.sql: 'estructural' and 'visceral'
// both point at the single combined service "Osteopatía Estructural y
// Visceral" — there's no separate current service for either technique
// alone. The other four slugs never appear on any booking and are left
// null intentionally (see run() below for how the estructural/visceral
// merge into one row is handled without dropping either's content).
// ============================================================================
const SERVICE_ID_MAP = {
  estructural: "d6926cc7-91fe-4c32-af5e-529e973f8e7d",
  visceral:    "d6926cc7-91fe-4c32-af5e-529e973f8e7d",
  craneal:     null,
  postural:    null,
  deportiva:   null,
  embarazo:    null,
};

// ── Legacy content, one entry per hardcoded slug (src/data/services.ts) ────
// "label" is only used in the console output below — matching uses
// SERVICE_ID_MAP, not this text.
const LEGACY_CONTENT = {
  estructural: {
    label: "Osteopatía estructural",
    subtitle_es: "Para el cuerpo que carga el día.",
    subtitle_en: "For the body that carries the day.",
    description_es:
      "Manipulación articular suave y precisa para liberar la tensión profunda que se acumula en columna, caderas, hombros y cuello. La sesión más solicitada — la que recomiendo cuando alguien me dice «ya no sé dónde me duele».",
    description_en:
      "Soft, precise joint manipulation to release the deep tension that builds up in spine, hips, shoulders, and neck. The most-requested session — the one I recommend when someone tells me they don't even know where it hurts anymore.",
    timeline: [
      { time: "0–10 min",  title: "Llegas y respiramos.",  desc: "Cinco minutos para soltar el tráfico, el día, lo que traes en la cabeza. Té tibio si lo quieres." },
      { time: "10–20 min", title: "Lectura postural.",     desc: "Te observo de pie, de espaldas, caminando. Mido asimetrías. Te explico lo que veo, en palabras llanas." },
      { time: "20–50 min", title: "Trabajo manual.",       desc: "Treinta minutos de manipulación articular, liberación miofascial y movilización. Sin chasquidos bruscos: técnica suave, escuchando lo que el tejido pide." },
      { time: "50–55 min", title: "Reposo.",               desc: "Cinco minutos en la camilla, en silencio. El sistema nervioso necesita el cierre tanto como el trabajo." },
      { time: "55–60 min", title: "Plan a casa.",          desc: "Dos o tres ejercicios suaves para la semana. Te los mando por correo después, también, para que no los olvides." },
    ],
    ideal_for: ["Tensión persistente en cuello, hombros o lumbar", "Dolor de cabeza tensional recurrente", "Trabajo de oficina, conducir muchas horas", "Después del parto, una vez la cuarentena cierra", "Recuperación de lesiones deportivas (no agudas)"],
    not_for:   ["Fracturas recientes o sospecha de fractura", "Trombosis, embolia o problemas de coagulación", "Procesos infecciosos agudos con fiebre", "Cáncer en tratamiento activo (sin aval médico)", "Primer trimestre del embarazo (existe la opción prenatal)"],
    faqs: [
      { question: "¿Va a doler?", answer: "No. Mi técnica es manual y suave; no hago chasquidos bruscos. Algunas zonas son sensibles y puedes sentir presión, pero nunca dolor agudo. Si algo no te gusta, lo paramos." },
      { question: "¿Cuántas sesiones necesito?", answer: "Para una molestia puntual, normalmente 3 a 5 sesiones espaciadas. Para un trabajo de fondo, una sesión al mes. Te lo digo claro al final de la primera." },
      { question: "¿Qué me pongo?", answer: "Ropa cómoda y elástica. Trabajo sobre la ropa la mayor parte del tiempo; en algunas técnicas es más fácil con ropa interior. Tú decides." },
      { question: "¿Lo cubre el seguro?", answer: "Algunos seguros mexicanos reembolsan osteopatía con receta médica. Te emito factura con CFDI; consulta con tu aseguradora." },
      { question: "¿Y si llego tarde?", answer: "Hay un margen de 10 minutos. Más allá, el bloque se acorta. Las sesiones empiezan y terminan a tiempo para que la siguiente persona también respire." },
    ],
  },

  visceral: {
    label: "Osteopatía visceral",
    subtitle_es: "Cuando el estrés se aloja por dentro.",
    subtitle_en: "When stress settles deep inside.",
    description_es:
      "Trabajo abdominal suave para liberar la tensión que se acumula en el sistema digestivo, hígado, diafragma y respiración. Útil cuando el cuerpo no tiene un dolor obvio pero algo no fluye.",
    description_en:
      "Soft abdominal work to release tension held in the digestive system, liver, diaphragm, and breath. Useful when there's no obvious pain but something isn't flowing.",
    timeline: [
      { time: "0–10 min",  title: "Conversación previa.",     desc: "Te pregunto sobre digestión, sueño, ritmo intestinal. Sin pudor — la información es clínica." },
      { time: "10–55 min", title: "Trabajo visceral.",        desc: "Cuarenta y cinco minutos de palpación abdominal y movilización suave. La técnica es lenta; el tejido visceral pide tiempo." },
      { time: "55–70 min", title: "Diafragma y respiración.", desc: "Liberación del diafragma para que respires hasta abajo. La diferencia se nota al levantarte." },
      { time: "70–75 min", title: "Cierre y plan.",           desc: "Notas y recomendaciones para los siguientes días: hidratación, comida ligera, paseo." },
    ],
    ideal_for: ["Digestión lenta, hinchazón, reflujo crónico", "Estrés que somatiza en el abdomen", "Cicatrices abdominales (cesárea, laparoscopía) ya cerradas", "Respiración corta, sensación de «no llegar abajo»", "Síndrome de intestino irritable (acompañamiento)"],
    not_for:   ["Embarazo (existe la opción prenatal específica)", "Cirugía abdominal reciente (menos de 8 semanas)", "Hernias no diagnosticadas", "Procesos inflamatorios agudos del abdomen", "Aneurisma aórtico abdominal"],
    faqs: [
      { question: "¿Puede sustituir a un gastro?", answer: "No. Lo complementa. Si tienes síntomas digestivos persistentes, primero descarta lo médico." },
      { question: "¿Lo siento al día siguiente?", answer: "Es normal sentirse cansado y con más sed. La digestión cambia 24–48 horas. No es un detox; es liberación de tejido." },
      { question: "¿Qué como antes?", answer: "Algo ligero, mínimo dos horas antes. Mejor sin café esa mañana." },
    ],
  },

  craneal: {
    label: "Cráneo-sacral",
    subtitle_es: "El descanso que el sistema nervioso necesita.",
    subtitle_en: "The rest your nervous system needs.",
    description_es:
      "La sesión más sutil que ofrezco. Manos quietas sobre el cráneo, la columna y el sacro, leyendo el ritmo del líquido cefalorraquídeo. La gente sale como si hubiera dormido tres horas.",
    description_en:
      "The most subtle session I offer. Still hands on the skull, spine, and sacrum, reading the rhythm of the cerebrospinal fluid. People walk out as if they'd slept three hours.",
    timeline: [
      { time: "0–5 min",   title: "Llegada en silencio.",     desc: "No hablamos mucho en esta sesión. La intención es bajar revoluciones desde el principio." },
      { time: "5–55 min",  title: "Manos quietas, escucha.",  desc: "Cincuenta minutos boca arriba, vestida, con manta. Mis manos sostienen distintas zonas durante minutos. La técnica es casi imperceptible al tacto; el cuerpo la siente." },
      { time: "55–60 min", title: "Salir despacio.",          desc: "Te pido que te incorpores con calma. Hidrátate. No conduzcas inmediatamente si te sientes flotando." },
    ],
    ideal_for: ["Insomnio, dificultad para entrar en sueño profundo", "Migraña y cefalea tensional crónica", "Ansiedad, sensación de «estar siempre encendida»", "Recuperación de conmoción cerebral (con aval médico)", "Bruxismo, tensión mandibular"],
    not_for:   ["Conmoción cerebral reciente sin aval médico", "Hemorragia intracraneal o ictus reciente", "Aneurisma cerebral", "Fiebre alta o infección activa"],
    faqs: [
      { question: "¿Es como un masaje suave?", answer: "No. Es trabajo neurológico, aunque parezca pasivo. El efecto se siente en el sistema nervioso autónomo, no en el músculo." },
      { question: "¿Me voy a dormir?", answer: "Mucha gente sí. Está bien. El cuerpo aprovecha que el sistema baja revoluciones." },
      { question: "¿Cada cuánto?", answer: "Para insomnio o ansiedad, una vez a la semana durante un mes. Después, cada dos o tres semanas, según cómo te sientas." },
    ],
  },

  postural: {
    label: "Lectura postural",
    subtitle_es: "Un punto de partida.",
    subtitle_en: "A starting point.",
    description_es:
      "Evaluación inicial completa. La recomiendo siempre como primera cita: salimos con un mapa claro de qué pasa y un plan de cuántas sesiones, de qué tipo, y con qué objetivo.",
    description_en:
      "A complete initial assessment. I always recommend it as a first visit: we leave with a clear map of what's going on and a plan — how many sessions, of what kind, with what goal.",
    timeline: [
      { time: "0–15 min",  title: "Historia.",           desc: "Hablamos de tu día, tu trabajo, tus lesiones, tu sueño. La postura cuenta una historia que el cuerpo escribe; te pregunto el resto." },
      { time: "15–35 min", title: "Observación y test.", desc: "De pie, sentada, caminando. Tests articulares y de movilidad. Mediciones objetivas, no impresiones." },
      { time: "35–45 min", title: "Plan.",               desc: "Te explico el mapa con dibujos. Cuántas sesiones, qué tipo, qué objetivos medibles. Si lo tuyo es médico y no osteopático, te lo digo." },
    ],
    ideal_for: ["Primera vez en osteopatía", "Quieres entender de dónde viene el dolor antes de tratarlo", "Vas a empezar un plan deportivo o postparto", "Tienes varias quejas a la vez y no sabes por dónde"],
    not_for:   ["Dolor agudo que requiere alivio inmediato (mejor pasar a una sesión de 60 min)", "Diagnóstico médico previo no resuelto"],
    faqs: [
      { question: "¿Hay tratamiento en esta cita?", answer: "Trabajo manual breve, sí. La sesión es sobre todo evaluación; el grueso del trabajo viene en la siguiente." },
      { question: "¿Por qué es más barata?", answer: "Es más corta y la priorizo como puerta de entrada. No quiero que la primera visita sea una barrera de precio." },
    ],
  },

  deportiva: {
    label: "Recuperación deportiva",
    subtitle_es: "Después del esfuerzo.",
    subtitle_en: "After the effort.",
    description_es:
      "Trabajo orientado a deportistas: liberación miofascial dirigida, drenaje, movilización articular y test funcional. Para volver al entrenamiento sin compensar la lesión.",
    description_en:
      "Work for athletes: targeted myofascial release, drainage, articular mobilization, and functional testing. To return to training without compensating an injury.",
    timeline: [
      { time: "0–10 min",  title: "Briefing.",               desc: "Disciplina, volumen semanal, lesión, fase de la temporada. Hablamos rápido — eres deportista, conoces tu cuerpo." },
      { time: "10–25 min", title: "Test funcional.",         desc: "Movilidad de cadera, estabilidad lumbo-pélvica, tobillo y hombro. Veo dónde está el origen, no solo el síntoma." },
      { time: "25–65 min", title: "Trabajo manual intenso.", desc: "Cuarenta minutos de liberación, manipulación y drenaje. Es más activo que mis otras sesiones; lo notas." },
      { time: "65–75 min", title: "Re-test y plan.",         desc: "Volvemos a medir. Te llevas dos o tres ejercicios para los siguientes entrenamientos." },
    ],
    ideal_for: ["Deportista amateur o profesional", "Lesión por sobrecarga, no aguda", "Vuelta al entrenamiento tras lesión", "Preparación para una competencia (no la semana de)", "Maratón / triatlón / crossfit / ciclismo de fondo"],
    not_for:   ["Lesión aguda con inflamación severa (primero RICE y médico)", "Sospecha de fractura por estrés sin imagen", "Dentro de las 48h previas a una competencia importante"],
    faqs: [
      { question: "¿Cuándo entreno después?", answer: "Ese día, descanso o trote suave. Al siguiente, vuelta normal. Si la sesión fue muy profunda, te aviso." },
      { question: "¿Antes de competencia?", answer: "Mínimo 5–7 días antes. Una semana antes hago sesiones más suaves orientadas a movilidad, no liberación profunda." },
    ],
  },

  embarazo: {
    label: "Acompañamiento prenatal",
    subtitle_es: "Para los nueve meses.",
    subtitle_en: "For the nine months.",
    description_es:
      "Trabajo seguro y especializado durante el embarazo, en cualquier trimestre. Posiciones adaptadas, técnica suave y enfocada en sacro, pelvis, lumbar y diafragma.",
    description_en:
      "Safe, specialized work during pregnancy, at any trimester. Adapted positioning, soft technique, focused on sacrum, pelvis, lower back, and diaphragm.",
    timeline: [
      { time: "0–10 min",  title: "Cómo vas.",                          desc: "Trimestre, controles médicos, dolores nuevos. Si hay algo que tu obstetra no sepa, lo hablamos." },
      { time: "10–50 min", title: "Trabajo en lateral o semi-sentada.", desc: "Cuarenta minutos en posición segura, con cojines. Lumbar, sacro, pelvis, costillas para que respires; cuello y hombros que cargan el peso del pecho." },
      { time: "50–60 min", title: "Cierre.",                            desc: "Recomendaciones para dormir, sentarte y levantarte de la cama. Cosas pequeñas que cambian la semana." },
    ],
    ideal_for: ["Embarazo de bajo riesgo, cualquier trimestre", "Lumbalgia, ciática del embarazo", "Dificultad para dormir por incomodidad postural", "Preparación al parto (último trimestre)", "Postparto, una vez la cuarentena cierra"],
    not_for:   ["Embarazo de alto riesgo sin aval del obstetra", "Amenaza de parto prematuro", "Sangrado vaginal activo", "Hipertensión gestacional no controlada"],
    faqs: [
      { question: "¿Es seguro en el primer trimestre?", answer: "Sí, con técnica adaptada y suave. Si hay sangrado o riesgo, esperamos al segundo." },
      { question: "¿Postparto, cuándo?", answer: "Después de la cuarentena (40 días) y con el alta del ginecólogo. Antes, solo trabajo cráneo-sacral si hay molestias específicas." },
      { question: "¿Mi pareja puede acompañarme?", answer: "Sí, siempre. Especialmente en las últimas semanas, suele ser útil para los dos." },
    ],
  },
};

function isEmpty(value) {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * Combines the content of two or more legacy slugs that resolve to the
 * same services.id. List fields are concatenated (nothing dropped);
 * subtitle/description come only from the first slug — the caller prints
 * a warning about that when it actually gets applied.
 */
function mergeLegacyContent(slugs) {
  const first = LEGACY_CONTENT[slugs[0]];
  if (slugs.length === 1) return first;
  return {
    label:           slugs.map((s) => LEGACY_CONTENT[s].label).join(" + "),
    subtitle_es:     first.subtitle_es,
    subtitle_en:     first.subtitle_en,
    description_es:  first.description_es,
    description_en:  first.description_en,
    timeline:        slugs.flatMap((s) => LEGACY_CONTENT[s].timeline),
    ideal_for:       [...new Set(slugs.flatMap((s) => LEGACY_CONTENT[s].ideal_for))],
    not_for:         [...new Set(slugs.flatMap((s) => LEGACY_CONTENT[s].not_for))],
    faqs:            slugs.flatMap((s) => LEGACY_CONTENT[s].faqs),
  };
}

async function run() {
  // Group slugs by resolved id first — see the merge note in the header
  // comment for why (two slugs pointing at the same row must not overwrite
  // each other's content field-by-field).
  const slugsById = new Map();
  for (const slug of Object.keys(LEGACY_CONTENT)) {
    const id = SERVICE_ID_MAP[slug];
    if (!id) {
      console.log(`[${slug}] SKIPPED — no id filled in SERVICE_ID_MAP for "${LEGACY_CONTENT[slug].label}".`);
      continue;
    }
    if (!slugsById.has(id)) slugsById.set(id, []);
    slugsById.get(id).push(slug);
  }
  console.log("");

  for (const [id, slugs] of slugsById) {
    const label = slugs.join(" + ");
    const content = mergeLegacyContent(slugs);
    const merged = slugs.length > 1;

    const { data: row, error: findError } = await supabase
      .from("services")
      .select("id, title_es, subtitle_es, subtitle_en, description_es, description_en, timeline, ideal_for, not_for, faqs")
      .eq("id", id)
      .maybeSingle();

    if (findError) {
      console.error(`[${label}] SKIPPED — lookup for id ${id} failed:`, findError.message);
      continue;
    }
    if (!row) {
      console.log(`[${label}] SKIPPED — ${id} is not a real services.id (check SERVICE_ID_MAP for a typo).`);
      continue;
    }

    const updates = {};
    if (isEmpty(row.subtitle_es))     updates.subtitle_es     = content.subtitle_es;
    if (isEmpty(row.subtitle_en))     updates.subtitle_en     = content.subtitle_en;
    if (isEmpty(row.description_es))  updates.description_es  = content.description_es;
    if (isEmpty(row.description_en))  updates.description_en  = content.description_en;
    if (isEmpty(row.timeline))        updates.timeline        = content.timeline;
    if (isEmpty(row.ideal_for))       updates.ideal_for       = content.ideal_for;
    if (isEmpty(row.not_for))         updates.not_for         = content.not_for;
    if (isEmpty(row.faqs))            updates.faqs            = content.faqs;

    if (Object.keys(updates).length === 0) {
      console.log(`[${label}] matched "${row.title_es}" (${id}) — SKIPPED, already has content in every field.`);
      continue;
    }

    const { error: updateError } = await supabase
      .from("services")
      .update(updates)
      .eq("id", row.id);

    if (updateError) {
      console.error(`[${label}] matched "${row.title_es}" (${id}) — UPDATE FAILED:`, updateError.message);
      continue;
    }

    console.log(`[${label}] matched "${row.title_es}" (${id}) — filled: ${Object.keys(updates).join(", ")}`);
    if (merged && (updates.subtitle_es || updates.subtitle_en || updates.description_es || updates.description_en)) {
      console.log(
        `  ⚠ ${slugs.length} slugs share this row. subtitle/description came only from "${LEGACY_CONTENT[slugs[0]].label}" ` +
        `(${slugs[0]}) — please review and rewrite them in /admin/servicios to reflect the combined session. ` +
        `timeline/ideal_for/not_for/faqs were merged from all ${slugs.length} slugs, nothing was dropped.`,
      );
    }
  }

  console.log("\nDone. Check /admin/servicios for each service before deleting src/data/services.ts.");
}

run();
