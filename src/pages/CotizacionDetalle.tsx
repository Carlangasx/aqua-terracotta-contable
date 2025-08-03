import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, ArrowLeft, Package, DollarSign, Ruler, FileText, Copy, Download, Eye, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
  created_at: string;
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

export default function CotizacionDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [historialVersiones, setHistorialVersiones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<Cotizacion | null>(null);
  const [showVersionModal, setShowVersionModal] = useState(false);

  useEffect(() => {
    if (user && id) {
      fetchCotizacion();
    }
  }, [user, id]);

  const fetchCotizacion = async () => {
    try {
      // Obtener la cotización actual
      const { data: cotizacionData, error: cotizacionError } = await supabase
        .from('cotizaciones')
        .select(`
          *,
          clientes (
            nombre_empresa,
            industria
          )
        `)
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (cotizacionError) throw cotizacionError;
      if (!cotizacionData) {
        toast({
          title: "Error",
          description: "Cotización no encontrada",
          variant: "destructive",
        });
        navigate('/cotizaciones');
        return;
      }

      const cotizacionFormatted = {
        ...cotizacionData,
        medidas_caja_mm: cotizacionData.medidas_caja_mm as any
      };

      setCotizacion(cotizacionFormatted);

      // Obtener historial de versiones (mismo SKU + cliente)
      const { data: historialData, error: historialError } = await supabase
        .from('cotizaciones')
        .select(`
          *,
          clientes (
            nombre_empresa,
            industria
          )
        `)
        .eq('sku', cotizacionData.sku)
        .eq('cliente_id', cotizacionData.cliente_id)
        .eq('user_id', user?.id)
        .order('fecha_cotizacion', { ascending: false });

      if (historialError) throw historialError;
      
      const historialFormatted = (historialData || []).map(item => ({
        ...item,
        medidas_caja_mm: item.medidas_caja_mm as any
      }));

      setHistorialVersiones(historialFormatted);
    } catch (error) {
      console.error('Error fetching cotización:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de la cotización",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopiarCotizacion = async (version: Cotizacion) => {
    try {
      const nuevaCotizacion = {
        cliente_id: version.cliente_id,
        sku: version.sku,
        nombre_producto: version.nombre_producto,
        troquel_id: version.troquel_id,
        medidas_caja_mm: version.medidas_caja_mm,
        descripcion_montaje: version.descripcion_montaje,
        cantidad_cotizada: version.cantidad_cotizada,
        precio_unitario: version.precio_unitario,
        observaciones: version.observaciones,
        tipo_empaque: version.tipo_empaque,
        industria: version.industria,
        user_id: user?.id,
        fecha_cotizacion: new Date().toISOString().split('T')[0]
      };

      const { data, error } = await supabase
        .from('cotizaciones')
        .insert([nuevaCotizacion])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Cotización copiada exitosamente",
      });

      // Actualizar el historial
      await fetchCotizacion();
    } catch (error) {
      console.error('Error copying cotización:', error);
      toast({
        title: "Error",
        description: "No se pudo copiar la cotización",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getTipoEmpaqueLabel = (tipo?: string) => {
    return tiposEmpaque.find(t => t.value === tipo)?.label || tipo;
  };

  const getIndustriaLabel = (industria?: string) => {
    return industrias.find(i => i.value === industria)?.label || industria;
  };

  const handleDownloadPDF = (url: string) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!cotizacion) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Cotización no encontrada</h1>
          <Button onClick={() => navigate('/cotizaciones')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Cotizaciones
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/cotizaciones')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{cotizacion.nombre_producto}</h1>
            <p className="text-muted-foreground">
              SKU: {cotizacion.sku} • Cliente: {cotizacion.clientes?.nombre_empresa}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate(`/cotizaciones/editar/${cotizacion.id}`)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar Cotización
        </Button>
      </div>

      {/* Información Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Cotización</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Precio Unitario:</span>
                  <p className="text-2xl font-bold text-primary">{formatPrice(cotizacion.precio_unitario)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Cantidad Cotizada:</span>
                  <p className="text-xl font-semibold">{cotizacion.cantidad_cotizada.toLocaleString()} und</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Medidas de Caja:</span>
                  <p className="flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    {cotizacion.medidas_caja_mm.ancho_mm} × {cotizacion.medidas_caja_mm.alto_mm} × {cotizacion.medidas_caja_mm.profundidad_mm} mm
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Fecha de Cotización:</span>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(cotizacion.fecha_cotizacion), 'dd/MM/yyyy', { locale: es })}
                  </p>
                </div>
              </div>

              {cotizacion.troquel_id && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Troquel:</span>
                  <p>#{cotizacion.troquel_id}</p>
                </div>
              )}

              {cotizacion.descripcion_montaje && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Descripción de Montaje:</span>
                  <p className="text-sm">{cotizacion.descripcion_montaje}</p>
                </div>
              )}

              {cotizacion.corte && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Corte:</span>
                  <p className="text-sm">{cotizacion.corte}</p>
                </div>
              )}

              {cotizacion.tamaños_por_corte && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Tamaños por Corte:</span>
                  <p className="text-sm">{cotizacion.tamaños_por_corte}</p>
                </div>
              )}

              {cotizacion.tamaños_por_pliego && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Tamaños por Pliego:</span>
                  <p className="text-sm">{cotizacion.tamaños_por_pliego}</p>
                </div>
              )}

              {cotizacion.observaciones && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Observaciones:</span>
                  <p className="text-sm">{cotizacion.observaciones}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {cotizacion.tipo_empaque && (
                  <Badge variant="secondary">
                    <Package className="h-3 w-3 mr-1" />
                    {getTipoEmpaqueLabel(cotizacion.tipo_empaque)}
                  </Badge>
                )}
                {cotizacion.industria && (
                  <Badge variant="outline">
                    {getIndustriaLabel(cotizacion.industria)}
                  </Badge>
                )}
              </div>

              {cotizacion.documento_pdf && (
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadPDF(cotizacion.documento_pdf!)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Historial de Versiones</CardTitle>
              <CardDescription>
                {historialVersiones.length} versión{historialVersiones.length !== 1 ? 'es' : ''} de este SKU
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {historialVersiones.map((version) => (
                  <div
                    key={version.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      version.id === cotizacion.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm">
                          {format(new Date(version.fecha_cotizacion), 'dd/MM/yyyy', { locale: es })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(version.created_at), 'HH:mm', { locale: es })}
                        </p>
                      </div>
                      <Badge variant={version.id === cotizacion.id ? 'default' : 'secondary'} className="text-xs">
                        {version.id === cotizacion.id ? 'Actual' : 'Anterior'}
                      </Badge>
                    </div>
                    
                    <p className="font-bold text-primary text-sm mb-2">
                      {formatPrice(version.precio_unitario)}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => {
                          setSelectedVersion(version);
                          setShowVersionModal(true);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      {version.documento_pdf && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => handleDownloadPDF(version.documento_pdf!)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                      )}
                      {version.id !== cotizacion.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => handleCopiarCotizacion(version)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de detalles de versión */}
      <Dialog open={showVersionModal} onOpenChange={setShowVersionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Versión</DialogTitle>
            <DialogDescription>
              Cotización del {selectedVersion && format(new Date(selectedVersion.fecha_cotizacion), 'dd/MM/yyyy', { locale: es })}
            </DialogDescription>
          </DialogHeader>
          
          {selectedVersion && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Precio Unitario:</span>
                  <p className="text-xl font-bold text-primary">{formatPrice(selectedVersion.precio_unitario)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Cantidad:</span>
                  <p className="text-lg font-semibold">{selectedVersion.cantidad_cotizada.toLocaleString()} und</p>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium text-muted-foreground">Medidas de Caja:</span>
                <p className="flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  {selectedVersion.medidas_caja_mm.ancho_mm} × {selectedVersion.medidas_caja_mm.alto_mm} × {selectedVersion.medidas_caja_mm.profundidad_mm} mm
                </p>
              </div>

              {selectedVersion.troquel_id && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Troquel:</span>
                  <p>#{selectedVersion.troquel_id}</p>
                </div>
              )}

              {selectedVersion.descripcion_montaje && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Descripción de Montaje:</span>
                  <p className="text-sm">{selectedVersion.descripcion_montaje}</p>
                </div>
              )}

              {selectedVersion.corte && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Corte:</span>
                  <p className="text-sm">{selectedVersion.corte}</p>
                </div>
              )}

              {selectedVersion.tamaños_por_corte && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Tamaños por Corte:</span>
                  <p className="text-sm">{selectedVersion.tamaños_por_corte}</p>
                </div>
              )}

              {selectedVersion.tamaños_por_pliego && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Tamaños por Pliego:</span>
                  <p className="text-sm">{selectedVersion.tamaños_por_pliego}</p>
                </div>
              )}

              {selectedVersion.observaciones && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Observaciones:</span>
                  <p className="text-sm">{selectedVersion.observaciones}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {selectedVersion.tipo_empaque && (
                  <Badge variant="secondary">
                    <Package className="h-3 w-3 mr-1" />
                    {getTipoEmpaqueLabel(selectedVersion.tipo_empaque)}
                  </Badge>
                )}
                {selectedVersion.industria && (
                  <Badge variant="outline">
                    {getIndustriaLabel(selectedVersion.industria)}
                  </Badge>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                {selectedVersion.documento_pdf && (
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadPDF(selectedVersion.documento_pdf!)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </Button>
                )}
                <Button
                  onClick={() => handleCopiarCotizacion(selectedVersion)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Esta Versión
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}