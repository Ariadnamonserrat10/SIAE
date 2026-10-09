export const performanceNames = ['Insuficiente', 'Suficiente', 'Bueno', 'Notable', 'Excelente'];
export const evaluationCriteria = [
  'Cumple en tiempo y forma con las actividades encomendadas alcanzando los objetivos.',
  'Trabaja en equipo y se adapta a nuevas situaciones.',
  'Muestra liderazgo en las actividades encomendadas.',
  'Organiza su tiempo y trabaja de manera proactiva.',
  'Interpreta la realidad y se sensibiliza aportando soluciones a la problemática con la actividad Cultural y/o Deportiva.',
  'Realiza sugerencias innovadoras para beneficio o mejora del programa en el que participa.',
  'Tiene iniciativa para ayudar en las actividades encomendadas y muestra espíritu de servicio.'
];

export function calculateEvaluation(values) {
  if (values.length !== 7 || values.some(value => !Number.isInteger(value) || value < 0 || value > 4)) return null;
  const average = Math.round(values.reduce((sum, value) => sum + value, 0) / 7 * 100) / 100;
  const level = average >= 3.5 ? 4 : average >= 2.5 ? 3 : average >= 1.5 ? 2 : average >= 1 ? 1 : 0;
  return { valor_numerico: average, nivel_desempeno: level, desempeno: performanceNames[level] };
}
