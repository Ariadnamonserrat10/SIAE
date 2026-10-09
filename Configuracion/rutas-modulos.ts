import { fileURLToPath } from 'node:url';

// Nitro necesita barras normales también en Windows.
const archivo = (ruta: string) => fileURLToPath(new URL(ruta, import.meta.url)).replaceAll('\\', '/');

// Las direcciones públicas se conservan aunque los archivos estén nombrados en español.
// Para añadir una operación, indica su dirección, método HTTP y archivo responsable.
export const rutasModulos = [
  {route:'/api/resumen',method:'get' as const,handler:archivo('../Servidor/Controladores/resumen.get.ts')},
  {route:'/api/perfil',method:'get' as const,handler:archivo('../Servidor/Controladores/perfil.get.ts')},
  { route: '/api/carreras', method: 'get' as const, handler: archivo('../Servidor/Controladores/Modulos/carreras.obtener.ts') },
  { route: '/api/monitores', method: 'get' as const, handler: archivo('../Servidor/Controladores/Modulos/monitores.obtener.ts') },
  { route: '/api/archivos', method: 'post' as const, handler: archivo('../Servidor/Controladores/Modulos/archivos/indice.guardar.ts') },
  { route: '/api/archivos/:name', method: 'get' as const, handler: archivo('../Servidor/Controladores/Modulos/archivos/[nombre].obtener.ts') },
  { route: '/api/clubs', method: 'get' as const, handler: archivo('../Servidor/Controladores/Modulos/clubs/indice.obtener.ts') },
  { route: '/api/clubs', method: 'post' as const, handler: archivo('../Servidor/Controladores/Modulos/clubs/indice.guardar.ts') },
  { route: '/api/clubs/:id', method: 'delete' as const, handler: archivo('../Servidor/Controladores/Modulos/clubs/[id].eliminar.ts') },
  { route: '/api/clubs/:id', method: 'put' as const, handler: archivo('../Servidor/Controladores/Modulos/clubs/[id].actualizar.ts') },
  { route: '/api/monitores/asignar', method: 'post' as const, handler: archivo('../Servidor/Controladores/Modulos/monitores/asignar.guardar.ts') },
  { route: '/api/usuarios', method: 'get' as const, handler: archivo('../Servidor/Controladores/Modulos/usuarios/indice.obtener.ts') },
  { route: '/api/usuarios', method: 'post' as const, handler: archivo('../Servidor/Controladores/Modulos/usuarios/indice.guardar.ts') },
  { route: '/api/usuarios/:id', method: 'delete' as const, handler: archivo('../Servidor/Controladores/Modulos/usuarios/[id].eliminar.ts') },
  { route: '/api/usuarios/:id', method: 'get' as const, handler: archivo('../Servidor/Controladores/Modulos/usuarios/[id].obtener.ts') },
  { route: '/api/usuarios/:id', method: 'put' as const, handler: archivo('../Servidor/Controladores/Modulos/usuarios/[id].actualizar.ts') },
];
