# Conexión clínica ↔ OsteoRAG

Documento corto para Frank y para el bot que mejora OsteoRAG.  
Última actualización: 2026-09-23 (PT) — Phase C feedback forward

## Roles

| Pieza | Rol |
|-------|-----|
| **katya-heras-clinica** (este repo) | Cliente: UI admin, proxy Next.js, feedback 👍/👎, Publicidad (Groq), aprendizaje ML local |
| **OsteoRAG Worker** | Fuente de verdad del corpus RAG: embeddings, retrieval, generación citada, `/api/config` + `/api/chat` + opcional `/api/feedback` |

La clínica **no** re-despliega para recibir mejoras del Worker. Mejora OsteoRAG → deploy Worker → la clínica ya apunta al mismo `OSTEORAG_BASE_URL`.

## URL oficial

```
https://osteorag.alonsosky617.workers.dev
```

Health útil: `GET /api/config` debe responder **200** (público; no exige auth).

Proxies en la clínica:

- `POST /api/ai/osteorag` — consulta corpus desde ficha paciente
- `POST /api/ai/publicidad` — usa el corpus del Worker + Groq en la clínica
- `POST /api/ai/feedback` — guarda 👍/👎 en ML local; en 👎 con títulos hace forward best-effort al Worker

Default en código (si falta el env): misma URL oficial  
(`src/lib/osteoragClient.ts` — usado por osteorag, publicidad y feedback).

## Variables Vercel (proyecto `katya-heras-clinica`)

| Variable | Obligatoria | Notas |
|----------|-------------|--------|
| `OSTEORAG_BASE_URL` | Recomendada en Production + Preview | URL del Worker (sin barra final) |
| `OSTEORAG_EMAIL` | Sí (flujo normal) | Login Supabase del Worker |
| `OSTEORAG_PASSWORD` | Sí (flujo normal) | Par de EMAIL |
| `OSTEORAG_BEARER_TOKEN` | Alternativa | Si está, salta login email/password |
| `OSTEORAG_BASIC_USER` / `OSTEORAG_BASIC_PASS` | Alternativa legacy | Solo si el Worker aún acepta Basic |

No copiar secretos a este doc ni a PRs. Configurar en el dashboard Vercel del **proyecto** (no Shared Env genérico, salvo que Frank decida unificar).

Development local: definir las mismas vars en `.env.local` (no commitear).

## Flujo de deploy (mejoras automáticas en clínica)

1. Mejorar OsteoRAG (corpus, prompts Worker, retrieval, auth).
2. Desplegar el Worker (`wrangler deploy` o el pipeline del repo OsteoRAG).
3. Verificar `GET https://osteorag.alonsosky617.workers.dev/api/config` → 200.
4. **No hace falta** redeploy de la clínica si solo cambió el Worker y la URL/envs no cambiaron.
5. Smoke en clínica (abajo).

Si cambias la URL del Worker, actualiza `OSTEORAG_BASE_URL` en Production **y** Preview (mismo valor) y redeploya la clínica.

## Qué se queda solo en la clínica

- UI admin (ficha, botón “Consultar material de estudio”, Publicidad, Insights)
- Feedback 👍/👎 y tablas ML (`ai_clinical_*`, marketing) + `OSTEORAG_PROMPT_VERSION` (`src/lib/ai-learning.ts`)
- Publicidad: generación copy con **Groq** (el Worker solo aporta contexto de corpus)
- Auth de staff clínica (sesión Supabase clínica ≠ usuario OsteoRAG)
- Envío al Worker: pregunta + contexto clínico acotado — **nunca** nombre/email/teléfono del paciente

## Privacidad / PII

- No enviar PII de pacientes a OsteoRAG.
- El proxy arma `message` con pregunta + notas clínicas truncadas; el `patient_id` vive solo en audit clínica.
- Datasets de learning en clínica: sin `patient_id` en tablas ML de producto; audit aparte.

## Smoke test

1. Sesión staff en prod o preview.
2. Abrir ficha de un paciente: `/admin/pacientes/[id]`.
3. Usar **Consultar material de estudio** (OsteoRAG).
4. Esperar respuesta con citas + disclaimer; sin error `OSTEORAG_AUTH`.
5. Opcional: 👍/👎 y comprobar que no rompe el flujo.

## Contrato opcional — `POST /api/feedback` (Phase C)

La clínica ya reenvía 👎 al Worker cuando hay títulos de fuentes/citas.  
**El Worker puede no implementarlo aún** — la clínica degrada con gracia (log `warn`, responde `ok:true` al staff porque el save local ya ocurrió).

| Campo | Valor |
|-------|--------|
| Path | `POST ${OSTEORAG_BASE_URL}/api/feedback` |
| Auth | Igual que `/api/chat` (Bearer JWT / BEARER env / Basic legacy) |
| Cuándo | Tras `applyRating` exitoso con `rating === -1` y `downvoted_titles` no vacío |
| PII | **Nunca** `patientId`, nombres, emails, teléfonos, notas clínicas ni `output_preview` |

Request body (JSON):

```json
{
  "rating": -1,
  "source": "publicidad" | "osteorag" | "resumen_clinico" | "feedback",
  "topic_or_question": "...",
  "downvoted_titles": ["title1", "..."],
  "prompt_version": "orag-v1"
}
```

- `topic_or_question` y `prompt_version` son opcionales.
- Respuesta esperada: `{ "ok": true }` (u otro 2xx JSON).
- Errores esperados mientras el bot OsteoRAG no lo implemente: **404** / **501** / red — la clínica solo hace `console.warn` y no falla el feedback del usuario.

Implementación clínica: `forwardOsteoFeedback` en `src/lib/osteoragClient.ts`, llamado desde `src/app/api/ai/feedback/route.ts`.

## Handoff — bot / repo OsteoRAG

Contrato que la clínica asume (no romper sin coordinar con PR en este repo):

1. Mantener **`GET /api/config`** estable (200 + `supabaseUrl` / `supabaseAnonKey` cuando auth es email/password).
2. Mantener **`POST /api/chat`** con body `{ message, folderFilter? }` y respuesta JSON `{ answer, citations }` (o `error`).
3. Auth: Bearer JWT Supabase (y Basic solo si sigue documentado como emergencia).
4. **Opcional:** implementar **`POST /api/feedback`** (ver sección arriba) para demote de chunks con 👎; hasta entonces la clínica solo loguea warn.
5. No exigir redeploy de la clínica para mejoras de corpus/prompts del Worker.
6. Si cambias path, auth o forma del JSON, avisar y abrir PR coordinado en `katya-heras-clinica` (rama desde `dev`, PR a `dev`).

Ver también: `docs/ROADMAP_ML.md`.
