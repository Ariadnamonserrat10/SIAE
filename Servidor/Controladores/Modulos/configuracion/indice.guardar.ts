import { z } from 'zod';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { audit } from '~~/Servidor/Servicios/Modulos/auditoria';
import { templateTypes } from '~~/Servidor/Servicios/Modulos/documentos-institucionales';
const requestSchema = z.object({
  clave: z.string().trim().min(1).max(50),
  valor: z.coerce.string().max(10000)
});
export default defineEventHandler(async event => {
  const currentUser = await requireUser(event, ['SUPERADMIN', 'ADMIN']);
  const validatedBody = requestSchema.safeParse(await readBody(event));
  if (!validatedBody.success) throw createError({
    statusCode: 422,
    statusMessage: 'Configuración inválida'
  });
  const template = Object.entries(templateTypes).find(([, value]) => value.key === validatedBody.data.clave);
  if (currentUser.rol === 'ADMIN' && !template) {
    throw createError({
      statusCode: 403,
      statusMessage: 'No puedes modificar esta configuración'
    });
  }
  if (template) {
    const [code, { prefix: templatePrefix }] = template;
    const [documents] = await db().execute<any[]>("SELECT id FROM documentos WHERE CAST(id AS TEXT)=? AND estado='ACTIVO' AND tipo='OTRO' AND concepto LIKE ? AND formato_codigo=?", [validatedBody.data.valor, templatePrefix + '%', code]);
    if (!documents.length) throw createError({ statusCode: 422, statusMessage: 'El documento no corresponde a esta sección' });
  }
  await db().execute('INSERT INTO app_config (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)', [validatedBody.data.clave, validatedBody.data.valor]);
  await audit(currentUser.id, 'CONFIG_ACTUALIZADA', `Clave: ${validatedBody.data.clave}`);
  return {
    status: 'success',
    ok: true,
    ...validatedBody.data
  };
});
