import type { DatabaseRow } from '~~/Servidor/Dominio/Modulos/base-de-datos';
import { bearerToken, requireUser } from '~~/Servidor/Seguridad/acceso-modulos';
import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
function maskIp(ip: string | null) {
  if (!ip) return 'unknown';
  if (ip.includes(':')) return `${ip.split(':').slice(0, 3).join(':')}::…`;
  const parts = ip.split('.');
  return parts.length === 4 ? `${parts[0]}.${parts[1]}.x.x` : ip;
}
function device(userAgent: string) {
  const ua = userAgent.toLowerCase();
  return {
    device: /mobile|android|iphone/.test(ua) ? 'Mobile' : /ipad|tablet/.test(ua) ? 'Tablet' : 'Desktop',
    browser: /edg/.test(ua) ? 'Edge' : /firefox/.test(ua) ? 'Firefox' : /chrome/.test(ua) ? 'Chrome' : /safari/.test(ua) ? 'Safari' : 'Unknown',
    os: /windows/.test(ua) ? 'Windows' : /android/.test(ua) ? 'Android' : /iphone|ipad/.test(ua) ? 'iOS' : /mac/.test(ua) ? 'macOS' : /linux/.test(ua) ? 'Linux' : 'Unknown'
  };
}
export default defineEventHandler(async event => {
  const currentUser = await requireUser(event);
  const selector = bearerToken(event)?.split('.', 1)[0];
  const [databaseRows] = await db().execute<DatabaseRow[]>("SELECT id, selector, ip, user_agent, expires_at, creado_en FROM tokens WHERE user_id = ? AND tipo = 'SESSION' AND activo = 1 AND expires_at > NOW() ORDER BY creado_en DESC", [currentUser.id]);
  const sessions = databaseRows.map(row => ({
    id: Number(row.id),
    ip: maskIp(row.ip),
    device: device(String(row.user_agent || '')),
    user_agent_preview: String(row.user_agent || '').slice(0, 100),
    expires_at: row.expires_at,
    creado_en: row.creado_en,
    is_current: row.selector === selector
  }));
  return {
    status: 'success',
    data: {
      sessions,
      count: sessions.length
    }
  };
});
