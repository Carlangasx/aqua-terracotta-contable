import React, { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, AlertTriangle, CheckCircle, ArrowLeft, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

interface FilaInventario {
  fila: number;
  nombre_producto: string;
  sku: string;
  categoria: string;
  cantidad: number;
  unidad_medida: string;
  precio_unitario_usd: number;
  stock_minimo: number;
  proveedor?: string;
  descripcion?: string;
  valida: boolean;
  errores: string[];
  accion: 'insertar' | 'actualizar';
  id_existente?: string;
}

const CATEGORIAS_VALIDAS = ['tinta', 'plancha', 'negativo', 'uniforme', 'otros'];
const UNIDADES_VALIDAS = ['und', 'kg', 'l', 'm', 'resma'];

export default function ImportarInventario() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [filasInventario, setFilasInventario] = useState<FilaInventario[]>([]);
  const [productosExistentes, setProductosExistentes] = useState<any[]>([]);
  const [procesando, setProcesando] = useState(false);
  const [filaEditando, setFilaEditando] = useState<number | null>(null);

  if (!user) {
    return (
      <MainLayout>
        <div className="p-6">
          <p>Debe iniciar sesión para acceder a esta página.</p>
        </div>
      </MainLayout>
    );
  }

  const descargarPlantilla = () => {
    const plantillaData = [
      {
        nombre_producto: 'Tinta Negra CMYK',
        sku: 'TINTA-001',
        categoria: 'tinta',
        cantidad: 100,
        unidad_medida: 'l',
        precio_unitario_usd: 25.50,
        stock_minimo: 10,
        proveedor: 'Proveedor Ejemplo',
        descripcion: 'Tinta para impresión offset'
      },
      {
        nombre_producto: 'Plancha Offset',
        sku: 'PLAN-001',
        categoria: 'plancha',
        cantidad: 50,
        unidad_medida: 'und',
        precio_unitario_usd: 15.00,
        stock_minimo: 5,
        proveedor: 'Proveedor Ejemplo',
        descripcion: 'Plancha de aluminio para offset'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(plantillaData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    XLSX.writeFile(wb, 'plantilla_inventario.xlsx');
    
    toast({
      title: "Plantilla descargada",
      description: "Se ha descargado la plantilla de ejemplo"
    });
  };

  const procesarArchivo = async (file: File) => {
    try {
      setProcesando(true);
      
      // Obtener productos existentes
      const { data: existentes, error: errorExistentes } = await supabase
        .from('inventario_consumibles')
        .select('id, sku, nombre_producto');
      
      if (errorExistentes) throw errorExistentes;
      
      setProductosExistentes(existentes || []);
      
      // Leer archivo
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
      
      const filasValidadas: FilaInventario[] = [];
      
      jsonData.forEach((fila, index) => {
        const filaInventario: FilaInventario = {
          fila: index + 2, // +2 porque Excel empieza en 1 y primera fila es header
          nombre_producto: fila.nombre_producto || '',
          sku: fila.sku || '',
          categoria: fila.categoria || '',
          cantidad: parseFloat(fila.cantidad) || 0,
          unidad_medida: fila.unidad_medida || '',
          precio_unitario_usd: parseFloat(fila.precio_unitario_usd) || 0,
          stock_minimo: parseFloat(fila.stock_minimo) || 0,
          proveedor: fila.proveedor || '',
          descripcion: fila.descripcion || '',
          valida: true,
          errores: [],
          accion: 'insertar',
          id_existente: undefined
        };
        
        // Validaciones
        if (!filaInventario.nombre_producto.trim()) {
          filaInventario.errores.push('Nombre de producto requerido');
        }
        
        if (!filaInventario.sku.trim()) {
          filaInventario.errores.push('SKU requerido');
        } else {
          // Verificar si SKU existe
          const existente = existentes?.find(p => p.sku === filaInventario.sku);
          if (existente) {
            filaInventario.accion = 'actualizar';
            filaInventario.id_existente = existente.id;
          }
        }
        
        if (!CATEGORIAS_VALIDAS.includes(filaInventario.categoria)) {
          filaInventario.errores.push(`Categoría debe ser: ${CATEGORIAS_VALIDAS.join(', ')}`);
        }
        
        if (!UNIDADES_VALIDAS.includes(filaInventario.unidad_medida)) {
          filaInventario.errores.push(`Unidad debe ser: ${UNIDADES_VALIDAS.join(', ')}`);
        }
        
        if (filaInventario.cantidad < 0) {
          filaInventario.errores.push('Cantidad debe ser mayor o igual a 0');
        }
        
        if (filaInventario.precio_unitario_usd < 0) {
          filaInventario.errores.push('Precio debe ser mayor o igual a 0');
        }
        
        if (filaInventario.stock_minimo < 0) {
          filaInventario.errores.push('Stock mínimo debe ser mayor o igual a 0');
        }
        
        filaInventario.valida = filaInventario.errores.length === 0;
        filasValidadas.push(filaInventario);
      });
      
      setFilasInventario(filasValidadas);
      setPaso(2);
      
    } catch (error) {
      console.error('Error procesando archivo:', error);
      toast({
        title: "Error",
        description: "Error al procesar el archivo. Verifique el formato.",
        variant: "destructive"
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
        setArchivo(file);
        procesarArchivo(file);
      } else {
        toast({
          title: "Error",
          description: "Solo se permiten archivos .xlsx o .csv",
          variant: "destructive"
        });
      }
    }
  };

  const editarFila = (index: number, campo: keyof FilaInventario, valor: any) => {
    const nuevasFilas = [...filasInventario];
    nuevasFilas[index] = { ...nuevasFilas[index], [campo]: valor };
    
    // Revalidar la fila editada
    const fila = nuevasFilas[index];
    fila.errores = [];
    
    if (!fila.nombre_producto.trim()) {
      fila.errores.push('Nombre de producto requerido');
    }
    
    if (!fila.sku.trim()) {
      fila.errores.push('SKU requerido');
    }
    
    if (!CATEGORIAS_VALIDAS.includes(fila.categoria)) {
      fila.errores.push(`Categoría debe ser: ${CATEGORIAS_VALIDAS.join(', ')}`);
    }
    
    if (!UNIDADES_VALIDAS.includes(fila.unidad_medida)) {
      fila.errores.push(`Unidad debe ser: ${UNIDADES_VALIDAS.join(', ')}`);
    }
    
    if (fila.cantidad < 0) {
      fila.errores.push('Cantidad debe ser mayor o igual a 0');
    }
    
    if (fila.precio_unitario_usd < 0) {
      fila.errores.push('Precio debe ser mayor o igual a 0');
    }
    
    if (fila.stock_minimo < 0) {
      fila.errores.push('Stock mínimo debe ser mayor o igual a 0');
    }
    
    fila.valida = fila.errores.length === 0;
    
    setFilasInventario(nuevasFilas);
  };

  const confirmarImportacion = async () => {
    try {
      setProcesando(true);
      
      let insertadas = 0;
      let actualizadas = 0;
      let errores = 0;
      const detalleErrores: any[] = [];
      
      for (const fila of filasInventario) {
        if (!fila.valida) {
          errores++;
          detalleErrores.push({
            fila: fila.fila,
            errores: fila.errores
          });
          continue;
        }
        
        try {
          if (fila.accion === 'insertar') {
            const { error } = await supabase
              .from('inventario_consumibles')
              .insert({
                nombre_producto: fila.nombre_producto,
                sku: fila.sku,
                categoria: fila.categoria,
                cantidad_disponible: fila.cantidad,
                unidad_medida: fila.unidad_medida,
                precio_unitario: fila.precio_unitario_usd,
                stock_minimo: fila.stock_minimo,
                proveedor: fila.proveedor || null,
                descripcion: fila.descripcion || null,
                user_id: user.id
              });
            
            if (error) throw error;
            insertadas++;
            
          } else {
            // Actualizar - obtener cantidad actual y sumar
            const { data: productoActual } = await supabase
              .from('inventario_consumibles')
              .select('cantidad_disponible')
              .eq('id', fila.id_existente)
              .single();
            
            const nuevaCantidad = (productoActual?.cantidad_disponible || 0) + fila.cantidad;
            
            const { error } = await supabase
              .from('inventario_consumibles')
              .update({
                cantidad_disponible: nuevaCantidad,
                precio_unitario: fila.precio_unitario_usd,
                stock_minimo: fila.stock_minimo,
                proveedor: fila.proveedor || null,
                descripcion: fila.descripcion || null,
                updated_at: new Date().toISOString()
              })
              .eq('id', fila.id_existente);
            
            if (error) throw error;
            actualizadas++;
          }
        } catch (error) {
          errores++;
          detalleErrores.push({
            fila: fila.fila,
            errores: [`Error en base de datos: ${error}`]
          });
        }
      }
      
      // Registrar log de carga
      await supabase
        .from('log_cargas_inventario')
        .insert({
          usuario_id: user.id,
          total_filas: filasInventario.length,
          filas_insertadas: insertadas,
          filas_actualizadas: actualizadas,
          filas_con_error: errores,
          detalle_errores: detalleErrores,
          nombre_archivo: archivo?.name || 'archivo_desconocido',
          tamaño_archivo: archivo?.size || 0
        });
      
      toast({
        title: "Importación completada",
        description: `Inventario actualizado: ${insertadas} nuevos · ${actualizadas} actualizados`
      });
      
      navigate('/inventario');
      
    } catch (error) {
      console.error('Error en importación:', error);
      toast({
        title: "Error",
        description: "Error durante la importación",
        variant: "destructive"
      });
    } finally {
      setProcesando(false);
    }
  };

  const filasConError = filasInventario.filter(f => !f.valida);
  const puedeConfirmar = filasConError.length === 0 && filasInventario.length > 0;

  return (
    <MainLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/inventario')}
            className="shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Importar Inventario</h1>
            <p className="text-muted-foreground mt-1">Carga masiva de productos desde archivo Excel</p>
          </div>
        </div>

        {/* Paso 1: Subir archivo */}
        {paso === 1 && (
          <div className="space-y-6">
            <Card className="shadow-sm border-0 ring-1 ring-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#875A7B]" />
                  Plantilla de Importación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Descarga la plantilla con el formato correcto para cargar tu inventario
                </p>
                <Button 
                  onClick={descargarPlantilla}
                  className="bg-[#875A7B] hover:bg-[#6d4862] text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Plantilla .xlsx
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0 ring-1 ring-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-[#875A7B]" />
                  Subir Archivo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="archivo">Seleccionar archivo (.xlsx o .csv)</Label>
                  <Input
                    id="archivo"
                    type="file"
                    ref={fileInputRef}
                    accept=".xlsx,.csv"
                    onChange={handleFileChange}
                    disabled={procesando}
                  />
                </div>
                
                {procesando && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Procesando archivo...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Paso 2: Vista previa y validación */}
        {paso === 2 && (
          <div className="space-y-6">
            <Card className="shadow-sm border-0 ring-1 ring-border/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Vista Previa - {archivo?.name}</span>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {filasInventario.filter(f => f.valida).length} válidas
                    </Badge>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {filasConError.length} con errores
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {filasConError.length > 0 && (
                  <div className="p-6 border-b bg-red-50 border-red-200">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="w-5 h-5" />
                      <p className="font-medium">
                        Hay {filasConError.length} filas con errores que deben corregirse antes de continuar.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Fila</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acción</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Precio USD</TableHead>
                        <TableHead>Stock Mín.</TableHead>
                        <TableHead>Errores</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filasInventario.map((fila, index) => (
                        <TableRow 
                          key={index} 
                          className={`${!fila.valida ? 'bg-red-50 border-red-200' : ''} hover:bg-muted/30`}
                        >
                          <TableCell className="font-medium">{fila.fila}</TableCell>
                          <TableCell>
                            {fila.valida ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={fila.accion === 'insertar' ? 'default' : 'secondary'}
                              className={fila.accion === 'insertar' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}
                            >
                              {fila.accion === 'insertar' ? 'Nuevo' : 'Actualizar'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {filaEditando === index ? (
                              <Input
                                value={fila.nombre_producto}
                                onChange={(e) => editarFila(index, 'nombre_producto', e.target.value)}
                                onBlur={() => setFilaEditando(null)}
                                autoFocus
                                className="w-40"
                              />
                            ) : (
                              <span 
                                onClick={() => setFilaEditando(index)}
                                className="cursor-pointer hover:bg-muted p-1 rounded"
                              >
                                {fila.nombre_producto}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {filaEditando === index ? (
                              <Input
                                value={fila.sku}
                                onChange={(e) => editarFila(index, 'sku', e.target.value)}
                                onBlur={() => setFilaEditando(null)}
                                className="w-32"
                              />
                            ) : (
                              <span 
                                onClick={() => setFilaEditando(index)}
                                className="cursor-pointer hover:bg-muted p-1 rounded font-mono"
                              >
                                {fila.sku}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{fila.categoria}</TableCell>
                          <TableCell>{fila.cantidad}</TableCell>
                          <TableCell>{fila.unidad_medida}</TableCell>
                          <TableCell>${fila.precio_unitario_usd}</TableCell>
                          <TableCell>{fila.stock_minimo}</TableCell>
                          <TableCell className="max-w-xs">
                            {fila.errores.length > 0 && (
                              <div className="text-red-600 text-sm">
                                {fila.errores.map((error, i) => (
                                  <div key={i}>• {error}</div>
                                ))}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => setPaso(1)}
                disabled={procesando}
              >
                Volver a subir archivo
              </Button>
              <Button 
                onClick={confirmarImportacion}
                disabled={!puedeConfirmar || procesando}
                className="bg-[#875A7B] hover:bg-[#6d4862] text-white"
              >
                {procesando ? 'Procesando...' : 'Confirmar Importación'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}