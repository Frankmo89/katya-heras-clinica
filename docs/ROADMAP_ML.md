# Roadmap ML + producto — Katya Heras Clínica × OsteoRAG

Documento vivo para llevar el trabajo **en orden**. Actualizar al cerrar cada fase.

Última actualización: 2026-09-23 (PT)

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
| Eval corpus (14/14 PASS vía Worker) | notas 2026-09-17 |
| Migración tablas Opus (Supabase clínica) | `ai_marketing_events`, `ai_clinical_events` (sin `patient_id`), `ai_clinical_audit` — ver `supabase/migrations/0038_split_ai_learning_tables_opus.sql` (idempotente; ya aplicada en live) |
| `ai_learning_events` | **DEPRECATED** — no escribir filas nuevas |
| Split escritura ML (P0) | `src/lib/ai-learning.ts` → marketing / clinical / audit |
| `prompt_version` + `model` + draft/published | Publicidad + OsteoRAG + resumen clínico |
| Publicidad copy → publish; outcome leads/citas | `POST /api/ai/publicidad/publish`, `.../outcome` + UI |
| 👎 → `downvoted_sources` | feedback + Publicidad + OsteoRagConsult |
| Quitar `present` del API OsteoRAG | solo `console.warn` server-side |
| Fallback modelos Groq | `GROQ_MODEL_FALLBACK` en `ai-learning.ts` |
| Página Insights admin | `/admin/insights` + `GET /api/ai/insights` + nav |
| Eval 5 temas Publicidad | `docs/evals/publicidad-5-topics.md` + `scripts/eval-publicidad-diversity.mjs` |
| Phase C: forward 👎 → Worker (sin PII) | `forwardOsteoFeedback` en `osteoragClient.ts` + `POST /api/ai/feedback`; Worker `/api/feedback` aún pendiente |

## En curso (P0 — remates)

- Correr eval 5 temas en prod con `GROQ_API_KEY` + OsteoRAG (checklist listo; secrets no están en el box de CI)
- Observar Insights con datos reales post-deploy

## Siguiente (P1)

- Insights con filtros/export
- Demote de chunks con 👎 en OsteoRAG Worker (**clínica ya reenvía**; falta implementar `POST /api/feedback` + demote en el bot OsteoRAG)
- Auth unificada clínica ↔ OsteoRAG
- Publicidad: tonos + calendario 7 días + idea visual
- Noticias/tendencias separadas del corpus
- Blindar proxy ante Vercel Security Checkpoint

## Más adelante (P2)

- Gold set 30–50 Q&A + eval por deploy
- Outcome marketing ligado a CRM
- Fine-tune solo con muchos diffs/ratings útiles
- Retención / consentimiento por tabla

## Principios

1. Dos tablas ML (marketing ≠ clínica)
2. Sin `patient_id` en datasets ML (audit aparte)
3. Señal útil = draft → published (+ outcomes)
4. Priorizar 👎 antes que reforzar 👍
5. Siempre `prompt_version` + `model`
6. Validar Publicidad con ≥5 temas distintos

## Enlaces

- Repo: https://github.com/Frankmo89/katya-heras-clinica
- Prod: https://katyaheras.app
- Prod (Vercel alias): https://katya-heras-clinica.vercel.app
- OsteoRAG: https://osteorag.alonsosky617.workers.dev
