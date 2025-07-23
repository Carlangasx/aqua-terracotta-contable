
import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, Phone, Mail, Building, Users } from 'lucide-react';

interface Cliente {
  id: string;
  nombre_empresa: string;
  telefono_empresa?: string;
  correo?: string;
  rif: string;
  direccion_fiscal?: string;
  contribuyente_especial?: boolean;
  industria?: string;
  persona_contacto?: string;
  telefono_contacto?: string;
  created_at: string;
}

export default function Clientes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadClientes();
    }
  }, [user]);

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Error loading clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    try {
      const clienteData = {
        user_id: user?.id,
        nombre_empresa: formData.get('nombre_empresa') as string,
        telefono_empresa: formData.get('telefono_empresa') as string,
        correo: formData.get('correo') as string,
        rif: formData.get('rif') as string,
        direccion_fiscal: formData.get('direccion_fiscal') as string,
        contribuyente_especial: formData.get('contribuyente_especial') === 'on',
        industria: formData.get('industria') as string,
        persona_contacto: formData.get('persona_contacto') as string,
        telefono_contacto: formData.get('telefono_contacto') as string,
      };

      const { error } = await supabase
        .from('clientes')
        .insert([clienteData]);
      
      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Cliente creado correctamente",
      });
      
      setIsDialogOpen(false);
      loadClientes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al crear el cliente",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre_empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.rif.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.persona_contacto && cliente.persona_contacto.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 bg-odoo-light-gray min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-responsive-xl font-bold text-odoo-purple flex items-center">
              <Users className="mr-3" />
              Gestión de Clientes
            </h1>
            <p className="text-odoo-dark-charcoal/70 text-responsive-sm">Administra la información de tus clientes</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-odoo-primary ripple-effect">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl card-odoo">
              <DialogHeader>
                <DialogTitle className="text-odoo-purple">Nuevo Cliente</DialogTitle>
                <DialogDescription className="text-odoo-dark-charcoal/70">
                  Completa la información del nuevo cliente
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre_empresa" className="text-odoo-dark-charcoal font-medium">Nombre de Empresa *</Label>
                    <Input 
                      id="nombre_empresa" 
                      name="nombre_empresa" 
                      required 
                      placeholder="Ej: Empresa XYZ C.A."
                      className="input-odoo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rif" className="text-odoo-dark-charcoal font-medium">RIF *</Label>
                    <Input 
                      id="rif" 
                      name="rif" 
                      required 
                      placeholder="J-12345678-9"
                      className="input-odoo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="correo" className="text-odoo-dark-charcoal font-medium">Correo</Label>
                    <Input 
                      id="correo" 
                      name="correo" 
                      type="email"
                      placeholder="empresa@email.com"
                      className="input-odoo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono_empresa" className="text-odoo-dark-charcoal font-medium">Teléfono</Label>
                    <Input 
                      id="telefono_empresa" 
                      name="telefono_empresa" 
                      placeholder="+58 212-123-4567"
                      className="input-odoo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="persona_contacto" className="text-odoo-dark-charcoal font-medium">Persona de Contacto</Label>
                    <Input 
                      id="persona_contacto" 
                      name="persona_contacto" 
                      placeholder="Juan Pérez"
                      className="input-odoo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono_contacto" className="text-odoo-dark-charcoal font-medium">Teléfono Contacto</Label>
                    <Input 
                      id="telefono_contacto" 
                      name="telefono_contacto" 
                      placeholder="+58 424-123-4567"
                      className="input-odoo"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="direccion_fiscal" className="text-odoo-dark-charcoal font-medium">Dirección Fiscal</Label>
                  <Input 
                    id="direccion_fiscal" 
                    name="direccion_fiscal" 
                    placeholder="Dirección completa"
                    className="input-odoo"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="contribuyente_especial" name="contribuyente_especial" />
                  <Label htmlFor="contribuyente_especial" className="text-odoo-dark-charcoal font-medium">Contribuyente Especial</Label>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="btn-odoo-secondary">
                    Cancelar
                  </Button>
                  <Button type="submit" className="btn-odoo-primary ripple-effect">Crear Cliente</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Bar */}
        <Card className="card-odoo mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-odoo-dark-charcoal/50 h-4 w-4" />
              <Input
                placeholder="Buscar por empresa, RIF o contacto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-odoo pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="card-odoo fade-up">
          <CardHeader>
            <CardTitle className="text-odoo-purple">
              Clientes ({filteredClientes.length})
            </CardTitle>
            <CardDescription className="text-odoo-dark-charcoal/70">
              Listado completo de clientes registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-odoo-purple mx-auto"></div>
                <p className="text-odoo-dark-charcoal/70 mt-2">Cargando clientes...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-odoo-medium-gray">
                      <TableHead className="text-odoo-dark-charcoal font-medium">Empresa</TableHead>
                      <TableHead className="text-odoo-dark-charcoal font-medium">RIF</TableHead>
                      <TableHead className="text-odoo-dark-charcoal font-medium">Contacto</TableHead>
                      <TableHead className="text-odoo-dark-charcoal font-medium">Teléfono</TableHead>
                      <TableHead className="text-odoo-dark-charcoal font-medium">Correo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClientes.map((cliente, index) => (
                      <TableRow 
                        key={cliente.id} 
                        className="border-odoo-medium-gray hover:bg-odoo-light-gray/50 transition-colors fade-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <TableCell className="font-medium text-odoo-purple">{cliente.nombre_empresa}</TableCell>
                        <TableCell className="text-odoo-dark-charcoal">{cliente.rif}</TableCell>
                        <TableCell className="text-odoo-dark-charcoal">{cliente.persona_contacto || '-'}</TableCell>
                        <TableCell className="text-odoo-dark-charcoal">{cliente.telefono_contacto || '-'}</TableCell>
                        <TableCell className="text-odoo-dark-charcoal">{cliente.correo || '-'}</TableCell>
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
