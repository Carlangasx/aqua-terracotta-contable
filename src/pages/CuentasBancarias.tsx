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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, ArrowLeft, CreditCard, DollarSign, GitBranch } from 'lucide-react';

interface CuentaBancaria {
  id: string;
  banco_nombre: string;
  numero_cuenta: string;
  tipo: 'corriente' | 'ahorro';
  saldo_actual: number;
  moneda: 'VES' | 'USD';
  activa: boolean;
  created_at: string;
}

export default function CuentasBancarias() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCuenta, setEditingCuenta] = useState<CuentaBancaria | null>(null);
  const [formData, setFormData] = useState({
    banco_nombre: '',
    numero_cuenta: '',
    tipo: 'corriente' as 'corriente' | 'ahorro',
    saldo_actual: 0,
    moneda: 'VES' as 'VES' | 'USD',
    activa: true,
  });

  useEffect(() => {
    if (user) {
      loadCuentas();
    }
  }, [user]);

  const loadCuentas = async () => {
    try {
      const { data, error } = await supabase
        .from('cuentas_bancarias')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCuentas(data || []);
    } catch (error) {
      console.error('Error loading cuentas:', error);
      toast({
        title: "Error",
        description: "Error al cargar las cuentas bancarias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCuentas = cuentas.filter(cuenta =>
    cuenta.banco_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cuenta.numero_cuenta.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      banco_nombre: '',
      numero_cuenta: '',
      tipo: 'corriente',
      saldo_actual: 0,
      moneda: 'VES',
      activa: true,
    });
    setEditingCuenta(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (cuenta: CuentaBancaria) => {
    setFormData({
      banco_nombre: cuenta.banco_nombre,
      numero_cuenta: cuenta.numero_cuenta,
      tipo: cuenta.tipo,
      saldo_actual: cuenta.saldo_actual,
      moneda: cuenta.moneda,
      activa: cuenta.activa,
    });
    setEditingCuenta(cuenta);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCuenta) {
        const { error } = await supabase
          .from('cuentas_bancarias')
          .update(formData)
          .eq('id', editingCuenta.id);
        
        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Cuenta bancaria actualizada correctamente",
        });
      } else {
        const { error } = await supabase
          .from('cuentas_bancarias')
          .insert([{ ...formData, user_id: user?.id }]);
        
        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Cuenta bancaria creada correctamente",
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadCuentas();
    } catch (error: any) {
      console.error('Error saving cuenta:', error);
      toast({
        title: "Error",
        description: error.message || "Error al guardar la cuenta bancaria",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta cuenta bancaria?')) return;
    
    try {
      const { error } = await supabase
        .from('cuentas_bancarias')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Cuenta bancaria eliminada correctamente",
      });
      
      loadCuentas();
    } catch (error: any) {
      console.error('Error deleting cuenta:', error);
      toast({
        title: "Error",
        description: "Error al eliminar la cuenta bancaria",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'VES',
    }).format(amount);
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <MainLayout>
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
                <h1 className="text-3xl font-bold text-primary">Cuentas Bancarias</h1>
                <p className="text-muted-foreground">Gestiona tus cuentas y saldos bancarios</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Link to="/bancos/conciliacion">
                <Button variant="outline">
                  <GitBranch className="h-4 w-4 mr-2" />
                  Conciliación
                </Button>
              </Link>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Cuenta
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCuenta ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingCuenta ? 'Modifica la información de la cuenta' : 'Agrega una nueva cuenta bancaria'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="banco_nombre">Nombre del Banco *</Label>
                      <Input
                        id="banco_nombre"
                        value={formData.banco_nombre}
                        onChange={(e) => setFormData({ ...formData, banco_nombre: e.target.value })}
                        placeholder="Ej: Banco de Venezuela"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="numero_cuenta">Número de Cuenta *</Label>
                      <Input
                        id="numero_cuenta"
                        value={formData.numero_cuenta}
                        onChange={(e) => setFormData({ ...formData, numero_cuenta: e.target.value })}
                        placeholder="Ej: 01020123456789012345"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tipo">Tipo de Cuenta</Label>
                        <Select value={formData.tipo} onValueChange={(value: 'corriente' | 'ahorro') => setFormData({ ...formData, tipo: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="corriente">Corriente</SelectItem>
                            <SelectItem value="ahorro">Ahorro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="moneda">Moneda</Label>
                        <Select value={formData.moneda} onValueChange={(value: 'VES' | 'USD') => setFormData({ ...formData, moneda: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="VES">Bolívares (VES)</SelectItem>
                            <SelectItem value="USD">Dólares (USD)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="saldo_actual">Saldo Actual</Label>
                      <Input
                        id="saldo_actual"
                        type="number"
                        step="0.01"
                        value={formData.saldo_actual}
                        onChange={(e) => setFormData({ ...formData, saldo_actual: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="activa"
                        checked={formData.activa}
                        onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="activa">Cuenta activa</Label>
                    </div>
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editingCuenta ? 'Actualizar' : 'Crear'} Cuenta
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por banco o número de cuenta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cuentas</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cuentas.length}</div>
                <p className="text-xs text-muted-foreground">
                  {cuentas.filter(c => c.activa).length} activas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Total VES</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    cuentas.filter(c => c.moneda === 'VES' && c.activa).reduce((sum, c) => sum + c.saldo_actual, 0),
                    'VES'
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Total USD</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    cuentas.filter(c => c.moneda === 'USD' && c.activa).reduce((sum, c) => sum + c.saldo_actual, 0),
                    'USD'
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cuentas Table */}
          <Card>
            <CardHeader>
              <CardTitle>Cuentas Bancarias ({filteredCuentas.length})</CardTitle>
              <CardDescription>
                Lista de todas tus cuentas bancarias registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Cargando cuentas...</p>
              ) : filteredCuentas.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No se encontraron cuentas' : 'No hay cuentas bancarias registradas'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={openCreateDialog} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Crear primera cuenta
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Banco</TableHead>
                        <TableHead>Número</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Moneda</TableHead>
                        <TableHead>Saldo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCuentas.map((cuenta) => (
                        <TableRow key={cuenta.id}>
                          <TableCell className="font-medium">{cuenta.banco_nombre}</TableCell>
                          <TableCell>
                            <code className="bg-muted px-2 py-1 rounded text-sm">
                              {cuenta.numero_cuenta}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {cuenta.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={cuenta.moneda === 'USD' ? 'default' : 'secondary'}>
                              {cuenta.moneda}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono font-medium">
                              {formatCurrency(cuenta.saldo_actual, cuenta.moneda)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={cuenta.activa ? 'default' : 'secondary'}>
                              {cuenta.activa ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(cuenta)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(cuenta.id)}
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
    </MainLayout>
  );
}