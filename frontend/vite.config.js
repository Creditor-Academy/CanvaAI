import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://designova-ai.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Force all React-related code into a single chunk
          'react-vendor': ['react', 'react-dom'],
          // Force all editor-related code into separate chunk
          'editor-components': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-link',
            '@tiptap/extension-underline',
            '@tiptap/extension-placeholder',
            '@tiptap/extension-text-align',
            '@tiptap/extension-highlight',
            '@tiptap/extension-image',
            '@tiptap/extension-table',
            '@tiptap/extension-table-row',
            '@tiptap/extension-table-cell',
            '@tiptap/extension-table-header',
            '@tiptap/extension-text-style',
            '@tiptap/extension-color',
            '@tiptap/extension-font-family',
            '@tiptap/extension-subscript',
            '@tiptap/extension-superscript',
            '@tiptap/extension-code-block-lowlight',
            '@tiptap/core',
            'lowlight'
          ],
          // Force all UI components into separate chunk
          'ui-components': [
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            'framer-motion',
            'sonner'
          ]
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tiptap/react',
      '@tiptap/starter-kit'
    ],
    exclude: [
      // Exclude problematic packages from pre-bundling
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-tooltip'
    ]
  },
  resolve: {
    alias: {
      // Force single React instance
      'react': 'react',
      'react-dom': 'react-dom',
      // Alias editor components to ensure consistent resolution
      '@editor-components': path.resolve(__dirname, 'src/components/athena-editor/components'),
      // Shadcn/ui alias
      '@': path.resolve(__dirname, './src')
    }
  }
});
