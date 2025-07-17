import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, ArrowLeft, ShoppingCart, Minus, Download, FileText } from 'lucide-react';

interface Cliente {
  id: string;
  nombre_empresa: string;
  rif: string;
  direccion_fiscal: string;
}

interface Producto {
  id: string;
  nombre_producto: string;
  precio_unitario: number;
  cantidad_disponible: number;
}

interface ProductoVenta {
  producto: string;
  cantidad: number;
  precio_unitario: number;
  descripcion: string;
  subtotal: number;
}

interface Venta {
  id: string;
  cliente_id: string;
  fecha: string;
  productos: any;
  subtotal: number;
  iva: number;
  total: number;
  created_at: string;
  clientes?: {
    nombre_empresa: string;
    rif: string;
  };
}

export default function Ventas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVenta, setEditingVenta] = useState<Venta | null>(null);
  const [selectedCliente, setSelectedCliente] = useState('');
  const [productosVenta, setProductosVenta] = useState<ProductoVenta[]>([]);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (user) {
      loadVentas();
      loadClientes();
      loadProductos();
    }
  }, [user]);

  const loadVentas = async () => {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          *,
          clientes (
            nombre_empresa,
            rif
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVentas(data || []);
    } catch (error) {
      console.error('Error loading ventas:', error);
      toast({
        title: "Error",
        description: "Error al cargar las ventas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nombre_empresa, rif, direccion_fiscal')
        .order('nombre_empresa');

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Error loading clientes:', error);
    }
  };

  const loadProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('inventario_consumibles')
        .select('id, nombre_producto, precio_unitario, cantidad_disponible')
        .order('nombre_producto');

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error('Error loading productos:', error);
    }
  };

  const filteredVentas = ventas.filter(venta =>
    venta.clientes?.nombre_empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venta.clientes?.rif.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venta.fecha.includes(searchTerm)
  );

  const resetForm = () => {
    setSelectedCliente('');
    setProductosVenta([]);
    setFecha(new Date().toISOString().split('T')[0]);
    setEditingVenta(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const addProductoVenta = () => {
    setProductosVenta([...productosVenta, {
      producto: '',
      cantidad: 1,
      precio_unitario: 0,
      descripcion: '',
      subtotal: 0
    }]);
  };

  const removeProductoVenta = (index: number) => {
    setProductosVenta(productosVenta.filter((_, i) => i !== index));
  };

  const updateProductoVenta = (index: number, field: keyof ProductoVenta, value: any) => {
    const newProductos = [...productosVenta];
    newProductos[index] = { ...newProductos[index], [field]: value };
    
    if (field === 'producto') {
      const selectedProducto = productos.find(p => p.nombre_producto === value);
      if (selectedProducto) {
        newProductos[index].precio_unitario = selectedProducto.precio_unitario;
        newProductos[index].descripcion = selectedProducto.nombre_producto;
      }
    }
    
    if (field === 'cantidad' || field === 'precio_unitario') {
      newProductos[index].subtotal = newProductos[index].cantidad * newProductos[index].precio_unitario;
    }
    
    setProductosVenta(newProductos);
  };

  const calcularTotales = () => {
    const subtotal = productosVenta.reduce((sum, item) => sum + item.subtotal, 0);
    const impuestos = subtotal * 0.16; // 16% IVA
    const total = subtotal + impuestos;
    return { subtotal, impuestos, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCliente || productosVenta.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar un cliente y al menos un producto",
        variant: "destructive",
      });
      return;
    }

  const { subtotal, impuestos, total } = calcularTotales();
    
    try {
      const ventaData = {
        user_id: user?.id,
        cliente_id: selectedCliente,
        fecha,
        productos: productosVenta as any,
        subtotal,
        iva: impuestos,
        total,
      };

      if (editingVenta) {
        const { error } = await supabase
          .from('ventas')
          .update(ventaData)
          .eq('id', editingVenta.id);
        
        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Venta actualizada correctamente",
        });
      } else {
        const { error } = await supabase
          .from('ventas')
          .insert([ventaData]);
        
        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Venta registrada correctamente",
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadVentas();
    } catch (error: any) {
      console.error('Error saving venta:', error);
      toast({
        title: "Error",
        description: error.message || "Error al guardar la venta",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta venta?')) return;
    
    try {
      const { error } = await supabase
        .from('ventas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Venta eliminada correctamente",
      });
      
      loadVentas();
    } catch (error: any) {
      console.error('Error deleting venta:', error);
      toast({
        title: "Error",
        description: "Error al eliminar la venta",
        variant: "destructive",
      });
    }
  };

  const handleGeneratePDF = async (ventaId: string) => {
    try {
      console.log('Generating PDF for venta:', ventaId);
      
      const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
        body: { ventaId }
      });

      if (error) {
        console.error('Error generating PDF:', error);
        throw error;
      }

      // Open the HTML in a new window for now
      // In the future, this could be converted to an actual PDF download
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(data);
        newWindow.document.close();
      }

      toast({
        title: "Éxito",
        description: "Factura generada correctamente",
      });

    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Error al generar la factura PDF",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-primary">Registro de Ventas</h1>
                <p className="text-muted-foreground">Gestiona las ventas y facturas</p>
              </div>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Venta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingVenta ? 'Editar Venta' : 'Nueva Venta'}
                  </DialogTitle>
                  <DialogDescription>
                    Complete la información de la venta
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Cliente y Fecha */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cliente">Cliente *</Label>
                      <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente" />
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="fecha">Fecha *</Label>
                      <Input
                        id="fecha"
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Productos */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Productos</Label>
                      <Button type="button" onClick={addProductoVenta} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Producto
                      </Button>
                    </div>

                    {productosVenta.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No hay productos agregados
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {productosVenta.map((item, index) => (
                          <Card key={index} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                              <div className="space-y-2">
                                <Label>Producto</Label>
                                <Select
                                  value={item.producto}
                                  onValueChange={(value) => updateProductoVenta(index, 'producto', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {productos.map((producto) => (
                                      <SelectItem key={producto.id} value={producto.nombre_producto}>
                                        {producto.nombre_producto} - ${producto.precio_unitario}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-2">
                                <Label>Cantidad</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.cantidad}
                                  onChange={(e) => updateProductoVenta(index, 'cantidad', parseInt(e.target.value) || 1)}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label>Precio Unit.</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.precio_unitario}
                                  onChange={(e) => updateProductoVenta(index, 'precio_unitario', parseFloat(e.target.value) || 0)}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label>Subtotal</Label>
                                <Input
                                  value={`$${item.subtotal.toFixed(2)}`}
                                  readOnly
                                  className="bg-muted"
                                />
                              </div>
                              
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeProductoVenta(index)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Resumen */}
                  {productosVenta.length > 0 && (() => {
                    const { subtotal, impuestos, total } = calcularTotales();
                    return (
                      <Card className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span className="font-mono">${subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>IVA (16%):</span>
                            <span className="font-mono">${impuestos.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span className="font-mono">${total.toFixed(2)}</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })()}
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={!selectedCliente || productosVenta.length === 0}>
                      {editingVenta ? 'Actualizar' : 'Registrar'} Venta
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por cliente, RIF o fecha..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Ventas Table */}
          <Card>
            <CardHeader>
              <CardTitle>Ventas ({filteredVentas.length})</CardTitle>
              <CardDescription>
                Historial de todas las ventas registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Cargando ventas...</p>
              ) : filteredVentas.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No se encontraron ventas' : 'No hay ventas registradas'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={openCreateDialog} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar primera venta
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Productos</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead>IVA</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVentas.map((venta) => (
                        <TableRow key={venta.id}>
                          <TableCell>
                            {new Date(venta.fecha).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{venta.clientes?.nombre_empresa}</div>
                              <div className="text-sm text-muted-foreground">{venta.clientes?.rif}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {venta.productos.length} producto{venta.productos.length !== 1 ? 's' : ''}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono">${venta.subtotal.toFixed(2)}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono">${venta.iva.toFixed(2)}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono font-bold">${venta.total.toFixed(2)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGeneratePDF(venta.id)}
                                title="Descargar factura PDF"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(venta.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
      </div>
    </Layout>
  );
}