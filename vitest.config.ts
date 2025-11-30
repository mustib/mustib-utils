import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import { getDirname } from './src/node/getDirname'
import path from 'node:path'

const __dirName = getDirname(import.meta.url)

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          include: [
            './src/common/**/*.test.ts',
          ],
          name: 'common',
          environment: 'node',
        },
      },
      {
        test: {
          include: [
            './src/node/**/*.test.ts',
          ],
          name: 'node',
          environment: 'node',
        },
      },
      {

        test: {
          alias: [
            {
              find: new RegExp('@common'), replacement: path.resolve(__dirname, 'src', 'common'),
            },
            {
              find: new RegExp('@browser'), replacement: path.resolve(__dirname, 'src', 'browser'),
            }
          ],
          include: [
            './src/browser/**/*.test.ts',
          ],
          name: 'browser',
          browser: {
            provider: playwright(),
            enabled: true,
            headless: true,
            // at least one instance is required
            instances: [
              { browser: 'chromium' },
            ],
          }
        }
      }]
  }
})