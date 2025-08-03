import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Search, Package, DollarSign, Ruler, FileText, Plus, Filter, Grid, List } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MainLayout } from '@/components/MainLayout';
import ImportarCotizaciones from '@/components/ImportarCotizaciones';
import ImportarCotizacionesCompletas from '@/components/ImportarCotizacionesCompletas';

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
  documento_pdf?: string;
  tipo_empaque?: string;
  industria?: string;
  corte?: string;
  tamaños_por_corte?: string;
  tamaños_por_pliego?: string;
  clientes?: {
    nombre_empresa: string;
    industria?: string;
  };
}

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

export default function Cotizaciones() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [selectedTipoEmpaque, setSelectedTipoEmpaque] = useState<string>('');
  const [selectedIndustria, setSelectedIndustria] = useState<string>('');
  const [clientes, setClientes] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  useEffect(() => {
    if (user) {
      fetchCotizaciones();
      fetchClientes();
    }
  }, [user]);

  const fetchCotizaciones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cotizaciones')
        .select(`
          *,
          clientes (
            nombre_empresa,
            industria
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCotizaciones((data || []).map(item => ({
        ...item,
        medidas_caja_mm: item.medidas_caja_mm as any
      })));
    } catch (error) {
      console.error('Error fetching cotizaciones:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las cotizaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
    }
  };

  const filteredCotizaciones = cotizaciones.filter(cotizacion => {
    const matchesSearch = 
      cotizacion.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cotizacion.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cotizacion.clientes?.nombre_empresa.toLowerCase().includes(searchTerm.toLowerCase()) || false;

    const matchesCliente = selectedCliente === '' || selectedCliente === 'all' || cotizacion.cliente_id === selectedCliente;
    const matchesTipoEmpaque = selectedTipoEmpaque === '' || selectedTipoEmpaque === 'all' || cotizacion.tipo_empaque === selectedTipoEmpaque;
    const matchesIndustria = selectedIndustria === '' || selectedIndustria === 'all' || cotizacion.industria === selectedIndustria;

    return matchesSearch && matchesCliente && matchesTipoEmpaque && matchesIndustria;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cotizaciones</h1>
            <p className="text-muted-foreground">Gestiona las cotizaciones de productos para tus clientes</p>
          </div>
          <div className="flex gap-2">
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <ImportarCotizacionesCompletas onImportComplete={fetchCotizaciones} />
            <ImportarCotizaciones onImportComplete={fetchCotizaciones} />
            <Button 
              className="shadow-lg"
              onClick={() => navigate('/cotizaciones/nueva')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cotización
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por producto, SKU o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los clientes</SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nombre_empresa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTipoEmpaque} onValueChange={setSelectedTipoEmpaque}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de empaque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {tiposEmpaque.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedIndustria} onValueChange={setSelectedIndustria}>
                <SelectTrigger>
                  <SelectValue placeholder="Industria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las industrias</SelectItem>
                  {industrias.map((industria) => (
                    <SelectItem key={industria.value} value={industria.value}>
                      {industria.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Cotizaciones */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCotizaciones.map((cotizacion) => (
              <Card 
                key={cotizacion.id} 
                className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-primary"
                onClick={() => navigate(`/cotizaciones/${cotizacion.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-foreground mb-1">
                        {cotizacion.nombre_producto}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        SKU: {cotizacion.sku}
                      </CardDescription>
                    </div>
                    {cotizacion.documento_pdf && (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Cliente:</span>
                    <span className="text-sm font-semibold text-foreground">
                       {cotizacion.clientes?.nombre_empresa || 'Sin cliente asignado'}
                     </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Precio unitario:</span>
                    <span className="text-sm font-bold text-primary">
                      {formatPrice(cotizacion.precio_unitario)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Cantidad:</span>
                    <span className="text-sm text-foreground">
                      {cotizacion.cantidad_cotizada.toLocaleString()} und
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Medidas:</span>
                    <span className="text-sm text-foreground flex items-center gap-1">
                      <Ruler className="h-3 w-3" />
                      {cotizacion.medidas_caja_mm.ancho_mm} × {cotizacion.medidas_caja_mm.alto_mm} × {cotizacion.medidas_caja_mm.profundidad_mm} mm
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {cotizacion.tipo_empaque && (
                      <Badge variant="secondary" className="text-xs">
                        <Package className="h-3 w-3 mr-1" />
                        {tiposEmpaque.find(t => t.value === cotizacion.tipo_empaque)?.label}
                      </Badge>
                    )}
                    {cotizacion.industria && (
                      <Badge variant="outline" className="text-xs">
                        {industrias.find(i => i.value === cotizacion.industria)?.label}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(cotizacion.fecha_cotizacion), 'dd/MM/yyyy', { locale: es })}
                    </span>
                    {cotizacion.troquel_id && (
                      <span className="text-xs text-muted-foreground">
                        Troquel #{cotizacion.troquel_id}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Lista de Cotizaciones</CardTitle>
              <CardDescription>
                Vista tabular de todas las cotizaciones ({filteredCotizaciones.length} registros)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número de troquel</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Nombre troquel</TableHead>
                      <TableHead>Tamaño</TableHead>
                      <TableHead>Alto mm</TableHead>
                      <TableHead>Ancho mm</TableHead>
                      <TableHead>Profundidad mm</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Corte</TableHead>
                      <TableHead>Tamaños por corte</TableHead>
                      <TableHead>Tamaños por pliego</TableHead>
                      <TableHead>Tamaño especial</TableHead>
                      <TableHead>Nota</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCotizaciones.map((cotizacion) => {
                      // Extraer tamaño especial y nota de observaciones
                      const observaciones = cotizacion.observaciones || '';
                      const tamañoEspecial = observaciones.includes('Tamaño especial:') 
                        ? observaciones.split('Tamaño especial:')[1]?.split('|')[0]?.trim() 
                        : '';
                      const nota = observaciones.split('|').find(part => 
                        !part.includes('Tamaño especial:') && part.trim()
                      )?.trim() || '';

                      return (
                        <TableRow 
                          key={cotizacion.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/cotizaciones/${cotizacion.id}`)}
                        >
                          <TableCell>{cotizacion.troquel_id || '-'}</TableCell>
                          <TableCell>{cotizacion.clientes?.nombre_empresa || 'Sin cliente'}</TableCell>
                          <TableCell>{cotizacion.descripcion_montaje || '-'}</TableCell>
                          <TableCell>
                            {cotizacion.medidas_caja_mm.ancho_mm}×{cotizacion.medidas_caja_mm.alto_mm}×{cotizacion.medidas_caja_mm.profundidad_mm}mm
                          </TableCell>
                          <TableCell>{cotizacion.medidas_caja_mm.alto_mm}</TableCell>
                          <TableCell>{cotizacion.medidas_caja_mm.ancho_mm}</TableCell>
                          <TableCell>{cotizacion.medidas_caja_mm.profundidad_mm}</TableCell>
                          <TableCell className="font-medium">{cotizacion.sku}</TableCell>
                          <TableCell>{cotizacion.corte || '-'}</TableCell>
                          <TableCell>{cotizacion.tamaños_por_corte || '-'}</TableCell>
                          <TableCell>{cotizacion.tamaños_por_pliego || '-'}</TableCell>
                          <TableCell>{tamañoEspecial || '-'}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={nota}>
                            {nota || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredCotizaciones.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <CardTitle className="text-xl mb-2">No se encontraron cotizaciones</CardTitle>
              <CardDescription>
                {searchTerm || selectedCliente || selectedTipoEmpaque || selectedIndustria
                  ? 'No hay cotizaciones que coincidan con los filtros aplicados.'
                  : 'Comienza creando tu primera cotización.'}
              </CardDescription>
              <Button 
                className="mt-4"
                onClick={() => navigate('/cotizaciones/nueva')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Cotización
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}