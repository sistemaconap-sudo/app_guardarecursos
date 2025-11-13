/**
 * =============================================
 * SISTEMA DE PERMISOS Y CONTROL DE ACCESO
 * =============================================
 * 
 * Este archivo controla TODOS los permisos de la aplicación.
 * 
 * ⚠️ IMPORTANTE: Para cambiar permisos de un rol:
 * 1. Localiza el rol en ROLE_PERMISSIONS
 * 2. Encuentra el módulo que quieres modificar
 * 3. Cambia los valores true/false según necesites
 * 
 * ESTRUCTURA DE PERMISOS:
 * - canView: Puede ver/acceder al módulo
 * - canCreate: Puede crear nuevos registros
 * - canEdit: Puede editar registros existentes
 * - canDelete: Puede eliminar registros
 */

// ===== TIPOS DE ROLES =====
// Los tres roles del sistema
export type UserRole = 'Administrador' | 'Coordinador' | 'Guardarecurso';

// ===== CONFIGURACIÓN DE PERMISOS =====
// Define qué acciones puede hacer un usuario
export interface PermissionConfig {
  canView: boolean;    // ¿Puede ver el módulo?
  canCreate: boolean;  // ¿Puede crear nuevos registros?
  canEdit: boolean;    // ¿Puede editar registros?
  canDelete: boolean;  // ¿Puede eliminar registros?
}

// ===== MÓDULOS DEL SISTEMA =====
// IDs de todos los módulos disponibles
// IMPORTANTE: Estos IDs deben coincidir con los usados en App.tsx
export const MODULES = {
  // Dashboard Principal
  DASHBOARD: 'dashboard',
  
  // Gestión de Personal (Grupo 1)
  REGISTRO_GUARDA: 'registro-guarda',      // Registro de Guardarecursos
  ASIGNACION_ZONAS: 'asignacion-zonas',    // Áreas Protegidas
  CONTROL_EQUIPOS: 'control-equipos',      // Control de Equipos
  
  // Operaciones de Campo (Grupo 2)
  PLANIFICACION: 'planificacion',          // Planificación de Actividades
  REGISTRO_DIARIO: 'registro-diario',      // Registro Diario de Campo
  EVIDENCIAS: 'evidencias',                // Evidencias Fotográficas
  GEOLOCALIZACION: 'geolocalizacion',      // Geolocalización de Rutas
  
  // Control y Seguimiento (Grupo 3)
  HALLAZGOS: 'hallazgos',                  // Reporte de Hallazgos
  SEGUIMIENTO: 'seguimiento',              // Seguimiento de Cumplimiento
  INCIDENTES: 'incidentes',                // Incidentes con Visitantes
  
  // Administración (Grupo 4)
  USUARIOS: 'usuarios'                     // Gestión de Usuarios
} as const;

// ===== CONFIGURACIÓN DE PERMISOS POR ROL =====
// 
// ⚠️ AQUÍ SE DEFINEN TODOS LOS PERMISOS DE LA APLICACIÓN
// 
// Para modificar permisos:
// 1. Encuentra el rol que quieres modificar (Administrador, Coordinador, Guardarecurso)
// 2. Localiza el módulo específico usando MODULES.NOMBRE_MODULO
// 3. Cambia los valores true/false según necesites
//
// Ejemplo: Si quieres que los Coordinadores puedan crear incidentes:
// [MODULES.INCIDENTES]: { canView: true, canCreate: true, ... }
//
const ROLE_PERMISSIONS: Record<UserRole, Record<string, PermissionConfig>> = {
  // ========== ROL: ADMINISTRADOR ==========
  // Acceso completo EXCEPTO:
  // - Registro Diario: Solo visualización y filtros (no puede iniciar/editar actividades)
  // - Incidentes: No puede crear nuevos (solo ver y cambiar estados)
  Administrador: {
    [MODULES.DASHBOARD]: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    [MODULES.REGISTRO_GUARDA]: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    [MODULES.ASIGNACION_ZONAS]: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    [MODULES.CONTROL_EQUIPOS]: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    [MODULES.PLANIFICACION]: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    [MODULES.REGISTRO_DIARIO]: { canView: true, canCreate: false, canEdit: false, canDelete: true }, // ⚠️ SOLO VER Y FILTRAR
    [MODULES.EVIDENCIAS]: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    [MODULES.GEOLOCALIZACION]: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    [MODULES.HALLAZGOS]: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    [MODULES.SEGUIMIENTO]: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    [MODULES.INCIDENTES]: { canView: true, canCreate: false, canEdit: true, canDelete: true }, // ⚠️ NO PUEDE CREAR, SOLO CAMBIAR ESTADOS
    [MODULES.REPORTES]: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    [MODULES.USUARIOS]: { canView: true, canCreate: true, canEdit: true, canDelete: true }
  },
  
  // ========== ROL: COORDINADOR ==========
  // Mismo acceso que Administrador EXCEPTO:
  // - Gestión de Usuarios: Sin acceso
  // - Registro Diario: Solo visualización y filtros (igual que Administrador)
  // - Incidentes: No puede crear (solo ver y cambiar estados)
  Coordinador: {
    [MODULES.DASHBOARD]: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    [MODULES.REGISTRO_GUARDA]: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    [MODULES.ASIGNACION_ZONAS]: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    [MODULES.CONTROL_EQUIPOS]: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    [MODULES.PLANIFICACION]: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    [MODULES.REGISTRO_DIARIO]: { canView: true, canCreate: false, canEdit: false, canDelete: true }, // ⚠️ SOLO VER Y FILTRAR
    [MODULES.EVIDENCIAS]: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    [MODULES.GEOLOCALIZACION]: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    [MODULES.HALLAZGOS]: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    [MODULES.SEGUIMIENTO]: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    [MODULES.INCIDENTES]: { canView: true, canCreate: false, canEdit: true, canDelete: true }, // ⚠️ NO PUEDE CREAR
    [MODULES.REPORTES]: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    [MODULES.USUARIOS]: { canView: false, canCreate: false, canEdit: false, canDelete: false } // ⚠️ SIN ACCESO A USUARIOS
  },
  
  // ========== ROL: GUARDARECURSO ==========
  // Acceso MUY LIMITADO - Solo 3 módulos:
  // 1. Control de Equipos: Solo ver sus equipos asignados (sin filtros)
  // 2. Registro Diario: Editar solo SUS actividades asignadas (sin filtros)
  // 3. Incidentes: Crear y ver solo SUS incidentes (no puede cambiar estados)
  Guardarecurso: {
    [MODULES.DASHBOARD]: { canView: false, canCreate: false, canEdit: false, canDelete: false }, // ❌ SIN ACCESO
    [MODULES.REGISTRO_GUARDA]: { canView: false, canCreate: false, canEdit: false, canDelete: false }, // ❌ SIN ACCESO
    [MODULES.ASIGNACION_ZONAS]: { canView: false, canCreate: false, canEdit: false, canDelete: false }, // ❌ SIN ACCESO
    [MODULES.CONTROL_EQUIPOS]: { canView: true, canCreate: false, canEdit: false, canDelete: false }, // ✅ SOLO VER EQUIPOS ASIGNADOS
    [MODULES.PLANIFICACION]: { canView: false, canCreate: false, canEdit: false, canDelete: false }, // ❌ SIN ACCESO
    [MODULES.REGISTRO_DIARIO]: { canView: true, canCreate: true, canEdit: true, canDelete: false }, // ✅ EDITAR SUS ACTIVIDADES
    [MODULES.EVIDENCIAS]: { canView: false, canCreate: false, canEdit: false, canDelete: false }, // ❌ SIN ACCESO
    [MODULES.GEOLOCALIZACION]: { canView: false, canCreate: false, canEdit: false, canDelete: false }, // ❌ SIN ACCESO
    [MODULES.HALLAZGOS]: { canView: false, canCreate: false, canEdit: false, canDelete: false }, // ❌ SIN ACCESO
    [MODULES.SEGUIMIENTO]: { canView: false, canCreate: false, canEdit: false, canDelete: false }, // ❌ SIN ACCESO
    [MODULES.INCIDENTES]: { canView: true, canCreate: true, canEdit: false, canDelete: false }, // ✅ CREAR Y VER SUS INCIDENTES
    [MODULES.REPORTES]: { canView: false, canCreate: false, canEdit: false, canDelete: false }, // ❌ SIN ACCESO
    [MODULES.USUARIOS]: { canView: false, canCreate: false, canEdit: false, canDelete: false } // ❌ SIN ACCESO
  }
};

// ===== FUNCIONES DE VERIFICACIÓN DE PERMISOS =====
// Estas funciones se usan en toda la aplicación para verificar permisos

/**
 * Verifica si un usuario tiene acceso a un módulo
 * @param userRole - Rol del usuario (Administrador, Coordinador, Guardarecurso)
 * @param moduleId - ID del módulo (ej: 'registro-diario')
 * @returns true si el usuario puede acceder al módulo
 */
export function hasModuleAccess(userRole: UserRole, moduleId: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole]?.[moduleId];
  return permissions?.canView || false;
}

/**
 * Obtiene los permisos completos de un usuario para un módulo específico
 * Esta es la función más importante - se usa en TODOS los componentes
 * @param userRole - Rol del usuario
 * @param moduleId - ID del módulo
 * @returns Objeto con todos los permisos (canView, canCreate, canEdit, canDelete)
 */
export function getModulePermissions(userRole: UserRole, moduleId: string): PermissionConfig {
  return ROLE_PERMISSIONS[userRole]?.[moduleId] || {
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false
  };
}

/**
 * Verifica si un usuario puede realizar una acción específica en un módulo
 * @param userRole - Rol del usuario
 * @param moduleId - ID del módulo
 * @param action - Acción a verificar ('view', 'create', 'edit', 'delete')
 * @returns true si el usuario puede realizar la acción
 */
export function canPerformAction(
  userRole: UserRole, 
  moduleId: string, 
  action: 'view' | 'create' | 'edit' | 'delete'
): boolean {
  const permissions = getModulePermissions(userRole, moduleId);
  
  switch (action) {
    case 'view':
      return permissions.canView;
    case 'create':
      return permissions.canCreate;
    case 'edit':
      return permissions.canEdit;
    case 'delete':
      return permissions.canDelete;
    default:
      return false;
  }
}

/**
 * Filtra las categorías de navegación según los permisos del usuario
 * Se usa en App.tsx para mostrar solo los módulos permitidos en el sidebar
 * @param categories - Array de categorías del menú
 * @param userRole - Rol del usuario
 * @returns Array de categorías filtradas
 */
export function filterNavigationByRole(categories: any[], userRole: UserRole) {
  return categories
    .map(category => ({
      ...category,
      items: category.items.filter((item: any) => hasModuleAccess(userRole, item.id))
    }))
    .filter(category => category.items.length > 0);
}

/**
 * Verifica si un usuario puede usar filtros en un módulo
 * IMPORTANTE: Los Guardarecursos NUNCA pueden usar filtros
 * @param userRole - Rol del usuario
 * @param moduleId - ID del módulo
 * @returns true si el usuario puede usar filtros
 */
export function canUseFilters(userRole: UserRole, moduleId: string): boolean {
  // ⚠️ Guardarecursos no pueden usar filtros en ningún módulo
  if (userRole === 'Guardarecurso') {
    return false;
  }
  return hasModuleAccess(userRole, moduleId);
}

/**
 * Verifica si un usuario puede cambiar estados en un módulo
 * IMPORTANTE: Los Guardarecursos NUNCA pueden cambiar estados
 * @param userRole - Rol del usuario
 * @param moduleId - ID del módulo
 * @returns true si el usuario puede cambiar estados
 */
export function canChangeStatus(userRole: UserRole, moduleId: string): boolean {
  // ⚠️ Guardarecursos no pueden cambiar estados
  if (userRole === 'Guardarecurso') {
    return false;
  }
  return canPerformAction(userRole, moduleId, 'edit');
}

/**
 * Verifica si un usuario puede ver el historial completo en un módulo
 * IMPORTANTE: Los Guardarecursos solo ven sus propios registros
 * @param userRole - Rol del usuario
 * @param moduleId - ID del módulo
 * @returns true si el usuario puede ver todo el historial
 */
export function canViewHistory(userRole: UserRole, moduleId: string): boolean {
  // ⚠️ Guardarecursos no pueden ver historial completo, solo sus propios registros
  if (userRole === 'Guardarecurso') {
    return false;
  }
  return hasModuleAccess(userRole, moduleId);
}