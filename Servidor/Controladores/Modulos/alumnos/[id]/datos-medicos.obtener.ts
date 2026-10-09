import type { DatabaseRow } from '~~/Servidor/Dominio/Modulos/base-de-datos';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { positiveId } from '~~/Servidor/Servicios/Modulos/validacion';
export default defineEventHandler(async event => {
  const currentUser = await requireUser(event);
  const id = positiveId(getRouterParam(event, 'id'));
  if (currentUser.rol === 'MONITOR') {
    const [allowed] = await db().execute<DatabaseRow[]>('SELECT id FROM alumnos WHERE id = ? AND id_club = ? LIMIT 1', [id, currentUser.club_asignado]);
    if (!allowed.length) throw createError({
      statusCode: 403,
      statusMessage: 'El alumno no pertenece al club asignado'
    });
  }
  const [databaseRows] = await db().execute<DatabaseRow[]>('SELECT alumno_id, alergias, restricciones_fisicas, condicion_emergencia, contacto_emergencia, telefono_emergencia, observaciones, actualizado_en FROM datos_medicos_basicos WHERE alumno_id = ? LIMIT 1', [id]);
  return {
    status: 'success',
    data: databaseRows[0] || null
  };
});
