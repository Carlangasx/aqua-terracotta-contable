import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Upload, FileText } from 'lucide-react';

interface DocumentoOrigen {
  id: number;
  numero_documento: string;
  tipo_documento: string;
  fecha_emision: string;
  clientes: {
    nombre_empresa: string;
  };
}

interface CACData {
  documentoOrigenId: string;
  codificacion: string;
  revision: number;
  fechaCaducidad: string;
  anchoReal: number;
  altoReal: number;
  profundidadReal: number;
  sustrato: string;
  calibre: string;
  colores: string;
  barniz: string;
  plastificado: string;
  troquelado: string;
  empaquetado: string;
  pegado: string;
  nPaquetes: string;
  observaciones: string;
  arteFinalFile: File | null;
  cotizacionFile: File | null;
}

interface CACFormProps {
  clienteId: string;
  onDataChange: (data: CACData) => void;
  onValidityChange: (isValid: boolean) => void;
}

export default function CACForm({ clienteId, onDataChange, onValidityChange }: CACFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [documentosOrigen, setDocumentosOrigen] = useState<DocumentoOrigen[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [cacData, setCacData] = useState<CACData>({
    documentoOrigenId: '',
    codificacion: '',
    revision: 1,
    fechaCaducidad: '',
    anchoReal: 0,
    altoReal: 0,
    profundidadReal: 0,
    sustrato: '',
    calibre: '',
    colores: '',
    barniz: '',
    plastificado: '',
    troquelado: '',
    empaquetado: '',
    pegado: '',
    nPaquetes: '',
    observaciones: '',
    arteFinalFile: null,
    cotizacionFile: null
  });

  useEffect(() => {
    if (clienteId && user) {
      loadDocumentosOrigen();
    }
  }, [clienteId, user]);

  useEffect(() => {
    onDataChange(cacData);
    
    // Validar campos requeridos
    const isValid = !!(
      cacData.documentoOrigenId &&
      cacData.codificacion &&
      cacData.fechaCaducidad &&
      cacData.sustrato &&
      cacData.arteFinalFile &&
      cacData.cotizacionFile
    );
    
    onValidityChange(isValid);
  }, [cacData, onDataChange, onValidityChange]);

  const loadDocumentosOrigen = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documentos_generados')
        .select(`
          id,
          numero_documento,
          tipo_documento,
          fecha_emision,
          clientes (
            nombre_empresa
          )
        `)
        .eq('user_id', user?.id)
        .eq('cliente_id', clienteId)
        .in('tipo_documento', ['FACT', 'NDE'])
        .order('fecha_emision', { ascending: false });

      if (error) throw error;

      setDocumentosOrigen(data || []);
    } catch (error) {
      console.error('Error loading documentos origen:', error);
      toast({
        title: "Error",
        description: "Error al cargar documentos origen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CACData, value: any) => {
    setCacData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: 'arteFinalFile' | 'cotizacionFile', file: File | null) => {
    setCacData(prev => ({ ...prev, [field]: file }));
  };

  const documentoSeleccionado = documentosOrigen.find(d => d.id.toString() === cacData.documentoOrigenId);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Documento Origen */}
      <Card>
        <CardHeader>
          <CardTitle>Documento Origen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Seleccionar Documento</Label>
            <Select 
              value={cacData.documentoOrigenId} 
              onValueChange={(value) => handleInputChange('documentoOrigenId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione factura o nota de entrega" />
              </SelectTrigger>
              <SelectContent>
                {documentosOrigen.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id.toString()}>
                    {doc.tipo_documento}-{doc.numero_documento} - {doc.clientes.nombre_empresa}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {documentoSeleccionado && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <Label className="text-sm font-medium">Documento</Label>
                <p className="text-sm">{documentoSeleccionado.numero_documento}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Tipo</Label>
                <p className="text-sm">{documentoSeleccionado.tipo_documento}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Fecha</Label>
                <p className="text-sm">{new Date(documentoSeleccionado.fecha_emision).toLocaleDateString('es-VE')}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Datos del CAC */}
      <Card>
        <CardHeader>
          <CardTitle>Datos del Certificado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="codificacion">Codificación *</Label>
              <Input
                id="codificacion"
                value={cacData.codificacion}
                onChange={(e) => handleInputChange('codificacion', e.target.value)}
                placeholder="Código del producto"
              />
            </div>
            <div>
              <Label htmlFor="revision">Revisión</Label>
              <Input
                id="revision"
                type="number"
                min="1"
                value={cacData.revision}
                onChange={(e) => handleInputChange('revision', parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label htmlFor="fecha-caducidad">Fecha Caducidad *</Label>
              <Input
                id="fecha-caducidad"
                type="date"
                value={cacData.fechaCaducidad}
                onChange={(e) => handleInputChange('fechaCaducidad', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dimensiones Reales */}
      <Card>
        <CardHeader>
          <CardTitle>Dimensiones Reales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="ancho-real">Ancho Real (mm)</Label>
              <Input
                id="ancho-real"
                type="number"
                step="0.1"
                value={cacData.anchoReal}
                onChange={(e) => handleInputChange('anchoReal', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="alto-real">Alto Real (mm)</Label>
              <Input
                id="alto-real"
                type="number"
                step="0.1"
                value={cacData.altoReal}
                onChange={(e) => handleInputChange('altoReal', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="profundidad-real">Profundidad Real (mm)</Label>
              <Input
                id="profundidad-real"
                type="number"
                step="0.1"
                value={cacData.profundidadReal}
                onChange={(e) => handleInputChange('profundidadReal', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Características del Producto */}
      <Card>
        <CardHeader>
          <CardTitle>Características del Producto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sustrato">Sustrato *</Label>
              <Input
                id="sustrato"
                value={cacData.sustrato}
                onChange={(e) => handleInputChange('sustrato', e.target.value)}
                placeholder="Material base"
              />
            </div>
            <div>
              <Label htmlFor="calibre">Calibre</Label>
              <Input
                id="calibre"
                value={cacData.calibre}
                onChange={(e) => handleInputChange('calibre', e.target.value)}
                placeholder="Grosor del material"
              />
            </div>
            <div>
              <Label htmlFor="colores">Colores</Label>
              <Input
                id="colores"
                value={cacData.colores}
                onChange={(e) => handleInputChange('colores', e.target.value)}
                placeholder="Número y tipo de colores"
              />
            </div>
            <div>
              <Label htmlFor="barniz">Barniz</Label>
              <Input
                id="barniz"
                value={cacData.barniz}
                onChange={(e) => handleInputChange('barniz', e.target.value)}
                placeholder="Tipo de barniz aplicado"
              />
            </div>
            <div>
              <Label htmlFor="plastificado">Plastificado</Label>
              <Input
                id="plastificado"
                value={cacData.plastificado}
                onChange={(e) => handleInputChange('plastificado', e.target.value)}
                placeholder="Tipo de plastificado"
              />
            </div>
            <div>
              <Label htmlFor="troquelado">Troquelado</Label>
              <Input
                id="troquelado"
                value={cacData.troquelado}
                onChange={(e) => handleInputChange('troquelado', e.target.value)}
                placeholder="Tipo de troquelado"
              />
            </div>
            <div>
              <Label htmlFor="empaquetado">Empaquetado</Label>
              <Input
                id="empaquetado"
                value={cacData.empaquetado}
                onChange={(e) => handleInputChange('empaquetado', e.target.value)}
                placeholder="Método de empaquetado"
              />
            </div>
            <div>
              <Label htmlFor="pegado">Pegado</Label>
              <Input
                id="pegado"
                value={cacData.pegado}
                onChange={(e) => handleInputChange('pegado', e.target.value)}
                placeholder="Tipo de pegado"
              />
            </div>
            <div>
              <Label htmlFor="n-paquetes">Nº Paquetes</Label>
              <Input
                id="n-paquetes"
                value={cacData.nPaquetes}
                onChange={(e) => handleInputChange('nPaquetes', e.target.value)}
                placeholder="Cantidad de paquetes"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="observaciones-cac">Observaciones</Label>
            <Textarea
              id="observaciones-cac"
              value={cacData.observaciones}
              onChange={(e) => handleInputChange('observaciones', e.target.value)}
              placeholder="Observaciones adicionales del análisis..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Archivos */}
      <Card>
        <CardHeader>
          <CardTitle>Archivos Requeridos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="arte-final">Arte Final PDF *</Label>
              <div className="mt-2">
                <Input
                  id="arte-final"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange('arteFinalFile', e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('arte-final')?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {cacData.arteFinalFile ? cacData.arteFinalFile.name : 'Seleccionar Arte Final'}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="cotizacion">Cotización PDF *</Label>
              <div className="mt-2">
                <Input
                  id="cotizacion"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange('cotizacionFile', e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('cotizacion')?.click()}
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {cacData.cotizacionFile ? cacData.cotizacionFile.name : 'Seleccionar Cotización'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}