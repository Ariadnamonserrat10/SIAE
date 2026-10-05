import { defineNuxtConfig } from 'nuxt/config'
export default defineNuxtConfig({
    compatibilityDate: '2026-09-30',
  // Carpeta que contiene las pantallas.
  srcDir: 'FrontEnd/',

  // Carpeta que contiene el código del servidor.
  serverDir: 'Servidor/',

  dir: {
    pages: 'Pages',
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

  app: {
    head: {
      title: 'SIAE',
      htmlAttrs: {
        lang: 'es',
      },
    },
  },
})