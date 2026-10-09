import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { DatabaseRow } from '~~/Servidor/Dominio/Modulos/base-de-datos';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { positiveId } from '~~/Servidor/Servicios/Modulos/validacion';
export default defineEventHandler(async event => {
  const user = await requireUser(event, ['SUPERADMIN', 'ADMIN', 'MONITOR']);
  const id = positiveId(getRouterParam(event, 'id'));
  if (user.rol === 'MONITOR') {
    const [active] = await db().execute<any[]>(`SELECT d.id FROM documentos d JOIN app_config c ON c.valor=CAST(d.id AS TEXT)
      WHERE d.id=? AND d.tipo='OTRO' AND ((c.clave='formato_evaluacion_activo' AND d.concepto LIKE 'FORMATO_EVALUACION:%')
      OR (c.clave='formato_registro_activo' AND d.concepto LIKE 'FORMATO_REGISTRO:%') OR (c.clave='formato_constancia_activo' AND d.concepto LIKE 'FORMATO_CONSTANCIA:%') OR (c.clave='formato_resultados_activo' AND d.concepto LIKE 'FORMATO_RESULTADOS:%'))`, [id]);
    if (!active.length) throw createError({ statusCode: 403, statusMessage: 'Solo puedes descargar formatos institucionales vigentes' });
  }
  const [databaseRows] = await db().execute<DatabaseRow[]>("SELECT nombre_archivo, nombre_original, mime_type FROM documentos WHERE id = ? AND estado = 'ACTIVO' LIMIT 1", [id]);
  const document = databaseRows[0];
  if (!document) throw createError({
    statusCode: 404,
    statusMessage: 'Documento no encontrado'
  });
  try {
    const data = await readFile(join(String(useRuntimeConfig().uploadsDir), 'documents', String(document.nombre_archivo)));
    setHeader(event, 'Content-Type', document.mime_type);
    const disposition = /\.docx?$/i.test(document.nombre_original) ? 'attachment' : 'inline';
    setHeader(event, 'Content-Disposition', `${disposition}; filename*=UTF-8''${encodeURIComponent(String(document.nombre_original))}`);
    setHeader(event, 'Cache-Control', 'private, no-store');
    return data;
  } catch (error: any) {
    if (error?.code === 'ENOENT') throw createError({
      statusCode: 410,
      statusMessage: 'El registro existe pero el archivo no está disponible'
    });
    throw error;
  }
});
