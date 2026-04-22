import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        background: path.resolve(__dirname, 'src/background/index.ts'),
        content: path.resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
  plugins: [
    tailwindcss(),
    {
      name: 'copy-assets',
      closeBundle: async () => {
        // Copy manifest.json to dist
        fs.copyFileSync(path.resolve(__dirname, 'public/manifest.json'), path.resolve(__dirname, 'dist/manifest.json'));
        
        // Copy icons to dist
        const iconsDir = path.resolve(__dirname, 'public/icons');
        const distIconsDir = path.resolve(__dirname, 'dist/icons');
        if (!fs.existsSync(distIconsDir)) {
          fs.mkdirSync(distIconsDir, { recursive: true });
        }
        fs.readdirSync(iconsDir).forEach(file => {
          fs.copyFileSync(path.join(iconsDir, file), path.join(distIconsDir, file));
        });

        // Copy popup.html to dist and fix bundle reference
        let popupHtml = fs.readFileSync(path.resolve(__dirname, 'public/popup.html'), 'utf8');
        const bundleName = fs.readdirSync(path.resolve(__dirname, 'dist/assets')).find(file => file.startsWith('index-') && file.endsWith('.js'));
        if (bundleName) {
          popupHtml = popupHtml.replace('/src/main.tsx', `./assets/${bundleName}`);
        }
        fs.writeFileSync(path.resolve(__dirname, 'dist/popup.html'), popupHtml);
      }
    }
  ],
});