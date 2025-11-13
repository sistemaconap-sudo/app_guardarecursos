/**
 * =============================================
 * DEFINICIONES DE TIPOS DEL SISTEMA CONAP
 * =============================================
 * 
 * Este archivo contiene todas las interfaces TypeScript que definen
 * la estructura de datos de la aplicación.
 * 
 * IMPORTANTE: Si necesitas agregar o modificar campos de datos,
 * hazlo aquí primero y luego actualiza los datos en /data/mock-data.ts
 */

// ===== ÁREAS PROTEGIDAS =====
// Define la estructura de un área protegida de Guatemala
// Mapea a la tabla: area (ar_id, ar_nombre, ar_depto, ar_extension, ar_descripcion, ar_latitud, ar_longitud, ar_eco, ar_estado)
export interface AreaProtegida {
  id: string;                    // ar_id - ID único del área
  nombre: string;                // ar_nombre - Nombre del área protegida (ej: "Parque Nacional Tikal")
  departamento: string;          // ar_depto - FK a tabla departamento
  extension: number;             // ar_extension - Tamaño en hectáreas
  fechaCreacion?: string;        // Fecha de creación (no está en BD, opcional para frontend)
  coordenadas: {                 // ar_latitud, ar_longitud - Coordenadas GPS del centro del área
    lat: number;
    lng: number;
  };
  descripcion: string;           // ar_descripcion - Descripción del área
  ecosistema: string;            // ar_eco - FK a tabla ecosistema (cambió de ecosistemas[] a ecosistema)
  guardarecursos?: Guardarecurso[]; // Lista de guardarecursos asignados (relación inversa, opcional)
  estado: string;                // ar_estado - FK a tabla estado
}

// ===== TIPOS PARA DASHBOARD =====
// Mapea a vista_dashboard en PostgreSQL

/**
 * Respuesta directa de vista_dashboard
 * Contiene las 4 estadísticas principales del sistema
 */
export interface DashboardStatsResponse {
  total_areas_activas: number;           // Total de áreas protegidas con estado = 'Activo'
  total_guardarecursos_activos: number;  // Total de usuarios con rol = 'Guardarecurso' y estado = 'Activo'
  total_actividades: number;             // Total de actividades en el sistema
  actividades_hoy: number;               // Actividades programadas para HOY
}

/**
 * Respuesta de vista_areas_mapa_dashboard
 * Contiene los datos de un área para mostrar en el mapa
 */
export interface AreaMapaResponse {
  area_id: string;             // ar_id
  area_nombre: string;         // ar_nombre
  latitud: number;             // ar_latitud
  longitud: number;            // ar_longitud
  area_descripcion: string;    // ar_descripcion
  area_extension: number;      // ar_extension
  depto_nombre: string;        // Nombre del departamento (JOIN)
  eco_nombre: string;          // Nombre del ecosistema (JOIN)
}

// ===== GUARDARECURSOS =====
// Define la estructura de un empleado guardarecurso
// NOTA: No existe tabla separada de guardarecursos, es parte de la tabla usuario
// con usr_rol apuntando al rol de "Guardarecurso"
export interface Guardarecurso {
  id: string;                    // usr_id - ID único del usuario
  nombre: string;                // usr_nombre
  apellido: string;              // usr_apellido
  cedula: string;                // usr_dpi (DPI tiene 13 caracteres)
  telefono: string;              // usr_telefono (8 caracteres)
  email: string;                 // usr_correo
  fechaIngreso?: string;         // No está en BD, opcional
  puesto?: 'Jefe de Área' | 'Coordinador' | 'Guardarecurso Senior' | 'Guardarecurso' | 'Guardarecurso Auxiliar'; // No está en BD, opcional
  areaAsignada?: string;         // usr_area - FK a tabla area (opcional)
  estado: string;                // usr_estado - FK a tabla estado
  equiposAsignados?: EquipoAsignado[]; // Relación con tabla equipo (opcional)
  actividades?: Actividad[];     // Relación con tabla actividad (opcional)
}

export interface RegistroActividad {
  id: string;
  fecha: string;
  descripcion: string;
  usuario: string;
  fotografias?: string[];
}

// Mapea a la tabla: actividad (act_id, act_codigo, act_tipo, act_usuario, act_descripcion, 
// act_fechah_programacion, act_fechah_iniciio, act_latitud_inicio, act_longitud_inicio, 
// act_fechah_fin, act_latitud_fin, act_longitud_fin, act_estado)
export interface Actividad {
  id: string;                    // act_id
  codigo?: string;               // act_codigo
  tipo: string;                  // act_tipo - FK a tabla tipo
  descripcion: string;           // act_descripcion
  fecha: string;                 // act_fechah_programacion - Fecha y hora de programación
  horaInicio?: string;           // act_fechah_iniciio (opcional para frontend, en BD es timestamp)
  horaFin?: string;              // act_fechah_fin (opcional para frontend, en BD es timestamp)
  fechaHoraInicio?: string;      // act_fechah_iniciio - Timestamp completo de inicio
  fechaHoraFin?: string;         // act_fechah_fin - Timestamp completo de fin
  coordenadasInicio?: {          // act_latitud_inicio, act_longitud_inicio
    lat: number;
    lng: number;
  };
  coordenadasFin?: {             // act_latitud_fin, act_longitud_fin
    lat: number;
    lng: number;
  };
  // Campos deprecados pero mantenidos para compatibilidad
  coordenadas?: {
    lat: number;
    lng: number;
  };
  ruta?: Coordenada[];
  puntosRecorrido?: PuntoCoordenada[];
  estado: string;                // act_estado - FK a tabla estado
  evidencias?: EvidenciaFotografica[];
  guardarecurso: string;         // act_usuario - FK a tabla usuario
  hallazgos?: Hallazgo[];
  registros?: RegistroActividad[];
  fotografias?: string[];
  registroDetallado?: any;
}

export interface Coordenada {
  lat: number;
  lng: number;
  timestamp?: string;
}

// Mapea a la tabla: geolocalizacion (glc_id, glc_latitud, glc_longitud, glc_fecha, glc_actividad)
export interface PuntoCoordenada {
  id: string;                    // glc_id
  latitud: number;               // glc_latitud
  longitud: number;              // glc_longitud
  fecha: string;                 // glc_fecha (timestamp with time zone)
  hora?: string;                 // Calculado del timestamp en frontend
  descripcion?: string;          // No está en BD, opcional
  actividad?: string;            // glc_actividad - FK a tabla actividad
}

// Mapea a la tabla: fotografia (ftg_id, ftg_descripcion, ftg_fecha, ftg_latitud, 
// ftg_longitud, ftg_usuario, ftg_url, ftg_actividad, ftg_hallazgo)
export interface EvidenciaFotografica {
  id: string;                    // ftg_id
  url: string;                   // ftg_url
  descripcion: string;           // ftg_descripcion
  coordenadas?: {                // ftg_latitud, ftg_longitud (opcional)
    lat: number;
    lng: number;
  };
  fecha: string;                 // ftg_fecha
  tipo?: 'Fauna' | 'Flora' | 'Infraestructura' | 'Irregularidad' | 'Mantenimiento' | 'Otro'; // No está en BD, opcional
  usuario?: string;              // ftg_usuario - FK a tabla usuario (opcional en frontend)
  actividad?: string;            // ftg_actividad - FK a tabla actividad (opcional)
  hallazgo?: string;             // ftg_hallazgo - FK a tabla hallazgo (opcional)
}

// Mapea a la tabla: hallazgo (hlz_id, hlz_nombre, hlz_categoria, hlz_descripcion, 
// hlz_latitud, hlz_longitud, hlz_fecha, hlz_usuario, hlz_estado)
export interface Hallazgo {
  id: string;                    // hlz_id
  titulo: string;                // hlz_nombre (cambió de nombre a titulo en frontend)
  descripcion: string;           // hlz_descripcion
  ubicacion?: string;            // No está en BD, calculado en frontend
  coordenadas: {                 // hlz_latitud, hlz_longitud
    lat: number;
    lng: number;
  };
  fecha: string;                 // hlz_fecha
  guardarecurso: string;         // hlz_usuario - FK a tabla usuario
  categoria: string;             // hlz_categoria - FK a tabla categoria (cambió de gravedad a categoria)
  gravedad?: string;             // Deprecado, usar categoria. Mantener para compatibilidad temporal
  estado: string;                // hlz_estado - FK a tabla estado
  evidencias?: EvidenciaFotografica[]; // Relación con tabla fotografia
  seguimientos?: SeguimientoHallazgo[]; // Relación con tabla seguimiento
}

// Mapea a la tabla: seguimiento (sgm_id, sgm_accion, sgm_observaciones, sgm_fecha, 
// sgm_usuario, sgm_incidente, sgm_hallazgo)
export interface SeguimientoHallazgo {
  id: string;                    // sgm_id
  hallazgoId?: string;           // sgm_hallazgo - FK a tabla hallazgo (opcional)
  incidenteId?: string;          // sgm_incidente - FK a tabla incidente (opcional)
  fecha: string;                 // sgm_fecha
  descripcion: string;           // sgm_accion o sgm_observaciones
  accion?: string;               // sgm_accion
  observaciones?: string;        // sgm_observaciones
  usuario: string;               // sgm_usuario - FK a tabla usuario
  estado?: string;               // No está en BD, opcional
  evidencias?: EvidenciaFotografica[]; // Relación con tabla fotografia (opcional)
}

// Mapea a la tabla: equipo (eqp_id, eqp_nombre, eqp_codigo, eqp_marca, eqp_modelo, 
// eqp_usuario, eqp_observaciones, eqp_estado)
export interface EquipoAsignado {
  id: string;                    // eqp_id
  nombre: string;                // eqp_nombre
  codigo: string;                // eqp_codigo (puede ser opcional en BD)
  marca: string;                 // eqp_marca
  modelo: string;                // eqp_modelo
  tipo?: 'GPS' | 'Radio' | 'Binoculares' | 'Cámara' | 'Vehículo' | 'Herramienta' | 'Otro'; // No está en BD, inferido en frontend
  fechaAsignacion?: string;      // No está en BD, solo para datos mock/frontend
  usuario?: string;              // eqp_usuario - FK a tabla usuario (guardarecurso asignado) - DEPRECADO, usar guardarecursoAsignado
  guardarecursoAsignado?: string; // eqp_usuario - FK a tabla usuario (guardarecurso asignado)
  estado: string;                // eqp_estado - FK a tabla estado
  observaciones: string;         // eqp_observaciones
}

// Alias para compatibilidad
export type Equipo = EquipoAsignado;

// Mapea a la tabla: incidente (inc_id, inc_titulo, inc_categoria, inc_descipcion, 
// inc_fecha, inc_usuario, inc_estado)
// NOTA: BD no tiene coordenadas, area ni personas_involucradas
export interface IncidenteVisitante {
  id: string;                    // inc_id
  tipo?: string;                 // Deprecado, no está en BD
  titulo: string;                // inc_titulo
  descripcion: string;           // inc_descipcion (error de tipeo en BD)
  ubicacion?: string;            // No está en BD, opcional
  coordenadas?: {                // No está en BD, opcional
    lat: number;
    lng: number;
  };
  fecha: string;                 // inc_fecha
  guardarecurso: string;         // inc_usuario - FK a tabla usuario
  visitantesInvolucrados?: string[]; // No está en BD, opcional
  categoria: string;             // inc_categoria - FK a tabla categoria (cambió de gravedad a categoria)
  gravedad?: string;             // Deprecado, usar categoria
  estado: string;                // inc_estado - FK a tabla estado
  acciones?: AccionIncidente[];  // Relación con tabla seguimiento (opcional)
  evidencias?: EvidenciaFotografica[]; // Relación con tabla fotografia (opcional)
}

export interface AccionIncidente {
  id: string;
  incidenteId: string;
  fecha: string;
  descripcion: string;
  usuario: string;
  tipo: 'Primeros Auxilios' | 'Evacuación' | 'Mediación' | 'Sanción' | 'Seguimiento';
}

// ===== TABLAS CATÁLOGO DE LA BASE DE DATOS =====
// Estas son las tablas de referencia que usa la BD

export interface Tipo {
  id: string;                    // tp_id
  nombre: string;                // tp_nombre (ej: 'Patrullaje', 'Mantenimiento', etc.)
}

export interface Estado {
  id: string;                    // std_id
  nombre: string;                // std_nombre (ej: 'Activo', 'Inactivo', 'Pendiente', etc.)
}

export interface Departamento {
  id: string;                    // dpt_id
  nombre: string;                // dpt_nombre (ej: 'Petén', 'Izabal', etc.)
}

export interface Categoria {
  id: string;                    // ctg_id
  nombre: string;                // ctg_nombre (ej: 'Baja', 'Media', 'Alta', 'Crítica')
}

export interface Ecosistema {
  id: string;                    // ecs_id
  nombre: string;                // ecs_nombre (ej: 'Bosque Tropical', 'Manglar', etc.)
}

export interface Rol {
  id: string;                    // rl_id
  nombre: string;                // rl_nombre (ej: 'Administrador', 'Coordinador', 'Guardarecurso')
}

export interface ReportePeriodico {
  id: string;
  titulo: string;
  tipo: 'Diario' | 'Semanal' | 'Mensual' | 'Trimestral' | 'Anual' | 'Especial';
  fechaCreacion: string;
  periodo: {
    inicio: string;
    fin: string;
  };
  areaProtegida?: string;
  zona?: string;
  guardarecurso?: string;
  resumen: string;
  datos: {
    actividades: number;
    patrullajes: number;
    hallazgos: number;
    incidentes: number;
    visitantes: number;
    horasTrabajadas: number;
  };
  estado: 'Borrador' | 'Enviado' | 'Aprobado' | 'Rechazado';
  observaciones?: string;
}

// ===== USUARIOS DEL SISTEMA =====
// Define los usuarios que pueden iniciar sesión en la aplicación
// IMPORTANTE: Los roles determinan los permisos (ver /utils/permissions.ts)
// Mapea a la tabla: usuario (usr_id, usr_nombre, usr_apellido, usr_dpi, usr_telefono, 
// usr_correo, usr_contrasenia, usr_rol, usr_area, usr_estado)
export interface Usuario {
  id: string;                    // usr_id - ID único del usuario
  nombre: string;                // usr_nombre
  apellido: string;              // usr_apellido
  nombreCompleto?: string;       // Calculado: nombre + apellido
  dpi?: string;                  // usr_dpi (13 caracteres, opcional en frontend)
  email?: string;                // usr_correo (alias para compatibilidad)
  correo?: string;               // usr_correo (nombre de BD)
  telefono?: string;             // usr_telefono (8 caracteres, opcional)
  password?: string;             // usr_contrasenia (SIEMPRE 'SUPABASE_AUTH' en BD)
  rol: string;                   // Nombre del rol (ej: 'Administrador', 'Coordinador')
  rolId?: number;                // usr_rol - FK a tabla rol (ID numérico)
  area?: string;                 // Nombre del área (JOIN con tabla area)
  areaId?: number;               // usr_area - FK a tabla area (opcional, para Guardarrecursos)
  areaAsignada?: string;         // Alias para compatibilidad
  estado: string;                // Nombre del estado (ej: 'Activo', 'Suspendido')
  estadoId?: number;             // usr_estado - FK a tabla estado
  fechaCreacion?: string;        // No está en BD base, pero puede venir de campos de auditoría
  ultimoAcceso?: string;         // No está en BD, opcional
  permisos?: string[];           // No está en BD, calculado en frontend según rol
}