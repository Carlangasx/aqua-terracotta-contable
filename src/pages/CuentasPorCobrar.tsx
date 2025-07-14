import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Plus, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CuentaPorCobrar {
  id: string;
  venta_id?: string;
  cliente_id: string;
  monto_total: number;
  monto_pagado: number;
  saldo: number;
  fecha_emision: string;
  fecha_vencimiento?: string;
  estado: 'pendiente' | 'parcial' | 'pagado';
  notas?: string;
  clientes?: {
    nombre_empresa: string;
    rif: string;
  };
}

export default function CuentasPorCobrar() {
  const { user } = useAuth();
  const [cuentas, setCuentas] = useState<CuentaPorCobrar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCuentas();
    }
  }, [user]);

  const loadCuentas = async () => {
    try {
      const { data, error } = await supabase
        .from('cuentas_por_cobrar')
        .select(`
          *,
          clientes (
            nombre_empresa,
            rif
          )
        `)
        .order('fecha_emision', { ascending: false });

      if (error) throw error;
      setCuentas(data || []);
    } catch (error) {
      console.error('Error loading cuentas por cobrar:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge variant="destructive">Pendiente</Badge>;
      case 'parcial':
        return <Badge variant="secondary">Parcial</Badge>;
      case 'pagado':
        return <Badge className="bg-green-100 text-green-800">Pagado</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const totalPorCobrar = cuentas.reduce((sum, cuenta) => sum + cuenta.saldo, 0);
  const cuentasVencidas = cuentas.filter(cuenta => 
    cuenta.fecha_vencimiento && 
    new Date(cuenta.fecha_vencimiento) < new Date() && 
    cuenta.estado !== 'pagado'
  ).length;

  return (
    <MainLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center">
              <CreditCard className="mr-3" />
              Cuentas por Cobrar
            </h1>
            <p className="text-muted-foreground">Gestión de cobros y cuentas pendientes</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cuenta
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total por Cobrar</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalPorCobrar.toLocaleString('es-VE', {
                  style: 'currency',
                  currency: 'VES'
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cuentas Vencidas</CardTitle>
              <Calendar className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{cuentasVencidas}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cuentas</CardTitle>
              <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cuentas.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Cuentas */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Cuentas por Cobrar</CardTitle>
            <CardDescription>
              Administra todas las cuentas pendientes de cobro
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Cargando...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>RIF</TableHead>
                    <TableHead>Monto Total</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Fecha Emisión</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cuentas.map((cuenta) => (
                    <TableRow key={cuenta.id}>
                      <TableCell className="font-medium">
                        {cuenta.clientes?.nombre_empresa || 'N/A'}
                      </TableCell>
                      <TableCell>{cuenta.clientes?.rif || 'N/A'}</TableCell>
                      <TableCell>
                        {cuenta.monto_total.toLocaleString('es-VE', {
                          style: 'currency',
                          currency: 'VES'
                        })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {cuenta.saldo.toLocaleString('es-VE', {
                          style: 'currency',
                          currency: 'VES'
                        })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(cuenta.fecha_emision), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>
                        {cuenta.fecha_vencimiento 
                          ? format(new Date(cuenta.fecha_vencimiento), 'dd/MM/yyyy', { locale: es })
                          : '-'
                        }
                      </TableCell>
                      <TableCell>{getEstadoBadge(cuenta.estado)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}