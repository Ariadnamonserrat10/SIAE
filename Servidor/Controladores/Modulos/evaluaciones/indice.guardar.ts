import { z } from 'zod';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { audit } from '~~/Servidor/Servicios/Modulos/auditoria';
import { calculateEvaluation } from '~~/FrontEnd/Servicios/reglas-evaluacion.js';
const score = z.number().int().min(0).max(4);
const schema = z.object({
  alumno_id: z.number().int().positive(),
  criterio_1: score, criterio_2: score, criterio_3: score, criterio_4: score,
  criterio_5: score, criterio_6: score, criterio_7: score,
  observaciones: z.string().trim().max(2000).default('')
});
export default defineEventHandler(async event => {
  const user = await requireUser(event, ['SUPERADMIN', 'ADMIN', 'MONITOR']);
  const parsed = schema.safeParse(await readBody(event));
  if (!parsed.success) throw createError({ statusCode: 422, statusMessage: 'Califica los siete criterios con valores de 0 a 4' });
  const value = parsed.data;
  const [students] = await db().execute<any[]>(`SELECT a.id, a.periodo_id, a.id_club,
    TRIM(CONCAT_WS(' ', a.nombre, a.apellidoP, a.apellidoM)) nombre_estudiante,
    c.nombre nombre_club, p.fecha_inicio FROM alumnos a JOIN clubs c ON c.id=a.id_club
    JOIN periodos p ON p.id=a.periodo_id WHERE a.id=? AND p.estado='ACTIVO'`, [value.alumno_id]);
  const student = students[0];
  if (!student) throw createError({ statusCode: 404, statusMessage: 'Alumno sin inscripción en el periodo activo' });
  if (user.rol === 'MONITOR' && Number(student.id_club) !== Number(user.club_asignado))
    throw createError({ statusCode: 403, statusMessage: 'Solo puedes evaluar alumnos de tu club' });
  const scores = Array.from({ length: 7 }, (_, index) => value[`criterio_${index + 1}` as keyof typeof value] as number);
  const result = calculateEvaluation(scores)!;
  const [templates] = await db().execute<any[]>(`SELECT d.id FROM app_config c JOIN documentos d ON c.valor=CAST(d.id AS TEXT)
    WHERE c.clave='formato_evaluacion_activo' AND d.estado='ACTIVO' AND d.formato_codigo='003-04' AND d.concepto LIKE 'FORMATO_EVALUACION:%'`);
  // El servidor calcula el promedio; nunca acepta un total inventado por el navegador.
  const [saved] = await db().execute<any>(`INSERT INTO evaluaciones
    (alumno_id, periodo_id, escala_version, formato_documento_id, nombre_estudiante, nombre_club, periodo_realizacion,
    criterio_1, criterio_2, criterio_3, criterio_4, criterio_5, criterio_6, criterio_7, observaciones, valor_numerico, nivel_desempeno)
    VALUES (?, ?, 2, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [student.id, student.periodo_id, templates[0]?.id || null, student.nombre_estudiante, student.nombre_club,
      student.fecha_inicio, ...scores, value.observaciones, result.valor_numerico, result.nivel_desempeno]);
  await audit(user.id, 'EVALUACION_CREADA', `Evaluación ${saved.insertId}: alumno ${student.id}`);
  return { status: 'success', id: saved.insertId, data: { ...result, alumno_id: student.id, periodo_id: student.periodo_id } };
});

