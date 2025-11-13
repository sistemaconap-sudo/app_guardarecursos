import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Plus, MapPin, Edit, Search, Globe, Trees, Map, CheckCircle2, XCircle, TreePine } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Guardarecurso } from '../types';
import { guardarecursosService } from '../utils/guardarecursosService';
import { AreaProtegida } from '../types';
import { buttonStyles, filterStyles, formStyles, listCardStyles, layoutStyles, estadoAlertStyles, cardStyles, getEstadoTopLineColor, getEstadoBadgeClass } from '../styles/shared-styles';
import { toast } from 'sonner@2.0.3';
import { areasProtegidasService, AreaEstadoPendiente, AreaProtegidaFormData } from '../utils/areasProtegidasService';
import { forceLogout } from '../utils/base-api-service';

interface AsignacionZonasProps {
  userPermissions: {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}

// ===== COMPONENTES MEMOIZADOS =====

/**
 * Card de área protegida - Memoizado
 */
interface AreaCardProps {
  area: AreaProtegida;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (area: AreaProtegida) => void;
  onEstadoClick: (area: AreaProtegida) => void;
}

const AreaCard = memo(({ area, canEdit, canDelete, onEdit, onEstadoClick }: AreaCardProps) => {
  const handleEdit = useCallback(() => onEdit(area), [onEdit, area]);
  const handleEstadoClick = useCallback(() => onEstadoClick(area), [onEstadoClick, area]);
  
  return (
    <Card className={`${cardStyles.baseWithOverflow} ${listCardStyles.card}`}>
      <div className={getEstadoTopLineColor(area.estado)} />
      <CardContent className={listCardStyles.content}>
        {/* Header con nombre y acciones */}
        <div className={listCardStyles.header}>
          <div className={listCardStyles.headerContent}>
            <h3 className={listCardStyles.title}>{area.nombre}</h3>
            <Badge className={`${getEstadoBadgeClass(area.estado)} ${listCardStyles.badge}`}>
              {area.estado}
            </Badge>
          </div>
          <div className={listCardStyles.headerActions}>
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEdit}
                className={listCardStyles.actionButtonEdit}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEstadoClick}
                className={
                  area.estado === 'Activo'
                    ? listCardStyles.actionButtonDeactivate
                    : listCardStyles.actionButtonActivate
                }
                title={area.estado === 'Activo' ? 'Desactivar área' : 'Activar área'}
              >
                {area.estado === 'Activo' ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Información del área */}
        <div className={listCardStyles.infoSection}>
          <div className={listCardStyles.infoItem}>
            <MapPin className={listCardStyles.infoIcon} />
            <span className={listCardStyles.infoText}>{area.departamento}</span>
          </div>

          <div className={listCardStyles.infoItem}>
            <Globe className={listCardStyles.infoIcon} />
            <span className={listCardStyles.infoText}>
              {area.extension.toLocaleString()} ha
            </span>
          </div>

          <div className={listCardStyles.infoItem}>
            <TreePine className={listCardStyles.infoIcon} />
            <span className={listCardStyles.infoText}>{area.ecosistemas[0]}</span>
          </div>

          <div className={listCardStyles.infoItem}>
            <Map className={listCardStyles.infoIcon} />
            <div className={listCardStyles.infoText}>
              <div>Lat: {area.coordenadas.lat}</div>
              <div>Lng: {area.coordenadas.lng}</div>
            </div>
          </div>
        </div>

        {/* Descripción */}
        <p className={listCardStyles.description}>
          {area.descripcion}
        </p>
      </CardContent>
    </Card>
  );
});

AreaCard.displayName = 'AreaCard';

// ===== COMPONENTE PRINCIPAL =====

export function AsignacionZonas({ userPermissions }: AsignacionZonasProps) {
  // Estados principales
  const [areasList, setAreasList] = useState<AreaProtegida[]>([]);
  const [guardarecursosList, setGuardarecursosList] = useState<Guardarecurso[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaProtegida | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartamento, setSelectedDepartamento] = useState('todos');
  const [formData, setFormData] = useState<AreaProtegidaFormData>(areasProtegidasService.createEmptyFormData());
  const [estadoPendiente, setEstadoPendiente] = useState<AreaEstadoPendiente | null>(null);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [isEditingCoords, setIsEditingCoords] = useState(false);
  const [tempCoords, setTempCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  // Estados para ecosistemas y departamentos dinámicos
  const [ecosistemas, setEcosistemas] = useState<string[]>([]);
  const [departamentos, setDepartamentos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  /**
   * Cargar ecosistemas desde la base de datos
   */
  const loadEcosistemas = useCallback(async () => {
    try {
      const { fetchEcosistemas } = await import('../utils/areasProtegidasService');
      const data = await fetchEcosistemas();
      setEcosistemas(data);
    } catch (error) {
      console.error('Error al cargar ecosistemas:', error);
      // Fallback a valores estáticos
      setEcosistemas([
        'Bosque Tropical Húmedo',
        'Bosque Tropical Seco', 
        'Bosque Nublado',
        'Humedales',
        'Manglares',
        'Sabanas',
        'Bosque Mixto',
        'Matorral Volcánico',
        'Karst'
      ]);
    }
  }, []);

  /**
   * Cargar departamentos desde la base de datos
   */
  const loadDepartamentos = useCallback(async () => {
    try {
      const { fetchDepartamentos } = await import('../utils/areasProtegidasService');
      const data = await fetchDepartamentos();
      setDepartamentos(data);
    } catch (error) {
      console.error('Error al cargar departamentos:', error);
      // Fallback a valores estáticos
      setDepartamentos([
        'Petén', 'Alta Verapaz', 'Baja Verapaz', 'Chimaltenango', 
        'Escuintla', 'Guatemala', 'Quetzaltenango', 'Huehuetenango',
        'Izabal', 'Jalapa', 'Jutiapa', 'Quiché', 'Retalhuleu',
        'Sacatepéquez', 'San Marcos', 'Santa Rosa', 'Sololá',
        'Suchitepéquez', 'Totonicapán', 'Zacapa', 'El Progreso', 'Chiquimula'
      ]);
    }
  }, []);

  /**
   * Cargar áreas protegidas - Memoizado
   * 🔒 SEGURIDAD: Solo fuerza logout si el error es de autenticación (401)
   */
  const loadAreas = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await areasProtegidasService.fetchAreasProtegidas();
      setAreasList(data);
    } catch (error: any) {
      console.error('❌ ERROR AL CARGAR ÁREAS:', error);
      console.error('❌ ERROR DETALLES:', {
        message: error?.message,
        stack: error?.stack,
        statusCode: error?.statusCode
      });
      
      // SOLO forzar logout si es error 401 (token expirado)
      // Para otros errores, mostrar toast pero NO sacar al login
      if (error?.statusCode === 401 || error?.message?.includes('401')) {
        console.error('❌ ERROR 401 - TOKEN EXPIRADO - FORZANDO LOGOUT');
        forceLogout(error);
      } else {
        toast.error('Error al cargar áreas', {
          description: error?.message || 'No se pudieron cargar las áreas protegidas'
        });
        setAreasList([]); // Mostrar lista vacía en lugar de crashear
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Cargar guardarecursos - Memoizado
   * 🔒 SEGURIDAD: Si hay error, fuerza logout
   */
  const loadGuardarecursos = useCallback(async () => {
    try {
      const data = await guardarecursosService.fetchGuardarecursos();
      setGuardarecursosList(data);
    } catch (error) {
      console.error('❌ ERROR AL CARGAR GUARDARECURSOS - FORZANDO LOGOUT:', error);
      forceLogout();
    }
  }, []);

  // Cargar áreas y guardarecursos al montar el componente
  useEffect(() => {
    loadAreas();
    loadGuardarecursos();
    loadEcosistemas();
    loadDepartamentos();
  }, [loadAreas, loadGuardarecursos, loadEcosistemas, loadDepartamentos]);

  /**
   * Filtros usando el servicio - Memoizado
   */
  const filteredAreas = useMemo(() => {
    return areasProtegidasService.filterAreasProtegidas(
      areasList,
      searchTerm,
      selectedDepartamento
    );
  }, [areasList, searchTerm, selectedDepartamento]);

  /**
   * Handler para submit - Memoizado
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('📝 Guardando área protegida...', formData);
      
      if (editingArea) {
        await areasProtegidasService.updateAreaProtegidaAPI(editingArea.id, formData);
        console.log('✅ Área actualizada exitosamente');
        toast.success('Área actualizada', {
          description: 'El área protegida ha sido actualizada correctamente.'
        });
      } else {
        await areasProtegidasService.createAreaProtegidaAPI(formData);
        console.log('✅ Área creada exitosamente');
        toast.success('Área creada', {
          description: 'El área protegida ha sido creada exitosamente.'
        });
      }
      
      console.log('🔄 Recargando lista de áreas...');
      await loadAreas();
      console.log('✅ Lista de áreas recargada');
      
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('❌ ERROR AL GUARDAR ÁREA:', error);
      console.error('❌ ERROR DETALLES:', {
        message: error?.message,
        stack: error?.stack,
        statusCode: error?.statusCode
      });
      
      // SOLO forzar logout si es error 401 (token expirado)
      if (error?.statusCode === 401 || error?.message?.includes('401')) {
        console.error('❌ ERROR 401 - TOKEN EXPIRADO - FORZANDO LOGOUT');
        forceLogout();
      } else {
        // Para otros errores, mostrar el mensaje pero NO sacar al login
        toast.error('Error al guardar área', {
          description: error?.message || 'No se pudo guardar el área protegida',
          duration: 5000
        });
      }
    }
  }, [editingArea, formData, loadAreas]);

  /**
   * Resetear formulario - Memoizado
   */
  const resetForm = useCallback(() => {
    setFormData(areasProtegidasService.createEmptyFormData());
    setEditingArea(null);
  }, []);

  /**
   * Handler para editar - Memoizado
   */
  const handleEdit = useCallback((area: AreaProtegida) => {
    setFormData(areasProtegidasService.areaToFormData(area));
    setEditingArea(area);
    setIsDialogOpen(true);
  }, []);

  /**
   * Handler para cambio de estado - Memoizado
   */
  const handleEstadoClick = useCallback((area: AreaProtegida) => {
    const nuevoEstado = areasProtegidasService.toggleEstado(area.estado);
    
    if (!areasProtegidasService.isValidEstadoChange(area.estado, nuevoEstado)) {
      toast.info('Sin cambios', {
        description: `El área ya está en estado ${nuevoEstado}.`
      });
      return;
    }

    // Si intenta desactivar, validar usando el servicio
    if (nuevoEstado === 'Desactivado') {
      console.log('🔍 Validando desactivación de área:', {
        areaId: area.id,
        areaNombre: area.nombre,
        totalGuardarecursos: guardarecursosList.length,
        guardarecursos: guardarecursosList.map(g => ({
          id: g.id,
          nombre: `${g.nombre} ${g.apellido}`,
          area: g.areaAsignada,
          estado: g.estado
        }))
      });
      
      const validation = areasProtegidasService.validateAreaDeactivation(area, guardarecursosList);
      
      console.log('📊 Resultado de validación:', validation);
      
      if (!validation.isValid) {
        toast.error('No se puede desactivar', {
          description: validation.message,
          duration: 5000
        });
        return;
      }
    }

    setEstadoPendiente(
      areasProtegidasService.prepareEstadoPendiente(area, nuevoEstado)
    );
    setConfirmDialogOpen(true);
  }, [guardarecursosList]);

  /**
   * Confirmar cambio de estado - Memoizado
   */
  const confirmEstadoChange = useCallback(async () => {
    if (!estadoPendiente) return;

    const { id, nuevoEstado, nombre } = estadoPendiente;

    try {
      await areasProtegidasService.cambiarEstadoAreaAPI(id, nuevoEstado);

      const mensaje = areasProtegidasService.getEstadoMensaje(nuevoEstado);

      toast.success('Estado actualizado', {
        description: `${nombre} ha sido ${mensaje}.`
      });

      await loadAreas();

      setConfirmDialogOpen(false);
      setEstadoPendiente(null);
    } catch (error: any) {
      console.error('❌ ERROR AL CAMBIAR ESTADO - FORZANDO LOGOUT:', error);
      forceLogout();
    }
  }, [estadoPendiente, loadAreas]);

  /**
   * Handler para abrir diálogo nuevo - Memoizado
   */
  const handleOpenNewDialog = useCallback(() => {
    resetForm();
    setIsDialogOpen(true);
  }, [resetForm]);

  /**
   * Handler para cancelar diálogo - Memoizado
   */
  const handleCancelDialog = useCallback(() => {
    resetForm();
    setIsDialogOpen(false);
  }, [resetForm]);

  /**
   * Handler para cancelar confirmación - Memoizado
   */
  const handleCancelConfirm = useCallback(() => {
    setConfirmDialogOpen(false);
    setEstadoPendiente(null);
  }, []);

  return (
    <div className={layoutStyles.container}>
      {/* Barra superior con búsqueda y botón - Diseño Minimalista */}
      <div className={filterStyles.filterGroupNoBorder}>
        {/* Búsqueda */}
        <div className={filterStyles.searchContainer}>
          <div className={filterStyles.searchContainerWrapper}>
            <Search className={filterStyles.searchIcon} />
            <Input
              placeholder="Buscar áreas protegidas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={filterStyles.searchInput}
            />
          </div>
        </div>
        
        {/* Filtro por departamento */}
        <div className={filterStyles.selectWrapper}>
          <Select value={selectedDepartamento} onValueChange={setSelectedDepartamento}>
            <SelectTrigger className={filterStyles.selectTrigger}>
              <SelectValue placeholder="Todos los departamentos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los departamentos</SelectItem>
              {departamentos.map(dep => (
                <SelectItem key={dep} value={dep}>{dep}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Botón crear */}
        {userPermissions.canCreate && (
          <Button 
            onClick={handleOpenNewDialog}
            className={buttonStyles.createButton}
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
            Nuevo
          </Button>
        )}
      </div>


      {/* Diálogo para crear/editar área protegida */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className={formStyles.dialogContent}>
            <DialogHeader className={formStyles.dialogHeader}>
              <DialogTitle className={formStyles.dialogTitle}>
                {editingArea ? 'Editar Área Protegida' : 'Nueva Área Protegida'}
              </DialogTitle>
              <DialogDescription className={formStyles.dialogDescription}>
                Complete la información del área protegida
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className={formStyles.form}>
              {/* Información General */}
              <div className={formStyles.section}>
                <h3 className={formStyles.sectionTitle}>Información General</h3>
                
                <div className={formStyles.grid}>
                  <div className={formStyles.field}>
                    <Label htmlFor="nombre" className={formStyles.label}>
                      Nombre del Área *
                      {editingArea && <span className="ml-2 text-xs text-muted-foreground">(No editable)</span>}
                    </Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      placeholder="Ej: Parque Nacional Tikal"
                      className={formStyles.input}
                      disabled={!!editingArea}
                      required
                    />
                  </div>

                  <div className={formStyles.field}>
                    <Label htmlFor="departamento" className={formStyles.label}>
                      Departamento *
                      {editingArea && <span className="ml-2 text-xs text-muted-foreground">(No editable)</span>}
                    </Label>
                    <Select 
                      value={formData.departamento} 
                      onValueChange={(value) => setFormData({...formData, departamento: value})}
                      disabled={!!editingArea}
                    >
                      <SelectTrigger className={formStyles.selectTrigger}>
                        <SelectValue placeholder="Seleccione departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {departamentos.map(dep => (
                          <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className={formStyles.fieldFullWidth}>
                    <Label htmlFor="extension" className={formStyles.label}>Extensión (hectáreas) *</Label>
                    <Input
                      id="extension"
                      type="number"
                      min="1"
                      value={formData.extension || ''}
                      onChange={(e) => setFormData({...formData, extension: parseInt(e.target.value) || 0})}
                      placeholder="57500"
                      className={formStyles.input}
                      required
                    />
                  </div>

                  <div className={formStyles.fieldFullWidth}>
                    <Label htmlFor="descripcion" className={formStyles.label}>Descripción *</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                      placeholder="Descripción del área protegida..."
                      rows={3}
                      className="resize-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div className={formStyles.section}>
                <h3 className={formStyles.sectionTitle}>Ubicación Geográfica</h3>
                
                <div className={formStyles.grid}>
                  <div className={formStyles.field}>
                    <Label htmlFor="lat" className={formStyles.label}>
                      Latitud *
                      {editingArea && <span className="ml-2 text-xs text-muted-foreground">(No editable)</span>}
                    </Label>
                    <Input
                      id="lat"
                      type="number"
                      step="0.0001"
                      value={formData.coordenadas.lat || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        coordenadas: { ...formData.coordenadas, lat: parseFloat(e.target.value) || 0 }
                      })}
                      placeholder="17.2328"
                      className={formStyles.input}
                      disabled={!!editingArea}
                      required
                    />
                  </div>
                  
                  <div className={formStyles.field}>
                    <Label htmlFor="lng" className={formStyles.label}>
                      Longitud *
                      {editingArea && <span className="ml-2 text-xs text-muted-foreground">(No editable)</span>}
                    </Label>
                    <Input
                      id="lng"
                      type="number"
                      step="0.0001"
                      value={formData.coordenadas.lng || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        coordenadas: { ...formData.coordenadas, lng: parseFloat(e.target.value) || 0 }
                      })}
                      placeholder="-89.6239"
                      className={formStyles.input}
                      disabled={!!editingArea}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Ecosistema */}
              <div className={formStyles.section}>
                <h3 className={formStyles.sectionTitle}>Ecosistema</h3>
                
                <div className={formStyles.gridSingle}>
                  <div className={formStyles.field}>
                    <Label className={formStyles.label}>Ecosistema Principal *</Label>
                    <Select 
                      value={formData.ecosistemas[0]} 
                      onValueChange={(value) => setFormData({...formData, ecosistemas: [value]})}
                    >
                      <SelectTrigger className={formStyles.selectTrigger}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ecosistemas.map(eco => (
                          <SelectItem key={eco} value={eco}>{eco}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className={formStyles.footer}>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancelDialog}
                  className={formStyles.cancelButton}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className={formStyles.submitButton}
                >
                  Guardar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      {/* Grid de áreas protegidas */}
      <div className={layoutStyles.cardGrid}>
        {isLoading ? (
          <Card className="col-span-full">
            <CardContent className="p-8 sm:p-12">
              <div className={layoutStyles.emptyState}>
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center animate-pulse">
                  <Trees className="h-8 w-8 text-gray-400" />
                </div>
                <div className={layoutStyles.emptyStateTitle}>
                  Cargando áreas protegidas...
                </div>
              </div>
            </CardContent>
          </Card>
        ) : filteredAreas.map((area) => (
          <AreaCard
            key={area.id}
            area={area}
            canEdit={userPermissions.canEdit}
            canDelete={userPermissions.canDelete}
            onEdit={handleEdit}
            onEstadoClick={handleEstadoClick}
          />
        ))}
      
        {!isLoading && filteredAreas.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="p-8 sm:p-12">
              <div className="text-center">
                <MapPin className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-30" />
                <h3 className="font-medium mb-2 text-sm sm:text-base">No se encontraron áreas protegidas</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Intente ajustar los filtros de búsqueda
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Diálogo de confirmación de cambio de estado */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent className={estadoAlertStyles.content}>
          <AlertDialogHeader className={estadoAlertStyles.header}>
            <AlertDialogTitle className={estadoAlertStyles.title}>
              ¿Confirmar cambio de estado?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className={estadoAlertStyles.description}>
                {estadoPendiente && (
                  <>
                    <p className={estadoAlertStyles.descriptionText}>
                      Está a punto de cambiar el estado de{' '}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {estadoPendiente.nombre}
                      </span>{' '}
                      a{' '}
                      <span className={estadoAlertStyles.estadoHighlight(estadoPendiente.nuevoEstado)}>
                        {estadoPendiente.nuevoEstado}
                      </span>
                    </p>
                    <div className={estadoAlertStyles.infoBox(estadoPendiente.nuevoEstado)}>
                      <p className={estadoAlertStyles.infoText(estadoPendiente.nuevoEstado)}>
                        {estadoPendiente.nuevoEstado === 'Activo' && (
                          <>El área estará disponible para asignaciones de guardarecursos.</>
                        )}
                        {estadoPendiente.nuevoEstado === 'Desactivado' && (
                          <>El área desaparecerá del sistema completamente.</>
                        )}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={estadoAlertStyles.footer}>
            <AlertDialogCancel 
              onClick={handleCancelConfirm}
              className={estadoAlertStyles.cancelButton}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmEstadoChange}
              className={estadoAlertStyles.confirmButton}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}