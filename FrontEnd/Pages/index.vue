<template>
  <main class="acceso">
    <span class="orbita orbita-superior" aria-hidden="true"></span>
    <span class="orbita orbita-inferior" aria-hidden="true"></span>
    <section class="acceso-tarjeta" aria-labelledby="titulo-acceso">
      <div class="emblema"><img :src="logoTecnologico" alt="Instituto Tecnológico de Tlaxiaco" width="150" height="168" /></div>
      <p class="institucion">INSTITUTO TECNOLÓGICO DE TLAXIACO</p>
      <h1 id="titulo-acceso">BIENVENIDO</h1>
      <p class="subtitulo">Actividades extraescolares</p>
      <form @submit.prevent="handleLogin" class="formulario-acceso">
        <fieldset class="perfiles" :class="{ 'perfil-monitor': selectedUserType === 'monitor' }">
          <legend class="visually-hidden">Tipo de acceso</legend>
          <button v-for="perfil in [{id:'oficina',nombre:'Oficina',icono:'bi-building'}, {id:'monitor',nombre:'Monitor',icono:'bi-person-badge'}]" :key="perfil.id" type="button" :aria-pressed="selectedUserType === perfil.id" :class="{seleccionado: selectedUserType === perfil.id}" @click="selectUserType(perfil.id)">
            <i class="bi" :class="perfil.icono" aria-hidden="true"></i>{{ perfil.nombre }}
          </button>
        </fieldset>
        <Transition name="aviso"><p v-if="errorMessage" class="error-acceso" role="alert"><i class="bi bi-exclamation-circle" aria-hidden="true"></i><span>{{ errorMessage }}</span></p></Transition>
        <div class="campo">
          <label for="usuario-acceso">Usuario</label>
          <div class="entrada"><i class="bi bi-person" aria-hidden="true"></i><input id="usuario-acceso" v-model="usuario" type="text" placeholder="Ingresa tu usuario" maxlength="8" @input="sanitizeUsuario" required autocomplete="username" autocapitalize="none" :spellcheck="false" /></div>
        </div>
        <div class="campo">
          <label for="clave-acceso">Contraseña</label>
          <div class="entrada"><i class="bi bi-lock" aria-hidden="true"></i><input id="clave-acceso" v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Ingresa tu contraseña" minlength="8" required autocomplete="current-password" /><button type="button" class="mostrar-clave" :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'" :aria-pressed="showPassword" @click="showPassword = !showPassword"><i class="bi" :class="showPassword ? 'bi-eye' : 'bi-eye-slash'" aria-hidden="true"></i></button></div>
        </div>
        <button type="button" class="recuperar" @click="showForgotPassword">¿Olvidaste tu contraseña?</button>
        <button type="submit" class="entrar" :disabled="isLoading"><span>{{ isLoading ? 'Iniciando sesión…' : 'Iniciar sesión' }}</span><i class="bi bi-arrow-right" aria-hidden="true"></i></button>
      </form>
      <p class="pie-acceso">Educación, ciencia y tecnología<br />Progreso día con día</p>
    </section>
    <dialog ref="recuperacion" class="recuperacion-dialogo" aria-labelledby="titulo-recuperacion" aria-describedby="mensaje-recuperacion">
      <div class="simbolo-ayuda"><i class="bi bi-shield-lock" aria-hidden="true"></i></div>
      <h2 id="titulo-recuperacion">Recuperar contraseña</h2>
      <p id="mensaje-recuperacion">Acude al departamento de actividades extraescolares para solicitar la recuperación de tu contraseña.</p>
      <button type="button" class="entrar" autofocus @click="closeForgotModal">Entendido</button>
    </dialog>
  </main>
</template>

<script>
import logoTecnologico from '../img/tecnologico-tlaxiaco.png';
// import { authService } from '../servicios/autenticacion';
export default {
  name: "Login",
  data() {
    return {
      logoTecnologico,
      selectedUserType: "oficina",
      usuario: "",
      password: "",
      showPassword: false,
      errorMessage: "",
      isLoading: false
    };
  },
  methods: {
    selectUserType(type) {
      this.selectedUserType = type;
      this.errorMessage = "";
    },
    showForgotPassword() {
      this.$refs.recuperacion.showModal();
    },
    closeForgotModal() {
      this.$refs.recuperacion.close();
    },
    sanitizeUsuario() {
      this.usuario = String(this.usuario || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 8);
    },
    async handleLogin() {
      this.errorMessage = "";
      this.sanitizeUsuario();
      if (!this.usuario || !this.password) {
        this.errorMessage = "Por favor, completa todos los campos";
        return;
      }
      if (this.usuario.length !== 8) {
        this.errorMessage = "El usuario debe tener exactamente 8 caracteres";
        return;
      }
      if (this.password.length < 8) {
        this.errorMessage = "La contraseña debe tener al menos 8 caracteres";
        return;
      }
      this.isLoading = true;
      try {
        const credentials = {
          usuario: this.usuario,
          password: this.password,
          userType: this.selectedUserType
        };
        this.errorMessage = "Servicio de autenticación no configurado";
        void credentials;
      } catch (error) {
        this.errorMessage = error.response?.data?.message || error.message || "Error al iniciar sesión";
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>

<style scoped src="./InicioSecion.css"></style>
