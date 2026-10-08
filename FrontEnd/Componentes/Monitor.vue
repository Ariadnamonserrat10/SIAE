<template>
  <div class="monitor-wrapper"><header class="marca-monitor"><img src="../img/tecnologico-tlaxiaco.png" alt="Instituto Tecnológico de Tlaxiaco"/><div><strong>SIAE</strong><span>Actividades extraescolares · Monitor</span></div></header>
    <div class="d-flex flex-column monitor-background p-4 min-vh-100">
    <!-- PERFIL DEL MONITOR -->
    <div class="card profile-card shadow-sm p-3 mb-3 bg-white d-flex flex-row align-items-center">
      <div class="profile-photo-area" title="Cambiar foto de perfil">
      <template v-if="resolveFotoUrl(usuarioActual.foto) && !usuarioActualImageError">
        <img
          :src="resolveFotoUrl(usuarioActual.foto)"
          alt="Foto del monitor"
          class="rounded-circle me-3"
          width="80"
          height="80"
          style="object-fit: cover;"
          @click="$refs.profilePhotoInput.click()"
          @error="handleUserImageError"
        />
      </template>
      <div v-else class="rounded-circle me-3 d-flex align-items-center justify-content-center text-white fw-bold" style="width: 80px; height: 80px; background: linear-gradient(135deg, var(--brand) 0%, #0066CC 100%); border: 3px solid rgba(255,255,255,0.5); font-size: 1.75rem;" @click="$refs.profilePhotoInput.click()">
        {{ getInitials(usuarioActual.nombre, usuarioActual.apellidoP) }}
      </div>
      <button type="button" class="profile-photo-button" :disabled="subiendoFoto" @click="$refs.profilePhotoInput.click()" aria-label="Cambiar foto de perfil">
        {{ subiendoFoto ? '…' : '✎' }}
      </button>
      <input ref="profilePhotoInput" class="d-none" type="file" accept="image/jpeg,image/png,image/webp" @change="cambiarFotoPerfil" />
      </div>
      <div>
        <h4 class="text-primary mb-2">Registro de Asistencias</h4>
        <p><strong>Usuario:</strong> {{ usuarioActual.nombre }} {{ usuarioActual.apellidoP }}</p>
        <p>
          <strong>Club asignado:</strong>
          <span v-if="usuarioActual.club_nombre">{{ usuarioActual.club_nombre }}</span>
          <span v-else>- Ninguno -</span>
        </p>
      </div>
      <div class="ms-auto">
        <button class="btn btn-outline-danger btn-sm" @click="cerrarSesion">
          Cerrar sesión
        </button>
      </div>
    </div>

    <details v-if="usuarioActual.club_asignado" class="mb-3"><summary>Formatos e impresión del club</summary><FormatosInstitucionales ref="formatos" :club-id="usuarioActual.club_asignado" /></details>

    <!-- ALERTAS -->
    <transition name="fade">
      <div
        v-if="mensaje.texto"
        :class="['alert', mensaje.tipo, 'position-fixed top-0 end-0 mt-3 me-3 shadow']"
        style="z-index:2000; min-width:280px"
        role="alert"
      >
        {{ mensaje.texto }}
      </div>
    </transition>

    <!-- CONTENEDOR DE ASISTENCIAS -->
    <div class="card attendance-card shadow-sm p-3 flex-grow-1">
      <h5 class="text-secondary mb-3">Asistencias del Club</h5>

      <!-- TABLA DE ASISTENCIAS SIEMPRE VISIBLE PARA MOSTRAR FECHAS -->
      <div v-if="fechasData.length" class="mobile-date-navigation" aria-label="Mover fechas">
        <button type="button" @pointerdown.prevent="desplazarFechas(-1)" @keydown.enter.prevent="desplazarFechas(-1)" aria-label="Ver fechas anteriores">‹</button>
        <span>Desliza o usa las flechas para ver las fechas</span>
        <button type="button" @pointerdown.prevent="desplazarFechas(1)" @keydown.enter.prevent="desplazarFechas(1)" aria-label="Ver fechas siguientes">›</button>
      </div>
      <div class="attendance-table-layout">
      <div v-if="alumnosClub.length" class="mobile-student-names" aria-label="Nombres de alumnos">
        <div class="mobile-student-names__header">Nombre</div>
        <div v-for="(alumno, index) in alumnosClub" :key="`mobile-name-${index}`" class="mobile-student-names__item">
          {{ alumno.nombre }} {{ alumno.apellidoP }}
        </div>
      </div>
      <div ref="attendanceScroll" class="attendance-table-scroll">
      <table class="table table-hover align-middle">
         <thead class="text-center modern-table-header">
           <tr>
             <th class="header-cell">Nombre</th>
             <th v-for="fecha in fechasData" :key="fecha" class="header-cell date-cell">{{ fechaCorta(fecha) }}</th>
             <th class="header-cell">Estatus</th>
             <th class="header-cell">Evaluación</th>
           </tr>
         </thead>
        <tbody>
          <tr v-if="alumnosClub.length === 0">
            <td :colspan="(fechasData.length + 3)" class="text-center text-muted">
              No hay alumnos registrados en este club.
            </td>
          </tr>
          <tr v-else v-for="(alumno, index) in alumnosClub" :key="index">
            <td class="student-name">{{ alumno.nombre }} {{ alumno.apellidoP }}</td>
            <td v-for="fecha in fechasData" :key="fecha" class="text-center date-cell">
              <label class="attendance-tap-target" :aria-label="`Asistencia de ${alumno.nombre} para ${fecha}`">
                <input
                  type="checkbox"
                  v-model="alumno.asistencias[fecha]"
                  @change="onToggleAsistencia(alumno, fecha)"
                />
              </label>
            </td>
             <td class="text-center">
             <span
                 class="status-pill"
                 :class="estadoAsistencia(alumno).clase"
               >
                 <span class="status-dot"></span>
                 {{ estadoAsistencia(alumno).texto }}
               </span>
             </td>
            <td class="text-center">
              <button
                v-if="!isEvaluated(alumno) && puedeEvaluar(alumno)"
                class="btn btn-sm btn-outline-primary"
                @click="openEvalModal(alumno)"
              >
                Evaluar
              </button>
              <span v-else-if="isEvaluated(alumno)" class="badge bg-secondary">Evaluado</span>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
      </div>

      <!-- BOTÓN GUARDAR CAMBIOS (OPCIONAL) -->
      <div class="d-flex justify-content-end mt-3" v-if="alumnosClub.length">
        <button class="btn btn-outline-primary" @click="guardarCambios">
          Guardar cambios
        </button>
      </div>
    </div>

    <!-- MODAL EVALUACION -->
    <div v-if="showEvalModal" class="modal-backdrop fade show"></div>
    <div v-if="showEvalModal" class="modal d-block" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header text-white" style="background-color: var(--brand);">
            <h5 class="modal-title">Evaluación de Desempeño</h5>
            <button type="button" class="btn-close btn-close-white" @click="closeEvalModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3 p-2 bg-light rounded border">
              <div class="row">
                <div class="col-md-6"><strong>Estudiante:</strong> {{ evalForm.nombre_estudiante }}</div>
                <div class="col-md-6"><strong>Club:</strong> {{ evalForm.nombre_club }}</div>
                <div v-if="currentStudent && currentStudent.faltas >= 3" class="col-12 mt-2">
                  <div class="alert alert-warning py-1 mb-0 small">
                    <i class="bi bi-exclamation-triangle-fill me-1"></i>
                    Este estudiante tiene {{ currentStudent.faltas }} faltas y no acreditará créditos independientemente de la evaluación.
                  </div>
                </div>
                <div class="col-12 mt-2">
                  <label class="form-label"><strong>Periodo de realización:</strong></label>
                  <div class="form-control bg-light">{{ periodoActivo ? `${String(periodoActivo.fecha_inicio).slice(0,10)} al ${String(periodoActivo.fecha_fin).slice(0,10)}` : "No hay periodo activo" }}</div>
                </div>
              </div>
            </div>

            <div class="mb-3">
              <div class="card bg-light mb-2">
                <div class="card-body py-2">
                  <h6 class="mb-1">Guía de Valores</h6>
                  <ul class="list-unstyled small mb-0 d-flex justify-content-between flex-wrap">
                    <li class="me-2"><strong>0:</strong> Insuficiente</li>
                    <li class="me-2"><strong>1:</strong> Suficiente</li>
                    <li class="me-2"><strong>2:</strong> Bueno</li>
                    <li class="me-2"><strong>3:</strong> Notable</li>
                    <li><strong>4:</strong> Excelente</li>
                  </ul>
                </div>
              </div>

              <h6>Criterios a evaluar</h6>
              <div class="table-responsive">
                <table class="table table-sm table-bordered">
                  <thead class="table-light text-center">
                    <tr>
                      <th style="width: 5%">No.</th>
                      <th style="width: 55%">Criterio</th>
                      <th style="width: 8%">0</th>
                      <th style="width: 8%">1</th>
                      <th style="width: 8%">2</th>
                      <th style="width: 8%">3</th>
                      <th style="width: 8%">4</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(criterio, i) in criteriosList" :key="i">
                      <td class="text-center">{{ i + 1 }}</td>
                      <td>{{ criterio }}</td>
                      <td v-for="val in 5" :key="val" class="text-center">
                        <input 
                          type="radio" 
                          :name="'criterio_' + (i+1)" 
                          :value="val - 1" 
                          v-model="evalForm['criterio_' + (i+1)]"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label"><strong>Observaciones:</strong></label>
              <textarea v-model="evalForm.observaciones" class="form-control" rows="4" placeholder="Escriba sus observaciones aquí..."></textarea>
            </div>

            <div class="row">
              <div class="col-md-6">
                <label class="form-label"><strong>Valor numérico de la actividad Cultural y/o Deportiva:</strong></label>
                <div class="form-control bg-light">{{ evaluationSummary ? evaluationSummary.valor_numerico.toFixed(2) : "Califica los siete criterios" }}</div>
              </div>
              <div class="col-md-6">
                <label class="form-label"><strong>Nivel de desempeño alcanzado de la actividad Cultural y/o Deportiva:</strong></label>
                 <div class="form-control bg-light">{{ evaluationSummary?.desempeno || "Pendiente" }}</div>
              </div>
            </div>

          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeEvalModal">Cancelar</button>
            <button type="button" class="btn btn-primary" @click="submitEvaluacion">Guardar Evaluación</button>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { getPeriodoActivo, getAsistenciasPorClub, actualizarAsistencia, getAlumnos, saveEvaluacion, getEvaluatedStudents, getClubs, uploadFoto, updateUsuario } from "../Servicios/api";
import { BACKEND } from "../Servicios/direccion-servidor";
import { authService } from "../Servicios/sesion-panel";
import { resolveFotoUrl } from "../Servicios/imagenes";
import FormatosInstitucionales from './FormatosInstitucionales.vue';
import { calculateEvaluation, evaluationCriteria } from '../Servicios/reglas-evaluacion.js';
export default {
  components: { FormatosInstitucionales },
  name: "Monitor",
  data() {
    return {
      usuarioActual: {
        nombre: "",
        apellidoP: "",
        tipo: "",
        foto: "",
        club_asignado: null,
        club_nombre: null
      },
      usuarioActualImageError: false,
      subiendoFoto: false,
      monitor: {
        nombre: "",
        club: ""
      },
      clubsList: [],
      selectedClubId: null,
      assigning: false,
      mensaje: {
        texto: "",
        tipo: ""
      },
      alumnosData: [],
      fechasData: [],
      showEvalModal: false,
      currentStudent: null,
      evaluados: [],
      periodoActivo: null,
      criteriosList: evaluationCriteria,
      evalForm: {
        nombre_estudiante: '',
        nombre_club: '',
        periodo_realizacion: '',
        criterio_1: null,
        criterio_2: null,
        criterio_3: null,
        criterio_4: null,
        criterio_5: null,
        criterio_6: null,
        criterio_7: null,
        observaciones: '',
        valor_numerico: null,
        nivel_desempeno: null
      }
    };
  },
  computed: {
    evaluationSummary() { return calculateEvaluation(Array.from({ length: 7 }, (_, index) => this.evalForm[`criterio_${index + 1}`])); },
    alumnosClub() {
      return (this.alumnosData || []).map(a => {
        if (!a.asistencias) a.asistencias = {};
        this.fechasData.forEach(f => {
          if (!(f in a.asistencias)) a.asistencias[f] = false;
        });
        a.faltas = Object.values(a.asistencias).filter(v => v === false).length;
        return a;
      });
    }
  },
  methods: {
    async cambiarFotoPerfil(event) {
      const file = event?.target?.files?.[0];
      if (!file) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        this.mostrarMensaje('Selecciona una imagen JPG, PNG o WebP', 'alert-warning');
        event.target.value = '';
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        this.mostrarMensaje('La imagen no debe exceder 2 MB', 'alert-warning');
        event.target.value = '';
        return;
      }
      this.subiendoFoto = true;
      try {
        const uploaded = await uploadFoto(file);
        const userId = this.usuarioActual.id || authService.getUserId();
        await updateUsuario(userId, {
          foto: uploaded.file
        });
        this.usuarioActual.foto = uploaded.file;
        this.usuarioActualImageError = false;
        this.mostrarMensaje('Foto de perfil actualizada', 'alert-success');
      } catch (error) {
        this.mostrarMensaje(error?.message || 'No se pudo actualizar la foto', 'alert-danger');
      } finally {
        this.subiendoFoto = false;
        if (event?.target) event.target.value = '';
      }
    },
    desplazarFechas(direccion) {
      const contenedor = this.$refs.attendanceScroll;
      if (!contenedor) return;
      const distancia = Number(direccion) * Math.max(220, contenedor.clientWidth * 0.95);
      const limite = Math.max(0, contenedor.scrollWidth - contenedor.clientWidth);
      const destino = Math.min(limite, Math.max(0, contenedor.scrollLeft + distancia));
      contenedor.scrollLeft = destino;
    },
    fechaCorta(fecha) {
      const partes = String(fecha || '').slice(0, 10).split('-');
      return partes.length === 3 ? `${partes[2]}/${partes[1]}` : fecha;
    },
    fechaActualLocal() {
      const hoy = new Date();
      const year = hoy.getFullYear();
      const month = String(hoy.getMonth() + 1).padStart(2, '0');
      const day = String(hoy.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    calcularFaltas(asistencias = {}) {
      return this.fechasData.filter(fecha => asistencias[fecha] === false).length;
    },
    estadoAsistencia(alumno) {
      if (!this.fechasData.length) return {
        texto: 'Pendiente',
        clase: 'status-pending'
      };
      return alumno.faltas < 3 ? {
        texto: 'Acreditado',
        clase: 'status-accredited'
      } : {
        texto: 'No acreditado',
        clase: 'status-not-accredited'
      };
    },
    puedeEvaluar(alumno) {
      return this.estadoAsistencia(alumno).clase === 'status-accredited';
    },
    resolveFotoUrl,
    getInitials(nombre, apellido) {
      let initials = "";
      if (nombre && typeof nombre === "string" && nombre.trim()) {
        initials += nombre.trim()[0].toUpperCase();
      }
      if (apellido && typeof apellido === "string" && apellido.trim()) {
        initials += apellido.trim()[0].toUpperCase();
      }
      return initials || "U";
    },
    handleUserImageError() {
      this.usuarioActualImageError = true;
    },
    async cargarUsuarioActual() {
      try {
        const perfil = await authService.getCurrentUser();
        const usuarioId = perfil?.id;
        if (!usuarioId) return;
        const response = await axios.get(`${BACKEND}/usuarios/${usuarioId}`, {
          headers: {
            'X-Requested-With': 'SIAE'
          }
        });
        if (response.data?.status === "success") {
          const datos = response.data.data;
          this.usuarioActual.id = datos.id;
          this.usuarioActual.nombre = datos.nombre || "";
          this.usuarioActual.apellidoP = datos.apellidoP || "";
          this.usuarioActual.tipo = datos.tipo || "";
          this.usuarioActual.foto = datos.foto || this.usuarioActual.foto;
          this.usuarioActual.club_asignado = datos.club_asignado ?? null;
          this.usuarioActual.club_nombre = datos.club_nombre ?? null;
          this.usuarioActualImageError = false;
          this.selectedClubId = this.usuarioActual.club_asignado;
          if (datos.club_nombre) this.monitor.club = datos.club_nombre;
        }
      } catch (error) {
        // Silencioso en producción
      }
    },
    async loadAsistencias() {
      const clubId = this.usuarioActual.club_asignado;
      if (!clubId) return;
      try {
        let alumnosClub = [];
        try {
          const res = await fetch(`${BACKEND}/alumnos?club_id=${encodeURIComponent(clubId)}`, {
            headers: {
              'X-Requested-With': 'SIAE'
            }
          });
          const json = await res.json();
          if (res.ok && json && Array.isArray(json.data)) {
            alumnosClub = json.data;
          }
        } catch (e) {
          // Silencioso
        }
        const data = await getAsistenciasPorClub(clubId);
        const nuevasFechas = Array.isArray(data.fechas) ? data.fechas : [];
        this.fechasData = [...new Set([...this.fechasData, ...nuevasFechas])].sort();
        const alumnos = Array.isArray(data.alumnos) && data.alumnos.length ? data.alumnos : alumnosClub;
        const asist = data.asistencias || {};
        this.alumnosData = (alumnos || []).map(al => {
          const rawMap = asist[al.id] || {};
          const map = {};
          Object.keys(rawMap).forEach(f => {
            map[f] = rawMap[f] == 1;
          });
          this.fechasData.forEach(fecha => {
            if (!(fecha in map)) map[fecha] = false;
          });
          return {
            ...al,
            asistencias: map,
            faltas: this.calcularFaltas(map)
          };
        });
        if (this.alumnosData.length > 0) {
          const clubName = this.usuarioActual.club_nombre || this.alumnosData[0].club || '';
          if (clubName) this.loadEvaluatedStudents(clubName);
        }
        this.$forceUpdate();
      } catch (e) {
        // Silencioso - mostrar mensaje solo en interacción explícita
        this.mostrarMensaje('No se pudieron cargar asistencias', 'alert-danger');
      }
    },
    async loadEvaluatedStudents(clubName) {
      try {
        this.evaluados = await getEvaluatedStudents(clubName);
      } catch (e) {
        // Silencioso
      }
    },
    isEvaluated(alumno) {
      const nombreFull = `${alumno.nombre} ${alumno.apellidoP} ${alumno.apellidoM || ''}`.trim();
      function normalize(s) {
        if (!s) return '';
        const from = s.normalize('NFD').replace(/\p{Diacritic}/gu, '');
        return from.toLowerCase().replace(/\s+/g, ' ').trim();
      }
      const target = normalize(nombreFull);
      const targetTokens = target.split(' ').filter(Boolean);
      return this.evaluados.some(e => {
        if (e.alumno_id) return Number(e.alumno_id) === Number(alumno.id);
        const norm = normalize(e.nombre_estudiante || '');
        if (norm === target) return true;
        return targetTokens.every(t => norm.includes(t));
      });
    },
    mostrarMensaje(texto, tipo) {
      this.mensaje.texto = texto;
      this.mensaje.tipo = tipo;
      setTimeout(() => this.mensaje.texto = "", 2500);
    },
    cerrarSesion() {
      this.mostrarMensaje("Sesión cerrada correctamente.", "alert-info");
      setTimeout(() => {
        authService.logout('current').then(() => {
          this.$router.push("/");
        }).catch(() => {
          authService.clearAuth();
          this.$router.push("/");
        });
      }, 500);
    },
    async guardarCambios() {
      try {
        const promesas = [];
        for (const alumno of this.alumnosData) {
          for (const fecha of this.fechasData) {
            promesas.push(actualizarAsistencia({
              alumno_id: alumno.id,
              fecha,
              presente: !!alumno.asistencias[fecha]
            }));
          }
        }
        await Promise.all(promesas);
        this.mostrarMensaje("Cambios guardados correctamente.", "alert-success");
        // NOTA: Auditoría manejada por el backend
      } catch (e) {
        this.mostrarMensaje("Error al guardar cambios.", "alert-danger");
      }
    },
    async onToggleAsistencia(alumno, fecha) {
      const presente = !!alumno.asistencias[fecha];
      try {
        await actualizarAsistencia({
          alumno_id: alumno.id,
          fecha,
          presente
        });
        alumno.faltas = this.calcularFaltas(alumno.asistencias);
      } catch (e) {
        alumno.asistencias[fecha] = !presente;
        this.mostrarMensaje('Error al actualizar asistencia', 'alert-danger');
      }
    },
    openEvalModal(alumno) {
      this.currentStudent = alumno;
      const clubName = alumno.club || this.alumnosData[0]?.club || this.usuarioActual.club_nombre || 'Sin Club';
      this.evalForm = {
        alumno_id: Number(alumno.id),
        nombre_estudiante: `${alumno.nombre} ${alumno.apellidoP} ${alumno.apellidoM || ''}`.trim(),
        nombre_club: clubName,
        periodo_realizacion: new Date().toISOString().split('T')[0],
        criterio_1: null,
        criterio_2: null,
        criterio_3: null,
        criterio_4: null,
        criterio_5: null,
        criterio_6: null,
        criterio_7: null,
        observaciones: '',
        valor_numerico: null,
        nivel_desempeno: null
      };
      this.showEvalModal = true;
    },
    closeEvalModal() {
      this.showEvalModal = false;
    },
    async submitEvaluacion() {
      const f = this.evalForm;
      if (!this.evaluationSummary) return alert('Califica los siete criterios con valores de 0 a 4.');
      try {
        const sendPayload = { ...this.evalForm, ...this.evaluationSummary };
        const res = await saveEvaluacion(sendPayload);
        if (res.status === 'success') {
          this.mostrarMensaje('Evaluación guardada exitosamente', 'alert-success');
          this.showEvalModal = false;
          await this.$refs.formatos?.loadData();
          // NOTA: Auditoría manejada por el backend
          if (!this.evaluados.some(e => e.nombre_estudiante === f.nombre_estudiante)) {
            this.evaluados.push({
              alumno_id: f.alumno_id,
              nombre_estudiante: f.nombre_estudiante,
              nivel_desempeno: sendPayload.nivel_desempeno,
              valor_numerico: sendPayload.valor_numerico,
              observaciones: sendPayload.observaciones
            });
          }
        }
      } catch (e) {
        this.mostrarMensaje(e.message || 'Error al guardar evaluación', 'alert-danger');
      }
    }
  },
  async mounted() {
    this.periodoActivo = (await getPeriodoActivo()).data;
    await this.cargarUsuarioActual();
    await this.loadAsistencias();
    // Auto-refresco cada 10 segundos
    this.refreshInterval = setInterval(async () => {
      try {
        await this.loadAsistencias();
      } catch (e) {
        // Silencioso
      }
    }, 10000);
  },
  beforeUnmount() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }
};
</script>

<style scoped src="./Monitor.css"></style>
