import type { DatabaseRow } from '~~/Servidor/Dominio/Modulos/base-de-datos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
function normalize(value: string) {
  return value.toLocaleLowerCase('es-MX').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}
function spellingSuggestion(value: string) {
  return value.replace(/([aeiouáéíóúü])\1+/giu, '$1').replace(/(\p{L})\1{2,}/giu, '$1').replace(/\s+/g, ' ').trim();
}
function distance(a: string, b: string) {
  const previous = Array.from({
    length: b.length + 1
  }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min((current[j - 1] ?? j) + 1, (previous[j] ?? j) + 1, (previous[j - 1] ?? j - 1) + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[b.length] ?? Math.max(a.length, b.length);
}
export async function validateClubName(name: string, excludeId?: number) {
  if (/(\p{L})\1\1|([aeiouáéíóúü])\2/iu.test(name)) {
    const suggestion = spellingSuggestion(name);
    throw createError({
      statusCode: 422,
      statusMessage: `“${name}” parece estar escrito incorrectamente. ¿Quiso escribir “${suggestion}”?`
    });
  }
  const [rows] = await db().query<DatabaseRow[]>('SELECT id, nombre FROM clubs');
  const requested = normalize(name);
  const similar = rows.find(row => {
    if (excludeId && Number(row.id) === Number(excludeId)) return false;
    const existing = normalize(String(row.nombre));
    const allowedDistance = Math.max(requested.length, existing.length) >= 8 ? 2 : 1;
    return distance(requested, existing) <= allowedDistance;
  });
  if (similar) {
    throw createError({
      statusCode: 409,
      statusMessage: `Ya existe un club con un nombre igual o muy parecido: “${String(similar.nombre)}”.`
    });
  }
}
