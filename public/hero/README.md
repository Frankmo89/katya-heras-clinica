# Hero media assets (Phase 1 placeholders)

These files are **placeholders** until Frank supplies the final clinic clip (Phase 2).
Do not invent or download replacement stock footage here.

## Current files

| File | Role |
|------|------|
| `hero-mobile.mp4` | Mobile-width `<source>` (Phase 1: copy of existing `hero-reel.mp4`) |
| `hero-desktop.mp4` | Desktop-width `<source>` (Phase 1: same placeholder) |
| `hero-poster.webp` | Poster frame + reduced-motion / autoplay-failure fallback |

## Compression targets (when the real clip arrives)

- **Codec:** H.264 (`libx264`), **no audio** track
- **Mobile:** under **3 MB**, max ~**720 px** wide
- **Desktop:** under **8 MB**, max ~**1080 px** wide
- Prefer short loops (≈10–20 s) and moderate bitrate so autoplay stays reliable on cellular

### Example ffmpeg (Phase 2)

```bash
# Mobile (~720px wide, no audio, H.264)
ffmpeg -i source.mp4 -an -c:v libx264 -pix_fmt yuv420p -vf "scale=720:-2" -movflags +faststart public/hero/hero-mobile.mp4

# Desktop (~1080px wide, no audio, H.264)
ffmpeg -i source.mp4 -an -c:v libx264 -pix_fmt yuv420p -vf "scale=1080:-2" -movflags +faststart public/hero/hero-desktop.mp4

# Poster WebP from a representative frame
ffmpeg -ss 1 -i source.mp4 -frames:v 1 -c:v libwebp -quality 82 public/hero/hero-poster.webp
```

Tune `-crf` / bitrate until each file is under the size caps above.
