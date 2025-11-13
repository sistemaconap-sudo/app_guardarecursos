/**
 * 📦 Equipos Service
 * 
 * Servicio centralizado que maneja toda la lógica funcional del módulo de Control de Equipos,
 * separando la lógica de negocio de la presentación y conectado con Supabase.
 * 
 * OPTIMIZADO: Cache de peticiones, reducción de consultas redundantes
 * 
 * @module utils/equiposService
 */

import { Equipo, Guardarecurso } from '../types';
import { projectId } from './supabase/info';
import { getRequiredAuthToken } from './base-api-service';

/**
 * Interface para los datos del formulario de equipos
 */
export interface EquipoFormData {
  nombre: string;
  codigo: string;
  marca: string;
  modelo: string;
  observaciones: string;
  guardarecursoAsignado: string;
}

/**
 * Interface para usuario actual
 */
export interface CurrentUser {
  id: string;
  rol: string;
  nombre: string;
  apellido: string;
  email?: string;
}

/**
 * Tipos de estado de equipo
 */
export type EstadoEquipo = 'Operativo' | 'En Reparación' | 'Desactivado';

/**
 * Configuración de estados de equipos
 */
export const ESTADOS_CONFIG = {
  'Operativo': {
    label: 'Operativo',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700',
    icon: 'CheckCircle2',
    color: '#10b981'
  },
  'En Reparación': {
    label: 'En Reparación',
    badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-300 dark:border-orange-700',
    icon: 'Wrench',
    color: '#f97316'
  },
  'Desactivado': {
    label: 'Desactivado',
    badgeClass: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-300 dark:border-gray-700',
    icon: 'XCircle',
    color: '#6b7280'
  }
} as const;

// ===== FUNCIONES DE FILTRADO =====

/**
 * Filtra equipos según rol y búsqueda
 * - Para Guardarecurso: solo sus equipos asignados (excluye desactivados)
 * - Para otros roles: todos excepto desactivados
 * 
 * @param equipos - Lista completa de equipos
 * @param searchTerm - Término de búsqueda
 * @param currentUser - Usuario actual
 * @param guardarecursos - Lista de guardarecursos para buscar ID
 * @returns Array de equipos filtrados
 * 
 * @example
 * const filtered = filterEquipos(equipos, searchTerm, currentUser, guardarecursos);
 */
export function filterEquipos(
  equipos: Equipo[],
  searchTerm: string,
  currentUser: CurrentUser | undefined,
  guardarecursos: Guardarecurso[]
): Equipo[] {
  const isGuardarecurso = currentUser?.rol === 'Guardarecurso';
  
  // Si es guardarecurso, solo mostrar sus equipos (excluir desactivados)
  if (isGuardarecurso) {
    // Buscar el ID del guardarecurso basado en el email o nombre del usuario actual
    const guardarecursoData = guardarecursos.find(g => 
      g.email === currentUser?.email || 
      (currentUser?.nombre && currentUser?.apellido && 
       g.nombre === currentUser.nombre && g.apellido === currentUser.apellido)
    );
    
    if (guardarecursoData) {
      return equipos.filter(e => 
        e.guardarecursoAsignado === guardarecursoData.id && 
        e.estado !== 'Desactivado' // Excluir equipos desactivados
      );
    }
    return [];
  }
  
  // Para otros roles, aplicar filtros normalmente (excluir desactivados)
  return equipos.filter(e => {
    // Excluir equipos desactivados (no aparecen en ningún lado)
    if (e.estado === 'Desactivado') {
      return false;
    }
    
    const matchesSearch = 
      e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.marca && e.marca.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });
}

// ===== FUNCIONES DE CREACIÓN Y ACTUALIZACIÓN =====

/**
 * Crea un nuevo equipo con valores predeterminados
 * 
 * @param formData - Datos del formulario
 * @returns Nuevo objeto Equipo
 * 
 * @example
 * const nuevoEquipo = createEquipo(formData);
 */
export function createEquipo(formData: EquipoFormData): Equipo {
  return {
    id: Date.now().toString(),
    nombre: formData.nombre,
    codigo: formData.codigo,
    marca: formData.marca,
    modelo: formData.modelo,
    observaciones: formData.observaciones,
    guardarecursoAsignado: formData.guardarecursoAsignado === 'none' ? undefined : formData.guardarecursoAsignado,
    estado: 'Operativo', // Siempre se crea como Operativo
    tipo: inferTipoEquipo(formData.nombre) // Inferir tipo basado en el nombre
  };
}

/**
 * Actualiza un equipo existente
 * 
 * @param equipo - Equipo a actualizar
 * @param formData - Datos del formulario
 * @returns Equipo actualizado
 * 
 * @example
 * const actualizado = updateEquipo(existente, formData);
 */
export function updateEquipo(
  equipo: Equipo,
  formData: EquipoFormData
): Equipo {
  return {
    ...equipo,
    nombre: formData.nombre,
    codigo: formData.codigo,
    marca: formData.marca,
    modelo: formData.modelo,
    observaciones: formData.observaciones,
    guardarecursoAsignado: formData.guardarecursoAsignado === 'none' ? undefined : formData.guardarecursoAsignado
  };
}

/**
 * Actualiza el estado de un equipo
 * - Si se cambia a "En Reparación", desasigna automáticamente
 * - Si se cambia a "Desactivado", solo cambia el estado
 * 
 * @param equipo - Equipo a actualizar
 * @param nuevoEstado - Nuevo estado
 * @returns Equipo con estado actualizado
 * 
 * @example
 * const enReparacion = updateEstado(equipo, 'En Reparación');
 * // enReparacion.guardarecursoAsignado === undefined
 */
export function updateEstado(
  equipo: Equipo,
  nuevoEstado: EstadoEquipo
): Equipo {
  // Si se cambia a "En Reparación", desasignar automáticamente
  if (nuevoEstado === 'En Reparación') {
    return { 
      ...equipo, 
      estado: nuevoEstado, 
      guardarecursoAsignado: undefined 
    };
  }
  
  // Si se cambia a "Desactivado", solo cambiar el estado (se ocultará automáticamente)
  return { 
    ...equipo, 
    estado: nuevoEstado 
  };
}

// ===== FUNCIONES DE ESTILOS =====

/**
 * Obtiene la clase CSS del badge según el estado
 * 
 * @param estado - Estado del equipo
 * @returns Clase CSS para el badge
 * 
 * @example
 * const badgeClass = getEstadoBadgeClass('Operativo');
 * <Badge className={badgeClass}>Operativo</Badge>
 */
export function getEstadoBadgeClass(estado: EstadoEquipo): string {
  return ESTADOS_CONFIG[estado]?.badgeClass || ESTADOS_CONFIG['Desactivado'].badgeClass;
}

/**
 * Obtiene el nombre del icono según el estado
 * 
 * @param estado - Estado del equipo
 * @returns Nombre del icono de lucide-react
 * 
 * @example
 * const iconName = getEstadoIcon('Operativo'); // 'CheckCircle2'
 */
export function getEstadoIcon(estado: EstadoEquipo): string {
  return ESTADOS_CONFIG[estado]?.icon || ESTADOS_CONFIG['Desactivado'].icon;
}

/**
 * Obtiene el color según el estado
 * 
 * @param estado - Estado del equipo
 * @returns Color hexadecimal
 * 
 * @example
 * const color = getEstadoColor('Operativo'); // '#10b981'
 */
export function getEstadoColor(estado: EstadoEquipo): string {
  return ESTADOS_CONFIG[estado]?.color || ESTADOS_CONFIG['Desactivado'].color;
}

// ===== FUNCIONES DE INFERENCIA =====

/**
 * Infiere el tipo de equipo basado en palabras clave en el nombre
 * 
 * @param nombre - Nombre del equipo
 * @returns Tipo inferido
 * 
 * @example
 * inferTipoEquipo('Radio Motorola'); // 'Radio'
 * inferTipoEquipo('GPS Garmin'); // 'GPS'
 * inferTipoEquipo('Kit de Primeros Auxilios'); // 'Otro'
 */
export function inferTipoEquipo(nombre: string): 'GPS' | 'Radio' | 'Binoculares' | 'Cámara' | 'Vehículo' | 'Herramienta' | 'Otro' {
  const nombreLower = nombre.toLowerCase();
  
  if (nombreLower.includes('gps')) return 'GPS';
  if (nombreLower.includes('radio')) return 'Radio';
  if (nombreLower.includes('binocular')) return 'Binoculares';
  if (nombreLower.includes('cámara') || nombreLower.includes('camara') || nombreLower.includes('gopro')) return 'Cámara';
  if (nombreLower.includes('vehículo') || nombreLower.includes('vehiculo') || nombreLower.includes('toyota') || nombreLower.includes('ford') || nombreLower.includes('chevrolet')) return 'Vehículo';
  if (nombreLower.includes('machete') || nombreLower.includes('herramienta')) return 'Herramienta';
  
  return 'Otro';
}

// ===== FUNCIONES DE UTILIDADES =====

/**
 * Crea un formulario vacío con valores predeterminados
 * 
 * @returns Objeto de formulario vacío
 * 
 * @example
 * const emptyForm = createEmptyFormData();
 */
export function createEmptyFormData(): EquipoFormData {
  return {
    nombre: '',
    codigo: '',
    marca: '',
    modelo: '',
    observaciones: '',
    guardarecursoAsignado: ''
  };
}

/**
 * Convierte un equipo a datos de formulario
 * 
 * @param equipo - Equipo a convertir
 * @returns Datos de formulario
 * 
 * @example
 * const formData = equipoToFormData(equipo);
 */
export function equipoToFormData(
  equipo: Equipo
): EquipoFormData {
  return {
    nombre: equipo.nombre,
    codigo: equipo.codigo,
    marca: equipo.marca || '',
    modelo: equipo.modelo || '',
    observaciones: equipo.observaciones || '',
    guardarecursoAsignado: equipo.guardarecursoAsignado || ''
  };
}

/**
 * Verifica si un usuario es guardarecurso
 * 
 * @param currentUser - Usuario actual
 * @returns true si es guardarecurso
 * 
 * @example
 * if (isGuardarecurso(currentUser)) {
 *   // Mostrar vista especial
 * }
 */
export function isGuardarecurso(currentUser: CurrentUser | undefined): boolean {
  return currentUser?.rol === 'Guardarecurso';
}

/**
 * Obtiene el ID del guardarecurso del usuario actual
 * 
 * @param currentUser - Usuario actual
 * @param guardarecursos - Lista de guardarecursos
 * @returns ID del guardarecurso o undefined
 * 
 * @example
 * const guardarecursoId = getGuardarecursoId(currentUser, guardarecursos);
 */
export function getGuardarecursoId(
  currentUser: CurrentUser | undefined,
  guardarecursos: Guardarecurso[]
): string | undefined {
  if (!currentUser) return undefined;
  
  const guardarecursoData = guardarecursos.find(g => 
    g.email === currentUser.email || 
    (currentUser.nombre && currentUser.apellido && 
     g.nombre === currentUser.nombre && g.apellido === currentUser.apellido)
  );
  
  return guardarecursoData?.id;
}

/**
 * Cuenta los equipos por estado
 * 
 * @param equipos - Lista de equipos
 * @returns Objeto con conteo por estado
 * 
 * @example
 * const stats = countEquiposByEstado(equipos);
 * // { Operativo: 10, 'En Reparación': 2, Desactivado: 1 }
 */
export function countEquiposByEstado(
  equipos: Equipo[]
): Record<EstadoEquipo, number> {
  return equipos.reduce((acc, equipo) => {
    acc[equipo.estado] = (acc[equipo.estado] || 0) + 1;
    return acc;
  }, {} as Record<EstadoEquipo, number>);
}

/**
 * Cuenta los equipos asignados a un guardarecurso
 * 
 * @param guardarecursoId - ID del guardarecurso
 * @param equipos - Lista de equipos
 * @returns Número de equipos asignados
 * 
 * @example
 * const count = countEquiposByGuardarecurso('1', equipos);
 */
export function countEquiposByGuardarecurso(
  guardarecursoId: string,
  equipos: Equipo[]
): number {
  return equipos.filter(e => e.guardarecursoAsignado === guardarecursoId).length;
}

/**
 * Obtiene los equipos asignados a un guardarecurso
 * 
 * @param guardarecursoId - ID del guardarecurso
 * @param equipos - Lista de equipos
 * @returns Array de equipos asignados
 * 
 * @example
 * const misEquipos = getEquiposByGuardarecurso('1', equipos);
 */
export function getEquiposByGuardarecurso(
  guardarecursoId: string,
  equipos: Equipo[]
): Equipo[] {
  return equipos.filter(e => e.guardarecursoAsignado === guardarecursoId);
}

/**
 * Valida si un código de inventario ya existe
 * 
 * @param codigo - Código a validar
 * @param equipos - Lista de equipos
 * @param excludeId - ID del equipo a excluir (para edición)
 * @returns true si el código ya existe
 * 
 * @example
 * if (codigoExists('GPS-001', equipos, currentEquipoId)) {
 *   toast.error('El código ya existe');
 * }
 */
export function codigoExists(
  codigo: string,
  equipos: Equipo[],
  excludeId?: string
): boolean {
  return equipos.some(e => 
    e.codigo === codigo && e.id !== excludeId
  );
}

/**
 * Obtiene todos los estados disponibles
 * 
 * @returns Array de estados
 * 
 * @example
 * const estados = getAllEstados();
 * estados.map(e => <option>{e}</option>)
 */
export function getAllEstados(): EstadoEquipo[] {
  return ['Operativo', 'En Reparación', 'Desactivado'];
}

// ===== CACHE DE PETICIONES (OPTIMIZACIÓN) =====

/**
 * Cache simple para la última petición de equipos
 * Reduce peticiones innecesarias al backend
 */
let equiposCache: {
  data: any[] | null;
  timestamp: number | null;
  ttl: number; // Time to live en milisegundos
} = {
  data: null,
  timestamp: null,
  ttl: 30000 // 30 segundos
};

/**
 * Limpia el cache de equipos
 * Útil después de crear/actualizar/eliminar un equipo
 */
export function clearEquiposCache(): void {
  equiposCache.data = null;
  equiposCache.timestamp = null;
  console.log('🧹 Cache de equipos limpiado');
}

/**
 * Verifica si el cache es válido
 */
function isCacheValid(): boolean {
  if (!equiposCache.data || !equiposCache.timestamp) {
    return false;
  }
  const now = Date.now();
  return (now - equiposCache.timestamp) < equiposCache.ttl;
}

// ===== API CALLS (OPTIMIZADAS) =====

/**
 * 🌐 API: Obtener todos los equipos desde Supabase
 * OPTIMIZADO: Usa cache para reducir peticiones redundantes
 * 
 * @param forceRefresh - Forzar recarga desde el servidor
 * @returns Promise con array de equipos
 * 
 * @example
 * const equipos = await fetchEquipos();
 */
export async function fetchEquipos(forceRefresh: boolean = false): Promise<any[]> {
  try {
    // Si tenemos cache válido y no es refresh forzado, retornar del cache
    if (!forceRefresh && isCacheValid() && equiposCache.data) {
      console.log('✅ Usando equipos desde cache');
      return equiposCache.data;
    }

    console.log('📡 Consultando equipos desde backend...');
    const token = getRequiredAuthToken();

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-811550f1/equipos`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al cargar equipos');
    }

    // Transformar datos de Supabase a formato de la app
    const equipos = (data.equipos || []).map((eq: any) => ({
      id: eq.eqp_id?.toString() || '',
      nombre: eq.eqp_nombre || '',
      codigo: eq.eqp_codigo || '',
      marca: eq.eqp_marca || '',
      modelo: eq.eqp_modelo || '',
      observaciones: eq.eqp_observaciones || '',
      estado: eq.estado?.std_nombre || 'Operativo',
      guardarecursoAsignado: eq.eqp_usuario?.toString() || undefined,
      tipo: inferTipoEquipo(eq.eqp_nombre || '')
    }));

    // Guardar en cache
    equiposCache.data = equipos;
    equiposCache.timestamp = Date.now();
    
    console.log(`✅ ${equipos.length} equipos cargados y cacheados`);
    return equipos;
  } catch (error) {
    console.error('❌ Error al obtener equipos:', error);
    throw error;
  }
}

/**
 * 🌐 API: Crear equipo en Supabase
 * OPTIMIZADO: Limpia cache automáticamente
 * 
 * @param formData - Datos del formulario
 * @returns Promise con el equipo creado
 * 
 * @example
 * const nuevoEquipo = await createEquipoAPI(formData);
 */
export async function createEquipoAPI(formData: EquipoFormData): Promise<any> {
  try {
    const token = getRequiredAuthToken();

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-811550f1/equipos`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al crear equipo');
    }

    // Limpiar cache
    clearEquiposCache();

    // Transformar datos de Supabase a formato de la app
    const eq = data.equipo;
    return {
      id: eq.eqp_id?.toString() || '',
      nombre: eq.eqp_nombre || '',
      codigo: eq.eqp_codigo || '',
      marca: eq.eqp_marca || '',
      modelo: eq.eqp_modelo || '',
      observaciones: eq.eqp_observaciones || '',
      estado: eq.estado?.std_nombre || 'Operativo',
      guardarecursoAsignado: eq.eqp_usuario?.toString() || undefined,
      tipo: inferTipoEquipo(eq.eqp_nombre || '')
    };
  } catch (error) {
    console.error('❌ Error al crear equipo:', error);
    throw error;
  }
}

/**
 * 🌐 API: Actualizar equipo en Supabase
 * OPTIMIZADO: Limpia cache automáticamente
 * 
 * IMPORTANTE: Solo se pueden editar observaciones y asignación de guardarecurso.
 * Los campos nombre, código, marca y modelo NO son editables.
 * 
 * @param equipoId - ID del equipo
 * @param formData - Datos del formulario
 * @returns Promise con el equipo actualizado
 * 
 * @example
 * const equipoActualizado = await updateEquipoAPI('1', formData);
 */
export async function updateEquipoAPI(equipoId: string, formData: EquipoFormData): Promise<any> {
  try {
    const token = getRequiredAuthToken();

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-811550f1/equipos/${equipoId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          // SOLO enviar observaciones y guardarecursoAsignado
          // nombre, codigo, marca y modelo NO se envían porque no son editables
          observaciones: formData.observaciones,
          guardarecursoAsignado: formData.guardarecursoAsignado
        })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al actualizar equipo');
    }

    // Limpiar cache
    clearEquiposCache();

    // Transformar datos de Supabase a formato de la app
    const eq = data.equipo;
    return {
      id: eq.eqp_id?.toString() || '',
      nombre: eq.eqp_nombre || '',
      codigo: eq.eqp_codigo || '',
      marca: eq.eqp_marca || '',
      modelo: eq.eqp_modelo || '',
      observaciones: eq.eqp_observaciones || '',
      estado: eq.estado?.std_nombre || 'Operativo',
      guardarecursoAsignado: eq.eqp_usuario?.toString() || undefined,
      tipo: inferTipoEquipo(eq.eqp_nombre || '')
    };
  } catch (error) {
    console.error('❌ Error al actualizar equipo:', error);
    throw error;
  }
}

/**
 * 🌐 API: Cambiar estado de equipo en Supabase
 * OPTIMIZADO: Limpia cache automáticamente
 * 
 * @param equipoId - ID del equipo
 * @param nuevoEstado - Nuevo estado
 * @returns Promise
 * 
 * @example
 * await updateEstadoAPI('1', 'En Reparación');
 */
export async function updateEstadoAPI(equipoId: string, nuevoEstado: EstadoEquipo): Promise<void> {
  try {
    const token = getRequiredAuthToken();

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-811550f1/equipos/${equipoId}/estado`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nuevoEstado })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al cambiar estado del equipo');
    }

    // Limpiar cache
    clearEquiposCache();
  } catch (error) {
    console.error('❌ Error al cambiar estado del equipo:', error);
    throw error;
  }
}

/**
 * Servicio principal de Equipos
 * Agrupa todas las funcionalidades en un objeto cohesivo
 */
export const equiposService = {
  // Configuración
  ESTADOS_CONFIG,
  
  // API calls
  fetchEquipos,
  createEquipoAPI,
  updateEquipoAPI,
  updateEstadoAPI,
  
  // Cache
  clearEquiposCache,
  
  // Filtrado
  filterEquipos,
  
  // Creación y actualización (local)
  createEquipo,
  updateEquipo,
  updateEstado,
  
  // Estilos y UI
  getEstadoBadgeClass,
  getEstadoIcon,
  getEstadoColor,
  
  // Inferencia
  inferTipoEquipo,
  
  // Transformación de datos
  createEmptyFormData,
  equipoToFormData,
  
  // Validación y verificación
  isGuardarecurso,
  getGuardarecursoId,
  codigoExists,
  
  // Estadísticas
  countEquiposByEstado,
  countEquiposByGuardarecurso,
  getEquiposByGuardarecurso,
  
  // Utilidades
  getAllEstados
};

export default equiposService;
