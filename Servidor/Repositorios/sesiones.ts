import {baseDeDatos} from '../Infraestructura/conexion';
export async function guardarSesion(id:number,selector:string,hash:string){
 await baseDeDatos().query(`INSERT INTO tokens (user_id,selector,token,tipo,expires_at,activo) VALUES ($1,$2,$3,'SESSION',NOW()+INTERVAL '2 hours',1)`,[id,selector,hash]);
}
export async function buscarSesion(selector:string){
 const {rows}=await baseDeDatos().query(`SELECT user_id,token FROM tokens WHERE selector=$1 AND tipo='SESSION' AND activo=1 AND expires_at>NOW() LIMIT 1`,[selector]);
 return rows[0] as {user_id:number;token:string}|undefined;
}
export async function revocarSesion(selector:string){
 await baseDeDatos().query(`UPDATE tokens SET activo=0 WHERE selector=$1 AND tipo='SESSION'`,[selector]);
}
