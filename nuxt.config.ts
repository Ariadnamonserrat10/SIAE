import { fileURLToPath } from 'node:url'
import { lstat, readlink } from 'node:fs/promises'
import { rutasServidor } from './Configuracion/rutas-servidor'
import { defineNuxtConfig } from 'nuxt/config'
export default defineNuxtConfig({
    compatibilityDate: '2026-09-30',
  // Carpeta que contiene las pantallas.
  srcDir: 'FrontEnd/',

  // Carpeta que contiene el código del servidor.
  serverDir: 'Servidor/',

  dir: {
    pages: 'Pages',
    middleware: 'Intermediarios',
    assets: 'Estilos',
  },

  components: [
    {
      path: '~/Componentes',
    },
  ],

  css: [
    'bootstrap/dist/css/bootstrap.min.css',
    'bootstrap-icons/font/bootstrap-icons.css',
    '~/Estilos/principal.css',
  ],

  runtimeConfig: {
    databaseHost: process.env.PG_HOST || '127.0.0.1',
    databasePort: Number(process.env.PG_PORT || 5432),
    databaseUser: process.env.PG_USER || 'postgres',
    databasePassword: process.env.PG_PASSWORD || '',
    databaseName: process.env.PG_DATABASE || 'club_systems',
    tokenPepper: process.env.TOKEN_PEPPER || '',
    sessionSecure: process.env.SESSION_SECURE === 'true',
  },
  nitro: {
    handlers: rutasServidor,
    externals: {
      inline: ['bcryptjs', 'zod'],
      external: ['pg'],
      traceInclude: [fileURLToPath(new URL('./node_modules/vue/index.mjs', import.meta.url))],
      traceOptions: {
        // Windows requiere comprobar si la ruta es un enlace antes de leerlo.
        async readlink(path: string) {
          try { return (await lstat(path)).isSymbolicLink() ? await readlink(path) : null; }
          catch (error: any) { if (error.code === 'ENOENT') return null; throw error; }
        },
      },
    },
  },
  app: {
    head: {
      title: 'SIAE',
      htmlAttrs: {
        lang: 'es',
      },
    },
  },
})