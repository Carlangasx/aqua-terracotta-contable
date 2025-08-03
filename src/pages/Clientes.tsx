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
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null);

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

      if (editingCliente) {
        // Actualizar cliente existente
        const { error } = await supabase
          .from('clientes')
          .update(clienteData)
          .eq('id', editingCliente.id);
        
        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Cliente actualizado correctamente",
        });
      } else {
        // Crear nuevo cliente
        const { error } = await supabase
          .from('clientes')
          .insert([clienteData]);
        
        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Cliente creado correctamente",
        });
      }
      
      setIsDialogOpen(false);
      setEditingCliente(null);
      loadClientes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al procesar el cliente",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!clienteToDelete) return;
    
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clienteToDelete.id);
      
      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Cliente eliminado correctamente",
      });
      
      setClienteToDelete(null);
      loadClientes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el cliente",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingCliente(null);
    setIsDialogOpen(false);
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <MainLayout>
      <div className="p-6 bg-off-white min-h-screen" style={{ fontFamily: 'Inter, Satoshi, Urbanist, sans-serif' }}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-midnight-navy flex items-center">
              <Users className="mr-3" />
              Gestión de Clientes
            </h1>
            <p className="text-slate-gray">Administra la información de tus clientes</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
                <DialogDescription>
                  {editingCliente ? 'Modifica la información del cliente' : 'Completa la información del nuevo cliente'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre_empresa">Nombre de Empresa *</Label>
                    <Input 
                      id="nombre_empresa" 
                      name="nombre_empresa" 
                      required 
                      placeholder="Ej: Empresa XYZ C.A."
                      defaultValue={editingCliente?.nombre_empresa || ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rif">RIF *</Label>
                    <Input 
                      id="rif" 
                      name="rif" 
                      required 
                      placeholder="J-12345678-9"
                      defaultValue={editingCliente?.rif || ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="correo">Correo</Label>
                    <Input 
                      id="correo" 
                      name="correo" 
                      type="email"
                      placeholder="empresa@email.com"
                      defaultValue={editingCliente?.correo || ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono_empresa">Teléfono</Label>
                    <Input 
                      id="telefono_empresa" 
                      name="telefono_empresa" 
                      placeholder="+58 212-123-4567"
                      defaultValue={editingCliente?.telefono_empresa || ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="persona_contacto">Persona de Contacto</Label>
                    <Input 
                      id="persona_contacto" 
                      name="persona_contacto" 
                      placeholder="Juan Pérez"
                      defaultValue={editingCliente?.persona_contacto || ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono_contacto">Teléfono Contacto</Label>
                    <Input 
                      id="telefono_contacto" 
                      name="telefono_contacto" 
                      placeholder="+58 424-123-4567"
                      defaultValue={editingCliente?.telefono_contacto || ''}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="direccion_fiscal">Dirección Fiscal</Label>
                  <Input 
                    id="direccion_fiscal" 
                    name="direccion_fiscal" 
                    placeholder="Dirección completa"
                    defaultValue={editingCliente?.direccion_fiscal || ''}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="contribuyente_especial" 
                    name="contribuyente_especial"
                    defaultChecked={editingCliente?.contribuyente_especial || false}
                  />
                  <Label htmlFor="contribuyente_especial">Contribuyente Especial</Label>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">{editingCliente ? 'Actualizar' : 'Crear'} Cliente</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Barra de búsqueda */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-gray h-4 w-4" />
            <Input
              placeholder="Buscar por nombre, RIF o contacto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Clientes ({clientes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Cargando...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>RIF</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes
                    .filter(cliente => 
                      cliente.nombre_empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      cliente.rif.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (cliente.persona_contacto && cliente.persona_contacto.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nombre_empresa}</TableCell>
                      <TableCell>{cliente.rif}</TableCell>
                      <TableCell>{cliente.persona_contacto || '-'}</TableCell>
                      <TableCell>{cliente.telefono_contacto || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(cliente)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setClienteToDelete(cliente)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog de confirmación para eliminar */}
        <Dialog open={!!clienteToDelete} onOpenChange={() => setClienteToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que quieres eliminar el cliente "{clienteToDelete?.nombre_empresa}"? 
                Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setClienteToDelete(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}