import { z } from 'zod';
import type { DatabaseRow } from '~~/Servidor/Dominio/Modulos/base-de-datos';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { audit } from '~~/Servidor/Servicios/Modulos/auditoria';
const requestSchema = z.object({
  tipo: z.enum(['futbol', 'basquetbol'])
});
export default defineEventHandler(async event => {
  const currentUser = await requireUser(event, ['SUPERADMIN', 'ADMIN']);
  const validatedBody = requestSchema.safeParse(await readBody(event));
  if (!validatedBody.success) throw createError({
    statusCode: 422,
    statusMessage: 'Filtro inválido'
  });
  const [periods] = await db().query<DatabaseRow[]>("SELECT id FROM periodos WHERE estado='ACTIVO' ORDER BY id DESC LIMIT 1");
  if (!periods[0]) throw createError({
    statusCode: 409,
    statusMessage: 'No hay periodo activo'
  });
  await db().execute(`INSERT INTO filtros_cerrados (periodo_id, tipo, cerrado_por)
     VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE cerrado_en=CURRENT_TIMESTAMP, cerrado_por=VALUES(cerrado_por)`, [periods[0].id, validatedBody.data.tipo, currentUser.id]);
  await audit(currentUser.id, 'FILTRO_CERRADO', `Filtro ${validatedBody.data.tipo}, periodo ${periods[0].id}`);
  return {
    status: 'success',
    data: {
      tipo: validatedBody.data.tipo
    }
  };
});
