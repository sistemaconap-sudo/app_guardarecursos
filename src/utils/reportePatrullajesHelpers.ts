/**
 * 📋 Helpers para Reporte de Patrullajes
 * 
 * Funciones auxiliares para generar reportes en formato
 * "HOJA DE CONTROL DE PATRULLAJES" de CONAP
 */

import { Actividad } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extender el tipo jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: any;
  }
}

/**
 * Centra un texto dentro de un ancho dado
 * @param texto - Texto a centrar
 * @param ancho - Ancho total
 * @returns Texto centrado con espacios
 */
export function centrarTexto(texto: string, ancho: number): string {
  const espacios = Math.max(0, Math.floor((ancho - texto.length) / 2));
  return ' '.repeat(espacios) + texto;
}

/**
 * Ajusta un texto a un ancho específico (trunca o rellena con espacios)
 * @param texto - Texto a ajustar
 * @param ancho - Ancho deseado
 * @returns Texto ajustado
 */
export function ajustarAncho(texto: string, ancho: number): string {
  if (texto.length > ancho) {
    return texto.substring(0, ancho - 3) + '...';
  }
  return texto + ' '.repeat(ancho - texto.length);
}

/**
 * Calcula la distancia entre dos coordenadas usando la fórmula de Haversine
 */
export function calcularDistanciaHaversine(
  lat1?: number | null,
  lng1?: number | null,
  lat2?: number | null,
  lng2?: number | null
): string | null {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) {
    return null;
  }
  
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = R * c;
  
  return distancia.toFixed(1);
}

/**
 * Genera el contenido completo del reporte en formato HOJA DE CONTROL DE PATRULLAJES
 * 
 * @param rutas - Rutas/patrullajes a incluir
 * @param guardarecursos - Lista de guardarecursos
 * @param areasProtegidas - Lista de áreas protegidas
 * @param guardarecursoSeleccionado - ID del guardarecurso seleccionado
 * @param fechaInicio - Fecha inicio filtro (opcional)
 * @param fechaFin - Fecha fin filtro (opcional)
 * @returns Contenido del reporte formateado
 */
export function generarReportePatrullajes(
  rutas: Actividad[],
  guardarecursos: any[],
  areasProtegidas: any[],
  guardarecursoSeleccionado: string,
  fechaInicio?: string,
  fechaFin?: string
): string {
  const gr = guardarecursos.find(g => g.id === guardarecursoSeleccionado);
  const area = gr ? areasProtegidas.find(a => a.id === gr.areaAsignada) : null;
  
  const anchoLinea = 140;
  const separador = '═'.repeat(anchoLinea);
  const lineaDelgada = '─'.repeat(anchoLinea);
  
  let content = '';
  
  // Encabezado
  content += separador + '\n';
  content += centrarTexto('HOJA DE CONTROL DE PATRULLAJES', anchoLinea) + '\n';
  content += centrarTexto('Consejo Nacional de Áreas Protegidas - CONAP', anchoLinea) + '\n';
  content += separador + '\n\n';
  
  // Información del Guardarrecurso y Área
  if (gr) {
    content += `Nombre del Guardarrecurso: ${gr.nombre} ${gr.apellido}\n`;
    if (area) {
      content += `Área Protegida: ${area.nombre}\n`;
    }
  }
  
  // Período del reporte
  if (fechaInicio || fechaFin) {
    content += 'Período del Reporte: ';
    if (fechaInicio) content += `${format(new Date(fechaInicio), "dd/MM/yyyy", { locale: es })}`;
    if (fechaInicio && fechaFin) content += ' - ';
    if (fechaFin) content += `${format(new Date(fechaFin), "dd/MM/yyyy", { locale: es })}`;
    content += '\n';
  }
  
  content += `Total de Patrullajes: ${rutas.length}\n`;
  content += `Fecha de Generación: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}\n\n`;
  
  content += lineaDelgada + '\n';
  
  // Encabezados de tabla
  const col1 = 12;  // FECHA
  const col2 = 20;  // CÓDIGO DE ACTIVIDAD
  const col3 = 20;  // PARTICIPANTES
  const col4 = 12;  // DISTANCIA
  const col5 = 24;  // COORDENADAS (X, Y)
  const col6 = 40;  // OBSERVACIONES
  
  content += ajustarAncho('FECHA', col1) + ' │ ';
  content += ajustarAncho('CÓDIGO ACTIVIDAD', col2) + ' │ ';
  content += ajustarAncho('PARTICIPANTES', col3) + ' │ ';
  content += ajustarAncho('DISTANCIA', col4) + ' │ ';
  content += ajustarAncho('COORDENADAS (X, Y)', col5) + ' │ ';
  content += ajustarAncho('OBSERVACIONES', col6) + '\n';
  
  content += lineaDelgada + '\n';
  
  // Datos de cada ruta
  if (rutas.length === 0) {
    content += centrarTexto('No hay patrullajes registrados en el período seleccionado', anchoLinea) + '\n';
  } else {
    rutas.forEach((ruta) => {
      const fecha = format(new Date(ruta.fecha), 'dd/MM/yyyy', { locale: es });
      const codigoActividad = ruta.id.substring(0, 18) || 'N/A';
      
      // Participantes - obtener nombre del guardarrecurso
      const guardarecurso = guardarecursos.find(g => g.id === ruta.guardarecurso);
      const participantes = guardarecurso 
        ? `${guardarecurso.nombre} ${guardarecurso.apellido}`.substring(0, 20)
        : 'N/A';
      
      // Distancia recorrida
      let distancia = 'N/A';
      if (ruta.coordenadasInicio && ruta.coordenadasFin) {
        const dist = calcularDistanciaHaversine(
          ruta.coordenadasInicio.lat,
          ruta.coordenadasInicio.lng,
          ruta.coordenadasFin.lat,
          ruta.coordenadasFin.lng
        );
        distancia = dist ? `${dist} km` : 'N/A';
      }
      
      // Coordenadas - mostrar inicio (X=lng, Y=lat)
      let coordenadas = 'Sin GPS';
      if (ruta.coordenadasInicio) {
        coordenadas = `${ruta.coordenadasInicio.lng.toFixed(4)}, ${ruta.coordenadasInicio.lat.toFixed(4)}`;
      }
      
      // Observaciones (act_descripcion)
      const observaciones = (ruta.descripcion || 'Ninguna').substring(0, 40);
      
      // Formatear fila
      content += ajustarAncho(fecha, col1) + ' │ ';
      content += ajustarAncho(codigoActividad, col2) + ' │ ';
      content += ajustarAncho(participantes, col3) + ' │ ';
      content += ajustarAncho(distancia, col4) + ' │ ';
      content += ajustarAncho(coordenadas, col5) + ' │ ';
      content += ajustarAncho(observaciones, col6) + '\n';
    });
  }
  
  content += lineaDelgada + '\n\n';
  
  // Espacio para firma
  content += '\n\n\n';
  content += 'Firma: ___________________________________\n\n';
  
  content += separador + '\n';
  content += centrarTexto('FIN DEL REPORTE', anchoLinea) + '\n';
  content += separador + '\n';
  
  return content;
}

/**
 * Genera el reporte de patrullajes en formato PDF con el diseño oficial de CONAP
 * 
 * @param rutas - Rutas/patrullajes a incluir
 * @param guardarecursos - Lista de guardarecursos
 * @param areasProtegidas - Lista de áreas protegidas
 * @param guardarecursoSeleccionado - ID del guardarecurso seleccionado
 * @param fechaInicio - Fecha inicio filtro (opcional)
 * @param fechaFin - Fecha fin filtro (opcional)
 * @param logoBase64 - Logo de CONAP en Base64
 */
export async function generarReportePDF(
  rutas: Actividad[],
  guardarecursos: any[],
  areasProtegidas: any[],
  guardarecursoSeleccionado: string,
  fechaInicio?: string,
  fechaFin?: string,
  logoBase64?: string
): Promise<void> {
  try {
    // Buscar guardarrecurso por ID (usr_id)
    const gr = guardarecursos.find(g => g.id === guardarecursoSeleccionado);
    // Buscar área protegida por ID (ar_id = usr_area del guardarrecurso)
    const area = gr && gr.areaAsignada ? areasProtegidas.find(a => a.id === gr.areaAsignada) : null;

    // Crear documento PDF en orientación horizontal (landscape)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'letter'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Logo CONAP en la esquina superior derecha - MÁS PEQUEÑO
    if (logoBase64) {
      try {
        if (logoBase64 && typeof logoBase64 === 'string' && logoBase64.length > 0) {
          // Logo reducido a 20x20mm y mejor posicionado
          doc.addImage(logoBase64, 'PNG', pageWidth - 38, 15, 20, 20);
        }
      } catch (error) {
        console.warn('⚠️ No se pudo cargar el logo CONAP:', error);
        // Continuar sin el logo
      }
    }

    // Título principal - Movido más abajo
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('HOJA DE CONTROL DE PATRULLAJES', pageWidth / 2, 25, { align: 'center' });
    
    // Subtítulo
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Consejo Nacional de Áreas Protegidas - CONAP', pageWidth / 2, 31, { align: 'center' });
    
    // Línea divisoria decorativa
    doc.setDrawColor(22, 163, 74); // Verde CONAP
    doc.setLineWidth(0.5);
    doc.line(margin, 35, pageWidth - margin, 35);

    // Información del guardarrecurso y área
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    
    // Recuadro para nombre del guardarrecurso
    const nombreLabel = 'Nombre del Guardarrecursos:';
    const nombreValue = gr ? `${gr.nombre} ${gr.apellido}` : '';
    doc.rect(margin, 40, 120, 7, 'S');
    doc.setFont('helvetica', 'bold');
    doc.text(nombreLabel, margin + 2, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(nombreValue, margin + 60, 45);

    // Recuadro para firma
    const firmaX = pageWidth - margin - 80;
    if (firmaX > 0 && !isNaN(firmaX)) {
      doc.rect(firmaX, 40, 80, 7, 'S');
      doc.setFont('helvetica', 'bold');
      doc.text('Firma:', firmaX + 2, 45);
    }

    // Recuadro para área protegida
    doc.rect(margin, 48, 120, 7, 'S');
    doc.setFont('helvetica', 'bold');
    doc.text('Área Protegida:', margin + 2, 53);
    doc.setFont('helvetica', 'normal');
    const areaValue = area ? area.nombre : '';
    doc.text(areaValue, margin + 35, 53);

    // Período y total de patrullajes (información adicional)
    let yPos = 60;
    if (fechaInicio || fechaFin) {
      doc.setFontSize(9);
      let periodoText = 'Período: ';
      if (fechaInicio) periodoText += format(new Date(fechaInicio), 'dd/MM/yyyy', { locale: es });
      if (fechaInicio && fechaFin) periodoText += ' - ';
      if (fechaFin) periodoText += format(new Date(fechaFin), 'dd/MM/yyyy', { locale: es });
      doc.text(periodoText, margin, yPos);
      yPos += 5;
    }

    doc.setFontSize(9);
    doc.text(`Total de Patrullajes: ${rutas.length}`, margin, yPos);
    doc.text(`Fecha de Generación: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, pageWidth - margin - 60, yPos);

    // Preparar datos para la tabla
    const tableData = rutas.map((ruta) => {
      const fecha = format(new Date(ruta.fecha), 'dd/MM/yyyy', { locale: es });
      // Usar act_codigo si existe, sino usar act_id (primeros 15 caracteres)
      const codigoActividad = ruta.codigo || ruta.id.substring(0, 15) || 'N/A';
      
      // Participantes (act_usuario)
      const guardarecurso = guardarecursos.find(g => g.id === ruta.guardarecurso);
      const participantes = guardarecurso 
        ? `${guardarecurso.nombre} ${guardarecurso.apellido}`
        : 'N/A';
      
      // Distancia recorrida (calculada entre act_latitud_inicio/act_longitud_inicio y act_latitud_fin/act_longitud_fin)
      let distancia = 'N/A';
      if (ruta.coordenadasInicio && ruta.coordenadasFin) {
        const dist = calcularDistanciaHaversine(
          ruta.coordenadasInicio.lat,
          ruta.coordenadasInicio.lng,
          ruta.coordenadasFin.lat,
          ruta.coordenadasFin.lng
        );
        distancia = dist ? `${dist} km` : 'N/A';
      }
      
      // Coordenadas Inicio (X=lng, Y=lat)
      const coordInicio = ruta.coordenadasInicio 
        ? `${ruta.coordenadasInicio.lat.toFixed(4)}, ${ruta.coordenadasInicio.lng.toFixed(4)}`
        : 'N/A';
      
      // Coordenadas Fin (X=lng, Y=lat)
      const coordFin = ruta.coordenadasFin 
        ? `${ruta.coordenadasFin.lat.toFixed(4)}, ${ruta.coordenadasFin.lng.toFixed(4)}`
        : 'N/A';
      
      // Observaciones (act_descripcion - descripción de la actividad)
      const observaciones = ruta.descripcion || 'Ninguna';
      
      return [fecha, codigoActividad, participantes, distancia, coordInicio, coordFin, observaciones];
    });

    // Calcular ancho disponible para la tabla
    const availableWidth = pageWidth - (2 * margin);
    
    // Crear tabla con encabezado jerárquico personalizado
    autoTable(doc, {
      startY: yPos + 5,
      head: [
        // Primera fila: encabezados principales
        [
          { content: 'FECHA', rowSpan: 2 },
          { content: 'CÓDIGO DE\nACTIVIDAD', rowSpan: 2 },
          { content: 'PARTICIPANTES', rowSpan: 2 },
          { content: 'DISTANCIA\nRECORRIDA', rowSpan: 2 },
          { content: 'Coordenadas', colSpan: 2 },
          { content: 'OBSERVACIONES', rowSpan: 2 }
        ],
        // Segunda fila: subencabezados de coordenadas
        [
          { content: 'Inicio', colSpan: 1 },
          { content: 'Fin', colSpan: 1 }
        ]
      ],
      body: tableData.length > 0 ? tableData : [['', '', '', '', '', '', 'No hay patrullajes registrados']],
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        valign: 'middle',
        halign: 'center',
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.3,
        lineColor: [0, 0, 0]
      },
      columnStyles: {
        0: { cellWidth: 22, halign: 'center' }, // FECHA
        1: { cellWidth: 28, halign: 'center' }, // CÓDIGO DE ACTIVIDAD
        2: { cellWidth: 40, halign: 'left' },   // PARTICIPANTES
        3: { cellWidth: 22, halign: 'center' }, // DISTANCIA RECORRIDA
        4: { cellWidth: 22, halign: 'center' }, // Inicio
        5: { cellWidth: 22, halign: 'center' }, // Fin
        6: { cellWidth: 'auto', halign: 'left' }    // OBSERVACIONES (auto-ajusta al espacio restante)
      },
      margin: { left: margin, right: margin },
      tableWidth: availableWidth,
      tableLineColor: [0, 0, 0],
      tableLineWidth: 0.3
    });

    // Guardar el PDF
    const nombreArchivo = `hoja_control_patrullajes_${format(new Date(), 'yyyy-MM-dd', { locale: es })}.pdf`;
    doc.save(nombreArchivo);
    
  } catch (error) {
    console.error('❌ Error al generar PDF de patrullajes:', error);
    throw error; // Re-lanzar el error para que sea manejado por el componente
  }
}

/**
 * Convierte una imagen a Base64
 * @param imageSrc - Ruta o URL de la imagen
 * @returns Promise con la imagen en Base64
 */
export async function convertirImagenABase64(imageSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Si ya es una imagen en base64, devolverla directamente
      if (imageSrc.startsWith('data:image')) {
        resolve(imageSrc);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            resolve(dataURL);
          } else {
            reject(new Error('No se pudo obtener el contexto del canvas'));
          }
        } catch (error) {
          console.error('❌ Error al procesar imagen en canvas:', error);
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        console.error('❌ Error al cargar imagen:', error);
        reject(new Error('No se pudo cargar la imagen'));
      };
      
      img.src = imageSrc;
    } catch (error) {
      console.error('❌ Error en convertirImagenABase64:', error);
      reject(error);
    }
  });
}