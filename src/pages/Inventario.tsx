
import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const CATEGORIAS_IMPRENTA = [
  'Tinta',
  'Plancha',
  'Negativo',
  'Uniforme',
  'Papel',
  'Cartón',
  'Adhesivo',
  'Otros'
];

interface Producto {
  id: string;
  nombre_producto: string;
  sku: string | null;
  categoria: string | null;
  cantidad_disponible: number | null;
  precio_unitario: number;
  stock_minimo: number | null;
  unidad_medida: string | null;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
}

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
    nombre_producto: '',
    sku: '',
    categoria: '',
    cantidad_disponible: 0,
    precio_unitario: 0,
    stock_minimo: 0,
    unidad_medida: '',
    descripcion: ''
  });

  useEffect(() => {
    if (user) {
      fetchProductos();
    }
  }, [user]);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching productos:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos del inventario",
          variant: "destructive",
        });
        return;
      }

      setProductos(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProductos = productos.filter(producto => {
    const matchesSearch = 
      producto.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.categoria?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || producto.categoria === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para realizar esta acción",
        variant: "destructive",
      });
      return;
    }

    try {
      const productData = {
        ...formData,
        user_id: user.id,
        cantidad_disponible: Number(formData.cantidad_disponible) || 0,
        precio_unitario: Number(formData.precio_unitario) || 0,
        stock_minimo: Number(formData.stock_minimo) || 0,
      };

      let result;
      if (editingProducto) {
        result = await supabase
          .from('inventario')
          .update(productData)
          .eq('id', editingProducto.id)
          .select();
      } else {
        result = await supabase
          .from('inventario')
          .insert([productData])
          .select();
      }

      if (result.error) {
        console.error('Error saving producto:', result.error);
        toast({
          title: "Error",
          description: result.error.message || "No se pudo guardar el producto",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Éxito",
        description: editingProducto ? "Producto actualizado correctamente" : "Producto creado correctamente",
      });

      setIsDialogOpen(false);
      setEditingProducto(null);
      setFormData({
        nombre_producto: '',
        sku: '',
        categoria: '',
        cantidad_disponible: 0,
        precio_unitario: 0,
        stock_minimo: 0,
        unidad_medida: '',
        descripcion: ''
      });
      
      fetchProductos();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (producto: Producto) => {
    setEditingProducto(producto);
    setFormData({
      nombre_producto: producto.nombre_producto,
      sku: producto.sku || '',
      categoria: producto.categoria || '',
      cantidad_disponible: producto.cantidad_disponible || 0,
      precio_unitario: producto.precio_unitario || 0,
      stock_minimo: producto.stock_minimo || 0,
      unidad_medida: producto.unidad_medida || '',
      descripcion: producto.descripcion || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('inventario')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting producto:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el producto",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Éxito",
        description: "Producto eliminado correctamente",
      });
      
      fetchProductos();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingProducto(null);
    setFormData({
      nombre_producto: '',
      sku: '',
      categoria: '',
      cantidad_disponible: 0,
      precio_unitario: 0,
      stock_minimo: 0,
      unidad_medida: '',
      descripcion: ''
    });
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Acceso Requerido</CardTitle>
              <CardDescription>
                Debes iniciar sesión para acceder al inventario.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventario de Consumibles</h1>
            <p className="text-gray-600 mt-2">Gestiona las existencias de insumos y materiales</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingProducto ? 'Editar Producto' : 'Agregar Nuevo Producto'}
                </DialogTitle>
                <DialogDescription>
                  {editingProducto ? 
                    'Modifica los datos del producto en el inventario' : 
                    'Completa los datos del nuevo producto para el inventario'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre_producto">Nombre del Producto *</Label>
                    <Input
                      id="nombre_producto"
                      value={formData.nombre_producto}
                      onChange={(e) => setFormData({...formData, nombre_producto: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="categoria">Categoría</Label>
                    <Select value={formData.categoria} onValueChange={(value) => setFormData({...formData, categoria: value})}>
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
                  
                  <div>
                    <Label htmlFor="unidad_medida">Unidad de Medida</Label>
                    <Input
                      id="unidad_medida"
                      value={formData.unidad_medida}
                      onChange={(e) => setFormData({...formData, unidad_medida: e.target.value})}
                      placeholder="ej: kg, unidades, litros"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="cantidad_disponible">Cantidad Disponible</Label>
                    <Input
                      id="cantidad_disponible"
                      type="number"
                      min="0"
                      value={formData.cantidad_disponible}
                      onChange={(e) => setFormData({...formData, cantidad_disponible: Number(e.target.value)})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="precio_unitario">Precio Unitario</Label>
                    <Input
                      id="precio_unitario"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.precio_unitario}
                      onChange={(e) => setFormData({...formData, precio_unitario: Number(e.target.value)})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="stock_minimo">Stock Mínimo</Label>
                    <Input
                      id="stock_minimo"
                      type="number"
                      min="0"
                      value={formData.stock_minimo}
                      onChange={(e) => setFormData({...formData, stock_minimo: Number(e.target.value)})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Input
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => handleDialogOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingProducto ? 'Actualizar' : 'Crear'} Producto
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="md:w-64">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
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

        {/* Lista de productos */}
        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">Cargando inventario...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredProductos.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || categoryFilter !== 'all' ? 'No se encontraron productos' : 'No hay productos en el inventario'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm || categoryFilter !== 'all' ? 
                    'Prueba ajustando los filtros de búsqueda' : 
                    'Comienza agregando tu primer producto al inventario'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredProductos.map((producto) => (
              <Card key={producto.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {producto.nombre_producto}
                        </h3>
                        {producto.categoria && (
                          <Badge variant="secondary">{producto.categoria}</Badge>
                        )}
                        {producto.cantidad_disponible !== null && 
                         producto.stock_minimo !== null && 
                         producto.cantidad_disponible <= producto.stock_minimo && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Stock Bajo
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {producto.sku && (
                          <div>
                            <span className="font-medium text-gray-500">SKU:</span>
                            <p className="text-gray-900">{producto.sku}</p>
                          </div>
                        )}
                        
                        {producto.cantidad_disponible !== null && (
                          <div>
                            <span className="font-medium text-gray-500">Stock:</span>
                            <p className="text-gray-900">
                              {producto.cantidad_disponible} {producto.unidad_medida || ''}
                            </p>
                          </div>
                        )}
                        
                        <div>
                          <span className="font-medium text-gray-500">Precio:</span>
                          <p className="text-gray-900">${producto.precio_unitario.toFixed(2)}</p>
                        </div>
                        
                        {producto.stock_minimo !== null && (
                          <div>
                            <span className="font-medium text-gray-500">Stock Mín:</span>
                            <p className="text-gray-900">{producto.stock_minimo}</p>
                          </div>
                        )}
                      </div>
                      
                      {producto.descripcion && (
                        <p className="mt-3 text-gray-600">{producto.descripcion}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(producto)}
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
