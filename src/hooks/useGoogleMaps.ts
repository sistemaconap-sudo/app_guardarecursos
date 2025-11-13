import { useJsApiLoader } from '@react-google-maps/api';

/**
 * Hook personalizado para cargar Google Maps API
 * Se carga UNA SOLA VEZ en toda la aplicación
 * Esto evita el warning: "Google Maps already loaded outside @googlemaps/js-api-loader"
 */

// Estado global para rastrear si ya se está cargando o se cargó Google Maps
let isLoadingGlobal = false;
let isLoadedGlobal = false;

// Configuración compartida para todos los componentes
const GOOGLE_MAPS_CONFIG = {
  googleMapsApiKey: 'AIzaSyC1XVfrE8CmVg3nhd-6Sps087JmARuSNWc',
  // Usar un ID único para evitar cargas múltiples
  id: 'google-map-script-conap-unique',
  // Prevenir cargas duplicadas
  preventGoogleFontsLoading: true,
};

/**
 * Hook que retorna el estado de carga de Google Maps
 * Todos los componentes deben usar este hook en lugar de useJsApiLoader directamente
 */
export function useGoogleMaps() {
  // Solo cargar si aún no se ha cargado
  const { isLoaded, loadError } = useJsApiLoader(GOOGLE_MAPS_CONFIG);
  
  // Actualizar estado global
  if (isLoaded) {
    isLoadedGlobal = true;
  }
  
  return { isLoaded, loadError };
}