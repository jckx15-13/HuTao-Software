import fs from 'fs';
import path from 'path';

/**
 * Build management script to copy Cesium static assets, workers, and widgets
 * into the public output directory for local offline WebGL rendering.
 */
const CESIUM_SOURCE = path.resolve(process.cwd(), 'node_modules/cesium/Build/Cesium');
const CESIUM_DEST = path.resolve(process.cwd(), 'public/cesium');

function copyFolderRecursiveSync(source: string, target: string) {
  if (!fs.existsSync(source)) {
    console.warn(`[copy-cesium] Source path ${source} does not exist. Skipping.`);
    return;
  }
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);
  for (const file of files) {
    const curSource = path.join(source, file);
    const curTarget = path.join(target, file);
    if (fs.lstatSync(curSource).isDirectory()) {
      copyFolderRecursiveSync(curSource, curTarget);
    } else {
      fs.copyFileSync(curSource, curTarget);
    }
  }
}

console.log('[copy-cesium] Copying Cesium static assets and Workers to public/cesium...');
try {
  copyFolderRecursiveSync(CESIUM_SOURCE, CESIUM_DEST);
  console.log('[copy-cesium] Successfully copied Cesium assets to public/cesium.');
} catch (err) {
  console.error('[copy-cesium] Error copying Cesium assets:', err);
}
