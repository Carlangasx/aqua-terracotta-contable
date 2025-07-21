import { useState, useEffect } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, ArrowLeft, Trash2, Calculator, FileText, Save, Download } from 'lucide-react';

interface Cliente {
  id: string;
  nombre_empresa: string;
  rif: string;
  telefono_empresa: string;
  persona_contacto: string;
}

interface ProductoElaborado {
  id: string;
  nombre_producto: string;
  cliente_id: string;
  clientes?: {
    nombre_empresa: string;
  };
}

interface LineaDocumento {
  id: string;
  tipo: 'producto' | 'extra';
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
  producto_id?: string;
}

const TIPOS_DOCUMENTO = [
  { "label": "Factura", "value": "FACT" },
  { "label": "Nota de entrega", "value": "NDE" },
  { "label": "Salida de almacén", "value": "SAL" },
  { "label": "Recibo", "value": "REC" },
  { "label": "Nota de crédito", "value": "NCRE" }
];

const TIPOS_EXTRAS = [
  { value: 'plancha', label: 'Plancha' },
  { value: 'troquel', label: 'Troquel' },
  { value: 'muestras', label: 'Muestras' },
  { value: 'negativos', label: 'Negativos' },
  { value: 'positivos', label: 'Positivos' }
];

export default function DocumentosNuevo() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<ProductoElaborado[]>([]);
  const [lineas, setLineas] = useState<LineaDocumento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [savedDocumentId, setSavedDocumentId] = useState<number | null>(null);
  const [documentData, setDocumentData] = useState<any>(null);
  
  // Datos del documento
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
  const [condicionesPago, setCondicionesPago] = useState('Contado');
  const [observaciones, setObservaciones] = useState('');
  const [descuento, setDescuento] = useState(0);
  
  // Modal states
  const [mostrarProductos, setMostrarProductos] = useState(false);
  const [mostrarExtras, setMostrarExtras] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [clientesData, productosData] = await Promise.all([
        supabase.from('clientes').select('*').order('nombre_empresa'),
        supabase.from('productos_elaborados').select(`
          *,
          clientes (
            nombre_empresa
          )
        `).order('nombre_producto')
      ]);

      if (clientesData.error) throw clientesData.error;
      if (productosData.error) throw productosData.error;

      setClientes(clientesData.data || []);
      setProductos(productosData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Error al cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clienteSeleccionado = clientes.find(c => c.id === clienteId);
  const productosFiltrados = productos.filter(p => 
    !clienteId || p.cliente_id === clienteId
  );

  const agregarProducto = (producto: ProductoElaborado) => {
    const nuevaLinea: LineaDocumento = {
      id: Date.now().toString(),
      tipo: 'producto',
      nombre: producto.nombre_producto,
      precio: 0,
      cantidad: 1,
      subtotal: 0,
      producto_id: producto.id
    };
    
    setLineas(prev => [...prev, nuevaLinea]);
    setMostrarProductos(false);
  };

  const agregarExtra = (tipoExtra: string, nombre: string) => {
    const nuevaLinea: LineaDocumento = {
      id: Date.now().toString(),
      tipo: 'extra',
      nombre: nombre,
      precio: 0,
      cantidad: 1,
      subtotal: 0
    };
    
    setLineas(prev => [...prev, nuevaLinea]);
    setMostrarExtras(false);
  };

  const actualizarLinea = (id: string, campo: keyof LineaDocumento, valor: any) => {
    setLineas(prev => prev.map(linea => {
      if (linea.id === id) {
        const lineaActualizada = { ...linea, [campo]: valor };
        if (campo === 'precio' || campo === 'cantidad') {
          lineaActualizada.subtotal = lineaActualizada.precio * lineaActualizada.cantidad;
        }
        return lineaActualizada;
      }
      return linea;
    }));
  };

  const eliminarLinea = (id: string) => {
    setLineas(prev => prev.filter(linea => linea.id !== id));
  };

  const handleDownloadPDF = async () => {
    if (!savedDocumentId) {
      toast({
        title: "Error",
        description: "Debe guardar el documento primero",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('Downloading PDF for document:', savedDocumentId);
      
      const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
        body: { documentId: savedDocumentId }
      });

      if (error) {
        console.error('Error generating PDF:', error);
        toast({
          title: "Error",
          description: "Error al generar el PDF",
          variant: "destructive",
        });
        return;
      }

      // Create a blob from the HTML response and convert to PDF view
      const blob = new Blob([data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Open in new window for better user experience
      const newWindow = window.open(url, '_blank', 'width=800,height=600');
      
      // Clean up after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 30000); // 30 seconds
      
      if (!newWindow) {
        toast({
          title: "Advertencia",
          description: "Por favor permite las ventanas emergentes para descargar el PDF",
          variant: "destructive",
        });
      }

      toast({
        title: "Éxito",
        description: "PDF generado correctamente",
      });
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Error",
        description: "Error al procesar la descarga del PDF",
        variant: "destructive",
      });
    }
  };

  const subtotal = lineas.reduce((sum, linea) => sum + linea.subtotal, 0);
  const montoDescuento = subtotal * (descuento / 100);
  const total = subtotal - montoDescuento;

  const guardarDocumento = async () => {
    if (!tipoDocumento || !clienteId || lineas.length === 0) {
      toast({
        title: "Error",
        description: "Complete todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Generar números de documento
      const { data: numeroData, error: numeroError } = await supabase
        .rpc('generate_document_number', { doc_type: tipoDocumento });
      
      if (numeroError) throw numeroError;

      const { data: controlData, error: controlError } = await supabase
        .rpc('generate_control_number');
      
      if (controlError) throw controlError;

      // Preparar datos del documento
      const documentoData = {
        user_id: user?.id,
        tipo_documento: tipoDocumento,
        numero_documento: numeroData,
        numero_control_general: controlData,
        cliente_id: clienteId,
        fecha_emision: fechaEmision,
        productos: JSON.stringify(lineas.filter(l => l.tipo === 'producto').map(l => ({
          nombre: l.nombre,
          precio: l.precio,
          cantidad: l.cantidad,
          subtotal: l.subtotal,
          producto_id: l.producto_id
        }))),
        extras: JSON.stringify(lineas.filter(l => l.tipo === 'extra').map(l => ({
          nombre: l.nombre,
          precio: l.precio,
          cantidad: l.cantidad,
          subtotal: l.subtotal
        }))),
        descuento: descuento,
        total: total,
        condiciones_pago: condicionesPago,
        observaciones: observaciones,
        moneda: 'USD',
        estado: 'emitido'
      };

      const { data, error } = await supabase
        .from('documentos_generados')
        .insert([documentoData])
        .select()
        .single();

      if (error) throw error;

      // Update state immediately after successful save
      setSavedDocumentId(data.id);
      setDocumentData({
        tipoDocumento,
        numeroDocumento: numeroData
      });

      toast({
        title: "Éxito",
        description: `${TIPOS_DOCUMENTO.find(t => t.value === tipoDocumento)?.label} creada correctamente`,
      });

      console.log('Document saved with ID:', data.id);

    } catch (error: any) {
      console.error('Error saving document:', error);
      toast({
        title: "Error",
        description: error.message || "Error al guardar el documento",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center space-x-3 mb-6">
            <Link to="/documentos">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-primary">Nuevo Documento</h1>
              <p className="text-muted-foreground">Crear factura, nota de entrega, recibo o salida de almacén</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulario Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tipo de Documento */}
              <Card>
                <CardHeader>
                  <CardTitle>Tipo de Documento</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el tipo de documento" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_DOCUMENTO.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle>Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="cliente">Seleccionar Cliente</Label>
                    <Select value={clienteId} onValueChange={setClienteId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.nombre_empresa} - {cliente.rif}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {clienteSeleccionado && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                      <div>
                        <Label className="text-sm font-medium">Razón Social</Label>
                        <p className="text-sm">{clienteSeleccionado.nombre_empresa}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">RIF</Label>
                        <p className="text-sm">{clienteSeleccionado.rif}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Teléfono</Label>
                        <p className="text-sm">{clienteSeleccionado.telefono_empresa}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Atención</Label>
                        <p className="text-sm">{clienteSeleccionado.persona_contacto}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Productos y Servicios */}
              <Card>
                <CardHeader>
                  <CardTitle>Productos y Servicios</CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMostrarProductos(!mostrarProductos)}
                      disabled={!clienteId}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Producto
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMostrarExtras(!mostrarExtras)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Extra
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Lista de productos disponibles */}
                  {mostrarProductos && (
                    <div className="mb-4 p-4 border rounded-lg bg-muted">
                      <h4 className="font-medium mb-2">Productos Elaborados</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {productosFiltrados.map((producto) => (
                          <div
                            key={producto.id}
                            className="flex justify-between items-center p-2 bg-background rounded cursor-pointer hover:bg-accent"
                            onClick={() => agregarProducto(producto)}
                          >
                            <div>
                              <p className="font-medium">{producto.nombre_producto}</p>
                              <p className="text-sm text-muted-foreground">
                                {producto.clientes?.nombre_empresa}
                              </p>
                            </div>
                            <Plus className="h-4 w-4" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lista de extras disponibles */}
                  {mostrarExtras && (
                    <div className="mb-4 p-4 border rounded-lg bg-muted">
                      <h4 className="font-medium mb-2">Extras Disponibles</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {TIPOS_EXTRAS.map((extra) => (
                          <Button
                            key={extra.value}
                            variant="outline"
                            size="sm"
                            onClick={() => agregarExtra(extra.value, extra.label)}
                          >
                            {extra.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tabla de líneas */}
                  {lineas.length > 0 && (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Precio</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Subtotal</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lineas.map((linea) => (
                            <TableRow key={linea.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{linea.nombre}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {linea.tipo === 'producto' ? 'Producto' : 'Extra'}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={linea.precio}
                                  onChange={(e) => actualizarLinea(linea.id, 'precio', parseFloat(e.target.value) || 0)}
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={linea.cantidad}
                                  onChange={(e) => actualizarLinea(linea.id, 'cantidad', parseInt(e.target.value) || 0)}
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <span className="font-mono">${linea.subtotal.toFixed(2)}</span>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => eliminarLinea(linea.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Panel Lateral */}
            <div className="space-y-6">
              {/* Datos del Documento */}
              <Card>
                <CardHeader>
                  <CardTitle>Datos del Documento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fecha">Fecha de Emisión</Label>
                    <Input
                      id="fecha"
                      type="date"
                      value={fechaEmision}
                      onChange={(e) => setFechaEmision(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="condiciones">Condiciones de Pago</Label>
                    <Input
                      id="condiciones"
                      value={condicionesPago}
                      onChange={(e) => setCondicionesPago(e.target.value)}
                      placeholder="Contado, 15 días, 30 días..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Observaciones adicionales..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Totales */}
              <Card>
                <CardHeader>
                  <CardTitle>Totales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono">${subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Descuento:</span>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={descuento}
                        onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                        className="w-16"
                        min="0"
                        max="100"
                      />
                      <span>%</span>
                    </div>
                  </div>
                  
                  {descuento > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Monto descontado:</span>
                      <span className="font-mono">-${montoDescuento.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span className="font-mono">${total.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Acciones */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Button
                      onClick={guardarDocumento}
                      disabled={saving || !tipoDocumento || !clienteId || lineas.length === 0}
                      className="w-full"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Guardando...' : 'Generar Documento'}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      disabled={!savedDocumentId}
                      onClick={handleDownloadPDF}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar PDF
                    </Button>
                    
                    {savedDocumentId && (
                      <Button 
                        variant="secondary" 
                        className="w-full" 
                        onClick={() => navigate('/documentos')}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Ir a Documentos
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
