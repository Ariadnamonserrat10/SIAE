import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { positiveId } from '~~/Servidor/Servicios/Modulos/validacion';
export default defineEventHandler(async event => {
  const user = await requireUser(event, ['SUPERADMIN', 'ADMIN', 'MONITOR']);
  const clubId = positiveId(getQuery(event).club_id);
  if (user.rol === 'MONITOR' && clubId !== Number(user.club_asignado))
    throw createError({ statusCode: 403, statusMessage: 'Solo puedes consultar tu club' });
  const [clubs] = await db().execute<any[]>('SELECT id, nombre, tipo FROM clubs WHERE id=?', [clubId]);
  const [periods] = await db().execute<any[]>("SELECT id, nombre, fecha_inicio, fecha_fin FROM periodos WHERE estado='ACTIVO' ORDER BY id DESC LIMIT 1");
  if (!clubs[0] || !periods[0]) throw createError({ statusCode: 404, statusMessage: 'Club o periodo activo no disponible' });
  const [students] = await db().execute<any[]>(`SELECT a.id, a.nombre, a.apellidoP, a.apellidoM, a.numeroControl,
    s.numero semestre, ca.nombre carrera, ca.abreviatura carrera_clave, e.id evaluacion_id, e.criterio_1, e.criterio_2, e.criterio_3,
    e.criterio_4, e.criterio_5, e.criterio_6, e.criterio_7, e.observaciones, e.valor_numerico, e.nivel_desempeno,
    (SELECT COUNT(*) FROM asistencias asi WHERE asi.id_alumno=a.id AND asi.presente=0
      AND asi.fecha BETWEEN p.fecha_inicio AND p.fecha_fin) faltas
    FROM alumnos a JOIN periodos p ON p.id=a.periodo_id LEFT JOIN carreras ca ON ca.id=a.carrera_id
    LEFT JOIN semestres s ON s.id=a.semestre_id
    LEFT JOIN LATERAL (SELECT * FROM evaluaciones ev WHERE ev.alumno_id=a.id AND ev.periodo_id=a.periodo_id
      AND ev.escala_version=2 ORDER BY ev.fecha_registro DESC, ev.id DESC LIMIT 1) e ON TRUE
    WHERE a.id_club=? AND a.periodo_id=? ORDER BY a.apellidoP, a.apellidoM, a.nombre`, [clubId, periods[0].id]);
  const [monitors] = await db().execute<any[]>(`SELECT TRIM(CONCAT_WS(' ', nombre, apellidoP, apellidoM)) nombre
    FROM usuarios WHERE club_asignado=? AND tipo='MONITOR' ORDER BY id`, [clubId]);
  return { status: 'success', data: { club: clubs[0], periodo: periods[0], alumnos: students,
    promotor: monitors.length === 1 ? monitors[0].nombre : '' } };
});
