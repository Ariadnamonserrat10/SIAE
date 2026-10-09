import bcrypt from 'bcryptjs';
import {createError,getRequestIP,type H3Event} from 'h3';
import {buscarPorNombre,intentosRecientes,registrarIntento} from '../Repositorios/usuarios';
import {abrirSesion,datosPublicos} from '../Seguridad/sesion';
export async function iniciarSesion(event:H3Event,datos:{usuario:string;password:string;userType:'oficina'|'monitor'}){
 const ip=getRequestIP(event)||'local';
 if(await intentosRecientes(ip,datos.usuario)>=10) throw createError({statusCode:429,message:'Demasiados intentos. Intenta nuevamente en 15 minutos.'});
 const usuario=await buscarPorNombre(datos.usuario);
 const hash=usuario?.password?.replace(/^\$2y\$/,'$2b$');
 // Comparación de coste similar incluso cuando el usuario no existe.
 const valido=await bcrypt.compare(datos.password,hash||'$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.');
 if(!usuario || !hash || !valido){
   await registrarIntento(ip,datos.usuario,false);
   throw createError({statusCode:401,message:'Usuario o contraseña incorrectos.'});
 }
 const perfil=usuario.rol==='MONITOR'?'monitor':'oficina';
 if(datos.userType!==perfil) throw createError({statusCode:403,message:perfil==='monitor'?'Selecciona Monitor para ingresar con esta cuenta.':'Selecciona Oficina para ingresar con esta cuenta.'});
 await registrarIntento(ip,datos.usuario,true);
 await abrirSesion(event,usuario.id);
 return datosPublicos(usuario);
}
