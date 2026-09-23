# Hero media assets (Fase 2 — Clip 01)

Real clinic footage from clip `0f2c7285.mp4` (prone back massage, no patient face).
Wired into `HomeHeroSection` → `HeroVideo` via the paths below.

## Files

| File | Role |
|------|------|
| `hero-mobile.mp4` | Mobile `<source>` — **native vertical** (no landscape crop), ~720×1292 |
| `hero-desktop.mp4` | Desktop `<source>` — **style B** only: vertical footage centered, left/right filled with heavily blurred enlarged same frame (no A-crop, no A/B toggle) |
| `hero-poster.webp` | Poster + reduced-motion / autoplay-failure fallback |

## Trim / encode notes (Fase 2)

- **Source:** `/workspace/katya-clips/0f2c7285.mp4` (~172s, 464×832)
- **Trim used:** **54.0s – 70.0s** (16s hands-on-back loop; matches style-B mockup composition)
- **Codec:** H.264 (`libx264`), **no audio** (`-an`), `yuv420p`, `+faststart`
- **Mobile:** native vertical, width ≤720, target **&lt;3 MB**
- **Desktop:** 1280×720 style-B blur fill, target **&lt;8 MB**
- **Poster:** still from ~56s of source (2s into trim)

## Compression targets

- Mobile: under **3 MB**, max ~**720 px** wide
- Desktop: under **8 MB**, max ~**1080–1280 px** wide
- Prefer short loops (≈10–20 s) so autoplay stays reliable on cellular

## Example ffmpeg (reference)

```bash
# Mobile — native vertical
ffmpeg -ss 54 -t 16 -i 0f2c7285.mp4 -an -c:v libx264 -pix_fmt yuv420p \
  -vf "scale=720:-2" -crf 27 -movflags +faststart public/hero/hero-mobile.mp4

# Desktop — style B blurred-background fill
ffmpeg -ss 54 -t 16 -i 0f2c7285.mp4 -an -c:v libx264 -pix_fmt yuv420p \
  -filter_complex "\
[0:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,gblur=sigma=56[bg];\
[0:v]scale=-2:720[fg];\
[bg][fg]overlay=(W-w)/2:(H-h)/2:format=auto,format=yuv420p" \
  -crf 22 -movflags +faststart public/hero/hero-desktop.mp4

# Poster
ffmpeg -ss 56 -i 0f2c7285.mp4 -frames:v 1 -vf "scale=720:-2" \
  -c:v libwebp -quality 85 public/hero/hero-poster.webp
```
