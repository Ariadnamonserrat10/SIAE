import {requireUser} from '../Seguridad/acceso-modulos';
export default defineEventHandler(async event=>({data:await requireUser(event)}));
