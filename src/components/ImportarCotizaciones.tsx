import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Upload, Download, CheckCircle, XCircle, AlertCircle, 
  FileSpreadsheet, Plus, Eye, Merge, Package2
} from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";

type ImportRowCotizacion = {
  index: number;
  // Información del SKU/Producto
  sku: string;
  nombre_producto: string;
  concentracion?: string;
  cantidad_presentacion?: string;
  // Información del cliente
  cliente_nombre: string;
  // Información de cotización
  fecha_cotizacion?: string;
  cantidad_cotizada: string;
  precio_unitario: string;
  tipo_empaque: string;
  descripcion_montaje: string;
  observaciones_cotizacion?: string;
  industria: string;
  // Información del dieline/troquel
  alto_mm: string;
  ancho_mm: string;
  profundidad_mm: string;
  troquel_id?: string;
  descripcion_troquel?: string;
  layout_impresion?: string; // subformas, unidades por hoja
  estrategia_corte?: string;
  observaciones_tecnicas?: string;
  fuente_troquel?: string; // ej. archivo escaneado PDF
  // Campos calculados durante importación
  cliente_id?: string;
  cliente_exists: boolean;
  dieline_matched: boolean;
  dieline_match_type?: 'sku' | 'dimensions' | 'manual' | 'none';
  errors: string[];
  warnings: string[];
  status: 'valid' | 'error' | 'warning';
  // Para asignación manual de dielines
  selected_dieline_id?: string;
};


type Cliente = {
  id: string;
  nombre_empresa: string;
  rif: string;
};

const VALID_TIPO_EMPAQUE = ['estuche', 'caja', 'microcorrugado', 'otro'];
const VALID_INDUSTRIA = ['farmacia', 'cosmeticos', 'comida', 'otros'];

const REQUIRED_COLUMNS = [
  'SKU', 'Cliente', 'Cantidad cotizada', 'Precio unitario', 'Fecha'
];

const OPTIONAL_COLUMNS = [
  'fecha_cotizacion', 'tipo_empaque', 'descripcion_montaje', 'observaciones_cotizacion',
  'industria', 'alto_mm', 'ancho_mm', 'profundidad_mm', 'troquel_id',
  'descripcion_troquel', 'layout_impresion', 'estrategia_corte',
  'observaciones_tecnicas', 'fuente_troquel'
];

interface ImportarCotizacionesProps {
  onImportComplete: () => void;
}

const ImportarCotizaciones = ({ onImportComplete }: ImportarCotizacionesProps) => {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cotizacionesFile, setCotizacionesFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ImportRowCotizacion[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [processing, setProcessing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');

  const handleCotizacionesFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setCotizacionesFile(uploadedFile);
    setProcessing(true);
    
    try {
      await loadClientes();
      const parsedData = await parseExcelFile(uploadedFile);
      const processedData = processImportData(parsedData);
      setImportData(processedData);
      setCurrentStep('preview');
      
    } catch (error) {
      console.error('Error al procesar archivo de cotizaciones:', error);
      toast.error("Error al procesar el archivo de cotizaciones");
    } finally {
      setProcessing(false);
    }
  };


  const parseExcelFile = async (file: File): Promise<any[]> => {
    if (file.name.endsWith('.csv')) {
      const text = await file.text();
      const result = Papa.parse(text, { header: true, skipEmptyLines: true });
      return result.data as any[];
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json(sheet);
    } else {
      throw new Error("Formato de archivo no soportado. Use CSV o Excel.");
    }
  };

  const loadClientes = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nombre_empresa, rif')
      .eq('user_id', user?.id);

    if (error) {
      console.error('Error cargando clientes:', error);
      return;
    }

    setClientes(data || []);
  };

  const processImportData = (rawData: any[]): ImportRowCotizacion[] => {
    return rawData.map((row, index) => {
      const processedRow: ImportRowCotizacion = {
        index: index + 1,
        sku: row['SKU']?.toString() || '',
        nombre_producto: row['Nombre troquel']?.toString() || '',
        concentracion: '',
        cantidad_presentacion: '',
        cliente_nombre: row['Cliente']?.toString() || '',
        fecha_cotizacion: row['Fecha']?.toString() || '',
        cantidad_cotizada: row['Cantidad cotizada']?.toString() || '',
        precio_unitario: row['Precio unitario']?.toString() || '',
        tipo_empaque: row['Tipo de Empaque']?.toString() || '',
        descripcion_montaje: row['Tamaño']?.toString() || '',
        observaciones_cotizacion: row['Nota']?.toString() || '',
        industria: row['Industria']?.toString() || '',
        alto_mm: row['Alto mm']?.toString() || '',
        ancho_mm: row['Ancho mm']?.toString() || '',
        profundidad_mm: row['Profundidad mm']?.toString() || '',
        troquel_id: row['Numero de troquel']?.toString() || '',
        descripcion_troquel: row['Nombre troquel']?.toString() || '',
        layout_impresion: `${row['Tamaños por corte']?.toString() || ''} ${row['Tamaños por pliego']?.toString() || ''}`.trim(),
        estrategia_corte: row['Corte']?.toString() || '',
        observaciones_tecnicas: row['Tamaño especial']?.toString() || '',
        fuente_troquel: '',
        cliente_exists: false,
        dieline_matched: true, // Ya incluye toda la información técnica
        errors: [],
        warnings: [],
        status: 'valid'
      };

      validateRow(processedRow);
      return processedRow;
    });
  };


  const validateRow = (row: ImportRowCotizacion) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar campos requeridos básicos
    if (!row.sku) errors.push('SKU es requerido');
    if (!row.cliente_nombre) errors.push('Cliente es requerido');
    if (!row.cantidad_cotizada) errors.push('Cantidad cotizada es requerida');
    if (!row.precio_unitario) errors.push('Precio unitario es requerido');
    if (!row.fecha_cotizacion) errors.push('Fecha es requerida');

    // Validar SKU único
    if (row.sku && row.sku.length < 3) {
      warnings.push('SKU muy corto, se recomienda al menos 3 caracteres');
    }

    // Validar cliente
    if (row.cliente_nombre) {
      const clienteExistente = clientes.find(c => 
        c.nombre_empresa.toLowerCase() === row.cliente_nombre.toLowerCase()
      );
      if (clienteExistente) {
        row.cliente_id = clienteExistente.id;
        row.cliente_exists = true;
      } else {
        warnings.push('Cliente no existe, se creará uno nuevo');
      }
    }

    // Validar tipo empaque
    if (row.tipo_empaque && !VALID_TIPO_EMPAQUE.includes(row.tipo_empaque.toLowerCase())) {
      warnings.push(`Tipo de empaque '${row.tipo_empaque}' no está en la lista estándar`);
    }

    // Validar industria
    if (row.industria && !VALID_INDUSTRIA.includes(row.industria.toLowerCase())) {
      warnings.push(`Industria '${row.industria}' no está en la lista estándar`);
    }

    // Validar fecha
    if (row.fecha_cotizacion && isNaN(Date.parse(row.fecha_cotizacion))) {
      errors.push('Fecha debe tener formato válido');
    }

    // Validar números
    if (row.cantidad_cotizada && isNaN(Number(row.cantidad_cotizada))) {
      errors.push('Cantidad cotizada debe ser un número');
    }

    if (row.precio_unitario && isNaN(Number(row.precio_unitario))) {
      errors.push('Precio unitario debe ser un número');
    }

    if (row.alto_mm && isNaN(Number(row.alto_mm))) {
      errors.push('Alto debe ser un número');
    }

    if (row.ancho_mm && isNaN(Number(row.ancho_mm))) {
      errors.push('Ancho debe ser un número');
    }

    if (row.profundidad_mm && isNaN(Number(row.profundidad_mm))) {
      errors.push('Profundidad debe ser un número');
    }

    // Asignar errores y warnings
    row.errors = errors;
    row.warnings = warnings;
    row.status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid';
  };



  const createMissingCliente = async (clienteNombre: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert({
          user_id: user?.id,
          nombre_empresa: clienteNombre,
          rif: `RIF-${Date.now()}`, // RIF temporal
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creando cliente:', error);
      return null;
    }
  };

  const handleImport = async () => {
    if (!user) return;

    setImporting(true);
    setCurrentStep('importing');
    setImportProgress(0);

    const validRows = importData.filter(row => row.status === 'valid' || row.status === 'warning');
    let importedCount = 0;
    let updatedCount = 0;
    let errors: string[] = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      setImportProgress((i / validRows.length) * 100);

      try {
        // Crear cliente si no existe
        let clienteId = row.cliente_id;
        if (row.cliente_nombre && !row.cliente_exists) {
          clienteId = await createMissingCliente(row.cliente_nombre);
          if (!clienteId) {
            errors.push(`Fila ${row.index}: Error creando cliente ${row.cliente_nombre}`);
            continue;
          }
        }

        // Preparar datos de cotización
        const cotizacionData = {
          user_id: user.id,
          sku: row.sku,
          nombre_producto: row.nombre_producto,
          cliente_id: clienteId || null,
          tipo_empaque: row.tipo_empaque || null,
          industria: row.industria || null,
          descripcion_montaje: row.descripcion_montaje || null,
          cantidad_cotizada: parseInt(row.cantidad_cotizada) || 0,
          precio_unitario: parseFloat(row.precio_unitario) || 0,
          medidas_caja_mm: {
            alto_mm: parseFloat(row.alto_mm) || 0,
            ancho_mm: parseFloat(row.ancho_mm) || 0,
            profundidad_mm: parseFloat(row.profundidad_mm) || 0
          },
          troquel_id: row.troquel_id ? parseInt(row.troquel_id) : null,
          observaciones: row.observaciones_cotizacion || null,
          fecha_cotizacion: row.fecha_cotizacion || new Date().toISOString().split('T')[0]
        };

        // Insertar cotización
        const { error: insertError } = await supabase
          .from('cotizaciones')
          .insert(cotizacionData);

        if (insertError) {
          errors.push(`Fila ${row.index}: ${insertError.message}`);
        } else {
          importedCount++;
        }

      } catch (error) {
        console.error(`Error en fila ${row.index}:`, error);
        errors.push(`Fila ${row.index}: Error inesperado`);
      }
    }

        // Registrar log de importación
        try {
          await supabase
            .from('log_cargas_cotizaciones')
            .insert({
              usuario_id: user.id,
              nombre_archivo: cotizacionesFile?.name || 'cotizaciones.xlsx',
              total_filas: importData.length,
              filas_insertadas: importedCount,
              filas_actualizadas: updatedCount,
              filas_con_error: errors.length,
              detalle_errores: errors,
              tamaño_archivo: cotizacionesFile?.size || 0
            });
        } catch (logError) {
          console.error('Error registrando log:', logError);
        }

    setImportProgress(100);
    setCurrentStep('complete');
    setImporting(false);

    if (errors.length > 0) {
      toast.error(`Importación completada con ${errors.length} errores`);
    } else {
      toast.success(`${importedCount} cotizaciones importadas exitosamente`);
    }

    onImportComplete();
  };

  const resetImport = () => {
    setCotizacionesFile(null);
    setImportData([]);
    setCurrentStep('upload');
    setImportProgress(0);
    setProcessing(false);
    setImporting(false);
  };

  const downloadErrorsReport = () => {
    const errorRows = importData.filter(row => row.status === 'error');
    if (errorRows.length === 0) {
      toast.info("No hay errores que exportar");
      return;
    }

    const reportData = errorRows.map(row => ({
      Fila: row.index,
      SKU: row.sku,
      Producto: row.nombre_producto,
      Cliente: row.cliente_nombre,
      Errores: row.errors.join('; '),
      Advertencias: row.warnings.join('; ')
    }));

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Errores_Importacion');
    XLSX.writeFile(wb, `errores_cotizaciones_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.success("Reporte de errores descargado exitosamente");
  };

  const downloadTemplates = () => {
    const template = [
      {
        'Fecha': '2024-01-15',
        'Tipo de Empaque': 'estuche',
        'Industria': 'farmacia',
        'Precio unitario': 0.85,
        'Cantidad cotizada': 1000,
        'Numero de troquel': '1',
        'Cliente': 'Laboratorios ABC',
        'Nombre troquel': 'Estuche Paracetamol',
        'Tamaño': 'Troquelado especial con ventana',
        'Alto mm': 95,
        'Ancho mm': 45,
        'Profundidad mm': 28,
        'SKU': 'FARM-001',
        'Corte': 'Corte guillotina + troquel',
        'Tamaños por corte': '2x4',
        'Tamaños por pliego': '8',
        'Tamaño especial': 'N/A',
        'Nota': 'Urgente para producción Q1'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(template);
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Cotizaciones');
    XLSX.writeFile(wb, 'plantilla_cotizaciones.xlsx');
    
    toast.success("Plantilla descargada exitosamente");
  };

  const getStatusIcon = (status: 'valid' | 'error' | 'warning') => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const validCount = importData.filter(row => row.status === 'valid').length;
  const warningCount = importData.filter(row => row.status === 'warning').length;
  const errorCount = importData.filter(row => row.status === 'error').length;
  const matchedCount = importData.filter(row => row.dieline_matched).length;
  const unmatchedCount = importData.filter(row => !row.dieline_matched && row.status !== 'error').length;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          📥 Cargar Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Carga Masiva de SKUs Cotizados
          </DialogTitle>
        </DialogHeader>

        <Tabs value={currentStep} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">1. Cargar Archivo</TabsTrigger>
            <TabsTrigger value="preview">2. Vista Previa</TabsTrigger>
            <TabsTrigger value="importing">3. Importando</TabsTrigger>
            <TabsTrigger value="complete">4. Completado</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Descargar Plantillas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Descarga la plantilla Excel con el formato requerido para cargar cotizaciones.
                </p>
                <Button onClick={downloadTemplates} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Descargar Plantilla
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package2 className="h-4 w-4" />
                  Archivo de Cotizaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Archivo Excel con información completa de cotizaciones y especificaciones técnicas.
                  </p>
                  <div>
                    <Label htmlFor="cotizaciones-upload">Seleccionar archivo Excel</Label>
                    <Input
                      id="cotizaciones-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleCotizacionesFileUpload}
                      disabled={processing}
                    />
                  </div>
                  {cotizacionesFile && (
                    <p className="text-sm text-green-600">✓ {cotizacionesFile.name}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {processing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Procesando archivos...</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>


          <TabsContent value="preview" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Válidas: {validCount}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Advertencias: {warningCount}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Errores: {errorCount}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <ScrollArea className="h-96 border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Estado</TableHead>
                    <TableHead>Fila</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Troquel</TableHead>
                    <TableHead>Dimensiones</TableHead>
                    
                    <TableHead>Errores/Advertencias</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importData.map((row, index) => (
                    <TableRow key={row.index}>
                      <TableCell>{getStatusIcon(row.status)}</TableCell>
                      <TableCell>{row.index}</TableCell>
                      <TableCell className="font-mono text-xs">{row.sku}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{row.nombre_producto}</div>
                          {(row.concentracion || row.cantidad_presentacion) && (
                            <div className="text-xs text-muted-foreground">
                              {row.concentracion} {row.cantidad_presentacion}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {row.cliente_exists ? (
                            <Badge variant="outline" className="text-xs">Existente</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Nuevo</Badge>
                          )}
                          <span className="text-sm">{row.cliente_nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {row.troquel_id ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-xs font-mono">{row.troquel_id}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <XCircle className="h-3 w-3 text-red-500" />
                            <span className="text-xs text-red-600">Sin troquel</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {row.alto_mm && row.ancho_mm && row.profundidad_mm ? (
                          <span className="font-mono">
                            {row.alto_mm}×{row.ancho_mm}×{row.profundidad_mm}mm
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Sin dimensiones</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {row.errors.map((error, i) => (
                            <Badge key={i} variant="destructive" className="text-xs block">
                              {error}
                            </Badge>
                          ))}
                          {row.warnings.map((warning, i) => (
                            <Badge key={i} variant="secondary" className="text-xs block">
                              {warning}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {errorCount > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Hay {errorCount} filas con errores que deben corregirse antes de importar.
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={downloadErrorsReport}
                    className="ml-2 p-0 h-auto"
                  >
                    Exportar errores
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetImport}>
                  Volver
                </Button>
                {errorCount > 0 && (
                  <Button variant="outline" onClick={downloadErrorsReport} className="gap-2">
                    <Download className="h-4 w-4" />
                    Exportar Errores
                  </Button>
                )}
              </div>
              <Button 
                onClick={handleImport} 
                disabled={errorCount > 0 || importData.length === 0}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Importar {validCount + warningCount} Cotizaciones
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="importing" className="space-y-4">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-medium">Importando cotizaciones...</h3>
              <Progress value={importProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                {Math.round(importProgress)}% completado
              </p>
            </div>
          </TabsContent>

          <TabsContent value="complete" className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Importación completada exitosamente. Las cotizaciones han sido agregadas a tu base de datos.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setDialogOpen(false)}>
                Cerrar
              </Button>
              <Button onClick={resetImport} variant="outline">
                Importar Más
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ImportarCotizaciones;