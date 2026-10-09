import type { DatabaseRow } from '~~/Servidor/Dominio/Modulos/base-de-datos';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
export default defineEventHandler(async event => {
  const user = await requireUser(event);
  const club = String(getQuery(event).club_name || '').trim();
  if (!club) throw createError({
    statusCode: 400,
    statusMessage: 'Nombre del club requerido'
  });
  if (user.rol === 'MONITOR') {
    const [allowed] = await db().execute<any[]>('SELECT id FROM clubs WHERE id=? AND nombre=?', [user.club_asignado, club]);
    if (!allowed.length) throw createError({ statusCode: 403, statusMessage: 'Solo puedes consultar tu club' });
  }
  const [databaseRows] = await db().execute<DatabaseRow[]>(`SELECT e.alumno_id, e.nombre_estudiante, e.nivel_desempeno, e.valor_numerico, e.observaciones
    FROM evaluaciones e JOIN periodos p ON p.id=e.periodo_id
    WHERE e.nombre_club=? AND p.estado='ACTIVO' AND e.escala_version=2 ORDER BY e.fecha_registro DESC, e.id DESC`, [club]);
  return {
    status: 'success',
    data: databaseRows
  };
});
