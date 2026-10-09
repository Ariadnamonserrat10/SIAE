import {defineEventHandler,readBody,createError} from 'h3';
import {z} from 'zod';
import {comprobarOrigen} from '../Seguridad/origen';
import {iniciarSesion} from '../Servicios/autenticacion';
const entrada=z.object({usuario:z.string().trim().regex(/^[A-Za-z0-9]{8}$/),password:z.string().min(8).max(200),userType:z.enum(['oficina','monitor'])});
export default defineEventHandler(async event=>{
 comprobarOrigen(event);
 const datos=entrada.safeParse(await readBody(event));
 if(!datos.success) throw createError({statusCode:422,message:'Revisa el usuario de 8 caracteres y la contraseña de al menos 8 caracteres.'});
 try {return {usuario:await iniciarSesion(event,datos.data)};}
 catch(error){
  if(error && typeof error==='object' && 'statusCode' in error) throw error;
  console.error('No se pudo completar el inicio de sesión:',error instanceof Error?error.name:'Error');
  throw createError({statusCode:503,message:'No fue posible conectar con la base de datos. Verifica que PostgreSQL esté iniciado.'});
 }
});
