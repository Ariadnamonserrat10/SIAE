import { z } from 'zod';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { audit } from '~~/Servidor/Servicios/Modulos/auditoria';
import { textPattern, titleCase } from '~~/Servidor/Servicios/Modulos/validacion';
import { validateClubName } from '~~/Servidor/Servicios/Modulos/nombre-club';
const requestSchema = z.object({
  nombre: z.string().trim().min(1).max(100),
  tipo: z.enum(['CULTURAL', 'DEPORTIVO']).default('CULTURAL'),
  descripcion: z.string().trim().min(1).max(255),
  cupo_limite: z.coerce.number().int().min(1).max(50),
  id_responsable: z.union([z.coerce.number().int().positive(), z.null()]).optional()
});
export default defineEventHandler(async event => {
  const currentUser = await requireUser(event, ['SUPERADMIN']);
  const validatedBody = requestSchema.safeParse(await readBody(event));
  if (!validatedBody.success) throw createError({
    statusCode: 422,
    statusMessage: 'Datos del club inválidos',
    data: validatedBody.error.issues
  });
  const data = {
    ...validatedBody.data,
    nombre: titleCase(validatedBody.data.nombre),
    descripcion: titleCase(validatedBody.data.descripcion)
  };
  if (!textPattern.test(data.nombre) || !textPattern.test(data.descripcion)) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Nombre y descripción solo deben contener texto'
    });
  }
  await validateClubName(data.nombre);
  const [existing] = await db().execute<any[]>('SELECT id FROM clubs WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(?)) LIMIT 1', [data.nombre]);
  if (existing.length) throw createError({
    statusCode: 409,
    statusMessage: 'Ya existe un club con ese nombre'
  });
  let result: any;
  try {
    ;
    [result] = await db().execute('INSERT INTO clubs (nombre, tipo, descripcion, cupo_limite, id_responsable) VALUES (?, ?, ?, ?, ?)', [data.nombre, data.tipo, data.descripcion, data.cupo_limite, data.id_responsable ?? null]);
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') throw createError({
      statusCode: 409,
      statusMessage: 'Ya existe un club con ese nombre'
    });
    throw error;
  }
  const id = Number((result as {
    insertId: number;
  }).insertId);
  await audit(currentUser.id, 'CLUB_CREADO', `Club ${id}: ${data.nombre}`);
  setResponseStatus(event, 201);
  return {
    data: {
      id,
      ...data
    }
  };
});
