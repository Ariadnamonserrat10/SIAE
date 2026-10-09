import { getCookie, getMethod, type H3Event } from 'h3';
import { exigirUsuario } from './sesion';
import { comprobarOrigen } from './origen';
import { db } from '../Infraestructura/Modulos/conexion';
import type {AuthUser,UserRole} from '../Dominio/Modulos/autenticacion';
export const bearerToken=(event:H3Event)=>getCookie(event,'siae_sesion')||null;
export async function requireUser(event:H3Event,roles?:UserRole[]):Promise<AuthUser>{
 const usuario=await exigirUsuario(event,roles?.map(r=>r==='OFICINA'?'ADMIN':r));
 if(!['GET','HEAD','OPTIONS'].includes(getMethod(event))) comprobarOrigen(event);
 const [rows]=await db().execute<any[]>('SELECT apellidoP, apellidoM, foto FROM usuarios WHERE id=?',[usuario.id]);
 const user={...usuario,...rows[0],tipo:usuario.rol} as AuthUser;
 event.context.user=user;return user;
}
declare module 'h3' {interface H3EventContext {user?:AuthUser}}
