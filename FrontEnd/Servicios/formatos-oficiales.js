import { evaluationCriteria, performanceNames } from './reglas-evaluacion.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const date = value => String(value || '').slice(0, 10).split('-').reverse().join('/');
const fullName = student => [student.apellidoP, student.apellidoM, student.nombre].filter(Boolean).join(' ');

export function resultForStudent(student) {
  if (!student.evaluacion_id) return 'PENDIENTE DE EVALUACIÓN';
  // Conservar la regla de asistencia del programa además de la evaluación del monitor.
  return Number(student.faltas) >= 3 || Number(student.valor_numerico) < 1 ? 'NO ACREDITADO' : 'ACREDITADO';
}

export function renderOfficialFormat(code, data, details, studentId) {
  const header = `<header><b>INSTITUTO TECNOLÓGICO DE ${escape(details.instituto)}</b><p>Subdirección de Planeación y Vinculación<br>Departamento de Actividades Extraescolares<br>Oficina de Promoción Cultural o Deportiva</p></header>`;
  let body;
  if (code === '003-03') {
    body = `<h2>Resultados de Actividades Culturales y/o Deportivas</h2><p>Actividad: <b>${escape(data.club.nombre)}</b></p>
    <p>Periodo: ${escape(data.periodo.nombre)} (${date(data.periodo.fecha_inicio)} al ${date(data.periodo.fecha_fin)})</p>
    <table><thead><tr><th>No.</th><th>Nombre</th><th>No. control</th><th>Carrera</th><th>Sem.</th><th>Resultado</th><th>Firma de enterado</th></tr></thead><tbody>
    ${data.alumnos.map((student, index) => `<tr><td>${index + 1}</td><td>${escape(fullName(student))}</td><td>${escape(student.numeroControl)}</td><td>${escape(student.carrera_clave || student.carrera)}</td><td>${escape(student.semestre)}</td><td>${resultForStudent(student)}</td><td class="signature"></td></tr>`).join('')}</tbody></table>
    <p>Lugar y fecha: ${escape(details.lugar)}, ${date(details.fecha)}</p>
    <div class="signers">${[[details.promotor, 'Promotor Cultural o Deportivo'], [details.jefePromocion, 'Jefe de Oficina de Promoción Cultural o Deportiva'], [details.jefeActividades, 'Jefe de Departamento de Actividades Extraescolares']].map(([name, title]) => `<div><div class="handwriting"></div><b>${escape(name)}</b><br>${title}</div>`).join('')}</div>`;
  } else if (code === '003-04') {
    const student = data.alumnos.find(item => Number(item.id) === Number(studentId));
    if (!student?.evaluacion_id) throw new Error('El monitor debe guardar la evaluación antes de imprimirla.');
    body = `<h2>Evaluación de Actividades Culturales y/o Deportivas</h2>
      <p>Nombre del estudiante: <b>${escape(fullName(student))}</b></p><p>Actividad Cultural y/o Deportiva: ${escape(data.club.nombre)}</p>
      <p>Periodo de realización: ${date(data.periodo.fecha_inicio)} al ${date(data.periodo.fecha_fin)}</p>
      <table><thead><tr><th>No.</th><th>Criterios a evaluar</th>${performanceNames.map(name => `<th>${name}</th>`).join('')}</tr></thead><tbody>
      ${evaluationCriteria.map((criterion, index) => `<tr><td>${index + 1}</td><td>${escape(criterion)}</td>${performanceNames.map((_, level) => `<td class="mark">${Number(student['criterio_' + (index + 1)]) === level ? 'X' : ''}</td>`).join('')}</tr>`).join('')}</tbody></table>
      <p class="observations">Observaciones: ${escape(student.observaciones)}</p>
      <p>Valor numérico de la actividad: <b>${Number(student.valor_numerico).toFixed(2)}</b></p>
      <p>Nivel de desempeño alcanzado: <b>${escape(performanceNames[Number(student.nivel_desempeno)])}</b></p>`;
  } else throw new Error('Formato no compatible');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>TecNM-VI-PO-${code}</title><style>
    @page { size: letter; margin: 14mm; } body { font: 11px Arial,sans-serif; color: #000; margin: 0; }
    header { text-align:center; } h2 { font-size:15px; text-align:center; } p { line-height:1.6; }
    table { width:100%; border-collapse:collapse; } th,td { border:1px solid #000; padding:7px 5px; } th { font-size:10px; }
    thead { display:table-header-group; } tr { break-inside:avoid; } .signature { min-width:85px; height:32px; }
    .signers { display:flex; gap:20px; margin-top:30px; break-inside:avoid; text-align:center; } .signers>div { flex:1; }
    .handwriting { height:50px; border-bottom:1px solid #000; margin-bottom:6px; } .mark { text-align:center; }
    .observations { white-space:pre-wrap; min-height:60px; } footer { margin-top:25px; font-size:9px; }
    .toolbar { padding:16px; background:#eee; margin-bottom:20px; } @media print { .toolbar { display:none; } }
  </style></head><body>${header}${body}<footer>TecNM-VI-PO-${code} · Documento completado por SIAE</footer></body></html>`;
}

// Cada club o estudiante empieza en una hoja nueva; nunca mezclamos sus listas.
export function renderAllClubFormats(code, clubs, details) {
  const pages = [];
  for (const club of clubs) {
    const clubDetails = { ...details, promotor: club.promotor || '' };
    if (code === '003-03' && club.alumnos.length) pages.push(renderOfficialFormat(code, club, clubDetails));
    if (code === '003-04') {
      for (const student of club.alumnos.filter(student => student.evaluacion_id)) {
        pages.push(renderOfficialFormat(code, club, clubDetails, student.id));
      }
    }
  }
  if (!pages.length) throw new Error(code === '003-04' ? 'No hay evaluaciones guardadas para imprimir.' : 'No hay alumnos para imprimir.');
  const head = pages[0].slice(0, pages[0].indexOf('<body>'));
  const bodies = pages.map(page => `<section class="club-document">${page.split('<body>')[1].split('</body>')[0]}</section>`);
  return `${head}<body><style>.club-document + .club-document { break-before: page; margin-top: 30px; } @media print { .club-document + .club-document { margin-top:0; } }</style>${bodies.join('')}</body></html>`;
}
