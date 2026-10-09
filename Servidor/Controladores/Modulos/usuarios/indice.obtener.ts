import type { DatabaseRow } from '~~/Servidor/Dominio/Modulos/base-de-datos';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
export default defineEventHandler(async event => {
  await requireUser(event, ['SUPERADMIN']);
  const [databaseRows] = await db().query<DatabaseRow[]>(`SELECT u.id, u.nombre, u.apellidoP, u.apellidoM, u.usuario, u.tipo, COALESCE(r.nombre, u.tipo) rol,
            u.numeroControl, u.telefono, u.carrera_id, u.semestre_id, u.club_asignado, u.foto, COALESCE(u.activo, 1) activo
       FROM usuarios u LEFT JOIN roles r ON r.id = u.rol_id
      WHERE COALESCE(u.activo, 1) = 1
      ORDER BY u.tipo, u.apellidoP, u.apellidoM, u.nombre`);
  return {
    status: 'success',
    data: databaseRows
  };
});
