/**
 * 🌳 Áreas Protegidas Service
 * 
 * Servicio centralizado que maneja toda la lógica funcional del módulo de Áreas Protegidas,
 * separando la lógica de negocio de la presentación.
 * 
 * OPTIMIZADO: Cache de peticiones, reducción de consultas redundantes
 * 
 * @module utils/areasProtegidasService
 */

import { AreaProtegida, Guardarecurso } from '../types';
import { projectId } from './supabase/info';
import { getRequiredAuthToken } from './base-api-service';

/**
 * Interface para los datos del formulario de áreas protegidas
 */
export interface AreaProtegidaFormData {
  nombre: string;
  departamento: string;
  extension: number;
  fechaCreacion: string;
  coordenadas: {
    lat: number;
    lng: number;
  };
  descripcion: string;
  ecosistemas: string[];
}

/**
 * Interface para el estado pendiente de cambio
 */
export interface AreaEstadoPendiente {
  id: string;
  nuevoEstado: 'Activo' | 'Desactivado';
  nombre: string;
}

/**
 * Interface para resultado de validación
 */
export interface ValidationResult {
  isValid: boolean;
  message?: string;
  guardarecursosAsignados?: number;
}

/**
 * Lista de departamentos de Guatemala
 */
export const DEPARTAMENTOS_GUATEMALA = [
  'Petén', 'Alta Verapaz', 'Baja Verapaz', 'Chimaltenango', 
  'Escuintla', 'Guatemala', 'Quetzaltenango', 'Huehuetenango',
  'Izabal', 'Jalapa', 'Jutiapa', 'Quiché', 'Retalhuleu',
  'Sacatepéquez', 'San Marcos', 'Santa Rosa', 'Sololá',
  'Suchitepéquez', 'Totonicapán', 'Zacapa', 'El Progreso', 'Chiquimula'
] as const;

/**
 * Lista de ecosistemas típicos de Guatemala
 */
export const ECOSISTEMAS_GUATEMALA = [
  'Bosque Tropical Húmedo',
  'Bosque Tropical Seco', 
  'Bosque Nublado',
  'Humedales',
  'Manglares',
  'Sabanas',
  'Bosque Mixto',
  'Matorral Volcánico',
  'Karst'
] as const;

// ===== FUNCIONES DE FILTRADO =====

/**
 * Obtiene todos los ecosistemas desde la base de datos
 * 
 * @returns Array de nombres de ecosistemas
 */
export async function fetchEcosistemas(): Promise<string[]> {
  try {
    const token = getRequiredAuthToken();
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-811550f1/ecosistemas`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      console.error('❌ [fetchEcosistemas] Error HTTP:', response.status, response.statusText);
      
      // Si es 401, el sistema ya forzó logout en fetchApi
      // Para otros errores, retornar array vacío
      return [];
    }

    const data = await response.json();
    console.log('📊 [fetchEcosistemas] Respuesta del servidor:', data);
    
    // Si data es un array, mapear directamente
    if (Array.isArray(data)) {
      const ecosistemas = data.map((e: { ecs_id: number; ecs_nombre: string }) => e.ecs_nombre);
      console.log('✅ [fetchEcosistemas] Ecosistemas cargados:', ecosistemas.length);
      return ecosistemas;
    }
    
    console.error('❌ [fetchEcosistemas] Respuesta inesperada (no es array):', data);
    return [];
  } catch (error) {
    // Si el error es NO_TOKEN, significa que no hay sesión
    // El usuario será redirigido al login por App.tsx
    if (error instanceof Error && error.message === 'NO_TOKEN') {
      console.warn('⚠️ [fetchEcosistemas] No hay token - Usuario no autenticado');
      return [];
    }
    
    console.error('❌ [fetchEcosistemas] Error:', error);
    return [];
  }
}

/**
 * Obtiene todos los departamentos desde la base de datos
 * 
 * @returns Array de nombres de departamentos
 */
export async function fetchDepartamentos(): Promise<string[]> {
  try {
    const token = getRequiredAuthToken();
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-811550f1/departamentos`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      console.error('Error al obtener departamentos:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.map((d: { dpt_id: number; dpt_nombre: string }) => d.dpt_nombre);
  } catch (error) {
    console.error('Error en fetchDepartamentos:', error);
    return [];
  }
}

/**
 * Filtra áreas protegidas excluyendo desactivadas
 * 
 * @param areas - Lista completa de áreas protegidas
 * @param searchTerm - Término de búsqueda
 * @param selectedDepartamento - Departamento seleccionado para filtrar
 * @returns Array de áreas protegidas filtradas
 * 
 * @example
 * const filtered = filterAreasProtegidas(areas, 'tikal', 'Petén');
 */
export function filterAreasProtegidas(
  areas: AreaProtegida[],
  searchTerm: string,
  selectedDepartamento: string
): AreaProtegida[] {
  return areas.filter(area => {
    // Excluir áreas desactivadas
    const isActive = area.estado === 'Activo';
    
    // Filtrar por búsqueda (nombre, departamento, descripción)
    const matchSearch = 
      area.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      area.departamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      area.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtrar por departamento
    const matchDepartamento = selectedDepartamento === 'todos' || area.departamento === selectedDepartamento;
    
    return isActive && matchSearch && matchDepartamento;
  });
}

// ===== FUNCIONES DE CREACIÓN Y ACTUALIZACIÓN =====

/**
 * Crea una nueva área protegida con valores predeterminados
 * 
 * @param formData - Datos del formulario
 * @returns Nuevo objeto AreaProtegida
 * 
 * @example
 * const nuevaArea = createAreaProtegida(formData);
 */
export function createAreaProtegida(formData: AreaProtegidaFormData): AreaProtegida {
  return {
    id: Date.now().toString(),
    nombre: formData.nombre,
    departamento: formData.departamento,
    extension: formData.extension,
    fechaCreacion: formData.fechaCreacion,
    coordenadas: formData.coordenadas,
    descripcion: formData.descripcion,
    ecosistemas: formData.ecosistemas,
    estado: 'Activo', // Siempre se crea como Activo
    guardarecursos: []
  };
}

/**
 * Actualiza un área protegida existente
 * 
 * @param area - Área a actualizar
 * @param formData - Datos del formulario
 * @returns Área protegida actualizada
 * 
 * @example
 * const actualizada = updateAreaProtegida(existente, formData);
 */
export function updateAreaProtegida(
  area: AreaProtegida,
  formData: AreaProtegidaFormData
): AreaProtegida {
  return {
    ...area,
    nombre: formData.nombre,
    departamento: formData.departamento,
    extension: formData.extension,
    fechaCreacion: formData.fechaCreacion,
    coordenadas: formData.coordenadas,
    descripcion: formData.descripcion,
    ecosistemas: formData.ecosistemas
    // Mantener guardarecursos y estado sin cambios
  };
}

// ===== FUNCIONES DE VALIDACIÓN =====

/**
 * Valida si un área puede ser desactivada
 * Verifica que no tenga guardarecursos activos o suspendidos asignados
 * 
 * @param area - Área a validar
 * @param guardarecursos - Lista de todos los guardarecursos
 * @returns Resultado de validación
 * 
 * @example
 * const validation = validateAreaDeactivation(area, guardarecursos);
 * if (!validation.isValid) {
 *   toast.error(validation.message);
 * }
 */
export function validateAreaDeactivation(
  area: AreaProtegida,
  guardarecursos: Guardarecurso[]
): ValidationResult {
  // Solo contar guardarecursos activos o suspendidos, NO desactivados
  const guardarecursosAsignados = guardarecursos.filter(g => 
    g.areaAsignada === area.id && 
    (g.estado === 'Activo' || g.estado === 'Suspendido')
  );
  
  if (guardarecursosAsignados.length > 0) {
    return {
      isValid: false,
      message: `Esta área tiene ${guardarecursosAsignados.length} guardarecurso(s) asignado(s). Reasigne o elimine los guardarecursos antes de desactivar el área.`,
      guardarecursosAsignados: guardarecursosAsignados.length
    };
  }
  
  return {
    isValid: true
  };
}

/**
 * Valida si un cambio de estado es válido
 * 
 * @param estadoActual - Estado actual del área
 * @param nuevoEstado - Nuevo estado propuesto
 * @returns true si el cambio es válido, false si no hay cambio
 * 
 * @example
 * if (!isValidEstadoChange('Activo', 'Activo')) {
 *   toast.info('Sin cambios');
 * }
 */
export function isValidEstadoChange(
  estadoActual: string,
  nuevoEstado: string
): boolean {
  return estadoActual !== nuevoEstado;
}

// ===== FUNCIONES DE ESTADO =====

/**
 * Determina el nuevo estado al hacer toggle
 * 
 * @param estadoActual - Estado actual
 * @returns Nuevo estado (Activo -> Desactivado o Desactivado -> Activo)
 * 
 * @example
 * const nuevoEstado = toggleEstado('Activo'); // 'Desactivado'
 */
export function toggleEstado(
  estadoActual: 'Activo' | 'Desactivado'
): 'Activo' | 'Desactivado' {
  return estadoActual === 'Activo' ? 'Desactivado' : 'Activo';
}

/**
 * Actualiza el estado de un área protegida
 * 
 * @param area - Área a actualizar
 * @param nuevoEstado - Nuevo estado
 * @returns Área con estado actualizado
 * 
 * @example
 * const desactivada = updateEstado(area, 'Desactivado');
 */
export function updateEstado(
  area: AreaProtegida,
  nuevoEstado: 'Activo' | 'Desactivado'
): AreaProtegida {
  return {
    ...area,
    estado: nuevoEstado
  };
}

/**
 * Obtiene el mensaje de confirmación según el estado
 * 
 * @param nuevoEstado - Estado al que se quiere cambiar
 * @returns Verbo del mensaje
 * 
 * @example
 * const mensaje = getEstadoMensaje('Desactivado'); // "desactivado"
 */
export function getEstadoMensaje(
  nuevoEstado: 'Activo' | 'Desactivado'
): string {
  const mensajes = {
    'Activo': 'activado',
    'Desactivado': 'desactivado'
  };
  
  return mensajes[nuevoEstado];
}

/**
 * Prepara un objeto EstadoPendiente para confirmación
 * 
 * @param area - Área que cambiará de estado
 * @param nuevoEstado - Nuevo estado propuesto
 * @returns Objeto con información del cambio pendiente
 * 
 * @example
 * const pendiente = prepareEstadoPendiente(area, 'Desactivado');
 */
export function prepareEstadoPendiente(
  area: AreaProtegida,
  nuevoEstado: 'Activo' | 'Desactivado'
): AreaEstadoPendiente {
  return {
    id: area.id,
    nuevoEstado,
    nombre: area.nombre
  };
}

// ===== FUNCIONES DE MAPA =====

/**
 * Calcula coordenadas para el mapa SVG
 * 
 * @param coordenadas - Coordenadas geográficas (lat, lng)
 * @returns Coordenadas SVG (x, y)
 * 
 * @example
 * const { x, y } = calculateSVGCoordinates({ lat: 15.5, lng: -90.25 });
 */
export function calculateSVGCoordinates(
  coordenadas: { lat: number; lng: number }
): { x: number; y: number } {
  const x = (coordenadas.lng + 92) * 180;
  const y = (19 - coordenadas.lat) * 80;
  
  return { x, y };
}

/**
 * Calcula viewBox centrado para un área específica
 * 
 * @param area - Área a centrar
 * @returns ViewBox string para SVG
 * 
 * @example
 * const viewBox = calculateCenteredViewBox(area);
 * <svg viewBox={viewBox}>...</svg>
 */
export function calculateCenteredViewBox(
  area: AreaProtegida
): string {
  const { x, y } = calculateSVGCoordinates(area.coordenadas);
  const width = 300;
  const height = 225;
  
  return `${x - width/2} ${y - height/2} ${width} ${height}`;
}

/**
 * Calcula viewBox por defecto para el mapa completo
 * 
 * @returns ViewBox string para SVG
 * 
 * @example
 * const viewBox = getDefaultViewBox();
 */
export function getDefaultViewBox(): string {
  return "0 0 800 600";
}

// ===== FUNCIONES DE UTILIDADES =====

/**
 * Obtiene el número de guardarecursos asignados a un área
 * 
 * @param area - Área protegida
 * @param guardarecursos - Lista de guardarecursos
 * @returns Número de guardarecursos asignados
 * 
 * @example
 * const count = getGuardarecursosCount(area, guardarecursos);
 */
export function getGuardarecursosCount(
  area: AreaProtegida,
  guardarecursos: Guardarecurso[]
): number {
  return guardarecursos.filter(g => g.areaAsignada === area.id).length;
}

/**
 * Crea un formulario vacío con valores predeterminados
 * 
 * @returns Objeto de formulario vacío
 * 
 * @example
 * const emptyForm = createEmptyFormData();
 */
export function createEmptyFormData(): AreaProtegidaFormData {
  return {
    nombre: '',
    departamento: '',
    extension: 0,
    fechaCreacion: new Date().toISOString().split('T')[0],
    coordenadas: { lat: 0, lng: 0 },
    descripcion: '',
    ecosistemas: ['Bosque Tropical Húmedo']
  };
}

/**
 * Convierte un área protegida a datos de formulario
 * 
 * @param area - Área protegida a convertir
 * @returns Datos de formulario
 * 
 * @example
 * const formData = areaToFormData(area);
 */
export function areaToFormData(
  area: AreaProtegida
): AreaProtegidaFormData {
  return {
    nombre: area.nombre,
    departamento: area.departamento,
    extension: area.extension,
    fechaCreacion: area.fechaCreacion,
    coordenadas: area.coordenadas,
    descripcion: area.descripcion,
    ecosistemas: area.ecosistemas
  };
}

// ===== CACHE DE PETICIONES (OPTIMIZACIÓN) =====

/**
 * Cache simple para la última petición de áreas protegidas
 * Reduce peticiones innecesarias al backend
 */
let areasProtegidasCache: {
  data: AreaProtegida[] | null;
  timestamp: number | null;
  ttl: number; // Time to live en milisegundos
} = {
  data: null,
  timestamp: null,
  ttl: 30000 // 30 segundos
};

/**
 * Limpia el cache de áreas protegidas
 */
export function clearAreasProtegidasCache(): void {
  areasProtegidasCache = {
    data: null,
    timestamp: null,
    ttl: 30000
  };
  console.log('🧹 Cache de áreas protegidas limpiado');
}

/**
 * Verifica si el cache es válido
 */
function isCacheValid(): boolean {
  if (!areasProtegidasCache || !areasProtegidasCache.data || !areasProtegidasCache.timestamp) {
    return false;
  }
  const now = Date.now();
  return (now - areasProtegidasCache.timestamp) < areasProtegidasCache.ttl;
}

// ===== API CALLS (OPTIMIZADAS) =====

/**
 * Obtiene todas las áreas protegidas desde el backend
 * OPTIMIZADO: Usa cache para reducir peticiones redundantes
 */
export async function fetchAreasProtegidas(forceRefresh: boolean = false): Promise<AreaProtegida[]> {
  try {
    // Si tenemos cache válido y no es refresh forzado, retornar del cache
    if (!forceRefresh && isCacheValid() && areasProtegidasCache.data) {
      console.log('✅ Usando áreas protegidas desde cache');
      return areasProtegidasCache.data;
    }

    console.log('📡 Consultando áreas protegidas desde backend...');
    const token = getRequiredAuthToken();
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-811550f1/areas`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      console.error('❌ Error HTTP al obtener áreas:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({ error: 'Error del servidor' }));
      const errorMessage = errorData.error || 'Error al obtener áreas protegidas';
      console.error('❌ Error del servidor:', errorMessage);
      
      // Crear un error con statusCode para que el frontend pueda manejarlo
      const error: any = new Error(errorMessage);
      error.statusCode = response.status;
      throw error;
    }

    const data = await response.json();
    console.log('📊 Respuesta del servidor (áreas):', data);
    
    if (!data.success) {
      const errorMessage = data.error || 'Error al obtener áreas protegidas';
      console.error('❌ Error del servidor:', errorMessage);
      throw new Error(errorMessage);
    }

    // Si no hay áreas, retornar array vacío en lugar de lanzar error
    if (!data.areas || data.areas.length === 0) {
      console.warn('⚠️ No hay áreas protegidas en la base de datos');
      areasProtegidasCache.data = [];
      areasProtegidasCache.timestamp = Date.now();
      return [];
    }

    // Mapear datos del backend al formato del frontend
    const areas = data.areas.map((a: any) => ({
      id: a.ar_id.toString(),
      nombre: a.ar_nombre,
      departamento: a.departamento?.dpt_nombre || 'Desconocido',
      extension: a.ar_extension || 0,
      fechaCreacion: a.created_at ? a.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      coordenadas: {
        lat: a.ar_latitud || 0,
        lng: a.ar_longitud || 0
      },
      descripcion: a.ar_descripcion || '',
      ecosistemas: a.ecosistema?.ecs_nombre ? [a.ecosistema.ecs_nombre] : ['Bosque Tropical Húmedo'],
      estado: a.estado?.std_nombre as 'Activo' | 'Desactivado',
      guardarecursos: []
    }));

    // Guardar en cache
    areasProtegidasCache.data = areas;
    areasProtegidasCache.timestamp = Date.now();
    
    console.log(`✅ ${areas.length} áreas protegidas cargadas y cacheadas`);
    return areas;
  } catch (error) {
    console.error('❌ Error en fetchAreasProtegidas:', error);
    throw error;
  }
}

/**
 * Crea una nueva área protegida en el backend
 * OPTIMIZADO: Limpia cache automáticamente
 */
export async function createAreaProtegidaAPI(formData: AreaProtegidaFormData): Promise<AreaProtegida> {
  try {
    const token = getRequiredAuthToken();
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-811550f1/areas`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          departamento: formData.departamento,
          extension: formData.extension,
          fechaCreacion: formData.fechaCreacion,
          lat: formData.coordenadas.lat,
          lng: formData.coordenadas.lng,
          descripcion: formData.descripcion,
          ecosistemas: formData.ecosistemas
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear área protegida');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al crear área protegida');
    }

    const area = data.area;

    // Limpiar cache
    clearAreasProtegidasCache();

    // Mapear respuesta al formato del frontend
    return {
      id: area.ar_id.toString(),
      nombre: area.ar_nombre,
      departamento: area.departamento?.dpt_nombre || 'Desconocido',
      extension: area.ar_extension || 0,
      fechaCreacion: area.created_at ? area.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      coordenadas: {
        lat: area.ar_latitud || 0,
        lng: area.ar_longitud || 0
      },
      descripcion: area.ar_descripcion || '',
      ecosistemas: area.ecosistema?.ecs_nombre ? [area.ecosistema.ecs_nombre] : ['Bosque Tropical Húmedo'],
      estado: 'Activo',
      guardarecursos: []
    };
  } catch (error) {
    console.error('❌ Error en createAreaProtegidaAPI:', error);
    throw error;
  }
}

/**
 * Actualiza un área protegida existente en el backend
 * OPTIMIZADO: Limpia cache automáticamente
 */
export async function updateAreaProtegidaAPI(
  id: string,
  formData: AreaProtegidaFormData
): Promise<AreaProtegida> {
  try {
    const token = getRequiredAuthToken();
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-811550f1/areas/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          departamento: formData.departamento,
          extension: formData.extension,
          fechaCreacion: formData.fechaCreacion,
          lat: formData.coordenadas.lat,
          lng: formData.coordenadas.lng,
          descripcion: formData.descripcion,
          ecosistemas: formData.ecosistemas
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al actualizar área protegida');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al actualizar área protegida');
    }

    const area = data.area;

    // Limpiar cache
    clearAreasProtegidasCache();

    return {
      id: area.ar_id.toString(),
      nombre: area.ar_nombre,
      departamento: area.departamento?.dpt_nombre || 'Desconocido',
      extension: area.ar_extension || 0,
      fechaCreacion: area.created_at ? area.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      coordenadas: {
        lat: area.ar_latitud || 0,
        lng: area.ar_longitud || 0
      },
      descripcion: area.ar_descripcion || '',
      ecosistemas: area.ecosistema?.ecs_nombre ? [area.ecosistema.ecs_nombre] : ['Bosque Tropical Húmedo'],
      estado: area.estado?.std_nombre as 'Activo' | 'Desactivado',
      guardarecursos: []
    };
  } catch (error) {
    console.error('❌ Error en updateAreaProtegidaAPI:', error);
    throw error;
  }
}

/**
 * Cambia el estado de un área protegida en el backend
 * OPTIMIZADO: Limpia cache automáticamente
 */
export async function cambiarEstadoAreaAPI(
  id: string,
  nuevoEstado: 'Activo' | 'Desactivado'
): Promise<void> {
  try {
    const token = getRequiredAuthToken();
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-811550f1/areas/${id}/estado`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nuevoEstado })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al cambiar estado');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al cambiar estado');
    }

    // Limpiar cache
    clearAreasProtegidasCache();
  } catch (error) {
    console.error('❌ Error en cambiarEstadoAreaAPI:', error);
    throw error;
  }
}

/**
 * Servicio principal de Áreas Protegidas
 * Agrupa todas las funcionalidades en un objeto cohesivo
 */
export const areasProtegidasService = {
  // API Calls
  fetchAreasProtegidas,
  fetchAreas: fetchAreasProtegidas, // Alias para compatibilidad con otros servicios
  createAreaProtegidaAPI,
  updateAreaProtegidaAPI,
  cambiarEstadoAreaAPI,
  
  // Cache
  clearAreasProtegidasCache,
  
  // Constantes
  departamentos: DEPARTAMENTOS_GUATEMALA,
  ecosistemas: ECOSISTEMAS_GUATEMALA,
  
  // Filtrado
  filterAreasProtegidas,
  
  // Creación y actualización
  createAreaProtegida,
  updateAreaProtegida,
  
  // Estado
  isValidEstadoChange,
  toggleEstado,
  updateEstado,
  getEstadoMensaje,
  prepareEstadoPendiente,
  
  // Validación
  validateAreaDeactivation,
  
  // Cálculos de mapa
  calculateSVGCoordinates,
  calculateCenteredViewBox,
  getDefaultViewBox,
  
  // Utilidades
  getGuardarecursosCount,
  createEmptyFormData,
  areaToFormData
};

export default areasProtegidasService;