import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  // Vite không tự đổ .env vào process.env trong file config -> phải loadEnv
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // [readme §2.6] BẮT BUỘC đường dẫn tương đối: app chạy từ gói cục bộ
    // (.vma trên SmartScreen, hoặc assets trong APK), không phải từ domain gốc.
    // Để mặc định '/' thì mọi file js/css sẽ 404 khi đóng gói.
    base: './',

    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    build: {
      // [readme §2.6] Tách vendor để chunk chính nhỏ, tận dụng cache tốt hơn
      rollupOptions: {
        output: { manualChunks: { vendor: ['react', 'react-dom'] } },
      },
      // [readme §3.1] esbuild (mặc định) không sinh eval() — hợp CSP script-src 'self'
      minify: 'esbuild',
      // [readme §2.1] cảnh báo sớm nếu chunk phình quá ngưỡng kiểm duyệt
      chunkSizeWarningLimit: 500,
    },

    server: {
      // FE gọi /api/v1/... cùng origin, Vite chuyển tiếp sang backend ở ../vnpt-api.
      // Trên SmartScreen thật, domain API phải được khai báo whitelist CSP (README §3.2).
      proxy: {
        '/api': {
          target: env.API_URL || 'http://localhost:4000',
          changeOrigin: true,
        },
        // Ảnh WebP/AVIF do backend phục vụ (/media/images/*). Giữ cùng origin
        // để không phải khai báo thêm domain vào whitelist CSP (README §3.2).
        '/media': {
          target: env.API_URL || 'http://localhost:4000',
          changeOrigin: true,
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
