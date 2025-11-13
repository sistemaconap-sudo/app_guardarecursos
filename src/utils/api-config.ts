/**
 * 🌐 API Configuration
 * 
 * Configuración centralizada para todos los endpoints del backend.
 * Importa automáticamente el projectId de Supabase.
 * 
 * @module utils/api-config
 */

import { projectId } from './supabase/info';

/**
 * Nombre de la función Edge en Supabase
 * Este es el nombre único de tu función desplegada
 */
export const EDGE_FUNCTION_NAME = 'make-server-811550f1';

/**
 * URL base del backend (Edge Function)
 */
export const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/${EDGE_FUNCTION_NAME}`;

/**
 * Endpoints de la API
 */
export const API_ENDPOINTS = {
  // Health & Init
  health: `${API_BASE_URL}/health`,
  initData: `${API_BASE_URL}/init-data`,
  checkInit: `${API_BASE_URL}/check-init`,
  
  // Dashboard
  dashboardStats: `${API_BASE_URL}/dashboard/stats`,
  dashboardAreas: `${API_BASE_URL}/dashboard/areas`,
  
  // Usuario
  usuario: (email: string) => `${API_BASE_URL}/usuario/${encodeURIComponent(email)}`,
  
  // Usuarios (Coordinadores)
  usuarios: `${API_BASE_URL}/usuarios`,
  usuarioById: (id: string) => `${API_BASE_URL}/usuarios/${id}`,
  usuarioEstado: (id: string) => `${API_BASE_URL}/usuarios/${id}/estado`,
  usuarioCambiarPassword: (id: string) => `${API_BASE_URL}/usuarios/${id}/cambiar-password`,
  
  // Guardarecursos
  guardarecursos: `${API_BASE_URL}/guardarecursos`,
  guardarecursoById: (id: string) => `${API_BASE_URL}/guardarecursos/${id}`,
  guardarecursoEstado: (id: string) => `${API_BASE_URL}/guardarecursos/${id}/estado`,
  
  // Áreas Protegidas
  areas: `${API_BASE_URL}/areas`,
  areaById: (id: string) => `${API_BASE_URL}/areas/${id}`,
  areaEstado: (id: string) => `${API_BASE_URL}/areas/${id}/estado`,
  
  // Catálogos
  ecosistemas: `${API_BASE_URL}/ecosistemas`,
  departamentos: `${API_BASE_URL}/departamentos`,
  
  // Equipos
  equipos: `${API_BASE_URL}/equipos`,
  equipoById: (id: string) => `${API_BASE_URL}/equipos/${id}`,
  equipoEstado: (id: string) => `${API_BASE_URL}/equipos/${id}/estado`,
  
  // Actividades
  actividades: `${API_BASE_URL}/actividades`,
  actividadById: (id: string) => `${API_BASE_URL}/actividades/${id}`,
  actividadEstado: (id: string) => `${API_BASE_URL}/actividades/${id}/estado`,
  
  // Patrullajes
  patrullajes: `${API_BASE_URL}/patrullajes`,
  patrullajeById: (id: string) => `${API_BASE_URL}/patrullajes/${id}`,
  patrullajeEstado: (id: string) => `${API_BASE_URL}/patrullajes/${id}/estado`,
  
  // Incidentes
  incidentes: `${API_BASE_URL}/incidentes`,
  incidenteById: (id: string) => `${API_BASE_URL}/incidentes/${id}`,
  incidenteEstado: (id: string) => `${API_BASE_URL}/incidentes/${id}/estado`,
};

/**
 * Helper para construir URLs con query params
 */
export function buildUrl(baseUrl: string, params?: Record<string, string | number | boolean>): string {
  if (!params) return baseUrl;
  
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  buildUrl
};