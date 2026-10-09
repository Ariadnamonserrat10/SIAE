import { z } from 'zod';
import type { DatabaseRow } from '~~/Servidor/Dominio/Modulos/base-de-datos';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { transaction, db } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { audit } from '~~/Servidor/Servicios/Modulos/auditoria';
const requestSchema = z.object({
  club_id: z.coerce.number().int().positive(),
  fecha: z.iso.date(),
  registros: z.array(z.object({
    alumno_id: z.coerce.number().int().positive(),
    presente: z.coerce.boolean()
  }))
});
export default defineEventHandler(async event => {
  const currentUser = await requireUser(event, ['SUPERADMIN', 'ADMIN']);
  const validatedBody = requestSchema.safeParse(await readBody(event));
  if (!validatedBody.success) throw createError({
    statusCode: 422,
    statusMessage: 'Datos de asistencia inválidos'
  });
  const [periods] = await db().query<DatabaseRow[]>("SELECT id, DATE_FORMAT(fecha_inicio, '%Y-%m-%d') fecha_inicio, DATE_FORMAT(fecha_fin, '%Y-%m-%d') fecha_fin FROM periodos WHERE estado = 'ACTIVO' LIMIT 1");
  if (!periods.length) throw createError({
    statusCode: 403,
    statusMessage: 'No se pueden registrar asistencias porque el periodo está cerrado'
  });
  const period = periods[0]!;
  const fecha = validatedBody.data.fecha;
  const inicio = String(period.fecha_inicio).slice(0, 10);
  const fin = String(period.fecha_fin).slice(0, 10);
  if (fecha < inicio || fecha > fin) throw createError({
    statusCode: 422,
    statusMessage: 'La fecha debe estar dentro del periodo activo'
  });
  let saved = 0;
  await transaction(async connection => {
    try {
      await connection.execute('INSERT INTO fechas_club (periodo_id, club_id, fecha, creado_por) VALUES (?, ?, ?, ?)', [period.id, validatedBody.data.club_id, fecha, currentUser.id]);
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY') throw createError({
        statusCode: 409,
        statusMessage: 'La fecha ya está asignada a este club'
      });
      throw error;
    }
    for (const item of validatedBody.data.registros) {
      const [result] = await connection.execute(`INSERT INTO asistencias (id_alumno, fecha, presente)
         SELECT id, ?, ? FROM alumnos WHERE id = ? AND id_club = ?
         ON DUPLICATE KEY UPDATE presente = VALUES(presente)`, [validatedBody.data.fecha, item.presente ? 1 : 0, item.alumno_id, validatedBody.data.club_id]);
      saved += (result as {
        affectedRows: number;
      }).affectedRows ? 1 : 0;
    }
  });
  await audit(currentUser.id, 'ASISTENCIAS_REGISTRADAS', `Club ${validatedBody.data.club_id}, fecha ${validatedBody.data.fecha}, registros ${saved}`);
  return {
    status: 'success',
    message: `Registros guardados: ${saved}`
  };
});
