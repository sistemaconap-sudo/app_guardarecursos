import { useState } from 'react';
import { AreaProtegida } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MapPin } from 'lucide-react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from '../hooks/useGoogleMaps';

// ⚠️ NOTA: Google Maps Marker está deprecated desde Feb 2024, pero seguirá funcionando
// por al menos 12 meses. La librería @react-google-maps/api aún no soporta AdvancedMarkerElement.
// Este warning se puede ignorar de forma segura por ahora.
// Ref: https://developers.google.com/maps/documentation/javascript/advanced-markers/migration

// Definición de las propiedades del componente
interface MapaAreasProtegidasProps {
  areas: AreaProtegida[];
  onAreaSelect: (area: AreaProtegida) => void;
  selectedAreaId?: string | null;
  title?: string;
  className?: string;
  showLegend?: boolean;
  centered?: boolean;
}

// Ubicación central del mapa (Guatemala)
const center = { lat: 15.7835, lng: -90.2308 };

// Tamaño del contenedor del mapa
const mapContainerStyle = { width: '100%', height: '100%' };

/**
 * Componente de mapa de Google Maps para visualizar áreas protegidas de Guatemala.
 * Utiliza Google Maps API para mostrar marcadores interactivos.
 * 
 * @param areas - Array de áreas protegidas a mostrar en el mapa
 * @param onAreaSelect - Callback cuando se selecciona un área
 * @param selectedAreaId - ID del área actualmente seleccionada
 * @param title - Título personalizado del mapa (opcional)
 * @param className - Clases CSS adicionales (opcional)
 * @param showLegend - Mostrar leyenda (no aplicable en Google Maps, mantenido por compatibilidad)
 * @param centered - Si está centrado en un área específica (ajusta zoom automáticamente)
 */
export function MapaAreasProtegidas({
  areas,
  onAreaSelect,
  selectedAreaId,
  title,
  className = '',
  showLegend = true,
  centered = false
}: MapaAreasProtegidasProps) {
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);

  // Cargar Google Maps API
  const { isLoaded } = useGoogleMaps();

  // Calcular centro y zoom dinámicamente si hay áreas y está centrado
  const mapCenter = centered && areas.length === 1 
    ? { lat: areas[0].coordenadas.lat, lng: areas[0].coordenadas.lng }
    : center;
  
  const mapZoom = centered && areas.length === 1 ? 12 : 8;

  return (
    <Card className={`h-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col overflow-hidden ${className}`}>
      {title && (
        <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base md:text-lg">
            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span className="truncate">{title}</span>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="flex-1 relative p-2 sm:p-3 md:p-4 min-h-[400px]">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={mapZoom}
            options={{ 
              mapTypeControl: false, 
              streetViewControl: false,
              fullscreenControl: false,
              zoomControl: true,
              styles: [
                {
                  featureType: 'poi',
                  elementType: 'labels',
                  stylers: [{ visibility: 'off' }]
                }
              ]
            }}
          >
            {areas.map((area) => (
              <Marker
                key={area.id}
                position={{ lat: area.coordenadas.lat, lng: area.coordenadas.lng }}
                onClick={() => onAreaSelect(area)}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  fillColor: selectedAreaId === area.id ? '#fa9715ff' : '#0a9605ff',
                  fillOpacity: 1,
                  strokeColor: '#fff700ff',
                  strokeWeight: 2,
                  scale: centered ? 10 : 7,
                }}
                onMouseOver={() => setHoveredArea(area.id)}
                onMouseOut={() => setHoveredArea(null)}
                title={area.nombre}
              />
            ))}
          </GoogleMap>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 dark:border-green-400 mx-auto mb-3"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Cargando mapa...</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}