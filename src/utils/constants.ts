/**
 * Constantes compartidas de la aplicación
 */

/**
 * Estados de guardarecursos
 */
export const ESTADOS_GUARDARECURSO = {
  ACTIVO: 'Activo',
  SUSPENDIDO: 'Suspendido',
  INACTIVO: 'Inactivo'
} as const;

/**
 * Estados de actividades
 */
export const ESTADOS_ACTIVIDAD = {
  PROGRAMADA: 'Programada',
  EN_PROGRESO: 'En Progreso',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada'
} as const;

/**
 * Estados de incidentes/hallazgos
 */
export const ESTADOS_INCIDENTE = {
  REPORTADO: 'Reportado',
  EN_ATENCION: 'En Atención',
  EN_INVESTIGACION: 'En Investigación',
  EN_PROCESO: 'En Proceso',
  ESCALADO: 'Escalado',
  RESUELTO: 'Resuelto'
} as const;

/**
 * Niveles de gravedad
 * NOTA: En BD esto se maneja con la tabla 'categoria'
 * Estos son valores de ejemplo que deben coincidir con registros en la tabla categoria
 */
export const NIVELES_GRAVEDAD = {
  LEVE: 'Leve',
  MODERADO: 'Moderado',
  GRAVE: 'Grave',
  CRITICO: 'Crítico'
} as const;

/**
 * Niveles de prioridad / categoría
 * NOTA: En BD esto se maneja con la tabla 'categoria'
 * Estos valores mapean a ctg_nombre en la tabla categoria
 */
export const NIVELES_PRIORIDAD = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  CRITICA: 'Crítica'
} as const;

/**
 * Categorías (mapea a tabla categoria en BD)
 * Usado para hallazgos e incidentes
 */
export const CATEGORIAS = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  CRITICA: 'Crítica'
} as const;

/**
 * Estados de equipos
 */
export const ESTADOS_EQUIPO = {
  OPERATIVO: 'Operativo',
  EN_REPARACION: 'En Reparación',
  FUERA_SERVICIO: 'Fuera de Servicio'
} as const;

/**
 * Tipos de actividades
 */
export const TIPOS_ACTIVIDAD = [
  'Patrullaje',
  'Patrullaje de Control y Vigilancia',
  'Control y Vigilancia',
  'Ronda',
  'Mantenimiento',
  'Mantenimiento de Área Protegida',
  'Educación Ambiental',
  'Investigación'
] as const;

/**
 * Categorías de equipos
 */
export const CATEGORIAS_EQUIPO = [
  'Comunicación',
  'Transporte',
  'Seguridad',
  'Medición',
  'Campo',
  'Tecnología'
] as const;

/**
 * Períodos de tiempo para reportes
 */
export const PERIODOS = [
  'Diario',
  'Semanal',
  'Mensual',
  'Trimestral',
  'Anual'
] as const;

/**
 * Valores especiales para filtros de Select
 */
export const SELECT_FILTER_VALUES = {
  ALL: 'todos',
  NONE: 'none',
  ALL_LEGACY: 'all'
} as const;

/**
 * Roles de usuario
 */
export const ROLES_USUARIO = {
  ADMINISTRADOR: 'Administrador',
  COORDINADOR: 'Coordinador',
  GUARDARECURSO: 'Guardarecurso'
} as const;

/**
 * IDs de roles en la base de datos (tabla: rol)
 * IMPORTANTE: Estos IDs deben coincidir con los de la tabla rol en PostgreSQL
 */
export const ROL_IDS = {
  ADMINISTRADOR: 1,    // rl_id = 1, rl_nombre = 'Administrador'
  COORDINADOR: 2,      // rl_id = 2, rl_nombre = 'Coordinador'
  GUARDARECURSO: 3     // rl_id = 3, rl_nombre = 'Guardarrecurso'
} as const;

/**
 * IDs de estados en la base de datos (tabla: estado)
 * IMPORTANTE: Estos IDs deben coincidir con los de la tabla estado en PostgreSQL
 */
export const ESTADO_IDS = {
  ACTIVO: 1,        // std_id = 1, std_nombre = 'Activo'
  SUSPENDIDO: 2,    // std_id = 2, std_nombre = 'Suspendido'
  INACTIVO: 3       // std_id = 3, std_nombre = 'Inactivo'
} as const;

/**
 * Formatos de fecha comunes
 */
export const DATE_FORMATS = {
  SHORT: 'd/M/yyyy',
  MEDIUM: "d 'de' MMMM, yyyy",
  LONG: "d 'de' MMMM 'de' yyyy",
  WITH_TIME: "d 'de' MMMM, yyyy 'a las' HH:mm",
  TIME_ONLY: 'HH:mm'
} as const;

/**
 * Configuración de paginación
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
} as const;

/**
 * Límites de caracteres para campos
 */
export const FIELD_LIMITS = {
  NOMBRE: 50,
  APELLIDO: 50,
  EMAIL: 100,
  TELEFONO: 15,
  DPI: 13,
  DESCRIPCION_CORTA: 200,
  DESCRIPCION_LARGA: 1000,
  OBSERVACIONES: 500,
  TITULO: 100
} as const;

/**
 * Mensajes de validación estándar
 */
export const VALIDATION_MESSAGES = {
  REQUIRED: 'Este campo es requerido',
  INVALID_EMAIL: 'Email inválido',
  INVALID_PHONE: 'Teléfono inválido (debe tener 8 dígitos)',
  INVALID_DPI: 'DPI inválido (debe tener 13 dígitos)',
  PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 6 caracteres',
  PASSWORDS_DONT_MATCH: 'Las contraseñas no coinciden',
  INVALID_COORDINATES: 'Coordenadas inválidas'
} as const;

/**
 * Mensajes de toast estándar
 */
export const TOAST_MESSAGES = {
  SUCCESS: {
    CREATE: 'Registro creado exitosamente',
    UPDATE: 'Registro actualizado exitosamente',
    DELETE: 'Registro eliminado exitosamente',
    SAVE: 'Guardado exitosamente'
  },
  ERROR: {
    CREATE: 'Error al crear el registro',
    UPDATE: 'Error al actualizar el registro',
    DELETE: 'Error al eliminar el registro',
    LOAD: 'Error al cargar los datos',
    GENERIC: 'Ha ocurrido un error'
  }
} as const;
