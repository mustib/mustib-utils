
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import { getDirname } from './src/node/getDirname'
import path from 'node:path'

const __dirName = getDirname(import.meta.url)

const alias = [
  {
    find: new RegExp('@common'), replacement: path.resolve(__dirName, 'src', 'common'),
  },
  {
    find: new RegExp('@browser'), replacement: path.resolve(__dirName, 'src', 'browser'),
  },
  {
    find: new RegExp('@node'), replacement: path.resolve(__dirName, 'src', 'node'),
  },
  {
    find: new RegExp('@constants'), replacement: path.resolve(__dirName, 'src', 'constants'),
  }
]

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          alias,
          include: [
            './src/common/**/*.test.ts',
          ],
          name: 'common',
          environment: 'node',
        },
      },
      {
        test: {
          alias,
          include: [
            './src/node/**/*.test.ts',
          ],
          name: 'node',
          environment: 'node',
        },
      },
      {

        test: {
          alias,
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