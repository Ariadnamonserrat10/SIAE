import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
import { templateTypes } from '~~/Servidor/Servicios/Modulos/documentos-institucionales';
export default defineEventHandler(async event => {
  await requireUser(event, ['SUPERADMIN', 'ADMIN', 'MONITOR']);
  const [rows] = await db().execute<any[]>(`SELECT d.id, d.nombre_original, d.concepto, d.formato_codigo, c.clave
    FROM app_config c JOIN documentos d ON CAST(d.id AS TEXT)=c.valor
    WHERE c.clave IN ('formato_registro_activo', 'formato_evaluacion_activo', 'formato_resultados_activo', 'formato_constancia_activo') AND d.estado='ACTIVO'`);
  return { status: 'success', data: Object.entries(templateTypes).map(([codigo, type]) => ({
    codigo, clave: type.key, nombre: type.name, documento: rows.find(row => row.formato_codigo === codigo && row.clave === type.key && row.concepto?.startsWith(type.prefix)) || null
  })) };
});
