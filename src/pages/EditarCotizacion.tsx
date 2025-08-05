import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Package, Trash2, RefreshCw } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/MainLayout';

const tiposEmpaque = [
  { value: 'estuche', label: 'Estuche' },
  { value: 'caja', label: 'Caja' },
  { value: 'microcorrugado', label: 'Microcorrugado' },
  { value: 'otro', label: 'Otro' }
];

const industrias = [
  { value: 'farmacia', label: 'Farmacia' },
  { value: 'cosmeticos', label: 'Cosméticos' },
  { value: 'comida', label: 'Comida' },
  { value: 'otros', label: 'Otros' }
];

interface Cliente {
  id: string;
  nombre_empresa: string;
}

interface Cotizacion {
  id: string;
  cliente_id: string;
  sku: string;
  nombre_producto: string;
  troquel_id?: number;
  medidas_caja_mm: {
    ancho_mm: number;
    alto_mm: number;
    profundidad_mm: number;
  };
  descripcion_montaje?: string;
  cantidad_cotizada: number;
  precio_unitario: number;
  fecha_cotizacion: string;
  observaciones?: string;
  tipo_empaque?: string;
  industria?: string;
  corte?: string;
  tamaños_por_corte?: string;
  tamaños_por_pliego?: string;
}

export default function EditarCotizacion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  
  const [formData, setFormData] = useState({
    sku: '',
    nombre_producto: '',
    cliente_id: '',
    tipo_empaque: '',
    industria: '',
    descripcion_montaje: '',
    cantidad_cotizada: '',
    precio_unitario: '',
    troquel_id: '',
    ancho_mm: '',
    alto_mm: '',
    profundidad_mm: '',
    observaciones: '',
    fecha_cotizacion: '',
    corte: '',
    tamaños_por_corte: '',
    tamaños_por_pliego: ''
  });

  useEffect(() => {
    if (user && id) {
      fetchCotizacion();
      fetchClientes();
    }
  }, [user, id]);

  const fetchCotizacion = async () => {
    try {
      const { data, error } = await supabase
        .from('cotizaciones')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      if (!data) {
        toast({
          title: "Error",
          description: "Cotización no encontrada",
          variant: "destructive",
        });
        navigate('/cotizaciones');
        return;
      }

      setCotizacion(data as unknown as Cotizacion);
      
      // Obtener medidas de caja con safe access
      const medidas = data.medidas_caja_mm as any;
      
      // Llenar el formulario con los datos existentes
      setFormData({
        sku: data.sku || '',
        nombre_producto: data.nombre_producto || '',
        cliente_id: data.cliente_id || '',
        tipo_empaque: data.tipo_empaque || '',
        industria: data.industria || '',
        descripcion_montaje: data.descripcion_montaje || '',
        cantidad_cotizada: data.cantidad_cotizada?.toString() || '',
        precio_unitario: data.precio_unitario?.toString() || '',
        troquel_id: data.troquel_id?.toString() || '',
        ancho_mm: medidas?.ancho_mm?.toString() || '',
        alto_mm: medidas?.alto_mm?.toString() || '',
        profundidad_mm: medidas?.profundidad_mm?.toString() || '',
        observaciones: data.observaciones || '',
        fecha_cotizacion: data.fecha_cotizacion || '',
        corte: data.corte || '',
        tamaños_por_corte: data.tamaños_por_corte || '',
        tamaños_por_pliego: data.tamaños_por_pliego || ''
      });

    } catch (error) {
      console.error('Error fetching cotización:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la cotización",
        variant: "destructive",
      });
      navigate('/cotizaciones');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nombre_empresa')
        .eq('user_id', user?.id)
        .order('nombre_empresa');

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Error fetching clientes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !cotizacion) {
      toast({
        title: "Error",
        description: "Error en la sesión o datos de la cotización",
        variant: "destructive",
      });
      return;
    }

    // Validaciones básicas
    if (!formData.sku || !formData.nombre_producto || !formData.cantidad_cotizada || !formData.precio_unitario) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    if (!formData.ancho_mm || !formData.alto_mm || !formData.profundidad_mm) {
      toast({
        title: "Error",
        description: "Por favor completa todas las medidas de la caja",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const cotizacionData = {
        sku: formData.sku,
        nombre_producto: formData.nombre_producto,
        cliente_id: formData.cliente_id === 'none' ? null : formData.cliente_id || null,
        tipo_empaque: formData.tipo_empaque === 'none' ? null : formData.tipo_empaque || null,
        industria: formData.industria === 'none' ? null : formData.industria || null,
        descripcion_montaje: formData.descripcion_montaje || null,
        cantidad_cotizada: parseInt(formData.cantidad_cotizada),
        precio_unitario: parseFloat(formData.precio_unitario),
        troquel_id: formData.troquel_id ? parseInt(formData.troquel_id) : null,
        medidas_caja_mm: {
          ancho_mm: parseFloat(formData.ancho_mm),
          alto_mm: parseFloat(formData.alto_mm),
          profundidad_mm: parseFloat(formData.profundidad_mm)
        },
        observaciones: formData.observaciones || null,
        fecha_cotizacion: formData.fecha_cotizacion,
        corte: formData.corte || null,
        tamaños_por_corte: formData.tamaños_por_corte || null,
        tamaños_por_pliego: formData.tamaños_por_pliego || null
      };

      const { error } = await supabase
        .from('cotizaciones')
        .update(cotizacionData)
        .eq('id', cotizacion.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Cotización actualizada correctamente",
      });

      navigate(`/cotizaciones/${cotizacion.id}`);
    } catch (error) {
      console.error('Error updating cotización:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la cotización",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !cotizacion) return;

    setDeleting(true);

    try {
      const { error } = await supabase
        .from('cotizaciones')
        .delete()
        .eq('id', cotizacion.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Cotización eliminada correctamente",
      });

      navigate('/cotizaciones');
    } catch (error) {
      console.error('Error deleting cotización:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la cotización",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleActualizarCotizacion = () => {
    navigate('/cotizaciones/nueva', { 
      state: { 
        cotizacionBase: {
          ...formData,
          sku: '', // Limpiar SKU para que se genere uno nuevo
          fecha_cotizacion: new Date().toISOString().split('T')[0] // Fecha actual
        }
      }
    });
  };

  if (loadingData) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!cotizacion) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Cotización no encontrada</h1>
            <Button onClick={() => navigate('/cotizaciones')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Cotizaciones
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/cotizaciones/${cotizacion.id}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Editar Cotización</h1>
              <p className="text-muted-foreground">SKU: {cotizacion.sku}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleActualizarCotizacion}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar Cotización
            </Button>
            
            <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente la cotización
                  "{cotizacion.sku}" y todos sus datos asociados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Información de la Cotización
              </CardTitle>
              <CardDescription>
                Modifica la información de la cotización existente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Primera fila */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    placeholder="Ej: CAJA-001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombre_producto">Nombre del Producto *</Label>
                  <Input
                    id="nombre_producto"
                    value={formData.nombre_producto}
                    onChange={(e) => handleInputChange('nombre_producto', e.target.value)}
                    placeholder="Ej: Caja para medicamentos"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha_cotizacion">Fecha de Cotización *</Label>
                  <Input
                    id="fecha_cotizacion"
                    type="date"
                    value={formData.fecha_cotizacion}
                    onChange={(e) => handleInputChange('fecha_cotizacion', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Segunda fila */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente_id">Cliente</Label>
                  <Select value={formData.cliente_id} onValueChange={(value) => handleInputChange('cliente_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin cliente específico</SelectItem>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nombre_empresa}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo_empaque">Tipo de Empaque</Label>
                  <Select value={formData.tipo_empaque} onValueChange={(value) => handleInputChange('tipo_empaque', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin especificar</SelectItem>
                      {tiposEmpaque.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industria">Industria</Label>
                  <Select value={formData.industria} onValueChange={(value) => handleInputChange('industria', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la industria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin especificar</SelectItem>
                      {industrias.map((industria) => (
                        <SelectItem key={industria.value} value={industria.value}>
                          {industria.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tercera fila - Cantidades y Precios */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cantidad_cotizada">Cantidad a Cotizar *</Label>
                  <Input
                    id="cantidad_cotizada"
                    type="number"
                    min="1"
                    value={formData.cantidad_cotizada}
                    onChange={(e) => handleInputChange('cantidad_cotizada', e.target.value)}
                    placeholder="1000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precio_unitario">Precio Unitario (USD) *</Label>
                  <Input
                    id="precio_unitario"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio_unitario}
                    onChange={(e) => handleInputChange('precio_unitario', e.target.value)}
                    placeholder="0.50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="troquel_id">Número de Troquel</Label>
                  <Input
                    id="troquel_id"
                    type="number"
                    min="1"
                    value={formData.troquel_id}
                    onChange={(e) => handleInputChange('troquel_id', e.target.value)}
                    placeholder="Ej: 123"
                  />
                </div>
              </div>

              {/* Cuarta fila - Información de Corte */}
              <div>
                <Label className="text-base font-semibold">Información de Corte</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="corte">Corte</Label>
                    <Input
                      id="corte"
                      value={formData.corte}
                      onChange={(e) => handleInputChange('corte', e.target.value)}
                      placeholder="Ej: Guillotina, Láser, Manual"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tamaños_por_corte">Tamaños por Corte</Label>
                    <Input
                      id="tamaños_por_corte"
                      value={formData.tamaños_por_corte}
                      onChange={(e) => handleInputChange('tamaños_por_corte', e.target.value)}
                      placeholder="Ej: 4x2, 6x3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tamaños_por_pliego">Tamaños por Pliego</Label>
                    <Input
                      id="tamaños_por_pliego"
                      value={formData.tamaños_por_pliego}
                      onChange={(e) => handleInputChange('tamaños_por_pliego', e.target.value)}
                      placeholder="Ej: 8x4, 12x6"
                    />
                  </div>
                </div>
              </div>

              {/* Quinta fila - Medidas */}
              <div>
                <Label className="text-base font-semibold">Medidas de la Caja (mm) *</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="ancho_mm">Ancho *</Label>
                    <Input
                      id="ancho_mm"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.ancho_mm}
                      onChange={(e) => handleInputChange('ancho_mm', e.target.value)}
                      placeholder="100.0"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alto_mm">Alto *</Label>
                    <Input
                      id="alto_mm"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.alto_mm}
                      onChange={(e) => handleInputChange('alto_mm', e.target.value)}
                      placeholder="50.0"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profundidad_mm">Profundidad *</Label>
                    <Input
                      id="profundidad_mm"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.profundidad_mm}
                      onChange={(e) => handleInputChange('profundidad_mm', e.target.value)}
                      placeholder="25.0"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Quinta fila - Descripción y Observaciones */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="descripcion_montaje">Descripción del Montaje</Label>
                  <Textarea
                    id="descripcion_montaje"
                    value={formData.descripcion_montaje}
                    onChange={(e) => handleInputChange('descripcion_montaje', e.target.value)}
                    placeholder="Detalles específicos del montaje, proceso de impresión, etc."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    value={formData.observaciones}
                    onChange={(e) => handleInputChange('observaciones', e.target.value)}
                    placeholder="Observaciones adicionales sobre la cotización"
                    rows={3}
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(`/cotizaciones/${cotizacion.id}`)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Actualizar Cotización
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </MainLayout>
  );
}