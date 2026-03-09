# White Noise Generator

A browser-based noise generator with layered audio and visual effects. Zero dependencies, single HTML file.

**Live:** [joelmgallant.com/whitenoise](https://joelmgallant.com/whitenoise/)

## Audio

- **White noise** — uniform random via AudioWorklet
- **Brown noise** — integrated random walk via AudioWorklet
- **Tinnitus shimmer** — 4533 Hz sine carrier with 3-LFO frequency modulation (~4448–4618 Hz swept range)

Each has an independent volume slider. Exponential gain curve (x^2) with a 0.3 cap keeps things comfortable.

## Visuals

- **TV Static** — downscaled random grayscale pixels, chunky CRT aesthetic
- **Particles** — brownian-motion drifting rectangles in warm earth tones
- **Spiral** — pre-rendered hypnotic spiral with configurable rotation speed/direction

Each visual layer has an opacity slider. Transitions are smoothly lerped.

## Controls

| Key | Action |
|-----|--------|
| Space | Play / Pause |
| C | Toggle control panel |

The panel can also be minimized with the button in its top-right corner.

## Tech

- Web Audio API with AudioWorklet for glitch-free noise generation
- OscillatorNode + GainNode LFOs for tinnitus shimmer modulation
- Single `<canvas>` with offscreen pre-rendering for the spiral
- Glassmorphism UI overlay
- No build step, no dependencies — just open `index.html`
