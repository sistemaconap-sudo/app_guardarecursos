import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Plus, Edit, Search, Package, AlertTriangle, CheckCircle, Clock, Radio, Navigation, Eye, Camera, Car, Wrench, Box, Shield, XCircle, Tag, Hash, FileText, User, CheckCircle2, MoreVertical } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { motion } from 'motion/react';
import { buttonStyles, filterStyles, formStyles, listCardStyles, layoutStyles, alertDialogStyles, cardStyles, getEstadoTopLineColor } from '../styles/shared-styles';
import { equiposService, EstadoEquipo, EquipoFormData } from '../utils/equiposService';
import { guardarecursosService } from '../utils/guardarecursosService';
import { toast } from 'sonner@2.0.3';
import { forceLogout } from '../utils/base-api-service';

interface ControlEquiposProps {
  userPermissions: {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
  currentUser?: {
    id: string;
    rol: string;
    nombre: string;
    apellido: string;
    email?: string;
  };
}

// ===== COMPONENTES MEMOIZADOS =====

/**
 * Card de equipo - Memoizado
 */
interface EquipoCardProps {
  equipo: any;
  index: number;
  guardarecurso?: any;
  isGuardarecurso: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (equipo: any) => void;
  onEstadoClick: (equipo: any, estado: EstadoEquipo) => void;
  getEstadoBadgeClass: (estado: EstadoEquipo) => string;
}

const EquipoCard = memo(({
  equipo,
  index,
  guardarecurso,
  isGuardarecurso,
  canEdit,
  canDelete,
  onEdit,
  onEstadoClick,
  getEstadoBadgeClass
}: EquipoCardProps) => {
  const handleEdit = useCallback(() => onEdit(equipo), [onEdit, equipo]);
  const handleOperativo = useCallback(() => onEstadoClick(equipo, 'Operativo'), [onEstadoClick, equipo]);
  const handleReparacion = useCallback(() => onEstadoClick(equipo, 'En Reparación'), [onEstadoClick, equipo]);
  const handleDesactivado = useCallback(() => onEstadoClick(equipo, 'Desactivado'), [onEstadoClick, equipo]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className={`${cardStyles.baseWithOverflow} ${listCardStyles.card}`}>
        <div className={getEstadoTopLineColor(equipo.estado)} />
        <CardContent className={listCardStyles.content}>
          {/* Header con nombre y acciones */}
          <div className={listCardStyles.header}>
            <div className={listCardStyles.headerContent}>
              <h3 className={listCardStyles.title}>{equipo.nombre}</h3>
              <Badge className={`${getEstadoBadgeClass(equipo.estado)} ${listCardStyles.badge}`}>
                {equipo.estado}
              </Badge>
            </div>
            <div className={listCardStyles.headerActions}>
              {!isGuardarecurso && canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEdit}
                  className={listCardStyles.actionButtonEdit}
                  title="Editar equipo"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {!isGuardarecurso && canDelete && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Cambiar estado"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="text-xs">Cambiar Estado</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleOperativo}
                      disabled={equipo.estado === 'Operativo'}
                      className="text-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-green-600" />
                      Operativo
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleReparacion}
                      disabled={equipo.estado === 'En Reparación'}
                      className="text-xs"
                    >
                      <Wrench className="h-3.5 w-3.5 mr-2 text-orange-600" />
                      En Reparación
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDesactivado}
                      disabled={equipo.estado === 'Desactivado'}
                      className="text-xs"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-2 text-gray-600" />
                      Desactivado
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Información del equipo */}
          <div className={listCardStyles.infoSection}>
            <div className={listCardStyles.infoItem}>
              <Hash className={listCardStyles.infoIcon} />
              <span className={listCardStyles.infoText}>{equipo.codigo}</span>
            </div>

            {equipo.marca && (
              <div className={listCardStyles.infoItem}>
                <Tag className={listCardStyles.infoIcon} />
                <span className={listCardStyles.infoText}>{equipo.marca} {equipo.modelo && `- ${equipo.modelo}`}</span>
              </div>
            )}

            {/* Asignado a */}
            <div className={listCardStyles.infoItem}>
              <User className={listCardStyles.infoIcon} />
              {guardarecurso ? (
                <span className={listCardStyles.infoText}>
                  {guardarecurso.nombre} {guardarecurso.apellido}
                </span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400 italic text-sm">Sin asignar</span>
              )}
            </div>
          </div>

          {/* Observaciones */}
          {equipo.observaciones && (
            <p className={listCardStyles.description}>
              {equipo.observaciones}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});

EquipoCard.displayName = 'EquipoCard';

// ===== COMPONENTE PRINCIPAL =====

export function ControlEquipos({ userPermissions, currentUser }: ControlEquiposProps) {
  const [equiposList, setEquiposList] = useState<any[]>([]);
  const [guardarecursos, setGuardarecursos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEstado, setSelectedEstado] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEquipo, setEditingEquipo] = useState<any>(null);
  
  // Estados para confirmación de cambio de estado
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [equipoToChange, setEquipoToChange] = useState<any>(null);
  const [newEstado, setNewEstado] = useState<EstadoEquipo | ''>('');
  
  const [formData, setFormData] = useState(equiposService.createEmptyFormData());
  const [codigoDuplicado, setCodigoDuplicado] = useState(false);

  /**
   * Verificar si es guardarecurso - Memoizado
   */
  const isGuardarecurso = useMemo(() => 
    equiposService.isGuardarecurso(currentUser),
    [currentUser]
  );

  /**
   * Cargar datos - Memoizado
   * 🔒 SEGURIDAD: Si hay error, fuerza logout
   */
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [equiposData, guardarecursosData] = await Promise.all([
        equiposService.fetchEquipos(),
        guardarecursosService.fetchGuardarecursos()
      ]);
      setEquiposList(equiposData);
      setGuardarecursos(guardarecursosData);
    } catch (error) {
      console.error('❌ ERROR AL CARGAR EQUIPOS - FORZANDO LOGOUT:', error);
      forceLogout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar datos desde Supabase
  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Filtrado usando el servicio - Memoizado
   */
  const filteredEquipos = useMemo(() => {
    return equiposService.filterEquipos(
      equiposList,
      searchTerm,
      currentUser,
      guardarecursos
    );
  }, [equiposList, searchTerm, currentUser, guardarecursos]);

  /**
   * Filtrar solo guardarecursos activos y ordenarlos alfabéticamente - Memoizado
   */
  const guardarecursosActivos = useMemo(() => {
    return guardarecursos
      .filter(g => g.estado === 'Activo')
      .sort((a, b) => {
        const nombreA = `${a.nombre} ${a.apellido}`;
        const nombreB = `${b.nombre} ${b.apellido}`;
        return nombreA.localeCompare(nombreB, 'es');
      });
  }, [guardarecursos]);

  /**
   * Mapa de guardarecursos por ID - Memoizado
   */
  const guardarecursosMap = useMemo(() => {
    return new Map(guardarecursos.map(g => [g.id, g]));
  }, [guardarecursos]);

  /**
   * Handler para submit - Memoizado
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar código duplicado antes de enviar (solo al crear)
    if (!editingEquipo && codigoDuplicado) {
      toast.error('Ya existe un equipo con este código de inventario');
      return;
    }
    
    try {
      if (editingEquipo) {
        await equiposService.updateEquipoAPI(editingEquipo.id, formData);
        toast.success('Equipo actualizado exitosamente');
      } else {
        await equiposService.createEquipoAPI(formData);
        toast.success('Equipo creado exitosamente');
      }
      
      await loadData();
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('❌ ERROR AL GUARDAR EQUIPO - FORZANDO LOGOUT:', error);
      forceLogout();
    }
  }, [editingEquipo, formData, loadData, codigoDuplicado]);

  /**
   * Resetear formulario - Memoizado
   */
  const resetForm = useCallback(() => {
    setFormData(equiposService.createEmptyFormData());
    setEditingEquipo(null);
    setCodigoDuplicado(false);
  }, []);

  /**
   * Verificar si el código ya existe - Memoizado
   */
  const verificarCodigoDuplicado = useCallback((codigo: string) => {
    if (!codigo || editingEquipo) {
      setCodigoDuplicado(false);
      return;
    }
    
    const existe = equiposList.some(equipo => 
      equipo.codigo.toLowerCase() === codigo.toLowerCase().trim()
    );
    setCodigoDuplicado(existe);
  }, [equiposList, editingEquipo]);

  /**
   * Handler para editar - Memoizado
   */
  const handleEdit = useCallback((equipo: any) => {
    setFormData(equiposService.equipoToFormData(equipo));
    setEditingEquipo(equipo);
    setCodigoDuplicado(false); // Limpiar validación al editar
    setIsDialogOpen(true);
  }, []);

  /**
   * Handler para cambio de estado - Memoizado
   */
  const handleEstadoClick = useCallback((equipo: any, estado: EstadoEquipo) => {
    setEquipoToChange(equipo);
    setNewEstado(estado);
    setConfirmDialogOpen(true);
  }, []);

  /**
   * Confirmar cambio de estado - Memoizado
   */
  const confirmEstadoChange = useCallback(async () => {
    if (equipoToChange && newEstado) {
      try {
        await equiposService.updateEstadoAPI(equipoToChange.id, newEstado as EstadoEquipo);
        toast.success('Estado del equipo actualizado');
        await loadData();
      } catch (error: any) {
        console.error('❌ ERROR AL CAMBIAR ESTADO - FORZANDO LOGOUT:', error);
        forceLogout();
      }
    }
    setConfirmDialogOpen(false);
    setEquipoToChange(null);
    setNewEstado('');
  }, [equipoToChange, newEstado, loadData]);

  /**
   * Funciones del servicio para estilos - Memoizadas
   */
  const getEstadoBadgeClass = useCallback((estado: EstadoEquipo) => {
    return equiposService.getEstadoBadgeClass(estado);
  }, []);

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
   * Handler para limpiar filtros - Memoizado
   */
  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedEstado('todos');
  }, []);

  return (
    <div className="space-y-4">
      {/* Barra superior con búsqueda y botón - Diseño Minimalista - Solo para Administradores y Coordinadores */}
      {!isGuardarecurso && (
        <div className={filterStyles.filterGroupNoBorder}>
          {/* Búsqueda */}
          <div className={filterStyles.searchContainer}>
            <div className={filterStyles.searchContainerWrapper}>
              <Search className={filterStyles.searchIcon} />
              <Input
                placeholder="Buscar equipos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={filterStyles.searchInput}
              />
            </div>
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
      )}
      
      {/* Vista especial para Guardarecursos */}
      {isGuardarecurso && (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-base sm:text-lg text-green-900 dark:text-green-100 truncate">
                  Mis Equipos Asignados
                </h3>
                <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 truncate">
                  {currentUser?.nombre} {currentUser?.apellido} - Vista personal
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diálogo para crear/editar - Solo para usuarios con permiso */}
      {!isGuardarecurso && userPermissions.canCreate && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className={formStyles.dialogContent}>
            <DialogHeader className={formStyles.dialogHeader}>
              <DialogTitle className={formStyles.dialogTitle}>
                {editingEquipo ? 'Editar Equipo' : 'Nuevo Equipo'}
              </DialogTitle>
              <DialogDescription className={formStyles.dialogDescription}>
                Complete la información del equipo o recurso
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className={formStyles.form}>
              {/* Información General */}
              <div className={formStyles.section}>
                <h3 className={formStyles.sectionTitle}>Información General</h3>
                
                <div className={formStyles.grid}>
                  <div className={formStyles.field}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Label htmlFor="nombre" className={formStyles.label}>
                        Nombre del Equipo *
                      </Label>
                      {editingEquipo && (
                        <span className="text-xs text-muted-foreground italic">No editable</span>
                      )}
                    </div>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      placeholder="Ej: Radio Motorola XTR"
                      className={formStyles.input}
                      required
                      readOnly={!!editingEquipo}
                      disabled={!!editingEquipo}
                    />
                  </div>
                  
                  <div className={formStyles.field}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Label htmlFor="codigo" className={formStyles.label}>
                        Código de Inventario *
                      </Label>
                      {editingEquipo && (
                        <span className="text-xs text-muted-foreground italic">No editable</span>
                      )}
                      {!editingEquipo && codigoDuplicado && (
                        <span className="text-xs text-red-600 dark:text-red-400 font-medium">Código duplicado</span>
                      )}
                    </div>
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => {
                        const newCodigo = e.target.value;
                        setFormData({...formData, codigo: newCodigo});
                        verificarCodigoDuplicado(newCodigo);
                      }}
                      placeholder="Ej: RAD-001"
                      className={`${formStyles.input} ${!editingEquipo && codigoDuplicado ? 'border-red-500 dark:border-red-500 focus:ring-red-500' : ''}`}
                      required
                      readOnly={!!editingEquipo}
                      disabled={!!editingEquipo}
                    />
                    {!editingEquipo && codigoDuplicado && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Ya existe un equipo con este código. Por favor, use uno diferente.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Especificaciones Técnicas */}
              <div className={formStyles.section}>
                <h3 className={formStyles.sectionTitle}>Especificaciones Técnicas</h3>
                
                <div className={formStyles.grid}>
                  <div className={formStyles.field}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Label htmlFor="marca" className={formStyles.label}>
                        Marca
                      </Label>
                      {editingEquipo && (
                        <span className="text-xs text-muted-foreground italic">No editable</span>
                      )}
                    </div>
                    <Input
                      id="marca"
                      value={formData.marca}
                      onChange={(e) => setFormData({...formData, marca: e.target.value})}
                      placeholder="Ej: Motorola"
                      className={formStyles.input}
                      readOnly={!!editingEquipo}
                      disabled={!!editingEquipo}
                    />
                  </div>
                  
                  <div className={formStyles.field}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Label htmlFor="modelo" className={formStyles.label}>
                        Modelo
                      </Label>
                      {editingEquipo && (
                        <span className="text-xs text-muted-foreground italic">No editable</span>
                      )}
                    </div>
                    <Input
                      id="modelo"
                      value={formData.modelo}
                      onChange={(e) => setFormData({...formData, modelo: e.target.value})}
                      placeholder="Ej: XTR 446"
                      className={formStyles.input}
                      readOnly={!!editingEquipo}
                      disabled={!!editingEquipo}
                    />
                  </div>
                </div>
              </div>

              {/* Asignación */}
              <div className={formStyles.section}>
                <h3 className={formStyles.sectionTitle}>Asignación</h3>
                
                <div className={formStyles.gridSingle}>
                  <div className={formStyles.field}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Label htmlFor="guardarecurso" className={formStyles.label}>
                        Asignado a
                      </Label>
                      {editingEquipo?.estado === 'En Reparación' && (
                        <span className="text-xs text-orange-600 dark:text-orange-400 italic">No disponible en reparación</span>
                      )}
                    </div>
                    <Select 
                      value={editingEquipo?.estado === 'En Reparación' ? 'none' : formData.guardarecursoAsignado} 
                      onValueChange={(value) => setFormData({...formData, guardarecursoAsignado: value})}
                      disabled={editingEquipo?.estado === 'En Reparación'}
                    >
                      <SelectTrigger className={formStyles.selectTrigger}>
                        <SelectValue placeholder={editingEquipo?.estado === 'En Reparación' ? 'No se puede asignar (en reparación)' : 'Seleccione guardarecurso (opcional)'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin asignar</SelectItem>
                        {guardarecursosActivos.map(g => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.nombre} {g.apellido}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              <div className={formStyles.section}>
                <h3 className={formStyles.sectionTitle}>Observaciones</h3>
                
                <div className={formStyles.gridSingle}>
                  <div className={formStyles.field}>
                    <Label htmlFor="observaciones" className={formStyles.label}>
                      Notas Adicionales
                    </Label>
                    <Textarea
                      id="observaciones"
                      value={formData.observaciones}
                      onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                      placeholder="Notas adicionales sobre el equipo..."
                      className={formStyles.textarea}
                    />
                  </div>
                </div>
              </div>
              
              {/* Footer con botones */}
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
                  disabled={!editingEquipo && codigoDuplicado}
                >
                  {!editingEquipo && codigoDuplicado ? 'Código duplicado' : 'Guardar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Grid de equipos */}
      <div>
        <div>
          {isLoading ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 sm:p-12">
                <div className="text-center">
                  <Package className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-30 animate-pulse" />
                  <h3 className="mb-2 text-sm sm:text-base">Cargando equipos...</h3>
                </div>
              </CardContent>
            </Card>
          ) : filteredEquipos.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 sm:p-12">
                <div className="text-center">
                  <Package className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-30" />
                  <h3 className="mb-2 text-sm sm:text-base">
                    {isGuardarecurso ? 'No tienes equipos asignados' : 'No se encontraron equipos'}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    {isGuardarecurso 
                      ? 'Actualmente no tienes ningún equipo asignado a tu cargo'
                      : 'No hay equipos que coincidan con los filtros seleccionados'
                    }
                  </p>
                  {!isGuardarecurso && (
                    <Button 
                      variant="outline" 
                      onClick={handleClearFilters}
                      className="text-xs sm:text-sm"
                    >
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className={layoutStyles.cardGrid}>
              {filteredEquipos.map((equipo, index) => (
                <EquipoCard
                  key={equipo.id}
                  equipo={equipo}
                  index={index}
                  guardarecurso={guardarecursosMap.get(equipo.guardarecursoAsignado)}
                  isGuardarecurso={isGuardarecurso}
                  canEdit={userPermissions.canEdit}
                  canDelete={userPermissions.canDelete}
                  onEdit={handleEdit}
                  onEstadoClick={handleEstadoClick}
                  getEstadoBadgeClass={getEstadoBadgeClass}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Diálogo de confirmación de cambio de estado */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent className={alertDialogStyles.contentLarge}>
          <AlertDialogHeader className={alertDialogStyles.header}>
            <AlertDialogTitle className={alertDialogStyles.title}>
              ¿Cambiar estado del equipo?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className={alertDialogStyles.description}>
                <p className={alertDialogStyles.descriptionText}>
                  Está a punto de cambiar el estado del equipo{' '}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {equipoToChange?.nombre}
                  </span>{' '}
                  a{' '}
                  <span className={
                    newEstado === 'Operativo' 
                      ? alertDialogStyles.highlightGreen
                      : newEstado === 'En Reparación'
                      ? alertDialogStyles.highlightOrange
                      : alertDialogStyles.highlightGray
                  }>
                    {newEstado}
                  </span>
                </p>
                <div className={
                  newEstado === 'Operativo' 
                    ? alertDialogStyles.infoBoxGreen
                    : newEstado === 'En Reparación'
                    ? alertDialogStyles.infoBoxOrange
                    : alertDialogStyles.infoBoxGray
                }>
                  <p className={
                    newEstado === 'Operativo' 
                      ? alertDialogStyles.infoTextGreen
                      : newEstado === 'En Reparación'
                      ? alertDialogStyles.infoTextOrange
                      : alertDialogStyles.infoTextGray
                  }>
                    {newEstado === 'Operativo' && 'El equipo estará disponible para su uso normal.'}
                    {newEstado === 'En Reparación' && 'El equipo se marcará como en proceso de reparación y se desasignará automáticamente del guardarecurso actual.'}
                    {newEstado === 'Desactivado' && 'El equipo será desactivado y eliminado del sistema. No aparecerá más en los listados.'}
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={alertDialogStyles.footer}>
            <AlertDialogCancel className={alertDialogStyles.cancelButton}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmEstadoChange}
              className={alertDialogStyles.confirmButton}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
