import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Filter, Download, Upload, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

interface Producto {
  id: string;
  nombre_producto: string;
  sku: string;
  cantidad_disponible: number;
  unidad_medida: string;
}

interface MovimientoInventario {
  id: string;
  producto_id: string;
  tipo_movimiento: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  costo_unitario?: number;
  fecha: string;
  motivo?: string;
  referencia_documento?: string;
  created_at: string;
  inventario_consumibles: {
    nombre_producto: string;
    sku: string;
    unidad_medida: string;
  };
}

const MOTIVOS_ENTRADA = [
  'Compra',
  'Devolución de cliente',
  'Ajuste de inventario',
  'Transferencia',
  'Otros'
];

const MOTIVOS_SALIDA = [
  'Uso en producción',
  'Venta',
  'Merma',
  'Transferencia',
  'Ajuste de inventario',
  'Otros'
];

export default function MovimientosInventario() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    producto_id: '',
    tipo_movimiento: '' as 'ENTRADA' | 'SALIDA' | '',
    cantidad: '',
    costo_unitario: '',
    fecha: new Date().toISOString().split('T')[0],
    motivo: '',
    referencia_documento: ''
  });

  useEffect(() => {
    if (user) {
      fetchMovimientos();
      fetchProductos();
    }
  }, [user]);

  const fetchMovimientos = async () => {
    try {
      const { data, error } = await supabase
        .from('movimientos_inventario')
        .select(`
          *,
          inventario_consumibles (
            nombre_producto,
            sku,
            unidad_medida
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMovimientos(data || []);
    } catch (error) {
      console.error('Error fetching movimientos:', error);
      toast({
        title: "Error",
        description: "Error al cargar los movimientos de inventario",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('inventario_consumibles')
        .select('id, nombre_producto, sku, cantidad_disponible, unidad_medida')
        .order('nombre_producto');

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error('Error fetching productos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.producto_id || !formData.tipo_movimiento || !formData.cantidad) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('movimientos_inventario')
        .insert({
          producto_id: formData.producto_id,
          tipo_movimiento: formData.tipo_movimiento,
          cantidad: parseFloat(formData.cantidad),
          costo_unitario: formData.costo_unitario ? parseFloat(formData.costo_unitario) : null,
          fecha: formData.fecha,
          motivo: formData.motivo || null,
          referencia_documento: formData.referencia_documento || null,
          user_id: user?.id
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Movimiento registrado correctamente"
      });

      resetForm();
      setDialogOpen(false);
      fetchMovimientos();
      fetchProductos(); // Refresh to get updated quantities
    } catch (error: any) {
      console.error('Error creating movement:', error);
      toast({
        title: "Error",
        description: error.message || "Error al registrar el movimiento",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      producto_id: '',
      tipo_movimiento: '',
      cantidad: '',
      costo_unitario: '',
      fecha: new Date().toISOString().split('T')[0],
      motivo: '',
      referencia_documento: ''
    });
  };

  const filteredMovimientos = movimientos.filter(mov => {
    const matchesSearch = searchTerm === '' || 
      mov.inventario_consumibles.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.inventario_consumibles.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.motivo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.referencia_documento?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = tipoFilter === 'todos' || mov.tipo_movimiento === tipoFilter;
    
    const matchesFecha = (!fechaDesde || mov.fecha >= fechaDesde) && 
                        (!fechaHasta || mov.fecha <= fechaHasta);
    
    return matchesSearch && matchesTipo && matchesFecha;
  });

  const selectedProduct = productos.find(p => p.id === formData.producto_id);

  if (!user) {
    return (
      <MainLayout>
        <div className="p-4">
          <p>Debe iniciar sesión para acceder a esta página.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Movimientos de Inventario</h1>
            <p className="text-muted-foreground mt-1">Registro de entradas y salidas de consumibles</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                Registrar Movimiento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuevo Movimiento de Inventario</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="tipo_movimiento">Tipo de Movimiento *</Label>
                    <Select
                      value={formData.tipo_movimiento}
                      onValueChange={(value: 'ENTRADA' | 'SALIDA') => 
                        setFormData({ ...formData, tipo_movimiento: value, motivo: '' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ENTRADA">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            ENTRADA
                          </div>
                        </SelectItem>
                        <SelectItem value="SALIDA">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-red-600" />
                            SALIDA
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="fecha">Fecha *</Label>
                    <Input
                      id="fecha"
                      type="date"
                      value={formData.fecha}
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="producto_id">Producto *</Label>
                  <Select
                    value={formData.producto_id}
                    onValueChange={(value) => setFormData({ ...formData, producto_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {productos.map((producto) => (
                        <SelectItem key={producto.id} value={producto.id}>
                          <div className="flex flex-col py-1">
                            <span className="font-medium">{producto.nombre_producto}</span>
                            <span className="text-xs text-muted-foreground">
                              SKU: {producto.sku} | Stock: {producto.cantidad_disponible} {producto.unidad_medida}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="cantidad">Cantidad *</Label>
                    <Input
                      id="cantidad"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.cantidad}
                      onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                      placeholder="0.00"
                    />
                    {selectedProduct && (
                      <p className="text-xs text-muted-foreground">
                        Unidad: {selectedProduct.unidad_medida}
                      </p>
                    )}
                  </div>

                  {formData.tipo_movimiento === 'ENTRADA' && (
                    <div className="space-y-3">
                      <Label htmlFor="costo_unitario">Costo Unitario</Label>
                      <Input
                        id="costo_unitario"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.costo_unitario}
                        onChange={(e) => setFormData({ ...formData, costo_unitario: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="motivo">Motivo</Label>
                    <Select
                      value={formData.motivo}
                      onValueChange={(value) => setFormData({ ...formData, motivo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar motivo" />
                      </SelectTrigger>
                      <SelectContent>
                        {(formData.tipo_movimiento === 'ENTRADA' ? MOTIVOS_ENTRADA : MOTIVOS_SALIDA).map((motivo) => (
                          <SelectItem key={motivo} value={motivo}>
                            {motivo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="referencia_documento">Referencia Documento</Label>
                    <Input
                      id="referencia_documento"
                      value={formData.referencia_documento}
                      onChange={(e) => setFormData({ ...formData, referencia_documento: e.target.value })}
                      placeholder="Ej: FACT-001234, OC-005678"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Registrar Movimiento
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="shadow-sm border-0 ring-1 ring-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Producto, SKU, motivo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="ENTRADA">ENTRADA</SelectItem>
                    <SelectItem value="SALIDA">SALIDA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_desde">Fecha Desde</Label>
                <Input
                  id="fecha_desde"
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_hasta">Fecha Hasta</Label>
                <Input
                  id="fecha_hasta"
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                />
              </div>

            </div>
            
            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setTipoFilter('todos');
                  setFechaDesde('');
                  setFechaHasta('');
                }}
                className="w-full sm:w-auto"
              >
                Limpiar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Movements Table */}
        <Card className="shadow-sm border-0 ring-1 ring-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              Historial de Movimientos ({filteredMovimientos.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8">
                <p>Cargando movimientos...</p>
              </div>
            ) : filteredMovimientos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No se encontraron movimientos</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Costo Unit.</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Referencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovimientos.map((movimiento) => (
                      <TableRow key={movimiento.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-4 px-6 font-medium">
                          {format(new Date(movimiento.fecha), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge 
                            variant={movimiento.tipo_movimiento === 'ENTRADA' ? 'default' : 'destructive'}
                            className={`px-3 py-1 ${
                              movimiento.tipo_movimiento === 'ENTRADA' 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              {movimiento.tipo_movimiento === 'ENTRADA' ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {movimiento.tipo_movimiento}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{movimiento.inventario_consumibles.nombre_producto}</p>
                            <p className="text-xs text-muted-foreground">
                              SKU: {movimiento.inventario_consumibles.sku}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 font-medium">
                          {movimiento.cantidad} {movimiento.inventario_consumibles.unidad_medida}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          {movimiento.costo_unitario ? (
                            <span className="font-medium">${movimiento.costo_unitario}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className={movimiento.motivo ? 'text-foreground' : 'text-muted-foreground'}>
                            {movimiento.motivo || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className={movimiento.referencia_documento ? 'text-foreground font-mono text-sm' : 'text-muted-foreground'}>
                            {movimiento.referencia_documento || '-'}
                          </span>
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
    </MainLayout>
  );
}