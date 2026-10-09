import type { DatabaseRow } from '~~/Servidor/Dominio/Modulos/base-de-datos';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
export default defineEventHandler(async event => {
  await requireUser(event);
  const query = getQuery(event);
  const student = String(query.nombre_estudiante || '').trim();
  const club = String(query.nombre_club || '').trim();
  if (!student || !club) throw createError({
    statusCode: 422,
    statusMessage: 'Nombre del estudiante y club son requeridos'
  });
  const [databaseRows] = await db().execute<DatabaseRow[]>(`SELECT a.id, COUNT(CASE WHEN asi.presente = 0 THEN 1 END) faltas
       FROM alumnos a JOIN clubs c ON c.id = a.id_club LEFT JOIN asistencias asi ON asi.id_alumno = a.id
      WHERE UPPER(TRIM(CONCAT_WS(' ', a.nombre, a.apellidoP, a.apellidoM))) = UPPER(?) AND UPPER(TRIM(c.nombre)) = UPPER(?)
      GROUP BY a.id ORDER BY a.id DESC LIMIT 1`, [student, club]);
  if (!databaseRows[0]) return {};
  const faltas = Number(databaseRows[0].faltas);
  const score = faltas <= 1 ? 5 : faltas === 2 ? 3 : 2;
  return {
    id_alumno: Number(databaseRows[0].id),
    faltas,
    desempeno: score === 5 ? 'EXCELENTE' : score === 3 ? 'BUENO' : 'REGULAR',
    nivel_desempeno: score,
    valor_numerico: score
  };
});
