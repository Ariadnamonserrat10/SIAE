import { z } from 'zod';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { audit } from '~~/Servidor/Servicios/Modulos/auditoria';
const requestSchema = z.object({
  nombre: z.string().trim().min(1).max(120),
  descripcion: z.string().trim().max(500).nullish(),
  cantidad_total: z.coerce.number().int().min(0),
  club_id: z.coerce.number().int().positive().nullish()
});
export default defineEventHandler(async event => {
  const currentUser = await requireUser(event, ['SUPERADMIN', 'ADMIN']);
  const validatedBody = requestSchema.safeParse(await readBody(event));
  if (!validatedBody.success) throw createError({
    statusCode: 422,
    statusMessage: 'Datos del material inválidos'
  });
  const value = validatedBody.data;
  const [result] = await db().execute('INSERT INTO materiales (nombre, descripcion, cantidad_total, cantidad_disponible, club_id, estado, creado_por) VALUES (?, ?, ?, ?, ?, ?, ?)', [value.nombre, value.descripcion || null, value.cantidad_total, value.cantidad_total, value.club_id || null, value.cantidad_total ? 'DISPONIBLE' : 'AGOTADO', currentUser.id]);
  const id = Number((result as {
    insertId: number;
  }).insertId);
  await audit(currentUser.id, 'MATERIAL_CREADO', `Material ${id}: ${value.nombre}, cantidad ${value.cantidad_total}`);
  setResponseStatus(event, 201);
  return {
    status: 'success',
    data: {
      id,
      ...value,
      cantidad_disponible: value.cantidad_total
    }
  };
});
