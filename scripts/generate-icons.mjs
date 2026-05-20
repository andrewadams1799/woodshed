import sharp from 'sharp'

// Simple quarter note on dark rounded background
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#111111"/>
  <!-- Notehead -->
  <ellipse cx="192" cy="348" rx="82" ry="60" fill="white" transform="rotate(-12 192 348)"/>
  <!-- Stem -->
  <rect x="264" y="108" width="20" height="252" rx="10" fill="white"/>
  <!-- Flag -->
  <path d="M284 108 Q390 160 380 240 Q370 290 284 300" fill="none" stroke="white" stroke-width="22" stroke-linecap="round"/>
</svg>`

for (const size of [180, 192, 512]) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(`public/icon-${size}.png`)
  console.log(`✓ public/icon-${size}.png`)
}
