// generate-icons.mjs
// Run: node generate-icons.mjs
// Requires: npm install canvas (or use the browser-based approach below)
// If you don't want to run this, use any 192x192 and 512x512 PNG as icons.

// ── Simple SVG icon (paste this into a file called icon.svg in public/icons/) ──
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#050510"/>
  <circle cx="256" cy="256" r="220" fill="none" stroke="#3B82F6" stroke-width="24"/>
  <text x="256" y="320" text-anchor="middle" font-size="220" font-family="serif">💪</text>
</svg>`

import { writeFileSync, mkdirSync } from 'fs'
mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/icon.svg', svg)
console.log('✅ SVG icon written to public/icons/icon.svg')
console.log('→ Convert to PNG at https://svgtopng.com/ (192x192 and 512x512)')
console.log('→ Save as public/icons/icon-192.png and public/icons/icon-512.png')
