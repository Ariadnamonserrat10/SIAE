import { z } from 'zod';
import { bearerToken, requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { audit } from '~~/Servidor/Servicios/Modulos/auditoria';
const requestSchema = z.object({
  session_id: z.coerce.number().int().positive().optional(),
  mode: z.enum(['single', 'others', 'all']).default('single')
});
export default defineEventHandler(async event => {
  const currentUser = await requireUser(event);
  const rawBody: unknown = await readBody(event).catch(() => ({}));
  const body: Record<string, unknown> = rawBody && typeof rawBody === 'object' && !Array.isArray(rawBody) ? rawBody as Record<string, unknown> : {};
  const query = getQuery(event) as Record<string, unknown>;
  const validatedBody = requestSchema.safeParse(Object.assign({}, query, body));
  if (!validatedBody.success || validatedBody.data.mode === 'single' && !validatedBody.data.session_id) throw createError({
    statusCode: 422,
    statusMessage: 'Sesión inválida'
  });
  const selector = bearerToken(event)?.split('.', 1)[0] || '';
  let sql = "UPDATE tokens SET activo = 0 WHERE user_id = ? AND tipo = 'SESSION' AND activo = 1";
  const params: Array<string | number> = [currentUser.id];
  if (validatedBody.data.mode === 'single') {
    sql += ' AND id = ?';
    params.push(validatedBody.data.session_id!);
  }
  if (validatedBody.data.mode === 'others') {
    sql += ' AND selector <> ?';
    params.push(selector);
  }
  const [result] = await db().execute(sql, params);
  const count = Number((result as {
    affectedRows: number;
  }).affectedRows);
  if (validatedBody.data.mode === 'single' && !count) throw createError({
    statusCode: 404,
    statusMessage: 'Sesión no encontrada'
  });
  await audit(currentUser.id, 'SESIONES_REVOCADAS', `Modo ${validatedBody.data.mode}, cantidad ${count}`);
  return {
    status: 'success',
    message: `Se cerraron ${count} sesiones`,
    revoked_count: count,
    mode: validatedBody.data.mode
  };
});
