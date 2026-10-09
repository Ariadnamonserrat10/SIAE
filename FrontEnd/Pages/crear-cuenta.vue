<script setup lang="ts">
import CrearCuenta from '../Vistas/CrearCuenta.vue';
definePageMeta({middleware:'acceso'});
</script>
<template><div class="panel-institucional"><ClientOnly><CrearCuenta/></ClientOnly></div></template>
