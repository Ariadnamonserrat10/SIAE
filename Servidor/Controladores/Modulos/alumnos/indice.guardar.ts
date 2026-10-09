import { z } from 'zod';
import type { DatabaseRow } from '~~/Servidor/Dominio/Modulos/base-de-datos';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { audit } from '~~/Servidor/Servicios/Modulos/auditoria';
import { textPattern, titleCase } from '~~/Servidor/Servicios/Modulos/validacion';
const requestSchema = z.object({
  nombre: z.string().trim().min(1).max(50),
  apellidoP: z.string().trim().min(1).max(50),
  apellidoM: z.string().trim().max(50),
  numeroControl: z.coerce.string().transform(value => value.replace(/\D/g, '')).pipe(z.string().regex(/^\d{8}$/)),
  telefono: z.coerce.string().transform(value => value.replace(/\D/g, '')).pipe(z.string().regex(/^\d{7,15}$/)),
  carrera_id: z.coerce.number().int().positive(),
  semestre_id: z.coerce.number().int().positive(),
  id_club: z.coerce.number().int().positive(),
  opcion_1: z.string().trim().max(100).optional(),
  opcion_2: z.string().trim().max(100).optional(),
  opcion_3: z.string().trim().max(100).optional()
});
export default defineEventHandler(async event => {
  const currentUser = await requireUser(event, ['SUPERADMIN', 'ADMIN', 'MONITOR']);
  const validatedBody = requestSchema.safeParse(await readBody(event));
  if (!validatedBody.success) throw createError({
    statusCode: 422,
    statusMessage: 'Datos del alumno inválidos'
  });
  if (currentUser.rol === 'MONITOR' && Number(currentUser.club_asignado) !== validatedBody.data.id_club) throw createError({
    statusCode: 403,
    statusMessage: 'Este club no está asignado al monitor'
  });
  const names = [validatedBody.data.nombre, validatedBody.data.apellidoP, validatedBody.data.apellidoM].map(titleCase);
  const [nombre = '', apellidoP = '', apellidoM = ''] = names;
  if (!textPattern.test(nombre) || !textPattern.test(apellidoP) || apellidoM && !textPattern.test(apellidoM)) throw createError({
    statusCode: 422,
    statusMessage: 'Los nombres solo deben contener letras'
  });
  const [periods] = await db().query<DatabaseRow[]>("SELECT id FROM periodos WHERE estado = 'ACTIVO' ORDER BY id DESC LIMIT 1");
  if (!periods[0]) throw createError({
    statusCode: 403,
    statusMessage: 'No hay periodo activo'
  });
  try {
    const [result] = await db().execute(`INSERT INTO alumnos (nombre, apellidoP, apellidoM, numeroControl, telefono, carrera_id, semestre_id, id_club, periodo_id, estado_periodo, opcion_1, opcion_2, opcion_3)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVO', ?, ?, ?)`, [nombre, apellidoP, apellidoM, validatedBody.data.numeroControl, validatedBody.data.telefono, validatedBody.data.carrera_id, validatedBody.data.semestre_id, validatedBody.data.id_club, periods[0].id, validatedBody.data.opcion_1 || null, validatedBody.data.opcion_2 || null, validatedBody.data.opcion_3 || null]);
    const id = Number((result as {
      insertId: number;
    }).insertId);
    await audit(currentUser.id, 'ALUMNO_CREADO', `Alumno ${id}, control ${validatedBody.data.numeroControl}`);
    setResponseStatus(event, 201);
    return {
      status: 'success',
      data: {
        id,
        ...validatedBody.data,
        nombre,
        apellidoP,
        apellidoM
      }
    };
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') throw createError({
      statusCode: 409,
      statusMessage: 'El número de control ya está registrado en el periodo activo'
    });
    throw error;
  }
});
