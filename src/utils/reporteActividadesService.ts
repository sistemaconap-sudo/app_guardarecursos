/**
 * 📊 Reporte de Actividades Service
 * 
 * Servicio centralizado que maneja toda la lógica de generación de reportes mensuales de actividades,
 * incluyendo procesamiento de datos, agrupación y generación de PDF.
 * 
 * @module utils/reporteActividadesService
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { actividadesSync } from './actividadesSync';
import { Actividad } from '../types';
import { conapLogo } from '../src/logo';

/**
 * Interface para guardarecurso
 */
export interface GuardarecursoData {
  id: string;
  nombre: string;
  apellido: string;
  areaAsignada: string;
}

/**
 * Interface para datos agrupados de actividades
 */
export interface ActividadesAgrupadas {
  [key: string]: number;
}

/**
 * Interface para resultado de generación de reporte
 */
export interface ReporteResult {
  success: boolean;
  fileName?: string;
  error?: string;
  totalActividades?: number;
}

/**
 * Interface para actividad del reporte
 */
export interface ActividadReporte {
  no: number;
  nombre: string;
  unidad: string;
}

/**
 * 📅 CONSTANTES
 */

/**
 * Nombres de los meses (abreviados)
 */
export const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/**
 * Mapeo de tipos de actividad a categorías del reporte
 */
export const ACTIVIDAD_MAPPING: { [key: string]: number } = {
  // ===== CATEGORÍA 1: Patrullaje de Control y Vigilancia =====
  'Patrullaje': 1,
  'Patrullaje de Control y Vigilancia': 1, // ✅ Nombre exacto del backend
  'Control y Vigilancia': 1,
  'Ronda': 1,
  
  // ===== CATEGORÍA 2: Prevención y Atención de Incendios =====
  'Actividades de Prevención y Atención de Incendios Forestales': 2, // ✅ Nombre exacto del backend
  'Prevención de Incendios': 2,
  'Atención a Incendios Forestales': 2,
  'Prevención y Atención a Incendios Forestales': 2,
  
  // ===== CATEGORÍA 3: Mantenimiento de Área Protegida =====
  'Mantenimiento de Área Protegida': 3, // ✅ Nombre exacto del backend
  'Mantenimiento': 3,
  'Mantenimiento del Área Protegida': 3,
  'Educación Ambiental': 3,
  'Investigación': 3,
  
  // ===== CATEGORÍA 4: Reforestación =====
  'Reforestación de Área Protegida': 4, // ✅ Nombre exacto del backend
  'Reforestación': 4,
  'Reforestación del Área Protegida': 4,
  
  // ===== CATEGORÍA 5: Mantenimiento de Reforestación =====
  'Mantenimiento de Reforestación': 5, // ✅ Nombre exacto del backend
};

/**
 * 5 actividades estándar del reporte según formato CONAP
 */
export const ACTIVIDADES_REPORTE: ActividadReporte[] = [
  { no: 1, nombre: 'Patrullajes de control y vigilancia', unidad: 'Día' },
  { no: 2, nombre: 'Actividades de Prevención y atención a incendios forestales', unidad: 'Día' },
  { no: 3, nombre: 'Mantenimiento del área protegida', unidad: 'Día' },
  { no: 4, nombre: 'Reforestación del área protegida', unidad: 'Día' },
  { no: 5, nombre: 'Mantenimiento de reforestación', unidad: 'Día' }
];

/**
 * Colores CONAP
 */
export const COLORES_CONAP = {
  verde: [22, 163, 74] as [number, number, number],
  verdeOscuro: [22, 101, 52] as [number, number, number],
  grisClaro: [243, 244, 246] as [number, number, number]
};

/**
 * 📊 PROCESAMIENTO DE DATOS
 */

/**
 * Obtiene las actividades completadas de un guardarecurso de un año específico
 * @param guardarecursoId - ID del guardarecurso
 * @param año - Año del reporte (por defecto año actual)
 */
export function getActividadesGuardarecurso(guardarecursoId: string, año?: number): Actividad[] {
  const todasActividades = actividadesSync.getActividades();
  const añoReporte = año || new Date().getFullYear();
  
  const actividadesFiltradas = todasActividades.filter(act => {
    // Verificar que pertenece al guardarecurso
    if (act.guardarecurso !== guardarecursoId) return false;
    
    // Verificar que esté completada
    if (act.estado !== 'Completada') return false;
    
    // Verificar que sea del año especificado
    const añoActividad = new Date(act.fecha).getFullYear();
    if (añoActividad !== añoReporte) return false;
    
    return true;
  });
  
  // Log para debugging
  console.log(`📊 Actividades encontradas para guardarecurso ${guardarecursoId}:`, actividadesFiltradas.length);
  console.log('Total actividades en sistema:', todasActividades.length);
  console.log('Actividades filtradas:', actividadesFiltradas);
  
  return actividadesFiltradas;
}

/**
 * Agrupa actividades por tipo y mes
 */
export function agruparActividadesPorTipoYMes(actividades: Actividad[]): ActividadesAgrupadas {
  const datosActividades: ActividadesAgrupadas = {};
  
  console.log('🔍 Iniciando agrupación de actividades...');
  console.log('Actividades a agrupar:', actividades);
  
  actividades.forEach((actividad: Actividad) => {
    const fecha = new Date(actividad.fecha);
    const mes = fecha.getMonth(); // 0-11
    const categoriaNo = ACTIVIDAD_MAPPING[actividad.tipo] || 12;
    const clave = `${categoriaNo}-${mes}`;
    
    console.log(`  - Actividad: "${actividad.tipo}" → Categoría ${categoriaNo}, Mes ${mes} (${MESES[mes]}), Clave: ${clave}`);
    
    if (!datosActividades[clave]) {
      datosActividades[clave] = 0;
    }
    datosActividades[clave]++;
  });
  
  console.log('📊 Datos agrupados finales:', datosActividades);

  return datosActividades;
}

/**
 * Genera los datos de la tabla para el PDF
 */
export function generarDatosTabla(datosActividades: ActividadesAgrupadas): any[][] {
  return ACTIVIDADES_REPORTE.map(act => {
    const fila: any[] = [act.no, act.nombre, act.unidad];
    // Agregar datos de cada mes
    for (let mes = 0; mes < 12; mes++) {
      const clave = `${act.no}-${mes}`;
      fila.push(datosActividades[clave] || '-');
    }
    return fila;
  });
}

/**
 * 📄 GENERACIÓN DE PDF
 */

/**
 * Agrega el encabezado al PDF con el diseño oficial de CONAP
 */
function agregarEncabezado(
  doc: jsPDF,
  guardarecurso: GuardarecursoData,
  areaNombre: string,
  año: number
): void {
  // Logo de CONAP (izquierda)
  try {
    if (conapLogo && typeof conapLogo === 'string' && conapLogo.length > 0) {
      doc.addImage(conapLogo, 'PNG', 15, 10, 30, 30);
    }
  } catch (error) {
    console.warn('⚠️ No se pudo cargar el logo CONAP:', error);
    // Continuar sin el logo
  }
  
  // Títulos centrados (derecha del logo)
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  
  // Título principal
  doc.setFontSize(12);
  doc.text('Consejo Nacional de Áreas Protegidas', 140, 15, { align: 'center' });
  
  // Subtítulo
  doc.setFontSize(11);
  doc.text('Dirección Regional Altiplano Occidental', 140, 22, { align: 'center' });
  
  // Informe Mensual de Actividades + Año
  doc.setFontSize(11);
  doc.text(`Informe Mensual de Actividades ${año}`, 140, 29, { align: 'center' });
  
  // Línea divisoria decorativa
  doc.setDrawColor(22, 163, 74); // Verde CONAP
  doc.setLineWidth(0.5);
  doc.line(60, 35, 220, 35);
  
  // Información del Guardarrecurso y Área (centrado completo)
  doc.setFontSize(10);
  
  const inicioY = 42;
  const centroX = 140;
  
  // Guardarrecursos (centrado)
  doc.setFont('helvetica', 'bold');
  const textoGuardarrecursos = `Guardarrecursos:  ${guardarecurso.nombre} ${guardarecurso.apellido}`;
  doc.text(textoGuardarrecursos, centroX, inicioY, { align: 'center' });
  
  // Área Protegida (centrado)
  const textoArea = `Área Protegida:  ${areaNombre}`;
  doc.text(textoArea, centroX, inicioY + 7, { align: 'center' });
}

/**
 * Agrega la tabla de actividades al PDF
 */
function agregarTabla(doc: jsPDF, tableData: any[][]): void {
  // Calcular el ancho total de la tabla
  const anchoColumnas = 10 + 90 + 15 + (12 * 12); // No. + Actividad + Unidad + 12 meses
  const anchoTotal = anchoColumnas;
  const anchoPagina = 279.4; // Ancho de página letter en landscape (11 pulgadas = 279.4mm)
  const margenIzquierdo = (anchoPagina - anchoTotal) / 2; // Centrar la tabla
  
  autoTable(doc, {
    head: [
      [
        { content: 'No.', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold' } },
        { content: 'Actividad', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold' } },
        { content: 'Unidad de\nMedida', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold' } },
        { content: 'MES PROGRAMADO', colSpan: 12, styles: { halign: 'center', fontStyle: 'bold' } }
      ],
      // ⚠️ NO incluir placeholders vacíos porque las primeras 3 columnas ya tienen rowSpan: 2
      MESES
    ],
    body: tableData,
    startY: 60,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8,
      lineWidth: 0.5,
      lineColor: [0, 0, 0]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },   // No.
      1: { cellWidth: 90, halign: 'left' },     // Actividad
      2: { cellWidth: 15, halign: 'center' },   // Unidad de Medida
      // Meses (12 columnas)
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 12, halign: 'center' },
      6: { cellWidth: 12, halign: 'center' },
      7: { cellWidth: 12, halign: 'center' },
      8: { cellWidth: 12, halign: 'center' },
      9: { cellWidth: 12, halign: 'center' },
      10: { cellWidth: 12, halign: 'center' },
      11: { cellWidth: 12, halign: 'center' },
      12: { cellWidth: 12, halign: 'center' },
      13: { cellWidth: 12, halign: 'center' },
      14: { cellWidth: 12, halign: 'center' }
    },
    margin: { left: margenIzquierdo, right: margenIzquierdo },
    tableWidth: 'auto'
  });
}

/**
 * Agrega el pie de página al PDF
 */
function agregarFooter(doc: jsPDF, totalActividades: number): void {
  const finalY = (doc as any).lastAutoTable?.finalY || 120;
  
  // Nota al pie (como en la imagen)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('* Se adjunta el informe descriptivo en ____ hojas papel bond', 15, finalY + 8);
  
  // Información adicional del sistema (abajo a la derecha)
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const textoTotal = `Total de actividades: ${totalActividades} | Generado: ${new Date().toLocaleString('es-GT')}`;
  const anchoPagina = 279.4; // Ancho de página letter en landscape
  doc.text(textoTotal, anchoPagina - 15, finalY + 15, { align: 'right' });
}

/**
 * 🎯 FUNCIÓN PRINCIPAL
 */

/**
 * Genera el reporte mensual de actividades en PDF
 * @param guardarecurso - Datos del guardarecurso
 * @param areaNombre - Nombre del área protegida asignada (desde base de datos)
 * @param año - Año del reporte (por defecto año actual)
 */
export function generarReporteActividadesMensual(
  guardarecurso: GuardarecursoData, 
  areaNombre: string = 'No asignada',
  año?: number
): ReporteResult {
  try {
    // Obtener datos
    const añoReporte = año || new Date().getFullYear();
    
    // Obtener y procesar actividades
    const actividadesGuardarecurso = getActividadesGuardarecurso(guardarecurso.id, añoReporte);
    const datosActividades = agruparActividadesPorTipoYMes(actividadesGuardarecurso);
    const tableData = generarDatosTabla(datosActividades);
    
    // Crear PDF
    const doc = new jsPDF('landscape', 'mm', 'letter');
    
    // Agregar secciones
    agregarEncabezado(doc, guardarecurso, areaNombre, añoReporte);
    agregarTabla(doc, tableData);
    agregarFooter(doc, actividadesGuardarecurso.length);
    
    // Guardar PDF
    const nombreArchivo = `Informe_Mensual_${guardarecurso.apellido}_${añoReporte}.pdf`;
    doc.save(nombreArchivo);
    
    return {
      success: true,
      fileName: nombreArchivo,
      totalActividades: actividadesGuardarecurso.length
    };
    
  } catch (error) {
    console.error('❌ Error al generar PDF:', error);
    
    // Mejorar el mensaje de error
    let errorMessage = 'No se pudo crear el archivo PDF';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Servicio de Reporte de Actividades - Export centralizado
 */
export const reporteActividadesService = {
  // Procesamiento de datos
  getActividadesGuardarecurso,
  agruparActividadesPorTipoYMes,
  generarDatosTabla,
  
  // Generación de PDF
  generarReporteActividadesMensual,
  
  // Constantes
  MESES,
  ACTIVIDAD_MAPPING,
  ACTIVIDADES_REPORTE,
  COLORES_CONAP
};