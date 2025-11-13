/**
 * 📊 Dashboard Service
 * 
 * Servicio centralizado que maneja toda la lógica funcional del Dashboard.
 * 
 * IMPORTANTE: El Dashboard solo se muestra para roles Administrador y Coordinador.
 * Los Guardarecursos NO tienen acceso al Dashboard.
 * 
 * CONEXIÓN: Consulta directamente a Supabase desde el frontend
 * OPTIMIZADO: Cache de IDs de estado/rol y consultas consolidadas
 * 
 * @module utils/dashboardService
 */

import { AreaProtegida } from '../types';
import { supabase } from './supabase/client';
import { getGuatemalaDate } from './formatters';

/**
 * Interface para las estadísticas del dashboard (formato frontend)
 */
export interface DashboardEstadisticas {
  totalAreas: number;
  totalGuardarecursos: number;
  totalActividades: number;
  actividadesHoy: number;
}

/**
 * Interface para las tarjetas de estadísticas
 */
export interface EstadisticaCard {
  title: string;
  value: number;
  gradient: string;
  iconColor: string;
  textColor: string;
  border: string;
  section: string;
}

/**
 * Interface para IDs de catálogos
 */
interface CatalogIds {
  estadoActivoId: number | null;
  rolGuardarecursoId: number | null;
}

// ===== CACHE DE IDs DE CATÁLOGOS =====

/**
 * Cache en memoria para IDs de estado y rol
 * Evita consultas repetidas a las tablas de catálogo
 */
let catalogIdsCache: CatalogIds | null = null;

/**
 * Obtiene y cachea los IDs de estado "Activo" y rol "Guardarecurso"
 * Solo consulta la base de datos la primera vez, luego usa cache
 * 
 * @returns Promesa con los IDs de catálogos
 */
async function getCatalogIds(): Promise<CatalogIds> {
  // Si ya tenemos los IDs en cache, retornarlos inmediatamente
  if (catalogIdsCache) {
    return catalogIdsCache;
  }

  try {
    // Consultar ambos catálogos en paralelo
    const [estadoResult, rolResult] = await Promise.all([
      supabase
        .from('estado')
        .select('std_id')
        .eq('std_nombre', 'Activo')
        .maybeSingle(),
      supabase
        .from('rol')
        .select('rl_id')
        .eq('rl_nombre', 'Guardarecurso')
        .maybeSingle()
    ]);

    // Procesar resultados
    const estadoActivoId = estadoResult.data?.std_id || null;
    const rolGuardarecursoId = rolResult.data?.rl_id || null;

    // Validar que se obtuvieron los datos
    if (!estadoActivoId) {
      console.warn('⚠️ Estado "Activo" no encontrado en la base de datos');
    }
    if (!rolGuardarecursoId) {
      console.warn('⚠️ Rol "Guardarecurso" no encontrado en la base de datos');
    }

    // Guardar en cache
    catalogIdsCache = {
      estadoActivoId,
      rolGuardarecursoId
    };

    console.log('✅ IDs de catálogos cacheados:', catalogIdsCache);
    return catalogIdsCache;

  } catch (error) {
    console.error('❌ Error al obtener IDs de catálogos:', error);
    // Retornar valores nulos en caso de error
    return {
      estadoActivoId: null,
      rolGuardarecursoId: null
    };
  }
}

/**
 * Invalida el cache de IDs de catálogos
 */
export function invalidarCacheCatalogos(): void {
  catalogIdsCache = null;
  // Cache limpiado silenciosamente
}

// ===== FUNCIONES DE API =====

/**
 * Obtiene las estadísticas del dashboard desde Supabase
 * 
 * OPTIMIZADO:
 * - Consulta IDs de catálogos una sola vez y los cachea
 * - Ejecuta todas las consultas de estadísticas en paralelo
 * - Reduce de 6 consultas a 3 consultas (después del cache)
 * 
 * @returns Promesa con las estadísticas del dashboard
 * @throws Error si falla la petición
 */
export async function fetchDashboardStats(): Promise<DashboardEstadisticas> {
  try {
    // Obtener IDs de catálogos (usa cache si está disponible)
    const { estadoActivoId, rolGuardarecursoId } = await getCatalogIds();

    // Si no se obtuvieron los IDs, retornar valores por defecto
    if (!estadoActivoId || !rolGuardarecursoId) {
      console.warn('⚠️ No se pudieron obtener IDs de catálogos, retornando estadísticas vacías');
      return {
        totalAreas: 0,
        totalGuardarecursos: 0,
        totalActividades: 0,
        actividadesHoy: 0
      };
    }

    // Fecha de hoy en Guatemala (GMT-6)
    const hoy = getGuatemalaDate();

    // Ejecutar todas las consultas de estadísticas en paralelo para máximo rendimiento
    const [
      areasResult,
      guardasResult,
      actividadesResult,
      actividadesHoyResult
    ] = await Promise.all([
      // CONSULTA 1: Total de áreas protegidas activas
      supabase
        .from('area')
        .select('*', { count: 'exact', head: true })
        .eq('ar_estado', estadoActivoId),
      
      // CONSULTA 2: Total de guardarecursos activos
      supabase
        .from('usuario')
        .select('*', { count: 'exact', head: true })
        .eq('usr_rol', rolGuardarecursoId)
        .eq('usr_estado', estadoActivoId),
      
      // CONSULTA 3: Total de actividades
      supabase
        .from('actividad')
        .select('*', { count: 'exact', head: true }),
      
      // CONSULTA 4: Actividades programadas para HOY
      supabase
        .from('actividad')
        .select('*', { count: 'exact', head: true })
        .gte('act_fechah_programacion', `${hoy}T00:00:00`)
        .lt('act_fechah_programacion', `${hoy}T23:59:59`)
    ]);

    // Procesar errores individuales
    if (areasResult.error) {
      console.error('❌ Error al contar áreas:', areasResult.error);
    }
    if (guardasResult.error) {
      console.error('❌ Error al contar guardarecursos:', guardasResult.error);
    }
    if (actividadesResult.error) {
      console.error('❌ Error al contar actividades:', actividadesResult.error);
    }
    if (actividadesHoyResult.error) {
      console.error('❌ Error al contar actividades de hoy:', actividadesHoyResult.error);
    }

    // Construir objeto de estadísticas
    const stats: DashboardEstadisticas = {
      totalAreas: areasResult.count || 0,
      totalGuardarecursos: guardasResult.count || 0,
      totalActividades: actividadesResult.count || 0,
      actividadesHoy: actividadesHoyResult.count || 0
    };
    
    console.log('📊 Estadísticas del Dashboard:', stats);
    return stats;

  } catch (error) {
    console.error('❌ Error en fetchDashboardStats:', error);
    // Retornar valores por defecto en caso de error
    return {
      totalAreas: 0,
      totalGuardarecursos: 0,
      totalActividades: 0,
      actividadesHoy: 0
    };
  }
}

/**
 * Obtiene las áreas protegidas para mostrar en el mapa
 * 
 * OPTIMIZADO:
 * - Usa cache de ID de estado "Activo"
 * - Consulta única con JOINs eficientes
 * 
 * @returns Promesa con array de áreas protegidas activas
 * @throws Error si falla la petición
 */
export async function fetchAreasProtegidas(): Promise<AreaProtegida[]> {
  try {
    // Obtener ID del estado "Activo" (usa cache si está disponible)
    const { estadoActivoId } = await getCatalogIds();

    if (!estadoActivoId) {
      console.warn('⚠️ Estado "Activo" no disponible, retornando array vacío');
      return [];
    }

    // Consultar áreas protegidas activas con JOINs
    const { data, error } = await supabase
      .from('area')
      .select(`
        ar_id,
        ar_nombre,
        ar_latitud,
        ar_longitud,
        ar_descripcion,
        ar_extension,
        departamento:ar_depto (dpt_id, dpt_nombre),
        ecosistema:ar_eco (ecs_id, ecs_nombre),
        estado:ar_estado (std_id, std_nombre)
      `)
      .eq('ar_estado', estadoActivoId)
      .order('ar_nombre');

    if (error) {
      console.error('❌ Error al consultar áreas protegidas:', error);
      return [];
    }

    // Mapear datos al formato AreaProtegida del frontend
    const areas = (data || []).map(area => ({
      id: area.ar_id.toString(),
      nombre: area.ar_nombre,
      coordenadas: {
        lat: area.ar_latitud,
        lng: area.ar_longitud
      },
      descripcion: area.ar_descripcion || '',
      extension: area.ar_extension || 0,
      departamento: area.departamento?.dpt_nombre || 'Sin departamento',
      ecosistema: area.ecosistema?.ecs_nombre || 'Sin ecosistema',
      estado: 'Activo' // Ya filtrado por estado activo
    }));

    console.log(`✅ ${areas.length} áreas protegidas cargadas`);
    return areas;

  } catch (error) {
    console.error('❌ Error en fetchAreasProtegidas:', error);
    return [];
  }
}

// ===== FUNCIONES DE UI =====

/**
 * Genera la configuración de las tarjetas de estadísticas principales
 * 
 * @param estadisticas - Estadísticas calculadas
 * @returns Array de configuración de tarjetas
 * 
 * @example
 * const stats = await fetchDashboardStats();
 * const cards = buildEstadisticasCards(stats);
 */
export function buildEstadisticasCards(
  estadisticas: DashboardEstadisticas
): EstadisticaCard[] {
  return [
    {
      title: "Áreas Protegidas",
      value: estadisticas.totalAreas,
      gradient: "bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950/40 dark:to-green-900/40",
      iconColor: "text-green-600 dark:text-green-400",
      textColor: "text-gray-900 dark:text-gray-100",
      border: "border border-green-200 dark:border-green-800",
      section: "asignacion-zonas"
    },
    {
      title: "Guardarecursos",
      value: estadisticas.totalGuardarecursos,
      gradient: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/40",
      iconColor: "text-blue-600 dark:text-blue-400",
      textColor: "text-gray-900 dark:text-gray-100",
      border: "border border-blue-200 dark:border-blue-800",
      section: "registro-guarda"
    },
    {
      title: "Actividades",
      value: estadisticas.totalActividades,
      gradient: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/40",
      iconColor: "text-purple-600 dark:text-purple-400",
      textColor: "text-gray-900 dark:text-gray-100",
      border: "border border-purple-200 dark:border-purple-800",
      section: "planificacion"
    },
    {
      title: "Actividades Hoy",
      value: estadisticas.actividadesHoy,
      gradient: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-orange-900/40",
      iconColor: "text-orange-600 dark:text-orange-400",
      textColor: "text-gray-900 dark:text-gray-100",
      border: "border border-orange-200 dark:border-orange-800",
      section: "registro-diario"
    }
  ];
}

/**
 * Servicio principal del Dashboard
 * Agrupa todas las funcionalidades en un objeto cohesivo
 */
export const dashboardService = {
  // Funciones de API
  fetchDashboardStats,
  fetchAreasProtegidas,
  
  // Funciones de UI
  buildEstadisticasCards,
  
  // Utilidades
  invalidarCacheCatalogos
};

export default dashboardService;