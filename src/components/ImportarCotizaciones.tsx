import React, { useState, useCallback } from "react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { 
  Upload, Download, CheckCircle, XCircle, AlertCircle, 
  FileSpreadsheet, Plus, Eye, FileDown, ChevronDown, ChevronRight,
  Settings, Info, Merge, Target, History
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
  fecha_cotizacion: string;
  // Campos de dieline fusionados
  dieline_matched?: boolean;
  dieline_match_type?: 'exact' | 'dimensions' | 'manual' | 'none';
  troquel_descripcion?: string;
  layout_impresion?: string;
  subformas?: string;
  unidades_por_hoja?: string;
  estrategia_corte?: string;
  arte_final_pdf_url?: string;
  fuente_troquel?: string;
  observaciones_tecnicas?: string;
  // Campos calculados
  cliente_id?: string;
  cliente_exists: boolean;
  manual_troquel_id?: string;
  errors: string[];
  warnings: string[];
  status: 'valid' | 'error' | 'warning';
  expanded?: boolean;
};

type DielineData = {
  sku: string;
  nombre_producto: string;
  alto_mm: number;
  ancho_mm: number;
  profundidad_mm: number;
  troquel_id: string;
  troquel_descripcion: string;
  layout_impresion: string;
  subformas: string;
  unidades_por_hoja: string;
  estrategia_corte: string;
  observaciones_tecnicas: string;
  arte_final_pdf_url: string;
  fuente_troquel: string;
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
  const [cotizacionesFile, setCotizacionesFile] = useState<File | null>(null);
  const [dielinesFile, setDielinesFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ImportRowCotizacion[]>([]);
  const [dielinesData, setDielinesData] = useState<DielineData[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [availableTroqueles, setAvailableTroqueles] = useState<{id: string, descripcion: string}[]>([]);
  const [processing, setProcessing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, fileType: 'cotizaciones' | 'dielines') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (fileType === 'cotizaciones') {
        setCotizacionesFile(e.dataTransfer.files[0]);
      } else {
        setDielinesFile(e.dataTransfer.files[0]);
      }
    }
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, fileType: 'cotizaciones' | 'dielines') => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (fileType === 'cotizaciones') {
      setCotizacionesFile(uploadedFile);
    } else {
      setDielinesFile(uploadedFile);
    }
  };

  const processFiles = async () => {
    if (!cotizacionesFile) {
      toast.error("Debe cargar al menos el archivo de cotizaciones");
      return;
    }

    setProcessing(true);
    
    try {
      // Procesar archivo de cotizaciones
      const cotizacionesData = await parseFile(cotizacionesFile);
      
      // Procesar archivo de dielines si existe
      let dielinesDataParsed: DielineData[] = [];
      if (dielinesFile) {
        const rawDielines = await parseFile(dielinesFile);
        dielinesDataParsed = rawDielines.map((item: any) => ({
          sku: item.sku?.toString() || '',
          nombre_producto: item.nombre_producto?.toString() || '',
          alto_mm: parseFloat(item.alto_mm) || 0,
          ancho_mm: parseFloat(item.ancho_mm) || 0,
          profundidad_mm: parseFloat(item.profundidad_mm) || 0,
          troquel_id: item.troquel_id?.toString() || '',
          troquel_descripcion: item.troquel_descripcion?.toString() || '',
          layout_impresion: item.layout_impresion?.toString() || '',
          subformas: item.subformas?.toString() || '',
          unidades_por_hoja: item.unidades_por_hoja?.toString() || '',
          estrategia_corte: item.estrategia_corte?.toString() || '',
          observaciones_tecnicas: item.observaciones_tecnicas?.toString() || '',
          arte_final_pdf_url: item.arte_final_pdf_url?.toString() || '',
          fuente_troquel: item.fuente_troquel?.toString() || ''
        }));
        setDielinesData(dielinesDataParsed);
      }

      // Cargar datos base
      await Promise.all([loadClientes(), loadTroqueles()]);
      
      // Procesar y fusionar datos
      const processedData = processImportData(cotizacionesData, dielinesDataParsed);
      setImportData(processedData);
      setCurrentStep('preview');
      
    } catch (error) {
      console.error('Error al procesar archivos:', error);
      toast.error("Error al procesar los archivos");
    } finally {
      setProcessing(false);
    }
  };

  const parseFile = async (file: File): Promise<any[]> => {
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
      throw new Error("Formato de archivo no soportado");
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

  const loadTroqueles = async () => {
    // Simular carga de troqueles disponibles
    setAvailableTroqueles([
      { id: '1', descripcion: 'Troquel estándar 100x50x30' },
      { id: '2', descripcion: 'Troquel farmacéutico' },
      { id: '3', descripcion: 'Troquel cosmético' },
    ]);
  };

  const findDielineMatch = (cotizacion: any, dielines: DielineData[]): { match: DielineData | null, type: 'exact' | 'dimensions' | 'none' } => {
    // Buscar coincidencia exacta por SKU o nombre
    const exactMatch = dielines.find(d => 
      d.sku.toLowerCase() === cotizacion.sku?.toLowerCase() ||
      d.nombre_producto.toLowerCase() === cotizacion.nombre_producto?.toLowerCase()
    );
    
    if (exactMatch) {
      return { match: exactMatch, type: 'exact' };
    }

    // Buscar por dimensiones (tolerancia de 2mm)
    const alto = parseFloat(cotizacion.alto_mm) || 0;
    const ancho = parseFloat(cotizacion.ancho_mm) || 0;
    const prof = parseFloat(cotizacion.profundidad_mm) || 0;

    const dimensionMatch = dielines.find(d => 
      Math.abs(d.alto_mm - alto) <= 2 &&
      Math.abs(d.ancho_mm - ancho) <= 2 &&
      Math.abs(d.profundidad_mm - prof) <= 2
    );

    if (dimensionMatch) {
      return { match: dimensionMatch, type: 'dimensions' };
    }

    return { match: null, type: 'none' };
  };

  const processImportData = (rawData: any[], dielines: DielineData[]): ImportRowCotizacion[] => {
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
        fecha_cotizacion: row.fecha_cotizacion?.toString() || new Date().toISOString().split('T')[0],
        cliente_exists: false,
        errors: [],
        warnings: [],
        status: 'valid'
      };

      // Buscar coincidencia en dielines
      const { match, type } = findDielineMatch(processedRow, dielines);
      if (match) {
        processedRow.dieline_matched = true;
        processedRow.dieline_match_type = type;
        processedRow.troquel_descripcion = match.troquel_descripcion;
        processedRow.layout_impresion = match.layout_impresion;
        processedRow.subformas = match.subformas;
        processedRow.unidades_por_hoja = match.unidades_por_hoja;
        processedRow.estrategia_corte = match.estrategia_corte;
        processedRow.observaciones_tecnicas = match.observaciones_tecnicas;
        processedRow.arte_final_pdf_url = match.arte_final_pdf_url;
        processedRow.fuente_troquel = match.fuente_troquel;
        
        // Actualizar troquel_id si no viene en la cotización
        if (!processedRow.troquel_id && match.troquel_id) {
          processedRow.troquel_id = match.troquel_id;
        }
      } else {
        processedRow.dieline_matched = false;
        processedRow.dieline_match_type = 'none';
      }

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

    // Validaciones de dieline
    if (!row.dieline_matched) {
      warnings.push('No se encontró información técnica para este SKU');
    } else if (row.dieline_match_type === 'dimensions') {
      warnings.push('Enlazado por dimensiones - verificar compatibilidad');
    }

    // Validar números
    if (row.cantidad_cotizada && isNaN(Number(row.cantidad_cotizada))) {
      errors.push('Cantidad cotizada debe ser un número');
    }

    if (row.precio_unitario && isNaN(Number(row.precio_unitario))) {
      errors.push('Precio unitario debe ser un número');
    }

    // Asignar errores y warnings
    row.errors = errors;
    row.warnings = warnings;
    row.status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid';
  };

  const updateManualTroquel = (rowIndex: number, troquelId: string) => {
    setImportData(prev => prev.map((row, idx) => {
      if (idx === rowIndex) {
        return {
          ...row,
          manual_troquel_id: troquelId,
          dieline_match_type: 'manual' as const,
          warnings: row.warnings.filter(w => !w.includes('información técnica'))
        };
      }
      return row;
    }));
  };

  const toggleRowExpansion = (rowIndex: number) => {
    setImportData(prev => prev.map((row, idx) => {
      if (idx === rowIndex) {
        return { ...row, expanded: !row.expanded };
      }
      return row;
    }));
  };

  const createMissingCliente = async (clienteNombre: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert({
          user_id: user?.id,
          nombre_empresa: clienteNombre,
          rif: `RIF-${Date.now()}`,
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
          troquel_id: row.manual_troquel_id ? parseInt(row.manual_troquel_id) : (row.troquel_id ? parseInt(row.troquel_id) : null),
          observaciones: [
            row.observaciones,
            row.observaciones_tecnicas,
            row.layout_impresion ? `Layout: ${row.layout_impresion}` : '',
            row.estrategia_corte ? `Estrategia: ${row.estrategia_corte}` : ''
          ].filter(Boolean).join(' | ') || null,
          fecha_cotizacion: row.fecha_cotizacion
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
          nombre_archivo: cotizacionesFile?.name || 'archivo_desconocido',
          total_filas: importData.length,
          filas_insertadas: importedCount,
          filas_actualizadas: 0,
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

  const exportErrors = () => {
    const errorRows = importData.filter(row => row.status === 'error');
    const errorData = errorRows.map(row => ({
      fila: row.index,
      sku: row.sku,
      nombre_producto: row.nombre_producto,
      errores: row.errors.join('; '),
      advertencias: row.warnings.join('; ')
    }));

    const ws = XLSX.utils.json_to_sheet(errorData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Errores_Importacion');
    XLSX.writeFile(wb, `errores_cotizaciones_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.success("Archivo de errores descargado");
  };

  const resetImport = () => {
    setCotizacionesFile(null);
    setDielinesFile(null);
    setImportData([]);
    setDielinesData([]);
    setCurrentStep('upload');
    setImportProgress(0);
    setProcessing(false);
    setImporting(false);
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        sku: 'COT-001',
        nombre_producto: 'Caja Farmacéutica Paracetamol 500mg x24',
        cliente_nombre: 'Farmacia ABC',
        tipo_empaque: 'Estuche',
        industria: 'Farmacia',
        descripcion_montaje: 'Caja con troquelado especial para blíster',
        cantidad_cotizada: 1000,
        precio_unitario: 0.85,
        alto_mm: 100,
        ancho_mm: 50,
        profundidad_mm: 30,
        troquel_id: '',
        observaciones: 'Urgente para producción',
        fecha_cotizacion: new Date().toISOString().split('T')[0]
      }
    ];

    const dielinesTemplate = [
      {
        sku: 'COT-001',
        nombre_producto: 'Caja Farmacéutica Paracetamol 500mg x24',
        alto_mm: 100,
        ancho_mm: 50,
        profundidad_mm: 30,
        troquel_id: 'TRQ-001',
        troquel_descripcion: 'Troquel estándar farmacéutico',
        layout_impresion: '2x4 unidades por hoja',
        subformas: '8 cajas por hoja A1',
        unidades_por_hoja: 8,
        estrategia_corte: 'Troquelado con guillotina automática',
        observaciones_tecnicas: 'Requiere adhesivo especial para solapas',
        arte_final_pdf_url: 'arte_paracetamol_final.pdf',
        fuente_troquel: 'escaneado_troquel_farmacia.pdf'
      }
    ];

    // Crear libro con dos hojas
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(templateData);
    const ws2 = XLSX.utils.json_to_sheet(dielinesTemplate);
    
    XLSX.utils.book_append_sheet(wb, ws1, 'Plantilla_Cotizaciones');
    XLSX.utils.book_append_sheet(wb, ws2, 'Plantilla_Dielines');
    XLSX.writeFile(wb, 'plantillas_cotizaciones_completa.xlsx');
    
    toast.success("Plantillas descargadas exitosamente");
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

  const getMatchIcon = (matchType?: 'exact' | 'dimensions' | 'manual' | 'none') => {
    switch (matchType) {
      case 'exact':
        return <Target className="h-4 w-4 text-green-500" />;
      case 'dimensions':
        return <Settings className="h-4 w-4 text-yellow-500" />;
      case 'manual':
        return <Eye className="h-4 w-4 text-blue-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const validCount = importData.filter(row => row.status === 'valid').length;
  const warningCount = importData.filter(row => row.status === 'warning').length;
  const errorCount = importData.filter(row => row.status === 'error').length;
  const matchedCount = importData.filter(row => row.dieline_matched).length;

  return (
    <TooltipProvider>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            📥 Cargar archivo Excel
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-7xl max-h-[95vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Importación Masiva de Cotizaciones con Dielines
            </DialogTitle>
          </DialogHeader>

          <Tabs value={currentStep} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upload">1. Cargar Archivos</TabsTrigger>
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
                    Descarga las plantillas Excel con el formato requerido. Incluye una hoja para cotizaciones y otra para información técnica de dielines.
                  </p>
                  <Button onClick={downloadTemplate} variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Descargar Plantillas Excel
                  </Button>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Archivo de Cotizaciones */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Archivo de Cotizaciones
                      <Badge variant="destructive" className="text-xs">Requerido</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        dragActive ? 'border-primary bg-primary/10' : 'border-gray-300'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={(e) => handleDrop(e, 'cotizaciones')}
                    >
                      {cotizacionesFile ? (
                        <div className="space-y-2">
                          <FileSpreadsheet className="h-8 w-8 mx-auto text-green-500" />
                          <p className="text-sm font-medium">{cotizacionesFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(cotizacionesFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 mx-auto text-gray-400" />
                          <p className="text-sm">Arrastra el archivo aquí o haz clic para seleccionar</p>
                          <p className="text-xs text-muted-foreground">CSV, XLS, XLSX</p>
                        </div>
                      )}
                      <Input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => handleFileUpload(e, 'cotizaciones')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Archivo de Dielines */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Merge className="h-4 w-4" />
                      Archivo de Dielines
                      <Badge variant="secondary" className="text-xs">Opcional</Badge>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Información técnica extraída de archivo de troqueles</p>
                        </TooltipContent>
                      </Tooltip>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        dragActive ? 'border-primary bg-primary/10' : 'border-gray-300'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={(e) => handleDrop(e, 'dielines')}
                    >
                      {dielinesFile ? (
                        <div className="space-y-2">
                          <Merge className="h-8 w-8 mx-auto text-blue-500" />
                          <p className="text-sm font-medium">{dielinesFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(dielinesFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 mx-auto text-gray-400" />
                          <p className="text-sm">Arrastra el archivo de dielines aquí</p>
                          <p className="text-xs text-muted-foreground">CSV, XLS, XLSX (opcional)</p>
                        </div>
                      )}
                      <Input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => handleFileUpload(e, 'dielines')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={processFiles}
                  disabled={!cotizacionesFile || processing}
                  className="gap-2"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Merge className="h-4 w-4" />
                      Procesar Archivos
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Enlazadas: {matchedCount}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <ScrollArea className="h-96 border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Enlace</TableHead>
                      <TableHead>Fila</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Errores/Advertencias</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importData.map((row, idx) => (
                      <React.Fragment key={row.index}>
                        <TableRow>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(idx)}
                            >
                              {row.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                          </TableCell>
                          <TableCell>{getStatusIcon(row.status)}</TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger>
                                {getMatchIcon(row.dieline_match_type)}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {row.dieline_match_type === 'exact' && 'Enlace exacto por SKU/nombre'}
                                  {row.dieline_match_type === 'dimensions' && 'Enlace por dimensiones'}
                                  {row.dieline_match_type === 'manual' && 'Asignación manual'}
                                  {row.dieline_match_type === 'none' && 'Sin información técnica'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>{row.index}</TableCell>
                          <TableCell>{row.sku}</TableCell>
                          <TableCell>{row.nombre_producto}</TableCell>
                          <TableCell>{row.cliente_nombre}</TableCell>
                          <TableCell>${row.precio_unitario}</TableCell>
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
                          <TableCell>
                            {!row.dieline_matched && row.status !== 'error' && (
                              <Select
                                value={row.manual_troquel_id || ''}
                                onValueChange={(value) => updateManualTroquel(idx, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Troquel" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableTroqueles.map((troquel) => (
                                    <SelectItem key={troquel.id} value={troquel.id}>
                                      {troquel.descripcion}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                        </TableRow>
                        
                        {row.expanded && (row.dieline_matched || row.manual_troquel_id) && (
                          <TableRow>
                            <TableCell colSpan={10} className="bg-muted/30">
                              <div className="p-4 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <History className="h-4 w-4" />
                                  Información Técnica del Troquel
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                  {row.troquel_descripcion && (
                                    <div>
                                      <span className="font-medium">Descripción:</span>
                                      <p className="text-muted-foreground">{row.troquel_descripcion}</p>
                                    </div>
                                  )}
                                  {row.layout_impresion && (
                                    <div>
                                      <span className="font-medium">Layout:</span>
                                      <p className="text-muted-foreground">{row.layout_impresion}</p>
                                    </div>
                                  )}
                                  {row.estrategia_corte && (
                                    <div>
                                      <span className="font-medium">Estrategia:</span>
                                      <p className="text-muted-foreground">{row.estrategia_corte}</p>
                                    </div>
                                  )}
                                  {row.subformas && (
                                    <div>
                                      <span className="font-medium">Subformas:</span>
                                      <p className="text-muted-foreground">{row.subformas}</p>
                                    </div>
                                  )}
                                  {row.unidades_por_hoja && (
                                    <div>
                                      <span className="font-medium">Unidades/hoja:</span>
                                      <p className="text-muted-foreground">{row.unidades_por_hoja}</p>
                                    </div>
                                  )}
                                  {row.fuente_troquel && (
                                    <div>
                                      <span className="font-medium">Fuente:</span>
                                      <p className="text-muted-foreground">{row.fuente_troquel}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <div className="flex gap-2 justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetImport}>
                    Volver
                  </Button>
                  {errorCount > 0 && (
                    <Button variant="outline" onClick={exportErrors} className="gap-2">
                      <FileDown className="h-4 w-4" />
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
                  Importación completada exitosamente. Las cotizaciones con información técnica han sido agregadas a tu base de datos.
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
    </TooltipProvider>
  );
};

export default ImportarCotizaciones;