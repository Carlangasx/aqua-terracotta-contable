
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

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

function generateDocumentHTML(document: DocumentData): string {
  console.log('Generating HTML for document:', document.id);
  console.log('Raw productos field:', document.productos);
  console.log('Raw extras field:', document.extras);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: document.moneda || 'USD',
  }).format(amount);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-VE');
  
  const getDocumentTitle = (tipo: string) => {
    switch (tipo) {
      case 'FACT': return 'FACTURA';
      case 'NDE': return 'NOTA DE ENTREGA';
      case 'REC': return 'RECIBO';
      case 'SAL': return 'SALIDA DE ALMACÉN';
      case 'NCRE': return 'NOTA DE CRÉDITO';
      default: return 'DOCUMENTO';
    }
  };

  // Parse JSON fields properly with extra safety
  const productos = parseJsonField(document.productos);
  const extras = parseJsonField(document.extras);

  console.log('Parsed productos:', productos);
  console.log('Parsed extras:', extras);

  const subtotal = document.total / (1 - (document.descuento / 100));
  const descuentoAmount = subtotal * (document.descuento / 100);
  
  // Combine all items with proper error handling
  const allItems = [];
  
  // Add products
  try {
    productos.forEach((p: any) => {
      allItems.push({
        descripcion: p.nombre || p.descripcion || 'Producto sin nombre',
        cantidad: p.cantidad || 1,
        precio_unitario: p.precio_unitario || p.precio || 0,
        subtotal: p.subtotal || 0
      });
    });
  } catch (error) {
    console.error('Error processing productos:', error);
  }

  // Add extras
  try {
    extras.forEach((e: any) => {
      allItems.push({
        descripcion: e.nombre || e.descripcion || `${e.tipo || 'Extra'}`,
        cantidad: e.cantidad || 1,
        precio_unitario: e.precio || 0,
        subtotal: e.subtotal || e.precio || 0
      });
    });
  } catch (error) {
    console.error('Error processing extras:', error);
  }

  console.log('Final allItems:', allItems);

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${getDocumentTitle(document.tipo_documento)} #${document.numero_documento}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.4;
                color: #333;
                background: white;
            }
            
            .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 40px 30px;
                background: white;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 40px;
                border-bottom: 3px solid #16a34a;
                padding-bottom: 20px;
            }
            
            .company-info {
                flex: 1;
            }
            
            .company-name {
                font-size: 28px;
                font-weight: bold;
                color: #16a34a;
                margin-bottom: 8px;
            }
            
            .company-tagline {
                color: #6b7280;
                font-size: 14px;
            }
            
            .invoice-details {
                text-align: right;
                flex: 1;
            }
            
            .invoice-title {
                font-size: 24px;
                font-weight: bold;
                color: #374151;
                margin-bottom: 8px;
            }
            
            .invoice-number {
                color: #6b7280;
                font-size: 14px;
                margin-bottom: 4px;
            }
            
            .invoice-date {
                color: #6b7280;
                font-size: 14px;
            }
            
            .client-section {
                margin-bottom: 30px;
                background: #f9fafb;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #16a34a;
            }
            
            .section-title {
                font-size: 16px;
                font-weight: bold;
                color: #374151;
                margin-bottom: 12px;
            }
            
            .client-info {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            }
            
            .info-row {
                display: flex;
                align-items: center;
            }
            
            .info-label {
                font-weight: 600;
                color: #6b7280;
                min-width: 120px;
            }
            
            .info-value {
                color: #374151;
            }
            
            .products-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            .products-table th {
                background: #16a34a;
                color: white;
                padding: 15px 12px;
                text-align: left;
                font-weight: 600;
                font-size: 14px;
            }
            
            .products-table td {
                padding: 12px;
                border-bottom: 1px solid #e5e7eb;
                font-size: 14px;
            }
            
            .products-table tr:nth-child(even) {
                background: #f9fafb;
            }
            
            .text-right {
                text-align: right;
            }
            
            .text-center {
                text-align: center;
            }
            
            .totals-section {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 40px;
            }
            
            .totals-table {
                min-width: 300px;
            }
            
            .totals-table tr {
                border-bottom: 1px solid #e5e7eb;
            }
            
            .totals-table tr:last-child {
                border-bottom: 2px solid #16a34a;
                font-weight: bold;
                font-size: 16px;
            }
            
            .totals-table td {
                padding: 8px 12px;
            }
            
            .totals-table .label {
                color: #6b7280;
                text-align: right;
                padding-right: 20px;
            }
            
            .totals-table .amount {
                font-family: 'Courier New', monospace;
                text-align: right;
                font-weight: 600;
            }
            
            .notes-section {
                margin-bottom: 40px;
            }
            
            .notes-content {
                background: #f3f4f6;
                padding: 15px;
                border-radius: 6px;
                color: #4b5563;
                font-style: italic;
            }
            
            .footer {
                text-align: center;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 12px;
            }
            
            .legal-notice {
                background: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 6px;
                padding: 12px;
                text-align: center;
                font-weight: 600;
                color: #92400e;
                margin-top: 20px;
            }
            
            @media print {
                .invoice-container {
                    margin: 0;
                    padding: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <!-- Header -->
            <div class="header">
                <div class="company-info">
                    <div class="company-name">PrintMatch PRO</div>
                    <div class="company-tagline">Soluciones de Impresión Profesional</div>
                </div>
                <div class="invoice-details">
                    <div class="invoice-title">${getDocumentTitle(document.tipo_documento)}</div>
                    <div class="invoice-number">N° ${document.numero_documento}</div>
                    <div class="invoice-date">Fecha: ${formatDate(document.fecha_emision)}</div>
                </div>
            </div>

            <!-- Client Information -->
            <div class="client-section">
                <div class="section-title">Datos del Cliente</div>
                <div class="client-info">
                    <div class="info-row">
                        <span class="info-label">Empresa:</span>
                        <span class="info-value">${document.clientes.nombre_empresa}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">RIF:</span>
                        <span class="info-value">${document.clientes.rif}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Dirección:</span>
                        <span class="info-value">${document.clientes.direccion_fiscal || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Teléfono:</span>
                        <span class="info-value">${document.clientes.telefono_empresa || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <!-- Products Table -->
            <table class="products-table">
                <thead>
                    <tr>
                        <th>Descripción</th>
                        <th class="text-center">Cant.</th>
                        <th class="text-right">Precio Unit.</th>
                        <th class="text-right">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${allItems.length > 0 ? allItems.map(item => `
                        <tr>
                            <td>${item.descripcion}</td>
                            <td class="text-center">${item.cantidad}</td>
                            <td class="text-right">${formatCurrency(item.precio_unitario)}</td>
                            <td class="text-right">${formatCurrency(item.subtotal)}</td>
                        </tr>
                    `).join('') : `
                        <tr>
                            <td colspan="4" class="text-center">No hay productos o servicios registrados</td>
                        </tr>
                    `}
                </tbody>
            </table>

            <!-- Totals -->
            <div class="totals-section">
                <table class="totals-table">
                    <tr>
                        <td class="label">Subtotal:</td>
                        <td class="amount">${formatCurrency(subtotal)}</td>
                    </tr>
                    ${document.descuento > 0 ? `
                    <tr>
                        <td class="label">Descuento (${document.descuento}%):</td>
                        <td class="amount">-${formatCurrency(descuentoAmount)}</td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td class="label">Total:</td>
                        <td class="amount">${formatCurrency(document.total)}</td>
                    </tr>
                </table>
            </div>
            
            <!-- Payment Terms -->
            <div class="notes-section">
                <div class="section-title">Condiciones de Pago</div>
                <div class="notes-content">${document.condiciones_pago}</div>
            </div>

            ${document.observaciones ? `
            <!-- Notes -->
            <div class="notes-section">
                <div class="section-title">Observaciones</div>
                <div class="notes-content">${document.observaciones}</div>
            </div>
            ` : ''}

            <!-- Footer -->
            <div class="footer">
                <p>Generado por PrintMatch PRO - ${new Date().toLocaleDateString('es-VE')}</p>
                <div class="legal-notice">
                    DOCUMENTO SIN VALIDEZ FISCAL
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Generate HTML
    const html = generateDocumentHTML(document as DocumentData);

    // Return the HTML directly 
    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${document.tipo_documento}-${document.numero_documento}.html"`,
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
