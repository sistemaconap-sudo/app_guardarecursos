/**
 * 👤 Guardarecursos Service
 * 
 * Servicio centralizado que maneja toda la lógica funcional del módulo de Guardarecursos,
 * separando la lógica de negocio de la presentación.
 * 
 * OPTIMIZADO: Cache de peticiones, reducción de consultas redundantes
 * 
 * @module utils/guardarecursosService
 */

import { Guardarecurso, Usuario, AreaProtegida } from '../types';
import { projectId, publicAnonKey } from './supabase/info';
import { getRequiredAuthToken } from './base-api-service';

/**
 * Interface para los datos del formulario de guardarecursos
 */
export interface GuardarecursoFormData {
  nombre: string;
  apellido: string;
  dpi: string;
  telefono: string;
  email: string;
  password: string;
  areaAsignada: string;
  estado: 'Activo' | 'Suspendido' | 'Desactivado';
}

/**
 * Interface para el estado pendiente de cambio
 */
export interface EstadoPendiente {
  id: string;
  nuevoEstado: 'Activo' | 'Suspendido' | 'Desactivado';
  nombre: string;
}

// ===== FUNCIONES DE FILTRADO (OPTIMIZADAS) =====

/**
 * Filtra guardarecursos excluyendo desactivados
 * OPTIMIZADO: Eliminada dependencia de usuarios
 * 
 * @param guardarecursos - Lista completa de guardarecursos
 * @param searchTerm - Término de búsqueda
 * @param selectedArea - Área seleccionada para filtrar
 * @returns Array de guardarecursos filtrados
 * 
 * @example
 * const filtered = filterGuardarecursos(guardarecursos, 'Juan', 'area-1');
 */
export function filterGuardarecursos(
  guardarecursos: Guardarecurso[],
  searchTerm: string,
  selectedArea: string
): Guardarecurso[] {
  return guardarecursos.filter(g => {
    // Excluir usuarios desactivados (no aparecen en ningún lado)
    if (g.estado === 'Desactivado') {
      return false;
    }
    
    // Filtrar por búsqueda
    const matchesSearch = 
      g.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.dpi.includes(searchTerm) ||
      g.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtrar por área
    const matchesArea = !selectedArea || selectedArea === 'all' || g.areaAsignada === selectedArea;
    
    return matchesSearch && matchesArea;
  });
}

// ===== FUNCIONES DE CREACIÓN =====

/**
 * Crea un nuevo guardarecurso con valores predeterminados
 * 
 * @param formData - Datos del formulario
 * @returns Nuevo objeto Guardarecurso
 * 
 * @example
 * const nuevoGuardarecurso = createGuardarecurso(formData);
 */
export function createGuardarecurso(formData: GuardarecursoFormData): Guardarecurso {
  const newId = Date.now().toString();
  
  return {
    id: newId,
    nombre: formData.nombre,
    apellido: formData.apellido,
    dpi: formData.dpi,
    telefono: formData.telefono,
    email: formData.email,
    password: formData.password,
    puesto: 'Guardarecurso',
    areaAsignada: formData.areaAsignada,
    fechaIngreso: new Date().toISOString().split('T')[0],
    estado: 'Activo', // Siempre se crea como Activo
    equiposAsignados: [],
    actividades: []
  };
}

/**
 * Crea un usuario asociado al guardarecurso
 * 
 * @param formData - Datos del formulario
 * @param guardarecursoId - ID del guardarecurso asociado
 * @returns Nuevo objeto Usuario
 * 
 * @example
 * const nuevoUsuario = createUsuarioForGuardarecurso(formData, '12345');
 */
export function createUsuarioForGuardarecurso(
  formData: GuardarecursoFormData,
  guardarecursoId: string
): Usuario {
  return {
    id: guardarecursoId, // Usar el mismo ID para mantener la relación
    nombre: formData.nombre,
    apellido: formData.apellido,
    email: formData.email,
    telefono: formData.telefono,
    password: formData.password,
    rol: 'Guardarecurso',
    estado: 'Activo', // Siempre se crea como Activo
    fechaCreacion: new Date().toISOString().split('T')[0],
    ultimoAcceso: new Date().toISOString(),
    permisos: ['guarda.view', 'guarda.create.incidentes', 'guarda.create.fotos'],
    areaAsignada: formData.areaAsignada
  };
}

// ===== FUNCIONES DE ACTUALIZACIÓN =====

/**
 * Actualiza un guardarecurso existente
 * 
 * @param guardarecurso - Guardarecurso a actualizar
 * @param formData - Datos del formulario
 * @returns Guardarecurso actualizado
 * 
 * @example
 * const actualizado = updateGuardarecurso(existente, formData);
 */
export function updateGuardarecurso(
  guardarecurso: Guardarecurso,
  formData: GuardarecursoFormData
): Guardarecurso {
  return {
    ...guardarecurso,
    nombre: formData.nombre,
    apellido: formData.apellido,
    dpi: formData.dpi,
    telefono: formData.telefono,
    email: formData.email,
    areaAsignada: formData.areaAsignada
    // NO actualizar estado ni contraseña aquí
  };
}

/**
 * Actualiza el usuario asociado al guardarecurso
 * 
 * @param usuario - Usuario a actualizar
 * @param formData - Datos del formulario
 * @returns Usuario actualizado
 * 
 * @example
 * const usuarioActualizado = updateUsuarioForGuardarecurso(usuario, formData);
 */
export function updateUsuarioForGuardarecurso(
  usuario: Usuario,
  formData: GuardarecursoFormData
): Usuario {
  return {
    ...usuario,
    nombre: formData.nombre,
    apellido: formData.apellido,
    email: formData.email,
    telefono: formData.telefono,
    areaAsignada: formData.areaAsignada
    // NO actualizar contraseña ni estado aquí
  };
}

// ===== FUNCIONES DE ESTADO =====

/**
 * Valida si un cambio de estado es válido
 * 
 * @param estadoActual - Estado actual del guardarecurso
 * @param nuevoEstado - Nuevo estado propuesto
 * @returns true si el cambio es válido, false si no hay cambio
 * 
 * @example
 * if (!isValidEstadoChange('Activo', 'Activo')) {
 *   // No hacer nada, es el mismo estado
 * }
 */
export function isValidEstadoChange(
  estadoActual: string,
  nuevoEstado: string
): boolean {
  return estadoActual !== nuevoEstado;
}

/**
 * Actualiza el estado de un guardarecurso
 * 
 * @param guardarecurso - Guardarecurso a actualizar
 * @param nuevoEstado - Nuevo estado
 * @returns Guardarecurso con estado actualizado
 * 
 * @example
 * const suspendido = updateEstado(guardarecurso, 'Suspendido');
 */
export function updateEstado(
  guardarecurso: Guardarecurso,
  nuevoEstado: 'Activo' | 'Suspendido' | 'Desactivado'
): Guardarecurso {
  return {
    ...guardarecurso,
    estado: nuevoEstado
  };
}

/**
 * Actualiza el estado del usuario asociado
 * 
 * @param usuario - Usuario a actualizar
 * @param nuevoEstado - Nuevo estado
 * @returns Usuario con estado actualizado
 * 
 * @example
 * const usuarioSuspendido = updateUsuarioEstado(usuario, 'Suspendido');
 */
export function updateUsuarioEstado(
  usuario: Usuario,
  nuevoEstado: 'Activo' | 'Suspendido' | 'Desactivado'
): Usuario {
  return {
    ...usuario,
    estado: nuevoEstado as any
  };
}

/**
 * Obtiene el mensaje de confirmación según el estado
 * 
 * @param nuevoEstado - Estado al que se quiere cambiar
 * @returns Verbo del mensaje
 * 
 * @example
 * const mensaje = getEstadoMensaje('Suspendido'); // "suspendido"
 */
export function getEstadoMensaje(
  nuevoEstado: 'Activo' | 'Suspendido' | 'Desactivado'
): string {
  const mensajes = {
    'Activo': 'activado',
    'Suspendido': 'suspendido',
    'Desactivado': 'desactivado'
  };
  
  return mensajes[nuevoEstado];
}

/**
 * Prepara un objeto EstadoPendiente para confirmación
 * 
 * @param guardarecurso - Guardarecurso que cambiará de estado
 * @param nuevoEstado - Nuevo estado propuesto
 * @returns Objeto con información del cambio pendiente
 * 
 * @example
 * const pendiente = prepareEstadoPendiente(guardarecurso, 'Suspendido');
 */
export function prepareEstadoPendiente(
  guardarecurso: Guardarecurso,
  nuevoEstado: 'Activo' | 'Suspendido' | 'Desactivado'
): EstadoPendiente {
  return {
    id: guardarecurso.id,
    nuevoEstado,
    nombre: `${guardarecurso.nombre} ${guardarecurso.apellido}`
  };
}

// ===== FUNCIONES DE PERMISOS =====

/**
 * Verifica si un usuario puede cambiar contraseñas
 * 
 * @param currentUser - Usuario actual del sistema
 * @returns true si puede cambiar contraseñas, false si no
 * 
 * @example
 * if (canChangePassword(currentUser)) {
 *   // Mostrar botón de cambiar contraseña
 * }
 */
export function canChangePassword(currentUser?: any): boolean {
  if (!currentUser) return false;
  // Administradores y Coordinadores pueden cambiar contraseñas de guardarecursos
  return currentUser.rol === 'Administrador' || currentUser.rol === 'Coordinador';
}

// ===== FUNCIONES DE UTILIDADES =====

/**
 * Obtiene el usuario asociado a un guardarecurso
 * 
 * @param guardarecurso - Guardarecurso
 * @param usuarios - Lista de usuarios
 * @returns Usuario asociado o undefined
 * 
 * @example
 * const usuario = getAssociatedUser(guardarecurso, usuarios);
 */
export function getAssociatedUser(
  guardarecurso: Guardarecurso,
  usuarios: Usuario[]
): Usuario | undefined {
  return usuarios.find(u => u.email === guardarecurso.email);
}

/**
 * Crea un formulario vacío con valores predeterminados
 * 
 * @returns Objeto de formulario vacío
 * 
 * @example
 * const emptyForm = createEmptyFormData();
 */
export function createEmptyFormData(): GuardarecursoFormData {
  return {
    nombre: '',
    apellido: '',
    dpi: '',
    telefono: '',
    email: '',
    password: '',
    areaAsignada: '',
    estado: 'Activo'
  };
}

/**
 * Convierte un guardarecurso a datos de formulario
 * 
 * @param guardarecurso - Guardarecurso a convertir
 * @returns Datos de formulario
 * 
 * @example
 * const formData = guardarecursoToFormData(guardarecurso);
 */
export function guardarecursoToFormData(
  guardarecurso: Guardarecurso
): GuardarecursoFormData {
  // Normalizar areaAsignada: convertir cadena vacía a "none" para el formulario
  const areaAsignada = !guardarecurso.areaAsignada || guardarecurso.areaAsignada === '' 
    ? 'none' 
    : guardarecurso.areaAsignada;
  
  return {
    nombre: guardarecurso.nombre,
    apellido: guardarecurso.apellido,
    dpi: guardarecurso.dpi,
    telefono: guardarecurso.telefono,
    email: guardarecurso.email,
    password: '', // Dejar vacío para no cambiar la contraseña
    areaAsignada: areaAsignada,
    estado: guardarecurso.estado
  };
}

// ===== CACHE DE PETICIONES (OPTIMIZACIÓN) =====

/**
 * Cache simple para la última petición de guardarecursos
 * Reduce peticiones innecesarias al backend
 */
let guardarecursosCache: {
  data: Guardarecurso[] | null;
  timestamp: number | null;
  ttl: number; // Time to live en milisegundos
} = {
  data: null,
  timestamp: null,
  ttl: 30000 // 30 segundos
};

/**
 * Limpia el cache de guardarecursos
 * Útil después de crear/actualizar/eliminar un guardarecurso
 */
export function clearGuardarecursosCache(): void {
  guardarecursosCache.data = null;
  guardarecursosCache.timestamp = null;
  console.log('🧹 Cache de guardarecursos limpiado');
}

/**
 * Verifica si el cache es válido
 */
function isCacheValid(): boolean {
  if (!guardarecursosCache.data || !guardarecursosCache.timestamp) {
    return false;
  }
  const now = Date.now();
  return (now - guardarecursosCache.timestamp) < guardarecursosCache.ttl;
}

// ===== API CALLS (OPTIMIZADAS) =====

/**
 * Obtiene todos los guardarecursos desde el backend
 * OPTIMIZADO: Usa cache para reducir peticiones redundantes
 */
export async function fetchGuardarecursos(accessToken?: string, forceRefresh: boolean = false): Promise<Guardarecurso[]> {
  try {
    // Si tenemos cache válido y no es refresh forzado, retornar del cache
    if (!forceRefresh && isCacheValid() && guardarecursosCache.data) {
      console.log('✅ Usando guardarecursos desde cache');
      return guardarecursosCache.data;
    }

    console.log('📡 Consultando guardarecursos desde backend...');
    // SIEMPRE requerir token JWT válido
    const token = accessToken || getRequiredAuthToken();
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-811550f1/guardarecursos`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener guardarecursos');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al obtener guardarecursos');
    }

    // Mapear datos del backend al formato del frontend
    const guardarecursos = data.guardarecursos.map((g: any) => ({
      id: g.usr_id.toString(),
      nombre: g.usr_nombre,
      apellido: g.usr_apellido,
      dpi: g.usr_dpi || '',
      telefono: g.usr_telefono || '',
      email: g.usr_correo,
      password: '', // No devolver contraseñas
      puesto: 'Guardarecurso',
      areaAsignada: g.area?.ar_id?.toString() || g.usr_area?.toString() || '',
      fechaIngreso: new Date().toISOString().split('T')[0],
      estado: g.estado?.std_nombre as 'Activo' | 'Suspendido' | 'Desactivado',
      equiposAsignados: [],
      actividades: []
    }));

    // Guardar en cache
    guardarecursosCache.data = guardarecursos;
    guardarecursosCache.timestamp = Date.now();
    
    console.log(`✅ ${guardarecursos.length} guardarecursos cargados y cacheados`);
    return guardarecursos;
  } catch (error) {
    console.error('❌ Error en fetchGuardarecursos:', error);
    throw error;
  }
}

/**
 * Crea un nuevo guardarecurso en el backend
 * OPTIMIZADO: Limpia cache automáticamente
 */
export async function createGuardarecursoAPI(formData: GuardarecursoFormData): Promise<Guardarecurso> {
  try {
    // Normalizar areaAsignada: convertir "none" a cadena vacía
    const areaAsignada = formData.areaAsignada === 'none' ? '' : formData.areaAsignada;
    
    const token = getRequiredAuthToken();
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-811550f1/guardarecursos`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          dpi: formData.dpi,
          telefono: formData.telefono,
          email: formData.email,
          password: formData.password,
          areaAsignada: areaAsignada
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear guardarecurso');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al crear guardarecurso');
    }

    const guardarecurso = data.guardarecurso;

    // Limpiar cache
    clearGuardarecursosCache();

    // Mapear respuesta al formato del frontend
    return {
      id: guardarecurso.usr_id.toString(),
      nombre: guardarecurso.usr_nombre,
      apellido: guardarecurso.usr_apellido,
      dpi: guardarecurso.usr_dpi || '',
      telefono: guardarecurso.usr_telefono || '',
      email: guardarecurso.usr_correo,
      password: '',
      puesto: 'Guardarecurso',
      areaAsignada: guardarecurso.area?.ar_id?.toString() || guardarecurso.usr_area?.toString() || '',
      fechaIngreso: new Date().toISOString().split('T')[0],
      estado: 'Activo',
      equiposAsignados: [],
      actividades: []
    };
  } catch (error) {
    console.error('❌ Error en createGuardarecursoAPI:', error);
    throw error;
  }
}

/**
 * Actualiza un guardarecurso existente en el backend
 * OPTIMIZADO: Limpia cache automáticamente
 * 
 * IMPORTANTE: Solo se pueden editar teléfono y área asignada.
 * Los campos nombre, apellido, DPI y correo NO son editables.
 */
export async function updateGuardarecursoAPI(
  id: string,
  formData: GuardarecursoFormData
): Promise<Guardarecurso> {
  try {
    // Normalizar areaAsignada: convertir "none" a cadena vacía
    const areaAsignada = formData.areaAsignada === 'none' ? '' : formData.areaAsignada;
    
    const token = getRequiredAuthToken();
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-811550f1/guardarecursos/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          // SOLO enviar teléfono y área asignada
          // nombre, apellido, dpi y email NO se envían porque no son editables
          telefono: formData.telefono,
          areaAsignada: areaAsignada
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al actualizar guardarecurso');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al actualizar guardarecurso');
    }

    const guardarecurso = data.guardarecurso;

    // Limpiar cache
    clearGuardarecursosCache();

    return {
      id: guardarecurso.usr_id.toString(),
      nombre: guardarecurso.usr_nombre,
      apellido: guardarecurso.usr_apellido,
      dpi: guardarecurso.usr_dpi || '',
      telefono: guardarecurso.usr_telefono || '',
      email: guardarecurso.usr_correo,
      password: '',
      puesto: 'Guardarecurso',
      areaAsignada: guardarecurso.area?.ar_id?.toString() || guardarecurso.usr_area?.toString() || '',
      fechaIngreso: new Date().toISOString().split('T')[0],
      estado: guardarecurso.estado?.std_nombre as 'Activo' | 'Suspendido' | 'Desactivado',
      equiposAsignados: [],
      actividades: []
    };
  } catch (error) {
    console.error('❌ Error en updateGuardarecursoAPI:', error);
    throw error;
  }
}

/**
 * Cambia el estado de un guardarecurso en el backend
 * OPTIMIZADO: Limpia cache automáticamente
 */
export async function cambiarEstadoGuardarecursoAPI(
  id: string,
  nuevoEstado: 'Activo' | 'Suspendido' | 'Desactivado'
): Promise<void> {
  try {
    // Obtener el token JWT requerido (redirige al login si no existe)
    const token = getRequiredAuthToken();
    
    const url = `https://${projectId}.supabase.co/functions/v1/make-server-811550f1/guardarecursos/${id}/estado`;
    console.log('📡 Enviando petición PATCH a:', url);
    console.log('📦 Payload:', { nuevoEstado });
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nuevoEstado })
    });

    console.log('📬 Respuesta recibida - Status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error del servidor:', errorData);
      throw new Error(errorData.error || 'Error al cambiar estado');
    }

    const data = await response.json();
    console.log('✅ Datos recibidos:', data);
    
    if (!data.success) {
      throw new Error(data.error || 'Error al cambiar estado');
    }

    // Limpiar cache
    clearGuardarecursosCache();
  } catch (error) {
    console.error('❌ Error en cambiarEstadoGuardarecursoAPI:', error);
    throw error;
  }
}

/**
 * Servicio principal de Guardarecursos
 * Agrupa todas las funcionalidades en un objeto cohesivo
 */
export const guardarecursosService = {
  // API Calls
  fetchGuardarecursos,
  createGuardarecursoAPI,
  updateGuardarecursoAPI,
  cambiarEstadoGuardarecursoAPI,
  
  // Cache
  clearGuardarecursosCache,
  
  // Filtrado
  filterGuardarecursos,
  
  // Creación
  createGuardarecurso,
  createUsuarioForGuardarecurso,
  
  // Actualización
  updateGuardarecurso,
  updateUsuarioForGuardarecurso,
  
  // Estado
  isValidEstadoChange,
  updateEstado,
  updateUsuarioEstado,
  getEstadoMensaje,
  prepareEstadoPendiente,
  
  // Permisos
  canChangePassword,
  
  // Utilidades
  getAssociatedUser,
  createEmptyFormData,
  guardarecursoToFormData
};

export default guardarecursosService;
