import type { DatabaseRow } from '~~/Servidor/Dominio/Modulos/base-de-datos';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
export default defineEventHandler(async event => {
  await requireUser(event);
  const [databaseRows] = await db().query<DatabaseRow[]>(`SELECT c.id, c.nombre, c.tipo, c.descripcion, c.cupo_limite,
            (SELECT COUNT(*) FROM alumnos a JOIN periodos p ON p.id = a.periodo_id
              WHERE a.id_club = c.id AND p.estado = 'ACTIVO') AS cupo_ocupado,
            c.id_responsable, c.creado_en
       FROM clubs c ORDER BY c.id DESC`);
  return {
    data: databaseRows
  };
});
