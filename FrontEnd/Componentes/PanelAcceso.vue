<script setup lang="ts">
import {ref} from 'vue';
import {navigateTo} from '#imports';
import {autenticacion,type UsuarioSesion} from '../Servicios/autenticacion';
import logo from '../img/tecnologico-tlaxiaco.png';
defineProps<{usuario:UsuarioSesion;titulo:string}>();
const saliendo=ref(false),error=ref('');
async function salir(){
 saliendo.value=true;error.value='';
 try {await autenticacion.cerrar();await navigateTo('/');}
 catch {error.value='No se pudo cerrar la sesión. Intenta nuevamente.';}
 finally {saliendo.value=false;}
}
</script>
<template>
 <main class="panel-acceso">
  <header><div class="identidad"><img :src="logo" alt="Instituto Tecnológico de Tlaxiaco" /><div><strong>SIAE</strong><p>Actividades extraescolares</p></div></div><button class="btn btn-outline-primary" :disabled="saliendo" @click="salir">{{saliendo?'Cerrando sesión…':'Cerrar sesión'}}</button></header>
  <section><span class="perfil">{{usuario.rol==='SUPERADMIN'?'Superadministrador':usuario.rol==='ADMIN'?'Administrador':'Monitor'}}</span><h1>{{titulo}}</h1><p>Bienvenido, {{usuario.nombre}} {{usuario.apellidos}}.</p><p class="estado">Tu sesión está activa.</p><p>Los módulos de esta sección se incorporarán en la siguiente etapa.</p><p v-if="error" role="alert" class="text-danger">{{error}}</p></section>
 </main>
</template>
<style scoped>
.panel-acceso{min-height:100dvh;background:var(--fondo-institucional);padding:clamp(16px,4vw,48px);color:var(--text-dark);}
header{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;max-width:1100px;margin:auto;}
.identidad{display:flex;align-items:center;gap:16px;}.identidad img{width:56px;height:64px;object-fit:contain;}.identidad strong{font-size:1.5rem;}.identidad p{margin:0;color:var(--text-muted);}
section{max-width:1100px;margin:38px auto;padding:clamp(24px,5vw,60px);background:#f8fbff;border:1px solid #fff;border-radius:28px;box-shadow:10px 12px 30px #91a8d033;}
h1{margin:18px 0;font-size:clamp(1.7rem,4vw,2.4rem);}.perfil{display:inline-block;background:var(--brand-soft);color:var(--brand);padding:8px 14px;border-radius:20px;font-weight:600;}.estado{font-weight:600;color:var(--brand);}
</style>
