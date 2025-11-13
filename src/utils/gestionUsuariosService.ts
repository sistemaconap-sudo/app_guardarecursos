/**
 * 👥 Gestión de Usuarios Service
 * 
 * Servicio centralizado que maneja toda la lógica funcional del módulo de Gestión de Usuarios,
 * incluyendo CRUD de usuarios, validación de permisos, gestión de estados y transformación de datos.
 * 
 * CONEXIÓN: Consulta directamente a Supabase desde el frontend
 * 
 * OPTIMIZACIONES:
 * ✅ Sistema de caché con TTL de 30 segundos
 * ✅ Invalidación automática de caché en operaciones de escritura
 * ✅ Reducción de peticiones al backend
 * 
 * @module utils/gestionUsuariosService
 */

import { projectId } from './supabase/info';
import { getRequiredAuthToken } from './base-api-service';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-811550f1`;

// ===== SISTEMA DE CACHÉ =====

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 30000; // 30 segundos
let usuariosCache: CacheEntry<Usuario[]> | null = null;

/**
 * Invalida el caché de usuarios
 */
function invalidateCache(): void {
  usuariosCache = null;
}

/**
 * Obtiene datos del caché si están vigentes
 */
function getFromCache(): Usuario[] | null {
  if (!usuariosCache) return null;
  
  const now = Date.now();
  const isExpired = now - usuariosCache.timestamp > CACHE_TTL;
  
  if (isExpired) {
    usuariosCache = null;
    return null;
  }
  
  return usuariosCache.data;
}

/**
 * Guarda datos en el caché
 */
function saveToCache(data: Usuario[]): void {
  usuariosCache = {
    data,
    timestamp: Date.now()
  };
}

/**
 * Interface para usuario
 */
export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  dpi: string;
  email: string;
  telefono?: string;
  rol: 'Administrador' | 'Coordinador' | 'Guardarecurso';
  estado: 'Activo' | 'Desactivado' | 'Suspendido';
  fechaCreacion: string;
  ultimoAcceso?: string;
  permisos: {
    gestionPersonal: boolean;
    operacionesCampo: boolean;
    controlSeguimiento: boolean;
    administracion: boolean;
    reportes: boolean;
  };
  configuracion: {
    notificacionesEmail: boolean;
    notificacionesSMS: boolean;
    tema: 'claro' | 'oscuro' | 'sistema';
    idioma: 'es' | 'en';
  };
}

/**
 * Interface para datos de formulario de usuario
 */
export interface UsuarioFormData {
  nombre: string;
  apellido: string;
  dpi: string;
  telefono: string;
  email: string;
  password: string;
  rol: string;
}

/**
 * Interface para estado pendiente
 */
export interface EstadoPendiente {
  id: string;
  nombre: string;
  nuevoEstado: 'Activo' | 'Desactivado' | 'Suspendido';
}

// ===== FUNCIONES DE API =====

/**
 * Obtiene todos los usuarios (Administradores y Coordinadores) desde el backend
 * 
 * OPTIMIZACIÓN: Implementa caché con TTL de 30 segundos
 * 
 * @returns Promesa con array de usuarios
 */
export async function fetchUsuarios(): Promise<Usuario[]> {
  // Intentar obtener del caché primero
  const cachedData = getFromCache();
  if (cachedData) {
    return cachedData;
  }

  try {
    // Obtener token JWT requerido (lanzará error si no existe)
    const token = getRequiredAuthToken();

    const response = await fetch(`${API_BASE_URL}/usuarios`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error al obtener usuarios:', errorData);
      return [];
    }

    const { success, usuarios } = await response.json();

    if (!success || !usuarios) {
      return [];
    }

    // Mapear datos al formato Usuario del frontend
    const mappedUsuarios = usuarios.map((user: any) => {
      const rolNombre = user.rol?.rl_nombre || 'Coordinador';
      const estadoNombre = user.estado?.std_nombre || 'Activo';
      
      return {
        id: user.usr_id.toString(),
        nombre: user.usr_nombre,
        apellido: user.usr_apellido,
        dpi: user.usr_dpi || '',
        email: user.usr_correo,
        telefono: user.usr_telefono || '',
        rol: rolNombre as 'Administrador' | 'Coordinador' | 'Guardarecurso',
        estado: estadoNombre as 'Activo' | 'Desactivado' | 'Suspendido',
        fechaCreacion: new Date().toISOString().split('T')[0],
        ultimoAcceso: undefined,
        permisos: getPermisosByRol(rolNombre),
        configuracion: {
          notificacionesEmail: true,
          notificacionesSMS: false,
          tema: 'sistema',
          idioma: 'es'
        }
      };
    });

    // Guardar en caché
    saveToCache(mappedUsuarios);
    
    return mappedUsuarios;

  } catch (error) {
    console.error('Error en fetchUsuarios:', error);
    return [];
  }
}

/**
 * Crea un nuevo usuario a través del backend
 * 
 * OPTIMIZACIÓN: Invalida caché automáticamente después de crear
 * 
 * @param formData - Datos del formulario
 * @returns Promesa con el usuario creado o null si hay error
 */
export async function createUsuario(formData: UsuarioFormData): Promise<Usuario | null> {
  try {
    // Obtener token JWT requerido (lanzará error si no existe)
    const token = getRequiredAuthToken();

    const response = await fetch(`${API_BASE_URL}/usuarios`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: formData.nombre,
        apellido: formData.apellido,
        cedula: formData.dpi,
        telefono: formData.telefono,
        email: formData.email,
        password: formData.password
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error al crear usuario:', errorData);
      return null;
    }

    const { success, usuario } = await response.json();

    if (!success || !usuario) {
      return null;
    }

    // Invalidar caché para que la próxima consulta obtenga datos frescos
    invalidateCache();

    // Retornar usuario creado
    return {
      id: usuario.usr_id.toString(),
      nombre: usuario.usr_nombre,
      apellido: usuario.usr_apellido,
      dpi: usuario.usr_dpi || '',
      email: usuario.usr_correo,
      telefono: usuario.usr_telefono || '',
      rol: 'Coordinador',
      estado: 'Activo',
      fechaCreacion: new Date().toISOString().split('T')[0],
      permisos: getPermisosByRol('Coordinador'),
      configuracion: {
        notificacionesEmail: true,
        notificacionesSMS: false,
        tema: 'sistema',
        idioma: 'es'
      }
    };

  } catch (error) {
    console.error('Error en createUsuario:', error);
    return null;
  }
}

/**
 * Actualiza un usuario existente a través del backend
 * 
 * OPTIMIZACIÓN: Invalida caché automáticamente después de actualizar
 * 
 * @param usuario - Usuario a actualizar
 * @param formData - Datos del formulario
 * @returns Promesa con el usuario actualizado o null si hay error
 */
export async function updateUsuario(
  usuario: Usuario,
  formData: UsuarioFormData
): Promise<Usuario | null> {
  try {
    // Obtener token JWT requerido (lanzará error si no existe)
    const token = getRequiredAuthToken();

    const response = await fetch(`${API_BASE_URL}/usuarios/${usuario.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono,
        email: formData.email
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error al actualizar usuario:', errorData);
      return null;
    }

    const { success, usuario: data } = await response.json();

    if (!success || !data) {
      return null;
    }

    // Invalidar caché para que la próxima consulta obtenga datos frescos
    invalidateCache();

    // Retornar usuario actualizado
    return {
      id: data.usr_id.toString(),
      nombre: data.usr_nombre,
      apellido: data.usr_apellido,
      dpi: data.usr_dpi || '',
      email: data.usr_correo,
      telefono: data.usr_telefono || '',
      rol: data.rol?.rl_nombre as 'Administrador' | 'Coordinador' | 'Guardarecurso',
      estado: data.estado?.std_nombre as 'Activo' | 'Desactivado' | 'Suspendido',
      fechaCreacion: usuario.fechaCreacion,
      ultimoAcceso: usuario.ultimoAcceso,
      permisos: usuario.permisos,
      configuracion: usuario.configuracion
    };

  } catch (error) {
    console.error('Error en updateUsuario:', error);
    return null;
  }
}

/**
 * Cambia el estado de un usuario a través del backend
 * 
 * OPTIMIZACIÓN: Invalida caché automáticamente después de cambiar estado
 * 
 * @param usuario - Usuario a actualizar
 * @param nuevoEstado - Nuevo estado
 * @returns Promesa con el usuario actualizado o null si hay error
 */
export async function changeEstadoUsuario(
  usuario: Usuario,
  nuevoEstado: 'Activo' | 'Desactivado' | 'Suspendido'
): Promise<Usuario | null> {
  try {
    // Obtener token JWT requerido (lanzará error si no existe)
    const token = getRequiredAuthToken();

    const response = await fetch(`${API_BASE_URL}/usuarios/${usuario.id}/estado`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nuevoEstado
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error al cambiar estado:', errorData);
      return null;
    }

    const { success } = await response.json();

    if (!success) {
      return null;
    }

    // Invalidar caché para que la próxima consulta obtenga datos frescos
    invalidateCache();

    // Retornar usuario actualizado
    return {
      ...usuario,
      estado: nuevoEstado
    };

  } catch (error) {
    console.error('Error en changeEstadoUsuario:', error);
    return null;
  }
}

// ===== FUNCIONES DE UTILIDAD =====

/**
 * Obtiene permisos basados en el rol
 */
function getPermisosByRol(rol: string) {
  return {
    gestionPersonal: rol === 'Administrador' || rol === 'Coordinador',
    operacionesCampo: true,
    controlSeguimiento: rol === 'Administrador' || rol === 'Coordinador',
    administracion: rol === 'Administrador',
    reportes: rol === 'Administrador' || rol === 'Coordinador'
  };
}

// ===== FUNCIONES DE FILTRADO Y BÚSQUEDA =====

/**
 * Filtra usuarios (solo Administradores y Coordinadores, excluyendo Desactivados)
 */
export function filterUsuarios(
  usuarios: Usuario[],
  searchTerm: string
): Usuario[] {
  return usuarios.filter(u => {
    // Solo mostrar Administradores y Coordinadores
    const isAdminOrCoordinator = u.rol === 'Administrador' || u.rol === 'Coordinador';
    
    // Excluir usuarios desactivados (no aparecen en ningún lado)
    if (u.estado === 'Desactivado') {
      return false;
    }
    
    const matchesSearch = 
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return isAdminOrCoordinator && matchesSearch;
  });
}

// ===== VALIDACIÓN DE PERMISOS =====

/**
 * Verifica si se puede cambiar la contraseña de un usuario
 * 
 * REGLAS:
 * - NUNCA se puede cambiar la contraseña de un Administrador (solo ellos mismos)
 * - Administradores pueden cambiar contraseñas de Coordinadores y Guardarecursos
 * - Coordinadores pueden cambiar contraseñas de Guardarecursos únicamente
 */
export function canChangeUserPassword(
  currentUser: any,
  targetUser: Usuario
): boolean {
  if (!currentUser) return false;
  
  // REGLA 1: NUNCA se puede cambiar la contraseña de un Administrador (solo ellos mismos)
  if (targetUser.rol === 'Administrador') return false;
  
  // REGLA 2: Administradores pueden cambiar contraseñas de Coordinadores y Guardarecursos
  if (currentUser.rol === 'Administrador') {
    return targetUser.rol === 'Coordinador' || targetUser.rol === 'Guardarecurso';
  }
  
  // REGLA 3: Coordinadores pueden cambiar contraseñas de Guardarecursos únicamente
  if (currentUser.rol === 'Coordinador' && targetUser.rol === 'Guardarecurso') {
    return true;
  }
  
  return false;
}

/**
 * Verifica si el usuario actual puede editar a otro usuario
 * 
 * REGLAS:
 * - Un Administrador SOLO puede editarse a sí mismo (solo su teléfono)
 * - Un Administrador NO puede editar a otros Administradores
 * - Un Administrador puede editar a Coordinadores (todos los campos)
 */
export function canEditUser(
  currentUser: any,
  targetUser: Usuario
): boolean {
  if (!currentUser) return false;
  
  if (currentUser.rol === 'Administrador') {
    // Puede editar a sí mismo (solo teléfono)
    if (currentUser.id === targetUser.id) return true;
    
    // NO puede editar a otros Administradores
    if (targetUser.rol === 'Administrador') return false;
    
    // Puede editar a Coordinadores
    if (targetUser.rol === 'Coordinador') return true;
  }
  
  return false;
}

/**
 * Verifica si un administrador se está editando a sí mismo
 * Solo en este caso puede cambiar su teléfono
 */
export function isEditingSelf(
  currentUser: any,
  targetUser: Usuario
): boolean {
  if (!currentUser || !targetUser) return false;
  return currentUser.id === targetUser.id && currentUser.rol === 'Administrador';
}

/**
 * Verifica si el usuario actual puede cambiar el estado de otro usuario
 * 
 * REGLAS:
 * - NO se puede cambiar el estado del usuario actual (sí mismo)
 * - Un Administrador NO puede cambiar el estado de otros Administradores
 * - Un Administrador puede cambiar el estado de Coordinadores
 */
export function canChangeUserEstado(
  currentUser: any,
  targetUser: Usuario
): boolean {
  if (!currentUser) return false;
  
  // No se puede cambiar el estado del usuario actual (sí mismo)
  if (currentUser.id === targetUser.id) return false;
  
  if (currentUser.rol === 'Administrador') {
    // NO puede cambiar el estado de otros Administradores
    if (targetUser.rol === 'Administrador') return false;
    
    // Puede cambiar el estado de Coordinadores
    if (targetUser.rol === 'Coordinador') return true;
  }
  
  return false;
}

// ===== GESTIÓN DE ESTADOS =====

/**
 * Obtiene el texto del estado en pasado para mostrar en notificaciones
 */
export function getEstadoTexto(estado: 'Activo' | 'Desactivado' | 'Suspendido'): string {
  return estado === 'Activo' ? 'activado' 
    : estado === 'Suspendido' ? 'suspendido' 
    : 'desactivado';
}

/**
 * Prepara los datos para el estado pendiente
 */
export function prepareEstadoPendiente(
  usuario: Usuario,
  nuevoEstado: 'Activo' | 'Desactivado' | 'Suspendido'
): EstadoPendiente {
  return {
    id: usuario.id,
    nombre: `${usuario.nombre} ${usuario.apellido}`,
    nuevoEstado
  };
}

// ===== ESTILOS Y UI =====

/**
 * Obtiene la clase de badge para el estado
 */
export function getEstadoBadgeClass(estado: string): string {
  switch (estado) {
    case 'Activo': 
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700';
    case 'Suspendido': 
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-300 dark:border-orange-700';
    case 'Inactivo': 
      return 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-300 dark:border-gray-700';
    default: 
      return 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-300 dark:border-gray-700';
  }
}

/**
 * Obtiene la clase de badge para el rol
 */
export function getRolBadgeClass(rol: string): string {
  switch (rol) {
    case 'Administrador': 
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-300 dark:border-red-700';
    case 'Coordinador': 
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-300 dark:border-blue-700';
    case 'Guardarecurso': 
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700';
    default: 
      return 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-300 dark:border-gray-700';
  }
}

// ===== TRANSFORMACIÓN DE DATOS =====

/**
 * Crea datos de formulario vacíos
 */
export function createEmptyFormData(): UsuarioFormData {
  return {
    nombre: '',
    apellido: '',
    dpi: '',
    telefono: '',
    email: '',
    password: '',
    rol: 'Coordinador' // Siempre Coordinador
  };
}

/**
 * Convierte un usuario a datos de formulario para edición
 */
export function usuarioToFormData(usuario: Usuario): UsuarioFormData {
  return {
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    dpi: usuario.dpi || '',
    telefono: usuario.telefono || '',
    email: usuario.email,
    password: '', // No mostrar contraseña en edición
    rol: 'Coordinador' // Siempre Coordinador
  };
}

// ===== CONSTANTES =====

/**
 * Roles disponibles (solo Coordinador)
 * Los Guardarecursos se crean en el módulo de Registro de Guardarecursos
 */
export const ROLES_DISPONIBLES = ['Coordinador'];

/**
 * Servicio de Gestión de Usuarios - Export centralizado
 */
export const gestionUsuariosService = {
  // API
  fetchUsuarios,
  createUsuario,
  updateUsuario,
  changeEstadoUsuario,
  
  // Caché
  invalidateCache,
  
  // Filtrado
  filterUsuarios,
  
  // Validación de permisos
  canChangeUserPassword,
  canEditUser,
  canChangeUserEstado,
  isEditingSelf,
  
  // Estados
  getEstadoTexto,
  prepareEstadoPendiente,
  
  // Estilos
  getEstadoBadgeClass,
  getRolBadgeClass,
  
  // Transformación
  createEmptyFormData,
  usuarioToFormData,
  
  // Constantes
  ROLES_DISPONIBLES
};
