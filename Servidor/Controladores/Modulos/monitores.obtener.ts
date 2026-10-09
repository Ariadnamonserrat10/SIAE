import type { DatabaseRow } from '~~/Servidor/Dominio/Modulos/base-de-datos';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
export default defineEventHandler(async event => {
  await requireUser(event);
  const clubId = Number(getQuery(event).club_id || 0);
  if (!clubId) throw createError({
    statusCode: 400,
    statusMessage: 'club_id es requerido'
  });
  const [databaseRows] = await db().execute<DatabaseRow[]>(`SELECT u.id, u.nombre, u.apellidoP, u.apellidoM, u.usuario
       FROM usuarios u
       LEFT JOIN roles r ON r.id = u.rol_id
       LEFT JOIN usuario_club uc ON uc.usuario_id = u.id AND uc.activo = 1
      WHERE COALESCE(r.nombre, u.tipo) = 'MONITOR'
        AND (uc.club_id = ? OR u.club_asignado = ?)
      GROUP BY u.id ORDER BY u.nombre, u.apellidoP`, [clubId, clubId]);
  return {
    status: 'success',
    data: {
      club_id: clubId,
      monitores: databaseRows
    }
  };
});
