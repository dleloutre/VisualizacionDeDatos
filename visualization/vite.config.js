import { defineConfig } from 'vite';
import { resolve } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const animationName = process.env.ANIMATION || 'single';
const animationPath = resolve(__dirname, `${animationName}Visualization.js`);

if (!existsSync(animationPath)) {
  throw new Error(`Animation file does not exist: ${animationPath}`);
}

const templateHtml = readFileSync(resolve(__dirname, 'visualization.html'), 'utf-8');
const htmlContent = templateHtml.replace('%SCRIPT_SRC%', `./${animationName}Visualization.js`);
writeFileSync(resolve(__dirname, 'index.html'), htmlContent);

export default defineConfig({
  resolve: {
    alias: {
      '@animation': animationPath,
    },
  },
  server: {
    fs: {
      strict: false,
    },
  },
  build: {
    sourcemap: true,
  },
});