
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
    case 'CAC': return 'CERTIFICADO DE ANÁLISIS DE CALIDAD';
    default: return 'COTIZACIÓN';
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
    
    // HEADER SECTION - Company Info
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('LITOARTE C.A.', 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('RIF: J-29584577-0', 20, 32);
    doc.text('Reg. Mercantil 1° Circunscripción Judicial del Estado Miranda', 20, 38);
    doc.text('Tomo: 65-A-Pro, Expediente: 201.569', 20, 44);
    doc.text('Dirección: Calle José Ignacio Liendo, Qta. Litoarte, Los Teques', 20, 50);
    doc.text('Estado Miranda - Venezuela', 20, 56);
    doc.text('Telf: 0212-322-2590 / 0212-322-1048', 20, 62);
    doc.text('Email: ventas@litoarte.com.ve', 20, 68);

    // DOCUMENT TITLE AND NUMBER
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${getDocumentTitle(document.tipo_documento)} No.`, 120, 30);
    doc.text(document.numero_documento, 120, 38);
    
    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${new Date(document.fecha_emision).toLocaleDateString('es-VE')}`, 120, 45);

    // CLIENT SECTION
    let yPos = 85;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE:', 20, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Empresa: ${document.clientes.nombre_empresa}`, 20, yPos);
    yPos += 6;
    doc.text(`RIF: ${document.clientes.rif}`, 20, yPos);
    yPos += 6;
    doc.text(`Dirección: ${document.clientes.direccion_fiscal || 'N/A'}`, 20, yPos);
    yPos += 6;
    doc.text(`Teléfono: ${document.clientes.telefono_empresa || 'N/A'}`, 20, yPos);

    // PRODUCTS TABLE
    yPos += 15;
    
    // Table headers with background
    const tableStartY = yPos;
    const rowHeight = 8;
    const colWidths = [20, 80, 25, 25, 30];
    const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
    
    // Header background (light gray)
    doc.setFillColor(230, 230, 230);
    doc.rect(20, yPos, tableWidth, rowHeight, 'F');
    
    // Header borders
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(20, yPos, tableWidth, rowHeight);
    
    // Header text
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('CANT.', 22, yPos + 5);
    doc.text('DESCRIPCIÓN', 42, yPos + 5);
    doc.text('P. UNIT.', 127, yPos + 5);
    doc.text('P. TOTAL', 155, yPos + 5);
    
    yPos += rowHeight;
    
    // Parse products and extras
    const productos = parseJsonField(document.productos);
    const extras = parseJsonField(document.extras);
    
    const allItems = [];
    productos.forEach((p: any) => {
      allItems.push({
        descripcion: p.nombre || p.descripcion || 'Producto sin nombre',
        cantidad: p.cantidad || 1,
        precio_unitario: p.precio_unitario || p.precio || 0,
        subtotal: p.subtotal || 0
      });
    });
    
    extras.forEach((e: any) => {
      allItems.push({
        descripcion: e.nombre || e.descripcion || `${e.tipo || 'Extra'}`,
        cantidad: e.cantidad || 1,
        precio_unitario: e.precio || 0,
        subtotal: e.subtotal || e.precio || 0
      });
    });
    
    // Table rows
    doc.setFont('helvetica', 'normal');
    allItems.forEach((item, index) => {
      // Alternate row background
      if (index % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(20, yPos, tableWidth, rowHeight, 'F');
      }
      
      // Row border
      doc.rect(20, yPos, tableWidth, rowHeight);
      
      // Cell content
      doc.text(item.cantidad.toString(), 22, yPos + 5);
      
      // Wrap description text if too long
      const description = item.descripcion.length > 45 ? 
        item.descripcion.substring(0, 45) + '...' : item.descripcion;
      doc.text(description, 42, yPos + 5);
      
      doc.text(`$${item.precio_unitario.toFixed(2)}`, 127, yPos + 5);
      doc.text(`$${item.subtotal.toFixed(2)}`, 155, yPos + 5);
      
      yPos += rowHeight;
    });
    
    // TOTALS SECTION
    yPos += 10;
    
    const subtotal = document.total / (1 - (document.descuento / 100));
    const descuentoAmount = subtotal * (document.descuento / 100);
    const iva = document.total * 0.16; // 16% IVA
    const totalConIva = document.total + iva;
    
    // Totals box
    const totalsX = 130;
    const totalsWidth = 60;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    doc.text('SUB-TOTAL:', totalsX, yPos);
    doc.text(`$${subtotal.toFixed(2)}`, totalsX + 35, yPos);
    yPos += 6;
    
    if (document.descuento > 0) {
      doc.text(`DESCUENTO (${document.descuento}%):`, totalsX, yPos);
      doc.text(`-$${descuentoAmount.toFixed(2)}`, totalsX + 35, yPos);
      yPos += 6;
    }
    
    doc.text('I.V.A. (16%): ', totalsX, yPos);
    doc.text(`$${iva.toFixed(2)}`, totalsX + 35, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', totalsX, yPos);
    doc.text(`$${totalConIva.toFixed(2)}`, totalsX + 35, yPos);
    
    // FOOTER SECTION
    yPos += 20;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Validity and conditions
    doc.text('Esta cotización tiene una vigencia de 15 días.', 20, yPos);
    yPos += 6;
    doc.text(`Condiciones de Pago: ${document.condiciones_pago}`, 20, yPos);
    yPos += 10;
    
    // Signature section
    doc.text('Firma y Sello:', 20, yPos);
    doc.line(20, yPos + 15, 90, yPos + 15); // Signature line
    
    // Company footer
    yPos += 25;
    doc.setFontSize(8);
    doc.text('LITOARTE C.A. - Especialistas en Impresión y Packaging', 20, yPos);
    yPos += 4;
    doc.text('www.litoarte.com.ve', 20, yPos);
    
    // Legal footer
    yPos = 280; // Bottom of page
    doc.setFontSize(7);
    doc.text('Documento generado por PrintMatch PRO', 20, yPos);

    // Generate PDF buffer
    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBuffer = new Uint8Array(pdfArrayBuffer);

    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${document.tipo_documento}-${document.numero_documento}.pdf"`,
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
