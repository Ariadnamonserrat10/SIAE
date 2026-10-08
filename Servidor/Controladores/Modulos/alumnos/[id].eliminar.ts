import type { DatabaseRow } from '~~/Servidor/Dominio/Modulos/base-de-datos';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { audit } from '~~/Servidor/Servicios/Modulos/auditoria';
import { positiveId } from '~~/Servidor/Servicios/Modulos/validacion';
export default defineEventHandler(async event => {
  const currentUser = await requireUser(event, ['SUPERADMIN']);
  const id = positiveId(getRouterParam(event, 'id'));
  const [databaseRows] = await db().execute<DatabaseRow[]>('SELECT numeroControl FROM alumnos WHERE id = ? LIMIT 1', [id]);
  const alumno = databaseRows[0];
  if (!alumno) throw createError({
    statusCode: 404,
    statusMessage: 'Alumno no encontrado'
  });
  const [result] = await db().execute('DELETE FROM alumnos WHERE id = ?', [id]);
  if (!(result as {
    affectedRows: number;
  }).affectedRows) throw createError({
    statusCode: 404,
    statusMessage: 'Alumno no encontrado'
  });
  await audit(currentUser.id, 'ALUMNO_ELIMINADO', `Alumno ${id}, control ${alumno.numeroControl || 'sin control'}`);
  return {
    status: 'success',
    ok: true
  };
});
