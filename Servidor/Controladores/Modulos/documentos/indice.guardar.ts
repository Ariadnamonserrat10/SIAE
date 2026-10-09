import { createHash, randomBytes } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { transaction } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { audit } from '~~/Servidor/Servicios/Modulos/auditoria';
import { inspectDocument, chooseTemplate } from '~~/Servidor/Servicios/Modulos/documentos-institucionales';
const metadataSchema = z.object({
  tipo: z.enum(['PAGO', 'REPOSICION_CONSTANCIA', 'MATERIAL', 'OTRO']),
  alumno_id: z.coerce.number().int().positive().nullish(),
  club_id: z.coerce.number().int().positive().nullish(),
  periodo_id: z.coerce.number().int().positive().nullish(),
  concepto: z.string().trim().max(255).nullish(),
  monto: z.coerce.number().min(0).max(99999999.99).nullish()
});
export default defineEventHandler(async event => {
  const currentUser = await requireUser(event, ['SUPERADMIN', 'ADMIN']);
  const parts = await readMultipartFormData(event);
  const file = parts?.find(part => part.name === 'archivo' && part.filename);
  if (!file) throw createError({
    statusCode: 400,
    statusMessage: 'Documento requerido'
  });
  if (file.data.length > 5 * 1024 * 1024) throw createError({
    statusCode: 413,
    statusMessage: 'El documento no debe exceder 5 MB'
  });
  const format = await inspectDocument(String(file.filename), String(file.type || ''), file.data);
  if (!format) throw createError({
    statusCode: 415,
    statusMessage: 'Solo se permiten documentos Word .doc o .docx, PDF, JPG o PNG válidos'
  });
  const mime = format.mime;
  const rawMetadata = Object.fromEntries((parts || []).filter(part => part.name && !part.filename).map(part => [part.name!, part.data.toString('utf8') || null]));
  const validatedBody = metadataSchema.safeParse(rawMetadata);
  if (!validatedBody.success) throw createError({
    statusCode: 422,
    statusMessage: 'Datos del documento inválidos'
  });
  const isTemplate = rawMetadata.uso === 'formato';
  const template = chooseTemplate(format.code, rawMetadata.destino);
  if (isTemplate && !template) throw createError({ statusCode: 422,
    statusMessage: 'Puedes conservar el nombre original. Elige dónde usar este archivo: Registro de participantes (003-01), Resultados y firmas (003-03), Evaluación (003-04) o Constancia (003-05). No se cambió el formato vigente.' });
  const value = validatedBody.data;
  if (isTemplate && template) {
    value.tipo = 'OTRO';
    value.concepto = template.prefix + (String(rawMetadata.nombre || '').trim() || String(file.filename)).slice(0, 210);
    value.alumno_id = null;
    value.club_id = null;
    value.periodo_id = null;
    value.monto = null;
  }
  const filename = `${randomBytes(16).toString('hex')}.${format.extension}`;
  const now = new Date();
  const folio = `SIRCE-${now.getUTCFullYear()}-${randomBytes(5).toString('hex').toUpperCase()}`;
  const directory = join(String(useRuntimeConfig().uploadsDir), 'documents');
  await mkdir(directory, {
    recursive: true
  });
  await writeFile(join(directory, filename), file.data, {
    flag: 'wx'
  });
  // No depender del valor por defecto de bases importadas desde la versión anterior.
  let id: number;
  try { id = await transaction(async connection => {
  const [result] = await connection.execute(`INSERT INTO documentos (folio, tipo, alumno_id, club_id, periodo_id, nombre_original, nombre_archivo, mime_type, tamano_bytes, hash_sha256, concepto, monto, creado_por, estado, formato_codigo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVO', ?)`, [folio, value.tipo, value.alumno_id || null, value.club_id || null, value.periodo_id || null, String(file.filename).slice(0, 255), filename, mime, file.data.length, createHash('sha256').update(file.data).digest('hex'), value.concepto || null, value.monto ?? null, currentUser.id, isTemplate ? template?.code : null]);
  const insertedId = Number((result as {
    insertId: number;
  }).insertId);
  if (isTemplate && template) await connection.execute('INSERT INTO app_config (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)', [template.key, String(insertedId)]);
  return insertedId;
  }); } catch (error) { await unlink(join(directory, filename)).catch(() => {}); throw error; }
  await audit(currentUser.id, 'DOCUMENTO_REGISTRADO', `${folio}, tipo ${value.tipo}`);
  setResponseStatus(event, 201);
  return {
    status: 'success',
    data: {
      id,
      folio,
      tipo: value.tipo,
      formato_codigo: isTemplate ? template?.code : null,
      nombre_original: String(file.filename),
      destino: isTemplate ? template?.name : null,
      tamano_bytes: file.data.length
    }
  };
});
