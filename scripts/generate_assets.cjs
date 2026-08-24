const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 1. Pristine Academic Crest SVG (1024x1024)
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%">
  <defs>
    <style>
      .bg { fill: #F9F8F6; }
      .shield-bg { fill: #F5F2EB; }
      .navy { fill: #14213D; }
      .gold { fill: #C29B38; }
      .navy-stroke { stroke: #14213D; stroke-linecap: round; stroke-linejoin: round; }
      .gold-stroke { stroke: #C29B38; stroke-linecap: round; stroke-linejoin: round; }
      .gold-fill { fill: #C29B38; }
      .navy-fill { fill: #14213D; }
    </style>
    <filter id="subtle-shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#14213D" flood-opacity="0.09" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" class="bg" rx="96" />

  <!-- Outer Editorial Borders -->
  <rect x="44" y="44" width="936" height="936" rx="64" fill="none" stroke="#14213D" stroke-width="8" />
  <rect x="64" y="64" width="896" height="896" rx="48" fill="none" stroke="#C29B38" stroke-width="4" stroke-dasharray="16 8" />
  <rect x="76" y="76" width="872" height="872" rx="40" fill="none" stroke="#14213D" stroke-width="2" />

  <!-- Corner Heraldic Rosettes -->
  <!-- Top Left -->
  <g transform="translate(100, 100)">
    <circle cx="0" cy="0" r="14" class="gold-fill" />
    <circle cx="0" cy="0" r="7" class="navy-fill" />
    <path d="M-24,0 L24,0 M0,-24 L0,24" stroke="#C29B38" stroke-width="3" />
  </g>
  <!-- Top Right -->
  <g transform="translate(924, 100)">
    <circle cx="0" cy="0" r="14" class="gold-fill" />
    <circle cx="0" cy="0" r="7" class="navy-fill" />
    <path d="M-24,0 L24,0 M0,-24 L0,24" stroke="#C29B38" stroke-width="3" />
  </g>
  <!-- Bottom Left -->
  <g transform="translate(100, 924)">
    <circle cx="0" cy="0" r="14" class="gold-fill" />
    <circle cx="0" cy="0" r="7" class="navy-fill" />
    <path d="M-24,0 L24,0 M0,-24 L0,24" stroke="#C29B38" stroke-width="3" />
  </g>
  <!-- Bottom Right -->
  <g transform="translate(924, 924)">
    <circle cx="0" cy="0" r="14" class="gold-fill" />
    <circle cx="0" cy="0" r="7" class="navy-fill" />
    <path d="M-24,0 L24,0 M0,-24 L0,24" stroke="#C29B38" stroke-width="3" />
  </g>

  <!-- Central Crest Shield with Subtle Shadow -->
  <g filter="url(#subtle-shadow)">
    <!-- Outer Shield Body -->
    <path d="M 230 180 Q 512 140 794 180 C 794 490 740 680 512 840 C 284 680 230 490 230 180 Z" 
          class="shield-bg" stroke="#14213D" stroke-width="12" />
    <!-- Inner Gold Filigree Shield Border -->
    <path d="M 254 204 Q 512 168 770 204 C 770 475 720 656 512 804 C 304 656 254 475 254 204 Z" 
          fill="none" stroke="#C29B38" stroke-width="6" />
    <path d="M 270 220 Q 512 186 754 220 C 754 465 706 640 512 780 C 318 640 270 465 270 220 Z" 
          fill="none" stroke="#14213D" stroke-width="2" />
  </g>

  <!-- Top Heraldic Crown of Mastery -->
  <g transform="translate(512, 175)">
    <!-- Crown Base Band -->
    <path d="M -90 40 L 90 40 L 80 58 L -80 58 Z" class="gold-fill" stroke="#14213D" stroke-width="4" />
    <!-- Crown Spikes with Pearls -->
    <path d="M -90 40 L -105 -5 L -55 20 L 0 -28 L 55 20 L 105 -5 L 90 40 Z" class="gold-fill" stroke="#14213D" stroke-width="6" stroke-linejoin="round" />
    <!-- Crown Facet Lines -->
    <path d="M 0 -28 L 0 40 M -55 20 L -45 40 M 55 20 L 45 40 M -105 -5 L -80 40 M 105 -5 L 80 40" stroke="#14213D" stroke-width="3" />
    <!-- Crown Jewels & Pearls -->
    <circle cx="0" cy="-34" r="10" class="navy-fill" stroke="#C29B38" stroke-width="3" />
    <circle cx="-108" cy="-10" r="8" class="navy-fill" stroke="#C29B38" stroke-width="3" />
    <circle cx="108" cy="-10" r="8" class="navy-fill" stroke="#C29B38" stroke-width="3" />
    <circle cx="-55" cy="14" r="6" class="navy-fill" />
    <circle cx="55" cy="14" r="6" class="navy-fill" />
    <!-- Base Band Jewels -->
    <circle cx="-50" cy="49" r="5" class="navy-fill" />
    <circle cx="0" cy="49" r="5" class="navy-fill" />
    <circle cx="50" cy="49" r="5" class="navy-fill" />
  </g>

  <!-- Staunton Knight - Classical True Horse Head Silhouette & Woodcut Detailing -->
  <g transform="translate(512, 455)">
    <!-- Knight Main Silhouette -->
    <!-- Path begins at top ear, goes down muzzle, under chin, down chest to base, across, up back of arched neck -->
    <path d="M -20 -225 
             L -15 -175 
             C -35 -170 -60 -150 -85 -120 
             L -155 -75 
             C -175 -62 -185 -42 -170 -25 
             C -160 -12 -135 -15 -118 -30 
             C -98 -15 -80 5 -72 32 
             C -85 65 -110 95 -135 125 
             L -145 145 
             L 165 145 
             L 155 125 
             C 145 70 140 10 120 -50 
             C 100 -110 65 -165 5 -198 
             L 5 -220 
             L -20 -225 Z" 
          class="navy-fill" stroke="#14213D" stroke-width="10" stroke-linejoin="round" />

    <!-- Second (Inner) Ear -->
    <path d="M 8 -215 L 22 -170 L -2 -175 Z" class="gold-fill" stroke="#14213D" stroke-width="3" />

    <!-- Front Ear Fill / Inner Fold -->
    <path d="M -18 -215 L -12 -180 L -30 -182 Z" fill="#FAF8F5" stroke="#14213D" stroke-width="2" />

    <!-- Mane Grooves (Chiseled Gold Cuts along Arched Crest) -->
    <!-- Mane Groove 1 (Top Neck Arch) -->
    <path d="M 2 -188 C 35 -165 65 -125 80 -80 L 52 -92 C 42 -125 20 -155 -2 -175 Z" class="gold-fill" />
    <!-- Mane Groove 2 (Mid Neck) -->
    <path d="M 75 -70 C 95 -25 105 20 110 65 L 82 48 C 78 12 70 -25 52 -55 Z" class="gold-fill" />
    <!-- Mane Groove 3 (Lower Neck) -->
    <path d="M 108 75 C 115 95 118 115 120 135 L 96 135 C 94 118 90 100 84 82 Z" class="gold-fill" />

    <!-- Facial Anatomy - Classic Woodcut Lines -->
    <!-- Forehead / Brow Ridge -->
    <path d="M -25 -175 C -45 -160 -65 -140 -82 -115" fill="none" stroke="#C29B38" stroke-width="5" stroke-linecap="round" />
    
    <!-- Expressive Piercing Eye -->
    <g transform="translate(-62, -108)">
      <path d="M -18 0 C -10 -12 10 -12 18 0 C 10 12 -10 12 -18 0 Z" class="gold-fill" />
      <ellipse cx="0" cy="0" rx="7" ry="9" class="navy-fill" transform="rotate(-15)" />
      <circle cx="-2" cy="-3" r="3" fill="#FAF8F5" />
      <path d="M -22 -8 C -10 -20 12 -18 22 -6" fill="none" stroke="#C29B38" stroke-width="4" stroke-linecap="round" />
    </g>

    <!-- Bridge of Nose & Muzzle Contours -->
    <path d="M -85 -110 L -145 -70 C -158 -60 -165 -48 -155 -38 C -148 -32 -135 -35 -122 -44" fill="none" stroke="#C29B38" stroke-width="6" stroke-linecap="round" />
    
    <!-- Nostril Flaring Ring -->
    <ellipse cx="-138" cy="-60" rx="9" ry="5" class="gold-fill" transform="rotate(30 -138 -60)" />
    <circle cx="-138" cy="-60" r="4" class="navy-fill" />

    <!-- Jaw Line / Cheekbone Arch -->
    <path d="M -120 -32 C -100 -18 -80 0 -72 28" fill="none" stroke="#C29B38" stroke-width="6" stroke-linecap="round" />
    <ellipse cx="-48" cy="-32" rx="20" ry="28" fill="none" stroke="#C29B38" stroke-width="4" stroke-dasharray="8 6" transform="rotate(25 -48 -32)" />

    <!-- Powerful Chest Muscle Hatching (Editorial Woodcut Ribs) -->
    <path d="M -72 32 C -88 65 -112 92 -135 118" fill="none" stroke="#C29B38" stroke-width="6" stroke-linecap="round" />
    <path d="M -45 48 C -62 80 -85 105 -105 128" fill="none" stroke="#C29B38" stroke-width="5" stroke-linecap="round" />
    <path d="M -18 62 C -32 90 -52 115 -70 135" fill="none" stroke="#C29B38" stroke-width="4" stroke-linecap="round" />
    <path d="M 12 75 C 0 98 -18 120 -35 138" fill="none" stroke="#C29B38" stroke-width="4" stroke-linecap="round" />
    <path d="M 45 85 C 32 105 18 124 2 140" fill="none" stroke="#C29B38" stroke-width="4" stroke-linecap="round" />

    <!-- Pedestal Base Molding (Collar) -->
    <rect x="-165" y="140" width="330" height="24" rx="6" class="gold-fill" stroke="#14213D" stroke-width="5" />
    <rect x="-145" y="164" width="290" height="18" rx="4" class="navy-fill" stroke="#14213D" stroke-width="4" />
    <!-- Pedestal Hatching Details -->
    <line x1="-120" y1="152" x2="-120" y2="162" stroke="#14213D" stroke-width="3" />
    <line x1="-80" y1="152" x2="-80" y2="162" stroke="#14213D" stroke-width="3" />
    <line x1="-40" y1="152" x2="-40" y2="162" stroke="#14213D" stroke-width="3" />
    <line x1="0" y1="152" x2="0" y2="162" stroke="#14213D" stroke-width="3" />
    <line x1="40" y1="152" x2="40" y2="162" stroke="#14213D" stroke-width="3" />
    <line x1="80" y1="152" x2="80" y2="162" stroke="#14213D" stroke-width="3" />
    <line x1="120" y1="152" x2="120" y2="162" stroke="#14213D" stroke-width="3" />
  </g>

  <!-- Open Academic Folio / Book of Wisdom (Lower Section) -->
  <g transform="translate(512, 675)">
    <!-- Book Depth Base -->
    <path d="M 0 65 Q -140 30 -240 50 L -240 70 Q -140 50 0 85 Q 140 50 240 70 L 240 50 Q 140 30 0 65 Z" 
          class="gold-fill" stroke="#14213D" stroke-width="4" />
    
    <!-- Left Main Open Page -->
    <path d="M 0 50 Q -120 10 -235 25 L -235 -25 Q -120 -40 0 -15 Z" 
          fill="#FAF8F5" stroke="#14213D" stroke-width="6" />
    <!-- Right Main Open Page -->
    <path d="M 0 50 Q 120 10 235 25 L 235 -25 Q 120 -40 0 -15 Z" 
          fill="#FAF8F5" stroke="#14213D" stroke-width="6" />
    
    <!-- Center Book Spine & Golden Ribbon Bookmark -->
    <path d="M 0 -22 L 0 88" stroke="#C29B38" stroke-width="8" stroke-linecap="round" />
    <path d="M 0 88 L -14 118 L 0 108 L 14 118 Z" class="gold-fill" stroke="#14213D" stroke-width="3" />

    <!-- Page Text Lines (Left Page) -->
    <line x1="-205" y1="-8" x2="-35" y2="-1" stroke="#C29B38" stroke-width="3.5" stroke-linecap="round" />
    <line x1="-205" y1="10" x2="-35" y2="17" stroke="#C29B38" stroke-width="3.5" stroke-linecap="round" />
    <line x1="-205" y1="28" x2="-55" y2="35" stroke="#C29B38" stroke-width="3.5" stroke-linecap="round" />

    <!-- Page Text Lines (Right Page) -->
    <line x1="35" y1="-1" x2="205" y2="-8" stroke="#C29B38" stroke-width="3.5" stroke-linecap="round" />
    <line x1="35" y1="17" x2="205" y2="10" stroke="#C29B38" stroke-width="3.5" stroke-linecap="round" />
    <line x1="55" y1="35" x2="205" y2="28" stroke="#C29B38" stroke-width="3.5" stroke-linecap="round" />
  </g>

  <!-- Heraldic Laurel Sprigs (Left & Right Flanks) -->
  <!-- Left Laurel Wreath -->
  <g transform="translate(180, 500)">
    <!-- Stem -->
    <path d="M 30 160 C 0 80 -10 -40 30 -120" fill="none" stroke="#C29B38" stroke-width="4" stroke-linecap="round" />
    <!-- Leaves -->
    <path d="M 28 -110 C 10 -125 5 -145 15 -160 C 28 -145 35 -125 28 -110 Z" class="gold-fill" stroke="#14213D" stroke-width="2" />
    <path d="M 20 -50 C -2 -60 -10 -80 -2 -95 C 12 -85 22 -68 20 -50 Z" class="gold-fill" stroke="#14213D" stroke-width="2" />
    <path d="M 12 10 C -10 0 -20 -20 -12 -35 C 2 -25 14 -8 12 10 Z" class="gold-fill" stroke="#14213D" stroke-width="2" />
    <path d="M 10 70 C -12 60 -22 40 -14 25 C 0 35 12 52 10 70 Z" class="gold-fill" stroke="#14213D" stroke-width="2" />
    <path d="M 18 130 C -2 120 -10 100 -2 85 C 10 95 20 112 18 130 Z" class="gold-fill" stroke="#14213D" stroke-width="2" />
    <!-- Berries -->
    <circle cx="24" cy="-78" r="4" class="navy-fill" />
    <circle cx="16" cy="-18" r="4" class="navy-fill" />
    <circle cx="14" cy="42" r="4" class="navy-fill" />
    <circle cx="22" cy="102" r="4" class="navy-fill" />
  </g>

  <!-- Right Laurel Wreath (Symmetric Mirror) -->
  <g transform="translate(844, 500) scale(-1, 1)">
    <!-- Stem -->
    <path d="M 30 160 C 0 80 -10 -40 30 -120" fill="none" stroke="#C29B38" stroke-width="4" stroke-linecap="round" />
    <!-- Leaves -->
    <path d="M 28 -110 C 10 -125 5 -145 15 -160 C 28 -145 35 -125 28 -110 Z" class="gold-fill" stroke="#14213D" stroke-width="2" />
    <path d="M 20 -50 C -2 -60 -10 -80 -2 -95 C 12 -85 22 -68 20 -50 Z" class="gold-fill" stroke="#14213D" stroke-width="2" />
    <path d="M 12 10 C -10 0 -20 -20 -12 -35 C 2 -25 14 -8 12 10 Z" class="gold-fill" stroke="#14213D" stroke-width="2" />
    <path d="M 10 70 C -12 60 -22 40 -14 25 C 0 35 12 52 10 70 Z" class="gold-fill" stroke="#14213D" stroke-width="2" />
    <path d="M 18 130 C -2 120 -10 100 -2 85 C 10 95 20 112 18 130 Z" class="gold-fill" stroke="#14213D" stroke-width="2" />
    <!-- Berries -->
    <circle cx="24" cy="-78" r="4" class="navy-fill" />
    <circle cx="16" cy="-18" r="4" class="navy-fill" />
    <circle cx="14" cy="42" r="4" class="navy-fill" />
    <circle cx="22" cy="102" r="4" class="navy-fill" />
  </g>

  <!-- Bottom Academic Four-Point Star -->
  <g transform="translate(512, 885)">
    <polygon points="0,-18 5,-5 18,0 5,5 0,18 -5,5 -18,0 -5,-5" class="gold-fill" stroke="#14213D" stroke-width="2" />
    <circle cx="0" cy="0" r="3" class="navy-fill" />
  </g>
</svg>`;

// 2. Favicon SVG - Focused 512x512 with bold clean crest
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <style>
      .bg { fill: #F9F8F6; }
      .shield-bg { fill: #F5F2EB; }
      .navy-fill { fill: #14213D; }
      .gold-fill { fill: #C29B38; }
    </style>
  </defs>
  <rect width="512" height="512" class="bg" rx="96" />
  <!-- Outer Border -->
  <rect x="20" y="20" width="472" height="472" rx="76" fill="none" stroke="#14213D" stroke-width="20" />
  <rect x="36" y="36" width="440" height="440" rx="60" fill="none" stroke="#C29B38" stroke-width="10" />

  <!-- Shield -->
  <path d="M 110 80 Q 256 55 402 80 C 402 245 375 355 256 440 C 137 355 110 245 110 80 Z" 
        class="shield-bg" stroke="#14213D" stroke-width="16" />
  <path d="M 128 98 Q 256 75 384 98 C 384 235 360 335 256 415 C 152 335 128 235 128 98 Z" 
        fill="none" stroke="#C29B38" stroke-width="8" />

  <!-- Crown -->
  <g transform="translate(256, 85)">
    <path d="M -50 20 L 50 20 L 44 32 L -44 32 Z" class="gold-fill" stroke="#14213D" stroke-width="6" />
    <path d="M -50 20 L -60 -10 L -30 6 L 0 -26 L 30 6 L 60 -10 L 50 20 Z" class="gold-fill" stroke="#14213D" stroke-width="8" stroke-linejoin="round" />
    <circle cx="0" cy="-30" r="8" class="navy-fill" stroke="#C29B38" stroke-width="4" />
    <circle cx="-62" cy="-14" r="6" class="navy-fill" stroke="#C29B38" stroke-width="3" />
    <circle cx="62" cy="-14" r="6" class="navy-fill" stroke="#C29B38" stroke-width="3" />
  </g>

  <!-- Staunton Knight Center -->
  <g transform="translate(256, 240)">
    <path d="M -12 -115 
             L -8 -90 
             C -20 -86 -34 -75 -48 -60 
             L -85 -36 
             C -96 -30 -100 -20 -92 -12 
             C -86 -6 -72 -8 -64 -15 
             C -52 -8 -42 2 -38 16 
             C -45 34 -60 50 -72 65 
             L -78 75 
             L 88 75 
             L 82 65 
             C 76 35 74 5 62 -25 
             C 52 -55 35 -84 2 -100 
             L 2 -112 
             L -12 -115 Z" 
          class="navy-fill" stroke="#14213D" stroke-width="12" stroke-linejoin="round" />
    <!-- Knight Gold Accents -->
    <path d="M 0 -95 C 18 -82 34 -62 42 -38 L 28 -44 C 22 -60 10 -76 -2 -86 Z" class="gold-fill" />
    <path d="M 40 -34 C 50 -12 55 10 58 34 L 44 26 C 42 6 36 -12 28 -28 Z" class="gold-fill" />
    <!-- Ear & Eye -->
    <path d="M -12 -112 L -6 -92 L -18 -94 Z" class="gold-fill" />
    <circle cx="-35" cy="-56" r="7" class="gold-fill" />
    <circle cx="-35" cy="-56" r="3" fill="#FAF8F5" />
    <!-- Muzzle / Jaw Line -->
    <path d="M -48 -58 L -80 -36 C -88 -30 -92 -22 -86 -16" fill="none" stroke="#C29B38" stroke-width="5" stroke-linecap="round" />
    <path d="M -64 -15 C -52 -8 -42 2 -38 16" fill="none" stroke="#C29B38" stroke-width="5" stroke-linecap="round" />
    <path d="M -38 16 C -48 34 -62 50 -72 65" fill="none" stroke="#C29B38" stroke-width="5" stroke-linecap="round" />
    <!-- Pedestal Base -->
    <rect x="-90" y="74" width="180" height="16" rx="4" class="gold-fill" stroke="#14213D" stroke-width="5" />
    <rect x="-78" y="88" width="156" height="12" rx="3" class="navy-fill" stroke="#14213D" stroke-width="3" />
  </g>

  <!-- Open Academic Book -->
  <g transform="translate(256, 375)">
    <path d="M 0 35 Q -75 18 -135 28 L -135 42 Q -75 32 0 50 Q 75 32 135 42 L 135 28 Q 75 18 0 35 Z" 
          class="gold-fill" stroke="#14213D" stroke-width="5" />
    <path d="M 0 25 Q -65 2 -130 12 L -130 -18 Q -65 -28 0 -10 Z" 
          fill="#FAF8F5" stroke="#14213D" stroke-width="8" />
    <path d="M 0 25 Q 65 2 130 12 L 130 -18 Q 65 -28 0 -10 Z" 
          fill="#FAF8F5" stroke="#14213D" stroke-width="8" />
    <path d="M 0 -15 L 0 52" stroke="#C29B38" stroke-width="6" stroke-linecap="round" />
    <!-- Bookmark -->
    <path d="M 0 52 L -10 70 L 0 64 L 10 70 Z" class="gold-fill" stroke="#14213D" stroke-width="3" />
  </g>
</svg>`;

async function main() {
  const targetDir = process.argv[2] || '.';
  const publicDir = path.join(targetDir, 'public');
  const logoDir = path.join(publicDir, 'assets', 'logo');

  console.log('Writing SVG files to:', logoDir);
  fs.writeFileSync(path.join(logoDir, 'logo.svg'), logoSvg, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg, 'utf8');

  console.log('Rendering raster PNG assets with sharp...');
  const svgBuffer = Buffer.from(logoSvg);

  // 1. logo.png (1024x1024)
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(logoDir, 'logo.png'));
  console.log('Generated: logo.png (1024x1024)');

  // 2. icon-512.png (512x512)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(logoDir, 'icon-512.png'));
  console.log('Generated: icon-512.png (512x512)');

  // 3. icon-maskable-512.png (512x512 with 10% safe zone padding)
  const innerSize = 410;
  const padding = Math.round((512 - innerSize) / 2);
  const innerBuffer = await sharp(svgBuffer)
    .resize(innerSize, innerSize)
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: '#F9F8F6'
    }
  })
    .composite([{ input: innerBuffer, top: padding, left: padding }])
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(logoDir, 'icon-maskable-512.png'));
  console.log('Generated: icon-maskable-512.png (512x512, 10% safe padding)');

  // 4. icon-192.png (192x192)
  await sharp(svgBuffer)
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(logoDir, 'icon-192.png'));
  console.log('Generated: icon-192.png (192x192)');

  // 5. icon-180.png (180x180 - Apple touch icon)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(logoDir, 'icon-180.png'));
  console.log('Generated: icon-180.png (180x180)');

  // 6. favicon.png (64x64/32x32 crisp favicon PNG)
  const favBuffer = Buffer.from(faviconSvg);
  await sharp(favBuffer)
    .resize(64, 64)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(logoDir, 'favicon.png'));
  console.log('Generated: favicon.png (64x64)');

  console.log('All logo assets generated successfully!');
}

main().catch(err => {
  console.error('Error generating logo assets:', err);
  process.exit(1);
});
