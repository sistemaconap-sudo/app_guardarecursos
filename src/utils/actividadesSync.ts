/**
 * Sistema de sincronización de actividades
 * Mantiene un estado compartido de actividades entre componentes usando patrón Observer
 * Optimizado para evitar renders innecesarios
 */

import type { Actividad } from '../types';

type Listener = (actividades: Actividad[]) => void;

class ActividadesSync {
  private actividades: Actividad[] = [];
  private listeners: Set<Listener> = new Set();

  /**
   * Actualizar todas las actividades
   */
  updateActividades(actividades: Actividad[]) {
    this.actividades = actividades;
    this.notifyListeners();
  }

  /**
   * Obtener todas las actividades (copia para evitar mutaciones)
   */
  getActividades(): Actividad[] {
    return [...this.actividades];
  }

  /**
   * Agregar una actividad nueva
   */
  addActividad(actividad: Actividad) {
    this.actividades = [...this.actividades, actividad];
    this.notifyListeners();
  }

  /**
   * Actualizar una actividad específica por ID
   */
  updateActividad(id: string, updates: Partial<Actividad>) {
    const index = this.actividades.findIndex(act => act.id === id);
    if (index === -1) return; // No existe, no hacer nada
    
    this.actividades = [
      ...this.actividades.slice(0, index),
      { ...this.actividades[index], ...updates },
      ...this.actividades.slice(index + 1)
    ];
    this.notifyListeners();
  }

  /**
   * Eliminar una actividad por ID
   */
  deleteActividad(id: string) {
    this.actividades = this.actividades.filter(act => act.id !== id);
    this.notifyListeners();
  }

  /**
   * Suscribirse a cambios en las actividades
   * Retorna función de limpieza para desuscribirse
   */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Enviar estado actual inmediatamente al suscribirse
    listener([...this.actividades]);
    
    // Retornar función para desuscribirse
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notificar a todos los listeners de cambios
   * Envía una copia para evitar mutaciones
   */
  private notifyListeners() {
    const snapshot = [...this.actividades];
    this.listeners.forEach(listener => listener(snapshot));
  }

  /**
   * Limpiar todos los listeners (útil para testing o cleanup)
   */
  clearListeners() {
    this.listeners.clear();
  }

  /**
   * Obtener número de listeners activos
   */
  getListenerCount(): number {
    return this.listeners.size;
  }
}

// Exportar instancia única (singleton pattern)
export const actividadesSync = new ActividadesSync();
