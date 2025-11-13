import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapaAreasProtegidas } from './MapaAreasProtegidas';
import { AreaProtegidaDetalle } from './AreaProtegidaDetalle';
import { Card, CardContent } from './ui/card';
import { AreaProtegida } from '../types';
import { 
  Users, 
  Activity, 
  Globe,
  Target,
  X,
  Loader2,
  AlertCircle,
  LucideIcon
} from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { cardStyles, layoutStyles } from '../styles/shared-styles';
import { dashboardService, DashboardEstadisticas, EstadisticaCard } from '../utils/dashboardService';
import { forceLogout } from '../utils/base-api-service';

interface DashboardProps {
  onNavigate?: (section: string) => void;
  currentUser?: any;
}

// ===== COMPONENTES MEMOIZADOS =====

/**
 * Componente memoizado para tarjetas de estadísticas
 * Solo se re-renderiza si cambian sus props específicas
 */
interface StatCardProps {
  stat: EstadisticaCard;
  Icon: LucideIcon;
  index: number;
  onNavigate?: (section: string) => void;
  isMobile?: boolean;
}

const StatCard = memo(({ stat, Icon, index, onNavigate, isMobile }: StatCardProps) => {
  const handleClick = useCallback(() => {
    onNavigate?.(stat.section);
  }, [onNavigate, stat.section]);

  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <Card 
          onClick={handleClick}
          className={`${stat.gradient} ${stat.border} shadow-sm cursor-pointer transition-all duration-300 hover:shadow-md active:scale-95`}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2">
              <Icon className={`h-7 w-7 sm:h-9 sm:w-9 ${stat.iconColor}`} />
              <div className="text-center">
                <p className={`text-2xl sm:text-3xl ${stat.textColor} mb-0.5 sm:mb-1`}>{stat.value}</p>
                <p className={`text-[10px] ${stat.textColor} opacity-70`}>{stat.title}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card 
        onClick={handleClick}
        className={`${stat.gradient} ${stat.border} ${cardStyles.dashboardCard} h-full flex flex-col`}
      >
        <CardContent className="p-4 flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <Icon className={`h-9 w-9 ${stat.iconColor}`} />
            <div className="text-center">
              <p className={`text-3xl ${stat.textColor} mb-1`}>{stat.value}</p>
              <p className={`text-[10px] ${stat.textColor} opacity-70 leading-tight`}>{stat.title}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

StatCard.displayName = 'StatCard';

// ===== COMPONENTE PRINCIPAL =====

export function Dashboard({ onNavigate, currentUser }: DashboardProps) {
  const [selectedArea, setSelectedArea] = useState<AreaProtegida | null>(null);
  const [areas, setAreas] = useState<AreaProtegida[]>([]);
  const [estadisticas, setEstadisticas] = useState<DashboardEstadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carga todos los datos del dashboard desde Supabase
   * Memoizado para evitar recreación en cada render
   * 🔒 SEGURIDAD: Si hay error, fuerza logout
   */
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Hacer ambas peticiones en paralelo para mejor rendimiento
      const [statsData, areasData] = await Promise.all([
        dashboardService.fetchDashboardStats(),
        dashboardService.fetchAreasProtegidas()
      ]);

      setEstadisticas(statsData);
      setAreas(areasData);
    } catch (err) {
      console.error('❌ ERROR AL CARGAR DASHBOARD - FORZANDO LOGOUT:', err);
      forceLogout();
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handlers memoizados
  const handleAreaSelect = useCallback((area: AreaProtegida) => {
    setSelectedArea(area);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedArea(null);
  }, []);

  // Mapeo de iconos (memoizado para evitar recreación)
  const iconMapping = useMemo(() => ({
    'asignacion-zonas': Globe,
    'registro-guarda': Users,
    'planificacion': Activity,
    'registro-diario': Target
  }), []);

  // Construir configuración de tarjetas (memoizado)
  const estadisticasPrincipales = useMemo(() => 
    estadisticas ? dashboardService.buildEstadisticasCards(estadisticas) : [],
    [estadisticas]
  );

  // Estado de carga
  if (loading) {
    return (
      <div className={`${layoutStyles.container} h-full flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 dark:text-green-400" />
          <p className="text-gray-600 dark:text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className={`${layoutStyles.container} h-full flex items-center justify-center`}>
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Error al cargar el dashboard</AlertTitle>
          <AlertDescription className="mt-2">
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadDashboardData}
              className="mt-4 w-full"
            >
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`${layoutStyles.container} h-full flex flex-col min-h-0`}>
      {/* Grid principal responsive: Mapa a la izquierda, Estadísticas a la derecha */}
      <div className="grid gap-2.5 sm:gap-3 md:gap-4 h-[600px] sm:h-[530px] md:h-[600px] lg:h-[670px] xl:h-[730px] grid-cols-1 lg:grid-cols-12">
        {/* Columna izquierda: Mapa */}
        <div className="h-full min-h-0 lg:col-span-11">
          <MapaAreasProtegidas 
            areas={areas} 
            onAreaSelect={handleAreaSelect}
            selectedAreaId={selectedArea?.id}
            showLegend={false}
          />
        </div>

        {/* Columna derecha: Estadísticas Principales en Desktop */}
        <div className="hidden lg:flex lg:col-span-1 h-full min-h-0 flex-col">
          <div className="grid grid-cols-1 gap-2 h-full">
          {estadisticasPrincipales.map((stat, index) => {
            const IconComponent = iconMapping[stat.section as keyof typeof iconMapping];
            
            return (
              <StatCard
                key={stat.section}
                stat={stat}
                Icon={IconComponent}
                index={index}
                onNavigate={onNavigate}
                isMobile={false}
              />
            );
          })}
          </div>
        </div>
      </div>

      {/* Estadísticas responsive: en móvil/tablet */}
      <div className="lg:hidden">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {estadisticasPrincipales.map((stat, index) => {
            const IconComponent = iconMapping[stat.section as keyof typeof iconMapping];
            
            return (
              <StatCard
                key={stat.section}
                stat={stat}
                Icon={IconComponent}
                index={index}
                onNavigate={onNavigate}
                isMobile={true}
              />
            );
          })}
        </div>
      </div>

      {/* Card flotante con detalles del área protegida */}
      <AnimatePresence>
        {selectedArea && (
          <>
            {/* Backdrop oscuro */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={handleCloseDetail}
            />
            
            {/* Card flotante responsive con margen superior para no tapar el header */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ 
                duration: 0.4, 
                ease: [0.4, 0, 0.2, 1],
                scale: { type: "spring", stiffness: 300, damping: 25 }
              }}
              className="fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[96%] sm:w-[90%] md:w-[75%] lg:w-[65%] xl:w-[60%] max-w-3xl max-h-[90vh] sm:max-h-[85vh] z-50 overflow-hidden"
            >
              <div className="h-full w-full bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col relative">
                {/* Botón de cerrar flotante */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseDetail}
                  className="absolute top-4 right-4 z-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-gray-200 dark:hover:bg-gray-700 h-10 w-10 shadow-lg flex-shrink-0 transition-all duration-200 active:scale-95 border border-gray-200 dark:border-gray-700"
                >
                  <X className="h-5 w-5" />
                </Button>
                
                {/* Contenido scrolleable responsive */}
                <div className="flex-1 overflow-auto p-2.5 sm:p-3 md:p-4">
                  <AreaProtegidaDetalle 
                    area={selectedArea} 
                    isSimplified={false}
                    allAreas={areas}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}