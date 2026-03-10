# White Noise Generator

## Project Structure

Single-file application: everything lives in `index.html` (HTML + CSS + JS).

Design docs in `docs/plans/`.

## Architecture

### Audio Engine (Web Audio API)

```
whiteSource (AudioWorklet) ──→ whiteGain ──→ destination
brownSource (AudioWorklet) ──→ brownGain ──→ destination
tinnitusOsc × 5 (4414–4652 Hz sines) ──→ perVoiceGain ──→ tinnitusGain ──→ destination
  ↑ each frequency modulated by:
  LFO1 (~0.75 Hz, ±70 Hz)  — primary shimmer (rate offset per voice)
  LFO2 (~1.85 Hz, ±30 Hz)  — fast wobble
  LFO3 (~0.28 Hz, ±20 Hz)  — slow drift
  noiseSrc → LPF 2Hz → ±50 Hz  — organic random FM
oceanSource (AudioWorklet, brown-noise) ──→ lowpass (500 Hz) ──→ oceanWaveGain ──→ oceanGain ──→ destination
  ↑ gain modulated by:
  LFO1 (0.08 Hz, ±0.3)   — main wave crash
  LFO2 (0.05 Hz, ±0.15)  — slow swell
  LFO3 (0.12 Hz, ±0.1)   — overlapping waves
```

- AudioWorklet processors are embedded as a string and loaded via blob URL (keeps everything in one file)
- Each audio source has its own GainNode with exponential curve (`v * v * 0.3`)
- AudioContext is lazily initialized on first user gesture (browser requirement)
- Gain changes use `linearRampToValueAtTime` with 50ms ramp to avoid clicks

### Visual Layers (Canvas)

Three layers composited on a single full-viewport `<canvas>`:

1. **Static** — downscaled 4x ImageData with Uint32Array writes, regenerated every 3 frames
2. **Particles** — 200 brownian-motion rectangles with cached color strings
3. **Spiral** — pre-rendered to offscreen canvas, stamped with rotation each frame

Opacity for each layer is lerped toward its slider target at 0.06/frame.

### UI

- Glassmorphism control panel, centered with CSS transform
- Minimizable to a corner restore button
- All sliders are `<input type="range">` with custom styling
- State is synced from DOM on load (handles browser autocomplete restoration)

## Conventions

- Keep everything in `index.html` — no build step, no splitting
- New audio sources: create a gain node, connect to destination, add slider + event listener
- New visual layers: add draw function, opacity state + lerp in `frame()`, add slider
- Use `createLFO()` helper for any new frequency/parameter modulation
- Volume always goes through `sliderToGain()` for consistent exponential curve + cap

## Versioning

The version is displayed in the control panel UI via the `.version-label` span (semver format, e.g. `v1.0.0`). Bump the version on every commit/push:
- **Patch** (v1.0.x): bug fixes, tweaks, styling changes
- **Minor** (v1.x.0): new features, new audio sources, new visual layers
- **Major** (vX.0.0): breaking changes, major redesigns

## Keyboard Shortcuts

- Space: play/pause
- V: toggle visuals on/off (saves GPU when disabled)
- C: toggle control panel visibility

## PWA / Offline

- `manifest.json` — web app manifest (name, icons, theme, display mode)
- `sw.js` — service worker with stale-while-revalidate caching
- `icons/` — 192px and 512px PNG app icons
- App is installable to home screen on iOS and Android
- Cache auto-updates via stale-while-revalidate — no manual version bumping needed
- Updates are one visit behind: user gets cached version instantly, fresh copy loads next time
