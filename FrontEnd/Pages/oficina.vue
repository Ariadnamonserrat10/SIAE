<script setup lang="ts">
import Panel from '../Vistas/Oficina.vue';
definePageMeta({middleware:'acceso'});
</script>
<template><div class="panel-institucional"><ClientOnly><Panel/><template #fallback><p class="p-4" role="status">Cargando tu panel…</p></template></ClientOnly></div></template>
