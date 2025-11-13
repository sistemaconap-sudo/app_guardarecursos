import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Plus, Edit, Search, AlertTriangle, FileText, Camera, MapPin, Clock, Eye, Shield, Calendar, CheckCircle, XCircle, AlertCircle, ListPlus, ArrowRight, ChevronDown, Upload, X, Image as ImageIcon, Tag, User, Activity, History, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseLocalDate } from '../utils/formatters';
import { useIsMobile } from './ui/use-mobile';
import { buttonStyles, filterStyles, tableStyles, badgeStyles, getEstadoBadgeClass, getGravedadBadgeClass, tabStyles, formStyles, alertDialogStyles, textStyles } from '../styles/shared-styles';
import { hallazgosService, Hallazgo, HallazgoFormData, SeguimientoFormData } from '../utils/hallazgosService';
import { authService } from '../utils/authService';
import { Alert, AlertDescription } from './ui/alert';
import { areasProtegidasService } from '../utils/areasProtegidasService';
import { guardarecursosService } from '../utils/guardarecursosService';
import { AreaProtegida, Guardarecurso } from '../types';
import { forceLogout } from '../utils/base-api-service';

interface ReporteHallazgosProps {
  userPermissions: {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
  currentUser?: any;
}

export function ReporteHallazgos({ userPermissions, currentUser }: ReporteHallazgosProps) {
  const isMobile = useIsMobile();
  
  // Helper para formatear fechas de manera segura - MEMOIZADO
  const formatearFecha = useCallback((fechaStr: string, formato: string = "d 'de' MMMM 'de' yyyy") => {
    try {
      // Si la fecha no tiene hora, agregar 'T12:00:00' (mediodía) para evitar problemas de timezone
      const fechaDate = fechaStr.includes('T') 
        ? new Date(fechaStr) 
        : new Date(fechaStr + 'T12:00:00');
      return format(fechaDate, formato, { locale: es });
    } catch (error) {
      console.error('Error al formatear fecha:', error, fechaStr);
      return fechaStr;
    }
  }, []);
  
  const [hallazgosList, setHallazgosList] = useState<Hallazgo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'activos' | 'historial'>('activos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHallazgo, setEditingHallazgo] = useState<Hallazgo | null>(null);
  const [selectedHallazgo, setSelectedHallazgo] = useState<Hallazgo | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isSeguimientoDialogOpen, setIsSeguimientoDialogOpen] = useState(false);
  const [hallazgoParaSeguimiento, setHallazgoParaSeguimiento] = useState<Hallazgo | null>(null);
  
  const [formData, setFormData] = useState<HallazgoFormData>(hallazgosService.createEmptyFormData());
  const [seguimientoFormData, setSeguimientoFormData] = useState<SeguimientoFormData>(hallazgosService.createEmptySeguimientoFormData());
  const [evidenciasPreview, setEvidenciasPreview] = useState<string[]>([]);
  
  // Estados para áreas protegidas y guardarecursos reales
  const [areasProtegidas, setAreasProtegidas] = useState<AreaProtegida[]>([]);
  const [guardarecursos, setGuardarecursos] = useState<Guardarecurso[]>([]);
  
  // Filtrar solo áreas activas y ordenarlas alfabéticamente - Memoizado
  const areasActivasProtegidas = useMemo(() => {
    return areasProtegidas
      .filter(area => area.estado === 'Activo')
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [areasProtegidas]);

  // Cargar datos iniciales (áreas protegidas, guardarecursos y hallazgos) - MEMOIZADO
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

      // Cargar datos en paralelo
      const [areas, guardas, hallazgos] = await Promise.all([
        areasProtegidasService.fetchAreasProtegidas(token),
        guardarecursosService.fetchGuardarecursos(token),
        hallazgosService.fetchHallazgos(token)
      ]);

      setAreasProtegidas(areas);
      setGuardarecursos(guardas);
      setHallazgosList(hallazgos);
    } catch (err) {
      console.error('❌ ERROR AL CARGAR HALLAZGOS - FORZANDO LOGOUT:', err);
      forceLogout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrado usando el servicio
  const filteredHallazgos = useMemo(() => {
    return hallazgosService.filterHallazgos(hallazgosList, searchTerm, currentUser);
  }, [hallazgosList, searchTerm, currentUser]);

  // Separar hallazgos activos y resueltos usando el servicio
  const hallazgosActivos = useMemo(() => {
    return hallazgosService.getHallazgosActivos(filteredHallazgos);
  }, [filteredHallazgos]);

  const hallazgosResueltos = useMemo(() => {
    return hallazgosService.getHallazgosResueltos(filteredHallazgos);
  }, [filteredHallazgos]);

  // Handlers principales - MEMOIZADOS
  const resetForm = useCallback(() => {
    setFormData(hallazgosService.createEmptyFormData());
    setEditingHallazgo(null);
    setEvidenciasPreview([]);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      const token = authService.getCurrentToken();
      
      if (!token) {
        toast.error('Error', { description: 'No hay sesión activa' });
        return;
      }

      if (editingHallazgo) {
        // Actualizar usando el servicio (local, ya que no hay endpoint de actualización)
        const hallazgoActualizado = hallazgosService.updateHallazgo(editingHallazgo, formData, evidenciasPreview);
        setHallazgosList(prev => prev.map(h => 
          h.id === editingHallazgo.id ? hallazgoActualizado : h
        ));
        toast.success('Hallazgo actualizado', {
          description: 'El hallazgo ha sido actualizado correctamente'
        });
      } else {
        // Crear usando la API
        const nuevoHallazgo = await hallazgosService.createHallazgoAPI(token, formData);
        setHallazgosList(prev => [nuevoHallazgo, ...prev]);
        toast.success('Hallazgo creado', {
          description: 'El hallazgo ha sido reportado correctamente'
        });
      }
      
      resetForm();
      setIsDialogOpen(false);
    } catch (err) {
      console.error('❌ ERROR AL GUARDAR HALLAZGO - FORZANDO LOGOUT:', err);
      forceLogout();
    } finally {
      setIsSaving(false);
    }
  }, [editingHallazgo, formData, evidenciasPreview, resetForm]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    hallazgosService.processImageFiles(files, evidenciasPreview, (newPreviews) => {
      setEvidenciasPreview(newPreviews);
    });

    // Limpiar el input para permitir subir el mismo archivo nuevamente
    e.target.value = '';
  }, [evidenciasPreview]);

  const handleRemoveImage = useCallback((index: number) => {
    setEvidenciasPreview(hallazgosService.removeImage(evidenciasPreview, index));
  }, [evidenciasPreview]);

  const handleEdit = useCallback((hallazgo: Hallazgo) => {
    setFormData(hallazgosService.hallazgoToFormData(hallazgo));
    setEditingHallazgo(hallazgo);
    // Cargar evidencias existentes (simuladas)
    setEvidenciasPreview(hallazgo.evidencias || []);
    setIsDialogOpen(true);
  }, []);

  const handleView = useCallback((hallazgo: Hallazgo) => {
    setSelectedHallazgo(hallazgo);
    setIsViewDialogOpen(true);
  }, []);

  const handleAgregarSeguimiento = useCallback((hallazgo: Hallazgo) => {
    setHallazgoParaSeguimiento(hallazgo);
    setIsSeguimientoDialogOpen(true);
  }, []);

  const handleSubmitSeguimiento = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hallazgoParaSeguimiento) return;
    
    setIsSaving(true);
    
    try {
      const token = authService.getCurrentToken();
      if (!token) {
        toast.error('Error', { description: 'No hay sesión activa' });
        return;
      }

      // Agregar seguimiento usando la API
      const nuevoSeguimiento = await hallazgosService.agregarSeguimientoAPI(
        token, 
        hallazgoParaSeguimiento.id, 
        seguimientoFormData
      );
      
      // Actualizar el hallazgo en la lista agregando el nuevo seguimiento
      setHallazgosList(prev => prev.map(h => 
        h.id === hallazgoParaSeguimiento.id 
          ? { ...h, seguimiento: [nuevoSeguimiento, ...h.seguimiento] }
          : h
      ));
      
      // Si el modal de detalles está abierto y es el mismo hallazgo, actualizarlo también
      if (selectedHallazgo && selectedHallazgo.id === hallazgoParaSeguimiento.id) {
        setSelectedHallazgo({
          ...selectedHallazgo,
          seguimiento: [nuevoSeguimiento, ...selectedHallazgo.seguimiento]
        });
      }
      
      setSeguimientoFormData(hallazgosService.createEmptySeguimientoFormData());
      setIsSeguimientoDialogOpen(false);
      setHallazgoParaSeguimiento(null);
      
      toast.success('Seguimiento agregado', {
        description: 'El seguimiento se guardó correctamente'
      });
    } catch (err) {
      console.error('Error al agregar seguimiento:', err);
      toast.error('Error', {
        description: err instanceof Error ? err.message : 'Error al agregar seguimiento'
      });
    } finally {
      setIsSaving(false);
    }
  }, [hallazgoParaSeguimiento, seguimientoFormData, selectedHallazgo]);

  const handleCambiarEstado = useCallback(async (hallazgoId: string, nuevoEstado: string) => {
    try {
      const token = authService.getCurrentToken();
      if (!token) {
        toast.error('Error', { description: 'No hay sesión activa' });
        return;
      }

      // Cambiar estado usando la API
      const hallazgoActualizado = await hallazgosService.cambiarEstadoAPI(token, hallazgoId, nuevoEstado);

      setHallazgosList(prev => prev.map(h =>
        h.id === hallazgoId ? hallazgoActualizado : h
      ));

      toast.success('Estado actualizado', {
        description: `El hallazgo cambió a estado: ${nuevoEstado}`
      });
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      toast.error('Error', {
        description: err instanceof Error ? err.message : 'Error al cambiar estado'
      });
    }
  }, []);

  const handleGenerarReporte = useCallback((hallazgo: Hallazgo) => {
    toast.info('Generando reporte', {
      description: 'Preparando documento PDF...'
    });

    const result = hallazgosService.generarReportePDF(hallazgo, areasProtegidas, guardarecursos);

    if (result.success) {
      toast.success('Reporte generado', {
        description: 'El archivo PDF ha sido descargado correctamente'
      });
    } else {
      toast.error('Error al generar reporte', {
        description: result.error || 'No se pudo generar el archivo PDF. Por favor intente de nuevo.'
      });
    }
  }, [areasProtegidas, guardarecursos]);

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Barra de búsqueda - Diseño Minimalista */}
      <div className={filterStyles.filterGroupNoBorder}>
        {/* Búsqueda */}
        <div className={filterStyles.searchContainer}>
          <div className={filterStyles.searchContainerWrapper}>
            <Search className={filterStyles.searchIcon} />
            <Input
              placeholder="Buscar hallazgos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={filterStyles.searchInput}
            />
          </div>
        </div>
      </div>

      {/* Diálogo para crear/editar hallazgo */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[95vw] sm:w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader className="pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-700">
              <DialogTitle className="text-base sm:text-xl md:text-2xl">
                {editingHallazgo ? 'Editar Hallazgo' : 'Reportar Nuevo Hallazgo'}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Complete la información del hallazgo o irregularidad encontrada
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 pt-3 sm:pt-4">
              {/* Información básica */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 pb-2">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Información del Hallazgo</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="titulo" className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      Título del Hallazgo
                    </Label>
                    <Input
                      id="titulo"
                      value={formData.titulo}
                      onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                      placeholder="Resumen del hallazgo..."
                      className="h-10 border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descripcion" className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Descripción Detallada
                    </Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                      placeholder="Describa detalladamente el hallazgo..."
                      rows={4}
                      required
                      className="resize-none border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400"
                    />
                  </div>
                </div>
              </div>

              {/* Separador */}
              <div className="border-b border-gray-200 dark:border-gray-700"></div>

              {/* Clasificación */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 pb-2">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Clasificación</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="prioridad" className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      Prioridad
                    </Label>
                    <Select value={formData.prioridad} onValueChange={(value) => setFormData({...formData, prioridad: value})}>
                      <SelectTrigger className="h-10 border-gray-300 dark:border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baja">Baja</SelectItem>
                        <SelectItem value="Media">Media</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Crítica">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="area" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Área Protegida
                    </Label>
                    <Select value={formData.areaProtegida} onValueChange={(value) => setFormData({...formData, areaProtegida: value})}>
                      <SelectTrigger className="h-10 border-gray-300 dark:border-gray-600">
                        <SelectValue placeholder="Seleccione área" />
                      </SelectTrigger>
                      <SelectContent>
                        {areasActivasProtegidas.map(area => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Separador */}
              <div className="border-b border-gray-200 dark:border-gray-700"></div>

              {/* Ubicación */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 pb-2">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Ubicación</h3>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ubicacion" className="flex items-center gap-2 text-xs sm:text-sm">
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                      Ubicación
                    </Label>
                    <Input
                      id="ubicacion"
                      value={formData.ubicacion}
                      onChange={(e) => setFormData({...formData, ubicacion: e.target.value})}
                      placeholder="Descripción de la ubicación exacta..."
                      className="h-10 border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="lat" className="text-xs text-muted-foreground font-normal">Latitud (opcional)</Label>
                      <Input
                        id="lat"
                        type="number"
                        step="0.0001"
                        value={formData.coordenadas.lat || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          coordenadas: { ...formData.coordenadas, lat: parseFloat(e.target.value) || 0 }
                        })}
                        placeholder="Ej: 17.2328"
                        className="h-10 border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lng" className="text-xs text-muted-foreground font-normal">Longitud (opcional)</Label>
                      <Input
                        id="lng"
                        type="number"
                        step="0.0001"
                        value={formData.coordenadas.lng || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          coordenadas: { ...formData.coordenadas, lng: parseFloat(e.target.value) || 0 }
                        })}
                        placeholder="Ej: -89.6239"
                        className="h-10 border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Separador */}
              <div className="border-b border-gray-200 dark:border-gray-700"></div>

              {/* Observaciones */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 pb-2">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Observaciones Adicionales</h3>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="observaciones" className="flex items-center gap-2 text-xs sm:text-sm">
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    Información Adicional
                  </Label>
                  <Textarea
                    id="observaciones"
                    value={formData.observaciones}
                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                    placeholder="Información adicional relevante..."
                    rows={3}
                    className="resize-none border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400"
                  />
                </div>
              </div>

              {/* Evidencias Fotográficas */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center flex-shrink-0">
                    <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-pink-600 dark:text-pink-400" />
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base">Evidencias Fotográficas</h3>
                </div>
                
                <div className="pl-0 sm:pl-10 space-y-3 sm:space-y-4">
                  {/* Botón para subir fotografías */}
                  <div className="space-y-2">
                    <Label>Agregar fotografías</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="file-upload"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="w-full sm:w-auto"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Subir Fotografías
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Puede seleccionar múltiples imágenes
                      </span>
                    </div>
                  </div>

                  {/* Vista previa de imágenes */}
                  {evidenciasPreview.length > 0 && (
                    <div className="space-y-2">
                      <Label>Fotografías cargadas ({evidenciasPreview.length})</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {evidenciasPreview.map((preview, index) => (
                          <div
                            key={index}
                            className="relative group rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-pink-500 dark:hover:border-pink-500 transition-all duration-200"
                          >
                            <div className="aspect-square bg-gray-100 dark:bg-gray-800">
                              <img
                                src={preview}
                                alt={`Evidencia ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
                              title="Eliminar fotografía"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <p className="text-xs text-white text-center">
                                Foto {index + 1}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mensaje cuando no hay imágenes */}
                  {evidenciasPreview.length === 0 && (
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                      <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm text-muted-foreground mb-2">
                        No hay fotografías cargadas
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Las fotografías ayudan a documentar mejor el hallazgo
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Footer con botones */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}
                  className="w-full sm:w-auto sm:min-w-[100px]"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="w-full sm:w-auto sm:min-w-[100px] bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-700 hover:to-amber-800"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    editingHallazgo ? 'Actualizar' : 'Guardar'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      {/* Tabs e Hallazgos */}
      <div>
        {/* Tabs Minimalistas */}
        <div className="mb-4">
          <div className={tabStyles.containerFull}>
            <button 
              onClick={() => setActiveTab('activos')}
              className={tabStyles.tabFull(activeTab === 'activos')}
            >
              <Activity className={tabStyles.icon} />
              Activos
            </button>
            <button 
              onClick={() => setActiveTab('historial')}
              className={tabStyles.tabFull(activeTab === 'historial')}
            >
              <History className={tabStyles.icon} />
              Historial
            </button>
          </div>
        </div>

        {/* Contenido del Tab Activos */}
        {activeTab === 'activos' && (
          <div>
              {/* Vista de tarjetas para móvil - visible solo en pantallas pequeñas */}
              <div className="md:hidden space-y-3">
                {hallazgosActivos.map((hallazgo) => {
                  const prioridadInfo = hallazgosService.getPrioridadInfo(hallazgo.prioridad);
                  
                  return (
                    <motion.div
                      key={hallazgo.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="overflow-hidden">
                        <CardContent className="p-4">
                          {/* Header de la tarjeta - información resumida */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                                {hallazgo.titulo}
                              </h3>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {hallazgo.descripcion}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className={`${prioridadInfo.badge} text-xs`}>
                                  {hallazgo.prioridad}
                                </Badge>
                                <Badge variant={hallazgosService.getEstadoBadgeVariant(hallazgo.estado)} className="text-xs">
                                  {hallazgo.estado}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {/* Botones de acción */}
                          <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleView(hallazgo)}
                              className="flex-1 h-8 text-xs"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1.5" />
                              Ver
                            </Button>
                            
                            {userPermissions.canEdit && hallazgo.estado !== 'Resuelto' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAgregarSeguimiento(hallazgo)}
                                className="flex-1 h-8 text-xs"
                              >
                                <ListPlus className="h-3.5 w-3.5 mr-1.5" />
                                Seguimiento
                              </Button>
                            )}
                            
                            {userPermissions.canEdit && hallazgosService.getNextEstados(hallazgo.estado).length > 0 && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3"
                                  >
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuLabel>Cambiar Estado</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {hallazgosService.getNextEstados(hallazgo.estado).map((estado) => {
                                    const IconComponent = estado.icon;
                                    return (
                                      <DropdownMenuItem
                                        key={estado.value}
                                        onClick={() => handleCambiarEstado(hallazgo.id, estado.value)}
                                        className="cursor-pointer"
                                      >
                                        <IconComponent className="mr-2 h-4 w-4" />
                                        <span>{estado.label}</span>
                                      </DropdownMenuItem>
                                    );
                                  })}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
                
                {isLoading ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Loader2 className="h-12 w-12 mx-auto mb-3 animate-spin opacity-30 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Cargando hallazgos...
                      </p>
                    </CardContent>
                  </Card>
                ) : hallazgosActivos.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No hay hallazgos activos que coincidan con los filtros
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Vista de tabla para desktop - visible solo en pantallas grandes */}
              <div className="hidden md:block">
                <Card className={tableStyles.card}>
                  <div className={tableStyles.wrapper}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className={tableStyles.headerCell}>Hallazgo</TableHead>
                          <TableHead className={`${tableStyles.headerCell} hidden lg:table-cell`}>Ubicación</TableHead>
                          <TableHead className={tableStyles.headerCell}>Prioridad</TableHead>
                          <TableHead className={tableStyles.headerCell}>Estado</TableHead>
                          <TableHead className={tableStyles.headerCellRight}>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hallazgosActivos.map((hallazgo) => {
                      const area = areasProtegidas.find(a => a.id === hallazgo.areaProtegida);
                      const guardarecurso = guardarecursos.find(g => g.id === hallazgo.guardarecurso);
                      const prioridadInfo = hallazgosService.getPrioridadInfo(hallazgo.prioridad);
                      
                      return (
                        <TableRow key={hallazgo.id} className={tableStyles.row}>
                          {/* Hallazgo */}
                          <TableCell className={tableStyles.cell}>
                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              {hallazgo.titulo}
                            </div>
                          </TableCell>
                          
                          {/* Ubicación */}
                          <TableCell className={`${tableStyles.cell} hidden lg:table-cell`}>
                            <span className={tableStyles.infoWithIcon.text}>{area?.nombre || 'N/A'}</span>
                          </TableCell>
                          
                          {/* Prioridad */}
                          <TableCell className={tableStyles.cell}>
                            <Badge variant="outline" className={`${prioridadInfo.badge} ${tableStyles.badge}`}>
                              {hallazgo.prioridad}
                            </Badge>
                          </TableCell>
                          {/* Estado */}
                          <TableCell className={tableStyles.cell}>
                            <Badge className={`${getEstadoBadgeClass(hallazgo.estado)} ${tableStyles.badge}`}>
                              {hallazgo.estado}
                            </Badge>
                          </TableCell>
                          
                          {/* Acciones */}
                          <TableCell className={tableStyles.cell}>
                            <div className={tableStyles.actions.container}>
                              {/* Botón Ver */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(hallazgo)}
                                title="Ver detalles"
                                className={tableStyles.actions.buttonEdit}
                              >
                                <Eye className={tableStyles.actions.icon} />
                              </Button>
                              
                              {userPermissions.canEdit && (
                                <>
                                  {/* Botón de seguimiento */}
                                  {hallazgo.estado !== 'Resuelto' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleAgregarSeguimiento(hallazgo)}
                                      title="Agregar seguimiento"
                                      className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400"
                                    >
                                      <ListPlus className={tableStyles.actions.icon} />
                                    </Button>
                                  )}
                                  
                                  {/* Dropdown de cambio de estado */}
                                  {hallazgosService.getNextEstados(hallazgo.estado).length > 0 && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          title="Cambiar estado"
                                          className="h-8 w-8 p-0 hover:bg-green-50 dark:hover:bg-green-950/20 hover:text-green-600 dark:hover:text-green-400"
                                        >
                                          <ArrowRight className={tableStyles.actions.icon} />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>Cambiar Estado</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {hallazgosService.getNextEstados(hallazgo.estado).map((estado) => {
                                          const IconComponent = estado.icon;
                                          return (
                                            <DropdownMenuItem
                                              key={estado.value}
                                              onClick={() => handleCambiarEstado(hallazgo.id, estado.value)}
                                              className="cursor-pointer"
                                            >
                                              <IconComponent className="mr-2 h-4 w-4" />
                                              <span>{estado.label}</span>
                                            </DropdownMenuItem>
                                          );
                                        })}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    
                    {hallazgosActivos.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground border-t border-gray-100 dark:border-gray-800">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-sm">No hay hallazgos activos que coincidan con los filtros</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
          </div>
        )}

        {/* Contenido del Tab Historial */}
        {activeTab === 'historial' && (
          <div>
              {/* Vista de tarjetas para móvil - visible solo en pantallas pequeñas */}
              <div className="md:hidden space-y-3">
                {hallazgosResueltos.map((hallazgo) => {
                  const prioridadInfo = hallazgosService.getPrioridadInfo(hallazgo.prioridad);
                  
                  return (
                    <motion.div
                      key={hallazgo.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="overflow-hidden">
                        <CardContent className="p-5">
                          {/* Header de la tarjeta - información resumida */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-base line-clamp-2 mb-2">
                                {hallazgo.titulo}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                                {hallazgo.descripcion}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className={`${prioridadInfo.badge} text-xs font-normal px-2.5 py-0.5`}>
                                  {hallazgo.prioridad}
                                </Badge>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {hallazgo.fechaResolucion ? parseLocalDate(hallazgo.fechaResolucion).toLocaleDateString('es-GT') : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Botones de acción */}
                          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleView(hallazgo)}
                              className="w-full h-9 text-sm"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalles
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerarReporte(hallazgo)}
                              className="w-full h-9 text-sm"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Reporte
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
                
                {isLoading ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Loader2 className="h-12 w-12 mx-auto mb-3 animate-spin opacity-30 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Cargando historial...
                      </p>
                    </CardContent>
                  </Card>
                ) : hallazgosResueltos.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <History className="h-12 w-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No hay hallazgos resueltos que coincidan con los filtros
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Vista de tabla para desktop - visible solo en pantallas grandes */}
              <div className="hidden md:block">
                <Card className={tableStyles.card}>
                  <div className={tableStyles.wrapper}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className={tableStyles.headerCell}>Hallazgo</TableHead>
                          <TableHead className={`${tableStyles.headerCell} hidden lg:table-cell`}>Ubicación</TableHead>
                          <TableHead className={tableStyles.headerCell}>Prioridad</TableHead>
                          <TableHead className={tableStyles.headerCell}>Fecha de Reporte</TableHead>
                          <TableHead className={tableStyles.headerCellRight}>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hallazgosResueltos.map((hallazgo) => {
                          const area = areasProtegidas.find(a => a.id === hallazgo.areaProtegida);
                          const guardarecurso = guardarecursos.find(g => g.id === hallazgo.guardarecurso);
                          const prioridadInfo = hallazgosService.getPrioridadInfo(hallazgo.prioridad);
                          
                          return (
                            <TableRow key={hallazgo.id} className={tableStyles.row}>
                              {/* Hallazgo */}
                              <TableCell className={tableStyles.cell}>
                                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                  {hallazgo.titulo}
                                </div>
                              </TableCell>
                              
                              {/* Ubicación */}
                              <TableCell className={`${tableStyles.cell} hidden lg:table-cell`}>
                                <span className={tableStyles.infoWithIcon.text}>{hallazgo.areaProtegidaNombre || area?.nombre || 'N/A'}</span>
                              </TableCell>
                              
                              {/* Prioridad */}
                              <TableCell className={tableStyles.cell}>
                                <Badge variant="outline" className={`${prioridadInfo.badge} ${tableStyles.badge}`}>
                                  {hallazgo.prioridad}
                                </Badge>
                              </TableCell>
                              
                              {/* Fecha de Reporte */}
                              <TableCell className={tableStyles.cell}>
                                <div className={tableStyles.infoWithIcon.container}>
                                  <Calendar className={tableStyles.infoWithIcon.icon} />
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {formatearFecha(hallazgo.fechaReporte, "d MMM yyyy")}
                                  </span>
                                </div>
                              </TableCell>
                              
                              {/* Acciones */}
                              <TableCell className={tableStyles.cell}>
                                <div className={tableStyles.actions.container}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleView(hallazgo)}
                                    title="Ver detalles"
                                    className={tableStyles.actions.buttonEdit}
                                  >
                                    <Eye className={tableStyles.actions.icon} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleGenerarReporte(hallazgo)}
                                    title="Generar reporte"
                                    className="h-8 w-8 p-0 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-600 dark:hover:text-orange-400"
                                  >
                                    <FileText className={tableStyles.actions.icon} />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    
                    {hallazgosResueltos.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground border-t border-gray-100 dark:border-gray-800">
                        <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-sm">No hay hallazgos resueltos que coincidan con los filtros</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
          </div>
        )}
      </div>

      {/* Dialog para ver detalles del hallazgo */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className={formStyles.dialogContent}>
          <DialogHeader className={formStyles.dialogHeader}>
            <DialogTitle className={formStyles.dialogTitle}>
              Detalles del Hallazgo
            </DialogTitle>
            <DialogDescription className={formStyles.dialogDescription}>
              Información completa del hallazgo registrado
            </DialogDescription>
          </DialogHeader>
          
          {selectedHallazgo && (() => {
            return (
              <div className={formStyles.form}>
                {/* Información General */}
                <div className="space-y-3">
                  <h3 className={formStyles.sectionTitle}>
                    Información General
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Título */}
                    <div className={formStyles.field}>
                      <Label className={formStyles.label}>Título</Label>
                      <p className={textStyles.primary}>{selectedHallazgo.titulo}</p>
                    </div>
                    
                    {/* Prioridad */}
                    <div className={formStyles.field}>
                      <Label className={formStyles.label}>Prioridad</Label>
                      <Badge variant="outline" className={getGravedadBadgeClass(selectedHallazgo.prioridad)}>
                        {selectedHallazgo.prioridad}
                      </Badge>
                    </div>
                    
                    {/* Estado */}
                    <div className={formStyles.field}>
                      <Label className={formStyles.label}>Estado</Label>
                      <Badge variant="outline" className={getEstadoBadgeClass(selectedHallazgo.estado)}>
                        {selectedHallazgo.estado}
                      </Badge>
                    </div>
                    
                    {/* Descripción */}
                    <div className={`${formStyles.field} sm:col-span-2`}>
                      <Label className={formStyles.label}>Descripción</Label>
                      <p className={textStyles.primary}>{selectedHallazgo.descripcion}</p>
                    </div>
                    
                    {/* Área Protegida */}
                    <div className={formStyles.field}>
                      <Label className={formStyles.label}>Área Protegida</Label>
                      <p className={textStyles.primary}>
                        {selectedHallazgo.areaProtegidaNombre || 'Sin asignación'}
                      </p>
                    </div>
                    
                    {/* Guardarecurso */}
                    <div className={formStyles.field}>
                      <Label className={formStyles.label}>Guardarecurso</Label>
                      <p className={textStyles.primary}>
                        {selectedHallazgo.guardarecursoNombre || 'Desconocido'}
                      </p>
                    </div>
                    
                    {/* Fecha de Reporte */}
                    <div className={formStyles.field}>
                      <Label className={formStyles.label}>Fecha de Reporte</Label>
                      <p className={textStyles.primary}>
                        {formatearFecha(selectedHallazgo.fechaReporte)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Línea Temporal de Seguimiento */}
                {selectedHallazgo.seguimiento.length > 0 && (
                  <div className="space-y-3">
                    <h3 className={formStyles.sectionTitle}>
                      Línea Temporal de Seguimiento
                    </h3>
                    <div className="space-y-3">
                      {selectedHallazgo.seguimiento.map((seg, index) => (
                        <div key={index} className="border-l-2 border-blue-500 dark:border-blue-400 pl-4 py-2">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="font-medium text-xs">{seg.accion}</p>
                            <span className={textStyles.mutedSmall}>
                              {formatearFecha(seg.fecha, "d MMM yyyy")}
                            </span>
                          </div>
                          <p className={`${textStyles.mutedSmall} mb-1`}>
                            {seg.observaciones}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3 text-gray-400" />
                            <span className={textStyles.mutedSmall}>{seg.responsable}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Evidencias Fotográficas */}
                {selectedHallazgo.evidencias.length > 0 && (
                  <div className="space-y-3">
                    <h3 className={formStyles.sectionTitle}>
                      Evidencias Fotográficas
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {selectedHallazgo.evidencias.map((evidencia, index) => (
                        <div 
                          key={index} 
                          className="group relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200"
                        >
                          <div className="aspect-square bg-gray-100 dark:bg-gray-800">
                            {evidencia.startsWith('data:image') || evidencia.startsWith('http') ? (
                              <img
                                src={evidencia}
                                alt={`Evidencia ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-2">
                                <Camera className="h-10 w-10 text-gray-400 mb-2" />
                                <p className={`${textStyles.mutedSmall} text-center line-clamp-2`}>{evidencia}</p>
                              </div>
                            )}
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                            <p className="text-[10px] text-white">
                              Foto {index + 1}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className={formStyles.footer}>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsViewDialogOpen(false)}
                    className={formStyles.cancelButton}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Dialog para agregar seguimiento */}
      <Dialog open={isSeguimientoDialogOpen} onOpenChange={setIsSeguimientoDialogOpen}>
        <DialogContent className={formStyles.dialogContent}>
          <DialogHeader className={formStyles.dialogHeader}>
            <DialogTitle className={formStyles.dialogTitle}>
              Agregar Seguimiento
            </DialogTitle>
            <DialogDescription className={formStyles.dialogDescription}>
              Registra una nueva acción de seguimiento para el hallazgo
            </DialogDescription>
          </DialogHeader>
          
          {hallazgoParaSeguimiento && (
            <form onSubmit={handleSubmitSeguimiento} className={formStyles.form}>
              {/* Campo: Acción Realizada */}
              <div className={formStyles.field}>
                <Label htmlFor="accion" className={formStyles.label}>
                  Acción Realizada *
                </Label>
                <Input
                  id="accion"
                  value={seguimientoFormData.accion}
                  onChange={(e) => setSeguimientoFormData({...seguimientoFormData, accion: e.target.value})}
                  placeholder="Ej: Inspección del área..."
                  className={formStyles.input}
                  required
                />
              </div>

              {/* Campo: Observaciones */}
              <div className={formStyles.field}>
                <Label htmlFor="observaciones-seguimiento" className={formStyles.label}>
                  Observaciones *
                </Label>
                <Textarea
                  id="observaciones-seguimiento"
                  value={seguimientoFormData.observaciones}
                  onChange={(e) => setSeguimientoFormData({...seguimientoFormData, observaciones: e.target.value})}
                  placeholder="Describa las acciones tomadas..."
                  rows={4}
                  className={formStyles.textarea}
                  required
                />
              </div>

              {/* Footer con botones */}
              <div className={formStyles.footer}>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setSeguimientoFormData(hallazgosService.createEmptySeguimientoFormData());
                    setIsSeguimientoDialogOpen(false);
                  }}
                  className={formStyles.cancelButton}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className={formStyles.submitButton}
                >
                  <ListPlus className="h-4 w-4 mr-2" />
                  Agregar Seguimiento
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
