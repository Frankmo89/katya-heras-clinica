export interface ServiceTranslation {
  name: string;
  tagline: string;
  desc: string;
}

export type ServiceTone = "green" | "pink" | "blue";

export interface Service {
  id: string;
  tone: ServiceTone;
  es: ServiceTranslation;
  en: ServiceTranslation;
  duration: number;
  price: string;
}

export const SERVICES: Service[] = [
  {
    id: "estructural",
    tone: "green",
    es: {
      name: "Osteopatía estructural",
      tagline: "Para el cuerpo que carga el día.",
      desc: "Liberación de tensión profunda en columna y articulaciones, con manipulación suave y precisa.",
    },
    en: {
      name: "Structural osteopathy",
      tagline: "For the body that carries the day.",
      desc: "Deep release of tension in spine and joints through soft, precise manipulation.",
    },
    duration: 60,
    price: "1,800",
  },
  {
    id: "visceral",
    tone: "pink",
    es: {
      name: "Osteopatía visceral",
      tagline: "Cuando el estrés se aloja por dentro.",
      desc: "Sesión profunda para liberar tensión acumulada en el sistema digestivo y respiratorio.",
    },
    en: {
      name: "Visceral osteopathy",
      tagline: "When stress settles deep inside.",
      desc: "A deep session to release tension held in the digestive and respiratory systems.",
    },
    duration: 75,
    price: "2,200",
  },
  {
    id: "craneal",
    tone: "blue",
    es: {
      name: "Cráneo-sacral",
      tagline: "El descanso que el sistema nervioso necesita.",
      desc: "Trabajo sutil sobre el cráneo y la columna para regular el sistema nervioso autónomo.",
    },
    en: {
      name: "Cranio-sacral therapy",
      tagline: "The rest your nervous system needs.",
      desc: "Subtle work on the skull and spine to regulate the autonomic nervous system.",
    },
    duration: 60,
    price: "1,800",
  },
  {
    id: "postural",
    tone: "green",
    es: {
      name: "Lectura postural",
      tagline: "Un punto de partida.",
      desc: "Evaluación inicial de 45 minutos. Recomendada antes de cualquier tratamiento continuado.",
    },
    en: {
      name: "Postural read",
      tagline: "A starting point.",
      desc: "Initial 45-minute evaluation. Recommended before any continued treatment plan.",
    },
    duration: 45,
    price: "1,200",
  },
  {
    id: "deportiva",
    tone: "pink",
    es: {
      name: "Recuperación deportiva",
      tagline: "Después del esfuerzo.",
      desc: "Sesión orientada a deportistas: liberación miofascial, drenaje y movilización articular.",
    },
    en: {
      name: "Sports recovery",
      tagline: "After the effort.",
      desc: "Session for athletes: myofascial release, drainage, and articular mobilization.",
    },
    duration: 75,
    price: "2,200",
  },
  {
    id: "embarazo",
    tone: "blue",
    es: {
      name: "Acompañamiento prenatal",
      tagline: "Para los nueve meses.",
      desc: "Trabajo seguro y especializado durante el embarazo, en cualquier trimestre.",
    },
    en: {
      name: "Prenatal care",
      tagline: "For the nine months.",
      desc: "Safe, specialized work during pregnancy, at any trimester.",
    },
    duration: 60,
    price: "1,800",
  },
];

// ── DB row type & mapper ────────────────────────────────────────────────────────
export interface DbService {
  id: string;
  title_es: string;
  title_en: string | null;
  subtitle_es: string | null;
  subtitle_en: string | null;
  description_es: string | null;
  description_en: string | null;
  duration_minutes: number | null;
  price: number | null;
  tone: string | null;
}

export function mapDbService(row: DbService): Service {
  return {
    id:       row.id,
    tone:     (row.tone as ServiceTone) ?? "green",
    es: {
      name:    row.title_es,
      tagline: row.subtitle_es    ?? "",
      desc:    row.description_es ?? "",
    },
    en: {
      name:    row.title_en    ?? row.title_es,
      tagline: row.subtitle_en ?? row.subtitle_es ?? "",
      desc:    row.description_en ?? row.description_es ?? "",
    },
    duration: row.duration_minutes ?? 60,
    price:    row.price != null ? String(Math.round(row.price)) : "",
  };
}

// ─────────────────────────────────────────────
// Service detail types
// ─────────────────────────────────────────────

export interface DetailHero {
  eyebrow: string;
  kicker: string;
  head: string;
  lede: string;
}

export interface TimelineRow {
  t: string;
  es: { h: string; p: string };
  en: { h: string; p: string };
}

export interface FaqItem {
  es: { q: string; a: string };
  en: { q: string; a: string };
}

export interface ServiceDetailData {
  hero: { es: DetailHero; en: DetailHero };
  timeline: TimelineRow[];
  forWhom: { es: string[]; en: string[] };
  notFor: { es: string[]; en: string[] };
  faq: FaqItem[];
  related: string[];
}

// ─────────────────────────────────────────────
// Service detail data (one entry per service id)
// ─────────────────────────────────────────────

export const SERVICE_DETAIL: Record<string, ServiceDetailData> = {
  estructural: {
    hero: {
      es: {
        eyebrow: "Sesión principal · 60 min",
        kicker: "Osteopatía estructural",
        head: "Para el cuerpo que carga el día.",
        lede: "Manipulación articular suave y precisa para liberar la tensión profunda que se acumula en columna, caderas, hombros y cuello. La sesión más solicitada — la que recomiendo cuando alguien me dice «ya no sé dónde me duele».",
      },
      en: {
        eyebrow: "Main session · 60 min",
        kicker: "Structural osteopathy",
        head: "For the body that carries the day.",
        lede: "Soft, precise joint manipulation to release the deep tension that builds up in spine, hips, shoulders, and neck. The most-requested session — the one I recommend when someone tells me they don't even know where it hurts anymore.",
      },
    },
    timeline: [
      { t: "0–10",  es: { h: "Llegas y respiramos.",  p: "Cinco minutos para soltar el tráfico, el día, lo que traes en la cabeza. Té tibio si lo quieres." }, en: { h: "You arrive, we breathe.", p: "Five minutes to drop the traffic, the day, whatever's in your head. Warm tea if you want it." } },
      { t: "10–20", es: { h: "Lectura postural.",     p: "Te observo de pie, de espaldas, caminando. Mido asimetrías. Te explico lo que veo, en palabras llanas." }, en: { h: "Postural read.", p: "I watch you standing, from the back, walking. I measure asymmetries. I explain what I see, in plain words." } },
      { t: "20–50", es: { h: "Trabajo manual.",       p: "Treinta minutos de manipulación articular, liberación miofascial y movilización. Sin chasquidos bruscos: técnica suave, escuchando lo que el tejido pide." }, en: { h: "Hands-on work.", p: "Thirty minutes of joint manipulation, myofascial release, and mobilization. No abrupt cracks: soft technique, listening to what the tissue asks for." } },
      { t: "50–55", es: { h: "Reposo.",               p: "Cinco minutos en la camilla, en silencio. El sistema nervioso necesita el cierre tanto como el trabajo." }, en: { h: "Rest.", p: "Five minutes on the table, in silence. The nervous system needs the closing as much as the work itself." } },
      { t: "55–60", es: { h: "Plan a casa.",          p: "Dos o tres ejercicios suaves para la semana. Te los mando por correo después, también, para que no los olvides." }, en: { h: "Plan to take home.", p: "Two or three gentle exercises for the week. I'll email them to you afterwards too, so you don't forget." } },
    ],
    forWhom: {
      es: ["Tensión persistente en cuello, hombros o lumbar", "Dolor de cabeza tensional recurrente", "Trabajo de oficina, conducir muchas horas", "Después del parto, una vez la cuarentena cierra", "Recuperación de lesiones deportivas (no agudas)"],
      en: ["Persistent tension in neck, shoulders, or lower back", "Recurring tension headaches", "Office work, long hours driving", "Postpartum, once the quarantine period closes", "Recovery from sports injuries (not acute)"],
    },
    notFor: {
      es: ["Fracturas recientes o sospecha de fractura", "Trombosis, embolia o problemas de coagulación", "Procesos infecciosos agudos con fiebre", "Cáncer en tratamiento activo (sin aval médico)", "Primer trimestre del embarazo (existe la opción prenatal)"],
      en: ["Recent fractures or suspected fractures", "Thrombosis, embolism, or coagulation issues", "Acute infections with fever", "Active cancer treatment (without medical clearance)", "First trimester of pregnancy (a prenatal option exists)"],
    },
    faq: [
      { es: { q: "¿Va a doler?",              a: "No. Mi técnica es manual y suave; no hago chasquidos bruscos. Algunas zonas son sensibles y puedes sentir presión, pero nunca dolor agudo. Si algo no te gusta, lo paramos." }, en: { q: "Will it hurt?",              a: "No. My technique is manual and soft; I don't do abrupt cracking. Some areas are sensitive and you may feel pressure, but never sharp pain. If something feels off, we stop." } },
      { es: { q: "¿Cuántas sesiones necesito?", a: "Para una molestia puntual, normalmente 3 a 5 sesiones espaciadas. Para un trabajo de fondo, una sesión al mes. Te lo digo claro al final de la primera." }, en: { q: "How many sessions do I need?", a: "For a specific complaint, usually 3 to 5 spaced sessions. For deeper work, once a month. I'll tell you clearly at the end of the first." } },
      { es: { q: "¿Qué me pongo?",            a: "Ropa cómoda y elástica. Trabajo sobre la ropa la mayor parte del tiempo; en algunas técnicas es más fácil con ropa interior. Tú decides." }, en: { q: "What do I wear?",            a: "Comfortable, stretchy clothing. I work over the clothes most of the time; for some techniques it's easier in underwear. You decide." } },
      { es: { q: "¿Lo cubre el seguro?",      a: "Algunos seguros mexicanos reembolsan osteopatía con receta médica. Te emito factura con CFDI; consulta con tu aseguradora." }, en: { q: "Is it covered by insurance?", a: "Some Mexican insurance plans reimburse osteopathy with a medical referral. I issue a CFDI invoice; check with your provider." } },
      { es: { q: "¿Y si llego tarde?",        a: "Hay un margen de 10 minutos. Más allá, el bloque se acorta. Las sesiones empiezan y terminan a tiempo para que la siguiente persona también respire." }, en: { q: "What if I'm late?",          a: "There's a 10-minute grace window. Beyond that, the block gets shortened. Sessions start and end on time so the next person can also breathe." } },
    ],
    related: ["craneal", "postural", "deportiva"],
  },

  visceral: {
    hero: {
      es: { eyebrow: "Sesión profunda · 75 min", kicker: "Osteopatía visceral",   head: "Cuando el estrés se aloja por dentro.", lede: "Trabajo abdominal suave para liberar la tensión que se acumula en el sistema digestivo, hígado, diafragma y respiración. Útil cuando el cuerpo no tiene un dolor obvio pero algo no fluye." },
      en: { eyebrow: "Deep session · 75 min",   kicker: "Visceral osteopathy",    head: "When stress settles deep inside.",      lede: "Soft abdominal work to release tension held in the digestive system, liver, diaphragm, and breath. Useful when there's no obvious pain but something isn't flowing." },
    },
    timeline: [
      { t: "0–10",  es: { h: "Conversación previa.",       p: "Te pregunto sobre digestión, sueño, ritmo intestinal. Sin pudor — la información es clínica." }, en: { h: "Conversation first.", p: "I ask about digestion, sleep, gut rhythm. No shame — the info is clinical." } },
      { t: "10–55", es: { h: "Trabajo visceral.",          p: "Cuarenta y cinco minutos de palpación abdominal y movilización suave. La técnica es lenta; el tejido visceral pide tiempo." }, en: { h: "Visceral work.", p: "Forty-five minutes of abdominal palpation and soft mobilization. The technique is slow; visceral tissue asks for time." } },
      { t: "55–70", es: { h: "Diafragma y respiración.",   p: "Liberación del diafragma para que respires hasta abajo. La diferencia se nota al levantarte." }, en: { h: "Diaphragm and breath.", p: "Diaphragm release so you breathe all the way down. You'll feel the difference when you stand up." } },
      { t: "70–75", es: { h: "Cierre y plan.",             p: "Notas y recomendaciones para los siguientes días: hidratación, comida ligera, paseo." }, en: { h: "Close and plan.", p: "Notes and recommendations for the next days: hydration, light food, a walk." } },
    ],
    forWhom: {
      es: ["Digestión lenta, hinchazón, reflujo crónico", "Estrés que somatiza en el abdomen", "Cicatrices abdominales (cesárea, laparoscopía) ya cerradas", "Respiración corta, sensación de «no llegar abajo»", "Síndrome de intestino irritable (acompañamiento)"],
      en: ["Slow digestion, bloating, chronic reflux", "Stress that lands in the gut", "Healed abdominal scars (C-section, laparoscopy)", "Short breath, feeling of 'not reaching the bottom'", "IBS (as a complement to medical care)"],
    },
    notFor: {
      es: ["Embarazo (existe la opción prenatal específica)", "Cirugía abdominal reciente (menos de 8 semanas)", "Hernias no diagnosticadas", "Procesos inflamatorios agudos del abdomen", "Aneurisma aórtico abdominal"],
      en: ["Pregnancy (a specific prenatal option exists)", "Recent abdominal surgery (less than 8 weeks)", "Undiagnosed hernias", "Acute abdominal inflammation", "Abdominal aortic aneurysm"],
    },
    faq: [
      { es: { q: "¿Puede sustituir a un gastro?", a: "No. Lo complementa. Si tienes síntomas digestivos persistentes, primero descarta lo médico." }, en: { q: "Does it replace a gastro doctor?", a: "No. It complements. If you have persistent digestive symptoms, rule out medical causes first." } },
      { es: { q: "¿Lo siento al día siguiente?",  a: "Es normal sentirse cansado y con más sed. La digestión cambia 24–48 horas. No es un detox; es liberación de tejido." }, en: { q: "Will I feel it the next day?",  a: "It's normal to feel tired and more thirsty. Digestion shifts for 24–48 hours. It's not a detox; it's tissue release." } },
      { es: { q: "¿Qué como antes?",             a: "Algo ligero, mínimo dos horas antes. Mejor sin café esa mañana." }, en: { q: "What do I eat beforehand?",       a: "Something light, at least two hours before. Better to skip coffee that morning." } },
    ],
    related: ["estructural", "craneal", "embarazo"],
  },

  craneal: {
    hero: {
      es: { eyebrow: "Sesión sutil · 60 min", kicker: "Cráneo-sacral",          head: "El descanso que el sistema nervioso necesita.", lede: "La sesión más sutil que ofrezco. Manos quietas sobre el cráneo, la columna y el sacro, leyendo el ritmo del líquido cefalorraquídeo. La gente sale como si hubiera dormido tres horas." },
      en: { eyebrow: "Subtle session · 60 min", kicker: "Cranio-sacral therapy", head: "The rest your nervous system needs.",          lede: "The most subtle session I offer. Still hands on the skull, spine, and sacrum, reading the rhythm of the cerebrospinal fluid. People walk out as if they'd slept three hours." },
    },
    timeline: [
      { t: "0–5",   es: { h: "Llegada en silencio.", p: "No hablamos mucho en esta sesión. La intención es bajar revoluciones desde el principio." }, en: { h: "Quiet arrival.", p: "We don't talk much in this session. The intention is to slow down from the start." } },
      { t: "5–55",  es: { h: "Manos quietas, escucha.", p: "Cincuenta minutos boca arriba, vestida, con manta. Mis manos sostienen distintas zonas durante minutos. La técnica es casi imperceptible al tacto; el cuerpo la siente." }, en: { h: "Still hands, listening.", p: "Fifty minutes face up, clothed, with a blanket. My hands hold different zones for minutes at a time. The technique is almost imperceptible to the touch; the body feels it." } },
      { t: "55–60", es: { h: "Salir despacio.", p: "Te pido que te incorpores con calma. Hidrátate. No conduzcas inmediatamente si te sientes flotando." }, en: { h: "Leave slowly.", p: "I ask you to get up calmly. Hydrate. Don't drive immediately if you feel like you're floating." } },
    ],
    forWhom: {
      es: ["Insomnio, dificultad para entrar en sueño profundo", "Migraña y cefalea tensional crónica", "Ansiedad, sensación de «estar siempre encendida»", "Recuperación de conmoción cerebral (con aval médico)", "Bruxismo, tensión mandibular"],
      en: ["Insomnia, trouble entering deep sleep", "Chronic migraine and tension headaches", "Anxiety, the sense of being 'always switched on'", "Concussion recovery (with medical clearance)", "Bruxism, jaw tension"],
    },
    notFor: {
      es: ["Conmoción cerebral reciente sin aval médico", "Hemorragia intracraneal o ictus reciente", "Aneurisma cerebral", "Fiebre alta o infección activa"],
      en: ["Recent concussion without medical clearance", "Recent intracranial hemorrhage or stroke", "Cerebral aneurysm", "High fever or active infection"],
    },
    faq: [
      { es: { q: "¿Es como un masaje suave?", a: "No. Es trabajo neurológico, aunque parezca pasivo. El efecto se siente en el sistema nervioso autónomo, no en el músculo." }, en: { q: "Is it like a soft massage?", a: "No. It's neurological work, even if it looks passive. The effect lands in the autonomic nervous system, not the muscle." } },
      { es: { q: "¿Me voy a dormir?",         a: "Mucha gente sí. Está bien. El cuerpo aprovecha que el sistema baja revoluciones." }, en: { q: "Will I fall asleep?",       a: "Many people do. That's fine. The body takes the chance while the system slows." } },
      { es: { q: "¿Cada cuánto?",             a: "Para insomnio o ansiedad, una vez a la semana durante un mes. Después, cada dos o tres semanas, según cómo te sientas." }, en: { q: "How often?",               a: "For insomnia or anxiety, weekly for a month. After that, every two or three weeks, depending on how you feel." } },
    ],
    related: ["estructural", "visceral", "postural"],
  },

  postural: {
    hero: {
      es: { eyebrow: "Primera visita · 45 min", kicker: "Lectura postural", head: "Un punto de partida.", lede: "Evaluación inicial completa. La recomiendo siempre como primera cita: salimos con un mapa claro de qué pasa y un plan de cuántas sesiones, de qué tipo, y con qué objetivo." },
      en: { eyebrow: "First visit · 45 min",    kicker: "Postural read",    head: "A starting point.",   lede: "A complete initial assessment. I always recommend it as a first visit: we leave with a clear map of what's going on and a plan — how many sessions, of what kind, with what goal." },
    },
    timeline: [
      { t: "0–15",  es: { h: "Historia.",            p: "Hablamos de tu día, tu trabajo, tus lesiones, tu sueño. La postura cuenta una historia que el cuerpo escribe; te pregunto el resto." }, en: { h: "History.", p: "We talk about your day, your work, your injuries, your sleep. Posture tells a story the body writes; I ask you the rest." } },
      { t: "15–35", es: { h: "Observación y test.",  p: "De pie, sentada, caminando. Tests articulares y de movilidad. Mediciones objetivas, no impresiones." }, en: { h: "Observation and tests.", p: "Standing, sitting, walking. Joint and mobility tests. Objective measurements, not impressions." } },
      { t: "35–45", es: { h: "Plan.",                p: "Te explico el mapa con dibujos. Cuántas sesiones, qué tipo, qué objetivos medibles. Si lo tuyo es médico y no osteopático, te lo digo." }, en: { h: "Plan.", p: "I walk you through the map with sketches. How many sessions, what type, what measurable goals. If yours is medical and not osteopathic, I'll say so." } },
    ],
    forWhom: {
      es: ["Primera vez en osteopatía", "Quieres entender de dónde viene el dolor antes de tratarlo", "Vas a empezar un plan deportivo o postparto", "Tienes varias quejas a la vez y no sabes por dónde"],
      en: ["First time in osteopathy", "You want to understand where the pain is coming from before treating", "About to start a sports or postpartum plan", "Several complaints at once and unsure where to start"],
    },
    notFor: {
      es: ["Dolor agudo que requiere alivio inmediato (mejor pasar a una sesión de 60 min)", "Diagnóstico médico previo no resuelto"],
      en: ["Acute pain that needs immediate relief (better book a 60-min session)", "Unresolved prior medical diagnosis"],
    },
    faq: [
      { es: { q: "¿Hay tratamiento en esta cita?", a: "Trabajo manual breve, sí. La sesión es sobre todo evaluación; el grueso del trabajo viene en la siguiente." }, en: { q: "Is there treatment in this visit?", a: "Brief hands-on work, yes. The session is mostly evaluation; the bulk of the work comes next." } },
      { es: { q: "¿Por qué es más barata?",        a: "Es más corta y la priorizo como puerta de entrada. No quiero que la primera visita sea una barrera de precio." }, en: { q: "Why is it cheaper?",               a: "It's shorter, and I keep it as a low-friction entry point. I don't want the first visit to be a price barrier." } },
    ],
    related: ["estructural", "visceral", "craneal"],
  },

  deportiva: {
    hero: {
      es: { eyebrow: "Sesión activa · 75 min", kicker: "Recuperación deportiva", head: "Después del esfuerzo.", lede: "Trabajo orientado a deportistas: liberación miofascial dirigida, drenaje, movilización articular y test funcional. Para volver al entrenamiento sin compensar la lesión." },
      en: { eyebrow: "Active session · 75 min", kicker: "Sports recovery",       head: "After the effort.",    lede: "Work for athletes: targeted myofascial release, drainage, articular mobilization, and functional testing. To return to training without compensating an injury." },
    },
    timeline: [
      { t: "0–10",  es: { h: "Briefing.",            p: "Disciplina, volumen semanal, lesión, fase de la temporada. Hablamos rápido — eres deportista, conoces tu cuerpo." }, en: { h: "Briefing.", p: "Discipline, weekly volume, injury, season phase. We talk quickly — you're an athlete, you know your body." } },
      { t: "10–25", es: { h: "Test funcional.",       p: "Movilidad de cadera, estabilidad lumbo-pélvica, tobillo y hombro. Veo dónde está el origen, no solo el síntoma." }, en: { h: "Functional tests.", p: "Hip mobility, lumbo-pelvic stability, ankle, and shoulder. I look for the origin, not just the symptom." } },
      { t: "25–65", es: { h: "Trabajo manual intenso.", p: "Cuarenta minutos de liberación, manipulación y drenaje. Es más activo que mis otras sesiones; lo notas." }, en: { h: "Intense hands-on work.", p: "Forty minutes of release, manipulation, and drainage. More active than my other sessions; you'll feel it." } },
      { t: "65–75", es: { h: "Re-test y plan.",       p: "Volvemos a medir. Te llevas dos o tres ejercicios para los siguientes entrenamientos." }, en: { h: "Re-test and plan.", p: "We measure again. You take home two or three exercises for the coming sessions." } },
    ],
    forWhom: {
      es: ["Deportista amateur o profesional", "Lesión por sobrecarga, no aguda", "Vuelta al entrenamiento tras lesión", "Preparación para una competencia (no la semana de)", "Maratón / triatlón / crossfit / ciclismo de fondo"],
      en: ["Amateur or pro athlete", "Overuse injury, not acute", "Return to training after injury", "Pre-competition prep (not race week)", "Marathon / triathlon / crossfit / endurance cycling"],
    },
    notFor: {
      es: ["Lesión aguda con inflamación severa (primero RICE y médico)", "Sospecha de fractura por estrés sin imagen", "Dentro de las 48h previas a una competencia importante"],
      en: ["Acute injury with severe inflammation (RICE and doctor first)", "Suspected stress fracture without imaging", "Within 48h of a major competition"],
    },
    faq: [
      { es: { q: "¿Cuándo entreno después?",  a: "Ese día, descanso o trote suave. Al siguiente, vuelta normal. Si la sesión fue muy profunda, te aviso." }, en: { q: "When can I train after?", a: "That day, rest or light jog. Next day, back to normal. If the session was very deep, I'll tell you." } },
      { es: { q: "¿Antes de competencia?",    a: "Mínimo 5–7 días antes. Una semana antes hago sesiones más suaves orientadas a movilidad, no liberación profunda." }, en: { q: "Before a race?",          a: "At least 5–7 days before. The week of, I do softer mobility sessions — not deep release." } },
    ],
    related: ["estructural", "craneal", "postural"],
  },

  embarazo: {
    hero: {
      es: { eyebrow: "Sesión segura · 60 min", kicker: "Acompañamiento prenatal", head: "Para los nueve meses.", lede: "Trabajo seguro y especializado durante el embarazo, en cualquier trimestre. Posiciones adaptadas, técnica suave y enfocada en sacro, pelvis, lumbar y diafragma." },
      en: { eyebrow: "Safe session · 60 min",  kicker: "Prenatal care",           head: "For the nine months.",  lede: "Safe, specialized work during pregnancy, at any trimester. Adapted positioning, soft technique, focused on sacrum, pelvis, lower back, and diaphragm." },
    },
    timeline: [
      { t: "0–10",  es: { h: "Cómo vas.",                    p: "Trimestre, controles médicos, dolores nuevos. Si hay algo que tu obstetra no sepa, lo hablamos." }, en: { h: "How you're doing.", p: "Trimester, medical check-ups, new aches. If there's something your OB doesn't know, we talk about it." } },
      { t: "10–50", es: { h: "Trabajo en lateral o semi-sentada.", p: "Cuarenta minutos en posición segura, con cojines. Lumbar, sacro, pelvis, costillas para que respires; cuello y hombros que cargan el peso del pecho." }, en: { h: "Side-lying or semi-seated work.", p: "Forty minutes in safe positioning, with pillows. Lower back, sacrum, pelvis, ribs so you breathe; neck and shoulders that carry the chest's weight." } },
      { t: "50–60", es: { h: "Cierre.",                      p: "Recomendaciones para dormir, sentarte y levantarte de la cama. Cosas pequeñas que cambian la semana." }, en: { h: "Close.", p: "Recommendations for sleeping, sitting, getting out of bed. Small things that change the week." } },
    ],
    forWhom: {
      es: ["Embarazo de bajo riesgo, cualquier trimestre", "Lumbalgia, ciática del embarazo", "Dificultad para dormir por incomodidad postural", "Preparación al parto (último trimestre)", "Postparto, una vez la cuarentena cierra"],
      en: ["Low-risk pregnancy, any trimester", "Pregnancy-related low back pain or sciatica", "Trouble sleeping due to postural discomfort", "Birth preparation (third trimester)", "Postpartum, once the recovery period closes"],
    },
    notFor: {
      es: ["Embarazo de alto riesgo sin aval del obstetra", "Amenaza de parto prematuro", "Sangrado vaginal activo", "Hipertensión gestacional no controlada"],
      en: ["High-risk pregnancy without OB clearance", "Threatened preterm labor", "Active vaginal bleeding", "Uncontrolled gestational hypertension"],
    },
    faq: [
      { es: { q: "¿Es seguro en el primer trimestre?", a: "Sí, con técnica adaptada y suave. Si hay sangrado o riesgo, esperamos al segundo." }, en: { q: "Is it safe in the first trimester?", a: "Yes, with adapted soft technique. If there's bleeding or risk, we wait until the second." } },
      { es: { q: "¿Postparto, cuándo?",               a: "Después de la cuarentena (40 días) y con el alta del ginecólogo. Antes, solo trabajo cráneo-sacral si hay molestias específicas." }, en: { q: "Postpartum, when?",                a: "After the 40-day recovery period and with OB clearance. Before that, only cranio-sacral work if there are specific complaints." } },
      { es: { q: "¿Mi pareja puede acompañarme?",     a: "Sí, siempre. Especialmente en las últimas semanas, suele ser útil para los dos." }, en: { q: "Can my partner come?",             a: "Yes, always. Especially in the last weeks — it's often useful for both of you." } },
    ],
    related: ["craneal", "visceral", "postural"],
  },
};
