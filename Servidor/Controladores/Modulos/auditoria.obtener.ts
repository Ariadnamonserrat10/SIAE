import type { DatabaseRow } from '~~/Servidor/Dominio/Modulos/base-de-datos';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
export default defineEventHandler(async event => {
  await requireUser(event, ['SUPERADMIN']);
  const query = getQuery(event);
  const limit = Math.min(500, Math.max(1, Number(query.limit || 100)));
  const offset = Math.max(0, Number(query.offset || 0));
  const [databaseRows] = await db().query<DatabaseRow[]>(`SELECT a.id, a.id_usuario, a.accion, a.descripcion, a.fecha,
            CONCAT_WS(' ', u.nombre, u.apellidoP, u.apellidoM) AS usuario_nombre
       FROM auditoria a LEFT JOIN usuarios u ON u.id = a.id_usuario
      ORDER BY a.fecha DESC LIMIT ${limit} OFFSET ${offset}`);
  const [countRows] = await db().query<DatabaseRow[]>('SELECT COUNT(*) total FROM auditoria');
  return {
    status: 'success',
    data: databaseRows,
    pagination: {
      total: Number(countRows[0]?.total || 0),
      limit,
      offset
    }
  };
});
