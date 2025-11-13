/**
 * Utilidades de formateo compartidas
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * 🇬🇹 Funciones de fecha/hora para Guatemala (GMT-6)
 * Guatemala no usa horario de verano, siempre está en GMT-6
 */

/**
 * Obtiene la fecha actual en horario de Guatemala (GMT-6)
 * 
 * @returns Fecha actual en formato YYYY-MM-DD según horario de Guatemala
 * 
 * @example
 * const fechaHoy = getGuatemalaDate();
 * console.log(fechaHoy); // "2024-11-07"
 */
export function getGuatemalaDate(): string {
  const ahora = new Date();
  // Convertir a hora de Guatemala (UTC-6)
  const guatemalaTime = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Guatemala' }));
  
  const year = guatemalaTime.getFullYear();
  const month = String(guatemalaTime.getMonth() + 1).padStart(2, '0');
  const day = String(guatemalaTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`; // YYYY-MM-DD
}

/**
 * Obtiene la fecha y hora actual en horario de Guatemala (GMT-6)
 * 
 * @returns Objeto Date ajustado al horario de Guatemala
 */
export function getGuatemalaDateTime(): Date {
  const ahora = new Date();
  // Convertir a hora de Guatemala (UTC-6)
  return new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Guatemala' }));
}

/**
 * Parsea una fecha en formato YYYY-MM-DD como fecha local (sin conversión de zona horaria)
 * 
 * @param dateString - Fecha en formato YYYY-MM-DD
 * @returns Objeto Date en zona horaria local
 * 
 * @example
 * const fecha = parseLocalDate('2025-11-06');
 * // Retorna fecha del 6 de noviembre sin ajustes de zona horaria
 */
export function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date();
  
  // Si ya incluye hora, parsear normalmente
  if (dateString.includes('T') || dateString.includes(' ')) {
    return new Date(dateString);
  }
  
  // Para fechas en formato YYYY-MM-DD, parsear como fecha local
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formatea una fecha a formato legible en español
 */
export function formatDate(dateString: string, formatStr: string = "d 'de' MMMM, yyyy"): string {
  try {
    const date = parseLocalDate(dateString);
    return format(date, formatStr, { locale: es });
  } catch {
    return 'Fecha inválida';
  }
}

/**
 * Formatea una fecha con hora
 */
export function formatDateTime(dateString: string): string {
  return formatDate(dateString, "d 'de' MMMM, yyyy 'a las' HH:mm");
}

/**
 * Formatea coordenadas a string legible
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

/**
 * Formatea un nombre completo
 */
export function formatFullName(nombre: string, apellido: string): string {
  return `${nombre} ${apellido}`;
}

/**
 * Capitaliza la primera letra de cada palabra
 */
export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Trunca un texto a una longitud máxima
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Genera un ID único simple
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
