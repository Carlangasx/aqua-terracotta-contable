
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
  TrendingUp, Boxes, Menu
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
      bgColor: 'bg-odoo-white',
      textColor: 'text-odoo-purple',
      description: 'Gestionar clientes',
      hasBorder: true
    },
    {
      name: 'Documentos',
      icon: FileText,
      path: '/documentos',
      bgColor: 'bg-odoo-lavender',
      textColor: 'text-white',
      description: 'Crear y gestionar documentos'
    },
    {
      name: 'Compras',
      icon: ShoppingCart,
      path: '/compras',
      bgColor: 'bg-odoo-purple',
      textColor: 'text-white',
      description: 'Gestionar compras'
    },
    {
      name: 'Inventario',
      icon: Package,
      path: '/inventario',
      bgColor: 'bg-odoo-white',
      textColor: 'text-odoo-purple',
      description: 'Control de inventario',
      hasBorder: true
    },
    {
      name: 'Reportes',
      icon: BarChart3,
      path: '/reportes',
      bgColor: 'bg-odoo-hover',
      textColor: 'text-white',
      description: 'Análisis y reportes'
    },
    {
      name: 'Configuración',
      icon: Settings,
      path: '/configuracion',
      bgColor: 'bg-odoo-white',
      textColor: 'text-odoo-dark-charcoal',
      description: 'Configuración del sistema',
      hasBorder: true
    },
    {
      name: 'Productos Elaborados',
      icon: Boxes,
      path: '/productos-elaborados',
      bgColor: 'bg-odoo-lavender',
      textColor: 'text-white',
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
    <div className="flex min-h-screen bg-odoo-light-gray" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <div className={`sidebar-odoo transition-all duration-300 ease-in-out flex flex-col ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Logo and Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-lg">
                <Calculator className="h-6 w-6 text-odoo-purple" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Pliego360</h1>
                <p className="text-xs text-white/80">ERP Imprentas</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-white hover:bg-odoo-hover hover:text-white transition-all duration-200"
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
                className={`sidebar-item-odoo flex items-center px-4 py-3 text-sm group relative ${
                  item.active ? 'sidebar-item-active-odoo' : ''
                }`}
              >
                <IconComponent className={`h-5 w-5 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'}`} />
                {!sidebarCollapsed && <span>{item.name}</span>}
                
                {/* Tooltip for collapsed state */}
                {sidebarCollapsed && (
                  <div className="absolute left-16 bg-odoo-purple/95 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-white/20">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Actions */}
        <div className="border-t border-white/10 p-4">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className={`w-full text-white hover:bg-odoo-hover hover:text-white transition-all duration-200 ${
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
        <div className="bg-white shadow-sm border-b border-odoo-medium-gray">
          <div className="px-4 sm:px-8 py-6">
            <h1 className="text-responsive-xl font-bold text-odoo-purple">Sistema Administrativo</h1>
            <p className="text-odoo-dark-charcoal/70 mt-1 text-responsive-sm">Soluciones Gráficas Litoarte, C. A.</p>
          </div>
        </div>

        <div className="p-4 sm:p-8 space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Ventas del Mes */}
            <Card 
              className="card-odoo fade-up"
              style={{ animationDelay: '0ms' }}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between text-odoo-purple">
                  <div className="bg-odoo-purple/10 p-3 rounded-xl">
                    <DollarSign className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-semibold opacity-80 mb-1">Ventas del Mes</p>
                    <p className="text-responsive-lg font-bold truncate">
                      ${stats.ventasDelMes.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inventario Actual */}
            <Card 
              className="card-odoo fade-up"
              style={{ animationDelay: '100ms' }}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between text-odoo-lavender">
                  <div className="bg-odoo-lavender/10 p-3 rounded-xl">
                    <Package className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-semibold opacity-80 mb-1">Inventario Actual</p>
                    <p className="text-responsive-lg font-bold truncate">
                      {stats.inventarioActual}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gastos del Mes */}
            <Card 
              className="card-odoo fade-up"
              style={{ animationDelay: '200ms' }}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between text-odoo-hover">
                  <div className="bg-odoo-hover/10 p-3 rounded-xl">
                    <Truck className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-semibold opacity-90 mb-1">Gastos del Mes</p>
                    <p className="text-responsive-lg font-bold truncate">
                      ${stats.gastosDelMes.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {modules.map((module, index) => {
              const IconComponent = module.icon;
              return (
                <Link 
                  key={module.name} 
                  to={module.path}
                  className="block fade-up ripple-effect"
                  style={{ animationDelay: `${(index + 3) * 100}ms` }}
                >
                  <Card 
                    className={`transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-xl cursor-pointer rounded-xl shadow-md h-32 ${module.bgColor} ${
                      module.hasBorder ? 'border border-odoo-medium-gray' : 'border-0'
                    }`}
                  >
                    <CardContent className="p-4 sm:p-6 flex items-center justify-center h-full">
                      <div className="text-center space-y-3">
                        <div className={`${module.textColor === 'text-white' ? 'bg-white/20' : 'bg-odoo-purple/10'} p-3 rounded-lg inline-flex`}>
                          <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 ${module.textColor}`} />
                        </div>
                        <div>
                          <h3 className={`font-bold text-sm ${module.textColor}`}>
                            {module.name}
                          </h3>
                          <p className={`text-xs mt-1 ${module.textColor === 'text-white' ? 'text-white/80' : 'text-odoo-dark-charcoal/70'}`}>
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
