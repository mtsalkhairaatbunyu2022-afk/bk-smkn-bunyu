import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function buildAllIcons() {
  const publicDir = path.resolve('public');
  const svgPath = path.join(publicDir, 'logo-konselor.svg');
  if (!fs.existsSync(svgPath)) {
    console.error('logo-konselor.svg not found!');
    return;
  }

  const svg = fs.readFileSync(svgPath);

  // Root level PNG icons
  await sharp(svg).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192x192.png'));
  await sharp(svg).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512x512.png'));
  await sharp(svg).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  await sharp(svg).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  await sharp(svg).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(svg).resize(32, 32).png().toFile(path.join(publicDir, 'favicon.png'));
  await sharp(svg).resize(32, 32).png().toFile(path.join(publicDir, 'favicon.ico'));

  const iconsDir = path.join(publicDir, 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  for (const size of sizes) {
    await sharp(svg).resize(size, size).png().toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
  }

  // Maskable icon with dark background (#071533)
  await sharp(svg)
    .resize(400, 400)
    .extend({
      top: 56,
      bottom: 56,
      left: 56,
      right: 56,
      background: { r: 7, g: 21, b: 51, alpha: 1 }
    })
    .png()
    .toFile(path.join(iconsDir, 'icon-512x512-maskable.png'));

  console.log('Successfully generated all PWA icons from logo-konselor.svg');
}

buildAllIcons().catch(err => console.error(err));
