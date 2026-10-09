import {defineEventHandler} from 'h3';
import {exigirUsuario} from '../Seguridad/sesion';
export default defineEventHandler(async event=>({usuario:await exigirUsuario(event)}));
