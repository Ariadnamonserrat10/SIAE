export type Rol = 'SUPERADMIN' | 'ADMIN' | 'MONITOR';
export interface UsuarioPublico { id:number; usuario:string; nombre:string; apellidos:string; rol:Rol; club_asignado:number|null }
export interface UsuarioConClave extends UsuarioPublico { password:string }
// El rol proviene de PostgreSQL, nunca del selector del navegador.
export function normalizarRol(valor:string):Rol|null {
  if(valor === 'OFICINA') return 'ADMIN';
  return ['SUPERADMIN','ADMIN','MONITOR'].includes(valor) ? valor as Rol : null;
}
export function destinoPorRol(rol:Rol){return rol === 'MONITOR' ? '/monitor' : '/oficina';}
