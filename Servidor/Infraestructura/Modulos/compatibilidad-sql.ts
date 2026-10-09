// Conserva las consultas heredadas mientras PostgreSQL sigue siendo la única base de la aplicación.
const camelKeys: Record<string, string> = {
  apellidop: 'apellidoP',
  apellidom: 'apellidoM',
  numerocontrol: 'numeroControl'
};
const conflictColumns: Record<string, string[]> = {
  app_config: ['clave'],
  asistencias: ['id_alumno', 'fecha'],
  datos_medicos_basicos: ['alumno_id'],
  filtros_cerrados: ['periodo_id', 'tipo'],
  rol_permiso: ['rol_id', 'permiso_id'],
  usuario_club: ['usuario_id', 'club_id']
};
const tablesWithoutId = new Set(['app_config', 'datos_medicos_basicos', 'rol_permiso']);
export function normalizeRows(rows: Record<string, unknown>[]) {
  return rows.map(row => {
    const normalized: Record<string, unknown> = {
      ...row
    };
    for (const [key, replacement] of Object.entries(camelKeys)) {
      if (key in normalized) {
        normalized[replacement] = normalized[key];
        delete normalized[key];
      }
    }
    return normalized;
  });
}
function placeholders(sql: string) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}
export function normalizeSql(source: string) {
  let sql = source.replace(/DATE_FORMAT\(([^,]+),\s*'%Y-%m-%d'\)/gi, "TO_CHAR($1, 'YYYY-MM-DD')").replace(/CURDATE\(\)/gi, 'CURRENT_DATE').replace(/\bVALUES\(([^)]+)\)/gi, 'EXCLUDED.$1').replace(/`([^`]+)`/g, '"$1"');
  const duplicate = sql.match(/^\s*INSERT\s+INTO\s+([A-Za-z_][\w]*)[\s\S]*?\s+ON\s+DUPLICATE\s+KEY\s+UPDATE\s+/i);
  if (duplicate) {
    const table = duplicate[1]!.toLowerCase();
    const targets = conflictColumns[table];
    if (!targets) throw new Error(`Falta definir la llave de conflicto PostgreSQL para ${table}`);
    sql = sql.replace(/\s+ON\s+DUPLICATE\s+KEY\s+UPDATE\s+/i, ` ON CONFLICT (${targets.join(', ')}) DO UPDATE SET `);
  }
  const insert = sql.match(/^\s*INSERT\s+INTO\s+([A-Za-z_][\w]*)/i);
  if (insert && !tablesWithoutId.has(insert[1]!.toLowerCase()) && !/\bRETURNING\b/i.test(sql)) {
    sql = `${sql.trim().replace(/;$/, '')} RETURNING id`;
  }
  return placeholders(sql);
}
export function normalizeError(error: any) {
  if (error?.code === '23505') error.code = 'ER_DUP_ENTRY';
  return error;
}
