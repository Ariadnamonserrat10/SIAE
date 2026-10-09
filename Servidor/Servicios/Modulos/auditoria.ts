import { db } from '~~/Servidor/Infraestructura/Modulos/conexion';
export async function audit(userId: number, action: string, description?: string) {
  await db().execute('INSERT INTO auditoria (id_usuario, accion, descripcion, fecha) VALUES (?, ?, ?, NOW())', [userId, action, description || null]);
}
