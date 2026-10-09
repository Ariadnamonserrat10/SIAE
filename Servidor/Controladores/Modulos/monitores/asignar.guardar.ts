import { z } from 'zod';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { transaction } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { audit } from '~~/Servidor/Servicios/Modulos/auditoria';
const requestSchema = z.object({
  monitor_id: z.coerce.number().int().positive(),
  club_id: z.coerce.number().int().positive()
});
export default defineEventHandler(async event => {
  const currentUser = await requireUser(event, ['SUPERADMIN']);
  const validatedBody = requestSchema.safeParse(await readBody(event));
  if (!validatedBody.success) throw createError({
    statusCode: 422,
    statusMessage: 'Monitor y club son requeridos'
  });
  const {
    monitor_id,
    club_id
  } = validatedBody.data;
  await transaction(async connection => {
    await connection.execute(`INSERT INTO usuario_club (usuario_id, club_id, fecha_asignacion, activo, asignado_por)
       VALUES (?, ?, CURDATE(), 1, ?)
       ON DUPLICATE KEY UPDATE activo = 1, fecha_asignacion = CURDATE(), asignado_por = VALUES(asignado_por)`, [monitor_id, club_id, currentUser.id]);
    await connection.execute('UPDATE usuarios SET club_asignado = ? WHERE id = ?', [club_id, monitor_id]);
  });
  await audit(currentUser.id, 'MONITOR_ASIGNADO', `Monitor ${monitor_id}, club ${club_id}`);
  return {
    status: 'success',
    message: 'Monitor asignado correctamente',
    data: validatedBody.data
  };
});
