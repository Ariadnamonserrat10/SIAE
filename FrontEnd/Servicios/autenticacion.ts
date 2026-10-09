export interface UsuarioSesion {id:number;usuario:string;nombre:string;apellidos:string;rol:'SUPERADMIN'|'ADMIN'|'MONITOR';club_asignado:number|null}
export const autenticacion={
 iniciar:(datos:{usuario:string;password:string;userType:string})=>$fetch<{usuario:UsuarioSesion}>('/api/autenticacion/iniciar-sesion',{method:'POST',body:datos}),
 cerrar:()=>$fetch('/api/autenticacion/cerrar-sesion',{method:'POST'}),
};
