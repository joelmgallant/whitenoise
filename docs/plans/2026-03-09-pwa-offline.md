# PWA Offline Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the white noise app installable to home screen with offline support via service worker.

**Architecture:** Web app manifest for install prompt + service worker with install-time precaching and cache-first fetch strategy. Icons generated via Node canvas script.

**Tech Stack:** Web App Manifest, Service Worker API, Node.js canvas (for icon generation)

---

### Task 1: Generate App Icons

**Files:**
- Create: `generate-icons.js` (temporary script, delete after use)
- Create: `icons/icon-192.png`
- Create: `icons/icon-512.png`

**Step 1: Write icon generation script**

```javascript
// generate-icons.js
// Generates PWA icons — dark background with a simple waveform/static pattern
// Uses node-canvas. Run: node generate-icons.js

const { createCanvas } = require('canvas');
const fs = require('fs');

function generateIcon(size, outPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Dark background matching app (#111)
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, size, size);

  // Draw stylized static/noise dots
  const dotCount = Math.floor(size * size * 0.08);
  for (let i = 0; i < dotCount; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const brightness = 80 + Math.random() * 175;
    const alpha = 0.15 + Math.random() * 0.4;
    ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, ${alpha})`;
    ctx.fillRect(x, y, size * 0.015, size * 0.015);
  }

  // Draw a centered sine wave to suggest "audio"
  ctx.strokeStyle = 'rgba(224, 224, 224, 0.7)';
  ctx.lineWidth = size * 0.025;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const waveY = size / 2;
  const amplitude = size * 0.18;
  const waveStart = size * 0.2;
  const waveEnd = size * 0.8;
  for (let x = waveStart; x <= waveEnd; x += 1) {
    const t = (x - waveStart) / (waveEnd - waveStart);
    const y = waveY + Math.sin(t * Math.PI * 4) * amplitude * Math.sin(t * Math.PI);
    if (x === waveStart) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(outPath, buf);
  console.log(`Created ${outPath} (${size}x${size})`);
}

fs.mkdirSync('icons', { recursive: true });
generateIcon(192, 'icons/icon-192.png');
generateIcon(512, 'icons/icon-512.png');
```

**Step 2: Run the script**

```bash
npm install canvas  # temporary dep, not committed
node generate-icons.js
```

Expected: `icons/icon-192.png` and `icons/icon-512.png` created.

**Step 3: Clean up**

```bash
rm generate-icons.js
rm -rf node_modules package.json package-lock.json
```

**Step 4: Commit**

```bash
git add icons/
git commit -m "feat: add PWA app icons (192 + 512)"
```

---

### Task 2: Create Web App Manifest

**Files:**
- Create: `manifest.json`

**Step 1: Create manifest.json**

```json
{
  "name": "White Noise Generator",
  "short_name": "White Noise",
  "description": "Ambient noise generator with visual effects",
  "start_url": "/whitenoise/",
  "scope": "/whitenoise/",
  "display": "standalone",
  "background_color": "#111111",
  "theme_color": "#111111",
  "icons": [
    {
      "src": "icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

Note: `start_url` and `scope` use `/whitenoise/` to match the GitHub Pages repo path. Adjust if deployed elsewhere.

**Step 2: Commit**

```bash
git add manifest.json
git commit -m "feat: add web app manifest for PWA install"
```

---

### Task 3: Create Service Worker

**Files:**
- Create: `sw.js`

**Step 1: Create sw.js**

```javascript
const CACHE_NAME = 'whitenoise-v1';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install: precache all app assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches from previous versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: cache-first, fall back to network (and update cache on network success)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Return cached version immediately
      if (cached) {
        // Update cache in background (stale-while-revalidate)
        event.waitUntil(
          fetch(event.request)
            .then((response) => {
              if (response.ok) {
                return caches.open(CACHE_NAME)
                  .then((cache) => cache.put(event.request, response));
              }
            })
            .catch(() => {}) // offline, no update — that's fine
        );
        return cached;
      }
      // Not cached — try network
      return fetch(event.request);
    })
  );
});
```

**Step 2: Commit**

```bash
git add sw.js
git commit -m "feat: add service worker with cache-first offline strategy"
```

---

### Task 4: Wire Up PWA in index.html

**Files:**
- Modify: `index.html:3-6` (add meta tags after viewport meta)
- Modify: `index.html:891-892` (add SW registration before closing script tag)

**Step 1: Add PWA meta tags to `<head>`**

After the existing `<meta name="viewport" ...>` line (line 5), add:

```html
<meta name="theme-color" content="#111111">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="icons/icon-192.png">
```

**Step 2: Add service worker registration**

Before the closing `</script>` tag (line 893), add:

```javascript
// ════════════════════════════════════════════════════════
//  SERVICE WORKER REGISTRATION (offline PWA support)
// ════════════════════════════════════════════════════════
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
```

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: wire up PWA manifest, meta tags, and SW registration"
```

---

### Task 5: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add PWA section to project docs**

Add after the "Keyboard Shortcuts" section:

```markdown
## PWA / Offline

- `manifest.json` — web app manifest (name, icons, theme, display mode)
- `sw.js` — service worker with stale-while-revalidate caching
- `icons/` — 192px and 512px PNG app icons
- App is installable to home screen on iOS and Android
- Bump `CACHE_NAME` version in `sw.js` when deploying changes
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add PWA section to CLAUDE.md"
```

---

### Task 6: Verify

**Step 1: Local test**

```bash
npx serve .
```

Open in browser, check:
- No console errors
- Manifest loads (DevTools → Application → Manifest)
- Service worker registers (DevTools → Application → Service Workers)
- "Install" prompt appears in Chrome address bar

**Step 2: Push**

```bash
git push
```
