import {defineNuxtRouteMiddleware,navigateTo,useRequestFetch,createError} from '#imports';
import type {UsuarioSesion} from '../Servicios/autenticacion';
export default defineNuxtRouteMiddleware(async to=>{
 try{
  // En SSR se reenvía la cookie al servidor; nunca se expone el secreto a JavaScript.
  const {usuario}=await useRequestFetch()<{usuario:UsuarioSesion}>('/api/autenticacion/sesion');
  const destino=usuario.rol==='MONITOR'?'/monitor':'/oficina';
  if(to.path!==destino) return navigateTo(destino);
 }catch(error:any){
  if(error?.statusCode===401 || error?.response?.status===401) return navigateTo('/');
  throw createError({statusCode:503,statusMessage:'No se pudo verificar la sesión. Comprueba PostgreSQL.'});
 }
});
