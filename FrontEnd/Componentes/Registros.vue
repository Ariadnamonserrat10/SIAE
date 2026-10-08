<template>
  <div class="container-fluid py-2">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div><h4 class="text-primary mb-1">Registros complementarios</h4><small class="text-muted">Documentos e información básica de emergencia</small></div>
      <button class="btn btn-outline-secondary btn-sm" @click="cargarTodo">Actualizar</button>
    </div>
    <div v-if="mensaje" class="alert" :class="error ? 'alert-danger' : 'alert-success'">{{ mensaje }}</div>
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item" v-for="item in tabs" :key="item.id"><button class="nav-link" :class="{ active: tab === item.id }" @click="tab = item.id">{{ item.nombre }}</button></li>
    </ul>

    <div v-if="tab === 'documentos'" class="row g-3">
      <div class="col-lg-4"><div class="card shadow-sm"><div class="card-body">
        <h5>Registrar comprobante</h5>
        <label class="form-label">Tipo</label><select v-model="documento.tipo" class="form-select mb-2"><option>PAGO</option><option>REPOSICION_CONSTANCIA</option><option>OTRO</option></select>
        <label class="form-label">Alumno (opcional)</label>
        <div class="student-search mb-2">
          <input
            v-model="documentoBusqueda"
            class="form-control"
            type="search"
            autocomplete="off"
            placeholder="Escribe el nombre o número de control"
            @focus="mostrarResultadosDocumento = true"
            @input="reiniciarAlumnoDocumento"
            @blur="cerrarResultadosDocumento"
          >
          <div v-if="mostrarResultadosDocumento && documentoBusqueda.trim()" class="student-search-results">
            <button
              v-for="a in alumnosDocumentoFiltrados"
              :key="a.id"
              type="button"
              class="student-search-option"
              @mousedown.prevent="seleccionarAlumnoDocumento(a)"
            >
              <span>{{ nombreAlumno(a) }}</span>
              <small>{{ a.numeroControl || 'Sin número de control' }}</small>
            </button>
            <div v-if="!alumnosDocumentoFiltrados.length" class="student-search-empty">No se encontraron alumnos</div>
          </div>
        </div>
        <button v-if="documento.alumno_id" type="button" class="btn btn-link btn-sm px-0 mb-2" @click="quitarAlumnoDocumento">Quitar alumno seleccionado</button>
        <input v-model="documento.concepto" class="form-control mb-2" placeholder="Concepto">
        <input v-model="documento.monto" class="form-control mb-2" type="number" min="0" step="0.01" placeholder="Monto">
        <input class="form-control mb-3" type="file" accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,image/jpeg,image/png" @change="documento.archivo = $event.target.files[0]">
        <small class="text-muted d-block mb-2">Word (.doc y .docx), PDF, JPG o PNG; máximo 5 MB.</small>
        <button class="btn btn-primary w-100" :disabled="procesando || !documento.archivo" @click="guardarDocumento">Guardar y generar folio</button>
      </div></div></div>
      <div class="col-lg-8"><div class="card shadow-sm"><div class="table-responsive"><table class="table table-hover mb-0"><thead><tr><th>Folio</th><th>Tipo</th><th>Concepto</th><th>Fecha</th><th></th></tr></thead><tbody>
        <tr v-for="d in documentos" :key="d.id"><td><code>{{ d.folio }}</code></td><td>{{ d.tipo }}</td><td>{{ d.concepto || '-' }}</td><td>{{ fecha(d.creado_en) }}</td><td><button class="btn btn-sm btn-outline-primary" @click="descargar(d)">Ver</button></td></tr>
        <tr v-if="!documentos.length"><td colspan="5" class="text-center text-muted py-4">Sin documentos</td></tr>
      </tbody></table></div></div></div>
    </div>

    <div v-if="tab === 'medicos'" class="row justify-content-center"><div class="col-xl-8"><div class="card shadow-sm"><div class="card-body">
      <h5>Información básica para emergencias</h5><p class="text-muted">No se guardan expedientes, diagnósticos extensos, recetas ni documentos clínicos.</p>
      <div class="student-search mb-3">
        <input
          v-model="medicoBusqueda"
          class="form-control"
          type="search"
          autocomplete="off"
          placeholder="Buscar por nombre o número de control"
          @focus="mostrarResultadosMedicos = true"
          @input="reiniciarAlumnoMedico"
          @blur="cerrarResultadosMedicos"
        >
        <div v-if="mostrarResultadosMedicos && medicoBusqueda.trim()" class="student-search-results">
          <button
            v-for="a in alumnosMedicosFiltrados"
            :key="a.id"
            type="button"
            class="student-search-option"
            @mousedown.prevent="seleccionarAlumnoMedico(a)"
          >
            <span>{{ nombreAlumno(a) }}</span>
            <small>{{ a.numeroControl || 'Sin número de control' }}</small>
          </button>
          <div v-if="!alumnosMedicosFiltrados.length" class="student-search-empty">No se encontraron alumnos</div>
        </div>
      </div>
      <div v-if="alumnoMedico" class="row g-2"><div class="col-md-6"><input v-model="medicos.alergias" class="form-control" placeholder="Alergias importantes"></div><div class="col-md-6"><input v-model="medicos.restricciones_fisicas" class="form-control" placeholder="Restricciones físicas"></div><div class="col-12"><input v-model="medicos.condicion_emergencia" class="form-control" placeholder="Condición que requiera atención inmediata"></div><div class="col-md-6"><input v-model="medicos.contacto_emergencia" class="form-control" placeholder="Contacto de emergencia"></div><div class="col-md-6"><input v-model="medicos.telefono_emergencia" class="form-control" placeholder="Teléfono (solo números)"></div><div class="col-12"><textarea v-model="medicos.observaciones" class="form-control" maxlength="500" placeholder="Observaciones breves"></textarea></div><div class="col-12"><button class="btn btn-primary" :disabled="procesando" @click="guardarMedicos">Guardar información</button></div></div>
    </div></div></div></div>
  </div>
</template>

<script>
import { getDocumentos, uploadDocumento, getDatosMedicos, saveDatosMedicos } from '../Servicios/api';
import { openDocumentFile } from '../Servicios/archivos-documentos';
export default {
  name: 'Registros',
  props: {
    clubs: {
      type: Array,
      default: () => []
    },
    alumnos: {
      type: Array,
      default: () => []
    }
  },
  data: () => ({
    tab: 'documentos',
    tabs: [{
      id: 'documentos',
      nombre: 'Folios y comprobantes'
    }, {
      id: 'medicos',
      nombre: 'Emergencias'
    }],
    documentos: [],
    procesando: false,
    mensaje: '',
    error: false,
    documento: {
      tipo: 'PAGO',
      alumno_id: '',
      concepto: '',
      monto: '',
      archivo: null
    },
    documentoBusqueda: '',
    mostrarResultadosDocumento: false,
    alumnoMedico: '',
    medicoBusqueda: '',
    mostrarResultadosMedicos: false,
    medicos: {}
  }),
  computed: {
    alumnosDocumentoFiltrados() {
      const term = this.normalizarBusqueda(this.documentoBusqueda);
      if (!term) return [];
      return this.alumnos.filter(alumno => {
        const nombre = this.normalizarBusqueda(this.nombreAlumno(alumno));
        const control = this.normalizarBusqueda(alumno.numeroControl || '');
        return nombre.includes(term) || control.includes(term);
      }).slice(0, 20);
    },
    alumnosMedicosFiltrados() {
      const term = this.normalizarBusqueda(this.medicoBusqueda);
      if (!term) return [];
      return this.alumnos.filter(alumno => {
        const nombre = this.normalizarBusqueda(this.nombreAlumno(alumno));
        const control = this.normalizarBusqueda(alumno.numeroControl || '');
        return nombre.includes(term) || control.includes(term);
      }).slice(0, 20);
    }
  },
  mounted() {
    this.cargarTodo();
  },
  methods: {
    normalizarBusqueda(valor) {
      return String(valor || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
    },
    reiniciarAlumnoDocumento() {
      this.documento.alumno_id = '';
      this.mostrarResultadosDocumento = true;
    },
    cerrarResultadosDocumento() {
      setTimeout(() => {
        this.mostrarResultadosDocumento = false;
      }, 120);
    },
    seleccionarAlumnoDocumento(alumno) {
      this.documento.alumno_id = alumno.id;
      this.documentoBusqueda = `${this.nombreAlumno(alumno)} — ${alumno.numeroControl || 'Sin control'}`;
      this.mostrarResultadosDocumento = false;
    },
    quitarAlumnoDocumento() {
      this.documento.alumno_id = '';
      this.documentoBusqueda = '';
      this.mostrarResultadosDocumento = false;
    },
    reiniciarAlumnoMedico() {
      this.alumnoMedico = '';
      this.medicos = {};
      this.mostrarResultadosMedicos = true;
    },
    cerrarResultadosMedicos() {
      setTimeout(() => {
        this.mostrarResultadosMedicos = false;
      }, 120);
    },
    async seleccionarAlumnoMedico(alumno) {
      this.alumnoMedico = alumno.id;
      this.medicoBusqueda = `${this.nombreAlumno(alumno)} — ${alumno.numeroControl || 'Sin control'}`;
      this.mostrarResultadosMedicos = false;
      await this.cargarMedicos();
    },
    nombreAlumno(a) {
      return `${a.nombre} ${a.apellidoP} ${a.apellidoM || ''}`.trim();
    },
    fecha(v) {
      return v ? new Date(v).toLocaleDateString('es-MX') : '-';
    },
    avisar(texto, error = false) {
      this.mensaje = texto;
      this.error = error;
    },
    async cargarTodo() {
      try {
        this.documentos = await getDocumentos();
      } catch (e) {
        this.avisar(e.message, true);
      }
    },
    async descargar(documento) {
      try {
        const response = await fetch(`/api/documentos/${documento.id}`, {
          headers: {
            'X-Requested-With': 'SIAE'
          }
        });
        if (!response.ok) throw new Error('No se pudo abrir el documento');
        const blob = await response.blob();
        openDocumentFile(blob, documento.nombre_original);
      } catch (e) {
        this.avisar(e.message, true);
      }
    },
    async guardarDocumento() {
      this.procesando = true;
      try {
        const form = new FormData();
        Object.entries(this.documento).forEach(([k, v]) => {
          if (v !== '' && v != null) form.append(k === 'archivo' ? 'archivo' : k, v);
        });
        const result = await uploadDocumento(form);
        this.avisar(`Documento registrado con folio ${result.data.folio}`);
        this.documento = {
          tipo: 'PAGO',
          alumno_id: '',
          concepto: '',
          monto: '',
          archivo: null
        };
        this.documentoBusqueda = '';
        await this.cargarTodo();
      } catch (e) {
        this.avisar(e.message, true);
      } finally {
        this.procesando = false;
      }
    },
    async cargarMedicos() {
      if (!this.alumnoMedico) return;
      try {
        const result = await getDatosMedicos(this.alumnoMedico);
        this.medicos = result.data || {};
      } catch (e) {
        this.avisar(e.message, true);
      }
    },
    async guardarMedicos() {
      this.procesando = true;
      try {
        await saveDatosMedicos(this.alumnoMedico, this.medicos);
        this.avisar('Información de emergencia guardada');
      } catch (e) {
        this.avisar(e.message, true);
      } finally {
        this.procesando = false;
      }
    }
  }
};
</script>

<style scoped>
.student-search { position: relative; }
.student-search-results { position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 20; max-height: 300px; overflow-y: auto; padding: 6px; border: 1px solid #cbd5e1; border-radius: 10px; background: #fff; box-shadow: 0 12px 28px rgba(15, 23, 42, 0.16); }
.student-search-option { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%; padding: 10px 12px; border: 0; border-radius: 8px; background: transparent; color: #1e293b; text-align: left; }
.student-search-option:hover { background: #eef2ff; }
.student-search-option small { flex: 0 0 auto; color: #64748b; }
.student-search-empty { padding: 14px; color: #64748b; text-align: center; }
@media (max-width: 600px) {
  .student-search-option { align-items: flex-start; flex-direction: column; gap: 2px; }
}
</style>
