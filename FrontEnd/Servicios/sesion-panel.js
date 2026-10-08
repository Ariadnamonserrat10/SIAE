import {shallowRef} from 'vue';
const perfil=shallowRef(null);
export const authService={
 getUserData:()=>perfil.value,getUserId:()=>perfil.value?.id,getToken:()=>null,getCsrfToken:()=>null,
 clearAuth:()=>{perfil.value=null},
 async getCurrentUser(){const result=await $fetch('/api/perfil');perfil.value=result.data;return perfil.value},
 async logout(){await $fetch('/api/autenticacion/cerrar-sesion',{method:'POST'});perfil.value=null},
};
export default authService;
