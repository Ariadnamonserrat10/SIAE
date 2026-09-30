import { defineNuxtConfig } from 'nuxt/config'
export default defineNuxtConfig({
    compatibilityDate: '2026-09-30',
  // Carpeta que contiene las pantallas.
  srcDir: 'Interfaz/',

  // Carpeta que contiene el código del servidor.
  serverDir: 'Servidor/',

  dir: {
    pages: 'Paginas',
    assets: 'Estilos',
  },

  components: [
    {
      path: '~/Componentes',
    },
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