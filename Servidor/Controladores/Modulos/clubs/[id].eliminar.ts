import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { audit } from '~~/Servidor/Servicios/Modulos/auditoria';
import { positiveId } from '~~/Servidor/Servicios/Modulos/validacion';
export default defineEventHandler(async event => {
  const currentUser = await requireUser(event, ['SUPERADMIN']);
  const id = positiveId(getRouterParam(event, 'id'));
  const [result] = await db().execute('DELETE FROM clubs WHERE id = ?', [id]);
  if (!(result as {
    affectedRows: number;
  }).affectedRows) throw createError({
    statusCode: 404,
    statusMessage: 'Club no encontrado'
  });
  await audit(currentUser.id, 'CLUB_ELIMINADO', `Club ${id}`);
  return {
    status: 'success',
    ok: true
  };
});
