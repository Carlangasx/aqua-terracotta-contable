import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import * as XLSX from 'xlsx';

interface CotizacionCompleta {
  fecha: string;
  tipo_empaque: string;
  industria: string;
  precio_unitario: number;
  cantidad_cotizada: number;
  numero_troquel: number;
  cliente: string;
  nombre_troquel: string;
  tamaño: string;
  alto_mm: number;
  ancho_mm: number;
  profundidad_mm: number;
  sku: string;
  corte: string;
  tamaños_por_corte: string;
  tamaños_por_pliego: string;
  tamaño_especial?: string;
  nota?: string;
}

interface ImportarCotizacionesCompletasProps {
  onImportComplete: () => void;
}

export default function ImportarCotizacionesCompletas({ onImportComplete }: ImportarCotizacionesCompletasProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<CotizacionCompleta[]>([]);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'processing'>('upload');

  const downloadTemplate = () => {
    const templateData = [
      {
        'Fecha': '2024-01-15',
        'Tipo de Empaque': 'Estuche',
        'Industria': 'Farmacia',
        'Precio unitario': 0.5,
        'Cantidad cotizada': 1000,
        'Número de troquel': 101,
        'Cliente': 'Farmacia ABC',
        'Nombre troquel': 'Troquel Estándar',
        'Tamaño': '10x5x3cm',
        'Alto mm': 50,
        'Ancho mm': 100,
        'Profundidad mm': 30,
        'SKU': 'PARACETAMOL 500MG',
        'Corte': '35x50cm',
        'Tamaños por corte': '8',
        'Tamaños por pliego': '16',
        'Tamaño especial': '',
        'Nota': 'Observación opcional'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    XLSX.writeFile(wb, 'plantilla_cotizaciones_completas.xlsx');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  // Función para convertir fechas de Excel
  const convertExcelDate = (dateValue: any): string => {
    if (!dateValue) return '';
    
    // Si ya es una fecha en formato YYYY-MM-DD
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // Si es un número serial de Excel (mayor a 25000 indica fecha después de 1968)
    if (typeof dateValue === 'number' && dateValue > 25000) {
      const date = new Date((dateValue - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    
    // Intentar convertir otros formatos de fecha
    try {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (error) {
      console.warn('Could not parse date:', dateValue);
    }
    
    return '';
  };

  const processFile = (file: File) => {
    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log('Raw Excel data:', jsonData);

        const processedData = jsonData.map((row: any, index) => {
          const fechaOriginal = row['Fecha'];
          const fechaConvertida = convertExcelDate(fechaOriginal);
          
          console.log(`Fila ${index + 1}: Fecha original:`, fechaOriginal, '-> Convertida:', fechaConvertida);
          
          const cotizacion: CotizacionCompleta = {
            fecha: fechaConvertida,
            tipo_empaque: row['Tipo de Empaque'] || '',
            industria: row['Industria'] || '',
            precio_unitario: parseFloat(row['Precio unitario']) || 0,
            cantidad_cotizada: parseInt(row['Cantidad cotizada']) || 0,
            numero_troquel: parseInt(row['Número de troquel']) || 0,
            cliente: row['Cliente'] || '',
            nombre_troquel: row['Nombre troquel'] || '',
            tamaño: row['Tamaño'] || '',
            alto_mm: parseFloat(row['Alto mm']) || 0,
            ancho_mm: parseFloat(row['Ancho mm']) || 0,
            profundidad_mm: parseFloat(row['Profundidad mm']) || 0,
            sku: row['SKU'] || '',
            corte: row['Corte'] || '',
            tamaños_por_corte: row['Tamaños por corte'] || '',
            tamaños_por_pliego: row['Tamaños por pliego'] || '',
            tamaño_especial: row['Tamaño especial'] || '',
            nota: row['Nota'] || ''
          };

          return cotizacion;
        });

        console.log('Processed data:', processedData);
        setPreviewData(processedData);
        validateData(processedData);
        setCurrentStep('preview');
      } catch (error) {
        console.error('Error processing file:', error);
        toast({
          title: "Error",
          description: "Error al procesar el archivo Excel",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const validateData = (data: CotizacionCompleta[]) => {
    const errors: any[] = [];

    data.forEach((row, index) => {
      const rowErrors: string[] = [];

      // Validaciones obligatorias
      if (!row.sku) rowErrors.push('SKU es obligatorio');
      if (!row.cliente) rowErrors.push('Cliente es obligatorio');
      if (!row.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(row.fecha)) {
        rowErrors.push('Fecha debe tener formato YYYY-MM-DD');
      }

      // Validación de medidas
      if (row.alto_mm <= 0 || row.ancho_mm <= 0 || row.profundidad_mm <= 0) {
        rowErrors.push('Las medidas deben ser mayores a 0');
      }

      // Validación de precios y cantidades
      if (row.precio_unitario <= 0) rowErrors.push('Precio unitario debe ser mayor a 0');
      if (row.cantidad_cotizada <= 0) rowErrors.push('Cantidad cotizada debe ser mayor a 0');

      if (rowErrors.length > 0) {
        errors.push({
          row: index + 1,
          data: row,
          errors: rowErrors
        });
      }
    });

    setValidationErrors(errors);
  };

  const processImport = async () => {
    if (validationErrors.length > 0) {
      toast({
        title: "Error de validación",
        description: "Corrige los errores antes de continuar",
        variant: "destructive",
      });
      return;
    }

    setCurrentStep('processing');
    setLoading(true);

    try {
      let importedCount = 0;
      let errorCount = 0;
      const clientesCache = new Map(); // Cache para evitar duplicados

      for (const cotizacion of previewData) {
        try {
          console.log(`Procesando cotización: ${cotizacion.sku} para cliente: ${cotizacion.cliente}`);
          
          // Buscar o crear cliente usando cache
          let clienteId = clientesCache.get(cotizacion.cliente);
          
          if (!clienteId) {
            const { data: clienteExistente } = await supabase
              .from('clientes')
              .select('id')
              .eq('nombre_empresa', cotizacion.cliente)
              .eq('user_id', user?.id)
              .maybeSingle();

            if (clienteExistente) {
              clienteId = clienteExistente.id;
              console.log(`Cliente encontrado: ${clienteId}`);
            } else {
              // Crear cliente nuevo con RIF único
              const rifTemporal = `RIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const { data: nuevoCliente, error: clienteError } = await supabase
                .from('clientes')
                .insert({
                  nombre_empresa: cotizacion.cliente,
                  user_id: user?.id,
                  rif: rifTemporal
                })
                .select('id')
                .single();

              if (clienteError) {
                console.error('Error creando cliente:', clienteError);
                throw clienteError;
              }
              clienteId = nuevoCliente.id;
              console.log(`Cliente creado: ${clienteId}`);
            }
            
            // Guardar en cache
            clientesCache.set(cotizacion.cliente, clienteId);
          }

          // Crear cotización
          const cotizacionData = {
            cliente_id: clienteId,
            sku: cotizacion.sku,
            nombre_producto: cotizacion.sku,
            troquel_id: cotizacion.numero_troquel,
            medidas_caja_mm: {
              ancho_mm: cotizacion.ancho_mm,
              alto_mm: cotizacion.alto_mm,
              profundidad_mm: cotizacion.profundidad_mm
            },
            descripcion_montaje: cotizacion.nombre_troquel,
            cantidad_cotizada: cotizacion.cantidad_cotizada,
            precio_unitario: cotizacion.precio_unitario,
            fecha_cotizacion: cotizacion.fecha,
            corte: cotizacion.corte,
            tamaños_por_corte: cotizacion.tamaños_por_corte,
            tamaños_por_pliego: cotizacion.tamaños_por_pliego,
            observaciones: [
              cotizacion.nota,
              cotizacion.tamaño_especial ? `Tamaño especial: ${cotizacion.tamaño_especial}` : ''
            ].filter(Boolean).join(' | '),
            tipo_empaque: cotizacion.tipo_empaque.toLowerCase(),
            industria: cotizacion.industria.toLowerCase(),
            user_id: user?.id
          };

          console.log('Insertando cotización:', cotizacionData);

          const { error: cotizacionError } = await supabase
            .from('cotizaciones')
            .insert(cotizacionData);

          if (cotizacionError) {
            console.error('Error insertando cotización:', cotizacionError);
            throw cotizacionError;
          }
          
          importedCount++;
          console.log(`Cotización ${importedCount} insertada exitosamente`);
        } catch (error) {
          console.error('Error importing row:', error);
          errorCount++;
        }
      }

      console.log(`Importación completada: ${importedCount} exitosas, ${errorCount} errores`);

      // Registrar en log
      await supabase
        .from('log_cargas_cotizaciones')
        .insert({
          usuario_id: user?.id,
          nombre_archivo: file?.name || 'plantilla_cotizaciones_completas.xlsx',
          total_filas: previewData.length,
          filas_insertadas: importedCount,
          filas_con_error: errorCount,
          tamaño_archivo: file?.size || 0
        });

      toast({
        title: "Importación completada",
        description: `${importedCount} cotizaciones importadas exitosamente. ${errorCount > 0 ? `${errorCount} errores.` : ''}`,
      });

      // Delay para sincronización
      setTimeout(() => {
        onImportComplete();
        setDialogOpen(false);
        resetImport();
      }, 500);

    } catch (error) {
      console.error('Error during import:', error);
      toast({
        title: "Error",
        description: "Error durante la importación",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setPreviewData([]);
    setValidationErrors([]);
    setCurrentStep('upload');
    setLoading(false);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="shadow-lg">
          <Upload className="h-4 w-4 mr-2" />
          Cargar desde Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Cotizaciones Completas</DialogTitle>
        </DialogHeader>

        {currentStep === 'upload' && (
          <div className="space-y-4">
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={downloadTemplate}
                className="mb-4"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar Plantilla Excel
              </Button>
              <p className="text-sm text-muted-foreground mb-4">
                Descarga la plantilla, complétala con tus datos y súbela aquí
              </p>
            </div>

            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label 
                htmlFor="file-upload" 
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">Seleccionar archivo Excel</span>
                <span className="text-xs text-muted-foreground">
                  Formatos soportados: .xlsx, .xls
                </span>
              </label>
            </div>
          </div>
        )}

        {currentStep === 'preview' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">
                Vista previa ({previewData.length} filas)
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetImport}>
                  Cancelar
                </Button>
                <Button 
                  onClick={processImport}
                  disabled={validationErrors.length > 0 || loading}
                >
                  {loading ? 'Procesando...' : 'Importar Cotizaciones'}
                </Button>
              </div>
            </div>

            {validationErrors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="font-medium text-destructive">
                    {validationErrors.length} errores encontrados
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  {validationErrors.slice(0, 5).map((error, index) => (
                    <div key={index} className="text-destructive">
                      Fila {error.row}: {error.errors.join(', ')}
                    </div>
                  ))}
                  {validationErrors.length > 5 && (
                    <div className="text-muted-foreground">
                      ... y {validationErrors.length - 5} errores más
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="p-2 text-left">SKU</th>
                      <th className="p-2 text-left">Cliente</th>
                      <th className="p-2 text-left">Fecha</th>
                      <th className="p-2 text-left">Precio</th>
                      <th className="p-2 text-left">Cantidad</th>
                      <th className="p-2 text-left">Medidas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 10).map((row, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{row.sku}</td>
                        <td className="p-2">{row.cliente}</td>
                        <td className="p-2">{row.fecha}</td>
                        <td className="p-2">${row.precio_unitario}</td>
                        <td className="p-2">{row.cantidad_cotizada}</td>
                        <td className="p-2">
                          {row.ancho_mm}×{row.alto_mm}×{row.profundidad_mm}mm
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'processing' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg font-medium">Procesando cotizaciones...</p>
            <p className="text-sm text-muted-foreground">
              Esto puede tomar unos momentos
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}