# Eval Publicidad — 5 temas (diversidad)

Fecha checklist: 2026-09-22 (PT)  
Prompt version esperada: `pub-v1`  
Script: `scripts/eval-publicidad-diversity.mjs`

## Temas

1. Osteopatía visceral
2. Masaje tailandés espalda
3. Kinesiotape lumbar
4. Cervicalgia / cuello
5. Fascia / liberación miofascial

## Criterios de diversidad (PASS si se cumplen)

Para cada par de temas, el pack generado debe:

- [ ] Tener **ángulo / objetivo** distinto en `estrategia` (no copy-paste)
- [ ] `articulo_corto` con vocabulario y foco distintos (≥60% tokens únicos vs otros)
- [ ] Tips / datos curiosos no idénticos entre temas
- [ ] Captions IG/FB con CTA o gancho distinto
- [ ] Incluir `eventId`, `model`, `prompt_version` en la respuesta API
- [ ] Anclarse al corpus (citas o disclaimer si el material no alcanza) — sin inventar estudios

## Cómo correr

```bash
# Contra API local o prod (requiere sesión staff + secrets en el server)
BASE_URL=https://katyaheras.app \
  STAFF_ACCESS_TOKEN=... \
  node scripts/eval-publicidad-diversity.mjs

# Solo corpus OsteoRAG (sin Groq) — diversidad de material recuperado
OSTEORAG_BASE_URL=https://osteorag.alonsosky617.workers.dev \
  OSTEORAG_EMAIL=... OSTEORAG_PASSWORD=... \
  node scripts/eval-publicidad-diversity.mjs --corpus-only
```

## Resultado

| Tema | Ángulo distinto | Artículo distinto | Model | Prompt | Notas |
|------|-----------------|-------------------|-------|--------|-------|
| Osteopatía visceral | ☐ | ☐ | | pub-v1 | |
| Masaje tailandés espalda | ☐ | ☐ | | pub-v1 | |
| Kinesiotape lumbar | ☐ | ☐ | | pub-v1 | |
| Cervicalgia / cuello | ☐ | ☐ | | pub-v1 | |
| Fascia / liberación miofascial | ☐ | ☐ | | pub-v1 | |

**Estado:** checklist listo; ejecución con secrets pendiente (no disponibles en el box del agente).
