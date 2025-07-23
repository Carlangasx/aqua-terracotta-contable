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
  TrendingUp, Boxes, AlertTriangle, Menu
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

      // Inventario actual (productos con stock > 0)
      const { data: inventarioData } = await supabase
        .from('inventario_consumibles')
        .select('cantidad_disponible')
        .gt('cantidad_disponible', 0);

      const inventarioActual = inventarioData?.length || 0;

      // Gastos del mes (documentos de compras/gastos - placeholder por ahora)
      const gastosDelMes = 0; // TODO: Implementar cuando exista tabla de compras

      setStats({
        ventasDelMes,
        inventarioActual,
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
      color: '#58A0C8',
      description: 'Gestionar clientes'
    },
    {
      name: 'Documentos',
      icon: FileText,
      path: '/documentos',
      color: '#34699A',
      description: 'Crear y gestionar documentos'
    },
    {
      name: 'Compras',
      icon: ShoppingCart,
      path: '/compras',
      color: '#113F67',
      description: 'Gestionar compras'
    },
    {
      name: 'Inventario',
      icon: Package,
      path: '/inventario',
      color: '#FDF5AA',
      description: 'Control de inventario',
      textDark: true
    },
    {
      name: 'Reportes',
      icon: BarChart3,
      path: '/reportes',
      color: '#34699A',
      description: 'Análisis y reportes'
    },
    {
      name: 'Configuración',
      icon: Settings,
      path: '/configuracion',
      color: '#E5E7EB',
      description: 'Configuración del sistema',
      textDark: true
    },
    {
      name: 'Productos Elaborados',
      icon: Boxes,
      path: '/productos-elaborados',
      color: '#58A0C8',
      description: 'Catálogo de productos'
    },
  ];

  const sidebarItems = [
    { name: 'Dashboard', icon: TrendingUp, path: '/', active: true },
    { name: 'Clientes', icon: Users, path: '/clientes' },
    { name: 'Documentos', icon: FileText, path: '/documentos' },
    { name: 'Compras', icon: ShoppingCart, path: '/compras' },
    { name: 'Inventario', icon: Package, path: '/inventario' },
    { name: 'Reportes', icon: BarChart3, path: '/reportes' },
    { name: 'Productos Elaborados', icon: Boxes, path: '/productos-elaborados' },
    { name: 'Configuración', icon: Settings, path: '/configuracion' },
  ];

  return (
    <div className="flex min-h-screen bg-[#FDF5AA]" style={{ fontFamily: 'Inter, Satoshi, sans-serif' }}>
      {/* Sidebar */}
      <div className={`bg-[#113F67] text-white transition-all duration-300 flex flex-col ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Logo and Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-[#34699A]/30">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="bg-[#58A0C8] p-2 rounded-lg">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">ContaSimple</h1>
                <p className="text-xs text-[#58A0C8]">ERP Imprentas</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-white hover:bg-[#34699A] hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          {sidebarItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm transition-colors hover:bg-[#34699A] group relative ${
                  item.active ? 'bg-[#34699A] border-r-2 border-[#58A0C8]' : ''
                }`}
              >
                <IconComponent className={`h-5 w-5 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'}`} />
                {!sidebarCollapsed && <span>{item.name}</span>}
                
                {/* Tooltip for collapsed state */}
                {sidebarCollapsed && (
                  <div className="absolute left-16 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Actions */}
        <div className="border-t border-[#34699A]/30 p-4">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className={`w-full text-white hover:bg-[#34699A] hover:text-white ${
              sidebarCollapsed ? 'px-2' : 'justify-start'
            }`}
          >
            <LogOut className={`h-5 w-5 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'}`} />
            {!sidebarCollapsed && <span>Cerrar Sesión</span>}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold text-[#113F67]">Dashboard</h1>
            <p className="text-gray-600 mt-1">Resumen general del sistema</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ventas del Mes */}
            <Card 
              className="transition-all duration-300 hover:scale-[1.03] cursor-pointer shadow-md rounded-2xl border-0"
              style={{ backgroundColor: '#34699A' }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between text-white">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <DollarSign className="h-8 w-8" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium opacity-90 mb-1">Ventas del Mes</p>
                    <p className="text-3xl font-bold">
                      ${stats.ventasDelMes.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inventario */}
            <Card 
              className="transition-all duration-300 hover:scale-[1.03] cursor-pointer shadow-md rounded-2xl border-0"
              style={{ backgroundColor: '#58A0C8' }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between text-white">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <Package className="h-8 w-8" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium opacity-90 mb-1">Inventario</p>
                    <p className="text-3xl font-bold">
                      {stats.inventarioActual}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gastos del Mes */}
            <Card 
              className="transition-all duration-300 hover:scale-[1.03] cursor-pointer shadow-md rounded-2xl border-0"
              style={{ backgroundColor: '#113F67' }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between text-white">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <Truck className="h-8 w-8" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium opacity-90 mb-1">Gastos del Mes</p>
                    <p className="text-3xl font-bold">
                      ${stats.gastosDelMes.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {modules.map((module, index) => {
              const IconComponent = module.icon;
              return (
                <Link 
                  key={module.name} 
                  to={module.path}
                  className="block animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Card 
                    className="transition-all duration-300 hover:scale-[1.03] hover:shadow-lg cursor-pointer rounded-xl shadow-md border-0 h-32"
                    style={{ backgroundColor: module.color }}
                  >
                    <CardContent className="p-6 flex items-center justify-center h-full">
                      <div className="text-center space-y-3">
                        <div className={`${module.textDark ? 'bg-gray-800/10' : 'bg-white/20'} p-3 rounded-lg inline-flex`}>
                          <IconComponent className={`h-6 w-6 ${module.textDark ? 'text-gray-800' : 'text-white'}`} />
                        </div>
                        <div>
                          <h3 className={`font-bold text-sm ${module.textDark ? 'text-gray-800' : 'text-white'}`}>
                            {module.name}
                          </h3>
                          <p className={`text-xs mt-1 ${module.textDark ? 'text-gray-600' : 'text-white/80'}`}>
                            {module.description}
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
    </div>
  );
}