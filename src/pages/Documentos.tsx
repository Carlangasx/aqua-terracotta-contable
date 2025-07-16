import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, FileText, ArrowLeft } from 'lucide-react';

interface Cliente {
  id: string;
  nombre_empresa: string;
  rif: string;
}

const TIPOS_DOCUMENTO = [
  { value: 'FACT', label: 'Factura' },
  { value: 'NDE', label: 'Nota de Entrega' },
  { value: 'SAL', label: 'Salida de Almacén' }
];

export default function Documentos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTipo, setSelectedTipo] = useState('');
  const [selectedCliente, setSelectedCliente] = useState('');

  useEffect(() => {
    if (user) {
      loadClientes();
    }
  }, [user]);

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nombre_empresa, rif')
        .order('nombre_empresa');

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Error loading clientes:', error);
      toast({
        title: "Error",
        description: "Error al cargar los clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    if (!selectedTipo || !selectedCliente) {
      toast({
        title: "Error",
        description: "Selecciona un tipo de documento y cliente",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate document number
      const { data: numeroData, error: numeroError } = await supabase
        .rpc('generate_document_number', { doc_type: selectedTipo });

      if (numeroError) throw numeroError;

      // Create document
      const { data, error } = await supabase
        .from('documentos_generados')
        .insert({
          tipo_documento: selectedTipo,
          numero_documento: numeroData,
          cliente_id: selectedCliente,
          user_id: user?.id,
          productos: [],
          extras: [],
          total: 0
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Documento ${numeroData} creado correctamente`,
      });

      // Reset form
      setSelectedTipo('');
      setSelectedCliente('');
    } catch (error: any) {
      console.error('Error creating document:', error);
      toast({
        title: "Error",
        description: "Error al crear el documento",
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
          <div className="flex items-center space-x-3 mb-6">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-primary">Documentos</h1>
              <p className="text-muted-foreground">Genera facturas, notas de entrega y salidas de almacén</p>
            </div>
          </div>

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Crear Nuevo Documento
              </CardTitle>
              <CardDescription>
                Selecciona el tipo de documento y cliente para comenzar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Documento</label>
                <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_DOCUMENTO.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{tipo.value}</Badge>
                          {tipo.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cliente</label>
                <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{cliente.nombre_empresa}</span>
                          <span className="text-sm text-muted-foreground">RIF: {cliente.rif}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleCreateDocument}
                disabled={!selectedTipo || !selectedCliente}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Documento
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}