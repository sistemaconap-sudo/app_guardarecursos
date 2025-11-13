/**
 * Utilidades compartidas para generación de PDFs
 */

import jsPDF from 'jspdf';

// Colores CONAP estandarizados
export const CONAP_COLORS = {
  verde: [22, 163, 74] as [number, number, number],
  verdeOscuro: [22, 101, 52] as [number, number, number],
  grisClaro: [243, 244, 246] as [number, number, number],
  blanco: [255, 255, 255] as [number, number, number],
  negro: [0, 0, 0] as [number, number, number],
};

/**
 * Agrega el encabezado estándar de CONAP a un PDF
 */
export function addConapHeader(doc: jsPDF, title?: string): void {
  // Fondo verde del encabezado
  doc.setFillColor(...CONAP_COLORS.verde);
  doc.rect(0, 0, 280, 25, 'F');
  
  // Logo/Título CONAP
  doc.setTextColor(...CONAP_COLORS.blanco);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('CONAP', 15, 12);
  
  // Subtítulo
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Consejo Nacional de Áreas Protegidas', 15, 18);
  
  // Título del reporte si se proporciona
  if (title) {
    doc.setTextColor(...CONAP_COLORS.negro);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 15, 35);
  }
}

/**
 * Agrega la fecha actual al PDF
 */
export function addGenerationDate(doc: jsPDF, x: number, y: number): void {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...CONAP_COLORS.negro);
  doc.text('Fecha de generación:', x, y);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString('es-GT'), x + 45, y);
}

/**
 * Agrega un separador horizontal
 */
export function addSeparator(doc: jsPDF, y: number): void {
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(15, y, 195, y);
}

/**
 * Configura el pie de página con número de página
 */
export function addPageNumbers(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
}
