import { z } from 'zod';
import type { DatabaseRow } from '~~/Servidor/Dominio/Modulos/base-de-datos';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { transaction } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { audit } from '~~/Servidor/Servicios/Modulos/auditoria';
import { positiveId } from '~~/Servidor/Servicios/Modulos/validacion';
const requestSchema = z.object({
  tipo: z.enum(['ENTRADA', 'SALIDA', 'AJUSTE']),
  cantidad: z.coerce.number().int(),
  motivo: z.string().trim().min(1).max(255),
  documento_id: z.coerce.number().int().positive().nullish()
}).superRefine((value, context) => {
  if (value.tipo !== 'AJUSTE' && value.cantidad <= 0) context.addIssue({
    code: 'custom',
    message: 'La cantidad debe ser positiva'
  });
  if (value.tipo === 'AJUSTE' && value.cantidad < 0) context.addIssue({
    code: 'custom',
    message: 'El inventario no puede ser negativo'
  });
});
export default defineEventHandler(async event => {
  const currentUser = await requireUser(event, ['SUPERADMIN', 'ADMIN']);
  const id = positiveId(getRouterParam(event, 'id'));
  const validatedBody = requestSchema.safeParse(await readBody(event));
  if (!validatedBody.success) throw createError({
    statusCode: 422,
    statusMessage: 'Movimiento inválido'
  });
  const value = validatedBody.data;
  const available = await transaction(async connection => {
    const [databaseRows] = await connection.execute<DatabaseRow[]>('SELECT cantidad_total, cantidad_disponible FROM materiales WHERE id = ? AND estado <> \'BAJA\' FOR UPDATE', [id]);
    const material = databaseRows[0];
    if (!material) throw createError({
      statusCode: 404,
      statusMessage: 'Material no encontrado'
    });
    const current = Number(material.cantidad_disponible);
    const total = Number(material.cantidad_total);
    const next = value.tipo === 'ENTRADA' ? current + value.cantidad : value.tipo === 'SALIDA' ? current - value.cantidad : value.cantidad;
    if (next < 0) throw createError({
      statusCode: 409,
      statusMessage: 'No hay material suficiente'
    });
    const nextTotal = value.tipo === 'ENTRADA' ? total + value.cantidad : Math.max(total, next);
    await connection.execute('UPDATE materiales SET cantidad_total = ?, cantidad_disponible = ?, estado = ? WHERE id = ?', [nextTotal, next, next ? 'DISPONIBLE' : 'AGOTADO', id]);
    await connection.execute('INSERT INTO movimientos_material (material_id, tipo, cantidad, motivo, documento_id, usuario_id) VALUES (?, ?, ?, ?, ?, ?)', [id, value.tipo, value.cantidad, value.motivo, value.documento_id || null, currentUser.id]);
    return next;
  });
  await audit(currentUser.id, 'MOVIMIENTO_MATERIAL', `Material ${id}, ${value.tipo}, cantidad ${value.cantidad}`);
  return {
    status: 'success',
    cantidad_disponible: available
  };
});
