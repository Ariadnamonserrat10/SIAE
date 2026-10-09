import {createError,getHeader,getRequestURL,type H3Event} from 'h3';
// Las operaciones de sesión solo se aceptan desde la misma aplicación.
export function comprobarOrigen(event:H3Event){
 const origen=getHeader(event,'origin');
 if(!origen || origen!==getRequestURL(event).origin) throw createError({statusCode:403,message:'Origen de solicitud no permitido.'});
}
