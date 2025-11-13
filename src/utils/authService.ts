/**
 * 🔐 Authentication Service with Supabase
 * 
 * Servicio centralizado que maneja toda la lógica de autenticación usando Supabase Auth,
 * incluyendo validación de credenciales, cambio de contraseñas, persistencia de sesión
 * y gestión de estado.
 * 
 * @module utils/authService
 */

import { supabase, getActiveSession, signOut as supabaseSignOut } from './supabase/client';
import { publicAnonKey } from './supabase/info';
import { API_ENDPOINTS } from './api-config';

/**
 * Interface para sesión guardada en localStorage
 */
export interface AuthSession {
  token: string;
  user: any;
  expiresAt: number;
}

/**
 * Interface para resultado de autenticación
 */
export interface AuthResult {
  success: boolean;
  user?: any;
  token?: string;
  error?: string;
}

/**
 * Interface para resultado de validación de contraseña
 */
export interface PasswordValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Interface para resultado de cambio de contraseña
 */
export interface PasswordChangeResult {
  success: boolean;
  error?: string;
}

/**
 * 🗝️ PERSISTENCIA DE SESIÓN
 */

const SESSION_KEY = 'conap_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas

/**
 * 🧹 LIMPIEZA COMPLETA DE DATOS Y CACHÉ
 * 
 * Limpia TODOS los datos almacenados en el navegador:
 * - localStorage completo
 * - sessionStorage completo
 * - Cookies del dominio actual
 * - Caché del navegador (si está soportado)
 * 
 * Esta función se usa cuando el token ha expirado para asegurar
 * que NO queden datos en memoria o caché.
 * 
 * IMPORTANTE: Esta función debe estar ANTES de loadSession() porque loadSession() la llama
 */
export async function limpiarDatosCompleto(): Promise<void> {
  try {
    // Limpiar localStorage
    try {
      localStorage.clear();
    } catch (e) {
      console.error('Error limpiando localStorage:', e);
    }

    // Limpiar sessionStorage
    sessionStorage.clear();

    // Limpiar cookies
    document.cookie.split(";").forEach(c => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // Limpiar caché del navegador usando Cache API (si está soportado)
    if ('caches' in window) {
      console.log('💾 Limpiando caché del navegador...');
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('✅ Caché del navegador limpiado');
      } catch (cacheError) {
        console.warn('⚠️ No se pudo limpiar el caché del navegador:', cacheError);
      }
    }

    // Limpiar IndexedDB de Supabase (si existe)
    if ('indexedDB' in window) {
      console.log('🗄️ Limpiando IndexedDB...');
      try {
        // Supabase usa IndexedDB para almacenar sesiones
        const databases = await indexedDB.databases?.() || [];
        for (const db of databases) {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
          }
        }
        console.log('✅ IndexedDB limpiado');
      } catch (idbError) {
        console.warn('⚠️ No se pudo limpiar IndexedDB:', idbError);
      }
    }

    console.log('✅ Limpieza completa finalizada');
  } catch (error) {
    console.error('❌ Error durante la limpieza completa:', error);
    // Asegurar que al menos localStorage esté limpio
    localStorage.clear();
    sessionStorage.clear();
  }
}

/**
 * Alias para limpiarDatosCompleto (mantener compatibilidad)
 */
export async function clearAllData(): Promise<void> {
  await limpiarDatosCompleto();
}

/**
 * Guarda la sesión en localStorage
 */
export function saveSession(token: string, user: any): void {
  const session: AuthSession = {
    token,
    user,
    expiresAt: Date.now() + SESSION_DURATION
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  
  // También guardar el token por separado para base-api-service
  localStorage.setItem('conap_auth_token', token);
}

/**
 * Carga la sesión desde localStorage
 * 
 * 🔒 SEGURIDAD:
 * - Valida que la sesión no haya expirado (24 horas)
 * - Limpia automáticamente sesiones expiradas
 * - Maneja errores de parsing
 */
export function loadSession(): AuthSession | null {
  try {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;

    const session: AuthSession = JSON.parse(sessionStr);

    // Verificar si la sesión ha expirado
    if (Date.now() > session.expiresAt) {
      console.log('⏰ Sesión local expirada (24h). Limpiando TODO...');
      // Limpiar TODOS los datos cuando la sesión expira
      clearAllData();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error al cargar sesión:', error);
    // Limpiar TODOS los datos si hay error de parsing
    clearAllData();
    return null;
  }
}

/**
 * Limpia la sesión de localStorage
 */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('conap_auth_token');
}

/**
 * Verifica si hay una sesión válida
 */
export function isSessionValid(): boolean {
  const session = loadSession();
  return session !== null;
}

/**
 * 🔑 AUTENTICACIÓN CON SUPABASE
 */

/**
 * Autentica a un usuario con email y contraseña usando Supabase Auth
 * 
 * FLUJO DE AUTENTICACIÓN:
 * 1. Validar y sanitizar inputs (prevención SQL injection)
 * 2. Autenticar con Supabase Auth (valida credenciales)
 * 3. Obtener datos del usuario desde el backend (consulta a PostgreSQL)
 * 4. Verificar estado del usuario
 * 5. Retornar token y datos del usuario
 * 
 * SEGURIDAD:
 * - Validación de formato de email
 * - Sanitización de inputs
 * - Validación de longitud
 * - Uso de prepared statements en Supabase (protección SQL injection)
 * 
 * @param email - Email del usuario
 * @param password - Contraseña del usuario
 * @returns Resultado de autenticación con token y datos del usuario
 * 
 * @example
 * ```typescript
 * const result = await authService.authenticate('admin@conap.gob.gt', 'password123');
 * if (result.success) {
 *   console.log('Usuario autenticado:', result.user);
 *   console.log('Token:', result.token);
 * } else {
 *   console.error('Error:', result.error);
 * }
 * ```
 */
export async function authenticate(email: string, password: string): Promise<AuthResult> {
  try {
    // 🔒 VALIDACIÓN 1: Verificar que los campos no estén vacíos
    if (!email || !password) {
      return {
        success: false,
        error: 'Email y contraseña son requeridos'
      };
    }

    // 🔒 VALIDACIÓN 2: Sanitizar email
    const sanitizedEmail = email.toLowerCase().trim();

    // 🔒 VALIDACIÓN 3: Verificar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return {
        success: false,
        error: 'Formato de email inválido'
      };
    }

    // 🔒 VALIDACIÓN 4: Limitar longitud para prevenir ataques de buffer overflow
    if (sanitizedEmail.length > 255) {
      return {
        success: false,
        error: 'Credenciales inválidas'
      };
    }

    if (password.length > 255) {
      return {
        success: false,
        error: 'Credenciales inválidas'
      };
    }

    // 🔒 VALIDACIÓN 5: Verificar que la contraseña no contenga caracteres peligrosos
    // (esto es adicional, Supabase Auth ya maneja esto correctamente)
    if (password.includes('\0')) {
      return {
        success: false,
        error: 'Credenciales inválidas'
      };
    }

    // PASO 1: Autenticar con Supabase Auth
    // Supabase Auth usa prepared statements y maneja la sanitización internamente
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password
    });

    if (signInError) {
      console.error('Error de autenticación Supabase:', signInError);
      
      // Mensajes de error específicos para el usuario
      const errorMessage = signInError.message === 'Invalid login credentials' 
        ? 'Credenciales inválidas. Por favor verifica tu correo y contraseña.'
        : signInError.message;
      
      return {
        success: false,
        error: errorMessage
      };
    }

    if (!data?.session?.access_token || !data?.user?.email) {
      return {
        success: false,
        error: 'Error al obtener sesión. Inténtalo de nuevo.'
      };
    }

    // PASO 2: Obtener datos del usuario desde la BD a través del backend
    const userEmail = data.user.email;
    const url = API_ENDPOINTS.usuario(userEmail);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`Error HTTP ${response.status} al obtener datos del usuario`);
        const errorData = await response.json().catch(() => ({}));
        
        // Si la BD no está configurada, mostrar helper
        if (errorData.error?.includes('Base de datos no configurada') ||
            errorData.error?.includes('relation') ||
            errorData.error?.includes('does not exist')) {
          // Cerrar sesión de Supabase
          await supabaseSignOut();
          throw new Error('Base de datos no configurada. Por favor ejecuta los scripts SQL en Supabase.');
        }
        
        // Cerrar sesión de Supabase si no se encuentra el usuario en BD
        await supabaseSignOut();
        throw new Error(errorData.error || 'Usuario no encontrado en la base de datos. Contacta al administrador.');
      }

      const result = await response.json();

      if (!result.success || !result.usuario) {
        // Cerrar sesión de Supabase
        await supabaseSignOut();
        throw new Error('Usuario no encontrado en la base de datos. Contacta al administrador.');
      }

      // PASO 3: Verificar estado del usuario
      const usuario = result.usuario;
      
      if (usuario.estado === 'Suspendido') {
        await supabaseSignOut();
        return {
          success: false,
          error: 'Su cuenta ha sido suspendida. Contacte al administrador.'
        };
      }

      if (usuario.estado === 'Inactivo' || usuario.estado === 'Desactivado') {
        await supabaseSignOut();
        return {
          success: false,
          error: 'Credenciales incorrectas. Intente nuevamente.'
        };
      }

      if (usuario.estado !== 'Activo') {
        await supabaseSignOut();
        return {
          success: false,
          error: 'Credenciales incorrectas. Intente nuevamente.'
        };
      }

      // PASO 4: Éxito - Retornar token y datos del usuario
      return {
        success: true,
        user: usuario,
        token: data.session.access_token
      };

    } catch (fetchError: any) {
      console.error('Error al obtener datos del usuario:', fetchError);
      
      // Cerrar sesión de Supabase si hay error
      await supabaseSignOut();
      
      // Propagar el mensaje de error específico
      throw fetchError;
    }

  } catch (error: any) {
    console.error('Error en authenticate:', error);
    
    // Mensajes de error específicos
    if (error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
      return {
        success: false,
        error: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Error de autenticación. Intente nuevamente.'
    };
  }
}

/**
 * Cierra la sesión del usuario
 */
export async function logout(): Promise<void> {
  try {
    // Cerrar sesión en Supabase
    await supabaseSignOut();
    
    // Limpiar TODOS los datos y caché
    await limpiarDatosCompleto();
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    // Limpiar TODOS los datos aunque falle Supabase
    await limpiarDatosCompleto();
  }
}

/**
 * Restaura la sesión desde localStorage
 * Útil para mantener la sesión activa después de recargar la página
 */
export async function restoreSession(): Promise<AuthResult> {
  try {
    // Intentar obtener sesión de Supabase primero
    const session = await getActiveSession();
    
    if (!session) {
      // Si no hay sesión en Supabase, intentar cargar desde localStorage
      const localSession = loadSession();
      if (!localSession) {
        return {
          success: false,
          error: 'No hay sesión activa'
        };
      }

      // Retornar con los datos guardados localmente
      return {
        success: true,
        user: localSession.user,
        token: localSession.token
      };
    }

    // Si hay sesión en Supabase, retornar con esos datos
    return {
      success: true,
      user: session.user,
      token: session.access_token
    };

  } catch (error) {
    console.error('Error al restaurar sesión:', error);
    return {
      success: false,
      error: 'Error al restaurar la sesión'
    };
  }
}

/**
 * 🔒 VALIDACIÓN DE CONTRASEÑAS
 */

/**
 * Valida que una contraseña cumpla con los requisitos mínimos
 */
export function validatePassword(password: string): PasswordValidationResult {
  if (!password || password.length < 6) {
    return {
      isValid: false,
      error: 'La contraseña debe tener al menos 6 caracteres'
    };
  }

  return { isValid: true };
}

/**
 * Valida que dos contraseñas coincidan
 */
export function validatePasswordMatch(password: string, confirmPassword: string): PasswordValidationResult {
  if (password !== confirmPassword) {
    return {
      isValid: false,
      error: 'Las contraseñas no coinciden'
    };
  }

  return { isValid: true };
}

/**
 * Valida que la contraseña nueva sea diferente a la actual
 */
export function validatePasswordDifferent(currentPassword: string, newPassword: string): PasswordValidationResult {
  if (newPassword === currentPassword) {
    return {
      isValid: false,
      error: 'La nueva contraseña debe ser diferente a la actual'
    };
  }

  return { isValid: true };
}

/**
 * 🔄 CAMBIO DE CONTRASEÑAS
 */

/**
 * Cambia la contraseña del usuario actual (el usuario cambia su propia contraseña)
 * 
 * @param currentPassword - Contraseña actual
 * @param newPassword - Nueva contraseña
 * @param confirmPassword - Confirmación de nueva contraseña
 * @returns Resultado del cambio de contraseña
 */
export async function changeOwnPassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<PasswordChangeResult> {
  try {
    // Validar nueva contraseña
    const newPasswordValidation = validatePassword(newPassword);
    if (!newPasswordValidation.isValid) {
      return {
        success: false,
        error: newPasswordValidation.error
      };
    }

    // Validar que coincidan
    const matchValidation = validatePasswordMatch(newPassword, confirmPassword);
    if (!matchValidation.isValid) {
      return {
        success: false,
        error: matchValidation.error
      };
    }

    // Validar que sea diferente
    const differentValidation = validatePasswordDifferent(currentPassword, newPassword);
    if (!differentValidation.isValid) {
      return {
        success: false,
        error: differentValidation.error
      };
    }

    // Obtener sesión actual
    const session = await getActiveSession();
    if (!session || !session.user) {
      return {
        success: false,
        error: 'No hay sesión activa. Por favor inicie sesión nuevamente.'
      };
    }

    // Re-autenticar con contraseña actual para verificar
    const { error: reAuthError } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: currentPassword
    });

    if (reAuthError) {
      return {
        success: false,
        error: 'La contraseña actual es incorrecta'
      };
    }

    // Cambiar contraseña en Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      console.error('Error al cambiar contraseña:', updateError);
      return {
        success: false,
        error: 'Error al cambiar la contraseña. Intente nuevamente.'
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Error en changeOwnPassword:', error);
    return {
      success: false,
      error: 'Error al cambiar la contraseña. Intente nuevamente.'
    };
  }
}

/**
 * Cambia la contraseña de otro usuario (solo administrador)
 * 
 * @param targetUserId - ID del usuario objetivo
 * @param newPassword - Nueva contraseña
 * @param confirmPassword - Confirmación de nueva contraseña
 * @returns Resultado del cambio de contraseña
 */
export async function changeUserPasswordByAdmin(
  targetUserId: string,
  newPassword: string,
  confirmPassword: string
): Promise<PasswordChangeResult> {
  try {
    // Validar nueva contraseña
    const newPasswordValidation = validatePassword(newPassword);
    if (!newPasswordValidation.isValid) {
      return {
        success: false,
        error: newPasswordValidation.error
      };
    }

    // Validar que coincidan
    const matchValidation = validatePasswordMatch(newPassword, confirmPassword);
    if (!matchValidation.isValid) {
      return {
        success: false,
        error: matchValidation.error
      };
    }

    // Obtener token de la sesión actual
    const session = loadSession();
    if (!session || !session.token) {
      return {
        success: false,
        error: 'No hay sesión activa. Por favor inicie sesión nuevamente.'
      };
    }

    // Llamar al endpoint del backend para cambiar contraseña
    // El backend verifica los permisos (Administrador o Coordinador)
    const url = API_ENDPOINTS.usuarioCambiarPassword(targetUserId);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: targetUserId, newPassword })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Error al cambiar la contraseña'
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Error en changeUserPasswordByAdmin:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al cambiar la contraseña. Intente nuevamente.'
    };
  }
}

/**
 * 🔍 UTILIDADES
 */

/**
 * Obtiene el usuario desde la sesión guardada
 */
export function getCurrentUser(): any | null {
  const session = loadSession();
  return session?.user || null;
}

/**
 * Obtiene el token de la sesión guardada
 */
export function getCurrentToken(): string | null {
  const session = loadSession();
  return session?.token || null;
}

/**
 * Verifica si un usuario está activo
 */
export function isUserActive(user: any): boolean {
  return user?.estado === 'Activo';
}

/**
 * Obtiene el estado de un usuario
 */
export function getUserStatus(user: any): string | null {
  return user?.estado || null;
}

/**
 * Servicio de Autenticación - Export centralizado
 */
export const authService = {
  // Autenticación
  authenticate,
  logout,
  restoreSession,
  
  // Sesión
  saveSession,
  loadSession,
  clearSession,
  limpiarDatosCompleto,
  clearAllData,
  isSessionValid,
  getCurrentUser,
  getCurrentToken,
  
  // Validación de contraseñas
  validatePassword,
  validatePasswordMatch,
  validatePasswordDifferent,
  
  // Cambio de contraseñas
  changeOwnPassword,
  changeUserPasswordByAdmin,
  
  // Utilidades
  isUserActive,
  getUserStatus
};

export default authService;