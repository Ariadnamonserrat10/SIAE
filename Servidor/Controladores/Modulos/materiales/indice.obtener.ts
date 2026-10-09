import type { DatabaseRow } from '~~/Servidor/Dominio/Modulos/base-de-datos';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
export default defineEventHandler(async event => {
  await requireUser(event, ['SUPERADMIN', 'ADMIN']);
  const [databaseRows] = await db().query<DatabaseRow[]>(`SELECT m.id, m.nombre, m.descripcion, m.cantidad_total, m.cantidad_disponible, m.club_id, m.estado,
            c.nombre club_nombre, m.creado_en, m.actualizado_en
       FROM materiales m LEFT JOIN clubs c ON c.id = m.club_id WHERE m.estado <> 'BAJA' ORDER BY m.nombre`);
  return {
    status: 'success',
    data: databaseRows
  };
});
