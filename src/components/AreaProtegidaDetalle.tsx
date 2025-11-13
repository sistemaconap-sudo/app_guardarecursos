import { AreaProtegida } from '../types';
import { Card, CardContent } from './ui/card';
import { MapPin, Leaf, TreePine } from 'lucide-react';
import { motion } from 'motion/react';
import { cardStyles, textStyles, areaDetalleStyles } from '../styles/shared-styles';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from '../hooks/useGoogleMaps';

// ⚠️ NOTA: Google Maps Marker está deprecated desde Feb 2024, pero seguirá funcionando
// por al menos 12 meses. La librería @react-google-maps/api aún no soporta AdvancedMarkerElement.
// Este warning se puede ignorar de forma segura por ahora.
// Ref: https://developers.google.com/maps/documentation/javascript/advanced-markers/migration

interface AreaProtegidaDetalleProps {
  area: AreaProtegida | null;
  isSimplified?: boolean;
  allAreas?: AreaProtegida[];
}

export function AreaProtegidaDetalle({ area, isSimplified = false, allAreas = [] }: AreaProtegidaDetalleProps) {
  // Cargar Google Maps API usando hook compartido
  const { isLoaded } = useGoogleMaps();

  if (!area) {
    return null;
  }

  // Configuración del mapa centrado en el área
  const mapContainerStyle = { width: '100%', height: '100%' };
  const center = { lat: area.coordenadas.lat, lng: area.coordenadas.lng };

  return (
    <div className={areaDetalleStyles.container}>
      {/* Título minimalista */}
      <motion.div 
        className={areaDetalleStyles.title}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className={areaDetalleStyles.titleText}>{area.nombre}</h2>
      </motion.div>

      {/* Descripción minimalista */}
      <motion.p
        className={`${textStyles.muted} ${areaDetalleStyles.description}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {area.descripcion}
      </motion.p>

      {/* Grid: Mapa decorativo + Cards de información */}
      <div className={areaDetalleStyles.grid}>
        {/* Mapa de Google Maps */}
        <motion.div 
          className={areaDetalleStyles.mapContainer}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={12}
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
              <Marker
                position={center}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  fillColor: '#dc2626',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 3,
                  scale: 12,
                }}
                title={area.nombre}
              />
            </GoogleMap>
          ) : (
            <div className="flex items-center justify-center h-full bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 dark:border-green-400 mx-auto mb-2"></div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Cargando mapa...</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Columna de información */}
        <motion.div 
          className={areaDetalleStyles.infoColumn}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Ubicación */}
          <Card className={areaDetalleStyles.infoCard}>
            <div className={areaDetalleStyles.infoCardHeaderBlue}>
              <div className={areaDetalleStyles.infoCardHeaderContent}>
                <MapPin className={areaDetalleStyles.infoCardHeaderIcon} />
                <span className={areaDetalleStyles.infoCardHeaderText}>Ubicación</span>
              </div>
            </div>
            <CardContent className={areaDetalleStyles.infoCardContent}>
              <p className={textStyles.primaryDark}>{area.departamento}</p>
            </CardContent>
          </Card>

          {/* Extensión */}
          <Card className={areaDetalleStyles.infoCard}>
            <div className={areaDetalleStyles.infoCardHeaderGreen}>
              <div className={areaDetalleStyles.infoCardHeaderContent}>
                <Leaf className={areaDetalleStyles.infoCardHeaderIcon} />
                <span className={areaDetalleStyles.infoCardHeaderText}>Extensión</span>
              </div>
            </div>
            <CardContent className={areaDetalleStyles.infoCardContent}>
              <p className={textStyles.primaryDark}>
                {area.extension.toLocaleString()} hectáreas
              </p>
            </CardContent>
          </Card>

          {/* Ecosistema Principal */}
          {area.ecosistemas && area.ecosistemas.length > 0 && (
            <Card className={areaDetalleStyles.infoCard}>
              <div className={areaDetalleStyles.infoCardHeaderCyan}>
                <div className={areaDetalleStyles.infoCardHeaderContent}>
                  <TreePine className={areaDetalleStyles.infoCardHeaderIcon} />
                  <span className={areaDetalleStyles.infoCardHeaderText}>Ecosistema Principal</span>
                </div>
              </div>
              <CardContent className={areaDetalleStyles.infoCardContent}>
                <p className={textStyles.primaryDark}>{area.ecosistemas[0]}</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}