import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, ArrowLeft, Package, AlertTriangle, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Producto {
  id: string;
  nombre_producto: string;
  sku: string | null;
  categoria: string | null;
  descripcion: string | null;
  cantidad_disponible: number | null;
  precio_unitario: number;
  stock_minimo: number | null;
  tipo: string;
  unidad_medida: string;
  created_at: string;
}

const CATEGORIAS_IMPRENTA = [
  'insumo',
  'planchas',
  'troqueles',
  'negativos',
  'papel',
  'otros'
];

const TIPOS_PRODUCTO = [
  'normal',
  'especial'
];

const UNIDADES_MEDIDA = [
  'und',
  'resma',
  'metro',
  'kg',
  'litro',
  'rollo'
];

export default function Inventario() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    sku: '',
    categoria: '',
    descripcion: '',
    cantidad_disponible: 0,
    precio_unitario: 0,
    stock_minimo: 0,
    tipo: 'normal',
    unidad_medida: 'und',
  });

  useEffect(() => {
    if (user) {
      loadProductos();
    }
  }, [user]);

  const loadProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error('Error loading productos:', error);
      toast({
        title: "Error",
        description: "Error al cargar los productos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProductos = productos.filter(producto => {
    const matchesSearch = producto.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.categoria?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || producto.categoria === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormData({
      nombre: '',
      sku: '',
      categoria: '',
      descripcion: '',
      cantidad_disponible: 0,
      precio_unitario: 0,
      stock_minimo: 0,
      tipo: 'normal',
      unidad_medida: 'und',
    });
    setEditingProducto(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (producto: Producto) => {
    setFormData({
      nombre: producto.nombre_producto,
      sku: producto.sku || '',
      categoria: producto.categoria || '',
      descripcion: producto.descripcion || '',
      cantidad_disponible: producto.cantidad_disponible || 0,
      precio_unitario: producto.precio_unitario,
      stock_minimo: producto.stock_minimo || 0,
      tipo: producto.tipo || 'normal',
      unidad_medida: producto.unidad_medida || 'und',
    });
    setEditingProducto(producto);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProducto) {
        const { error } = await supabase
          .from('inventario')
          .update({ 
            nombre_producto: formData.nombre,
            sku: formData.sku,
            categoria: formData.categoria,
            descripcion: formData.descripcion,
            cantidad_disponible: formData.cantidad_disponible,
            precio_unitario: formData.precio_unitario,
            stock_minimo: formData.stock_minimo,
            tipo: formData.tipo,
            unidad_medida: formData.unidad_medida,
            user_id: user?.id 
          })
          .eq('id', editingProducto.id);
        
        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Producto actualizado correctamente",
        });
      } else {
        const { error } = await supabase
          .from('inventario')
          .insert([{ 
            nombre_producto: formData.nombre,
            sku: formData.sku,
            categoria: formData.categoria,
            descripcion: formData.descripcion,
            cantidad_disponible: formData.cantidad_disponible,
            precio_unitario: formData.precio_unitario,
            stock_minimo: formData.stock_minimo,
            tipo: formData.tipo,
            unidad_medida: formData.unidad_medida,
            user_id: user?.id 
          }]);
        
        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Producto creado correctamente",
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadProductos();
    } catch (error: any) {
      console.error('Error saving producto:', error);
      toast({
        title: "Error",
        description: error.message || "Error al guardar el producto",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
    
    try {
    const { error } = await supabase
      .from('inventario')
      .delete()
      .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Producto eliminado correctamente",
      });
      
      loadProductos();
    } catch (error: any) {
      console.error('Error deleting producto:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el producto",
        variant: "destructive",
      });
    }
  };

  const isLowStock = (producto: Producto) => {
    return producto.cantidad_disponible <= producto.stock_minimo;
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
                <h1 className="text-3xl font-bold text-primary">Inventario</h1>
                <p className="text-muted-foreground">Gestiona tus productos y stock</p>
              </div>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingProducto ? 'Modifica la información del producto' : 'Completa la información del nuevo producto'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre del Producto *</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU / Código</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="ABC-123"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoría</Label>
                      <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIAS_IMPRENTA.map((categoria) => (
                            <SelectItem key={categoria} value={categoria}>
                              {categoria}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_PRODUCTO.map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>
                              {tipo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="unidad_medida">Unidad de Medida</Label>
                      <Select value={formData.unidad_medida} onValueChange={(value) => setFormData({ ...formData, unidad_medida: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una unidad" />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIDADES_MEDIDA.map((unidad) => (
                            <SelectItem key={unidad} value={unidad}>
                              {unidad}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="precio_unitario">Precio Unitario *</Label>
                      <Input
                        id="precio_unitario"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.precio_unitario}
                        onChange={(e) => setFormData({ ...formData, precio_unitario: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cantidad_disponible">Cantidad Disponible</Label>
                      <Input
                        id="cantidad_disponible"
                        type="number"
                        min="0"
                        value={formData.cantidad_disponible}
                        onChange={(e) => setFormData({ ...formData, cantidad_disponible: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    
                     <div className="space-y-2">
                       <Label htmlFor="stock_minimo">Stock Mínimo (Alerta)</Label>
                       <Input
                         id="stock_minimo"
                         type="number"
                         min="0"
                         value={formData.stock_minimo}
                         onChange={(e) => setFormData({ ...formData, stock_minimo: parseInt(e.target.value) || 0 })}
                       />
                     </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Input
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Descripción detallada del producto"
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingProducto ? 'Actualizar' : 'Crear'} Producto
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search and Filter */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por nombre, SKU o categoría..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {CATEGORIAS_IMPRENTA.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Productos Table */}
          <Card>
            <CardHeader>
              <CardTitle>Productos ({filteredProductos.length})</CardTitle>
              <CardDescription>
                Lista de todos tus productos en inventario
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Cargando productos...</p>
              ) : filteredProductos.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No se encontraron productos' : 'No hay productos registrados'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={openCreateDialog} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Crear primer producto
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProductos.map((producto) => (
                        <TableRow key={producto.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{producto.nombre_producto}</div>
                              {producto.descripcion && (
                                <div className="text-sm text-muted-foreground">
                                  {producto.descripcion}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {producto.sku && (
                              <code className="bg-muted px-2 py-1 rounded text-sm">
                                {producto.sku}
                              </code>
                            )}
                          </TableCell>
                          <TableCell>
                            {producto.categoria && (
                              <Badge variant="secondary">{producto.categoria}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={producto.tipo === 'especial' ? 'outline' : 'default'}>
                              {producto.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono">
                              ${producto.precio_unitario.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className={`font-medium ${isLowStock(producto) ? 'text-destructive' : ''}`}>
                                {producto.cantidad_disponible} unidades
                              </span>
                               <span className="text-xs text-muted-foreground">
                                Mín: {producto.stock_minimo}
                               </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isLowStock(producto) ? (
                              <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                <AlertTriangle className="h-3 w-3" />
                                Stock Bajo
                              </Badge>
                            ) : (
                              <Badge variant="default">Disponible</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(producto)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(producto.id)}
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