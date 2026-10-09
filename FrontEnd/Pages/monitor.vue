<script setup lang="ts">
import PanelAcceso from '../Componentes/PanelAcceso.vue';
import type {UsuarioSesion} from '../Servicios/autenticacion';
definePageMeta({middleware:'acceso'});
const {data}=await useFetch<{usuario:UsuarioSesion}>('/api/monitor');
</script><template><PanelAcceso v-if="data" :usuario="data.usuario" titulo="Acceso de Monitor"/></template>