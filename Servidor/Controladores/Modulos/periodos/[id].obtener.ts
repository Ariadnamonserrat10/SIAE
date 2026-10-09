import type { DatabaseRow } from '~~/Servidor/Dominio/Modulos/base-de-datos';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { positiveId } from '~~/Servidor/Servicios/Modulos/validacion';
export default defineEventHandler(async event => {
  await requireUser(event, ['SUPERADMIN', 'ADMIN']);
  const id = positiveId(getRouterParam(event, 'id'));
  const [periods] = await db().execute<DatabaseRow[]>('SELECT * FROM periodos WHERE id = ? LIMIT 1', [id]);
  if (!periods[0]) throw createError({
    statusCode: 404,
    statusMessage: 'Periodo no encontrado'
  });
  const [students] = await db().execute<DatabaseRow[]>(`SELECT a.id, a.nombre, a.apellidoP, a.apellidoM, a.numeroControl, a.telefono,
            a.semestre_id, a.estado_periodo, a.id_club, c.nombre AS club_nombre,
            ca.nombre AS carrera_nombre
       FROM alumnos a
       LEFT JOIN clubs c ON c.id = a.id_club
       LEFT JOIN carreras ca ON ca.id = a.carrera_id
      WHERE a.periodo_id = ?
      ORDER BY c.nombre, a.apellidoP, a.apellidoM, a.nombre`, [id]);
  const [snapshots] = await db().execute<DatabaseRow[]>("SELECT valor FROM historial_configuracion WHERE periodo_id = ? AND clave = 'clubs_snapshot' LIMIT 1", [id]);
  let clubs: any[] = [];
  try {
    clubs = JSON.parse(String(snapshots[0]?.valor || '[]'));
  } catch {
    clubs = [];
  }
  if (!Array.isArray(clubs) || !clubs.length) {
    const seen = new Map<number, any>();
    students.forEach(student => {
      const clubId = Number(student.id_club || 0);
      if (clubId && !seen.has(clubId)) seen.set(clubId, {
        id: clubId,
        nombre: student.club_nombre || 'Club eliminado',
        tipo: '',
        descripcion: '',
        cupo_limite: null
      });
    });
    clubs = [...seen.values()];
  }
  const grouped = clubs.map(club => {
    const alumnos = students.filter(student => Number(student.id_club) === Number(club.id));
    return {
      ...club,
      alumnos,
      acreditados: alumnos.filter(student => student.estado_periodo === 'ACREDITADO').length,
      no_acreditados: alumnos.filter(student => student.estado_periodo === 'REPROBADO').length
    };
  });
  const withoutClub = students.filter(student => !student.id_club || !grouped.some(club => Number(club.id) === Number(student.id_club)));
  if (withoutClub.length) grouped.push({
    id: 0,
    nombre: 'Sin club o club eliminado',
    tipo: '',
    descripcion: '',
    cupo_limite: null,
    alumnos: withoutClub,
    acreditados: withoutClub.filter(a => a.estado_periodo === 'ACREDITADO').length,
    no_acreditados: withoutClub.filter(a => a.estado_periodo === 'REPROBADO').length
  });
  return {
    status: 'success',
    data: {
      periodo: periods[0],
      clubs: grouped
    }
  };
});
