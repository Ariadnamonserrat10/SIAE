import { z } from 'zod';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { audit } from '~~/Servidor/Servicios/Modulos/auditoria';
import { positiveId } from '~~/Servidor/Servicios/Modulos/validacion';
const requestSchema = z.object({
  nombre: z.string().trim().min(1).max(50),
  fecha_inicio: z.iso.date(),
  fecha_fin: z.iso.date(),
  ya_editado: z.coerce.number().int().min(0).max(1).default(0)
}).refine(v => v.fecha_fin >= v.fecha_inicio);
export default defineEventHandler(async event => {
  const currentUser = await requireUser(event, ['SUPERADMIN', 'ADMIN']);
  const id = positiveId(getRouterParam(event, 'id'));
  const validatedBody = requestSchema.safeParse(await readBody(event));
  if (!validatedBody.success) throw createError({
    statusCode: 422,
    statusMessage: 'Datos del periodo inválidos'
  });
  const value = validatedBody.data;
  const [result] = await db().execute('UPDATE periodos SET nombre = ?, fecha_inicio = ?, fecha_fin = ?, ya_editado = ? WHERE id = ?', [value.nombre, value.fecha_inicio, value.fecha_fin, value.ya_editado, id]);
  if (!(result as {
    affectedRows: number;
  }).affectedRows) throw createError({
    statusCode: 404,
    statusMessage: 'Periodo no encontrado'
  });
  await audit(currentUser.id, 'PERIODO_ACTUALIZADO', `Periodo ${id}`);
  return {
    status: 'success',
    message: 'Periodo actualizado'
  };
});
