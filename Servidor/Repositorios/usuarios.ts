import { baseDeDatos } from '../Infraestructura/conexion';
import { normalizarRol, type UsuarioConClave } from '../Dominio/usuarios';
const campos = `SELECT u.id,u.usuario,u.nombre,concat_ws(' ',u.apellidop,u.apellidom) AS apellidos,u.password,u.club_asignado,COALESCE(r.nombre,u.tipo) AS rol
FROM usuarios u LEFT JOIN roles r ON r.id=u.rol_id
WHERE COALESCE(u.activo,1)=1 AND (r.id IS NULL OR COALESCE(r.activo,1)=1)`;
async function buscar(condicion:string,valor:string|number):Promise<UsuarioConClave|null>{
 const {rows}=await baseDeDatos().query(campos+condicion+' LIMIT 1',[valor]);
 const fila=rows[0];
 if(!fila) return null;
 const rol=normalizarRol(fila.rol);
 return rol ? {...fila,rol} : null;
}
export const buscarPorNombre=(nombre:string)=>buscar(' AND u.usuario=$1',nombre);
export const buscarPorId=(id:number)=>buscar(' AND u.id=$1',id);
export async function intentosRecientes(ip:string,usuario:string){
 const {rows}=await baseDeDatos().query(`SELECT count(*)::int AS cantidad FROM login_attempts WHERE success=0 AND attempt_time>NOW()-INTERVAL '15 minutes' AND (ip=$1 OR usuario=$2)`,[ip,usuario]);
 return rows[0].cantidad as number;
}
export async function registrarIntento(ip:string,usuario:string,correcto:boolean){
 await baseDeDatos().query('INSERT INTO login_attempts (ip,usuario,success,attempt_time) VALUES ($1,$2,$3,NOW())',[ip,usuario,correcto?1:0]);
}
