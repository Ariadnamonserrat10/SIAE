import type { DatabaseRow } from '~~/Servidor/Dominio/Modulos/base-de-datos';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
export default defineEventHandler(async event => {
  await requireUser(event);
  const [databaseRows] = await db().query<DatabaseRow[]>(`SELECT fc.tipo, fc.cerrado_en
       FROM filtros_cerrados fc
       JOIN periodos p ON p.id = fc.periodo_id
      WHERE p.estado = 'ACTIVO'
      ORDER BY fc.tipo`);
  return {
    status: 'success',
    data: databaseRows
  };
});
