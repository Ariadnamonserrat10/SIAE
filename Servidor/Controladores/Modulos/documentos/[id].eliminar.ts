import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { audit } from '~~/Servidor/Servicios/Modulos/auditoria';
import { positiveId } from '~~/Servidor/Servicios/Modulos/validacion';
export default defineEventHandler(async event => {
  const currentUser = await requireUser(event, ['SUPERADMIN']);
  const id = positiveId(getRouterParam(event, 'id'));
  const [result] = await db().execute("UPDATE documentos SET estado = 'ANULADO' WHERE id = ? AND estado = 'ACTIVO'", [id]);
  if (!(result as {
    affectedRows: number;
  }).affectedRows) throw createError({
    statusCode: 404,
    statusMessage: 'Documento no encontrado'
  });
  await audit(currentUser.id, 'DOCUMENTO_ANULADO', `Documento ${id}`);
  return {
    status: 'success',
    message: 'Documento anulado; el archivo se conserva para auditoría'
  };
});
