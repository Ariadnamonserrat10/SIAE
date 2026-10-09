import { z } from 'zod';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { audit } from '~~/Servidor/Servicios/Modulos/auditoria';
import { positiveId, textPattern, titleCase } from '~~/Servidor/Servicios/Modulos/validacion';
import { validateClubName } from '~~/Servidor/Servicios/Modulos/nombre-club';
const requestSchema = z.object({
  nombre: z.string().trim().min(1).max(100).optional(),
  tipo: z.enum(['CULTURAL', 'DEPORTIVO']).optional(),
  descripcion: z.string().trim().min(1).max(255).optional(),
  cupo_limite: z.coerce.number().int().min(1).max(50).optional(),
  id_responsable: z.union([z.coerce.number().int().positive(), z.null(), z.literal('')]).optional()
}).refine(value => Object.keys(value).length > 0);
export default defineEventHandler(async event => {
  const currentUser = await requireUser(event, ['SUPERADMIN']);
  const id = positiveId(getRouterParam(event, 'id'));
  const validatedBody = requestSchema.safeParse(await readBody(event));
  if (!validatedBody.success) throw createError({
    statusCode: 422,
    statusMessage: 'Datos del club inválidos'
  });
  if (validatedBody.data.nombre) await validateClubName(titleCase(validatedBody.data.nombre), id);
  if (validatedBody.data.nombre) {
    const [existing] = await db().execute<any[]>('SELECT id FROM clubs WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(?)) AND id <> ? LIMIT 1', [validatedBody.data.nombre, id]);
    if (existing.length) throw createError({
      statusCode: 409,
      statusMessage: 'Ya existe otro club con ese nombre'
    });
  }
  const fields: string[] = [];
  const values: Array<string | number | null> = [];
  for (const [key, raw] of Object.entries(validatedBody.data)) {
    let value: string | number | null = raw as string | number | null;
    if (key === 'nombre' || key === 'descripcion') {
      value = titleCase(String(raw));
      if (!textPattern.test(String(value))) throw createError({
        statusCode: 422,
        statusMessage: `${key} solo debe contener texto`
      });
    }
    if (key === 'id_responsable' && value === '') value = null;
    fields.push(`${key} = ?`);
    values.push(value);
  }
  let result: any;
  try {
    ;
    [result] = await db().execute(`UPDATE clubs SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') throw createError({
      statusCode: 409,
      statusMessage: 'Ya existe otro club con ese nombre'
    });
    throw error;
  }
  if (!(result as {
    affectedRows: number;
  }).affectedRows) throw createError({
    statusCode: 404,
    statusMessage: 'Club no encontrado'
  });
  await audit(currentUser.id, 'CLUB_ACTUALIZADO', `Club ${id}`);
  return {
    status: 'success',
    data: {
      id,
      ...validatedBody.data
    }
  };
});
