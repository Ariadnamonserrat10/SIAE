import { z } from 'zod';
import type { DatabaseRow } from '~~/Servidor/Dominio/Modulos/base-de-datos';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { audit } from '~~/Servidor/Servicios/Modulos/auditoria';
const requestSchema = z.object({
  alumno_id: z.coerce.number().int().positive(),
  fecha: z.iso.date(),
  presente: z.coerce.boolean()
});
export default defineEventHandler(async event => {
  const currentUser = await requireUser(event, ['SUPERADMIN', 'ADMIN', 'MONITOR']);
  const validatedBody = requestSchema.safeParse(await readBody(event));
  if (!validatedBody.success) throw createError({
    statusCode: 422,
    statusMessage: 'Datos de asistencia inválidos'
  });
  const [periods] = await db().query<DatabaseRow[]>("SELECT id FROM periodos WHERE estado = 'ACTIVO' LIMIT 1");
  if (!periods.length) throw createError({
    statusCode: 403,
    statusMessage: 'El periodo está cerrado'
  });
  const period = periods[0]!;
  const [target] = await db().execute<DatabaseRow[]>('SELECT id_club FROM alumnos WHERE id=? AND periodo_id=? LIMIT 1', [validatedBody.data.alumno_id, period.id]);
  if (!target[0]) throw createError({
    statusCode: 404,
    statusMessage: 'Alumno no encontrado en el periodo activo'
  });
  const student = target[0]!;
  const [assignedDates] = await db().execute<DatabaseRow[]>('SELECT id FROM fechas_club WHERE periodo_id=? AND club_id=? AND fecha=? LIMIT 1', [period.id, student.id_club, validatedBody.data.fecha]);
  if (!assignedDates.length) throw createError({
    statusCode: 403,
    statusMessage: 'Esta fecha no fue asignada al club por un administrador'
  });
  if (currentUser.rol === 'MONITOR') {
    if (Number(student.id_club) !== Number(currentUser.club_asignado)) throw createError({
      statusCode: 403,
      statusMessage: 'El alumno no pertenece al club asignado'
    });
  }
  await db().execute('INSERT INTO asistencias (id_alumno, fecha, presente) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE presente = VALUES(presente)', [validatedBody.data.alumno_id, validatedBody.data.fecha, validatedBody.data.presente ? 1 : 0]);
  await audit(currentUser.id, 'ASISTENCIA_ACTUALIZADA', `Alumno ${validatedBody.data.alumno_id}, fecha ${validatedBody.data.fecha}`);
  return {
    status: 'success'
  };
});
