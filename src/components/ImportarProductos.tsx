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

type ImportRow = {
  index: number;
  cliente_nombre: string;
  nombre_producto: string;
  tipo_producto: string;
  industria: string;
  alto_mm: string;
  ancho_mm: string;
  profundidad_mm: string;
  sustrato: string;
  calibre: string;
  colores: string;
  barniz: string;
  plastificado: string;
  troquelado: string;
  empaquetado: string;
  pegado: string;
  numero_paquetes: string;
  precio_unitario_usd: string;
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

const VALID_TIPO_PRODUCTO = ['Estuche', 'Caja', 'Microcorrugado', 'Otro'];
const VALID_INDUSTRIA = ['Farmacia', 'Alimentos', 'Cosmética', 'Otros'];
const VALID_BARNIZ = ['UV', 'AQ', 'Ninguno'];
const VALID_PLASTIFICADO = ['Mate', 'Brillante', 'Ninguno'];

const REQUIRED_COLUMNS = [
  'cliente_nombre', 'nombre_producto', 'alto_mm', 'ancho_mm', 'profundidad_mm'
];

interface ImportarProductosProps {
  onImportComplete: () => void;
}

const ImportarProductos = ({ onImportComplete }: ImportarProductosProps) => {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ImportRow[]>([]);
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
        toast.error("Formato de archivo no soportado. Use CSV o XLSX.");
        setProcessing(false);
        return;
      }

      // Cargar clientes existentes
      await loadClientes();
      
      // Procesar y validar datos
      const processedData = await processImportData(parsedData);
      setImportData(processedData);
      setCurrentStep('preview');
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error("Error al procesar el archivo");
    } finally {
      setProcessing(false);
    }
  };

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nombre_empresa, rif");

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error("Error loading clientes:", error);
    }
  };

  const processImportData = async (rawData: any[]): Promise<ImportRow[]> => {
    return rawData.map((row, index) => {
      const importRow: ImportRow = {
        index: index + 1,
        cliente_nombre: row.cliente_nombre || '',
        nombre_producto: row.nombre_producto || '',
        tipo_producto: row.tipo_producto || '',
        industria: row.industria || '',
        alto_mm: row.alto_mm?.toString() || '',
        ancho_mm: row.ancho_mm?.toString() || '',
        profundidad_mm: row.profundidad_mm?.toString() || '',
        sustrato: row.sustrato || '',
        calibre: row.calibre || '',
        colores: row.colores || '',
        barniz: row.barniz || 'Ninguno',
        plastificado: row.plastificado || 'Ninguno',
        troquelado: row.troquelado || 'No',
        empaquetado: row.empaquetado || '',
        pegado: row.pegado || '',
        numero_paquetes: row.numero_paquetes?.toString() || '',
        precio_unitario_usd: row.precio_unitario_usd?.toString() || '',
        observaciones: row.observaciones || '',
        cliente_exists: false,
        errors: [],
        warnings: [],
        status: 'valid'
      };

      // Validaciones
      validateRow(importRow);
      
      return importRow;
    });
  };

  const validateRow = (row: ImportRow) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Campos obligatorios
    REQUIRED_COLUMNS.forEach(field => {
      if (!row[field as keyof ImportRow]) {
        errors.push(`Campo obligatorio faltante: ${field}`);
      }
    });

    // Validar cliente
    const cliente = clientes.find(c => 
      c.nombre_empresa.toLowerCase() === row.cliente_nombre.toLowerCase() ||
      c.rif === row.cliente_nombre
    );
    
    if (cliente) {
      row.cliente_id = cliente.id;
      row.cliente_exists = true;
    } else {
      warnings.push("Cliente no encontrado - se puede crear automáticamente");
    }

    // Validar campos numéricos
    if (row.alto_mm && isNaN(parseFloat(row.alto_mm))) {
      errors.push("Alto debe ser un número válido");
    }
    if (row.ancho_mm && isNaN(parseFloat(row.ancho_mm))) {
      errors.push("Ancho debe ser un número válido");
    }
    if (row.profundidad_mm && isNaN(parseFloat(row.profundidad_mm))) {
      errors.push("Profundidad debe ser un número válido");
    }
    if (row.precio_unitario_usd && isNaN(parseFloat(row.precio_unitario_usd))) {
      errors.push("Precio debe ser un número válido");
    }

    // Validar opciones
    if (row.tipo_producto && !VALID_TIPO_PRODUCTO.includes(row.tipo_producto)) {
      errors.push(`Tipo de producto inválido. Opciones: ${VALID_TIPO_PRODUCTO.join(', ')}`);
    }
    if (row.industria && !VALID_INDUSTRIA.includes(row.industria)) {
      errors.push(`Industria inválida. Opciones: ${VALID_INDUSTRIA.join(', ')}`);
    }
    if (row.barniz && !VALID_BARNIZ.includes(row.barniz)) {
      errors.push(`Barniz inválido. Opciones: ${VALID_BARNIZ.join(', ')}`);
    }
    if (row.plastificado && !VALID_PLASTIFICADO.includes(row.plastificado)) {
      errors.push(`Plastificado inválido. Opciones: ${VALID_PLASTIFICADO.join(', ')}`);
    }

    // Validar troquelado
    if (row.troquelado && !['Sí', 'Si', 'Yes', 'No', 'True', 'False', '1', '0'].includes(row.troquelado)) {
      errors.push("Troquelado debe ser: Sí, No, True, False, 1 ó 0");
    }

    row.errors = errors;
    row.warnings = warnings;
    row.status = errors.length > 0 ? 'error' : (warnings.length > 0 ? 'warning' : 'valid');
  };

  const createMissingCliente = async (clienteNombre: string): Promise<string | null> => {
    try {
      if (!user) return null;

      const { data, error } = await supabase
        .from("clientes")
        .insert({
          user_id: user.id,
          nombre_empresa: clienteNombre,
          rif: `TMP-${Date.now()}`, // RIF temporal
          direccion_fiscal: "Por definir",
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating cliente:', error);
      return null;
    }
  };

  const handleImport = async () => {
    if (!user) return;

    setImporting(true);
    setCurrentStep('importing');
    setImportProgress(0);

    const validRows = importData.filter(row => row.status !== 'error');
    let imported = 0;

    try {
      for (const row of validRows) {
        let clienteId = row.cliente_id;

        // Crear cliente si no existe
        if (!row.cliente_exists && row.cliente_nombre) {
          clienteId = await createMissingCliente(row.cliente_nombre);
          if (!clienteId) {
            console.error(`Failed to create cliente: ${row.cliente_nombre}`);
            continue;
          }
        }

        // Insertar producto
        const productData = {
          user_id: user.id,
          actualizado_por: user.id,
          cliente_id: clienteId,
          nombre_producto: row.nombre_producto,
          tipo_producto: row.tipo_producto || null,
          industria: row.industria || null,
          alto: row.alto_mm ? parseFloat(row.alto_mm) / 10 : null, // Convertir mm a cm
          ancho: row.ancho_mm ? parseFloat(row.ancho_mm) / 10 : null,
          profundidad: row.profundidad_mm ? parseFloat(row.profundidad_mm) / 10 : null,
          sustrato: row.sustrato || null,
          calibre: row.calibre || null,
          colores: row.colores || null,
          barniz: row.barniz || null,
          plastificado: row.plastificado || null,
          troquelado: ['Sí', 'Si', 'Yes', 'True', '1'].includes(row.troquelado),
          empaquetado: row.empaquetado || null,
          pegado: row.pegado || null,
          numero_paquetes: row.numero_paquetes || null,
          precio_unitario_usd: row.precio_unitario_usd ? parseFloat(row.precio_unitario_usd) : null,
          observaciones: row.observaciones || null,
        };

        const { error } = await supabase
          .from("productos_elaborados")
          .insert(productData);

        if (error) {
          console.error('Error inserting product:', error);
        } else {
          imported++;
        }

        setImportProgress((imported / validRows.length) * 100);
      }

      setCurrentStep('complete');
      toast.success(`${imported} productos importados exitosamente`);
      
      // Esperar un momento antes de cerrar
      setTimeout(() => {
        setDialogOpen(false);
        onImportComplete();
        resetImport();
      }, 2000);

    } catch (error) {
      console.error('Error during import:', error);
      toast.error("Error durante la importación");
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setImportData([]);
    setCurrentStep('upload');
    setImportProgress(0);
  };

  const downloadTemplate = () => {
    const template = [
      {
        cliente_nombre: "Empresa Ejemplo C.A.",
        nombre_producto: "Caja Medicamento X",
        tipo_producto: "Caja",
        industria: "Farmacia",
        alto_mm: "100",
        ancho_mm: "200",
        profundidad_mm: "50",
        sustrato: "Cartón",
        calibre: "300gsm",
        colores: "4+1",
        barniz: "UV",
        plastificado: "Mate",
        troquelado: "Sí",
        empaquetado: "Individual",
        pegado: "Automático",
        numero_paquetes: "1000",
        precio_unitario_usd: "1.50",
        observaciones: "Urgente para el 30/01/2025"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, "plantilla_productos_elaborados.xlsx");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  const validCount = importData.filter(row => row.status === 'valid').length;
  const warningCount = importData.filter(row => row.status === 'warning').length;
  const errorCount = importData.filter(row => row.status === 'error').length;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importar Productos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importación Masiva de Productos
          </DialogTitle>
        </DialogHeader>

        <Tabs value={currentStep} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" disabled={currentStep !== 'upload'}>
              1. Cargar Archivo
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={currentStep !== 'preview'}>
              2. Vista Previa
            </TabsTrigger>
            <TabsTrigger value="importing" disabled={currentStep !== 'importing'}>
              3. Importando
            </TabsTrigger>
            <TabsTrigger value="complete" disabled={currentStep !== 'complete'}>
              4. Completado
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Descarga primero la plantilla para asegurar el formato correcto de columnas.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Button onClick={downloadTemplate} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Plantilla
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file-upload">Seleccionar archivo CSV o XLSX</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={processing}
                  className="bg-green-50 border-green-200"
                />
              </div>

              {processing && (
                <div className="text-center py-4">
                  <div className="animate-spin mx-auto mb-2 h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                  <p>Procesando archivo...</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-green-50 border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-green-700">Válidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-900">{validCount}</div>
                  </CardContent>
                </Card>

                <Card className="bg-yellow-50 border-yellow-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-yellow-700">Advertencias</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-900">{warningCount}</div>
                  </CardContent>
                </Card>

                <Card className="bg-red-50 border-red-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-red-700">Errores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-900">{errorCount}</div>
                  </CardContent>
                </Card>
              </div>

              <ScrollArea className="h-96 border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fila</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Medidas (cm)</TableHead>
                      <TableHead>Precio USD</TableHead>
                      <TableHead>Observaciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importData.map((row) => (
                      <TableRow key={row.index} className={
                        row.status === 'error' ? 'bg-red-50' : 
                        row.status === 'warning' ? 'bg-yellow-50' : 'bg-green-50'
                      }>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(row.status)}
                            {row.status === 'error' && (
                              <Badge variant="destructive">Error</Badge>
                            )}
                            {row.status === 'warning' && (
                              <Badge variant="secondary">Advertencia</Badge>
                            )}
                            {row.status === 'valid' && (
                              <Badge variant="default">Válido</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{row.index}</TableCell>
                        <TableCell>
                          <div>
                            {row.cliente_nombre}
                            {!row.cliente_exists && (
                              <Badge variant="outline" className="ml-1 text-xs">
                                Nuevo
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{row.nombre_producto}</TableCell>
                        <TableCell>{row.tipo_producto}</TableCell>
                        <TableCell>
                          {row.alto_mm && row.ancho_mm && row.profundidad_mm ? 
                            `${(parseFloat(row.alto_mm)/10).toFixed(1)}×${(parseFloat(row.ancho_mm)/10).toFixed(1)}×${(parseFloat(row.profundidad_mm)/10).toFixed(1)}` : 
                            '-'
                          }
                        </TableCell>
                        <TableCell>
                          {row.precio_unitario_usd ? `$${row.precio_unitario_usd}` : '-'}
                        </TableCell>
                        <TableCell>
                          {row.errors.length > 0 && (
                            <div className="text-red-600 text-xs">
                              {row.errors.map((error, i) => (
                                <div key={i}>• {error}</div>
                              ))}
                            </div>
                          )}
                          {row.warnings.length > 0 && (
                            <div className="text-yellow-600 text-xs">
                              {row.warnings.map((warning, i) => (
                                <div key={i}>• {warning}</div>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <div className="flex justify-between">
                <Button onClick={resetImport} variant="outline">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={validCount + warningCount === 0}
                >
                  Importar {validCount + warningCount} productos
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="importing" className="space-y-4">
            <div className="text-center py-8">
              <div className="animate-spin mx-auto mb-4 h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
              <h3 className="text-lg font-medium">Importando productos...</h3>
              <p className="text-muted-foreground mb-4">Por favor espere mientras se procesan los datos</p>
              <Progress value={importProgress} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">
                {Math.round(importProgress)}% completado
              </p>
            </div>
          </TabsContent>

          <TabsContent value="complete" className="space-y-4">
            <div className="text-center py-8">
              <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" />
              <h3 className="text-lg font-medium text-green-900">¡Importación Completada!</h3>
              <p className="text-muted-foreground">Los productos han sido importados exitosamente</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ImportarProductos;