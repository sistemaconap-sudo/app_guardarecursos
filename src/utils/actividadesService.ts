/**
 * 📅 Actividades Service
 * 
 * Servicio centralizado que maneja toda la lógica funcional del módulo de Planificación de Actividades,
 * separando la lógica de negocio de la presentación.
 * 
 * @module utils/actividadesService
 */

import { Actividad } from '../types';

/**
 * Interface para los datos del formulario de actividades
 */
export interface ActividadFormData {
  codigo: string;
  tipo: string;
  descripcion: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  coordenadas: { lat: number; lng: number };
  guardarecurso: string;
}

/**
 * Tipos de actividad disponibles
 */
export type TipoActividad = 
  | 'Patrullaje de Control y Vigilancia'
  | 'Actividades de Prevención y Atención de Incendios Forestales'
  | 'Mantenimiento de Área Protegida'
  | 'Reforestación de Área Protegida'
  | 'Mantenimiento de Reforestación';

/**
 * Mapeo de IDs a nombres de tipos de actividad
 * Para usar en carga masiva CSV
 */
export const TIPO_ID_MAP: Record<string, TipoActividad> = {
  '1': 'Patrullaje de Control y Vigilancia',
  '2': 'Actividades de Prevención y Atención de Incendios Forestales',
  '3': 'Mantenimiento de Área Protegida',
  '4': 'Reforestación de Área Protegida',
  '5': 'Mantenimiento de Reforestación'
};

/**
 * Estados de actividad
 */
export type EstadoActividad = 'Programada' | 'En Progreso' | 'Completada';

/**
 * Configuración de tipos de actividad con colores e iconos
 */
export const TIPOS_CONFIG = {
  'Patrullaje de Control y Vigilancia': {
    bg: 'bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
    icon: 'Binoculars',
    color: '#3b82f6'
  },
  'Actividades de Prevención y Atención de Incendios Forestales': {
    bg: 'bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/40 dark:to-orange-900/40',
    text: 'text-red-700 dark:text-red-300',
    badge: 'bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/40 dark:to-orange-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800',
    icon: 'Flame',
    color: '#ef4444'
  },
  'Mantenimiento de Área Protegida': {
    bg: 'bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40',
    text: 'text-orange-700 dark:text-orange-300',
    badge: 'bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
    icon: 'Wrench',
    color: '#f97316'
  },
  'Reforestación de Área Protegida': {
    bg: 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40',
    text: 'text-green-700 dark:text-green-300',
    badge: 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800',
    icon: 'TreePine',
    color: '#10b981'
  },
  'Mantenimiento de Reforestación': {
    bg: 'bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/40 dark:to-cyan-900/40',
    text: 'text-teal-700 dark:text-teal-300',
    badge: 'bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/40 dark:to-cyan-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
    icon: 'Sprout',
    color: '#14b8a6'
  }
} as const;

/**
 * Configuración de estados de actividad
 */
export const ESTADOS_CONFIG = {
  'Programada': {
    label: 'Programada',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-300 dark:border-blue-700',
    icon: 'Clock',
    color: '#3b82f6',
    bg: 'bg-blue-100 dark:bg-blue-900/30'
  },
  'En Progreso': {
    label: 'En Progreso',
    badgeClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700',
    icon: 'Play',
    color: '#eab308',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30'
  },
  'Completada': {
    label: 'Completada',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700',
    icon: 'CheckCircle',
    color: '#10b981',
    bg: 'bg-green-100 dark:bg-green-900/30'
  }
} as const;

/**
 * Filtra actividades programadas según búsqueda, tipo y guardarecurso
 * SOLO muestra actividades con estado "Programada"
 * 
 * @param actividades - Lista completa de actividades
 * @param searchTerm - Término de búsqueda
 * @param selectedTipo - Tipo seleccionado o 'todos'
 * @param selectedGuardarecurso - Guardarecurso seleccionado o 'todos'
 * @returns Array de actividades filtradas
 * 
 * @example
 * const filtered = filterActividadesProgramadas(actividades, searchTerm, tipo, guardarecurso);
 */
export function filterActividadesProgramadas(
  actividades: Actividad[],
  searchTerm: string,
  selectedTipo: string,
  selectedGuardarecurso: string
): Actividad[] {
  return actividades.filter(a => {
    // SOLO mostrar actividades Programadas (no mostrar En Progreso ni Completadas)
    const isProgramada = a.estado === 'Programada';
    
    const matchesSearch = 
      a.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = selectedTipo === 'todos' || a.tipo === selectedTipo;
    const matchesGuardarecurso = selectedGuardarecurso === 'todos' || a.guardarecurso === selectedGuardarecurso;
    
    return isProgramada && matchesSearch && matchesTipo && matchesGuardarecurso;
  });
}

/**
 * Crea una nueva actividad con valores predeterminados
 * Siempre se crea con estado "Programada"
 * 
 * @param formData - Datos del formulario
 * @returns Nuevo objeto Actividad
 * 
 * @example
 * const nuevaActividad = createActividad(formData);
 * // nuevaActividad.estado === 'Programada'
 */
export function createActividad(formData: ActividadFormData): Actividad {
  return {
    id: Date.now().toString(),
    codigo: formData.codigo,
    tipo: formData.tipo as TipoActividad,
    descripcion: formData.descripcion,
    fecha: formData.fecha,
    horaInicio: formData.horaInicio,
    horaFin: formData.horaFin,
    coordenadas: formData.coordenadas.lat === 0 && formData.coordenadas.lng === 0 
      ? undefined 
      : formData.coordenadas,
    guardarecurso: formData.guardarecurso,
    areaProtegida: '', // Se puede completar después
    estado: 'Programada', // Siempre se crea como Programada
    evidencias: [],
    hallazgos: []
  };
}

/**
 * Actualiza una actividad existente
 * 
 * @param actividad - Actividad a actualizar
 * @param formData - Datos del formulario
 * @returns Actividad actualizada
 * 
 * @example
 * const actualizada = updateActividad(existente, formData);
 */
export function updateActividad(
  actividad: Actividad,
  formData: ActividadFormData
): Partial<Actividad> {
  return {
    codigo: formData.codigo,
    tipo: formData.tipo as TipoActividad,
    descripcion: formData.descripcion,
    fecha: formData.fecha,
    horaInicio: formData.horaInicio,
    horaFin: formData.horaFin,
    coordenadas: formData.coordenadas.lat === 0 && formData.coordenadas.lng === 0 
      ? undefined 
      : formData.coordenadas,
    guardarecurso: formData.guardarecurso
  };
}

/**
 * Obtiene la configuración de colores según el tipo de actividad
 * 
 * @param tipo - Tipo de actividad
 * @returns Objeto con clases CSS de fondo, texto y badge
 * 
 * @example
 * const colors = getTipoColor('Patrullaje de Control y Vigilancia');
 * <div className={colors.bg}>...</div>
 */
export function getTipoColor(tipo: string) {
  return TIPOS_CONFIG[tipo as TipoActividad] || {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-700 dark:text-gray-300',
    badge: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600',
    icon: 'CalendarIcon',
    color: '#6b7280'
  };
}

/**
 * Obtiene el nombre del icono según el tipo de actividad
 * 
 * @param tipo - Tipo de actividad
 * @returns Nombre del icono de lucide-react
 * 
 * @example
 * const iconName = getTipoIcon('Patrullaje de Control y Vigilancia'); // 'Binoculars'
 */
export function getTipoIcon(tipo: string): string {
  const config = TIPOS_CONFIG[tipo as TipoActividad];
  return config?.icon || 'CalendarIcon';
}

/**
 * Obtiene la clase CSS del badge según el estado
 * 
 * @param estado - Estado de la actividad
 * @returns Clase CSS para el badge
 * 
 * @example
 * const badgeClass = getEstadoBadgeClass('Programada');
 * <Badge className={badgeClass}>Programada</Badge>
 */
export function getEstadoBadgeClass(estado: EstadoActividad): string {
  return ESTADOS_CONFIG[estado]?.badgeClass || ESTADOS_CONFIG['Programada'].badgeClass;
}

/**
 * Obtiene el nombre del icono según el estado
 * 
 * @param estado - Estado de la actividad
 * @returns Nombre del icono de lucide-react
 * 
 * @example
 * const iconName = getEstadoIcon('Programada'); // 'Clock'
 */
export function getEstadoIcon(estado: EstadoActividad): string {
  return ESTADOS_CONFIG[estado]?.icon || ESTADOS_CONFIG['Programada'].icon;
}

/**
 * Obtiene información completa del estado
 * 
 * @param estado - Estado de la actividad
 * @returns Objeto con icon, color, bg y badge
 * 
 * @example
 * const info = getEstadoInfo('Programada');
 * const Icon = info.icon; // Lucide icon component
 */
export function getEstadoInfo(estado: EstadoActividad) {
  const config = ESTADOS_CONFIG[estado];
  return {
    icon: config?.icon || 'AlertCircle',
    color: `text-${config?.color || 'gray'}-600`,
    bg: config?.bg || 'bg-gray-100 dark:bg-gray-700',
    badge: config?.badgeClass || 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20'
  };
}

/**
 * Crea un formulario vacío con valores predeterminados
 * 
 * @returns Objeto de formulario vacío
 * 
 * @example
 * const emptyForm = createEmptyFormData();
 */
export function createEmptyFormData(): ActividadFormData {
  return {
    codigo: '',
    tipo: '',
    descripcion: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    coordenadas: { lat: 0, lng: 0 },
    guardarecurso: ''
  };
}

/**
 * Convierte una actividad a datos de formulario
 * 
 * @param actividad - Actividad a convertir
 * @returns Datos de formulario
 * 
 * @example
 * const formData = actividadToFormData(actividad);
 */
export function actividadToFormData(actividad: Actividad): ActividadFormData {
  return {
    codigo: actividad.codigo || '',
    tipo: actividad.tipo,
    descripcion: actividad.descripcion,
    fecha: actividad.fecha,
    horaInicio: actividad.horaInicio,
    horaFin: actividad.horaFin || '',
    coordenadas: actividad.coordenadas || { lat: 0, lng: 0 },
    guardarecurso: actividad.guardarecurso
  };
}

/**
 * Obtiene todos los tipos de actividad disponibles
 * 
 * @returns Array de tipos de actividad
 * 
 * @example
 * const tipos = getAllTipos();
 * tipos.map(t => <option>{t}</option>)
 */
export function getAllTipos(): TipoActividad[] {
  return [
    'Patrullaje de Control y Vigilancia',
    'Actividades de Prevención y Atención de Incendios Forestales',
    'Mantenimiento de Área Protegida',
    'Reforestación de Área Protegida',
    'Mantenimiento de Reforestación'
  ];
}

/**
 * Obtiene todos los estados disponibles
 * 
 * @returns Array de estados
 * 
 * @example
 * const estados = getAllEstados();
 */
export function getAllEstados(): EstadoActividad[] {
  return ['Programada', 'En Progreso', 'Completada'];
}

// ============================================================================
// CARGA MASIVA DE ACTIVIDADES (CSV)
// ============================================================================

/**
 * Interface para el resultado de carga masiva
 */
export interface BulkUploadResult {
  actividadesCargadas: number;
  actividadesConError: number;
  errores: string[];
  actividades: Actividad[];
}

/**
 * Valida y formatea una fecha en diferentes formatos
 * Acepta: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
 * 
 * @param fechaStr - Fecha en formato string
 * @returns Fecha formateada en YYYY-MM-DD o null si es inválida
 * 
 * @example
 * validarYFormatearFecha('2025-11-15'); // '2025-11-15'
 * validarYFormatearFecha('15/11/2025'); // '2025-11-15'
 * validarYFormatearFecha('invalid'); // null
 */
export function validarYFormatearFecha(fechaStr: string): string | null {
  if (!fechaStr) return null;
  
  // Limpiar espacios y caracteres extraños
  fechaStr = fechaStr.trim();
  
  // Si ya está en formato YYYY-MM-DD, validar y devolver
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
    const fecha = new Date(fechaStr + 'T00:00:00');
    if (!isNaN(fecha.getTime())) {
      return fechaStr;
    }
  }
  
  // Formato DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaStr)) {
    const [day, month, year] = fechaStr.split('/');
    const fechaFormateada = `${year}-${month}-${day}`;
    // Validar que la fecha sea válida
    const fecha = new Date(fechaFormateada + 'T00:00:00');
    if (!isNaN(fecha.getTime())) {
      return fechaFormateada;
    }
    return null;
  }
  
  // Formato MM/DD/YYYY (menos común, pero por si acaso)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(fechaStr)) {
    const fecha = new Date(fechaStr);
    if (!isNaN(fecha.getTime())) {
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  
  // Intentar crear una fecha válida con el formato ajustado
  const fecha = new Date(fechaStr + 'T00:00:00');
  
  // Verificar si la fecha es válida
  if (isNaN(fecha.getTime())) {
    return null;
  }
  
  // Formatear en formato YYYY-MM-DD
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Genera el contenido CSV de la plantilla de carga masiva
 * Incluye headers, guía de IDs de tipos de actividad y ejemplos
 * 
 * @returns Contenido CSV como string
 * 
 * @example
 * const csv = generateTemplateCSV();
 * // Descargar como archivo
 */
export function generateTemplateCSV(): string {
  const headers = [
    'codigo',
    'tipo',
    'descripcion',
    'fecha',
    'horaInicio'
  ];
  
  // Obtener fechas de ejemplo (hoy + 7 días y hoy + 14 días)
  const hoy = new Date();
  const fecha1 = new Date(hoy);
  fecha1.setDate(fecha1.getDate() + 7);
  const fecha2 = new Date(hoy);
  fecha2.setDate(fecha2.getDate() + 14);
  
  const formatoFecha = (fecha: Date) => {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const ejemploRow1 = [
    'ACT-001',
    '1',
    'Recorrido de vigilancia en el sector norte del área protegida',
    formatoFecha(fecha1),
    '08:00'
  ];
  
  const ejemploRow2 = [
    'ACT-002',
    '2',
    'Inspección de puntos críticos de riesgo de incendios',
    formatoFecha(fecha2),
    '09:00'
  ];
  
  // Comentarios con guía de tipos AL FINAL (usando # como comentario)
  // Esto evita que Excel corrompa el CSV
  const comentariosGuia = [
    '',
    '',
    '# ========================================',
    '# GUIA DE TIPOS DE ACTIVIDAD:',
    '# ========================================',
    '# 1 = Patrullaje de Control y Vigilancia',
    '# 2 = Actividades de Prevención y Atención de Incendios Forestales',
    '# 3 = Mantenimiento de Área Protegida',
    '# 4 = Reforestación de Área Protegida',
    '# 5 = Mantenimiento de Reforestación',
    '#',
    '# ========================================',
    '# INSTRUCCIONES:',
    '# ========================================',
    '# - En la columna "tipo" coloque el ID del tipo (1, 2, 3, 4 o 5)',
    '# - Fecha debe estar en formato YYYY-MM-DD (ej: 2025-11-15) o DD/MM/YYYY (ej: 15/11/2025)',
    '# - Hora debe estar en formato HH:MM (ej: 08:00)',
    '# - Puede eliminar estas líneas de comentario antes de cargar el archivo',
    '#'
  ];
  
  return [
    headers.join(','),
    ejemploRow1.join(','),
    ejemploRow2.join(','),
    // Agregar filas vacías para facilitar el llenado
    Array(headers.length).fill('').join(','),
    Array(headers.length).fill('').join(','),
    Array(headers.length).fill('').join(','),
    ...comentariosGuia
  ].join('\n');
}

/**
 * Procesa un archivo CSV y crea actividades
 * Valida campos requeridos y formatos de fecha
 * 
 * @param csvText - Contenido del archivo CSV
 * @param guardarecursoAsignado - ID del guardarecurso a asignar a todas las actividades
 * @returns Resultado con actividades creadas y errores
 * 
 * @example
 * const result = processBulkUploadCSV(csvContent, '1');
 * // result.actividadesCargadas: 5
 * // result.errores: ['Línea 3: Falta fecha', ...]
 */
export function processBulkUploadCSV(
  csvText: string,
  guardarecursoAsignado: string
): BulkUploadResult {
  const lines = csvText.split('\n');
  
  // Filtrar líneas de comentarios (que empiezan con #)
  const lineasSinComentarios = lines.filter(line => !line.trim().startsWith('#'));
  
  const headers = lineasSinComentarios[0].split(',').map(h => h.trim());
  
  let actividadesCargadas = 0;
  let actividadesConError = 0;
  const errores: string[] = [];
  const actividades: Actividad[] = [];
  
  // Procesar cada línea (excepto la primera que son los headers)
  for (let i = 1; i < lineasSinComentarios.length; i++) {
    const line = lineasSinComentarios[i].trim();
    if (!line) continue;
    
    const values = line.split(',').map(v => v.trim());
    
    // Verificar si la línea está completamente vacía (solo comas)
    const tieneAlgunDato = values.some(v => v !== '');
    if (!tieneAlgunDato) continue;
    
    if (values.length < headers.length) continue;
    
    const actividadData: any = {};
    headers.forEach((header, index) => {
      actividadData[header] = values[index];
    });
    
    // Validar campos requeridos
    if (!actividadData.codigo) {
      errores.push(`Línea ${i + 1}: Falta código`);
      actividadesConError++;
      continue;
    }
    
    if (!actividadData.tipo) {
      errores.push(`Línea ${i + 1} (${actividadData.codigo}): Falta tipo de actividad`);
      actividadesConError++;
      continue;
    }
    
    if (!actividadData.fecha) {
      errores.push(`Línea ${i + 1} (${actividadData.codigo}): Falta fecha`);
      actividadesConError++;
      continue;
    }
    
    // Convertir ID de tipo a nombre completo
    let tipoActividad: TipoActividad;
    if (TIPO_ID_MAP[actividadData.tipo]) {
      tipoActividad = TIPO_ID_MAP[actividadData.tipo];
    } else {
      // Si no es un ID válido, intentar usar como nombre directo
      tipoActividad = actividadData.tipo as TipoActividad;
    }
    
    // Validar y formatear la fecha
    const fechaFormateada = validarYFormatearFecha(actividadData.fecha);
    if (!fechaFormateada) {
      errores.push(`Línea ${i + 1} (${actividadData.codigo}): Fecha inválida "${actividadData.fecha}". Use formato YYYY-MM-DD (ej: 2025-11-15)`);
      actividadesConError++;
      continue;
    }
    
    // Crear la nueva actividad
    const nuevaActividad: Actividad = {
      id: Date.now().toString() + '-' + i,
      codigo: actividadData.codigo,
      tipo: tipoActividad,
      descripcion: actividadData.descripcion || '',
      fecha: fechaFormateada,
      horaInicio: actividadData.horaInicio || '08:00',
      horaFin: '',
      guardarecurso: guardarecursoAsignado,
      areaProtegida: '',
      estado: 'Programada',
      evidencias: [],
      hallazgos: []
    };
    
    actividades.push(nuevaActividad);
    actividadesCargadas++;
  }
  
  return {
    actividadesCargadas,
    actividadesConError,
    errores,
    actividades
  };
}

/**
 * Genera un mensaje de resumen del resultado de carga masiva
 * 
 * @param result - Resultado de la carga masiva
 * @returns Mensaje formateado
 * 
 * @example
 * const mensaje = generateBulkUploadSummary(result);
 * alert(mensaje);
 */
export function generateBulkUploadSummary(result: BulkUploadResult): string {
  let mensaje = '';
  
  if (result.actividadesCargadas > 0) {
    mensaje += `✓ ${result.actividadesCargadas} actividades cargadas exitosamente`;
  }
  
  if (result.actividadesConError > 0) {
    if (mensaje) mensaje += '\n\n';
    mensaje += `⚠ ${result.actividadesConError} actividades con errores:\n\n`;
    mensaje += result.errores.slice(0, 5).join('\n');
    if (result.errores.length > 5) {
      mensaje += `\n... y ${result.errores.length - 5} errores más (ver consola)`;
    }
  }
  
  if (!mensaje) {
    mensaje = '⚠ No se procesaron actividades. Verifique el archivo.';
  }
  
  return mensaje;
}

/**
 * Servicio principal de Actividades
 * Agrupa todas las funcionalidades en un objeto cohesivo
 */
export const actividadesService = {
  // Configuración
  TIPOS_CONFIG,
  ESTADOS_CONFIG,
  
  // Filtrado
  filterActividadesProgramadas,
  
  // Creación y actualización
  createActividad,
  updateActividad,
  
  // Estilos y UI
  getTipoColor,
  getTipoIcon,
  getEstadoBadgeClass,
  getEstadoIcon,
  getEstadoInfo,
  
  // Transformación de datos
  createEmptyFormData,
  actividadToFormData,
  
  // Utilidades
  getAllTipos,
  getAllEstados,
  
  // Carga masiva (CSV)
  validarYFormatearFecha,
  generateTemplateCSV,
  processBulkUploadCSV,
  generateBulkUploadSummary
};

export default actividadesService;