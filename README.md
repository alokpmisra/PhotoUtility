# Passport & ID Photo Converter

A installable Progressive Web App (PWA) that lets you take a photo with your
phone's camera and convert it into passport, visa, and print photo sizes —
entirely on-device, with no uploads.

## Features

- **Capture or upload** — use the live camera (front/back) or pick an
  existing photo from your device.
- **Crop & zoom** — drag to pan and pinch (or use the zoom slider) to frame
  the shot, with a head-position guide for passport-style specs.
- **Size presets** — USA, India, UK, EU/Schengen, Canada, Australia, and
  China passport/visa specs, plus wallet, 4x6, 5x7 print sizes, and a fully
  custom size (mm, inches, or pixels at any DPI).
- **Export formats** — JPEG, PNG, or WebP with adjustable quality.
- **Print sheets** — tile multiple copies of the final photo onto a 4x6, 5x7,
  or A4 sheet with cut guides, ready for a photo printer.
- **Works offline** — installable as a home-screen app; the app shell is
  cached by a service worker.

## Running locally

Camera access and service workers both require a secure context (HTTPS or
`localhost`). Serve the folder with any static file server, e.g.:

```sh
npx serve .
# or
python3 -m http.server 8000
```

Then open the printed URL on your phone (or `http://localhost:<port>` in a
desktop browser) and, on mobile, use "Add to Home Screen" to install it.

## Deploying

The app is fully static (no build step, no backend) — deploy the repository
root as-is to GitHub Pages, Netlify, Vercel, or any static host over HTTPS.

## Project structure

```
index.html            App shell / screens (start, camera, crop, export)
css/styles.css         Styles
js/specs.js            Passport/visa/print size definitions
js/app.js               Camera, cropper, and export logic
manifest.webmanifest    PWA manifest
service-worker.js       Offline app-shell caching
icons/                  App icons
```
