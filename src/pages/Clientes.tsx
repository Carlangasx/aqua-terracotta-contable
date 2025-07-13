import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, ArrowLeft, Phone, Mail, MapPin, Building } from 'lucide-react';

interface Cliente {
  id: string;
  empresa_nombre: string;
  telefono_empresa: string;
  correo: string;
  rif: string;
  direccion_fiscal: string;
  contribuyente_especial: boolean;
  industria: string;
  contacto_nombre: string;
  contacto_telefono: string;
  created_at: string;
}

export default function Clientes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState({
    empresa_nombre: '',
    telefono_empresa: '',
    correo: '',
    rif: '',
    direccion_fiscal: '',
    contribuyente_especial: false,
    industria: '',
    contacto_nombre: '',
    contacto_telefono: '',
  });

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
      toast({
        title: "Error",
        description: "Error al cargar los clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredClientes = clientes.filter(cliente =>
    cliente.empresa_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.rif.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.contacto_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      empresa_nombre: '',
      telefono_empresa: '',
      correo: '',
      rif: '',
      direccion_fiscal: '',
      contribuyente_especial: false,
      industria: '',
      contacto_nombre: '',
      contacto_telefono: '',
    });
    setEditingCliente(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (cliente: Cliente) => {
    setFormData({
      empresa_nombre: cliente.empresa_nombre,
      telefono_empresa: cliente.telefono_empresa || '',
      correo: cliente.correo || '',
      rif: cliente.rif,
      direccion_fiscal: cliente.direccion_fiscal || '',
      contribuyente_especial: cliente.contribuyente_especial,
      industria: cliente.industria || '',
      contacto_nombre: cliente.contacto_nombre || '',
      contacto_telefono: cliente.contacto_telefono || '',
    });
    setEditingCliente(cliente);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCliente) {
        const { error } = await supabase
          .from('clientes')
          .update({ ...formData, user_id: user?.id })
          .eq('id', editingCliente.id);
        
        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Cliente actualizado correctamente",
        });
      } else {
        const { error } = await supabase
          .from('clientes')
          .insert([{ ...formData, user_id: user?.id }]);
        
        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Cliente creado correctamente",
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadClientes();
    } catch (error: any) {
      console.error('Error saving cliente:', error);
      toast({
        title: "Error",
        description: error.message || "Error al guardar el cliente",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) return;
    
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Cliente eliminado correctamente",
      });
      
      loadClientes();
    } catch (error: any) {
      console.error('Error deleting cliente:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el cliente",
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
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-primary">Gestión de Clientes</h1>
                <p className="text-muted-foreground">Administra la información de tus clientes</p>
              </div>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCliente ? 'Modifica la información del cliente' : 'Completa la información del nuevo cliente'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="empresa_nombre">Nombre de la Empresa *</Label>
                      <Input
                        id="empresa_nombre"
                        value={formData.empresa_nombre}
                        onChange={(e) => setFormData({ ...formData, empresa_nombre: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="rif">RIF *</Label>
                      <Input
                        id="rif"
                        value={formData.rif}
                        onChange={(e) => setFormData({ ...formData, rif: e.target.value })}
                        placeholder="J-12345678-9"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="telefono_empresa">Teléfono Empresa</Label>
                      <Input
                        id="telefono_empresa"
                        value={formData.telefono_empresa}
                        onChange={(e) => setFormData({ ...formData, telefono_empresa: e.target.value })}
                        placeholder="+58 212 123-4567"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="correo">Correo Electrónico</Label>
                      <Input
                        id="correo"
                        type="email"
                        value={formData.correo}
                        onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                        placeholder="empresa@email.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="industria">Industria</Label>
                      <Input
                        id="industria"
                        value={formData.industria}
                        onChange={(e) => setFormData({ ...formData, industria: e.target.value })}
                        placeholder="Comercio, Servicios, etc."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contacto_nombre">Nombre del Contacto</Label>
                      <Input
                        id="contacto_nombre"
                        value={formData.contacto_nombre}
                        onChange={(e) => setFormData({ ...formData, contacto_nombre: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contacto_telefono">Teléfono del Contacto</Label>
                      <Input
                        id="contacto_telefono"
                        value={formData.contacto_telefono}
                        onChange={(e) => setFormData({ ...formData, contacto_telefono: e.target.value })}
                        placeholder="+58 414 123-4567"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="direccion_fiscal">Dirección Fiscal</Label>
                    <Input
                      id="direccion_fiscal"
                      value={formData.direccion_fiscal}
                      onChange={(e) => setFormData({ ...formData, direccion_fiscal: e.target.value })}
                      placeholder="Dirección completa"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="contribuyente_especial"
                      checked={formData.contribuyente_especial}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, contribuyente_especial: checked as boolean })
                      }
                    />
                    <Label htmlFor="contribuyente_especial">Contribuyente Especial</Label>
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingCliente ? 'Actualizar' : 'Crear'} Cliente
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, RIF o contacto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Clientes Table */}
          <Card>
            <CardHeader>
              <CardTitle>Clientes ({filteredClientes.length})</CardTitle>
              <CardDescription>
                Lista de todos tus clientes registrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Cargando clientes...</p>
              ) : filteredClientes.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={openCreateDialog} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Crear primer cliente
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>RIF</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Industria</TableHead>
                        <TableHead>Estatus</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClientes.map((cliente) => (
                        <TableRow key={cliente.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{cliente.empresa_nombre}</div>
                              {cliente.correo && (
                                <div className="text-sm text-muted-foreground flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {cliente.correo}
                                </div>
                              )}
                              {cliente.telefono_empresa && (
                                <div className="text-sm text-muted-foreground flex items-center">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {cliente.telefono_empresa}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="bg-muted px-2 py-1 rounded text-sm">
                              {cliente.rif}
                            </code>
                          </TableCell>
                          <TableCell>
                            {cliente.contacto_nombre && (
                              <div>
                                <div className="font-medium">{cliente.contacto_nombre}</div>
                                {cliente.contacto_telefono && (
                                  <div className="text-sm text-muted-foreground flex items-center">
                                    <Phone className="h-3 w-3 mr-1" />
                                    {cliente.contacto_telefono}
                                  </div>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {cliente.industria && (
                              <Badge variant="secondary">{cliente.industria}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {cliente.contribuyente_especial && (
                              <Badge>Contribuyente Especial</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(cliente)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(cliente.id)}
                              >
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