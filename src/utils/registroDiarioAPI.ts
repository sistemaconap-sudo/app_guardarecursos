/**
 * 🌐 API de Registro Diario - Comunicación con el servidor
 * 
 * Este archivo maneja todas las llamadas HTTP al backend para el módulo
 * de Registro Diario de Campo.
 */

import { projectId, publicAnonKey } from './supabase/info';
import { Actividad } from '../types';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-811550f1`;

/**
 * Verificar si el usuario tiene patrullajes en progreso
 */
export async function verificarPatrullajesEnProgreso(
  accessToken: string
): Promise<{ tienePatrullajeEnProgreso: boolean; patrullaje?: Actividad; coordenadas?: any[] }> {
  try {
    const response = await fetch(
      `${BASE_URL}/actividades/patrullajes-en-progreso`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('Error al verificar patrullajes - Status:', response.status);
      return { tienePatrullajeEnProgreso: false };
    }

    const result = await response.json();
    
    if (!result.success) {
      console.error('Error al verificar patrullajes:', result.error || 'Error desconocido');
      return { tienePatrullajeEnProgreso: false };
    }

    if (result.patrullaje) {
      // Transformar patrullaje al formato del frontend
      const act = result.patrullaje;
      const patrullaje: Actividad = {
        id: act.act_id.toString(),
        codigo: act.act_codigo,
        tipo: act.tipo?.tp_nombre || '',
        descripcion: act.act_descripcion,
        fecha: act.act_fechah_programacion?.split('T')[0] || '',
        horaInicio: act.act_fechah_iniciio?.split('T')[1]?.substring(0, 5) || '',
        horaFin: act.act_fechah_fin?.split('T')[1]?.substring(0, 5) || '',
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
        guardarecurso: act.usuario?.usr_id?.toString() || '',
        guardarecursoNombre: act.usuario ? `${act.usuario.usr_nombre} ${act.usuario.usr_apellido}` : '',
        estado: act.estado?.std_nombre || 'En Progreso',
        evidencias: [],
        hallazgos: [],
        areaProtegida: ''
      };
      
      return {
        tienePatrullajeEnProgreso: true,
        patrullaje,
        coordenadas: result.coordenadas || []
      };
    }

    return { tienePatrullajeEnProgreso: false };
  } catch (error) {
    console.error('Error en verificarPatrullajesEnProgreso:', error);
    return { tienePatrullajeEnProgreso: false };
  }
}

/**
 * Inicia una actividad programada
 */
export async function iniciarActividadAPI(
  actividadId: string,
  horaInicio: string,
  coordenadasInicio: { lat: number; lng: number },
  accessToken: string
): Promise<Actividad> {
  try {
    const response = await fetch(
      `${BASE_URL}/actividades/${actividadId}/iniciar`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          horaInicio,
          coordenadasInicio
        })
      }
    );

    const result = await response.json();
    
    if (!result.success) {
      console.error('Error al iniciar actividad:', result.error);
      throw new Error(result.error);
    }

    // Transformar respuesta al formato del frontend
    const act = result.actividad;
    return {
      id: act.act_id.toString(),
      codigo: act.act_codigo,
      tipo: act.tipo?.tp_nombre || '',
      descripcion: act.act_descripcion,
      fecha: act.act_fechah_programacion?.split('T')[0] || '',
      horaInicio: act.act_fechah_iniciio?.split('T')[1]?.substring(0, 5) || '',
      horaFin: act.act_fechah_fin?.split('T')[1]?.substring(0, 5) || '',
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
      guardarecurso: act.usuario?.usr_id?.toString() || '',
      guardarecursoNombre: act.usuario ? `${act.usuario.usr_nombre} ${act.usuario.usr_apellido}` : '',
      estado: act.estado?.std_nombre || 'En Progreso',
      evidencias: [],
      hallazgos: [],
      areaProtegida: ''
    };
  } catch (error) {
    console.error('Error en iniciarActividadAPI:', error);
    throw error;
  }
}

/**
 * Agregar punto de coordenada a una actividad en progreso
 */
export async function agregarCoordenadaAPI(
  actividadId: string,
  coordenada: {
    latitud: string;
    longitud: string;
    fecha: string;
    hora: string;
    descripcion?: string;
  },
  accessToken: string
): Promise<any> {
  try {
    const response = await fetch(
      `${BASE_URL}/actividades/${actividadId}/coordenadas`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(coordenada)
      }
    );

    const result = await response.json();
    
    if (!result.success) {
      console.error('Error al agregar coordenada:', result.error);
      throw new Error(result.error);
    }

    return result.coordenada;
  } catch (error) {
    console.error('Error en agregarCoordenadaAPI:', error);
    throw error;
  }
}

/**
 * Eliminar punto de coordenada
 */
export async function eliminarCoordenadaAPI(
  actividadId: string,
  coordenadaId: string,
  accessToken: string
): Promise<void> {
  try {
    const response = await fetch(
      `${BASE_URL}/actividades/${actividadId}/coordenadas/${coordenadaId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    const result = await response.json();
    
    if (!result.success) {
      console.error('Error al eliminar coordenada:', result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error en eliminarCoordenadaAPI:', error);
    throw error;
  }
}

/**
 * Agregar hallazgo a una actividad en progreso
 */
export async function agregarHallazgoAPI(
  actividadId: string,
  hallazgo: {
    titulo: string;
    descripcion: string;
    gravedad: string;
    latitud: string;
    longitud: string;
  },
  accessToken: string
): Promise<any> {
  try {
    const response = await fetch(
      `${BASE_URL}/actividades/${actividadId}/hallazgos`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(hallazgo)
      }
    );

    const result = await response.json();
    
    if (!result.success) {
      console.error('Error al agregar hallazgo:', result.error);
      throw new Error(result.error);
    }

    return result.hallazgo;
  } catch (error) {
    console.error('Error en agregarHallazgoAPI:', error);
    throw error;
  }
}

/**
 * Eliminar hallazgo
 */
export async function eliminarHallazgoAPI(
  actividadId: string,
  hallazgoId: string,
  accessToken: string
): Promise<void> {
  try {
    const response = await fetch(
      `${BASE_URL}/actividades/${actividadId}/hallazgos/${hallazgoId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    const result = await response.json();
    
    if (!result.success) {
      console.error('Error al eliminar hallazgo:', result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error en eliminarHallazgoAPI:', error);
    throw error;
  }
}

/**
 * Finaliza una actividad en progreso
 */
export async function finalizarActividadAPI(
  actividadId: string,
  horaFin: string,
  coordenadasFin: { lat: number; lng: number },
  observaciones: string,
  accessToken: string,
  hallazgos?: any[],
  evidencias?: any[],
  puntosRecorrido?: any[]
): Promise<Actividad> {
  try {
    const response = await fetch(
      `${BASE_URL}/actividades/${actividadId}/finalizar`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          horaFin,
          coordenadasFin,
          observaciones,
          hallazgos: hallazgos || [],
          evidencias: evidencias || [],
          puntosRecorrido: puntosRecorrido || []
        })
      }
    );

    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ Error del servidor al finalizar actividad:', result.error);
      console.error('Response status:', response.status);
      console.error('Response completo:', result);
      throw new Error(result.error || 'Error al finalizar la actividad');
    }

    // Transformar respuesta al formato del frontend
    const act = result.actividad;
    return {
      id: act.act_id.toString(),
      codigo: act.act_codigo,
      tipo: act.tipo?.tp_nombre || '',
      descripcion: act.act_descripcion,
      fecha: act.act_fechah_programacion?.split('T')[0] || '',
      horaInicio: act.act_fechah_iniciio?.split('T')[1]?.substring(0, 5) || '',
      horaFin: act.act_fechah_fin?.split('T')[1]?.substring(0, 5) || '',
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
      guardarecurso: act.usuario?.usr_id?.toString() || '',
      guardarecursoNombre: act.usuario ? `${act.usuario.usr_nombre} ${act.usuario.usr_apellido}` : '',
      estado: act.estado?.std_nombre || 'Completada',
      evidencias: [],
      hallazgos: [],
      areaProtegida: ''
    };
  } catch (error) {
    console.error('Error en finalizarActividadAPI:', error);
    throw error;
  }
}
