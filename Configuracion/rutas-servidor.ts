import {fileURLToPath} from 'node:url';
const archivo=(nombre:string)=>fileURLToPath(new URL('../Servidor/Controladores/'+nombre,import.meta.url)).replaceAll('\\','/');
export const rutasServidor=[
 {route:'/api/autenticacion/iniciar-sesion',method:'post' as const,handler:archivo('iniciar-sesion.post.ts')},
 {route:'/api/autenticacion/sesion',method:'get' as const,handler:archivo('sesion.get.ts')},
 {route:'/api/autenticacion/cerrar-sesion',method:'post' as const,handler:archivo('cerrar-sesion.post.ts')},
 {route:'/api/oficina',method:'get' as const,handler:archivo('oficina.get.ts')},
 {route:'/api/monitor',method:'get' as const,handler:archivo('monitor.get.ts')},
];
