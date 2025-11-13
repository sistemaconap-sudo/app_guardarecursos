import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Search, Route, Navigation, Eye, Calendar, User, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Actividad, Guardarecurso } from '../types';
import { motion } from 'motion/react';
import { GoogleMap, Marker, Polyline } from '@react-google-maps/api';
import { useGoogleMaps } from '../hooks/useGoogleMaps';

// ⚠️ NOTA: Google Maps Marker está deprecated desde Feb 2024, pero seguirá funcionando
// por al menos 12 meses. La librería @react-google-maps/api aún no soporta AdvancedMarkerElement.
// Este warning se puede ignorar de forma segura por ahora.
// Ref: https://developers.google.com/maps/documentation/javascript/advanced-markers/migration

import { 
  filterStyles, 
  listCardStyles, 
  formStyles, 
  buttonStyles,
  badgeStyles,
  layoutStyles,
  animationStyles,
  getActividadTopLineColor 
} from '../styles/shared-styles';
import { geolocalizacionService } from '../utils/geolocalizacionService';
import { guardarecursosService } from '../utils/guardarecursosService';
import { areasProtegidasService } from '../utils/areasProtegidasService';
import { authService } from '../utils/authService';
import { Alert, AlertDescription } from './ui/alert';
import { forceLogout } from '../utils/base-api-service';
import { generarReportePDF } from '../utils/reportePatrullajesHelpers';
import { conapLogo } from '../src/logo';
import { toast } from 'sonner@2.0.3';

// ============================================================================
// COMPONENTES MEMOIZADOS INTERNOS - Optimización de re-renders
// ============================================================================

const LoadingState = memo(() => (
  <Card className="border-0 shadow-lg">
    <CardContent className="p-8 sm:p-12">
      <div className="text-center">
        <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-muted-foreground animate-spin" />
        <h3 className="mb-2 text-sm sm:text-base">Cargando rutas...</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Obteniendo datos de geolocalización desde la base de datos
        </p>
      </div>
    </CardContent>
  </Card>
));
LoadingState.displayName = 'LoadingState';

interface EmptyStateProps {
  searchTerm: string;
  onClearSearch: () => void;
}

const EmptyState = memo(({ searchTerm, onClearSearch }: EmptyStateProps) => (
  <Card className="border-0 shadow-lg">
    <CardContent className="p-8 sm:p-12">
      <div className="text-center">
        <Route className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-30" />
        <h3 className="mb-2 text-sm sm:text-base">No hay rutas disponibles</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4">
          {searchTerm 
            ? 'No se encontraron rutas que coincidan con tu búsqueda'
            : 'No hay rutas de patrullaje completadas en el sistema'}
        </p>
        {searchTerm && (
          <Button 
            variant="outline" 
            onClick={onClearSearch}
          >
            Limpiar búsqueda
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
));
EmptyState.displayName = 'EmptyState';

interface GeolocalizacionRutasProps {
  userPermissions: {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
  currentUser?: any;
}

export function GeolocalizacionRutas({ userPermissions, currentUser }: GeolocalizacionRutasProps) {
  // Cargar Google Maps API
  const { isLoaded: isGoogleMapsLoaded } = useGoogleMaps();

  const [rutas, setRutas] = useState<Actividad[]>([]);
  const [guardarecursos, setGuardarecursos] = useState<Guardarecurso[]>([]);
  const [areasProtegidas, setAreasProtegidas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRuta, setSelectedRuta] = useState<Actividad | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para el reporte
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportGuardarecurso, setReportGuardarecurso] = useState('');
  const [reportFechaInicio, setReportFechaInicio] = useState('');
  const [reportFechaFin, setReportFechaFin] = useState('');

  // Determinar si el usuario actual es un guardarecurso - MEMOIZADO
  const isGuardarecurso = useMemo(() => currentUser?.rol === 'Guardarecurso', [currentUser?.rol]);
  const currentGuardarecursoId = useMemo(() => isGuardarecurso ? currentUser?.id : null, [isGuardarecurso, currentUser?.id]);

  // Filtrar solo guardarecursos ACTIVOS y ordenar alfabéticamente - MEMOIZADO
  const guardarecursosOrdenados = useMemo(() => {
    return [...guardarecursos]
      .filter(g => g.estado === 'Activo')
      .sort((a, b) => {
        const nombreA = `${a.nombre} ${a.apellido}`;
        const nombreB = `${b.nombre} ${b.apellido}`;
        return nombreA.localeCompare(nombreB, 'es');
      });
  }, [guardarecursos]);

  // Cargar rutas y guardarecursos desde la base de datos - MEMOIZADO
  const loadData = useCallback(async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = authService.getCurrentToken();
        if (!token) {
          setError('No hay sesión activa');
          setIsLoading(false);
          return;
        }

        // Cargar guardarecursos
        const guardarecursosData = await guardarecursosService.fetchGuardarecursos(token);
        setGuardarecursos(guardarecursosData);

        // Cargar áreas protegidas (usa getRequiredAuthToken() internamente)
        const areasData = await areasProtegidasService.fetchAreas();
        setAreasProtegidas(areasData);

        // Cargar rutas (si es guardarecurso, filtrar por su ID)
        const filters = isGuardarecurso && currentGuardarecursoId 
          ? { guardarecurso: currentGuardarecursoId }
          : undefined;
        
        const rutasData = await geolocalizacionService.fetchRutas(token, filters);
        setRutas(rutasData);

      } catch (err) {
        console.error('❌ ERROR AL CARGAR GEOLOCALIZACIÓN - FORZANDO LOGOUT:', err);
        forceLogout();
      } finally {
        setIsLoading(false);
      }
  }, [isGuardarecurso, currentGuardarecursoId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrar y ordenar rutas por término de búsqueda
  const rutasCompletadas = useMemo(() => {
    let rutasFiltradas = searchTerm 
      ? rutas.filter(ruta =>
          ruta.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ruta.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : rutas;
    
    // Ordenar de más reciente a más antigua por fecha de finalización
    return rutasFiltradas.sort((a, b) => {
      const dateA = new Date(`${a.fecha}T${a.horaFin || '23:59'}`);
      const dateB = new Date(`${b.fecha}T${b.horaFin || '23:59'}`);
      return dateB.getTime() - dateA.getTime(); // Orden descendente (más reciente primero)
    });
  }, [rutas, searchTerm]);

  // Handlers - MEMOIZADOS
  const handleViewRuta = useCallback((actividad: Actividad) => {
    setSelectedRuta(actividad);
    setIsViewDialogOpen(true);
  }, []);

  const handleGenerarReporte = useCallback(async () => {
    // Validar parámetros usando el servicio
    const validacion = geolocalizacionService.validarParametrosReporte({
      guardarecurso: reportGuardarecurso,
      fechaInicio: reportFechaInicio,
      fechaFin: reportFechaFin
    });
    
    if (!validacion.valido) {
      alert(validacion.mensaje);
      return;
    }
    
    // Filtrar rutas usando el servicio
    const rutasParaReporte = geolocalizacionService.filtrarRutasParaReporte(
      rutasCompletadas,
      {
        guardarecurso: reportGuardarecurso,
        fechaInicio: reportFechaInicio,
        fechaFin: reportFechaFin
      }
    );

    try {
      // Generar PDF con el diseño oficial usando áreas protegidas reales de la BD
      // conapLogo ya viene en Base64 desde la importación, no necesita conversión
      await generarReportePDF(
        rutasParaReporte,
        guardarecursos,
        areasProtegidas, // Usar áreas protegidas reales cargadas de la BD
        reportGuardarecurso,
        reportFechaInicio,
        reportFechaFin,
        conapLogo // Usar directamente el logo (ya está en Base64)
      );
      
      // Mostrar mensaje de éxito
      toast.success('Reporte generado', {
        description: 'El reporte PDF se ha descargado correctamente.'
      });
    } catch (error) {
      console.error('❌ Error al generar PDF:', error);
      
      // Mostrar mensaje de error más descriptivo
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'No se pudo generar el PDF. Intenta de nuevo.';
      
      toast.error('Error al generar reporte', {
        description: errorMessage
      });
    }
    
    // Cerrar el diálogo
    setIsReportDialogOpen(false);
  }, [rutasCompletadas, guardarecursos, areasProtegidas, reportGuardarecurso, reportFechaInicio, reportFechaFin]);

  // Calcular estadísticas usando el servicio - MEMOIZADO
  const estadisticas = useMemo(() => {
    return geolocalizacionService.calcularEstadisticasRutas(rutasCompletadas);
  }, [rutasCompletadas]);

  // Crear mapa de guardarecursos para búsqueda O(1) - OPTIMIZADO
  const guardarecursosMap = useMemo(() => {
    const map: Record<string, Guardarecurso> = {};
    guardarecursos.forEach(g => {
      map[g.id] = g;
    });
    return map;
  }, [guardarecursos]);

  // Función de renderizado memoizada
  const renderRutaCard = useCallback((actividad: Actividad, index: number) => {
    const guardarecurso = guardarecursosMap[actividad.guardarecurso];
    const nombreGuardarecurso = (actividad as any).guardarecursoNombre || 
      (guardarecurso ? `${guardarecurso.nombre} ${guardarecurso.apellido}` : 'Sin asignar');
    
    return (
      <motion.div
        key={actividad.id}
        {...animationStyles.cardMotion(index)}
      >
        <Card className={`${listCardStyles.card} relative overflow-hidden`}>
          {/* Línea decorativa superior VERDE (actividad completada) */}
          <div className={getActividadTopLineColor(actividad.estado)} />
          
          <CardContent className={listCardStyles.content}>
            {/* Header con título y badge */}
            <div className={listCardStyles.header}>
              <div className={listCardStyles.headerContent}>
                <h3 className={listCardStyles.title}>
                  {actividad.descripcion}
                </h3>
                <Badge className={badgeStyles.estado.completada}>
                  Completada
                </Badge>
              </div>
            </div>

            {/* Información de la ruta */}
            <div className={listCardStyles.infoSection}>
              {/* Fecha usando el servicio */}
              <div className={listCardStyles.infoItem}>
                <Calendar className={listCardStyles.infoIcon} />
                <div className={listCardStyles.infoText}>
                  <div>{geolocalizacionService.formatearFechaRuta(actividad.fecha)}</div>
                </div>
              </div>

              {/* Guardarecurso */}
              {!isGuardarecurso && (
                <div className={listCardStyles.infoItem}>
                  <User className={listCardStyles.infoIcon} />
                  <div className={listCardStyles.infoText}>
                    <div>{nombreGuardarecurso}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Botón de ver detalles */}
            <Button
              size="sm"
              variant="outline"
              className={buttonStyles.outlineFull}
              onClick={() => handleViewRuta(actividad)}
            >
              <Eye className="h-4 w-4 mr-1.5" />
              Ver Ruta Completa
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }, [guardarecursosMap, isGuardarecurso, handleViewRuta]);

  // Handler para limpiar búsqueda - MEMOIZADO
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Búsqueda - Diseño Minimalista sin filtros */}
      <div className={filterStyles.filterGroupNoBorder}>
        {/* Búsqueda */}
        <div className={filterStyles.searchContainer}>
          <div className={filterStyles.searchContainerWrapper}>
            <Search className={filterStyles.searchIcon} />
            <Input
              placeholder="Buscar rutas por descripción o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={filterStyles.searchInput}
            />
          </div>
        </div>
        
        {/* Botón de Generar Reporte */}
        <Button
          variant="outline"
          onClick={() => setIsReportDialogOpen(true)}
          className={buttonStyles.bulkUploadButton}
        >
          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
          Generar Reporte
        </Button>
      </div>

      {/* Grid principal: Rutas */}
      <div className="grid grid-cols-1 gap-4">
        {/* Grid de rutas */}
        <div>
          {isLoading ? (
            <LoadingState />
          ) : rutasCompletadas.length === 0 ? (
            <EmptyState searchTerm={searchTerm} onClearSearch={handleClearSearch} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {rutasCompletadas.map((actividad, index) => renderRutaCard(actividad, index))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog de detalles con visualización de ruta */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className={formStyles.dialogContentLarge}>
          <DialogHeader className={formStyles.dialogHeader}>
            <DialogTitle className={formStyles.dialogTitle}>
              Detalles de Ruta de Patrullaje
            </DialogTitle>
            <DialogDescription className={formStyles.dialogDescription}>
              Información detallada y visualización GPS de la ruta completada
            </DialogDescription>
          </DialogHeader>
          
          {selectedRuta && (() => {
            const guardarecurso = guardarecursos.find(g => g.id === selectedRuta.guardarecurso);
            const nombreGuardarecurso = (selectedRuta as any).guardarecursoNombre || 
              (guardarecurso ? `${guardarecurso.nombre} ${guardarecurso.apellido}` : 'Sin asignar');
            
            return (
              <div className={formStyles.form}>
                {/* Información general en grid */}
                <div className={formStyles.grid}>
                  {/* Descripción */}
                  <div className={formStyles.field}>
                    <Label className={formStyles.label}>Descripción</Label>
                    <p className={formStyles.readOnlyValue}>{selectedRuta.descripcion}</p>
                  </div>

                  {/* Estado */}
                  <div className={formStyles.field}>
                    <Label className={formStyles.label}>Estado</Label>
                    <div className="mt-1">
                      <Badge className={badgeStyles.estado.completada}>
                        Completada
                      </Badge>
                    </div>
                  </div>

                  {/* Fecha usando el servicio */}
                  <div className={formStyles.field}>
                    <Label className={formStyles.label}>Fecha</Label>
                    <p className={formStyles.readOnlyValue}>
                      {geolocalizacionService.formatearFechaRutaCompleta(selectedRuta.fecha)}
                    </p>
                  </div>

                  {/* Guardarecurso */}
                  <div className={formStyles.field}>
                    <Label className={formStyles.label}>Usuario</Label>
                    <p className={formStyles.readOnlyValue}>
                      {nombreGuardarecurso}
                    </p>
                  </div>
                </div>

              {/* Mapa de la ruta */}
              {geolocalizacionService.tieneGPS(selectedRuta) ? (
                <div className={formStyles.section}>
                  <div className="mb-3">
                    <Label className={formStyles.sectionTitle}>
                      <Navigation className="h-4 w-4 text-green-600 dark:text-green-400 inline-block mr-2" />
                      Visualización de Ruta GPS
                    </Label>
                  </div>
                  
                  {/* Mapa de Google Maps con la ruta completa */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900/50">
                    {isGoogleMapsLoaded ? (() => {
                      // Construir puntos completos: inicio + intermedios + fin
                      const puntosCompletos = geolocalizacionService.construirPuntosCompletos(selectedRuta);
                      
                      if (puntosCompletos.length === 0) {
                        return (
                          <div className="h-[400px] flex items-center justify-center">
                            <div className="text-center text-gray-500 dark:text-gray-400">
                              <Navigation className="h-12 w-12 mx-auto mb-2 opacity-30" />
                              <p className="text-sm">Sin datos GPS</p>
                            </div>
                          </div>
                        );
                      }

                      // Calcular el centro del mapa (punto medio entre inicio y fin)
                      const center = {
                        lat: (puntosCompletos[0].lat + puntosCompletos[puntosCompletos.length - 1].lat) / 2,
                        lng: (puntosCompletos[0].lng + puntosCompletos[puntosCompletos.length - 1].lng) / 2,
                      };

                      // Crear la ruta para la polilínea
                      const rutaPath = puntosCompletos.map(punto => ({ lat: punto.lat, lng: punto.lng }));

                      return (
                        <>
                          <GoogleMap
                            mapContainerStyle={{ width: '100%', height: '400px' }}
                            center={center}
                            zoom={12}
                            onLoad={(map) => {
                              // Ajustar el mapa para que se vea toda la ruta
                              const bounds = new window.google.maps.LatLngBounds();
                              puntosCompletos.forEach(punto => {
                                bounds.extend({ lat: punto.lat, lng: punto.lng });
                              });
                              map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
                            }}
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
                            {/* Polilínea de la ruta */}
                            <Polyline
                              path={rutaPath}
                              options={{
                                strokeColor: '#3b82f6',
                                strokeOpacity: 1,
                                strokeWeight: 3,
                              }}
                            />

                            {/* Marcadores para cada punto */}
                            {puntosCompletos.map((punto, index) => {
                              const esInicio = index === 0;
                              const esFin = index === puntosCompletos.length - 1;
                              const esIntermedio = !esInicio && !esFin;

                              return (
                                <Marker
                                  key={index}
                                  position={{ lat: punto.lat, lng: punto.lng }}
                                  icon={{
                                    path: window.google.maps.SymbolPath.CIRCLE,
                                    fillColor: esInicio ? '#10b981' : esFin ? '#ef4444' : '#3b82f6',
                                    fillOpacity: 1,
                                    strokeColor: '#ffffff',
                                    strokeWeight: 2,
                                    scale: esInicio || esFin ? 10 : 6,
                                  }}
                                  label={
                                    esInicio
                                      ? { text: 'Inicio', color: '#065f46', fontSize: '11px', fontWeight: 'bold' }
                                      : esFin
                                      ? { text: 'Fin', color: '#991b1b', fontSize: '11px', fontWeight: 'bold' }
                                      : undefined
                                  }
                                />
                              );
                            })}
                          </GoogleMap>

                          {/* Leyenda minimalista */}
                          <div className="flex items-center justify-center gap-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                              Punto Inicial
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                              <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                              Recorrido
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                              Punto Final
                            </div>
                          </div>
                        </>
                      );
                    })() : (
                      <div className="h-[400px] flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 dark:border-green-400 mx-auto mb-2"></div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Cargando mapa...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Estadísticas usando cálculos reales */}
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="flex flex-col items-center p-2.5 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-2xl text-gray-900 dark:text-gray-100 mb-0.5">
                        {(() => {
                          const puntosCompletos = geolocalizacionService.construirPuntosCompletos(selectedRuta);
                          return puntosCompletos.length;
                        })()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Puntos GPS</p>
                    </div>
                    
                    <div className="flex flex-col items-center p-2.5 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-2xl text-gray-900 dark:text-gray-100 mb-0.5">
                        {(() => {
                          const duracion = geolocalizacionService.calcularDuracionReal(
                            selectedRuta.fechaHoraInicio,
                            selectedRuta.fechaHoraFin
                          );
                          return duracion !== null ? `${duracion}` : '0';
                        })()} min
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Duración</p>
                    </div>
                    
                    <div className="flex flex-col items-center p-2.5 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-2xl text-gray-900 dark:text-gray-100 mb-0.5">
                        {(() => {
                          const distancia = geolocalizacionService.calcularDistanciaHaversine(
                            selectedRuta.coordenadasInicio?.lat,
                            selectedRuta.coordenadasInicio?.lng,
                            selectedRuta.coordenadasFin?.lat,
                            selectedRuta.coordenadasFin?.lng
                          );
                          return distancia !== null ? distancia : '0.0';
                        })()} km
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Distancia</p>
                    </div>
                  </div>
                </div>
              ) : (
                <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Navigation className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      <div>
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">Sin datos GPS</p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          Esta ruta no tiene información de geolocalización registrada
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Observaciones */}
              {selectedRuta.observaciones && (
                <div className={formStyles.field}>
                  <Label className={formStyles.label}>Observaciones</Label>
                  <Card className="mt-2 border-gray-200 dark:border-gray-700">
                    <CardContent className="p-3">
                      <p className="text-sm">{selectedRuta.observaciones}</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Footer con botón de cerrar */}
              <div className={formStyles.footer}>
                <Button
                  variant="outline"
                  className={formStyles.cancelButton}
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Dialog para generar reporte */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className={formStyles.dialogContent}>
          <DialogHeader className={formStyles.dialogHeader}>
            <DialogTitle className={formStyles.dialogTitle}>
              Generar Reporte de Rutas
            </DialogTitle>
            <DialogDescription className={formStyles.dialogDescription}>
              Configure los parámetros para generar el reporte de geolocalización
            </DialogDescription>
          </DialogHeader>

          <div className={formStyles.form}>
            {/* Selección de Guardarecurso */}
            <div className={formStyles.field}>
              <Label className={formStyles.label}>Guardarecurso *</Label>
              <Select value={reportGuardarecurso} onValueChange={setReportGuardarecurso}>
                <SelectTrigger className={formStyles.input}>
                  <SelectValue placeholder="Seleccionar guardarecurso" />
                </SelectTrigger>
                <SelectContent>
                  {guardarecursosOrdenados.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.nombre} {g.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rango de Fechas */}
            <div className={formStyles.grid}>
              <div className={formStyles.field}>
                <Label className={formStyles.label}>Fecha Inicio</Label>
                <Input
                  type="date"
                  value={reportFechaInicio}
                  onChange={(e) => setReportFechaInicio(e.target.value)}
                  className={formStyles.input}
                />
              </div>

              <div className={formStyles.field}>
                <Label className={formStyles.label}>Fecha Fin</Label>
                <Input
                  type="date"
                  value={reportFechaFin}
                  onChange={(e) => setReportFechaFin(e.target.value)}
                  className={formStyles.input}
                />
              </div>
            </div>

            {/* Footer con botones */}
            <div className={formStyles.footer}>
              <Button
                variant="outline"
                className={formStyles.cancelButton}
                onClick={() => setIsReportDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className={formStyles.submitButton}
                onClick={handleGenerarReporte}
                disabled={!reportGuardarecurso}
              >
                <FileText className="h-4 w-4 mr-2" />
                Generar Reporte
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}