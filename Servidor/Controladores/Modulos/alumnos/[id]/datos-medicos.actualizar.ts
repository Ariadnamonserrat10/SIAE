import { z } from 'zod';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { audit } from '~~/Servidor/Servicios/Modulos/auditoria';
import { positiveId } from '~~/Servidor/Servicios/Modulos/validacion';
const optionalText = z.union([z.string().trim().max(255), z.null()]).optional();
const requestSchema = z.object({
  alergias: optionalText,
  restricciones_fisicas: optionalText,
  condicion_emergencia: optionalText,
  contacto_emergencia: z.string().trim().min(1).max(120),
  telefono_emergencia: z.string().regex(/^\d{7,15}$/),
  observaciones: z.union([z.string().trim().max(500), z.null()]).optional()
});
export default defineEventHandler(async event => {
  const currentUser = await requireUser(event, ['SUPERADMIN', 'ADMIN']);
  const id = positiveId(getRouterParam(event, 'id'));
  const validatedBody = requestSchema.safeParse(await readBody(event));
  if (!validatedBody.success) throw createError({
    statusCode: 422,
    statusMessage: 'Datos médicos básicos inválidos'
  });
  const value = validatedBody.data;
  await db().execute(`INSERT INTO datos_medicos_basicos (alumno_id, alergias, restricciones_fisicas, condicion_emergencia, contacto_emergencia, telefono_emergencia, observaciones, actualizado_por)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE alergias = VALUES(alergias), restricciones_fisicas = VALUES(restricciones_fisicas), condicion_emergencia = VALUES(condicion_emergencia), contacto_emergencia = VALUES(contacto_emergencia), telefono_emergencia = VALUES(telefono_emergencia), observaciones = VALUES(observaciones), actualizado_por = VALUES(actualizado_por)`, [id, value.alergias || null, value.restricciones_fisicas || null, value.condicion_emergencia || null, value.contacto_emergencia, value.telefono_emergencia, value.observaciones || null, currentUser.id]);
  await audit(currentUser.id, 'DATOS_EMERGENCIA_ACTUALIZADOS', `Alumno ${id}`);
  return {
    status: 'success',
    message: 'Información de emergencia actualizada'
  };
});
