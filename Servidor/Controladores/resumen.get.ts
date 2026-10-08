import {exigirUsuario} from '../Seguridad/sesion';
import {baseDeDatos} from '../Infraestructura/conexion';
export default defineEventHandler(async event=>{
 await exigirUsuario(event,['SUPERADMIN','ADMIN']);
 const {rows}=await baseDeDatos().query(`SELECT COUNT(*)::int total FROM usuarios u
 LEFT JOIN roles r ON r.id=u.rol_id
 WHERE COALESCE(u.activo,1)=1 AND COALESCE(r.nombre,u.tipo)='MONITOR'
 AND (EXISTS(SELECT 1 FROM clubs c WHERE c.id=u.club_asignado)
 OR EXISTS(SELECT 1 FROM usuario_club uc JOIN clubs c ON c.id=uc.club_id WHERE uc.usuario_id=u.id AND uc.activo=1))`);
 return {monitores:rows[0].total};
});
