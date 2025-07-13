import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, ShoppingCart, Package, AlertTriangle, TrendingUp, Calculator, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalClientes: number;
  ventasDelMes: number;
  productosConBajoStock: number;
  totalProductos: number;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0,
    ventasDelMes: 0,
    productosConBajoStock: 0,
    totalProductos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      // Total clientes
      const { count: clientesCount } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true });

      // Ventas del mes actual
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { count: ventasCount } = await supabase
        .from('ventas')
        .select('*', { count: 'exact', head: true })
        .gte('fecha', `${currentMonth}-01`);

      // Total productos
      const { count: productosCount } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true });

      // Productos con bajo stock
      const { count: bajoStockCount } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .filter('cantidad_disponible', 'lte', 'stock_minimo_alerta');

      setStats({
        totalClientes: clientesCount || 0,
        ventasDelMes: ventasCount || 0,
        productosConBajoStock: bajoStockCount || 0,
        totalProductos: productosCount || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Layout>
      <div className="min-h-screen bg-muted/30">
        {/* Header */}
        <div className="bg-card border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Calculator className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">ContApp</h1>
                <p className="text-sm text-muted-foreground">Panel de Control</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClientes}</div>
                <p className="text-xs text-muted-foreground">
                  Clientes registrados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.ventasDelMes}</div>
                <p className="text-xs text-muted-foreground">
                  Facturas emitidas este mes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Productos</CardTitle>
                <Package className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProductos}</div>
                <p className="text-xs text-muted-foreground">
                  En inventario
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bajo Stock</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats.productosConBajoStock}</div>
                <p className="text-xs text-muted-foreground">
                  Productos con stock bajo
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/clientes">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Gestión de Clientes</CardTitle>
                      <CardDescription>
                        Administrar información de clientes
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Crear, editar y consultar datos de clientes. Ver historial de ventas por cliente.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/ventas">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="bg-secondary/50 p-3 rounded-lg">
                      <ShoppingCart className="h-6 w-6 text-secondary-foreground" />
                    </div>
                    <div>
                      <CardTitle>Registro de Ventas</CardTitle>
                      <CardDescription>
                        Generar facturas y registrar ventas
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Crear facturas, seleccionar clientes y productos. Calcular impuestos automáticamente.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/inventario">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="bg-accent/50 p-3 rounded-lg">
                      <Package className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <div>
                      <CardTitle>Inventario</CardTitle>
                      <CardDescription>
                        Control de productos y stock
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Gestionar productos, precios, stock y categorías. Alertas de stock bajo.
                  </p>
                  {stats.productosConBajoStock > 0 && (
                    <Badge variant="destructive" className="mt-2">
                      {stats.productosConBajoStock} productos con stock bajo
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}