/**
 * 📝 Registro Diario Service
 * 
 * Servicio centralizado que maneja toda la lógica funcional del módulo de Registro Diario de Campo,
 * incluyendo inicio/finalización de actividades, gestión de hallazgos, evidencias y coordenadas.
 * 
 * @module utils/registroDiarioService
 */

import { Hallazgo, EvidenciaFotografica, PuntoCoordenada, Actividad } from '../types';
import { badgeStyles } from '../styles/shared-styles';

/**
 * Interface para datos de formulario de hallazgo
 */
export interface HallazgoFormData {
  titulo: string;
  descripcion: string;
  gravedad: 'Leve' | 'Moderado' | 'Grave' | 'Crítico';
  latitud: string;
  longitud: string;
  fotografias: Array<{
    url: string;
    descripcion: string;
    latitud: string;
    longitud: string;
  }>;
}

/**
 * Interface para fotografía de hallazgo
 */
export interface FotoHallazgoFormData {
  url: string;
  descripcion: string;
  latitud: string;
  longitud: string;
}

/**
 * Interface para evidencia fotográfica
 */
export interface EvidenciaFormData {
  url: string;
  descripcion: string;
  tipo: 'Fauna' | 'Flora' | 'Infraestructura' | 'Irregularidad' | 'Mantenimiento' | 'Otro';
  latitud: string;
  longitud: string;
}

/**
 * Interface para punto de coordenada
 */
export interface PuntoCoordenadaFormData {
  latitud: string;
  longitud: string;
  fecha: string;
  hora: string;
  descripcion: string;
}

/**
 * Interface para resultado de inicio de actividad
 */
export interface InicioActividadData {
  estado: 'En Progreso';
  horaInicio: string;
  coordenadasInicio: {
    lat: number;
    lng: number;
  };
}

/**
 * Interface para resultado de finalización de actividad
 */
export interface FinalizacionActividadData {
  estado: 'Completada';
  horaFin: string;
  coordenadasFin: {
    lat: number;
    lng: number;
  };
  observaciones: string;
  hallazgos: Hallazgo[];
  evidencias: EvidenciaFotografica[];
  puntosRecorrido: PuntoCoordenada[];
}

/**
 * Tipos de estado de actividad
 */
export type EstadoActividad = 'Programada' | 'En Progreso' | 'Completada';

/**
 * Tipos de gravedad de hallazgo
 */
export type GravedadHallazgo = 'Leve' | 'Moderado' | 'Grave' | 'Crítico';

/**
 * Tipos de evidencia fotográfica
 */
export type TipoEvidencia = 'Fauna' | 'Flora' | 'Infraestructura' | 'Irregularidad' | 'Mantenimiento' | 'Otro';

// ============================================================================
// FILTRADO DE ACTIVIDADES
// ============================================================================

/**
 * Filtra actividades según rol de usuario
 * - Guardarecursos: solo sus actividades
 * - Admin/Coordinador: todas las actividades con filtros adicionales
 * 
 * @param actividades - Lista completa de actividades
 * @param searchTerm - Término de búsqueda
 * @param selectedDate - Fecha seleccionada (solo admin/coordinador)
 * @param selectedGuardarecurso - ID del guardarecurso seleccionado (solo admin/coordinador)
 * @param isGuardarecurso - Si el usuario actual es guardarecurso
 * @param currentGuardarecursoId - ID del guardarecurso actual (si aplica)
 * @param guardarecursos - Lista de guardarecursos para búsqueda
 * @returns Array de actividades filtradas
 * 
 * @example
 * // Guardarecurso ve solo sus actividades
 * const filtered = filterActividadesPorRol(
 *   actividades, 'patrullaje', null, null, true, '1', guardarecursos
 * );
 * 
 * // Admin ve todas las actividades con filtros
 * const filtered = filterActividadesPorRol(
 *   actividades, 'patrullaje', '2025-11-03', '2', false, null, guardarecursos
 * );
 */
export function filterActividadesPorRol(
  actividades: Actividad[],
  searchTerm: string,
  selectedDate: string | null,
  selectedGuardarecurso: string | null,
  isGuardarecurso: boolean,
  currentGuardarecursoId: string | null,
  guardarecursos: any[]
): Actividad[] {
  let filtered = actividades;

  // Filtrar por fecha
  // - Guardarecursos: SOLO actividades de hoy (ignorar selección de fecha)
  // - Admin/Coordinador: Permitir filtrar por cualquier fecha
  if (selectedDate) {
    filtered = filtered.filter(a => a.fecha === selectedDate);
  }
  
  // Si es guardarecurso, filtrar solo sus actividades
  if (isGuardarecurso && currentGuardarecursoId) {
    filtered = filtered.filter(a => a.guardarecurso === currentGuardarecursoId);
  }

  // Filtrar por búsqueda
  if (searchTerm) {
    filtered = filtered.filter(a => {
      const guardarecurso = guardarecursos.find(g => g.id === a.guardarecurso);
      return (
        a.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (guardarecurso && `${guardarecurso.nombre} ${guardarecurso.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }

  // Filtrar por guardarecurso (solo para admin/coordinador)
  if (!isGuardarecurso && selectedGuardarecurso && selectedGuardarecurso !== 'todos') {
    filtered = filtered.filter(a => a.guardarecurso === selectedGuardarecurso);
  }

  return filtered;
}

// ============================================================================
// INICIO Y FINALIZACIÓN DE ACTIVIDADES
// ============================================================================

/**
 * Obtiene la hora actual en formato HH:mm
 * 
 * @returns Hora actual (ej: '14:30')
 * 
 * @example
 * const hora = getCurrentTime(); // '14:30'
 */
export function getCurrentTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

/**
 * Crea datos de inicio de actividad
 * Valida coordenadas y formatea datos
 * 
 * @param horaInicio - Hora de inicio en formato HH:mm
 * @param latitud - Latitud como string
 * @param longitud - Longitud como string
 * @returns Objeto con datos de inicio de actividad
 * 
 * @example
 * const inicio = createInicioActividadData('08:30', '14.6349', '-90.5069');
 * // {
 * //   estado: 'En Progreso',
 * //   horaInicio: '08:30',
 * //   coordenadasInicio: { lat: 14.6349, lng: -90.5069 }
 * // }
 */
export function createInicioActividadData(
  horaInicio: string,
  latitud: string,
  longitud: string
): InicioActividadData {
  return {
    estado: 'En Progreso',
    horaInicio: horaInicio,
    coordenadasInicio: {
      lat: latitud ? parseFloat(latitud) : 0,
      lng: longitud ? parseFloat(longitud) : 0
    }
  };
}

/**
 * Crea datos de finalización de actividad
 * Incluye coordenadas finales, observaciones y datos recopilados
 * 
 * @param horaFin - Hora de finalización en formato HH:mm
 * @param latitud - Latitud como string
 * @param longitud - Longitud como string
 * @param observaciones - Observaciones finales
 * @param hallazgos - Hallazgos reportados durante la actividad
 * @param evidencias - Evidencias fotográficas capturadas
 * @param puntosRecorrido - Puntos de coordenadas del recorrido
 * @returns Objeto con datos de finalización de actividad
 * 
 * @example
 * const fin = createFinalizacionActividadData(
 *   '16:30', '14.6350', '-90.5070', 'Todo en orden',
 *   hallazgos, evidencias, puntos
 * );
 */
export function createFinalizacionActividadData(
  horaFin: string,
  latitud: string,
  longitud: string,
  observaciones: string,
  hallazgos: Hallazgo[],
  evidencias: EvidenciaFotografica[],
  puntosRecorrido: PuntoCoordenada[]
): FinalizacionActividadData {
  return {
    estado: 'Completada',
    horaFin: horaFin,
    coordenadasFin: {
      lat: parseFloat(latitud),
      lng: parseFloat(longitud)
    },
    observaciones: observaciones,
    hallazgos: hallazgos,
    evidencias: evidencias,
    puntosRecorrido: puntosRecorrido
  };
}

/**
 * Verifica si una actividad es de tipo patrullaje
 * 
 * @param tipoActividad - Tipo de actividad
 * @returns true si es patrullaje
 * 
 * @example
 * isPatrullaje('Patrullaje de Control y Vigilancia'); // true
 * isPatrullaje('Patrullaje'); // true
 * isPatrullaje('Mantenimiento'); // false
 */
export function isPatrullaje(tipoActividad: string): boolean {
  return tipoActividad.toLowerCase().includes('patrullaje');
}

// ============================================================================
// GESTIÓN DE HALLAZGOS
// ============================================================================

/**
 * Crea un formulario vacío de hallazgo
 * 
 * @returns Formulario vacío
 * 
 * @example
 * const emptyForm = createEmptyHallazgoForm();
 */
export function createEmptyHallazgoForm(): HallazgoFormData {
  return {
    titulo: '',
    descripcion: '',
    gravedad: 'Moderado',
    latitud: '',
    longitud: '',
    fotografias: []
  };
}

/**
 * Crea un formulario vacío de fotografía de hallazgo
 * 
 * @returns Formulario vacío
 */
export function createEmptyFotoHallazgoForm(): FotoHallazgoFormData {
  return {
    url: '',
    descripcion: '',
    latitud: '',
    longitud: ''
  };
}

/**
 * Convierte fotografías de formulario a evidencias
 * 
 * @param fotografias - Array de fotografías del formulario
 * @returns Array de evidencias fotográficas
 * 
 * @example
 * const evidencias = convertFotografiasToEvidencias(fotos);
 */
export function convertFotografiasToEvidencias(
  fotografias: FotoHallazgoFormData[]
): EvidenciaFotografica[] {
  return fotografias.map((foto, index) => ({
    id: `evidencia-${Date.now()}-${index}`,
    url: foto.url,
    descripcion: foto.descripcion || '',
    fecha: new Date().toISOString(),
    tipo: 'Hallazgo' as const
  }));
}

/**
 * Crea un nuevo hallazgo vinculado a una actividad
 * 
 * @param formData - Datos del formulario de hallazgo
 * @param actividadUbicacion - Ubicación de la actividad
 * @param guardarecursoId - ID del guardarecurso que reporta
 * @returns Nuevo hallazgo
 * 
 * @example
 * const hallazgo = createHallazgo(formData, 'Sector Norte', '1');
 */
export function createHallazgo(
  formData: HallazgoFormData,
  actividadUbicacion: string,
  guardarecursoId: string
): Hallazgo {
  const evidencias = convertFotografiasToEvidencias(formData.fotografias);

  return {
    id: `hallazgo-${Date.now()}`,
    titulo: formData.titulo,
    descripcion: formData.descripcion,
    ubicacion: actividadUbicacion || '',
    coordenadas: {
      lat: formData.latitud ? parseFloat(formData.latitud) : 0,
      lng: formData.longitud ? parseFloat(formData.longitud) : 0
    },
    fecha: new Date().toISOString(),
    guardarecurso: guardarecursoId || '',
    gravedad: formData.gravedad,
    estado: 'Reportado',
    evidencias: evidencias,
    seguimientos: []
  };
}

/**
 * Crea un hallazgo independiente (no vinculado a actividad)
 * 
 * @param formData - Datos del formulario de hallazgo
 * @param guardarecursoId - ID del guardarecurso que reporta
 * @returns Nuevo hallazgo independiente
 * 
 * @example
 * const hallazgo = createHallazgoIndependiente(formData, '1');
 */
export function createHallazgoIndependiente(
  formData: HallazgoFormData,
  guardarecursoId: string
): Hallazgo {
  return {
    id: `hallazgo-ind-${Date.now()}`,
    titulo: formData.titulo,
    descripcion: formData.descripcion,
    ubicacion: formData.latitud && formData.longitud 
      ? `Lat: ${formData.latitud}, Lng: ${formData.longitud}` 
      : 'Ubicación no especificada',
    coordenadas: {
      lat: formData.latitud ? parseFloat(formData.latitud) : 0,
      lng: formData.longitud ? parseFloat(formData.longitud) : 0
    },
    fecha: new Date().toISOString(),
    guardarecurso: guardarecursoId || '',
    gravedad: formData.gravedad,
    estado: 'Reportado',
    evidencias: formData.fotografias || [],
    seguimientos: []
  };
}

/**
 * Valida que un formulario de hallazgo esté completo
 * 
 * @param formData - Datos del formulario
 * @returns true si es válido
 * 
 * @example
 * if (!isHallazgoFormValid(formData)) {
 *   alert('Complete todos los campos requeridos');
 * }
 */
export function isHallazgoFormValid(formData: HallazgoFormData): boolean {
  return !!(formData.titulo && formData.descripcion);
}

// ============================================================================
// GESTIÓN DE EVIDENCIAS FOTOGRÁFICAS
// ============================================================================

/**
 * Crea un formulario vacío de evidencia
 * 
 * @returns Formulario vacío
 */
export function createEmptyEvidenciaForm(): EvidenciaFormData {
  return {
    url: '',
    descripcion: '',
    tipo: 'Otro',
    latitud: '',
    longitud: ''
  };
}

/**
 * Crea una nueva evidencia fotográfica
 * 
 * @param formData - Datos del formulario de evidencia
 * @returns Nueva evidencia fotográfica
 * 
 * @example
 * const evidencia = createEvidencia(formData);
 */
export function createEvidencia(formData: EvidenciaFormData): EvidenciaFotografica {
  return {
    id: `evidencia-${Date.now()}`,
    url: formData.url,
    descripcion: formData.descripcion,
    fecha: new Date().toISOString(),
    tipo: formData.tipo
  };
}

/**
 * Valida que un formulario de evidencia esté completo
 * 
 * @param formData - Datos del formulario
 * @returns true si es válido
 * 
 * @example
 * if (!isEvidenciaFormValid(formData)) {
 *   alert('Agregue una imagen y descripción');
 * }
 */
export function isEvidenciaFormValid(formData: EvidenciaFormData): boolean {
  return !!(formData.url && formData.descripcion);
}

// ============================================================================
// GESTIÓN DE COORDENADAS
// ============================================================================

/**
 * Crea un formulario vacío de coordenada
 * 
 * @returns Formulario vacío con fecha y hora actual
 */
export function createEmptyCoordenadaForm(): PuntoCoordenadaFormData {
  const now = new Date();
  return {
    latitud: '',
    longitud: '',
    fecha: now.toISOString().split('T')[0],
    hora: now.toTimeString().slice(0, 5),
    descripcion: ''
  };
}

/**
 * Crea un nuevo punto de coordenada
 * 
 * @param formData - Datos del formulario de coordenada
 * @returns Nuevo punto de coordenada
 * 
 * @example
 * const punto = createPuntoCoordenada(formData);
 */
export function createPuntoCoordenada(formData: PuntoCoordenadaFormData): PuntoCoordenada {
  const now = new Date();
  return {
    id: `coord-${Date.now()}`,
    latitud: parseFloat(formData.latitud),
    longitud: parseFloat(formData.longitud),
    fecha: now.toISOString().split('T')[0],
    hora: formData.hora,
    descripcion: ''
  };
}

/**
 * Valida que un formulario de coordenada esté completo
 * 
 * @param formData - Datos del formulario
 * @returns true si es válido
 * 
 * @example
 * if (!isCoordenadaFormValid(formData)) {
 *   alert('Complete latitud, longitud y hora');
 * }
 */
export function isCoordenadaFormValid(formData: PuntoCoordenadaFormData): boolean {
  return !!(formData.latitud && formData.longitud && formData.hora);
}

// ============================================================================
// MANEJO DE FOTOGRAFÍAS
// ============================================================================

/**
 * Procesa un archivo de imagen y lo convierte a base64
 * 
 * @param file - Archivo de imagen
 * @param callback - Función a ejecutar con la URL base64
 * 
 * @example
 * processImageFile(file, (url) => {
 *   setFormData({ ...formData, url });
 * });
 */
export function processImageFile(
  file: File,
  callback: (url: string) => void
): void {
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        callback(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  }
}

/**
 * Valida que una fotografía de hallazgo esté completa
 * 
 * @param formData - Datos del formulario de foto
 * @returns true si es válido
 */
export function isFotoHallazgoFormValid(formData: FotoHallazgoFormData): boolean {
  return !!(formData.url && formData.titulo);
}

// ============================================================================
// ESTILOS Y UI
// ============================================================================

/**
 * Obtiene información de estilo según el estado de actividad
 * 
 * @param estado - Estado de la actividad
 * @returns Objeto con icon y badge
 * 
 * @example
 * const info = getEstadoInfo('En Progreso');
 * const Icon = info.icon;
 * <Badge className={info.badge}>En Progreso</Badge>
 */
export function getEstadoInfo(estado: EstadoActividad) {
  const mapping = {
    'Programada': { 
      icon: 'Clock', 
      badge: badgeStyles.estado.reportado 
    },
    'En Progreso': { 
      icon: 'Play', 
      badge: badgeStyles.estado.enProgreso 
    },
    'Completada': { 
      icon: 'CheckCircle', 
      badge: badgeStyles.estado.completada 
    }
  };

  return mapping[estado] || { 
    icon: 'AlertTriangle', 
    badge: badgeStyles.estado.inactivo 
  };
}

/**
 * Obtiene colores según el tipo de actividad
 * 
 * @param tipo - Tipo de actividad
 * @returns Objeto con bg y text
 * 
 * @example
 * const colors = getTipoColor('Patrullaje');
 * <div className={colors.bg}>
 *   <span className={colors.text}>Patrullaje</span>
 * </div>
 */
export function getTipoColor(tipo: string) {
  const mapping: Record<string, { bg: string; text: string }> = {
    'Patrullaje': { 
      bg: 'bg-blue-100 dark:bg-blue-900/30', 
      text: 'text-blue-700 dark:text-blue-300' 
    },
    'Patrullaje de Control y Vigilancia': { 
      bg: 'bg-blue-100 dark:bg-blue-900/30', 
      text: 'text-blue-700 dark:text-blue-300' 
    },
    'Mantenimiento': { 
      bg: 'bg-orange-100 dark:bg-orange-900/30', 
      text: 'text-orange-700 dark:text-orange-300' 
    },
    'Mantenimiento de Área Protegida': { 
      bg: 'bg-orange-100 dark:bg-orange-900/30', 
      text: 'text-orange-700 dark:text-orange-300' 
    },
    'Educación Ambiental': { 
      bg: 'bg-green-100 dark:bg-green-900/30', 
      text: 'text-green-700 dark:text-green-300' 
    },
    'Investigación': { 
      bg: 'bg-purple-100 dark:bg-purple-900/30', 
      text: 'text-purple-700 dark:text-purple-300' 
    },
    'Control y Vigilancia': { 
      bg: 'bg-red-100 dark:bg-red-900/30', 
      text: 'text-red-700 dark:text-red-300' 
    },
    'Ronda': { 
      bg: 'bg-emerald-100 dark:bg-emerald-900/30', 
      text: 'text-emerald-700 dark:text-emerald-300' 
    }
  };

  return mapping[tipo] || { 
    bg: 'bg-gray-100 dark:bg-gray-700', 
    text: 'text-gray-700 dark:text-gray-300' 
  };
}

/**
 * Obtiene el nombre del icono según el tipo de actividad
 * 
 * @param tipo - Tipo de actividad
 * @returns Nombre del icono de lucide-react
 * 
 * @example
 * const iconName = getTipoIcon('Patrullaje'); // 'Binoculars'
 */
export function getTipoIcon(tipo: string): string {
  const mapping: Record<string, string> = {
    'Patrullaje': 'Binoculars',
    'Patrullaje de Control y Vigilancia': 'Binoculars',
    'Mantenimiento': 'Wrench',
    'Mantenimiento de Área Protegida': 'Wrench',
    'Educación Ambiental': 'GraduationCap',
    'Investigación': 'SearchIcon',
    'Control y Vigilancia': 'Eye',
    'Ronda': 'Map'
  };

  return mapping[tipo] || 'Activity';
}

/**
 * Obtiene todos los tipos de actividad disponibles
 * 
 * @returns Array de tipos de actividad
 */
export function getAllTiposActividad(): string[] {
  return [
    'Patrullaje de Control y Vigilancia',
    'Actividades de Prevención y Atención de Incendios Forestales',
    'Mantenimiento de Área Protegida',
    'Reforestación de Área Protegida',
    'Mantenimiento de Reforestación'
  ];
}

/**
 * Obtiene todos los tipos de evidencia disponibles
 * 
 * @returns Array de tipos de evidencia
 */
export function getAllTiposEvidencia(): TipoEvidencia[] {
  return ['Fauna', 'Flora', 'Infraestructura', 'Irregularidad', 'Mantenimiento', 'Otro'];
}

/**
 * Obtiene todas las gravedades de hallazgo disponibles
 * 
 * @returns Array de gravedades
 */
export function getAllGravedades(): GravedadHallazgo[] {
  return ['Leve', 'Moderado', 'Grave', 'Crítico'];
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

/**
 * Servicio principal de Registro Diario
 * Agrupa todas las funcionalidades en un objeto cohesivo
 */
export const registroDiarioService = {
  // Filtrado
  filterActividadesPorRol,
  
  // Inicio y finalización
  getCurrentTime,
  createInicioActividadData,
  createFinalizacionActividadData,
  isPatrullaje,
  
  // Hallazgos
  createEmptyHallazgoForm,
  createEmptyFotoHallazgoForm,
  convertFotografiasToEvidencias,
  createHallazgo,
  createHallazgoIndependiente,
  isHallazgoFormValid,
  isFotoHallazgoFormValid,
  
  // Evidencias
  createEmptyEvidenciaForm,
  createEvidencia,
  isEvidenciaFormValid,
  
  // Coordenadas
  createEmptyCoordenadaForm,
  createPuntoCoordenada,
  isCoordenadaFormValid,
  
  // Fotografías
  processImageFile,
  
  // Estilos y UI
  getEstadoInfo,
  getTipoColor,
  getTipoIcon,
  
  // Utilidades
  getAllTiposActividad,
  getAllTiposEvidencia,
  getAllGravedades
};

export default registroDiarioService;
