import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {createError,getCookie,setCookie,deleteCookie,setHeader,type H3Event} from 'h3';
import {useRuntimeConfig} from '#imports';
import {buscarSesion,guardarSesion,revocarSesion} from '../Repositorios/sesiones';
import {buscarPorId} from '../Repositorios/usuarios';
import type {Rol,UsuarioConClave,UsuarioPublico} from '../Dominio/usuarios';
const cookie='siae_sesion';
const resumir=(secreto:string)=>createHash('sha256').update(secreto+':'+String(useRuntimeConfig().tokenPepper||'')).digest('hex');
export function datosPublicos(usuario:UsuarioConClave):UsuarioPublico {
 const {id,nombre,apellidos,rol,club_asignado}=usuario;
 return {id,usuario:usuario.usuario,nombre,apellidos,rol,club_asignado};
}
export async function abrirSesion(event:H3Event,id:number){
 const selector=randomBytes(16).toString('hex'),secreto=randomBytes(32).toString('base64url');
 await guardarSesion(id,selector,resumir(secreto));
 // JavaScript no puede leer esta cookie. La base guarda solo el hash del secreto.
 setCookie(event,cookie,selector+'.'+secreto,{httpOnly:true,sameSite:'lax',secure:Boolean(useRuntimeConfig().sessionSecure),path:'/',maxAge:7200});
 setHeader(event,'Cache-Control','no-store');
}
export async function exigirUsuario(event:H3Event,roles?:Rol[]){
 setHeader(event,'Cache-Control','no-store');
 const valor=getCookie(event,cookie)||'';
 if(!/^[a-f0-9]{32}\.[A-Za-z0-9_-]{43}$/.test(valor)) throw createError({statusCode:401,message:'Inicia sesión para continuar.'});
 const [selector,secreto]=valor.split('.') as [string,string];
 const sesion=await buscarSesion(selector);
 const hash=Buffer.from(resumir(secreto),'hex');
 const esperado=Buffer.from(sesion?.token||'','hex');
 if(!sesion || esperado.length!==hash.length || !timingSafeEqual(esperado,hash)) throw createError({statusCode:401,message:'Tu sesión terminó. Ingresa nuevamente.'});
 const usuario=await buscarPorId(sesion.user_id);
 if(!usuario) throw createError({statusCode:401,message:'La cuenta no está disponible.'});
 if(roles && !roles.includes(usuario.rol)) throw createError({statusCode:403,message:'No tienes permiso para acceder a esta sección.'});
 return datosPublicos(usuario);
}
export async function cerrarSesion(event:H3Event){
 const selector=(getCookie(event,cookie)||'').split('.')[0];
 if(selector && /^[a-f0-9]{32}$/.test(selector)) await revocarSesion(selector);
 deleteCookie(event,cookie,{path:'/'});
 setHeader(event,'Cache-Control','no-store');
}
