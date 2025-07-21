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
import { Plus, Search, ArrowLeft, FileText, Download, Trash2 } from 'lucide-react';

interface DocumentoGenerado {
  id: number;
  tipo_documento: string;
  numero_documento: string;
  numero_control_general: number;
  cliente_id: string;
  fecha_emision: string;
  total: number;
  estado: string;
  clientes?: {
    nombre_empresa: string;
    rif: string;
  };
}

const TIPOS_DOCUMENTO = [
  { value: 'factura', label: 'Factura' },
  { value: 'nota_entrega', label: 'Nota de Entrega' },
  { value: 'recibo', label: 'Recibo' },
  { value: 'salida_almacen', label: 'Salida de Almacén' },
  { value: 'nota_credito', label: 'Nota de Crédito' }
];

export default function Documentos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documentos, setDocumentos] = useState<DocumentoGenerado[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('all');

  useEffect(() => {
    if (user) {
      loadDocumentos();
    }
  }, [user]);

  const loadDocumentos = async () => {
    try {
      const { data, error } = await supabase
        .from('documentos_generados')
        .select(`
          *,
          clientes (
            nombre_empresa,
            rif
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocumentos(data || []);
    } catch (error) {
      console.error('Error loading documentos:', error);
      toast({
        title: "Error",
        description: "Error al cargar los documentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredDocumentos = documentos.filter(doc => {
    const matchesSearch = doc.clientes?.nombre_empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.clientes?.rif.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.numero_documento.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = !filtroTipo || filtroTipo === 'all' || doc.tipo_documento === filtroTipo;
    
    return matchesSearch && matchesTipo;
  });

  const handleDownloadPDF = async (documento: DocumentoGenerado) => {
    try {
      console.log('Downloading PDF for document:', documento.id);
      
      const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
        body: { documentId: documento.id }
      });

      if (error) {
        console.error('Error generating PDF:', error);
        toast({
          title: "Error",
          description: "Error al generar el PDF",
          variant: "destructive",
        });
        return;
      }

      // Create a blob from the HTML response and convert to PDF view
      const blob = new Blob([data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Open in new window for better user experience
      const newWindow = window.open(url, '_blank', 'width=800,height=600');
      
      // Clean up after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 30000); // 30 seconds
      
      if (!newWindow) {
        toast({
          title: "Advertencia",
          description: "Por favor permite las ventanas emergentes para descargar el PDF",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Error",
        description: "Error al procesar la descarga del PDF",
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-primary">Documentos Generados</h1>
                <p className="text-muted-foreground">Facturas, notas de entrega, recibos y más</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Link to="/documentos/nuevo">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Documento
                </Button>
              </Link>
              <Link to="/configuracion">
                <Button variant="outline">
                  Configurar Empresa
                </Button>
              </Link>
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por cliente, RIF o número..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    {TIPOS_DOCUMENTO.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setFiltroTipo('all');
                  }}
                >
                  Limpiar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentos ({filteredDocumentos.length})</CardTitle>
              <CardDescription>
                Listado de todos los documentos generados. Puede filtrar por tipo de documento, cliente o buscar por número.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Cargando documentos...</p>
              ) : filteredDocumentos.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No hay documentos generados aún
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Configure primero la información de su empresa y luego podrá generar documentos
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocumentos.map((documento) => (
                        <TableRow key={documento.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{documento.numero_documento}</div>
                              <div className="text-xs text-muted-foreground">
                                Control: {documento.numero_control_general}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {TIPOS_DOCUMENTO.find(t => t.value === documento.tipo_documento)?.label}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(documento.fecha_emision).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{documento.clientes?.nombre_empresa}</div>
                              <div className="text-sm text-muted-foreground">{documento.clientes?.rif}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono font-bold">${documento.total.toFixed(2)}</span>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {documento.estado}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                title="Descargar PDF"
                                onClick={() => handleDownloadPDF(documento)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" title="Eliminar documento">
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
