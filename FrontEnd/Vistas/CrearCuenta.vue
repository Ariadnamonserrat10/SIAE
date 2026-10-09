<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { getCarreras, uploadFoto } from "../Servicios/api";
import { BACKEND } from "../Servicios/direccion-servidor";
const router = useRouter();
const clubs = ref([]);
const selectedClubId = ref(null);
const userType = ref("oficina");
const showSuccessModal = ref(false);
const alertError = ref("");
const alertInfo = ref(true);
const registeredUser = ref(null);
const isLoading = ref(false);
const isPageVisible = ref(true);
const isExiting = ref(false);
const currentStep = ref(1);
const totalSteps = computed(() => userType.value === "oficina" ? 3 : 4);
const form = ref({
  nombre: "",
  apellidoP: "",
  apellidoM: "",
  numeroControl: "",
  telefono: "",
  carrera: "",
  semestre: "",
  usuario: "",
  password: "",
  confirmPassword: "",
  foto: null
});
const fotoPreview = ref(null);
const fotoFile = ref(null);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const generatedPassword = ref(null);
const carreras = ref([]);
const carrerasFallback = [{
  id: 1,
  nombre: 'Ingeniería Civil'
}, {
  id: 2,
  nombre: 'Ingeniería Industrial'
}, {
  id: 3,
  nombre: 'Ingeniería en Sistemas Computacionales'
}, {
  id: 4,
  nombre: 'Ingeniería en Gestión Empresarial'
}, {
  id: 5,
  nombre: 'Licenciatura en Administración'
}, {
  id: 6,
  nombre: 'Licenciatura en Arquitectura'
}, {
  id: 7,
  nombre: 'Ingeniería en Mecatrónica'
}];
const passwordChecked = ref(false);
const passwordCheckOk = ref(false);
const passwordCheckMsg = ref('');
const meetsPolicy = pwd => {
  const hasLen8 = pwd.length === 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasDigit = /\d/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  return {
    ok: hasLen8 && hasUpper && hasLower && hasDigit && hasSpecial,
    hasLen8,
    hasUpper,
    hasLower,
    hasDigit,
    hasSpecial
  };
};
const passwordReqs = computed(() => {
  const pwd = form.value.password || '';
  const res = meetsPolicy(pwd);
  return [{
    label: 'Exactamente 8 caracteres',
    valid: res.hasLen8,
    key: 'len'
  }, {
    label: 'Al menos 1 mayúscula',
    valid: res.hasUpper,
    key: 'upper'
  }, {
    label: 'Al menos 1 minúscula',
    valid: res.hasLower,
    key: 'lower'
  }, {
    label: 'Al menos 1 número',
    valid: res.hasDigit,
    key: 'digit'
  }, {
    label: 'Al menos 1 carácter especial',
    valid: res.hasSpecial,
    key: 'special'
  }];
});
const checkPassword = () => {
  const res = meetsPolicy(form.value.password || '');
  passwordChecked.value = true;
  passwordCheckOk.value = res.ok;
  if (res.ok) {
    passwordCheckMsg.value = 'La contraseña cumple con todos los requisitos.';
  } else {
    passwordCheckMsg.value = 'La contraseña no cumple con los requisitos de seguridad.';
  }
};
const onPasswordInput = () => {
  generatedPassword.value = null;
  passwordChecked.value = false;
  passwordCheckOk.value = false;
  passwordCheckMsg.value = '';
};
const generatePassword = (length = 8) => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*';
  const all = upper + lower + digits + special;
  let pwd = '';
  const pick = set => set[Math.floor(Math.random() * set.length)];
  pwd += pick(upper);
  pwd += pick(lower);
  pwd += pick(digits);
  pwd += pick(special);
  const remaining = Math.max(0, length - pwd.length);
  if (window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(remaining);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < remaining; i++) {
      pwd += all[array[i] % all.length];
    }
  } else {
    for (let i = 0; i < remaining; i++) {
      pwd += all[Math.floor(Math.random() * all.length)];
    }
  }
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
};
const fillWithGenerated = () => {
  const pwd = generatePassword(8);
  form.value.password = pwd;
  form.value.confirmPassword = pwd;
  generatedPassword.value = pwd;
  showPassword.value = true;
  passwordChecked.value = true;
  passwordCheckOk.value = true;
  passwordCheckMsg.value = 'Contraseña generada cumple los requisitos.';
};
const selectUserType = type => {
  userType.value = type;
  alertInfo.value = type === "oficina";
  alertError.value = "";
  currentStep.value = 1;
};
const handleImageUpload = event => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 2 * 1024 * 1024) {
      alertError.value = "La imagen no debe exceder 2MB";
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alertError.value = "Solo se permiten imágenes JPG, PNG o WebP";
      return;
    }
    fotoFile.value = file;
    if (fotoPreview.value && fotoPreview.value.startsWith("blob:")) {
      URL.revokeObjectURL(fotoPreview.value);
    }
    fotoPreview.value = URL.createObjectURL(file);
  }
};
const resolveFotoUrl = foto => {
  if (!foto || typeof foto !== "string") return "";
  if (foto.startsWith("blob:")) return "";
  if (/^https?:\/\//i.test(foto)) return foto;
  const path = foto.startsWith("/") ? foto.slice(1) : foto;
  return `${BACKEND}/${path}`;
};
const normalizarTexto = valor => {
  const limpio = String(valor || '').replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, '').replace(/\s+/g, ' ').trim();
  return limpio.split(' ').map(p => p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : '').join(' ').trim();
};
const soloNumeros = valor => String(valor || '').replace(/\D/g, '');
const soloUsuarioAlnum8 = valor => String(valor || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 8);
const usuarioPolicy = valor => {
  const v = String(valor || '');
  return {
    onlyAlnum: /^[A-Za-z0-9]*$/.test(v),
    len8: v.length === 8,
    hasLetterAndDigit: /[A-Za-z]/.test(v) && /\d/.test(v)
  };
};
const usuarioValid = computed(() => {
  const up = usuarioPolicy(form.value.usuario);
  return up.onlyAlnum && up.len8 && up.hasLetterAndDigit;
});
const passwordsMatch = computed(() => {
  return form.value.password && form.value.password === form.value.confirmPassword;
});
const canProceedToStep2 = computed(() => {
  if (userType.value === 'oficina') {
    return form.value.nombre && form.value.apellidoP && form.value.apellidoM;
  }
  return form.value.nombre && form.value.apellidoP && form.value.apellidoM && form.value.numeroControl && form.value.telefono && form.value.carrera && form.value.semestre;
});
const canProceedToStep3 = computed(() => {
  return usuarioValid.value && form.value.password && passwordsMatch.value && meetsPolicy(form.value.password).ok;
});
const nextStep = () => {
  alertError.value = "";
  if (currentStep.value === 1) {
    if (!canProceedToStep2.value) {
      alertError.value = "Por favor completa todos los campos requeridos";
      return;
    }
    currentStep.value = 2;
  } else if (currentStep.value === 2) {
    if (!canProceedToStep3.value) {
      alertError.value = "Por favor completa los campos de acceso correctamente";
      return;
    }
    currentStep.value = 3;
  }
};
const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
    alertError.value = "";
  }
};
const obtenerClubs = async () => {
  try {
    const res = await axios.get(`${BACKEND}/clubs`, {
      headers: {
        'X-Requested-With': 'SIAE'
      }
    });
    clubs.value = res.data.data;
  } catch (err) {
    // Silencioso en producción
  }
};
const copyToClipboard = async text => {
  if (!text) return;
  try {
    if (window.navigator && window.navigator.clipboard) {
      await window.navigator.clipboard.writeText(text);
      alert("Contraseña copiada al portapapeles");
    }
  } catch (err) {
    // Silencioso en producción
  }
};
const handleRegister = async () => {
  alertError.value = "";
  form.value.nombre = normalizarTexto(form.value.nombre);
  form.value.apellidoP = normalizarTexto(form.value.apellidoP);
  form.value.apellidoM = normalizarTexto(form.value.apellidoM);
  form.value.numeroControl = soloNumeros(form.value.numeroControl);
  form.value.telefono = soloNumeros(form.value.telefono);
  form.value.usuario = soloUsuarioAlnum8(form.value.usuario);
  const up = usuarioPolicy(form.value.usuario);
  if (!(up.onlyAlnum && up.len8 && up.hasLetterAndDigit)) {
    alertError.value = "El usuario debe ser alfanumérico, combinar letras y números, y tener exactamente 8 caracteres";
    return;
  }
  if (form.value.password !== form.value.confirmPassword) {
    alertError.value = "Las contraseñas no coinciden";
    return;
  }
  const passwordPolicy = meetsPolicy(form.value.password || '');
  if (!passwordPolicy.ok) {
    alertError.value = "La contraseña debe tener exactamente 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial";
    return;
  }
  if (userType.value === "monitor") {
    if (!form.value.numeroControl || !form.value.carrera || !form.value.semestre || !form.value.telefono) {
      alertError.value = "Completa todos los campos requeridos para Monitor";
      return;
    }
  }
  isLoading.value = true;
  try {
    let fotoPath = null;
    if (fotoFile.value) {
      const up = await uploadFoto(fotoFile.value);
      fotoPath = up?.file || null;
    }
    const payload = {
      ...form.value,
      foto: fotoPath,
      tipo: userType.value === "oficina" ? "OFICINA" : "MONITOR",
      club_asignado: selectedClubId.value ? Number(selectedClubId.value) : null
    };
    const response = await axios.post(`${BACKEND}/usuarios`, payload, {
      headers: {
        'X-Requested-With': 'SIAE'
      }
    });
    if (response.data.status === "success") {
      registeredUser.value = {
        nombre: `${form.value.nombre} ${form.value.apellidoP} ${form.value.apellidoM}`,
        tipo: userType.value.toUpperCase(),
        usuario: form.value.usuario,
        numeroControl: form.value.numeroControl || "N/A",
        carrera: form.value.carrera || "N/A",
        telefono: form.value.telefono || "N/A",
        foto: fotoPath
      };
      showSuccessModal.value = true;
      currentStep.value = 1;
    } else {
      const details = Array.isArray(response.data?.details) ? response.data.details.filter(Boolean).join('. ') : '';
      alertError.value = details || response.data.message || "Error al registrar el usuario.";
    }
  } catch (error) {
    if (error.response) {
      const details = Array.isArray(error.response.data?.details) ? error.response.data.details.filter(Boolean).join('. ') : '';
      alertError.value = details || error.response.data?.message || error.response.data?.error || `Error del servidor: ${error.response.status}`;
    } else {
      alertError.value = "No hubo respuesta del servidor.";
    }
  } finally {
    isLoading.value = false;
  }
};
const resetForm = () => {
  form.value = {
    nombre: "",
    apellidoP: "",
    apellidoM: "",
    numeroControl: "",
    telefono: "",
    carrera: "",
    semestre: "",
    usuario: "",
    password: "",
    confirmPassword: "",
    foto: null
  };
  fotoFile.value = null;
  if (fotoPreview.value && fotoPreview.value.startsWith("blob:")) {
    URL.revokeObjectURL(fotoPreview.value);
  }
  fotoPreview.value = null;
  userType.value = "oficina";
  alertError.value = "";
  alertInfo.value = true;
  generatedPassword.value = null;
  showPassword.value = false;
  showConfirmPassword.value = false;
  passwordChecked.value = false;
  passwordCheckOk.value = false;
  passwordCheckMsg.value = '';
  currentStep.value = 1;
};
const closeModalAndReset = () => {
  showSuccessModal.value = false;
  resetForm();
};
const goToLogin = () => {
  showSuccessModal.value = false;
  isExiting.value = true;
  setTimeout(() => {
    router.push("/oficina");
  }, 300);
};
const navigateToLogin = () => {
  isExiting.value = true;
  setTimeout(() => {
    router.push("/oficina");
  }, 300);
};
onMounted(async () => {
  obtenerClubs();
  try {
    const list = await getCarreras();
    if (Array.isArray(list) && list.length > 0) {
      carreras.value = list;
      return;
    }
  } catch (err) {
    // Silencioso en producción
  }
  if (carreras.value.length === 0) {
    carreras.value = carrerasFallback;
  }
  setTimeout(() => {
    isPageVisible.value = true;
  }, 50);
});
</script>

<template>
  <div class="register-page" :class="{ 'page-exiting': isExiting, 'page-visible': isPageVisible }">
    <div class="page-bg">
      <div class="bg-gradient"></div>
      <div class="bg-orbs">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </div>
    </div>

    <div class="register-shell">
      <div class="main-workspace">
        
        <div class="workspace-header">
          <div class="header-left">
            <div class="logo-mark"><img src="../img/tecnologico-tlaxiaco.png" alt="Instituto Tecnológico de Tlaxiaco" style="width:100%;height:100%;object-fit:contain" /></div>
            <div class="header-text">
              <h1 class="header-title">Registro de Usuario</h1>
              <p class="header-subtitle">SIAE · Instituto Tecnológico de Tlaxiaco</p>
            </div>
          </div>

          <div class="step-navigation">
            <div class="step-track">
              <div 
                v-for="n in 3" 
                :key="n"
                class="step-dot-wrapper"
              >
                <div 
                  class="step-dot"
                  :class="{ 
                    'step-current': currentStep === n, 
                    'step-done': currentStep > n 
                  }"
                >
                  <span v-if="currentStep <= n" class="dot-number">{{ n }}</span>
                  <svg v-else class="dot-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <span class="step-label-mini">{{ ['Datos', 'Acceso', 'Confirmar'][n-1] }}</span>
              </div>
              <div class="connector-lines">
                <div 
                  class="connector"
                  :class="{ 'connector-filled': currentStep > 1 }"
                ></div>
                <div 
                  class="connector"
                  :class="{ 'connector-filled': currentStep > 2 }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="workspace-divider"></div>

        <div class="workspace-content">
          
          <div class="type-selector-section">
            <div 
              class="type-card"
              :class="{ 'type-active': userType === 'oficina' }"
              @click="selectUserType('oficina')"
            >
              <div class="type-icon-wrap" :class="{ 'icon-active': userType === 'oficina' }">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75">
                  <rect x="3" y="2" width="14" height="16" rx="2"/>
                  <line x1="6" y1="6" x2="7" y2="6"/>
                  <line x1="9" y1="6" x2="10" y2="6"/>
                  <line x1="12" y1="6" x2="13" y2="6"/>
                  <line x1="6" y1="9" x2="7" y2="9"/>
                  <line x1="9" y1="9" x2="10" y2="9"/>
                  <line x1="12" y1="9" x2="13" y2="9"/>
                  <line x1="6" y1="12" x2="7" y2="12"/>
                  <line x1="9" y1="12" x2="10" y2="12"/>
                  <line x1="12" y1="12" x2="13" y2="12"/>
                </svg>
              </div>
              <div class="type-info-wrap">
                <span class="type-name">Oficina</span>
                <span class="type-desc">Administración general</span>
              </div>
              <div class="type-radio" :class="{ 'radio-checked': userType === 'oficina' }">
                <div class="radio-dot"></div>
              </div>
            </div>

            <div 
              class="type-card"
              :class="{ 'type-active': userType === 'monitor' }"
              @click="selectUserType('monitor')"
            >
              <div class="type-icon-wrap" :class="{ 'icon-active': userType === 'monitor' }">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75">
                  <circle cx="10" cy="6" r="3"/>
                  <path d="M3 17C3 13.134 6.13401 10 10 10C13.866 10 17 13.134 17 17" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="type-info-wrap">
                <span class="type-name">Monitor</span>
                <span class="type-desc">Control de clubs y asistencias</span>
              </div>
              <div class="type-radio" :class="{ 'radio-checked': userType === 'monitor' }">
                <div class="radio-dot"></div>
              </div>
            </div>
          </div>

          <transition name="info-expand">
            <div v-if="alertInfo" class="info-banner">
              <div class="banner-icon-wrap">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="10" cy="10" r="8"/>
                  <line x1="10" y1="14" x2="10" y2="10"/>
                  <path d="M10 7H10.01" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="banner-text-wrap">
                <strong>Usuarios de Oficina:</strong> No requieren número de control, carrera ni semestre. Solo datos personales y credenciales de acceso.
              </div>
              <button class="banner-dismiss" @click="alertInfo = false">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="5" x2="15" y2="15"/>
                  <line x1="15" y1="5" x2="5" y2="15"/>
                </svg>
              </button>
            </div>
          </transition>

          <transition name="fade-slow">
            <div v-if="alertError" class="error-banner">
              <div class="banner-icon-wrap error-icon">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="10" cy="10" r="8"/>
                  <line x1="13" y1="7" x2="7" y2="13"/>
                  <line x1="7" y1="7" x2="13" y2="13"/>
                </svg>
              </div>
              <span class="banner-text-wrap">{{ alertError }}</span>
              <button class="banner-dismiss" @click="alertError = ''">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="5" x2="15" y2="15"/>
                  <line x1="15" y1="5" x2="5" y2="15"/>
                </svg>
              </button>
            </div>
          </transition>

          <transition name="step-slide" mode="out-in">
            <div v-if="currentStep === 1" key="step-1" class="form-step-panel">
              
              <div class="step-content-grid">
                <div class="photo-col">
                  <div class="photo-upload-area">
                    <div class="photo-frame">
                      <img
                        v-if="fotoPreview"
                        :src="fotoPreview"
                        alt="Foto"
                        class="profile-photo-img"
                      />
                      <div v-else class="photo-placeholder-icon">
                        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
                          <circle cx="24" cy="18" r="10"/>
                          <path d="M8 42C8 33.1634 15.1634 26 24 26C32.8366 26 40 33.1634 40 42" stroke-linecap="round"/>
                        </svg>
                      </div>
                    </div>
                    <label class="photo-upload-btn">
                      <input type="file" class="hidden-input" accept="image/*" @change="handleImageUpload"/>
                      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 15H3"/>
                        <path d="M9 3v12"/>
                        <path d="M3 9h12" stroke-linecap="round"/>
                      </svg>
                      <span>{{ fotoPreview ? 'Cambiar foto' : 'Agregar foto' }}</span>
                    </label>
                    <p class="photo-hint-text">JPG, PNG, WebP • Máx. 2MB</p>
                  </div>
                </div>

                <div class="fields-col">
                  <div class="section-header-light">
                    <h3 class="section-title-light">Datos Personales</h3>
                    <span class="section-badge-light">Paso 1 de 3</span>
                  </div>

                  <div class="form-grid-wide">
                    <div class="form-field">
                      <label class="field-label">Nombre(s)</label>
                      <input
                        v-model="form.nombre"
                        class="field-input"
                        type="text"
                        placeholder="Ej: Juan Carlos"
                        autocomplete="given-name"
                      />
                    </div>
                    <div class="form-field">
                      <label class="field-label">Apellido Paterno</label>
                      <input
                        v-model="form.apellidoP"
                        class="field-input"
                        type="text"
                        placeholder="Ej: Pérez"
                        autocomplete="family-name"
                      />
                    </div>
                    <div class="form-field">
                      <label class="field-label">Apellido Materno</label>
                      <input
                        v-model="form.apellidoM"
                        class="field-input"
                        type="text"
                        placeholder="Ej: García"
                        autocomplete="family-name"
                      />
                    </div>
                  </div>

                  <transition name="expand-smooth">
                    <div v-if="userType === 'monitor'" class="academic-section">
                      <div class="section-header-light">
                        <h3 class="section-title-light">Datos Académicos</h3>
                        <span class="section-tag">Solo Monitores</span>
                      </div>

                      <div class="form-grid-wide">
                        <div class="form-field">
                          <label class="field-label">Número de Control</label>
                          <input
                            v-model="form.numeroControl"
                            @input="form.numeroControl = soloNumeros(form.numeroControl)"
                            class="field-input"
                            type="text"
                            placeholder="8 dígitos"
                            maxlength="8"
                          />
                        </div>
                        <div class="form-field">
                          <label class="field-label">Teléfono</label>
                          <input
                            v-model="form.telefono"
                            @input="form.telefono = soloNumeros(form.telefono)"
                            class="field-input"
                            type="tel"
                            placeholder="10 dígitos"
                            maxlength="15"
                          />
                        </div>
                        <div class="form-field">
                          <label class="field-label">Carrera</label>
                          <div class="select-wrapper">
                            <select v-model.number="form.carrera" class="field-select">
                              <option :value="null">Seleccionar carrera</option>
                              <option v-for="c in carreras" :key="c.id" :value="c.id">{{ c.nombre }}</option>
                            </select>
                            <div class="select-arrow">
                              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 6L8 10L12 6" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div class="form-field">
                          <label class="field-label">Semestre</label>
                          <div class="select-wrapper">
                            <select v-model.number="form.semestre" class="field-select">
                              <option :value="null">Seleccionar semestre</option>
                              <option v-for="n in 12" :key="n" :value="n">{{ n }}° Semestre</option>
                            </select>
                            <div class="select-arrow">
                              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 6L8 10L12 6" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div class="form-field full-width">
                          <label class="field-label">Club asignado</label>
                          <div class="select-wrapper">
                            <select v-model="selectedClubId" class="field-select">
                              <option :value="null">-- Ninguno --</option>
                              <option v-for="c in clubs" :key="c.id" :value="c.id">{{ c.nombre }}</option>
                            </select>
                            <div class="select-arrow">
                              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 6L8 10L12 6" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </transition>
                </div>
              </div>
            </div>

            <div v-else-if="currentStep === 2" key="step-2" class="form-step-panel">
              
              <div class="center-content-wrapper">
                <div class="section-header-light centered">
                  <h3 class="section-title-light">Credenciales de Acceso</h3>
                  <span class="section-badge-light">Paso 2 de 3</span>
                </div>

                <div class="credentials-grid">
                  <div class="form-field">
                    <label class="field-label">
                      Usuario
                      <span class="label-hint">(8 caracteres: letras y números)</span>
                    </label>
                    <div class="input-with-icon">
                      <div class="input-icon-left">
                        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.75">
                          <circle cx="9" cy="5" r="3"/>
                          <path d="M3 16C3 12.6863 5.68629 10 9 10C12.3137 10 15 12.6863 15 16" stroke-linecap="round"/>
                        </svg>
                      </div>
                      <input
                        v-model="form.usuario"
                        @input="form.usuario = soloUsuarioAlnum8(form.usuario)"
                        class="field-input with-left-icon"
                        type="text"
                        placeholder="Ej: ADM00001"
                        maxlength="8"
                      />
                      <div 
                        class="input-status"
                        :class="{ 
                          'status-valid': usuarioValid, 
                          'status-invalid': form.usuario && !usuarioValid 
                        }"
                      >
                        <svg v-if="usuarioValid" viewBox="0 0 18 18" fill="currentColor">
                          <path d="M15.293 4.293L7 12.586L3.707 9.293L2.293 10.707L7 15.414L16.707 5.707L15.293 4.293Z"/>
                        </svg>
                        <svg v-else-if="form.usuario" viewBox="0 0 18 18" fill="currentColor">
                          <path d="M4.293 4.293L9 9L4.293 13.707L5.707 15.293L10.414 10.586L15.121 15.293L16.535 13.879L11.828 9.172L16.535 4.464L15.121 3.05L10.414 7.757L5.707 3.05L4.293 4.293Z"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div class="form-field">
                    <label class="field-label">Contraseña</label>
                    <div class="input-with-icon">
                      <div class="input-icon-left">
                        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.75">
                          <rect x="3" y="8" width="12" height="7" rx="1.5"/>
                          <path d="M5 8V6C5 3.79086 6.79086 2 9 2C11.2091 2 13 3.79086 13 6V8" stroke-linecap="round"/>
                        </svg>
                      </div>
                      <input
                        v-model="form.password"
                        @input="onPasswordInput"
                        :type="showPassword ? 'text' : 'password'"
                        class="field-input with-left-icon"
                        placeholder="8 caracteres"
                        minlength="8"
                        maxlength="8"
                        autocomplete="new-password"
                      />
                      <button 
                        type="button"
                        class="input-toggle-btn"
                        @click="showPassword = !showPassword"
                      >
                        <svg v-if="!showPassword" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.75">
                          <path d="M1 9C1 9 4 3 9 3C14 3 17 9 17 9C17 9 14 15 9 15C4 15 1 9 1 9Z"/>
                          <circle cx="9" cy="9" r="2.25"/>
                        </svg>
                        <svg v-else viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.75">
                          <path d="M2 2L16 16M2.5 9.5C2.5 9.5 4.5 5.5 9 5.5C10.5 5.5 11.75 6.16667 12.6667 7M15.5 9.5C15.5 9.5 13.5 13.5 9 13.5C8 13.5 7.08333 13.1667 6.33333 12.6667" stroke-linecap="round"/>
                          <path d="M9 11.5C10.3807 11.5 11.5 10.3807 11.5 9C11.5 7.61929 10.3807 6.5 9 6.5" stroke-linecap="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div class="form-field">
                    <label class="field-label">Confirmar Contraseña</label>
                    <div class="input-with-icon">
                      <div class="input-icon-left">
                        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.75">
                          <rect x="3" y="8" width="12" height="7" rx="1.5"/>
                          <path d="M5 8V6C5 3.79086 6.79086 2 9 2C11.2091 2 13 3.79086 13 6V8" stroke-linecap="round"/>
                        </svg>
                      </div>
                      <input
                        v-model="form.confirmPassword"
                        :type="showConfirmPassword ? 'text' : 'password'"
                        class="field-input with-left-icon"
                        placeholder="Repetir contraseña"
                        minlength="8"
                        maxlength="8"
                        autocomplete="new-password"
                      />
                      <button 
                        type="button"
                        class="input-toggle-btn"
                        @click="showConfirmPassword = !showConfirmPassword"
                      >
                        <svg v-if="!showConfirmPassword" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.75">
                          <path d="M1 9C1 9 4 3 9 3C14 3 17 9 17 9C17 9 14 15 9 15C4 15 1 9 1 9Z"/>
                          <circle cx="9" cy="9" r="2.25"/>
                        </svg>
                        <svg v-else viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.75">
                          <path d="M2 2L16 16M2.5 9.5C2.5 9.5 4.5 5.5 9 5.5C10.5 5.5 11.75 6.16667 12.6667 7M15.5 9.5C15.5 9.5 13.5 13.5 9 13.5C8 13.5 7.08333 13.1667 6.33333 12.6667" stroke-linecap="round"/>
                          <path d="M9 11.5C10.3807 11.5 11.5 10.3807 11.5 9C11.5 7.61929 10.3807 6.5 9 6.5" stroke-linecap="round"/>
                        </svg>
                      </button>
                      <div 
                        class="input-status"
                        :class="{ 
                          'status-valid': passwordsMatch && form.password, 
                          'status-invalid': form.confirmPassword && !passwordsMatch 
                        }"
                      >
                        <svg v-if="passwordsMatch && form.password" viewBox="0 0 18 18" fill="currentColor">
                          <path d="M15.293 4.293L7 12.586L3.707 9.293L2.293 10.707L7 15.414L16.707 5.707L15.293 4.293Z"/>
                        </svg>
                        <svg v-else-if="form.confirmPassword && !passwordsMatch" viewBox="0 0 18 18" fill="currentColor">
                          <path d="M4.293 4.293L9 9L4.293 13.707L5.707 15.293L10.414 10.586L15.121 15.293L16.535 13.879L11.828 9.172L16.535 4.464L15.121 3.05L10.414 7.757L5.707 3.05L4.293 4.293Z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="password-actions-row">
                  <button 
                    type="button" 
                    class="action-btn generate-btn"
                    @click="fillWithGenerated"
                  >
                    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.75">
                      <path d="M12 18s6-3 6-9V4l-6-2-6 2v5c0 6 6 9 6 9z"/>
                    </svg>
                    Generar contraseña segura
                  </button>
                  <button 
                    type="button" 
                    class="action-btn check-btn"
                    :class="{ 
                      'check-valid': passwordCheckOk, 
                      'check-invalid': passwordChecked && !passwordCheckOk 
                    }"
                    @click="checkPassword"
                  >
                    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.75">
                      <path d="M7 9l2 2L15 5"/>
                      <rect x="2" y="4" width="11" height="11" rx="2" ry="2"/>
                    </svg>
                    Verificar seguridad
                  </button>
                </div>

                <transition name="expand-smooth">
                  <div v-if="generatedPassword" class="generated-box">
                    <div class="generated-info">
                      <span class="generated-label">Contraseña generada:</span>
                      <span class="generated-value">{{ generatedPassword }}</span>
                    </div>
                    <button 
                      type="button" 
                      class="copy-mini-btn"
                      @click="copyToClipboard(generatedPassword)"
                    >
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75">
                        <rect x="7" y="7" width="8" height="8" rx="1.5"/>
                        <path d="M4 11H3A2 2 0 0 1 1 9V3A2 2 0 0 1 3 1h7A2 2 0 0 1 12 3v1"/>
                      </svg>
                      Copiar
                    </button>
                  </div>
                </transition>

                <transition name="expand-smooth">
                  <div v-if="form.password || passwordChecked" class="requirements-panel">
                    <h4 class="req-title">Requisitos de seguridad</h4>
                    <div class="req-grid">
                      <div 
                        v-for="req in passwordReqs" 
                        :key="req.key" 
                        class="req-item-card"
                        :class="{ 'req-ok': req.valid }"
                      >
                        <div class="req-icon-mini" :class="{ 'icon-ok': req.valid }">
                          <svg v-if="req.valid" viewBox="0 0 14 14" fill="currentColor">
                            <path d="M11.293 3.293L6 8.586L3.707 6.293L2.293 7.707L6 11.414L12.707 4.707L11.293 3.293Z"/>
                          </svg>
                          <svg v-else viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.75">
                            <circle cx="7" cy="7" r="5.5"/>
                          </svg>
                        </div>
                        <span class="req-text-mini">{{ req.label }}</span>
                      </div>
                    </div>
                  </div>
                </transition>
              </div>
            </div>

            <div v-else-if="currentStep === 3" key="step-3" class="form-step-panel">
              
              <div class="summary-center">
                <div class="summary-icon-wrap">
                  <svg viewBox="0 0 56 56" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="4" y="4" width="48" height="48" rx="12" ry="12"/>
                    <path d="M20 28L24 32L36 20" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                
                <h2 class="summary-title">Confirmar Registro</h2>
                <p class="summary-subtitle">Revisa los datos antes de continuar</p>

                <div class="summary-cards">
                  <div class="summary-card">
                    <span class="summary-label">Tipo de Usuario</span>
                    <span class="summary-value">
                      <span 
                        class="type-pill"
                        :class="userType === 'oficina' ? 'pill-primary' : 'pill-secondary'"
                      >
                        {{ userType === 'oficina' ? 'Oficina' : 'Monitor' }}
                      </span>
                    </span>
                  </div>
                  
                  <div class="summary-card">
                    <span class="summary-label">Nombre Completo</span>
                    <span class="summary-value">{{ form.nombre }} {{ form.apellidoP }} {{ form.apellidoM }}</span>
                  </div>

                  <div v-if="userType === 'monitor'" class="summary-card">
                    <span class="summary-label">Número de Control</span>
                    <span class="summary-value code-style">{{ form.numeroControl || '-' }}</span>
                  </div>

                  <div class="summary-card">
                    <span class="summary-label">Usuario</span>
                    <span class="summary-value code-style">{{ form.usuario }}</span>
                  </div>

                  <div v-if="selectedClubId" class="summary-card">
                    <span class="summary-label">Club Asignado</span>
                    <span class="summary-value">
                      {{ clubs.find(c => c.id === selectedClubId)?.nombre || 'Asignado' }}
                    </span>
                  </div>
                </div>

                <div class="summary-footer-note">
                  <p>Al hacer clic en "Registrar", se creará la cuenta de usuario con los datos mostrados.</p>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <div class="workspace-footer">
          <div class="footer-left">
            <button 
              type="button"
              class="footer-nav-btn back-btn"
              v-if="currentStep > 1"
              @click="prevStep"
            >
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4L5 9L11 14" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Atrás
            </button>
          </div>

          <div class="footer-center">
            <button 
              type="button"
              class="text-link-btn"
              @click="navigateToLogin"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75">
                <path d="M10 12L6 8L10 4" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M5 8H14"/>
              </svg>
              Volver a Oficina
            </button>
          </div>

          <div class="footer-right">
            <button
              v-if="currentStep < 3"
              type="button"
              class="footer-nav-btn next-btn"
              @click="nextStep"
            >
              Continuar
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M7 4L13 9L7 14" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <button
              v-if="currentStep === 3"
              type="button"
              class="footer-nav-btn confirm-btn"
              :disabled="isLoading"
              @click="handleRegister"
            >
              <span v-if="!isLoading" class="btn-content-inline">
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 1.5C13.1421 1.5 16.5 4.85786 16.5 9C16.5 13.1421 13.1421 16.5 9 16.5C4.85786 16.5 1.5 13.1421 1.5 9C1.5 4.85786 4.85786 1.5 9 1.5Z"/>
                  <path d="M6.25 9L7.75 10.5L11.75 6.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Confirmar Registro
              </span>
              <span v-else class="btn-loading-inline">
                <span class="spinner-mini"></span>
                Registrando...
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <transition name="modal-fade">
      <div v-if="showSuccessModal" class="modal-backdrop" @click.self="closeModalAndReset"></div>
    </transition>

    <transition name="modal-slide">
      <div v-if="showSuccessModal" class="modal-container">
        <div class="success-modal">
          <div class="success-top">
            <div class="success-icon-large">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="24" cy="24" r="20"/>
                <path d="M16 24L20 28L32 16" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3 class="success-title-lg">¡Registro Exitoso!</h3>
            <p class="success-sub-lg">El usuario ha sido creado correctamente</p>
          </div>

          <div class="success-details-grid">
            <div class="detail-row">
              <span class="detail-key">Nombre</span>
              <span class="detail-val">{{ registeredUser?.nombre }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Usuario</span>
              <span class="detail-val code">{{ registeredUser?.usuario }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Tipo</span>
              <span class="detail-val">
                <span 
                  class="type-pill"
                  :class="registeredUser?.tipo === 'OFICINA' ? 'pill-primary' : 'pill-secondary'"
                >
                  {{ registeredUser?.tipo }}
                </span>
              </span>
            </div>
          </div>

          <transition name="expand-smooth">
            <div v-if="generatedPassword" class="generated-notice">
              <div class="notice-head">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75">
                  <path d="M10 18s6-3 6-9V4l-6-2-6 2v5c0 6 6 9 6 9z"/>
                </svg>
                <span>Contraseña generada</span>
              </div>
              <div class="notice-pass">{{ generatedPassword }}</div>
              <button 
                type="button"
                class="copy-tiny-btn"
                @click="copyToClipboard(generatedPassword)"
              >
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.75">
                  <rect x="6" y="6" width="7" height="7" rx="1.5"/>
                  <path d="M3 9H2A1 1 0 0 1 1 8V3A1 1 0 0 1 2 2h5A1 1 0 0 1 8 3v0.5"/>
                </svg>
                Copiar
              </button>
            </div>
          </transition>

          <div class="success-actions">
            <button 
              type="button" 
              class="action-secondary"
              @click="closeModalAndReset"
            >
              Registrar otro
            </button>
            <button 
              type="button" 
              class="action-primary"
              @click="goToLogin"
            >
              Volver a Oficina
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped src="./CrearCuenta.css"></style>
