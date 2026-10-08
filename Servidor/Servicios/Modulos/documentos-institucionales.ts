import JSZip from 'jszip';
import { getDocumentFormat } from './formato-documentos';

export const templateTypes = {
  '003-01': { prefix: 'FORMATO_REGISTRO:', key: 'formato_registro_activo', name: 'Registro de participantes' },
  '003-03': { prefix: 'FORMATO_RESULTADOS:', key: 'formato_resultados_activo', name: 'Resultados del club y firmas' },
  '003-04': { prefix: 'FORMATO_EVALUACION:', key: 'formato_evaluacion_activo', name: 'Evaluación del monitor' },
  '003-05': { prefix: 'FORMATO_CONSTANCIA:', key: 'formato_constancia_activo', name: 'Constancia' }
} as const;

// La sección elegida no cambia el nombre ni el contenido del archivo original.
export function chooseTemplate(detectedCode: keyof typeof templateTypes | null, destination: unknown) {
  const choices = { registro: '003-01', resultados: '003-03', evaluacion: '003-04', constancia: '003-05' } as const;
  if (destination && destination !== 'automatico' && !Object.hasOwn(choices, String(destination))) return null;
  const code = destination && destination !== 'automatico'
    ? choices[destination as keyof typeof choices] : detectedCode;
  return code ? { code, ...templateTypes[code] } : null;
}

// Solo leemos texto. Las instrucciones de Word nunca se ejecutan como código.
export async function inspectDocument(filename: string, mime: string, data: Buffer) {
  let format = getDocumentFormat(filename, mime, data);
  let text = '';
  if (/\.docx$/i.test(filename)) {
    try {
      const zip = await JSZip.loadAsync(data);
      if (!zip.file('[Content_Types].xml') || !zip.file('word/document.xml')) return null;
      if (Object.keys(zip.files).some(name => /vbaProject|embeddings\//i.test(name))) return null;
      const entries = Object.values(zip.files).filter(entry => /^word\/(document|header\d*|footer\d*)\.xml$/.test(entry.name));
      let total = 0;
      for (const entry of entries) {
        const xml = await new Promise<string>((resolve, reject) => {
          const chunks: Buffer[] = [];
          const stream = entry.nodeStream();
          stream.on('data', (chunk: Buffer) => {
            total += chunk.length;
            if (total > 2 * 1024 * 1024) { stream.pause(); reject(new Error('Documento demasiado complejo')); return; }
            chunks.push(chunk);
          });
          stream.on('error', reject);
          stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        });
        text += xml.replace(/<[^>]+>/g, '') + '\n';
      }
      format = { extension: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
    } catch { return null; }
  } else if (format?.extension === 'doc') {
    // Los .doc antiguos pueden almacenar texto ANSI o UTF-16.
    text = data.toString('latin1') + '\n' + data.toString('utf16le');
  }
  if (!format) return null;
  const codes = (value: string) => [...new Set(value.toUpperCase().match(/TECNM[\s_-]*VI[\s_-]*PO[\s_-]*003[\s_-]*(?:01|03|04|05)(?!\d)/g)?.map(code => code.replace(/[\s_]+/g, '-').slice(-6)) || [])];
  const contentCodes = codes(text);
  const filenameCodes = codes(filename);
  // Un nombre contradictorio o dos códigos diferentes requieren revisión humana.
  const candidates = [...new Set([...contentCodes, ...filenameCodes])];
  const code = candidates.length === 1 ? candidates[0] as keyof typeof templateTypes : null;
  return { ...format, code, template: code ? templateTypes[code] : null };
}
