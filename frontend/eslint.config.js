import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'src/components/presentation/**',
    'src/components/presentation2/**',
    'src/components/presentation3/**',
    'src/components/presentationstudio/**',
    'src/components/projectpage/**',
    'src/pages/**',
    'src/utils/pagination/testRunner.js',
    'src/components/athena-editor/components/editor/EditorToolbar.jsx',
    'src/components/athena-editor/components/editor/MenuBar.jsx',
  ]),
  {
    files: [
      'src/components/athena-editor/**/*.{js,jsx}',
      'src/utils/**/*.{js,jsx}',
      'vite.config.js',
    ],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      'react-refresh/only-export-components': 'off',
      'no-empty': 'off',
    },
  },
])
