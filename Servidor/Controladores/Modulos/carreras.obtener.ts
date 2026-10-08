import type { DatabaseRow } from '~~/Servidor/Dominio/Modulos/base-de-datos';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
export default defineEventHandler(async event => {
  await requireUser(event);
  const [databaseRows] = await db().query<DatabaseRow[]>('SELECT id, nombre, abreviatura FROM carreras ORDER BY id');
  return {
    status: 'success',
    data: databaseRows
  };
});
