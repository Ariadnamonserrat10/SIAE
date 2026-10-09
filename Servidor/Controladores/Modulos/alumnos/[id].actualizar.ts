import { z } from 'zod';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { audit } from '~~/Servidor/Servicios/Modulos/auditoria';
import { positiveId, textPattern, titleCase } from '~~/Servidor/Servicios/Modulos/validacion';
const requestSchema = z.object({
  nombre: z.string().trim().min(1).max(50).optional(),
  apellidoP: z.string().trim().min(1).max(50).optional(),
  apellidoM: z.string().trim().min(1).max(50).optional(),
  numeroControl: z.coerce.string().regex(/^\d{8}$/).optional(),
  telefono: z.coerce.string().regex(/^\d{7,15}$/).optional(),
  carrera_id: z.coerce.number().int().positive().optional(),
  semestre_id: z.coerce.number().int().positive().optional(),
  id_club: z.coerce.number().int().positive().optional()
}).refine(value => Object.keys(value).length > 0);
export default defineEventHandler(async event => {
  const currentUser = await requireUser(event, ['SUPERADMIN', 'ADMIN', 'MONITOR']);
  const id = positiveId(getRouterParam(event, 'id'));
  const validatedBody = requestSchema.safeParse(await readBody(event));
  if (!validatedBody.success) throw createError({
    statusCode: 422,
    statusMessage: 'Datos del alumno inválidos'
  });
  if (currentUser.rol === 'MONITOR' && validatedBody.data.id_club && Number(currentUser.club_asignado) !== validatedBody.data.id_club) throw createError({
    statusCode: 403,
    statusMessage: 'Este club no está asignado al monitor'
  });
  const fields: string[] = [];
  const values: Array<string | number> = [];
  for (const [key, raw] of Object.entries(validatedBody.data)) {
    let value = raw as string | number;
    if (['nombre', 'apellidoP', 'apellidoM'].includes(key)) {
      value = titleCase(String(raw));
      if (!textPattern.test(String(value))) throw createError({
        statusCode: 422,
        statusMessage: `${key} inválido`
      });
    }
    fields.push(`${key} = ?`);
    values.push(value);
  }
  const monitorFilter = currentUser.rol === 'MONITOR' ? ' AND id_club = ?' : '';
  const params = currentUser.rol === 'MONITOR' ? [...values, id, Number(currentUser.club_asignado)] : [...values, id];
  const [result] = await db().execute(`UPDATE alumnos SET ${fields.join(', ')} WHERE id = ?${monitorFilter}`, params);
  if (!(result as {
    affectedRows: number;
  }).affectedRows) throw createError({
    statusCode: 404,
    statusMessage: 'Alumno no encontrado'
  });
  await audit(currentUser.id, 'ALUMNO_ACTUALIZADO', `Alumno ${id}`);
  return {
    status: 'success'
  };
});
