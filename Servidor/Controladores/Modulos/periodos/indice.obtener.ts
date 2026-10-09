import type { DatabaseRow } from '~~/Servidor/Dominio/Modulos/base-de-datos';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
export default defineEventHandler(async event => {
  await requireUser(event);
  const activeOnly = getQuery(event).action === 'activo';
  const [databaseRows] = await db().query<DatabaseRow[]>(`SELECT * FROM periodos ${activeOnly ? "WHERE estado = 'ACTIVO'" : ''} ORDER BY id DESC${activeOnly ? ' LIMIT 1' : ''}`);
  if (activeOnly && !databaseRows[0]) return {
    status: 'success',
    message: 'No hay periodo activo',
    data: null
  };
  return {
    status: 'success',
    data: activeOnly ? databaseRows[0] : databaseRows
  };
});
