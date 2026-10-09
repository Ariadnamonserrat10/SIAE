import {defineEventHandler} from 'h3';
import {comprobarOrigen} from '../Seguridad/origen';
import {cerrarSesion} from '../Seguridad/sesion';
export default defineEventHandler(async event=>{comprobarOrigen(event);await cerrarSesion(event);return {ok:true};});
