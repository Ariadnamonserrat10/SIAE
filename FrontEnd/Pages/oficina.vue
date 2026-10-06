<script setup lang="ts">
import {useFetch,createError} from '#imports';
import PanelAcceso from '../Componentes/PanelAcceso.vue';
import type {UsuarioSesion} from '../Servicios/autenticacion';
definePageMeta({middleware:'acceso'});
const {data,error}=await useFetch<{usuario:UsuarioSesion}>('/api/oficina');
if(error.value) throw createError({statusCode:error.value.statusCode||503,statusMessage:'No se pudo cargar tu perfil.'});
</script>
<template><PanelAcceso v-if="data" :usuario="data.usuario" titulo="Panel de oficina" /></template>
