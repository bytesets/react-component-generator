/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Node 22+의 내장 localStorage 전역이 jsdom의 localStorage를 가려 undefined가 되므로 끈다.
    // 이 플래그를 모르는 Node 20 이하에서는 워커가 죽으므로 버전을 확인해 넘긴다.
    execArgv: Number(process.versions.node.split('.')[0]) >= 22 ? ['--no-experimental-webstorage'] : [],
    include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'],
  },
})
