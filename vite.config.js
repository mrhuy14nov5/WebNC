const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('node:path');

module.exports = defineConfig({
  root: 'react-node-app',
  cacheDir: path.resolve(__dirname, 'react-node-app/.vite'),
  plugins: [react()],
  build: { outDir: 'dist', emptyOutDir: true },
  server: { port: 5173, proxy: { '/api': 'http://localhost:3000' } }
});