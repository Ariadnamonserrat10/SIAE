import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { transaction } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { positiveId } from '~~/Servidor/Servicios/Modulos/validacion';
import { audit } from '~~/Servidor/Servicios/Modulos/auditoria';

export default defineEventHandler(async event => {
  const user = await requireUser(event, ['SUPERADMIN', 'ADMIN']);
  const id = positiveId(getRouterParam(event, 'id'));
  await transaction(async connection => {
    const [documents] = await connection.execute<any[]>(`SELECT id FROM documentos
      WHERE id=? AND estado='ACTIVO' AND tipo='OTRO'
      AND (concepto LIKE 'FORMATO_EVALUACION:%' OR concepto LIKE 'FORMATO_RESULTADOS:%' OR concepto LIKE 'FORMATO_REGISTRO:%' OR concepto LIKE 'FORMATO_CONSTANCIA:%') FOR UPDATE`, [id]);
    if (!documents.length) throw createError({ statusCode: 404, statusMessage: 'Formato no encontrado' });
    // Retirar de todos los clubs sin borrar el original ni las evaluaciones históricas.
    await connection.execute("UPDATE documentos SET estado='ANULADO' WHERE id=?", [id]);
    await connection.execute(`DELETE FROM app_config WHERE clave IN ('formato_registro_activo','formato_evaluacion_activo','formato_resultados_activo','formato_constancia_activo') AND valor=?`, [String(id)]);
  });
  await audit(user.id, 'FORMATO_RETIRADO', `Formato ${id} retirado para todos los clubs; original conservado`);
  return { status: 'success' };
});
