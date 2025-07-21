import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, Settings, Upload } from 'lucide-react';

interface ConfiguracionEmpresa {
  id?: string;
  razon_social: string;
  rif: string;
  direccion_fiscal: string;
  telefono: string;
  correo: string;
  condiciones_pago_default: string;
  logo_url: string;
}

export default function Configuracion() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configuracion, setConfiguracion] = useState<ConfiguracionEmpresa>({
    razon_social: '',
    rif: '',
    direccion_fiscal: '',
    telefono: '',
    correo: '',
    condiciones_pago_default: 'Contado',
    logo_url: ''
  });

  useEffect(() => {
    if (user) {
      loadConfiguracion();
    }
  }, [user]);

  const loadConfiguracion = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion_empresa')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfiguracion(data);
      }
    } catch (error) {
      console.error('Error loading configuración:', error);
      toast({
        title: "Error",
        description: "Error al cargar la configuración de la empresa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const configuracionData = {
        user_id: user?.id,
        ...configuracion
      };

      if (configuracion.id) {
        const { error } = await supabase
          .from('configuracion_empresa')
          .update(configuracionData)
          .eq('id', configuracion.id);
        
        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Configuración actualizada correctamente",
        });
      } else {
        const { data, error } = await supabase
          .from('configuracion_empresa')
          .insert([configuracionData])
          .select()
          .single();
        
        if (error) throw error;
        
        setConfiguracion(data);
        toast({
          title: "Éxito",
          description: "Configuración guardada correctamente",
        });
      }
    } catch (error: any) {
      console.error('Error saving configuración:', error);
      toast({
        title: "Error",
        description: error.message || "Error al guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ConfiguracionEmpresa, value: string) => {
    setConfiguracion(prev => ({
      ...prev,
      [field]: value
    }));
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
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-primary">Configuración de Empresa</h1>
              <p className="text-muted-foreground">Configure los datos de su empresa para los documentos</p>
            </div>
          </div>

          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Información de la Empresa</CardTitle>
              <CardDescription>
                Esta información se utilizará para generar todos los documentos (facturas, notas de entrega, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="razon_social">Razón Social *</Label>
                    <Input
                      id="razon_social"
                      value={configuracion.razon_social}
                      onChange={(e) => handleInputChange('razon_social', e.target.value)}
                      placeholder="Nombre de la empresa"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rif">RIF *</Label>
                    <Input
                      id="rif"
                      value={configuracion.rif}
                      onChange={(e) => handleInputChange('rif', e.target.value)}
                      placeholder="J-12345678-9"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={configuracion.telefono}
                      onChange={(e) => handleInputChange('telefono', e.target.value)}
                      placeholder="+58 412 123 4567"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="correo">Correo Electrónico</Label>
                    <Input
                      id="correo"
                      type="email"
                      value={configuracion.correo}
                      onChange={(e) => handleInputChange('correo', e.target.value)}
                      placeholder="contacto@empresa.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccion_fiscal">Dirección Fiscal *</Label>
                  <Textarea
                    id="direccion_fiscal"
                    value={configuracion.direccion_fiscal}
                    onChange={(e) => handleInputChange('direccion_fiscal', e.target.value)}
                    placeholder="Dirección completa de la empresa"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condiciones_pago">Condiciones de Pago Predeterminadas</Label>
                  <Input
                    id="condiciones_pago"
                    value={configuracion.condiciones_pago_default}
                    onChange={(e) => handleInputChange('condiciones_pago_default', e.target.value)}
                    placeholder="Contado, 15 días, 30 días, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo_url">URL del Logo</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="logo_url"
                      value={configuracion.logo_url}
                      onChange={(e) => handleInputChange('logo_url', e.target.value)}
                      placeholder="https://ejemplo.com/logo.png"
                    />
                    <Button type="button" variant="outline" size="sm">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    URL de la imagen del logo que aparecerá en los documentos
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Guardando...' : 'Guardar Configuración'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}