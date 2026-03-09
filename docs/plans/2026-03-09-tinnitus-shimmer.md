# Tinnitus Shimmer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the plain 4500 Hz sine tinnitus tone with a shimmering ~4533 Hz tone modulated by 3 LFOs, matching a commercial tinnitus relief audio's frequency profile.

**Architecture:** Three sine-wave LFO oscillators modulate the carrier oscillator's frequency AudioParam. All modulation runs natively on the Web Audio API's audio thread — zero JS scheduling. Existing gain/volume/slider infrastructure stays untouched.

**Tech Stack:** Web Audio API (OscillatorNode, GainNode, AudioParam connections)

---

### Task 1: Add createLFO helper function

**Files:**
- Modify: `whitenoise.html:291` (after `sliderToGain` function)

**Step 1: Add the helper after the closing brace of `sliderToGain` (line 291)**

Insert after line 291:

```javascript

/** Create a low-frequency oscillator that modulates a target AudioParam.
 *  @param {AudioContext} ctx  - audio context
 *  @param {number} rate       - LFO frequency in Hz
 *  @param {number} depth      - modulation depth (peak deviation in target's units)
 *  @param {AudioParam} target - the AudioParam to modulate (e.g. oscillator.frequency) */
function createLFO(ctx, rate, depth, target) {
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = rate;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = depth;
  lfo.connect(lfoGain);
  lfoGain.connect(target);
  lfo.start();
}
```

**Step 2: Verify no syntax errors**

Open `whitenoise.html` in a browser, open the dev console, confirm no errors on page load.

**Step 3: Commit**

```bash
git add whitenoise.html
git commit -m "feat: add createLFO helper for audio param modulation"
```

---

### Task 2: Replace plain tinnitus oscillator with shimmer carrier + 3 LFOs

**Files:**
- Modify: `whitenoise.html:358-363` (the tinnitus oscillator block in `initAudio()`)

**Step 1: Replace lines 358-363**

Replace:
```javascript
  // Create 4500 Hz sine oscillator for tinnitus tone
  const tinnitusOsc = audioCtx.createOscillator();
  tinnitusOsc.type = 'sine';
  tinnitusOsc.frequency.value = 4500;
  tinnitusOsc.connect(tinnitusGain);
  tinnitusOsc.start();
```

With:
```javascript
  // Create 4533 Hz carrier oscillator with shimmer modulation.
  // Three LFOs modulate the carrier frequency to produce a shimmering effect
  // matching analyzed tinnitus relief audio (~4388–4618 Hz swept range).
  const tinnitusOsc = audioCtx.createOscillator();
  tinnitusOsc.type = 'sine';
  tinnitusOsc.frequency.value = 4533;
  tinnitusOsc.connect(tinnitusGain);
  createLFO(audioCtx, 0.75, 50, tinnitusOsc.frequency);  // primary shimmer (1.3s cycle)
  createLFO(audioCtx, 1.85, 20, tinnitusOsc.frequency);  // fast wobble (0.5s cycle)
  createLFO(audioCtx, 0.28, 15, tinnitusOsc.frequency);  // slow drift (3.5s cycle)
  tinnitusOsc.start();
```

**Step 2: Update state comment**

On line 253, change:
```javascript
  tinnitusVolume: 0,        // 4500 Hz tinnitus tone volume (0–1), controlled by its own slider
```
To:
```javascript
  tinnitusVolume: 0,        // 4533 Hz shimmer tinnitus tone volume (0–1), controlled by its own slider
```

**Step 3: Update architecture comment**

Replace the architecture comment block (lines 269-278) to include tinnitus signal chain:
```javascript
//  AUDIO ENGINE (Web Audio API)
//
//  Architecture:
//    whiteSource ──────────────────────────→ whiteGain → destination
//    brownSource ──────────────────────────→ brownGain → destination
//    tinnitusOsc (4533 Hz sine carrier) ──→ tinnitusGain → destination
//      ↑ frequency modulated by:
//      LFO1 (0.75 Hz, ±50 Hz)  — primary shimmer
//      LFO2 (1.85 Hz, ±20 Hz)  — fast wobble
//      LFO3 (0.28 Hz, ±15 Hz)  — slow drift
//
//  Each sound type has its own gain node controlled by
//  a dedicated slider. All sources always run; volume
//  at 0 means silence.
```

**Step 4: Manual test — open in browser**

1. Open `whitenoise.html` in a browser
2. Click play
3. Slide the Tinnitus slider up
4. Confirm: you hear a shimmering, gently wobbling high-pitched tone (not a flat pure sine)
5. Confirm: White and Brown noise sliders still work independently
6. Confirm: no console errors

**Step 5: Commit**

```bash
git add whitenoise.html
git commit -m "feat: replace plain tinnitus sine with shimmer carrier + 3 LFOs

Carrier at 4533 Hz modulated by three sine LFOs (0.75 Hz, 1.85 Hz,
0.28 Hz) producing a shimmering frequency sweep across ~4448-4618 Hz.
Matches frequency profile of analyzed commercial tinnitus relief audio."
```
