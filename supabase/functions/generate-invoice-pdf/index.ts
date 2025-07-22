
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import jsPDF from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductoItem {
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface ExtraItem {
  tipo?: string;
  descripcion?: string;
  nombre?: string;
  precio: number;
  cantidad?: number;
  subtotal?: number;
}

interface DocumentData {
  id: number;
  numero_documento: string;
  tipo_documento: string;
  fecha_emision: string;
  total: number;
  descuento: number;
  observaciones?: string;
  condiciones_pago: string;
  moneda: string;
  productos: string | ProductoItem[];
  extras: string | ExtraItem[];
  clientes: {
    nombre_empresa: string;
    rif: string;
    direccion_fiscal: string;
    telefono_empresa?: string;
    correo?: string;
  };
}

function parseJsonField(field: string | any[]): any[] {
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return Array.isArray(field) ? field : [];
}

function getDocumentTitle(tipo: string): string {
  switch (tipo) {
    case 'FACT': return 'FACTURA';
    case 'NDE': return 'NOTA DE ENTREGA';
    case 'REC': return 'RECIBO';
    case 'SAL': return 'SALIDA DE ALMACÉN';
    case 'NCRE': return 'NOTA DE CRÉDITO';
    case 'NC': return 'NOTA DE CRÉDITO';
    case 'CAC': return 'CERTIFICADO DE ANÁLISIS DE CALIDAD';
    case 'COT': return 'COTIZACIÓN';
    default: return 'COTIZACIÓN';
  }
}

function getDocumentConditions(tipo: string): string[] {
  switch (tipo) {
    case 'COT':
      return [
        'Validez del presupuesto: 05 días.',
        'Tiempo de entrega acordado por ambas partes, a partir de la aprobación de los artes por correo.',
        'Forma de pago: 70% al aprobar la cotización, 30% al entregar.',
        'La cantidad producida puede variar en un +/-5%, diferencia que se tomará en cuenta al momento de facturar.'
      ];
    case 'FACT':
      return [
        'Gracias por su preferencia.',
        'Este documento constituye un comprobante fiscal válido.'
      ];
    case 'NDE':
      return [
        'Mercancía entregada en perfecto estado.',
        'Favor verificar cantidad y calidad al momento de la entrega.'
      ];
    case 'SAL':
      return [
        'Salida autorizada de almacén.',
        'Verificar inventario al momento de la salida.'
      ];
    default:
      return [
        'Documento generado por el sistema.',
        'Verificar información antes de proceder.'
      ];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId } = await req.json();

    if (!documentId) {
      throw new Error('ID de documento requerido');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch document data
    const { data: document, error } = await supabase
      .from('documentos_generados')
      .select(`
        *,
        clientes (
          nombre_empresa,
          rif,
          direccion_fiscal,
          telefono_empresa,
          correo
        )
      `)
      .eq('id', documentId)
      .single();

    if (error || !document) {
      throw new Error('Documento no encontrado');
    }

    // Fetch company configuration
    const { data: empresa } = await supabase
      .from('configuracion_empresa')
      .select('*')
      .single();

    // Create PDF with LITOARTE format
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Set default font
    doc.setFont('helvetica', 'normal');
    
    // HEADER SECTION - Company Logo and Info (Left Side)
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('LITOARTE C.A.', 20, 25);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Calle San Pascual el Carmen, Casa N° 43. Sector Sarria. Caracas. Zona Postal 1010', 20, 32);

    // DOCUMENT TITLE AND NUMBER (Right Side)
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const documentTitle = getDocumentTitle(document.tipo_documento);
    doc.text(`${documentTitle} Nro.`, 120, 25);
    
    // Extract year from numero_documento or use current year
    const currentYear = new Date(document.fecha_emision).getFullYear();
    const documentNumber = document.numero_documento.replace(/[A-Z-]/g, ''); // Remove letters and hyphens
    doc.text(`${currentYear} ${documentNumber}`, 120, 32);
    
    // Date and Location
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const formattedDate = new Date(document.fecha_emision).toLocaleDateString('es-VE', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
    doc.text(`Caracas, ${formattedDate}`, 120, 39);

    // CLIENT SECTION
    let yPos = 55;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Cliente:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(document.clientes.nombre_empresa, 45, yPos);
    
    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('RIF:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(document.clientes.rif, 35, yPos);
    
    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Contacto:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(document.clientes.persona_contacto || 'N/A', 45, yPos);
    
    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Dirección:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    const direccion = document.clientes.direccion_fiscal || 'N/A';
    const direccionWrapped = direccion.length > 60 ? direccion.substring(0, 60) + '...' : direccion;
    doc.text(direccionWrapped, 48, yPos);
    
    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Teléfono:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(document.clientes.telefono_empresa || 'N/A', 48, yPos);
    
    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Correo electrónico:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(document.clientes.correo || 'N/A', 65, yPos);

    // PRODUCTS/CONTENT TABLE SECTION
    yPos += 15;
    
    // Check if this is a CAC document to handle it differently
    if (document.tipo_documento === 'CAC') {
      // For CAC documents, show technical parameters instead of products table
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('PARÁMETROS TÉCNICOS ANALIZADOS:', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Fetch CAC results if available (this would come from cac_resultados table)
      doc.text('Dimensiones físicas:', 20, yPos);
      yPos += 6;
      doc.text('• Ancho real: N/A', 25, yPos);
      yPos += 6;
      doc.text('• Alto real: N/A', 25, yPos);
      yPos += 6;
      doc.text('• Profundidad real: N/A', 25, yPos);
      yPos += 10;
      
      doc.text('Especificaciones técnicas:', 20, yPos);
      yPos += 6;
      doc.text('• Material/Sustrato: N/A', 25, yPos);
      yPos += 6;
      doc.text('• Calibre: N/A', 25, yPos);
      yPos += 6;
      doc.text('• Colores: N/A', 25, yPos);
      yPos += 6;
      doc.text('• Barniz: N/A', 25, yPos);
      yPos += 6;
      doc.text('• Plastificado: N/A', 25, yPos);
      yPos += 10;
      
      if (document.observaciones) {
        doc.text('Observaciones:', 20, yPos);
        yPos += 6;
        const obsWrapped = document.observaciones.length > 80 ? document.observaciones.substring(0, 80) + '...' : document.observaciones;
        doc.text(obsWrapped, 25, yPos);
        yPos += 10;
      }
    } else {
      // Regular products table for other document types
      const tableStartY = yPos;
      const rowHeight = 8;
      const colWidths = [15, 20, 60, 20, 20, 25, 30]; // CÓDIGO, DESCRIPCIÓN, EXTRA, TRANSPORTE, UNIDADES, COSTO UNIT, TOTAL
      const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
      
      // Header background (light gray)
      doc.setFillColor(220, 220, 220);
      doc.rect(20, yPos, tableWidth, rowHeight, 'F');
      
      // Header borders
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(20, yPos, tableWidth, rowHeight);
      
      // Draw vertical lines for columns
      let xPos = 20;
      for (let i = 0; i < colWidths.length - 1; i++) {
        xPos += colWidths[i];
        doc.line(xPos, yPos, xPos, yPos + rowHeight);
      }
      
      // Header text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('CÓDIGO', 22, yPos + 5);
      doc.text('DESCRIPCIÓN', 42, yPos + 5);
      doc.text('EXTRA', 105, yPos + 5);
      doc.text('TRANSPORTE', 127, yPos + 5);
      doc.text('UNIDADES', 150, yPos + 5);
      doc.text('COSTO UNITARIO', 172, yPos + 5);
      doc.text('TOTAL', 200, yPos + 5);
      
      yPos += rowHeight;
      
      // Parse products and extras
      const productos = parseJsonField(document.productos);
      const extras = parseJsonField(document.extras);
      
      const allItems = [];
      let itemIndex = 1;
      
      // Add products
      productos.forEach((p: any) => {
        allItems.push({
          codigo: `P${itemIndex.toString().padStart(3, '0')}`,
          descripcion: p.nombre || p.descripcion || 'Producto sin nombre',
          extra: '',
          transporte: '',
          cantidad: p.cantidad || 1,
          precio_unitario: p.precio_unitario || p.precio || 0,
          subtotal: p.subtotal || 0
        });
        itemIndex++;
      });
      
      // Add extras
      extras.forEach((e: any) => {
        allItems.push({
          codigo: `E${itemIndex.toString().padStart(3, '0')}`,
          descripcion: e.nombre || e.descripcion || `${e.tipo || 'Extra'}`,
          extra: 'X',
          transporte: e.tipo === 'transporte' ? 'X' : '',
          cantidad: e.cantidad || 1,
          precio_unitario: e.precio || 0,
          subtotal: e.subtotal || e.precio || 0
        });
        itemIndex++;
      });
      
      // Table rows
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      allItems.forEach((item, index) => {
        // Alternate row background
        if (index % 2 === 1) {
          doc.setFillColor(245, 245, 245);
          doc.rect(20, yPos, tableWidth, rowHeight, 'F');
        }
        
        // Row border
        doc.rect(20, yPos, tableWidth, rowHeight);
        
        // Draw vertical lines for columns
        xPos = 20;
        for (let i = 0; i < colWidths.length - 1; i++) {
          xPos += colWidths[i];
          doc.line(xPos, yPos, xPos, yPos + rowHeight);
        }
        
        // Cell content
        doc.text(item.codigo, 22, yPos + 5);
        
        // Wrap description text if too long
        const description = item.descripcion.length > 35 ? 
          item.descripcion.substring(0, 35) + '...' : item.descripcion;
        doc.text(description, 42, yPos + 5);
        
        doc.text(item.extra, 107, yPos + 5);
        doc.text(item.transporte, 135, yPos + 5);
        doc.text(item.cantidad.toString(), 152, yPos + 5);
        doc.text(`$${item.precio_unitario.toFixed(2)}`, 175, yPos + 5);
        doc.text(`$${item.subtotal.toFixed(2)}`, 202, yPos + 5);
        
        yPos += rowHeight;
      });
    }
    
    // TOTALS SECTION - Only for non-CAC documents
    if (document.tipo_documento !== 'CAC') {
      yPos += 10;
      
      // Calculate totals properly
      const baseTotal = document.total || 0;
      const descuentoAmount = (document.descuento / 100) * baseTotal;
      const subtotalAfterDiscount = baseTotal - descuentoAmount;
      
      // Only calculate IVA for invoices (FACT)
      const shouldCalculateIVA = document.tipo_documento === 'FACT';
      const iva = shouldCalculateIVA ? subtotalAfterDiscount * 0.16 : 0;
      const finalTotal = subtotalAfterDiscount + iva;
      
      // Totals box positioned to the right
      const totalsX = 140;
      const totalsBoxWidth = 50;
      const totalsBoxHeight = shouldCalculateIVA ? 30 : 20;
      
      // Draw totals box
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.rect(totalsX, yPos, totalsBoxWidth, totalsBoxHeight);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      let totalsYPos = yPos + 6;
      doc.text('Subtotal:', totalsX + 2, totalsYPos);
      doc.text(`$${baseTotal.toFixed(2)}`, totalsX + 25, totalsYPos);
      totalsYPos += 5;
      
      if (document.descuento > 0) {
        doc.text(`Desc. (${document.descuento}%):`, totalsX + 2, totalsYPos);
        doc.text(`-$${descuentoAmount.toFixed(2)}`, totalsX + 25, totalsYPos);
        totalsYPos += 5;
      }
      
      if (shouldCalculateIVA) {
        doc.text('IVA (16%):', totalsX + 2, totalsYPos);
        doc.text(`$${iva.toFixed(2)}`, totalsX + 25, totalsYPos);
        totalsYPos += 5;
      }
      
      // Final total line
      doc.setFont('helvetica', 'bold');
      doc.line(totalsX + 2, totalsYPos - 1, totalsX + totalsBoxWidth - 2, totalsYPos - 1);
      doc.text('TOTAL:', totalsX + 2, totalsYPos + 3);
      doc.text(`$${finalTotal.toFixed(2)}`, totalsX + 25, totalsYPos + 3);
      
      yPos += totalsBoxHeight + 10;
    }
    
    // CONDITIONS SECTION
    const conditions = getDocumentConditions(document.tipo_documento);
    if (conditions.length > 0 && document.tipo_documento !== 'CAC') {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      conditions.forEach(condition => {
        doc.text(condition, 20, yPos);
        yPos += 6;
      });
      yPos += 5;
    }
    
    // SIGNATURE SECTION
    if (document.tipo_documento === 'COT' || document.tipo_documento === 'FACT') {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Firma y Sello:', 20, yPos);
      doc.line(20, yPos + 15, 90, yPos + 15); // Signature line
      yPos += 25;
    }
    
    // COMPANY FOOTER
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('LITOARTE C.A. - Especialistas en Impresión y Packaging', 20, yPos);
    yPos += 4;
    doc.text('Teléfono: (0212) 322-2590 / Email: ventas@litoarte.com.ve', 20, yPos);
    
    // LEGAL FOOTER at bottom
    doc.setFontSize(7);
    doc.text('Documento generado por PrintMatch PRO - ContaSimple', 20, 285);

    // Generate PDF buffer
    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBuffer = new Uint8Array(pdfArrayBuffer);
    
    // Create structured filename: [TIPO]_[NUMERO]_[RAZONSOCIAL].pdf
    const clientName = document.clientes.nombre_empresa.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${document.tipo_documento}_${document.numero_documento.replace(/[^a-zA-Z0-9]/g, '_')}_${clientName}.pdf`;

    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});
