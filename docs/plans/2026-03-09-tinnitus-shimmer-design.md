# Tinnitus Shimmer Sound Design

## Context

Frequency analysis of a commercial "Tinnitus Shimmer - Sound Therapy Relief" audio revealed the following characteristics:

- **Primary tone**: ~4533 Hz with -3dB bandwidth of ~233 Hz (4388-4621 Hz)
- **Shimmer modulation**: Frequency wobbles via multiple layered modulation rates:
  - 0.75 Hz (1.3s period) — primary shimmer
  - 1.85 Hz (0.5s period) — fast secondary wobble
  - 0.28 Hz (3.5s period) — slow drift
- **White noise**: Flat spectrum layered underneath (already exists as separate slider)
- **Weak harmonics** at 2x and 3x (artifacts, not intentional — we ignore these)

The current tinnitus implementation is a plain 4500 Hz sine wave with no modulation.

## Design

### Approach: Native Web Audio API LFO Modulation

Use OscillatorNodes as LFOs connected to the carrier's `frequency` AudioParam. All modulation runs on the audio thread — zero JS scheduling overhead.

### Signal Chain

```
LFO1 (0.75 Hz sine) -> Gain1 (+-50 Hz) --+
LFO2 (1.85 Hz sine) -> Gain2 (+-20 Hz) --+--> carrier.frequency AudioParam
LFO3 (0.28 Hz sine) -> Gain3 (+-15 Hz) --+

Carrier (4533 Hz sine) -> tinnitusGain -> destination
```

### Parameters

| Component | Type | Frequency | Depth | Purpose |
|-----------|------|-----------|-------|---------|
| Carrier | Sine oscillator | 4533 Hz | — | Main tone |
| LFO1 | Sine oscillator | 0.75 Hz | +-50 Hz | Primary shimmer (1.3s cycle) |
| LFO2 | Sine oscillator | 1.85 Hz | +-20 Hz | Fast secondary wobble |
| LFO3 | Sine oscillator | 0.28 Hz | +-15 Hz | Slow drift (3.5s cycle) |

Combined modulation range: ~4448-4618 Hz (aligns with analyzed -3dB bandwidth of 4388-4621 Hz).

### Code Changes

- Replace the plain oscillator in `initAudio()` with carrier + 3 LFOs
- Add a `createLFO(ctx, rate, depth, target)` helper function
- Carrier frequency changes from 4500 to 4533
- No UI, state, or gain node changes — only the oscillator setup

### What Stays the Same

- `tinnitusGain` node and connection to destination
- Volume slider and event handler
- `sliderToGain()` / `MAX_VOLUME` / `RAMP_TIME`
- `state.tinnitusVolume` property
- HTML/CSS for the slider row
