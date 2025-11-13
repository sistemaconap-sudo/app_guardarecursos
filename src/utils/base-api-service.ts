/**
 * =============================================
 * CAPA BASE DE ACCESO A LA API
 * =============================================
 * 
 * Este archivo contiene la configuración base y funciones genéricas
 * para realizar peticiones HTTP al backend de CONAP.
 * 
 * IMPORTANTE: Este es el único lugar donde se define la URL base
 * y la lógica de manejo de errores HTTP.
 */

// ===== CONFIGURACIÓN =====

/**
 * URL base del backend API
 * Apunta al backend de Supabase Edge Functions
 */
import { projectId, publicAnonKey } from './supabase/info';

const getApiBaseUrl = (): string => {
  // Usar Supabase Edge Functions como backend
  return `https://${projectId}.supabase.co/functions/v1/make-server-811550f1`;
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Obtener el token de autenticación
 * Primero intenta obtenerlo de la sesión de CONAP, si no, usa el anon key
 */
const getDefaultAuthToken = (): string => {
  // Intentar obtener el token de la sesión guardada
  const sessionStr = localStorage.getItem('conap_session');
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      if (session.token) {
        return session.token;
      }
    } catch (e) {
      // Si falla el parsing, continuar
    }
  }
  
  // Fallback al publicAnonKey
  return publicAnonKey;
};

/**
 * Timeout para las peticiones (en milisegundos)
 */
const REQUEST_TIMEOUT = 30000; // 30 segundos

// ===== TIPOS =====

/**
 * Métodos HTTP soportados
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Opciones para las peticiones HTTP
 */
export interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  requiresAuth?: boolean; // Si la petición requiere token JWT
}

/**
 * Respuesta genérica de la API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

/**
 * Error personalizado de la API
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ===== GESTIÓN DE TOKEN JWT =====

/**
 * Clave para almacenar el token en localStorage
 */
const TOKEN_KEY = 'conap_auth_token';

/**
 * Guarda el token JWT en localStorage
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Obtiene el token JWT de localStorage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Elimina el token JWT de localStorage
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Verifica si hay un token almacenado
 */
export const hasAuthToken = (): boolean => {
  return !!getAuthToken();
};

/**
 * Guarda el último error antes de hacer logout
 * para poder mostrarlo en la consola después de la redirección
 */
const saveLastError = (error: any): void => {
  try {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      message: error?.message || 'Error desconocido',
      stack: error?.stack,
      statusCode: error?.statusCode,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
    };
    sessionStorage.setItem('conap_last_error', JSON.stringify(errorInfo));
    console.error('💾 ERROR GUARDADO EN SESSIONSTORAGE (visible después de redirección):', errorInfo);
  } catch (e) {
    console.error('No se pudo guardar el error:', e);
  }
};

/**
 * Muestra el último error guardado (si existe)
 * Llamar esto al inicio de la aplicación
 */
export const showLastError = (): void => {
  try {
    const lastErrorStr = sessionStorage.getItem('conap_last_error');
    if (lastErrorStr) {
      const lastError = JSON.parse(lastErrorStr);
      console.error('🔴 ÚLTIMO ERROR ANTES DE LA REDIRECCIÓN:');
      console.error('⏰ Timestamp:', lastError.timestamp);
      console.error('📝 Mensaje:', lastError.message);
      console.error('📊 Status Code:', lastError.statusCode);
      console.error('📚 Stack:', lastError.stack);
      console.error('🔍 Error completo:', lastError.fullError);
      
      // Limpiar después de mostrar
      sessionStorage.removeItem('conap_last_error');
    }
  } catch (e) {
    // Silenciar errores de parsing
  }
};

/**
 * Fuerza el logout del usuario actual
 * LIMPIA TODO y dispara evento para que App.tsx muestre el Login
 */
export const forceLogout = (error?: any): void => {
  console.error('❌ FORZANDO LOGOUT - TOKEN EXPIRADO O INVÁLIDO (401)');
  
  // Guardar el error antes de limpiar todo
  if (error) {
    saveLastError(error);
  }
  
  // Limpiar absolutamente TODO
  localStorage.clear();
  // NO limpiar sessionStorage aún porque tiene el error guardado
  
  // Disparar evento personalizado para que App.tsx maneje el logout
  window.dispatchEvent(new CustomEvent('auth:force-logout'));
  
  // Forzar recarga completa de la página como fallback
  setTimeout(() => {
    window.location.reload();
  }, 100);
};

/**
 * Obtiene el token JWT requerido
 * 
 * Esta función DEBE usarse en todos los servicios para obtener el token.
 * 
 * Si no hay token: Lanza error (NO fuerza logout automáticamente)
 * El logout solo se fuerza cuando el servidor responde 401
 * 
 * @returns Token JWT válido
 * @throws Error si no hay token disponible
 */
export const getRequiredAuthToken = (): string => {
  const token = getAuthToken();
  
  if (!token) {
    console.warn('⚠️ No hay token disponible - La petición podría fallar');
    throw new Error('NO_TOKEN');
  }
  
  return token;
};

// ===== FUNCIÓN PRINCIPAL DE PETICIONES =====

/**
 * Función genérica para realizar peticiones HTTP a la API
 * 
 * @param endpoint - Endpoint de la API (ej: '/usuarios', '/actividades/123')
 * @param options - Opciones de la petición
 * @returns Promesa con los datos de la respuesta
 * @throws ApiError si la petición falla
 * 
 * @example
 * ```typescript
 * // GET simple
 * const usuarios = await fetchApi<Usuario[]>('/usuarios');
 * 
 * // POST con body
 * const nuevoUsuario = await fetchApi<Usuario>('/usuarios', {
 *   method: 'POST',
 *   body: { nombre: 'Juan', apellido: 'Pérez' }
 * });
 * 
 * // PUT con autenticación
 * const actualizado = await fetchApi<Usuario>('/usuarios/123', {
 *   method: 'PUT',
 *   body: { nombre: 'Juan Carlos' },
 *   requiresAuth: true
 * });
 * 
 * // DELETE
 * await fetchApi('/usuarios/123', { method: 'DELETE' });
 * ```
 */
export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = REQUEST_TIMEOUT,
    requiresAuth = true, // Por defecto requiere autenticación
  } = options;

  // Construir URL completa
  const url = `${API_BASE_URL}${endpoint}`;

  // Construir headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Agregar token JWT si se requiere autenticación
  if (requiresAuth) {
    const token = getAuthToken() || getDefaultAuthToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // Construir opciones de fetch
  const fetchOptions: RequestInit = {
    method,
    headers: requestHeaders,
    credentials: 'include', // Incluir cookies si es necesario
  };

  // Agregar body si existe (excepto para GET)
  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  // Crear AbortController para timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Realizar petición
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    // Limpiar timeout
    clearTimeout(timeoutId);

    // Parsear respuesta JSON
    let data: any;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Manejar errores HTTP
    if (!response.ok) {
      throw new ApiError(
        data?.message || data?.error || `Error HTTP ${response.status}`,
        response.status,
        data
      );
    }

    // Retornar datos
    // Si la respuesta tiene estructura { success, data }, retornar solo data
    if (data && typeof data === 'object' && 'data' in data) {
      return data.data as T;
    }

    return data as T;

  } catch (error) {
    // Limpiar timeout en caso de error
    clearTimeout(timeoutId);

    // Manejar timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('La petición ha excedido el tiempo de espera', 408);
    }

    // Manejar error de red
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      // NO forzar logout en este caso, puede ser que la Edge Function no esté desplegada
      console.error('⚠️ ERROR DE CONEXIÓN - Posiblemente Edge Function no desplegada:', endpoint);
      throw new ApiError(
        'No se pudo conectar con el servidor. Verifica que la Edge Function esté desplegada en Supabase.',
        0
      );
    }

    // Manejar errores HTTP específicos
    if (error instanceof ApiError) {
      // Error 401: Token inválido o expirado - FORZAR LOGOUT INMEDIATAMENTE
      if (error.statusCode === 401) {
        console.error('❌ ERROR 401 - SESIÓN EXPIRADA - FORZANDO LOGOUT');
        
        // Forzar logout inmediatamente
        forceLogout(error);
        
        // No continuar con el throw porque ya estamos forzando logout
        return;
      }

      // Error 403: Sin permisos
      if (error.statusCode === 403) {
        console.error('Acceso denegado:', error.message);
      }

      // Error 404: Recurso no encontrado
      if (error.statusCode === 404) {
        console.error('Recurso no encontrado:', endpoint);
      }

      // Error 500: Error del servidor
      if (error.statusCode >= 500) {
        console.error('Error del servidor:', error.message);
      }

      throw error;
    }

    // Error desconocido
    throw new ApiError(
      error instanceof Error ? error.message : 'Error desconocido',
      500
    );
  }
}

// ===== FUNCIONES DE CONVENIENCIA =====

/**
 * Realiza una petición GET
 */
export async function get<T = any>(
  endpoint: string,
  options?: Omit<RequestOptions, 'method'>
): Promise<T> {
  return fetchApi<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * Realiza una petición POST
 */
export async function post<T = any>(
  endpoint: string,
  body?: any,
  options?: Omit<RequestOptions, 'method' | 'body'>
): Promise<T> {
  return fetchApi<T>(endpoint, { ...options, method: 'POST', body });
}

/**
 * Realiza una petición PUT
 */
export async function put<T = any>(
  endpoint: string,
  body?: any,
  options?: Omit<RequestOptions, 'method' | 'body'>
): Promise<T> {
  return fetchApi<T>(endpoint, { ...options, method: 'PUT', body });
}

/**
 * Realiza una petición PATCH
 */
export async function patch<T = any>(
  endpoint: string,
  body?: any,
  options?: Omit<RequestOptions, 'method' | 'body'>
): Promise<T> {
  return fetchApi<T>(endpoint, { ...options, method: 'PATCH', body });
}

/**
 * Realiza una petición DELETE
 */
export async function del<T = any>(
  endpoint: string,
  options?: Omit<RequestOptions, 'method'>
): Promise<T> {
  return fetchApi<T>(endpoint, { ...options, method: 'DELETE' });
}

// ===== UTILIDADES =====

/**
 * Construye una query string a partir de un objeto
 * 
 * @example
 * buildQueryString({ page: 1, limit: 10, search: 'test' })
 * // Retorna: "?page=1&limit=10&search=test"
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Obtiene la URL base de la API (exportada)
 */
export function getApiUrl(): string {
  return API_BASE_URL;
}

/**
 * Maneja errores de la API y los convierte en mensajes amigables
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Ha ocurrido un error desconocido';
}

// ===== INTERCEPTORES (OPCIONAL) =====

/**
 * Tipo para funciones interceptoras de request
 */
export type RequestInterceptor = (
  endpoint: string,
  options: RequestOptions
) => RequestOptions | Promise<RequestOptions>;

/**
 * Tipo para funciones interceptoras de response
 */
export type ResponseInterceptor = <T>(
  response: T,
  endpoint: string
) => T | Promise<T>;

/**
 * Lista de interceptores de request
 */
const requestInterceptors: RequestInterceptor[] = [];

/**
 * Lista de interceptores de response
 */
const responseInterceptors: ResponseInterceptor[] = [];

/**
 * Agrega un interceptor de request
 */
export function addRequestInterceptor(interceptor: RequestInterceptor): void {
  requestInterceptors.push(interceptor);
}

/**
 * Agrega un interceptor de response
 */
export function addResponseInterceptor(interceptor: ResponseInterceptor): void {
  responseInterceptors.push(interceptor);
}

/**
 * Ejecuta los interceptores de request
 */
export async function runRequestInterceptors(
  endpoint: string,
  options: RequestOptions
): Promise<RequestOptions> {
  let modifiedOptions = options;

  for (const interceptor of requestInterceptors) {
    modifiedOptions = await interceptor(endpoint, modifiedOptions);
  }

  return modifiedOptions;
}

/**
 * Ejecuta los interceptores de response
 */
export async function runResponseInterceptors<T>(
  response: T,
  endpoint: string
): Promise<T> {
  let modifiedResponse = response;

  for (const interceptor of responseInterceptors) {
    modifiedResponse = await interceptor(modifiedResponse, endpoint);
  }

  return modifiedResponse;
}

// ===== EXPORTACIONES POR DEFECTO =====

export default {
  fetchApi,
  get,
  post,
  put,
  patch,
  del,
  setAuthToken,
  getAuthToken,
  getRequiredAuthToken,
  removeAuthToken,
  hasAuthToken,
  buildQueryString,
  getApiUrl,
  getErrorMessage,
  addRequestInterceptor,
  addResponseInterceptor,
};