import { useState } from "react";
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
import { toast } from "sonner";
import { 
  Upload, Download, CheckCircle, XCircle, AlertCircle, 
  FileSpreadsheet, Plus, Eye 
} from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";

type ImportRowCotizacion = {
  index: number;
  sku: string;
  nombre_producto: string;
  cliente_nombre: string;
  tipo_empaque: string;
  industria: string;
  descripcion_montaje: string;
  cantidad_cotizada: string;
  precio_unitario: string;
  alto_mm: string;
  ancho_mm: string;
  profundidad_mm: string;
  troquel_id: string;
  observaciones: string;
  // Campos calculados
  cliente_id?: string;
  cliente_exists: boolean;
  errors: string[];
  warnings: string[];
  status: 'valid' | 'error' | 'warning';
};

type Cliente = {
  id: string;
  nombre_empresa: string;
  rif: string;
};

const VALID_TIPO_EMPAQUE = ['Caja de cartón', 'Estuche', 'Bolsa', 'Blister', 'Otro'];
const VALID_INDUSTRIA = ['Farmacia', 'Alimentos', 'Cosmética', 'Otros'];

const REQUIRED_COLUMNS = [
  'sku', 'nombre_producto', 'cantidad_cotizada', 'precio_unitario'
];

interface ImportarCotizacionesProps {
  onImportComplete: () => void;
}

const ImportarCotizaciones = ({ onImportComplete }: ImportarCotizacionesProps) => {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ImportRowCotizacion[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [processing, setProcessing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setProcessing(true);
    
    try {
      let parsedData: any[] = [];
      
      if (uploadedFile.name.endsWith('.csv')) {
        const text = await uploadedFile.text();
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        parsedData = result.data as any[];
      } else if (uploadedFile.name.endsWith('.xlsx') || uploadedFile.name.endsWith('.xls')) {
        const buffer = await uploadedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        parsedData = XLSX.utils.sheet_to_json(sheet);
      } else {
        toast.error("Formato de archivo no soportado. Use CSV o Excel.");
        setProcessing(false);
        return;
      }

      // Cargar clientes existentes
      await loadClientes();
      
      // Procesar datos
      const processedData = processImportData(parsedData);
      setImportData(processedData);
      setCurrentStep('preview');
      
    } catch (error) {
      console.error('Error al procesar archivo:', error);
      toast.error("Error al procesar el archivo");
    } finally {
      setProcessing(false);
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
        sku: row.sku?.toString() || '',
        nombre_producto: row.nombre_producto?.toString() || '',
        cliente_nombre: row.cliente_nombre?.toString() || '',
        tipo_empaque: row.tipo_empaque?.toString() || '',
        industria: row.industria?.toString() || '',
        descripcion_montaje: row.descripcion_montaje?.toString() || '',
        cantidad_cotizada: row.cantidad_cotizada?.toString() || '',
        precio_unitario: row.precio_unitario?.toString() || '',
        alto_mm: row.alto_mm?.toString() || '',
        ancho_mm: row.ancho_mm?.toString() || '',
        profundidad_mm: row.profundidad_mm?.toString() || '',
        troquel_id: row.troquel_id?.toString() || '',
        observaciones: row.observaciones?.toString() || '',
        cliente_exists: false,
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

    // Validar campos requeridos
    REQUIRED_COLUMNS.forEach(column => {
      if (!row[column as keyof ImportRowCotizacion] || row[column as keyof ImportRowCotizacion] === '') {
        errors.push(`${column} es requerido`);
      }
    });

    // Validar SKU único (podrías agregar lógica adicional aquí)
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
    if (row.tipo_empaque && !VALID_TIPO_EMPAQUE.includes(row.tipo_empaque)) {
      warnings.push(`Tipo de empaque '${row.tipo_empaque}' no está en la lista estándar`);
    }

    // Validar industria
    if (row.industria && !VALID_INDUSTRIA.includes(row.industria)) {
      warnings.push(`Industria '${row.industria}' no está en la lista estándar`);
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
          observaciones: row.observaciones || null,
          fecha_cotizacion: new Date().toISOString().split('T')[0]
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
          nombre_archivo: file?.name || 'archivo_desconocido',
          total_filas: importData.length,
          filas_insertadas: importedCount,
          filas_actualizadas: updatedCount,
          filas_con_error: errors.length,
          detalle_errores: errors,
          tamaño_archivo: file?.size || 0
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
    setFile(null);
    setImportData([]);
    setCurrentStep('upload');
    setImportProgress(0);
    setProcessing(false);
    setImporting(false);
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        sku: 'COT-001',
        nombre_producto: 'Caja Farmacéutica 100x50x30',
        cliente_nombre: 'Farmacia ABC',
        tipo_empaque: 'Caja de cartón',
        industria: 'Farmacia',
        descripcion_montaje: 'Caja con troquelado especial',
        cantidad_cotizada: 1000,
        precio_unitario: 0.85,
        alto_mm: 100,
        ancho_mm: 50,
        profundidad_mm: 30,
        troquel_id: '',
        observaciones: 'Urgente para producción'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
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

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Cotizaciones desde CSV/Excel
          </DialogTitle>
        </DialogHeader>

        <Tabs value={currentStep} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">1. Cargar</TabsTrigger>
            <TabsTrigger value="preview">2. Vista Previa</TabsTrigger>
            <TabsTrigger value="importing">3. Importando</TabsTrigger>
            <TabsTrigger value="complete">4. Completado</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Descargar Plantilla
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Descarga la plantilla Excel para ver el formato requerido antes de importar tus cotizaciones.
                </p>
                <Button onClick={downloadTemplate} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Descargar Plantilla Excel
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Subir Archivo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="file-upload">Seleccionar archivo CSV o Excel</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      disabled={processing}
                    />
                  </div>
                  {processing && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Procesando archivo...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Errores/Advertencias</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importData.map((row) => (
                    <TableRow key={row.index}>
                      <TableCell>{getStatusIcon(row.status)}</TableCell>
                      <TableCell>{row.index}</TableCell>
                      <TableCell>{row.sku}</TableCell>
                      <TableCell>{row.nombre_producto}</TableCell>
                      <TableCell>{row.cliente_nombre}</TableCell>
                      <TableCell>{row.cantidad_cotizada}</TableCell>
                      <TableCell>{row.precio_unitario}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {row.errors.map((error, i) => (
                            <Badge key={i} variant="destructive" className="text-xs">
                              {error}
                            </Badge>
                          ))}
                          {row.warnings.map((warning, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
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

            <div className="flex gap-2 justify-between">
              <Button variant="outline" onClick={resetImport}>
                Volver
              </Button>
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