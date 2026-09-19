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
| Eval corpus (14/14 PASS vía Worker) | notas 2026-09-17 |
| Migración tablas Opus (Supabase clínica) | `ai_marketing_events`, `ai_clinical_events` (sin `patient_id`), `ai_clinical_audit` |
| `ai_learning_events` | **DEPRECATED** — no escribir filas nuevas |

## En curso (P0 — refactor loop Opus)

1. Partir escritura: marketing vs clinical vs audit
2. Campos: `prompt_version`, `model`, `output_draft`, `output_published`
3. Publicidad: copiar → `publish`; semana → `outcome` (leads/citas)
4. 👎 → `downvoted_sources` (priorizar sobre reforzar 👍)
5. Quitar diagnóstico `present` del API OsteoRAG
6. Fallback modelos Groq en Publicidad
7. Página Insights en admin
8. Eval 5 temas distintos en Publicidad

## Siguiente (P1)

- Insights con filtros/export
- Demote de chunks con 👎 en OsteoRAG Worker
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
- Prod: https://katya-heras-clinica.vercel.app
- OsteoRAG: https://osteorag.alonsosky617.workers.dev
