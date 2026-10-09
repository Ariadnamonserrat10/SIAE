<template>
  <section class="card card-body mb-4">
    <h5>Formatos institucionales para todos los clubs</h5><p v-if="manage">Carga cada formato una sola vez. La versión actualizada se aplica a todos los clubs.</p>
    <p>003-01: registro de participantes. 003-03: resultados y firmas. 003-04: evaluación del monitor. 003-05: constancia.</p>
    <div v-if="message" class="alert" :class="failed ? 'alert-danger' : 'alert-success'" role="status">{{ message }}</div>
    <form v-if="manage" class="row g-2 align-items-end mb-3" @submit.prevent="upload">
      <div class="col-md-4"><label class="form-label">Nombre o ciclo (opcional)</label><input v-model="name" class="form-control" placeholder="Se usa el nombre del archivo si lo dejas vacío"></div>
      <div class="col-md-5"><label class="form-label">Formato Word (.doc o .docx, máximo 5 MB)</label><input ref="fileInput" type="file" class="form-control" accept=".doc,.docx" @change="file = $event.target.files[0] || null"></div>
      <div class="col-md-3"><button class="btn btn-primary w-100" :disabled="busy || !file">{{ busy ? 'Cargando…' : 'Cargar y ubicar automáticamente' }}</button></div>
      <div class="col-12"><label for="format-destination" class="form-label">¿Dónde usar este archivo?</label><select id="format-destination" v-model="destination" class="form-select"><option value="automatico">Detectar automáticamente</option><option value="registro">003-01 · Registro de participantes</option><option value="constancia">003-05 · Constancia</option><option value="resultados">Resultados del club y firmas</option><option value="evaluacion">Evaluación del monitor</option></select></div>
      <small>Se conserva el nombre original, por ejemplo TecNM-VI-PO-003-01.doc. Si no se reconoce su código, elige la sección. Esta selección no transforma su contenido ni adapta el diseño de impresión.</small>
    </form>
    <div v-for="template in templates" :key="template.codigo" class="border rounded p-2 mb-2">
      <strong>{{ template.codigo }} · {{ template.nombre }}</strong>
      <span class="ms-2">{{ template.documento?.nombre_original || 'Todavía no se ha cargado' }}</span>
      <button v-if="template.documento" class="btn btn-sm btn-outline-primary ms-2" @click="download(template.documento)">Descargar original</button><button v-if="manage && template.documento" class="btn btn-sm btn-outline-danger ms-2" :disabled="busy" @click="remove(template.documento)">Quitar formato</button>
    </div>
    <details v-if="manage && documents.length" class="mb-3"><summary>Formatos anteriores y documentos cargados</summary>
      <ul class="list-group mt-2"><li v-for="document in documents" :key="document.id" class="list-group-item">
        {{ document.nombre_original }} · {{ templates.find(item => item.codigo === document.formato_codigo)?.nombre || 'Referencia anterior' }}
        <button class="btn btn-sm btn-outline-primary ms-2" @click="download(document)">Descargar</button>
        <button v-if="document.formato_codigo" class="btn btn-sm btn-outline-success ms-2" @click="activate(document)">Usar este formato</button><button class="btn btn-sm btn-outline-danger ms-2" :disabled="busy" @click="remove(document)">Quitar</button>
      </li></ul>
    </details>
    <hr><h6>Preparar documentos {{ manage ? 'de todos los clubs' : 'del club' }}</h6>
    <p class="small text-muted">La impresión usa los campos del modelo 003-03 o 003-04. El diseño de un Word arbitrario no se convierte automáticamente. Las firmas siempre quedan en blanco.</p>
    <div class="row g-2">
      <div class="col-md-6"><label class="form-label">Clubs que se incluirán</label><select v-model="selectedClub" class="form-select" @change="loadData"><option value="">Selecciona un club</option><option v-if="manage" value="all">Todos los clubs</option><option v-for="club in availableClubs" :key="club.id" :value="club.id">{{ club.nombre }}</option></select></div>
      <div class="col-md-6"><label class="form-label">Instituto Tecnológico de</label><input v-model="details.instituto" class="form-control" placeholder="Nombre del plantel"></div>
    </div>
    <p v-if="loadingData" role="status">Preparando los datos de los clubs…</p><template v-if="data"><p v-if="selectedClub === 'all'">Cada club se imprime en hojas separadas. Las evaluaciones pendientes no se incluyen en el 003-04.</p>
      <p class="mt-3">Periodo: <strong>{{ data.periodo.nombre }}</strong>. {{ data.alumnos.length }} alumnos. {{ pending }} evaluaciones pendientes. <button class="btn btn-sm btn-outline-secondary" @click="loadData">Actualizar datos</button></p>
      <div class="row g-2 mb-3">
        <div class="col-md-6"><label class="form-label">Lugar de emisión</label><input v-model="details.lugar" class="form-control"></div>
        <div class="col-md-6"><label class="form-label">Fecha de emisión</label><input v-model="details.fecha" type="date" class="form-control"></div>
        <div v-if="selectedClub !== 'all'" class="col-md-4"><label class="form-label">Promotor cultural o deportivo</label><input v-model="details.promotor" class="form-control"></div>
        <div class="col-md-4"><label class="form-label">Jefe de oficina de promoción</label><input v-model="details.jefePromocion" class="form-control"></div>
        <div class="col-md-4"><label class="form-label">Jefe de actividades extraescolares</label><input v-model="details.jefeActividades" class="form-control"></div>
      </div>
      <button class="btn btn-outline-primary mb-3" :disabled="busy || !active('003-03') || !data.alumnos.length" @click="print('003-03')">Preparar 003-03 · Resultados y firmas</button>
      <button v-if="selectedClub === 'all'" class="btn btn-outline-primary d-block" :disabled="busy || !active('003-04') || !data.alumnos.some(student => student.evaluacion_id)" @click="print('003-04')">Preparar 003-04 · Todas las evaluaciones guardadas</button><div v-else class="row g-2"><div class="col-md-8"><label class="form-label">Estudiante para evaluación individual</label><select v-model="studentId" class="form-select"><option value="">Selecciona un estudiante</option><option v-for="student in data.alumnos" :key="student.id" :value="student.id">{{ student.apellidoP }} {{ student.apellidoM }} {{ student.nombre }} {{ student.evaluacion_id ? '' : '(evaluación pendiente)' }}</option></select></div>
      <div class="col-md-4 d-flex align-items-end"><button class="btn btn-outline-primary" :disabled="busy || !active('003-04') || !studentId" @click="print('003-04')">Preparar 003-04 · Evaluación</button></div></div>
    </template>
    <div v-if="previewHtml" class="format-preview" role="dialog" aria-modal="true" aria-label="Vista previa del documento">
      <div class="bg-white p-3 h-100 d-flex flex-column">
        <div class="d-flex justify-content-between mb-2"><h5>Vista previa · Revise los datos antes de imprimir</h5><div><button class="btn btn-primary me-2" @click="$refs.preview.contentWindow.print()">Imprimir / Guardar PDF</button><button class="btn btn-secondary" @click="previewHtml = ''">Cerrar vista previa</button></div></div>
        <iframe ref="preview" :srcdoc="previewHtml" title="Documento completado" sandbox="allow-same-origin allow-modals" class="flex-grow-1 w-100 border"></iframe>
      </div>
    </div>
  </section>
</template>

<script>
import { getClubs, getDocumentos, getFirmas, saveConfig, uploadDocumento } from '../Servicios/api';
import { request } from '../Servicios/peticiones';
import { authService } from '../Servicios/sesion-panel';
import { openDocumentFile } from '../Servicios/archivos-documentos';
import { renderOfficialFormat, renderAllClubFormats } from '../Servicios/formatos-oficiales';
export default {
  props: { manage: Boolean, clubId: [Number, String] },
  data: () => ({ name: '', destination: 'automatico', file: null, busy: false, loadingData: false, clubData: [], message: '', failed: false, templates: [], documents: [], clubs: [], selectedClub: '', studentId: '', data: null, previewHtml: '',
    details: { instituto: '', lugar: '', fecha: new Date().toLocaleDateString('en-CA'), promotor: '', jefePromocion: '', jefeActividades: '' } }),
  computed: {
    availableClubs() { return this.clubId ? this.clubs.filter(club => Number(club.id) === Number(this.clubId)) : this.clubs; },
    pending() { return this.data?.alumnos.filter(student => !student.evaluacion_id).length || 0; }
  },
  watch: { clubId(value) { this.selectedClub = value || ''; this.loadData(); } },
  methods: {
    active(code) { return this.templates.find(template => template.codigo === code)?.documento; },
    error(error) { this.failed = true; this.message = error.message || 'No se pudo completar la operación'; },
    async refresh() {
      this.templates = (await request('/api/formatos')).data;
      if (this.manage) this.documents = (await getDocumentos({ tipo: 'OTRO', limit: 200 })).filter(document => /^FORMATO_(REGISTRO|EVALUACION|RESULTADOS|CONSTANCIA):/.test(document.concepto || ''));
    },
    async upload() {
      if (!this.file) return;
      if (this.file.size > 5 * 1024 * 1024) return this.error(new Error('El documento no debe exceder 5 MB.'));
      this.busy = true;
      try {
        const form = new FormData();
        form.append('archivo', this.file); form.append('tipo', 'OTRO'); form.append('uso', 'formato'); form.append('nombre', this.name); form.append('destino', this.destination);
        const result = await uploadDocumento(form);
        this.failed = false; this.message = `${result.data.nombre_original} actualizado para todos los clubs en: ${result.data.destino}.`;
        this.file = null; this.name = ''; this.$refs.fileInput.value = '';
        await this.refresh();
      } catch (error) { this.error(error); } finally { this.busy = false; }
    },
    async activate(document) {
      try {
        const type = this.templates.find(item => item.codigo === document.formato_codigo);
        if (!type) throw new Error('Carga nuevamente el archivo para reconocer su sección.');
        await saveConfig(type.clave, String(document.id));
        await this.refresh(); this.failed = false; this.message = 'Formato vigente actualizado para todos los clubs.';
      } catch (error) { this.error(error); }
    },
    async remove(document) {
      this.busy = true;
      try {
        await request(`/api/formatos/${document.id}`, { method: 'DELETE' });
        await this.refresh(); this.previewHtml = '';
        this.failed = false; this.message = 'Formato retirado para todos los clubs. Puedes cargar una versión actualizada. El original se conserva para auditoría.';
      } catch (error) { this.error(error); } finally { this.busy = false; }
    },
    async download(document) {
      try {
        const response = await fetch(`/api/documentos/${document.id}`, { headers: { 'X-Requested-With': 'SIAE' } });
        if (!response.ok) throw new Error('No se pudo descargar el documento.');
        openDocumentFile(await response.blob(), document.nombre_original);
      } catch (error) { this.error(error); }
    },
    async loadData() {
      this.data = null; this.studentId = ''; this.clubData = []; this.previewHtml = '';
      const club = this.selectedClub;
      if (!club) { this.loadingData = false; return; }
      this.loadingData = true;
      try {
        const ids = club === 'all' && this.manage ? this.availableClubs.map(item => item.id) : [club];
        const results = [];
        // Limitar las consultas simultáneas cuando hay muchos clubs.
        for (let index = 0; index < ids.length; index += 4) {
          results.push(...await Promise.all(ids.slice(index, index + 4).map(id => request(`/api/formatos/datos?club_id=${encodeURIComponent(id)}`))));
        }
        if (String(club) !== String(this.selectedClub)) return;
        this.clubData = results.map(result => result.data);
        if (!results.length) return;
        this.data = club === 'all' ? { ...results[0].data, alumnos: this.clubData.flatMap(item => item.alumnos) } : results[0].data;
        this.details.promotor = club === 'all' ? '' : this.data.promotor;
      } catch (error) { this.error(error); } finally { if (String(club) === String(this.selectedClub)) this.loadingData = false; }
    },
    print(code) {
      try {
        if (!this.details.instituto.trim()) throw new Error('Completa el nombre del plantel antes de imprimir.');
        if (code === '003-03' && (!this.details.lugar.trim() || !this.details.fecha)) throw new Error('Completa el lugar y la fecha de emisión.');
        if (!this.active(code)) throw new Error('Primero carga un formato vigente.');
        this.previewHtml = this.selectedClub === 'all' ? renderAllClubFormats(code, this.clubData, this.details) : renderOfficialFormat(code, this.data, this.details, this.studentId);
      } catch (error) { this.error(error); }
    }
  },
  async mounted() {
    try {
      await this.refresh();
      this.clubs = await getClubs();
      const names = await getFirmas();
      this.details.jefePromocion = names.jefe_promocion?.nombre || '';
      this.details.jefeActividades = names.jefe_actividades?.nombre || '';
      if (this.clubId || this.manage) { this.selectedClub = this.clubId || 'all'; await this.loadData(); }
    } catch (error) { this.error(error); }
  }
};
</script>
<style scoped>
.format-preview { position: fixed; inset: 0; z-index: 1080; padding: 20px; background: #0008; }
</style>
