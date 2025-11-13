/**
 * 🔐 Utilidades para Variables de Entorno
 * 
 * Centraliza el acceso a variables de entorno con validación y valores por defecto.
 * Usa este archivo en lugar de acceder directamente a import.meta.env
 * 
 * @module utils/env
 */

/**
 * Interface para configuración de la aplicación
 */
export interface AppConfig {
  // Supabase
  supabase: {
    url: string;
    anonKey: string;
  };
  
  // Google Maps
  googleMaps: {
    apiKey: string;
  };
  
  // Autenticación
  auth: {
    jwtDurationMs: number;
    minPasswordLength: number;
  };
  
  // Regional
  regional: {
    timezone: string;
    timezoneOffset: number;
    locale: string;
  };
  
  // Aplicación
  app: {
    name: string;
    version: string;
    env: 'development' | 'production' | 'staging';
  };
  
  // Límites
  limits: {
    defaultPageSize: number;
    maxFileSizeMB: number;
    maxGPSPointsPerRoute: number;
  };
  
  // Mapas
  maps: {
    defaultCenter: {
      lat: number;
      lng: number;
    };
    zoom: {
      default: number;
      area: number;
      route: number;
    };
  };
  
  // Seguridad
  security: {
    maxLoginAttempts: number;
    lockoutDurationMinutes: number;
  };
}

/**
 * Obtiene una variable de entorno con valor por defecto
 */
function getEnvVar(key: string, defaultValue: string = ''): string {
  return import.meta.env[key] || defaultValue;
}

/**
 * Obtiene una variable de entorno numérica
 */
function getEnvNumber(key: string, defaultValue: number): number {
  const value = import.meta.env[key];
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Obtiene una variable de entorno decimal
 */
function getEnvFloat(key: string, defaultValue: number): number {
  const value = import.meta.env[key];
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Configuración centralizada de la aplicación
 * 
 * IMPORTANTE:
 * - Solo variables con prefijo VITE_ están disponibles en el frontend
 * - Variables sin prefijo solo están disponibles en backend (Supabase Functions)
 */
export const config: AppConfig = {
  // Supabase (estas se importan desde /utils/supabase/info.tsx)
  supabase: {
    url: getEnvVar('VITE_SUPABASE_URL', 'https://vqapoblguyzzukqopzdp.supabase.co'),
    anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxYXBvYmxndXl6enVrcW9wemRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjkzOTAsImV4cCI6MjA3Nzk0NTM5MH0.ynJo7XPloEy3raS_CKczidVPvMy1-_FNvgOvxNrICss')
  },
  
  // Google Maps
  googleMaps: {
    apiKey: getEnvVar('VITE_GOOGLE_MAPS_API_KEY', 'AIzaSyC1XVfrE8CmVg3nhd-6Sps087JmARuSNWc')
  },
  
  // Autenticación
  auth: {
    jwtDurationMs: getEnvNumber('VITE_JWT_DURATION_MS', 86400000), // 24 horas
    minPasswordLength: getEnvNumber('VITE_MIN_PASSWORD_LENGTH', 6)
  },
  
  // Regional
  regional: {
    timezone: getEnvVar('VITE_TIMEZONE', 'America/Guatemala'),
    timezoneOffset: getEnvNumber('VITE_TIMEZONE_OFFSET', -6),
    locale: getEnvVar('VITE_LOCALE', 'es-GT')
  },
  
  // Aplicación
  app: {
    name: getEnvVar('VITE_APP_NAME', 'CONAP - Gestión de Guardarecursos'),
    version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
    env: (getEnvVar('NODE_ENV', 'production') as 'development' | 'production' | 'staging')
  },
  
  // Límites
  limits: {
    defaultPageSize: getEnvNumber('VITE_DEFAULT_PAGE_SIZE', 10),
    maxFileSizeMB: getEnvNumber('VITE_MAX_FILE_SIZE_MB', 10),
    maxGPSPointsPerRoute: getEnvNumber('VITE_MAX_GPS_POINTS_PER_ROUTE', 1000)
  },
  
  // Mapas
  maps: {
    defaultCenter: {
      lat: getEnvFloat('VITE_DEFAULT_MAP_CENTER_LAT', 15.5),
      lng: getEnvFloat('VITE_DEFAULT_MAP_CENTER_LNG', -90.25)
    },
    zoom: {
      default: getEnvNumber('VITE_DEFAULT_MAP_ZOOM', 7),
      area: getEnvNumber('VITE_AREA_MAP_ZOOM', 13),
      route: getEnvNumber('VITE_ROUTE_MAP_ZOOM', 15)
    }
  },
  
  // Seguridad
  security: {
    maxLoginAttempts: getEnvNumber('VITE_MAX_LOGIN_ATTEMPTS', 5),
    lockoutDurationMinutes: getEnvNumber('VITE_LOCKOUT_DURATION_MINUTES', 15)
  }
};

/**
 * Verifica si estamos en modo desarrollo
 */
export const isDevelopment = (): boolean => {
  return config.app.env === 'development';
};

/**
 * Verifica si estamos en modo producción
 */
export const isProduction = (): boolean => {
  return config.app.env === 'production';
};

/**
 * Verifica si el debug está habilitado
 */
export const isDebugEnabled = (): boolean => {
  return getEnvVar('VITE_DEBUG_MODE', 'false') === 'true';
};

/**
 * Valida que las variables críticas estén configuradas
 * 
 * @throws Error si faltan variables críticas
 */
export function validateEnvironment(): void {
  const errors: string[] = [];
  
  // Validar Google Maps API Key
  if (!config.googleMaps.apiKey || config.googleMaps.apiKey === 'tu_google_maps_api_key_aqui') {
    errors.push('VITE_GOOGLE_MAPS_API_KEY no está configurada o usa valor de ejemplo');
  }
  
  // Validar Supabase (aunque estas se importan desde /utils/supabase/info.tsx)
  // Solo advertencia, no error crítico
  if (!config.supabase.url.includes('supabase.co')) {
    console.warn('⚠️ VITE_SUPABASE_URL parece no ser una URL válida de Supabase');
  }
  
  if (errors.length > 0) {
    console.error('❌ Errores en configuración de variables de entorno:');
    errors.forEach(error => console.error(`  - ${error}`));
    
    if (isProduction()) {
      throw new Error('Variables de entorno críticas no configuradas. Ver consola para detalles.');
    } else {
      console.warn('⚠️ Continúa en modo desarrollo pero pueden haber problemas');
    }
  } else {
    console.log('✅ Variables de entorno validadas correctamente');
  }
}

/**
 * Imprime la configuración actual (para debugging)
 * IMPORTANTE: NO mostrar valores sensibles en producción
 */
export function printConfig(): void {
  if (isProduction()) {
    console.log('ℹ️ Configuración de entorno (producción - valores ocultos)');
    console.log({
      app: config.app,
      regional: config.regional,
      limits: config.limits,
      maps: {
        ...config.maps,
        // No mostrar API keys
      }
    });
  } else {
    console.log('ℹ️ Configuración de entorno completa (desarrollo):');
    console.log(config);
  }
}

/**
 * Export por defecto
 */
export default config;
