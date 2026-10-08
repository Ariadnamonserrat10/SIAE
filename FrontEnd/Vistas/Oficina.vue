<template>
  <div class="app-container">
    <!-- Mobile Hamburger Toggle -->
    <button 
      class="sidebar-toggle-mobile" 
      @click="sidebarOpen = !sidebarOpen"
      v-if="isMobile"
    >
      <span class="hamburger-line" :class="{ 'active': sidebarOpen }"></span>
      <span class="hamburger-line" :class="{ 'active': sidebarOpen }"></span>
      <span class="hamburger-line" :class="{ 'active': sidebarOpen }"></span>
    </button>

    <!-- Mobile Overlay -->
    <div 
      class="sidebar-overlay" 
      :class="{ 'active': sidebarOpen }"
      @click="sidebarOpen = false"
      v-if="isMobile"
    ></div>

    <!-- Sidebar -->
    <div
      class="sidebar"
      :class="{ 'sidebar-collapsed': sidebarCollapsed, 'sidebar-mobile-open': sidebarOpen, 'sidebar-admin': isAdmin, 'sidebar-superadmin': isSuperAdmin }"
    >
      <div class="sidebar-inner">
        <!-- Logo / App Name -->
        <div class="app-logo-section">
          <div class="app-icon"><img src="../img/tecnologico-tlaxiaco.png" alt="Instituto Tecnológico de Tlaxiaco" class="logo-tecnologico" /></div>
          <span class="app-name" v-if="!sidebarCollapsed">SIAE</span>
          <button 
            type="button"
            class="collapse-btn" 
            @click="sidebarCollapsed = !sidebarCollapsed"
            v-if="!isMobile"
            :aria-label="sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'"
            :title="sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <!-- Profile Section -->
        <div class="profile-section">
          <div class="profile-avatar-wrapper">
            <div class="avatar-glow"></div>
            <template v-if="resolveFotoUrl(usuarioActual.foto) && !usuarioActualImageError">
              <img
                :src="resolveFotoUrl(usuarioActual.foto)"
                alt="Usuario"
                class="profile-avatar"
                @error="handleImageError"
              />
            </template>
            <div v-else class="profile-avatar fallback-avatar">
              <span class="avatar-initials">{{ getUserInitials() }}</span>
            </div>
            <div class="status-indicator online"></div>
          </div>
          <div class="profile-info" v-if="!sidebarCollapsed">
            <span class="profile-name">{{ usuarioActual.nombre }} {{ usuarioActual.apellidoP }}</span>
            <span class="profile-role">
              <span class="role-dot"></span>
              {{ usuarioActual.rol || (usuarioActual.tipo === 'OFICINA' ? 'ADMIN' : usuarioActual.tipo) }}
            </span>
          </div>
        </div>

        <!-- Menu Divider -->
        <div class="menu-divider" v-if="!sidebarCollapsed"></div>

        <!-- Navigation Menu -->
        <nav class="nav-menu" >
         <div class="menu-section menu-section-open">
             <span class="menu-section-title" v-if="!sidebarCollapsed" >Gestión <span class="section-chevron">⌄</span></span>
             
             <a
               v-if="isSuperAdmin"
               class="nav-item" 
               :class="{ 'nav-item-active': currentView === 'Gestion' }"
               @click.prevent="setView('Gestion')"
              role="button" tabindex="0" @keydown.enter.prevent="$event.currentTarget.click()" @keydown.space.prevent="$event.currentTarget.click()">
               <span class="nav-icon">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke-linecap="round"/>
                   <circle cx="9" cy="7" r="4" stroke-linecap="round"/>
                   <path d="M23 21v-2a4 4 0 00-3-3.87" stroke-linecap="round"/>
                   <path d="M16 3.13a4 4 0 010 7.75" stroke-linecap="round"/>
                 </svg>
               </span>
               <span class="nav-label" v-if="!sidebarCollapsed">Usuarios</span>
               <span class="nav-active-indicator" v-if="currentView === 'Gestion' && !sidebarCollapsed"></span>
             </a>

             <a
               v-if="isSuperAdmin || isAdmin"
               class="nav-item" 
               :class="{ 'nav-item-active': currentView === 'Dashboard' }"
               @click.prevent="setView('Dashboard')"
              role="button" tabindex="0" @keydown.enter.prevent="$event.currentTarget.click()" @keydown.space.prevent="$event.currentTarget.click()">
              <span class="nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" stroke-linecap="round"/>
                  <rect x="7" y="3" width="10" height="18" rx="2" stroke="none" fill="currentColor" opacity="0.15"/>
                  <path d="M12 9h.01" stroke-linecap="round"/>
                  <path d="M12 12h.01" stroke-linecap="round"/>
                  <path d="M12 15h.01" stroke-linecap="round"/>
                  <path d="M12 18h.01" stroke-linecap="round"/>
                </svg>
              </span>
              <span class="nav-label" v-if="!sidebarCollapsed">Clubs</span>
              <span class="nav-active-indicator" v-if="currentView === 'Dashboard' && !sidebarCollapsed"></span>
            </a>
          </div>

</nav>

        <!-- Logout Button -->
        <div class="logout-section">
          <button class="logout-btn" @click="cerrarSesion">
            <span class="logout-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke-linecap="round"/>
                <polyline points="16,17 21,12 16,7" stroke-linecap="round"/>
                <line x1="21" y1="12" x2="9" y2="12" stroke-linecap="round"/>
              </svg>
            </span>
            <span class="logout-label" v-if="!sidebarCollapsed">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>

<main class="content flex-grow-1 p-4 bg-light overflow-auto">
 <div v-if="errorMsg" class="alert alert-danger" role="alert">{{errorMsg}}</div>
 <div v-if="toastMsg" class="alert alert-success" role="status">{{toastMsg}}</div>
 <p v-if="cargando" role="status">Cargando…</p>
 <Gestion v-else-if="currentView==='Gestion' && isSuperAdmin" :usuarios="usuarios" :clubs="clubs" @show-error="showError" @show-toast="showToast" @refresh="cargarDatos" />
 <Dashboard v-else-if="!cargando" :clubs="clubs" :alumnos="[]" :usuarios="usuarios" :periodo-activo="null" :usuario-actual="usuarioActual" :total-monitores="totalMonitores" @add-club="handleAddClub" @edit-club="handleEditClub" @delete-club="handleDeleteClub" @refresh="cargarDatos" @show-error="showError" />
 </main></div></template>
<script>
import Gestion from '../Componentes/Gestion.vue';
import Dashboard from '../Componentes/Resumen.vue';
import {getClubs,getUsuarios,createClub,updateClub,deleteClub} from '../Servicios/api';
import {authService} from '../Servicios/sesion-panel';
import {resolveFotoUrl} from '../Servicios/imagenes';
import api from '../Servicios/cliente-http';
export default {
 components:{Gestion,Dashboard},
 data:()=>({usuarioActual:{},usuarioActualImageError:false,currentView:'Dashboard',clubs:[],usuarios:[],totalMonitores:0,cargando:true,errorMsg:'',toastMsg:'',sidebarCollapsed:false,sidebarOpen:false,isMobile:false}),
 computed:{isSuperAdmin(){return this.usuarioActual.rol==='SUPERADMIN'},isAdmin(){return this.usuarioActual.rol==='ADMIN'}},
 methods:{
 resolveFotoUrl,
 getUserInitials(){return (this.usuarioActual.nombre||'U').split(' ').slice(0,2).map(n=>n[0]).join('')},
 handleImageError(){this.usuarioActualImageError=true},
 checkMobile(){this.isMobile=window.innerWidth<=900;if(!this.isMobile)this.sidebarOpen=false},
 setView(view){if(!['Gestion','Dashboard'].includes(view)||view==='Gestion'&&!this.isSuperAdmin)return;this.currentView=view;this.sidebarOpen=false;this.errorMsg='';this.toastMsg=''},
 showError(message){this.errorMsg=message;this.toastMsg=''},showToast(message){this.toastMsg=message;this.errorMsg=''},
 async cerrarSesion(){try{await authService.logout();await this.$router.push('/')}catch{this.showError('No se pudo cerrar la sesión. Intenta nuevamente.')}},
 async cargarDatos(){try{const rows=await getClubs();this.clubs=rows.map(r=>({...r,id:Number(r.id),cupo:Number(r.cupo_limite),ocupados:Number(r.cupo_ocupado||0)}));if(this.isSuperAdmin)this.usuarios=await getUsuarios();this.totalMonitores=(await api.get('/resumen')).data.monitores;}catch(e){this.showError(e.message||'No se pudieron cargar los datos.')}},
 async handleAddClub(club){try{await createClub({...club,cupo_limite:Number(club.cupo)});await this.cargarDatos();this.showToast('Club creado correctamente.')}catch(e){this.showError(e.message)}},
 async handleEditClub({id,club}){try{await updateClub(id,{...club,cupo_limite:Number(club.cupo)});await this.cargarDatos();this.showToast('Club actualizado.')}catch(e){this.showError(e.message)}},
 async handleDeleteClub(id){try{await deleteClub(id);await this.cargarDatos();this.showToast('Club eliminado.')}catch(e){this.showError(e.message)}}
 },
 async mounted(){this.checkMobile();window.addEventListener('resize',this.checkMobile);try{this.usuarioActual=await authService.getCurrentUser();await this.cargarDatos()}catch(e){this.showError(e.message)}finally{this.cargando=false}},
 beforeUnmount(){window.removeEventListener('resize',this.checkMobile)}
};
</script><style scoped src="./Oficina.css"></style>