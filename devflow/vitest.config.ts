import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig(async () => {
  const tsconfigPaths = await import('vite-tsconfig-paths')

  return {
    plugins: [tsconfigPaths.default()],
    test: {
      // Test environment
      environment: 'node',

      // Test file patterns
      include: ['tests/**/*.test.ts'],
      exclude: ['node_modules', '.next', 'dist'],

      // Global setup
      setupFiles: ['./tests/setup/vitest.setup.ts'],

      // Timeouts (GitHub API can be slow)
      testTimeout: 30000,  // 30 seconds per test
      hookTimeout: 10000,  // 10 seconds for hooks

      // Coverage (optional)
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'json'],
        include: ['src/lib/github*.ts'],
        exclude: ['tests/**', 'node_modules/**']
      },

      // Sequential execution (avoid rate limits)
      threads: false,
      fileParallelism: false,

      // Reporter
      reporter: ['verbose'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    }
  }
})
