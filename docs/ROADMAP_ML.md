# Roadmap ML + producto — Katya Heras Clínica × OsteoRAG

Documento vivo para llevar el trabajo **en orden**. Actualizar al cerrar cada fase.

Última actualización: 2026-09-17 (PT)

## Norte

Asistente profesional para osteopatía / masaje / kinesiotape:

- Corpus (OsteoRAG) anclado en material de estudio
- Admin clínica (fichas, citas, resumen clínico)
- Publicidad (estrategia + IG/FB) desde el corpus
- Loop de aprendizaje con privacidad (instrumentar → aprender)

## Hecho

| Ítem | Dónde |
|------|--------|
| OsteoRAG desde ficha paciente | `/admin/pacientes/[id]` + `POST /api/ai/osteorag` |
| Env Vercel proyecto (no Shared) | `OSTEORAG_BASE_URL`, `OSTEORAG_EMAIL`, `OSTEORAG_PASSWORD` |
| Módulo Publicidad | `/admin/publicidad` + `POST /api/ai/publicidad` |
| Eval corpus (14/14 PASS vía Worker) | notas internas 2026-09-17 |
| Migración tablas Opus (Supabase `hlotbgirhjbnppdtllkv`) | `ai_marketing_events`, `ai_clinical_events` (sin `patient_id`), `ai_clinical_audit` |
| `ai_learning_events` | **DEPRECATED** — no escribir filas nuevas |

## En curso (P0 — refactor loop Opus)

1. Partir escritura de app: marketing vs clinical vs audit
2. Campos: `prompt_version`, `model`, `output_draft`, `output_published`
3. Publicidad: al copiar → `publish`; a la semana → `outcome` (leads/citas)
4. 👎 envía `downvoted_sources` (priorizar sobre reforzar 👍)
5. Quitar diagnóstico `present` del API OsteoRAG
6. Fallback de modelos Groq en Publicidad
7. Página Insights en admin
8. Eval 5 temas distintos en Publicidad (diversidad de estrategia)

## Siguiente (P1)

- Panel Insights con filtros y export
- Re-ranking / demote de chunks con 👎 (OsteoRAG Worker)
- Auth unificada clínica ↔ OsteoRAG (dejar de depender solo de env Basic/email en Vercel)
- Publicidad: tonos + calendario 7 días + idea visual
- Noticias/tendencias **separadas** del corpus (etiqueta clara)
- Blindar proxy ante Vercel Security Checkpoint (admin autenticado / allowlist)

## Más adelante (P2 — ML “de verdad”)

- Gold set 30–50 Q&A aprobadas por Katya + eval en cada deploy
- Outcome marketing ligado a CRM (citas reales)
- Fine-tune solo con cientos de ratings/diffs útiles (no antes)
- Retención / consentimiento / políticas por tabla

## Principios (Opus + acuerdo)

1. **Dos tablas ML** (marketing ≠ clínica) — RLS y retención distintas
2. **Sin `patient_id` en datasets ML** — trazabilidad clínica solo en `ai_clinical_audit` / ficha
3. **Señal útil = diff draft → published** (y outcomes), no solo 👍
4. **Priorizar 👎** para sacar fuentes malas (evitar cámara de eco)
5. **Siempre `prompt_version` + `model`** para atribuir mejoras
6. Validar Publicidad con **≥5 temas** distintos, no una sola campaña

## Cómo trabajar esto

- Este archivo es la fuente de orden en el repo
- PRs deben referenciar la fase (P0 / P1 / P2)
- No mezclar “biblioteca de PDFs en admin” — el corpus vive en OsteoRAG

## Enlaces

- Repo: https://github.com/Frankmo89/katya-heras-clinica
- Prod: https://katya-heras-clinica.vercel.app
- OsteoRAG: https://osteorag.alonsosky617.workers.dev
