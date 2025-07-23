import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calculator, Users, ShoppingCart, Package, LogOut, 
  DollarSign, Truck, FileText, BarChart3, Settings, 
  TrendingUp, Boxes, AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardStats {
  ventasDelMes: number;
  inventarioActual: number;
  gastosDelMes: number;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    ventasDelMes: 0,
    inventarioActual: 0,
    gastosDelMes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Ventas del mes actual (suma total de documentos FACT)
      const { data: facturas } = await supabase
        .from('documentos_generados')
        .select('total')
        .eq('tipo_documento', 'FACT')
        .gte('fecha_emision', `${currentMonth}-01`);

      const ventasDelMes = facturas?.reduce((sum, factura) => sum + (factura.total || 0), 0) || 0;

      // Inventario actual (total de productos en stock)
      const { count: inventarioCount } = await supabase
        .from('inventario_consumibles')
        .select('*', { count: 'exact', head: true });

      // Gastos del mes (documentos de compras/gastos - placeholder por ahora)
      const gastosDelMes = 0; // TODO: Implementar cuando exista tabla de compras

      setStats({
        ventasDelMes,
        inventarioActual: inventarioCount || 0,
        gastosDelMes,
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

  const modules = [
    {
      name: 'Clientes',
      icon: Users,
      path: '/clientes',
      color: 'bg-green-100 hover:bg-green-200',
      textColor: 'text-green-700'
    },
    {
      name: 'Ventas',
      icon: TrendingUp,
      path: '/ventas',
      color: 'bg-blue-100 hover:bg-blue-200',
      textColor: 'text-blue-700'
    },
    {
      name: 'Compras',
      icon: ShoppingCart,
      path: '/compras',
      color: 'bg-yellow-100 hover:bg-yellow-200',
      textColor: 'text-yellow-700'
    },
    {
      name: 'Inventario',
      icon: Package,
      path: '/inventario',
      color: 'bg-gray-100 hover:bg-gray-200',
      textColor: 'text-gray-700'
    },
    {
      name: 'Documentos',
      icon: FileText,
      path: '/documentos',
      color: 'bg-purple-100 hover:bg-purple-200',
      textColor: 'text-purple-700'
    },
    {
      name: 'Reportes',
      icon: BarChart3,
      path: '/reportes',
      color: 'bg-orange-100 hover:bg-orange-200',
      textColor: 'text-orange-700'
    },
    {
      name: 'Configuración',
      icon: Settings,
      path: '/configuracion',
      color: 'bg-gray-100 hover:bg-gray-200',
      textColor: 'text-gray-700'
    },
    {
      name: 'Productos Elaborados',
      icon: Boxes,
      path: '/productos-elaborados',
      color: 'bg-indigo-100 hover:bg-indigo-200',
      textColor: 'text-indigo-700'
    },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm">
          <div className="container mx-auto px-4 py-6 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-primary to-primary/80 p-3 rounded-2xl shadow-lg">
                <Calculator className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  ContaSimple
                </h1>
                <p className="text-muted-foreground font-medium">
                  Sistema ERP para Imprentas
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="bg-white/50 hover:bg-white/80 backdrop-blur-sm border-white/30"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Métricas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Ventas del Mes */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="bg-green-500/10 p-3 rounded-2xl">
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-700 mb-1">Ventas del Mes</p>
                    <p className="text-3xl font-bold text-green-800">
                      ${stats.ventasDelMes.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-green-600/80">
                  Total facturado este mes
                </p>
              </CardContent>
            </Card>

            {/* Inventario Actual */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="bg-blue-500/10 p-3 rounded-2xl">
                    <Package className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-700 mb-1">Inventario Actual</p>
                    <p className="text-3xl font-bold text-blue-800">
                      {stats.inventarioActual}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-blue-600/80">
                  Productos en stock
                </p>
              </CardContent>
            </Card>

            {/* Gastos del Mes */}
            <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="bg-pink-500/10 p-3 rounded-2xl">
                    <Truck className="h-8 w-8 text-pink-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-pink-700 mb-1">Gastos del Mes</p>
                    <p className="text-3xl font-bold text-pink-800">
                      ${stats.gastosDelMes.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-pink-600/80">
                  Compras y gastos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Navegación de Módulos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map((module) => {
              const IconComponent = module.icon;
              return (
                <Link key={module.name} to={module.path}>
                  <Card className={`${module.color} border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer backdrop-blur-sm`}>
                    <CardContent className="p-6 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="bg-white/50 p-4 rounded-2xl shadow-sm">
                          <IconComponent className={`h-8 w-8 ${module.textColor}`} />
                        </div>
                        <div>
                          <h3 className={`font-bold text-lg ${module.textColor} mb-1`}>
                            {module.name}
                          </h3>
                          <p className={`text-sm ${module.textColor}/70`}>
                            Gestionar {module.name.toLowerCase()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}