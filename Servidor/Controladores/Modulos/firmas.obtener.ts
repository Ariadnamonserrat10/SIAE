import type { DatabaseRow } from '~~/Servidor/Dominio/Modulos/base-de-datos';
import { requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
export default defineEventHandler(async event => {
  await requireUser(event);
  const periodId = Number(getQuery(event).periodo_id || 0);
  const source = periodId > 0 ? 'historial_configuracion' : 'app_config';
  const condition = periodId > 0 ? ' AND periodo_id = ?' : '';
  const params = periodId > 0 ? [periodId] : [];
  const [databaseRows] = await db().execute<DatabaseRow[]>(`SELECT clave, valor FROM ${source} WHERE clave IN ('firma_jefe_actividades', 'firma_jefe_promocion', 'firma_jefa_servicios')${condition}`, params);
  const values = Object.fromEntries(databaseRows.map(row => [row.clave, row.valor]));
  const ids = ['firma_jefe_actividades', 'firma_jefe_promocion'].map(key => Number(values[key])).filter(Number.isInteger);
  const users = new Map<number, DatabaseRow>();
  if (ids.length) {
    const [found] = await db().execute<DatabaseRow[]>(`SELECT id, TRIM(CONCAT_WS(' ', nombre, apellidoP, apellidoM)) nombre FROM usuarios WHERE id IN (${ids.map(() => '?').join(',')})`, ids);
    for (const row of found) users.set(Number(row.id), row);
  }
  const resolve = (key: string) => {
    const raw = values[key];
    const found = users.get(Number(raw));
    return found ? {
      id: Number(found.id),
      nombre: found.nombre
    } : raw ? {
      id: null,
      nombre: String(raw)
    } : null;
  };
  return {
    jefe_actividades: resolve('firma_jefe_actividades'),
    jefe_promocion: resolve('firma_jefe_promocion'),
    jefa_servicios: resolve('firma_jefa_servicios')
  };
});
