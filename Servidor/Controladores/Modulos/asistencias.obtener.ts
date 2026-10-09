import type { DatabaseRow } from '~~/Servidor/Dominio/Modulos/base-de-datos';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { positiveId } from '~~/Servidor/Servicios/Modulos/validacion';
interface AttendanceRow extends DatabaseRow {
  id_alumno: number;
  fecha: string;
  presente: number;
}
export default defineEventHandler(async event => {
  await requireUser(event);
  const clubId = positiveId(getQuery(event).club_id);
  const [students] = await db().execute<DatabaseRow[]>(`SELECT a.id, a.nombre, a.apellidoP, a.apellidoM, a.numeroControl, a.carrera_id, a.semestre_id, a.id_club, a.fecha_registro
       FROM alumnos a JOIN periodos p ON p.id = a.periodo_id
      WHERE a.id_club = ? AND p.estado = 'ACTIVO'
      ORDER BY a.fecha_registro, a.id`, [clubId]);
  const [dateRows] = await db().execute<DatabaseRow[]>(`SELECT DATE_FORMAT(fc.fecha, '%Y-%m-%d') fecha
       FROM fechas_club fc JOIN periodos p ON p.id=fc.periodo_id
      WHERE fc.club_id=? AND p.estado='ACTIVO' ORDER BY fc.fecha`, [clubId]);
  if (!students.length) return {
    status: 'success',
    data: {
      fechas: dateRows.map(row => row.fecha),
      asistencias: {},
      alumnos: []
    }
  };
  const ids = students.map(row => Number(row.id));
  const placeholders = ids.map(() => '?').join(',');
  const [databaseRows] = await db().execute<AttendanceRow[]>(`SELECT id_alumno, DATE_FORMAT(fecha, '%Y-%m-%d') fecha, presente FROM asistencias WHERE id_alumno IN (${placeholders}) ORDER BY fecha`, ids);
  const fechas = [...new Set(dateRows.map(row => row.fecha))];
  const asistencias: Record<number, Record<string, boolean>> = {};
  for (const row of databaseRows) (asistencias[row.id_alumno] ||= {})[row.fecha] = Boolean(row.presente);
  return {
    status: 'success',
    data: {
      fechas,
      asistencias,
      alumnos: students
    }
  };
});
