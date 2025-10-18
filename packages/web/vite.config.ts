import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';

const config = defineConfig({
  plugins: [
    viteTsConfigPaths({ projects: ['./tsconfig.json'] }),
    nitro({
      config: {
        preset: 'aws-lambda',
        compatibilityDate: '2025-10-18',
      },
    }),
    tanstackStart(),
    viteReact(),
  ],
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
});

export default config;
