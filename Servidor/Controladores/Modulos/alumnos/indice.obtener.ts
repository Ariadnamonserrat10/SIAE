import type { DatabaseRow } from '~~/Servidor/Dominio/Modulos/base-de-datos';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
export default defineEventHandler(async event => {
  const currentUser = await requireUser(event);
  const requestedClub = Number(getQuery(event).club_id || 0);
  const clubId = currentUser.rol === 'MONITOR' ? Number(currentUser.club_asignado || 0) : requestedClub;
  const params: number[] = [];
  let filter = '';
  if (clubId > 0) {
    filter = ' AND a.id_club = ?';
    params.push(clubId);
  }
  const [databaseRows] = await db().execute<DatabaseRow[]>(`SELECT a.id, a.nombre, a.apellidoP, a.apellidoM, a.numeroControl, a.telefono,
            a.carrera_id, a.semestre_id, a.id_club, a.periodo_id, a.estado_periodo, a.fecha_registro,
            a.opcion_1, a.opcion_2, a.opcion_3
       FROM alumnos a JOIN periodos p ON p.id = a.periodo_id
      WHERE p.estado = 'ACTIVO'${filter}
      ORDER BY a.apellidoP, a.apellidoM, a.nombre`, params);
  return {
    status: 'success',
    data: databaseRows
  };
});
