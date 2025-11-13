/**
 * 🌐 API de Actividades - Comunicación con el servidor
 * 
 * Este archivo maneja todas las llamadas HTTP al backend para el módulo
 * de Planificación de Actividades.
 * 
 * OPTIMIZADO: Cache de peticiones, reducción de consultas redundantes
 */

import { getRequiredAuthToken } from './base-api-service';
import { Actividad } from '../types';
import { ActividadFormData } from './actividadesService';
import { API_BASE_URL } from './api-config';

const BASE_URL = API_BASE_URL;

// ===== MAPEOS TEMPORALES (mientras backend no incluye joins) =====

/**
 * Mapeo de IDs de tipo de actividad a nombres
 * TODO: Eliminar cuando backend incluya joins con tabla tipo
 * 
 * NOTA: Estos valores deben coincidir EXACTAMENTE con tp_nombre en tabla tipo
 * Ejecuta: SELECT tp_id, tp_nombre FROM tipo ORDER BY tp_id;
 */
const TIPO_ID_TO_NAME: { [key: number]: string } = {
  1: 'Patrullaje de Control y Vigilancia',
  2: 'Actividades de Prevención y Atención de Incendios Forestales',
  3: 'Mantenimiento de Área Protegida',
  4: 'Reforestación de Área Protegida',
  5: 'Mantenimiento de Reforestación',
};

/**
 * Mapeo de IDs de estado a nombres
 * TODO: Eliminar cuando backend incluya joins con tabla estado
 * 
 * NOTA: Estos valores deben coincidir EXACTAMENTE con std_nombre en tabla estado
 * Ejecuta: SELECT std_id, std_nombre FROM estado ORDER BY std_id;
 */
const ESTADO_ID_TO_NAME: { [key: number]: string } = {
  1: 'Activo',
  2: 'Suspendido',
  3: 'Desactivado',
  4: 'Operativo',
  5: 'En Reparación',
  6: 'Programada',
  7: 'En Progreso',
  8: 'Completada',
  9: 'Reportado',
  10: 'En Investigación',
  11: 'En Proceso',
  12: 'Resuelto',
  13: 'Escalado',
  14: 'En Atención',
};

// ===== CACHE DE PETICIONES (OPTIMIZACIÓN) =====

/**
 * Cache simple para la última petición de actividades
 * Reduce peticiones innecesarias al backend
 */
let actividadesCache: {
  data: Actividad[] | null;
  timestamp: number | null;
  ttl: number; // Time to live en milisegundos
} = {
  data: null,
  timestamp: null,
  ttl: 30000 // 30 segundos
};

/**
 * Invalida el cache de actividades
 */
export function invalidarCacheActividades(): void {
  actividadesCache = {
    data: null,
    timestamp: null,
    ttl: 30000
  };
  console.log('🧹 Cache de actividades limpiado');
}

/**
 * Verifica si el cache es válido
 */
function isCacheValid(): boolean {
  if (!actividadesCache || !actividadesCache.data || !actividadesCache.timestamp) {
    return false;
  }
  const now = Date.now();
  return (now - actividadesCache.timestamp) < actividadesCache.ttl;
}

// ===== API CALLS (OPTIMIZADAS) =====

/**
 * Obtiene todas las actividades desde el servidor
 * OPTIMIZADO: Usa cache para reducir peticiones redundantes
 */
export async function fetchActividades(accessToken: string, forceRefresh: boolean = false): Promise<Actividad[]> {
  try {
    // Si tenemos cache válido y no es refresh forzado, retornar del cache
    if (!forceRefresh && isCacheValid() && actividadesCache.data) {
      console.log('✅ Usando actividades desde cache');
      return actividadesCache.data;
    }

    console.log('📡 Consultando actividades desde backend...');
    const response = await fetch(
      `${BASE_URL}/actividades`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ Error al obtener actividades:', result.error);
      return [];
    }

    console.log('🔍 DEBUG: Datos recibidos del servidor:', result.actividades);
    console.log('🔍 DEBUG: Primera actividad:', result.actividades[0]);

    // Transformar datos del servidor al formato del frontend
    const actividades = result.actividades.map((act: any) => {
      // Determinar tipo y estado desde IDs o desde objetos anidados
      const tipoId = act.tipo?.tp_id || act.act_tipo;
      const estadoId = act.estado?.std_id || act.act_estado;
      const usuarioId = act.usuario?.usr_id || act.act_usuario;
      
      return {
        id: act.act_id.toString(),
        codigo: act.act_codigo,
        tipo: TIPO_ID_TO_NAME[tipoId] || act.tipo?.tp_nombre || '',
        descripcion: act.act_descripcion,
        fecha: act.act_fechah_programacion?.split('T')[0] || act.act_fechah_programacion?.split(' ')[0] || '',
        horaInicio: act.act_fechah_programacion?.split('T')[1]?.substring(0, 5) || act.act_fechah_programacion?.split(' ')[1]?.substring(0, 5) || '',
        horaFin: act.act_fechah_fin?.split('T')[1]?.substring(0, 5) || act.act_fechah_fin?.split(' ')[1]?.substring(0, 5) || '',
        fechaHoraInicio: act.act_fechah_iniciio,
        fechaHoraFin: act.act_fechah_fin,
        coordenadasInicio: (act.act_latitud_inicio && act.act_longitud_inicio) ? {
          lat: parseFloat(act.act_latitud_inicio),
          lng: parseFloat(act.act_longitud_inicio)
        } : undefined,
        coordenadasFin: (act.act_latitud_fin && act.act_longitud_fin) ? {
          lat: parseFloat(act.act_latitud_fin),
          lng: parseFloat(act.act_longitud_fin)
        } : undefined,
        coordenadas: (act.act_latitud_inicio && act.act_longitud_inicio) ? {
          lat: parseFloat(act.act_latitud_inicio),
          lng: parseFloat(act.act_longitud_inicio)
        } : undefined,
        guardarecurso: (usuarioId || act.usuario?.usr_id || '')?.toString(),
        guardarecursoNombre: act.usuario ? `${act.usuario.usr_nombre} ${act.usuario.usr_apellido}` : '',
        estado: ESTADO_ID_TO_NAME[estadoId] || act.estado?.std_nombre || 'Programada',
        evidencias: [],
        hallazgos: [],
        areaProtegida: ''
      };
    });
    
    console.log('🔍 DEBUG: Actividades transformadas:', actividades);
    console.log('🔍 DEBUG: Primera actividad transformada:', actividades[0]);

    // Guardar en cache
    actividadesCache.data = actividades;
    actividadesCache.timestamp = Date.now();
    
    console.log(`✅ ${actividades.length} actividades cargadas y cacheadas`);
    return actividades;
  } catch (error) {
    console.error('❌ Error en fetchActividades:', error);
    return [];
  }
}

/**
 * Crea una nueva actividad en el servidor
 * OPTIMIZADO: Limpia cache automáticamente
 */
export async function createActividadAPI(formData: ActividadFormData, accessToken: string): Promise<Actividad> {
  try {
    const response = await fetch(
      `${BASE_URL}/actividades`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      }
    );

    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ Error al crear actividad:', result.error);
      throw new Error(result.error);
    }

    // Limpiar cache
    invalidarCacheActividades();

    // Transformar respuesta al formato del frontend
    const act = result.actividad;
    return {
      id: act.act_id.toString(),
      codigo: act.act_codigo,
      tipo: TIPO_ID_TO_NAME[act.tipo?.tp_id] || formData.tipo,
      descripcion: act.act_descripcion,
      fecha: act.act_fechah_programacion?.split('T')[0] || formData.fecha,
      horaInicio: act.act_fechah_programacion?.split('T')[1]?.substring(0, 5) || formData.horaInicio,
      horaFin: formData.horaFin,
      coordenadas: formData.coordenadas,
      guardarecurso: formData.guardarecurso,
      estado: ESTADO_ID_TO_NAME[act.estado?.std_id] || 'Programada',
      evidencias: [],
      hallazgos: [],
      areaProtegida: ''
    };
  } catch (error) {
    console.error('❌ Error en createActividadAPI:', error);
    throw error;
  }
}

/**
 * Actualiza una actividad existente en el servidor
 * OPTIMIZADO: Limpia cache automáticamente
 */
export async function updateActividadAPI(actividadId: string, formData: ActividadFormData, accessToken: string): Promise<Actividad> {
  try {
    const response = await fetch(
      `${BASE_URL}/actividades/${actividadId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      }
    );

    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ Error al actualizar actividad:', result.error);
      throw new Error(result.error);
    }

    // Limpiar cache
    invalidarCacheActividades();

    // Transformar respuesta al formato del frontend
    const act = result.actividad;
    return {
      id: act.act_id.toString(),
      codigo: act.act_codigo,
      tipo: TIPO_ID_TO_NAME[act.tipo?.tp_id] || formData.tipo,
      descripcion: act.act_descripcion,
      fecha: act.act_fechah_programacion?.split('T')[0] || formData.fecha,
      horaInicio: act.act_fechah_programacion?.split('T')[1]?.substring(0, 5) || formData.horaInicio,
      horaFin: formData.horaFin,
      coordenadas: formData.coordenadas,
      guardarecurso: formData.guardarecurso,
      estado: ESTADO_ID_TO_NAME[act.estado?.std_id] || 'Programada',
      evidencias: [],
      hallazgos: [],
      areaProtegida: ''
    };
  } catch (error) {
    console.error('❌ Error en updateActividadAPI:', error);
    throw error;
  }
}

/**
 * Elimina una actividad del servidor
 * OPTIMIZADO: Limpia cache automáticamente
 */
export async function deleteActividadAPI(actividadId: string, accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${BASE_URL}/actividades/${actividadId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ Error al eliminar actividad:', result.error);
      throw new Error(result.error);
    }

    // Limpiar cache
    invalidarCacheActividades();

    return true;
  } catch (error) {
    console.error('❌ Error en deleteActividadAPI:', error);
    throw error;
  }
}

/**
 * Crea múltiples actividades de forma masiva en el servidor
 * OPTIMIZADO: Limpia cache automáticamente
 */
export async function createActividadesBulkAPI(
  actividades: ActividadFormData[], 
  accessToken: string
): Promise<{
  success: boolean;
  actividadesCargadas: number;
  actividadesConError: number;
  actividades: Actividad[];
  errores: Array<{ index: number; codigo: string; error: string }>;
}> {
  try {
    const response = await fetch(
      `${BASE_URL}/actividades/bulk`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ actividades })
      }
    );

    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ Error al crear actividades masivamente:', result.error);
      throw new Error(result.error);
    }

    // Limpiar cache
    invalidarCacheActividades();

    // Transformar las actividades de la respuesta al formato del frontend
    const actividadesTransformadas = result.actividades.map((act: any) => ({
      id: act.act_id.toString(),
      codigo: act.act_codigo,
      tipo: TIPO_ID_TO_NAME[act.tipo?.tp_id] || '',
      descripcion: act.act_descripcion,
      fecha: act.act_fechah_programacion?.split('T')[0] || '',
      horaInicio: act.act_fechah_programacion?.split('T')[1]?.substring(0, 5) || '',
      horaFin: '',
      guardarecurso: act.usuario?.usr_id?.toString() || '',
      guardarecursoNombre: act.usuario ? `${act.usuario.usr_nombre} ${act.usuario.usr_apellido}` : '',
      estado: ESTADO_ID_TO_NAME[act.estado?.std_id] || 'Programada',
      evidencias: [],
      hallazgos: [],
      areaProtegida: ''
    }));

    return {
      success: true,
      actividadesCargadas: result.actividadesCargadas,
      actividadesConError: result.actividadesConError,
      actividades: actividadesTransformadas,
      errores: result.errores || []
    };
  } catch (error) {
    console.error('❌ Error en createActividadesBulkAPI:', error);
    throw error;
  }
}