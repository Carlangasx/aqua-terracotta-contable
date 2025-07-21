
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
      console.log('Successfully parsed JSON field:', parsed);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error parsing JSON field:', e);
      console.log('Field value was:', field);
      return [];
    }
  }
  if (Array.isArray(field)) {
    console.log('Field is already an array:', field);
    return field;
  }
  console.log('Field is neither string nor array, returning empty array. Field:', field);
  return [];
}

function getDocumentTitle(tipo: string): string {
  switch (tipo) {
    case 'FACT': return 'FACTURA';
    case 'NDE': return 'NOTA DE ENTREGA';
    case 'REC': return 'RECIBO';
    case 'SAL': return 'SALIDA DE ALMACÉN';
    case 'NCRE': return 'NOTA DE CRÉDITO';
    default: return 'DOCUMENTO';
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('PDF generation function v2 started');
    
    const { documentId } = await req.json();

    if (!documentId) {
      throw new Error('ID de documento requerido');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching document data for ID:', documentId);

    // Fetch document data with client information
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

    if (error) {
      console.error('Error fetching document:', error);
      throw new Error('Error al obtener los datos del documento');
    }

    if (!document) {
      throw new Error('Documento no encontrado');
    }

    console.log('Document data retrieved:', { 
      id: document.id, 
      numero: document.numero_documento,
      productos: typeof document.productos,
      extras: typeof document.extras 
    });

    console.log('Generating PDF using jsPDF...');
    
    // Create new PDF document
    const doc = new jsPDF();
    
    // Set font
    doc.setFont('helvetica');
    
    // Add header
    doc.setFontSize(20);
    doc.setTextColor(22, 163, 74); // Green color
    doc.text('PrintMatch PRO', 20, 25);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(getDocumentTitle(document.tipo_documento), 150, 25);
    doc.text(`N° ${document.numero_documento}`, 150, 35);
    doc.text(`Fecha: ${new Date(document.fecha_emision).toLocaleDateString('es-VE')}`, 150, 45);
    
    // Add client info
    let yPos = 65;
    doc.setFontSize(14);
    doc.text('DATOS DEL CLIENTE', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.text(`Empresa: ${document.clientes.nombre_empresa}`, 20, yPos);
    yPos += 7;
    doc.text(`RIF: ${document.clientes.rif}`, 20, yPos);
    yPos += 7;
    doc.text(`Dirección: ${document.clientes.direccion_fiscal || 'N/A'}`, 20, yPos);
    yPos += 7;
    doc.text(`Teléfono: ${document.clientes.telefono_empresa || 'N/A'}`, 20, yPos);
    
    // Add products table
    yPos += 20;
    doc.setFontSize(12);
    doc.text('PRODUCTOS/SERVICIOS', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(9);
    doc.text('Descripción', 20, yPos);
    doc.text('Cant.', 120, yPos);
    doc.text('Precio Unit.', 140, yPos);
    doc.text('Subtotal', 170, yPos);
    
    yPos += 5;
    doc.line(20, yPos, 190, yPos); // Horizontal line
    
    // Parse and add items
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
    
    yPos += 7;
    allItems.forEach((item) => {
      if (yPos > 270) { // Check if we need a new page
        doc.addPage();
        yPos = 25;
      }
      
      doc.text(item.descripcion.substring(0, 50), 20, yPos);
      doc.text(item.cantidad.toString(), 120, yPos);
      doc.text(`$${item.precio_unitario.toFixed(2)}`, 140, yPos);
      doc.text(`$${item.subtotal.toFixed(2)}`, 170, yPos);
      yPos += 7;
    });
    
    // Add totals
    yPos += 10;
    doc.line(140, yPos, 190, yPos); // Horizontal line
    yPos += 7;
    
    const subtotal = document.total / (1 - (document.descuento / 100));
    const descuentoAmount = subtotal * (document.descuento / 100);
    
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 140, yPos);
    yPos += 7;
    
    if (document.descuento > 0) {
      doc.text(`Descuento (${document.descuento}%): -$${descuentoAmount.toFixed(2)}`, 140, yPos);
      yPos += 7;
    }
    
    doc.setFontSize(11);
    doc.text(`TOTAL: $${document.total.toFixed(2)}`, 140, yPos);
    
    // Add payment terms and notes
    yPos += 15;
    doc.setFontSize(10);
    doc.text('Condiciones de Pago:', 20, yPos);
    yPos += 7;
    doc.text(document.condiciones_pago || 'Contado', 20, yPos);
    
    if (document.observaciones) {
      yPos += 10;
      doc.text('Observaciones:', 20, yPos);
      yPos += 7;
      doc.text(document.observaciones.substring(0, 100), 20, yPos);
    }
    
    // Add footer
    yPos += 20;
    doc.setFontSize(8);
    doc.text('Generado por PrintMatch PRO', 20, yPos);
    doc.text('DOCUMENTO SIN VALIDEZ FISCAL', 20, yPos + 7);
    
    // Generate PDF buffer
    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBuffer = new Uint8Array(pdfArrayBuffer);
    
    console.log('PDF generated successfully with jsPDF, size:', pdfBuffer.length);

    // Return the PDF as binary data
    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${document.tipo_documento}-${document.numero_documento}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error('Error in generate-invoice-pdf function:', error);
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
