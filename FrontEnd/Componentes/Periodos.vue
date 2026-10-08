<template>
  <div class="p-3">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="m-0 text-dark">Gestión de Periodos Escolares</h3>
    </div>
    
    <!-- Card de Periodo Activo -->
    <div class="row mb-4">
      <div class="col-12 col-md-8 col-lg-6">
        <div class="card border-0 shadow-sm" style="background-color: #f8f9fa; border-left: 5px solid #12343b !important;">
          <div class="card-body p-4">
            <h5 class="text-uppercase fw-bold mb-3" style="color: #12343b; letter-spacing: 1px;">Periodo en Curso</h5>
            
            <div v-if="periodoActivo">
              <!-- Nombre -->
              <div class="mb-3">
                <label class="form-label small text-muted mb-1">Nombre del Período</label>
                <input 
                  v-model="periodoEditando.nombre" 
                  type="text" 
                  class="form-control"
                  :disabled="!editando"
                  placeholder="Ej. Enero - Junio 2025"
                />
              </div>
              
              <!-- Fechas -->
              <div class="row mb-3">
                <div class="col-6">
                  <label class="form-label small text-muted mb-1">Fecha Inicio</label>
                  <input 
                    v-model="periodoEditando.fecha_inicio" 
                    type="date" 
                    class="form-control"
                    :disabled="!editando"
                  />
                </div>
                <div class="col-6">
                  <label class="form-label small text-muted mb-1">Fecha Término</label>
                  <input 
                    v-model="periodoEditando.fecha_fin" 
                    type="date" 
                    class="form-control"
                    :disabled="!editando"
                    :class="{'is-invalid': fechaInvalida}"
                  />
                  <div v-if="fechaInvalida" class="invalid-feedback">La fecha fin debe ser mayor a inicio</div>
                </div>
              </div>
              
              <!-- Rango de meses -->
              <div class="mb-3">
                <label class="form-label small text-muted mb-1">Período</label>
                <div class="form-control-plaintext">
                  <span class="fs-5 fw-semibold text-primary">{{ obtenerFechaCompleta(periodoEditando.fecha_inicio) }} — {{ obtenerFechaCompleta(periodoEditando.fecha_fin) }}</span>
                </div>
              </div>
              
              <!-- Estado -->
              <div class="mb-3">
                <span class="text-muted small d-block">Estado</span>
                <span class="badge rounded-pill px-3 py-2" :class="periodoEditando.estado === 'ACTIVO' ? 'bg-success' : 'bg-light text-secondary border'">
                  {{ periodoEditando.estado }}
                </span>
              </div>
              
              <!-- Botones -->
              <div class="d-flex gap-2 mt-4">
                <button 
                  v-if="!editando && !yaEditado"
                  class="btn btn-primary px-4 py-2 fw-bold" 
                  @click="habilitarEdicion"
                >
                  Editar Período
                </button>
                
                <span v-if="yaEditado" class="badge bg-secondary px-3 py-2 align-self-center">
                  Período ya editado
                </span>
                
                <button 
                  v-if="editando"
                  class="btn btn-success px-4 py-2 fw-bold" 
                  @click="guardarCambios"
                  :disabled="guardando || fechaInvalida || !hayCambios"
                >
                  {{ guardando ? 'Guardando...' : 'Guardar Cambios' }}
                </button>
                
                <button 
                  v-if="editando"
                  class="btn btn-outline-secondary px-4 py-2" 
                  @click="cancelarEdicion"
                  :disabled="guardando"
                >
                  Cancelar
                </button>
                
                <button 
                  v-if="!editando && puedeCerrar"
                  class="btn btn-danger px-4 py-2 fw-bold" 
                  @click="mostrarModalConfirmacion = true"
                  :disabled="procesando"
                >
                  {{ procesando ? 'Procesando...' : 'FINALIZAR PERIODO ACTUAL' }}
                </button>
                
                <span v-if="editando && !puedeCerrar" class="text-muted small align-self-center">
                  El período se cerrará automáticamente el {{ formatearFecha(periodoEditando.fecha_fin) }}
                </span>
              </div>
            </div>
            
            <div v-else class="py-3">
              <p class="text-muted mb-0">No se ha detectado ningún período con estado ACTIVO.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de Historial -->
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white py-3 border-bottom">
        <h5 class="m-0 fw-bold text-secondary text-uppercase small" style="letter-spacing: 1px;">Historial de Ciclos</h5>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0" style="font-size: 0.95rem;">
            <thead style="background-color: #f1f3f5;">
              <tr>
                <th class="ps-4 py-3 text-secondary text-uppercase small">ID</th>
                <th class="py-3 text-secondary text-uppercase small">Nombre del Ciclo</th>
                <th class="py-3 text-secondary text-uppercase small">Fecha Inicio</th>
                <th class="py-3 text-secondary text-uppercase small">Fecha Fin</th>
                <th class="pe-4 py-3 text-secondary text-uppercase small text-center">Estado</th>
                <th class="pe-4 py-3 text-secondary text-uppercase small text-center">Consulta</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in periodos" :key="p.id">
                <td class="ps-4 fw-bold text-muted">#{{ p.id }}</td>
                <td>{{ p.nombre }}</td>
                <td>{{ p.fecha_inicio }}</td>
                <td>{{ p.fecha_fin }}</td>
                <td class="pe-4 text-center">
                  <span class="badge rounded-pill px-3 py-2" :class="p.estado === 'ACTIVO' ? 'bg-success' : 'bg-light text-secondary border'">
                    {{ p.estado }}
                  </span>
                </td>
                <td class="pe-4 text-center">
                  <button v-if="p.estado !== 'ACTIVO'" class="btn btn-sm btn-outline-primary" @click="consultarHistorial(p)">Ver clubes y alumnos</button>
                  <span v-else class="text-muted small">Periodo actual</span>
                </td>
              </tr>
              <tr v-if="periodos.length === 0">
                <td colspan="6" class="text-center py-5 text-muted">No existen registros históricos de períodos.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="historialSeleccionado" class="card border-0 shadow-sm mt-4 historial-periodo">
      <div class="card-header text-white d-flex justify-content-between align-items-center" style="background:var(--brand)">
        <div><strong>{{ historialSeleccionado.periodo.nombre }}</strong><span class="ms-2 opacity-75">Clubes y resultados del ciclo</span></div>
        <button class="btn btn-sm btn-light" @click="cerrarHistorial">Cerrar</button>
      </div>
      <div class="card-body">
        <div v-if="cargandoHistorial" class="text-center py-4">Cargando historial...</div>
        <div v-else class="row g-3">
          <div v-for="club in historialSeleccionado.clubs" :key="club.id" class="col-md-6 col-xl-4">
            <button class="history-club-card" :class="{ active: clubHistorialSeleccionado?.id === club.id }" @click="clubHistorialSeleccionado = club">
              <span class="history-club-name">{{ club.nombre }}</span>
              <span class="history-club-count">{{ club.alumnos.length }} alumnos</span>
              <span class="badge bg-success">{{ club.acreditados }} acreditados</span>
              <span class="badge bg-danger">{{ club.no_acreditados }} no acreditados</span>
            </button>
          </div>
        </div>

        <div v-if="clubHistorialSeleccionado" class="mt-4">
          <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <h5 class="mb-0">{{ clubHistorialSeleccionado.nombre }}</h5>
            <button class="btn btn-outline-primary" @click="imprimirListaEntrega(clubHistorialSeleccionado)">Imprimir lista de entrega y firmas</button>
          </div>
          <p v-if="clubHistorialSeleccionado.descripcion" class="text-muted">{{ clubHistorialSeleccionado.descripcion }}</p>
          <div class="table-responsive">
            <table class="table table-hover align-middle">
              <thead><tr><th>Alumno</th><th>Número de control</th><th>Carrera</th><th>Semestre</th><th>Resultado</th><th>Constancia</th></tr></thead>
              <tbody>
                <tr v-for="alumno in clubHistorialSeleccionado.alumnos" :key="alumno.id"><td>{{ nombreAlumnoHistorial(alumno) }}</td><td>{{ alumno.numeroControl }}</td><td>{{ alumno.carrera_nombre || '—' }}</td><td>{{ alumno.semestre_id || '—' }}</td><td><span class="badge" :class="alumno.estado_periodo === 'ACREDITADO' ? 'bg-success' : 'bg-danger'">{{ alumno.estado_periodo === 'ACREDITADO' ? 'Acreditado' : 'No acreditado' }}</span></td><td><button v-if="alumno.estado_periodo === 'ACREDITADO'" class="btn btn-sm btn-success" @click="imprimirConstanciaReposicion(alumno, clubHistorialSeleccionado)">Constancia de reposición</button><span v-else class="text-muted small">No disponible</span></td></tr>
                <tr v-if="!clubHistorialSeleccionado.alumnos.length"><td colspan="6" class="text-center text-muted py-4">Este club no tuvo alumnos registrados.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <Constancias ref="generadorConstancia" generator-only />

    <!-- Modal de Confirmación -->
    <div v-if="mostrarModalConfirmacion" class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.6);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-danger text-white border-0">
            <h5 class="modal-title fw-bold">Confirmar Cierre de Período</h5>
            <button type="button" class="btn-close btn-close-white" @click="mostrarModalConfirmacion = false"></button>
          </div>
          <div class="modal-body p-4">
            <p class="mb-3">Estás a punto de cerrar el período <strong>{{ periodoActivo?.nombre }}</strong>.</p>
            <div class="alert alert-warning border-0">
              <h6 class="alert-heading fw-bold">¿Qué sucederá al cerrar?</h6>
              <ul class="mb-0 small">
                <li>Se evaluarán las asistencias de todos los alumnos.</li>
                <li>Los alumnos con 3 o más faltas ficaram como "REPROBADOS".</li>
                <li>Se guardará la configuración actual para registros históricos.</li>
                <li>Se generará automáticamente el siguiente ciclo escolar.</li>
              </ul>
            </div>
            <p class="text-danger fw-bold mb-0 small mt-3">¡Esta acción es definitiva y no se puede revertir!</p>
          </div>
          <div class="modal-footer border-0 bg-light">
            <button type="button" class="btn btn-outline-secondary px-4" @click="mostrarModalConfirmacion = false">Cancelar</button>
            <button type="button" class="btn btn-danger px-4 fw-bold" @click="cerrarPeriodo" :disabled="procesando">
              SI, CERRAR PERIODO
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { jsPDF } from 'jspdf';
import Constancias from './Constancias.vue';
import { getPeriodoActivo, getPeriodos, getPeriodoDetalle, updatePeriodo, cerrarPeriodo as cerrarPeriodoApi } from '../Servicios/api';
export default {
  name: 'Periodos',
  components: {
    Constancias
  },
  data() {
    return {
      periodos: [],
      periodoActivo: null,
      periodoEditando: {},
      periodoOriginal: {},
      editando: false,
      procesando: false,
      guardando: false,
      mostrarModalConfirmacion: false,
      yaEditado: false,
      historialSeleccionado: null,
      clubHistorialSeleccionado: null,
      cargandoHistorial: false
    };
  },
  computed: {
    fechaInvalida() {
      if (!this.periodoEditando.fecha_inicio || !this.periodoEditando.fecha_fin) return false;
      return new Date(this.periodoEditando.fecha_fin) <= new Date(this.periodoEditando.fecha_inicio);
    },
    hayCambios() {
      return JSON.stringify(this.periodoEditando) !== JSON.stringify(this.periodoOriginal);
    },
    puedeCerrar() {
      if (!this.periodoActivo || !this.periodoActivo.fecha_fin) return false;
      const fechaFin = new Date(`${String(this.periodoActivo.fecha_fin).slice(0, 10)}T00:00:00`);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      return fechaFin <= hoy;
    }
  },
  mounted() {
    this.cargarPeriodos();
  },
  methods: {
    limpiarNombreArchivo(valor) {
      return String(valor || 'documento').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '_');
    },
    async imprimirConstanciaReposicion(alumno, club) {
      if (alumno.estado_periodo !== 'ACREDITADO') return;
      try {
        await this.$refs.generadorConstancia.generarReposicionHistorica({
          alumno,
          club,
          periodo: this.historialSeleccionado?.periodo || {}
        });
      } catch (error) {
        this.$emit('show-error', error.message || 'No se pudo generar la constancia');
      }
    },
    imprimirListaEntrega(club) {
      const periodo = this.historialSeleccionado?.periodo || {};
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'letter'
      });
      const ancho = doc.internal.pageSize.getWidth();
      const alto = doc.internal.pageSize.getHeight();
      const columnas = [12, 22, 92, 122, 187, 207, 242, ancho - 12];
      const encabezado = () => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('LISTA DE ENTREGA DE CONSTANCIAS / NOTIFICACIÓN DE RESULTADOS', ancho / 2, 14, {
          align: 'center'
        });
        doc.setFontSize(10);
        doc.text(`Club: ${club.nombre}    Ciclo: ${periodo.nombre || ''}`, 12, 22);
        doc.setFontSize(8);
        const titulos = ['No.', 'Alumno', 'Control', 'Carrera', 'Sem.', 'Resultado', 'Firma de recibido'];
        titulos.forEach((titulo, i) => doc.text(titulo, columnas[i] + 1.5, 31));
        doc.line(12, 34, ancho - 12, 34);
      };
      encabezado();
      let y = 42;
      club.alumnos.forEach((alumno, index) => {
        if (y > alto - 18) {
          doc.addPage();
          encabezado();
          y = 42;
        }
        const values = [String(index + 1), this.nombreAlumnoHistorial(alumno), String(alumno.numeroControl || ''), String(alumno.carrera_nombre || ''), String(alumno.semestre_id || ''), alumno.estado_periodo === 'ACREDITADO' ? 'ACREDITÓ' : 'NO ACREDITÓ', ''];
        values.forEach((value, i) => {
          if (i < 6) doc.text(doc.splitTextToSize(value, columnas[i + 1] - columnas[i] - 3)[0] || '', columnas[i] + 1.5, y);
        });
        doc.line(12, y + 5, ancho - 12, y + 5);
        y += 12;
      });
      doc.setFontSize(8);
      doc.text('La firma acredita la recepción de la constancia o la notificación del resultado del ciclo.', 12, alto - 8);
      doc.save(`Lista_entrega_${this.limpiarNombreArchivo(club.nombre)}_${this.limpiarNombreArchivo(periodo.nombre)}.pdf`);
    },
    nombreAlumnoHistorial(alumno) {
      return `${alumno.nombre || ''} ${alumno.apellidoP || ''} ${alumno.apellidoM || ''}`.replace(/\s+/g, ' ').trim();
    },
    async consultarHistorial(periodo) {
      this.cargandoHistorial = true;
      this.historialSeleccionado = {
        periodo,
        clubs: []
      };
      this.clubHistorialSeleccionado = null;
      try {
        const response = await getPeriodoDetalle(periodo.id);
        this.historialSeleccionado = response.data;
        this.clubHistorialSeleccionado = response.data?.clubs?.[0] || null;
        this.$nextTick(() => document.querySelector('.historial-periodo')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        }));
      } catch (error) {
        this.historialSeleccionado = null;
        this.$emit('show-error', error.message || 'No se pudo cargar el historial del ciclo');
      } finally {
        this.cargandoHistorial = false;
      }
    },
    cerrarHistorial() {
      this.historialSeleccionado = null;
      this.clubHistorialSeleccionado = null;
    },
    formatearFecha(fecha) {
      if (!fecha) return '-';
      const opts = {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      };
      return new Date(`${String(fecha).slice(0, 10)}T00:00:00`).toLocaleDateString('es-MX', opts);
    },
    obtenerFechaCompleta(fecha) {
      if (!fecha) return '-';
      const d = new Date(`${String(fecha).slice(0, 10)}T00:00:00`);
      const day = d.getDate();
      const opts = {
        month: 'long',
        year: 'numeric'
      };
      const monthYear = d.toLocaleDateString('es-MX', opts);
      return `${day} ${monthYear}`;
    },
    async cargarPeriodos() {
      try {
        const [resActivo, resTodos] = await Promise.all([getPeriodoActivo(), getPeriodos()]);
        if (resActivo.status === 'success' && resActivo.data) {
          this.periodoActivo = resActivo.data;
          this.periodoEditando = {
            ...resActivo.data
          };
          this.periodoOriginal = {
            ...resActivo.data
          };
          this.yaEditado = Number(this.periodoActivo.ya_editado) === 1;
        } else {
          this.periodoActivo = null;
          this.periodoEditando = {};
          this.periodoOriginal = {};
          this.yaEditado = false;
        }
        if (resTodos.status === 'success') {
          this.periodos = Array.isArray(resTodos.data) ? resTodos.data : [];
        }
      } catch (error) {
        this.$emit("show-error", "Error al cargar los períodos");
      }
    },
    habilitarEdicion() {
      this.editando = true;
    },
    cancelarEdicion() {
      this.periodoEditando = {
        ...this.periodoOriginal
      };
      this.editando = false;
    },
    async guardarCambios() {
      if (this.fechaInvalida || !this.hayCambios) return;
      this.guardando = true;
      try {
        const res = await updatePeriodo(this.periodoEditando.id, {
          nombre: this.periodoEditando.nombre,
          fecha_inicio: this.periodoEditando.fecha_inicio,
          fecha_fin: this.periodoEditando.fecha_fin,
          ya_editado: 1
        });
        if (res.status === 'success') {
          this.periodoOriginal = {
            ...this.periodoEditando
          };
          this.periodoActivo = {
            ...this.periodoEditando
          };
          this.periodoActivo.ya_editado = 1;
          this.yaEditado = true;
          this.editando = false;
          this.$emit("show-toast", "Período actualizado correctamente");
          this.$emit("log", {
            accion: "Editar",
            tipo: "periodo",
            descripcion: `Se actualizó el período ${this.periodoEditando.nombre}`
          });
        } else {
          throw new Error(res.message || "No se pudo guardar");
        }
      } catch (error) {
        this.$emit("show-error", "Error al guardar: " + (error.message || 'No se pudo actualizar'));
      } finally {
        this.guardando = false;
      }
    },
    async cerrarPeriodo() {
      this.procesando = true;
      this.mostrarModalConfirmacion = false;
      try {
        const res = await cerrarPeriodoApi();
        if (res.status === 'success') {
          this.$emit("log", {
            accion: "Cerrar",
            tipo: "periodo",
            descripcion: `Se finalizó el ciclo ${this.periodoActivo.nombre}`
          });
          this.$emit("show-toast", "El período se ha cerrado correctamente y se generó el nuevo ciclo.");
          await this.cargarPeriodos();
          this.$emit("request-reload-alumnos");
          this.$emit("refresh");
        } else {
          throw new Error(res.message || "No se pudo cerrar el período.");
        }
      } catch (error) {
        this.$emit("show-error", "Error crítico: " + (error.message || 'No se pudo cerrar el período'));
      } finally {
        this.procesando = false;
      }
    }
  }
};
</script>

<style scoped>
.btn, .table, .card, .badge {
  transition: none !important;
}
.table-hover tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.03) !important;
}
.form-control:disabled {
  background-color: #e9ecef;
  opacity: 0.7;
}
.history-club-card { width: 100%; min-height: 130px; padding: 16px; text-align: left; border: 2px solid #e2e8f0; border-radius: 12px; background: #fff; display: flex; flex-wrap: wrap; gap: 8px; align-content: flex-start; transition: .2s ease; }
.history-club-card:hover, .history-club-card.active { border-color: var(--brand); box-shadow: 0 7px 20px rgba(76,56,255,.14); }
.history-club-name { width: 100%; font-weight: 700; font-size: 1.05rem; color: #1e293b; }
.history-club-count { width: 100%; color: #64748b; font-size: .85rem; }
.historial-periodo { scroll-margin-top: 1rem; }
</style>
