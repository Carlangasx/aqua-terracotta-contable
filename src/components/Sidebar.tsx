
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calculator, Users, ShoppingCart, Package, CreditCard, Banknote, Building, FileText, Menu, X, GitBranch, Wrench, Settings, Plus, List, TrendingUp, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Calculator },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { 
    name: 'Generación de Documentos', 
    icon: FileText, 
    isSection: true,
    items: [
      { name: 'Lista de Documentos', href: '/documentos', icon: List },
      { name: 'Nuevo Documento', href: '/documentos/nuevo', icon: Plus },
    ]
  },
  { 
    name: 'Inventario', 
    icon: Package, 
    isSection: true,
    items: [
      { name: 'Consumibles', href: '/inventario', icon: Package },
      { name: 'Importar', href: '/inventario/importar', icon: Upload },
      { name: 'Movimientos', href: '/inventario/movimientos', icon: TrendingUp },
    ]
  },
  { name: 'Productos Elaborados', href: '/productos-elaborados', icon: Wrench },
  { name: 'Cotizaciones', href: '/cotizaciones', icon: FileText },
  { name: 'Cuentas por Cobrar', href: '/cuentas-cobrar', icon: CreditCard },
  { name: 'Cuentas por Pagar', href: '/cuentas-pagar', icon: FileText },
  
  { name: 'Cuentas Bancarias', href: '/cuentas-bancarias', icon: Building },
  { name: 'Conciliación', href: '/bancos/conciliacion', icon: GitBranch },
  { name: 'Configuración', href: '/configuracion', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [documentosOpen, setDocumentosOpen] = useState(
    location.pathname.startsWith('/documentos')
  );
  const [inventarioOpen, setInventarioOpen] = useState(
    location.pathname.startsWith('/inventario')
  );

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-midnight-navy">
      <div className="flex h-14 items-center border-b border-white/10 px-4">
        <Calculator className="h-6 w-6 text-mint-wave mr-2" />
        <span className="font-semibold text-white">Pliego360</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          if (item.isSection) {
            const isAnyChildActive = item.items?.some(child => location.pathname === child.href);
            return (
              <Collapsible
                key={item.name}
                open={item.name === 'Generación de Documentos' ? documentosOpen : inventarioOpen}
                onOpenChange={item.name === 'Generación de Documentos' ? setDocumentosOpen : setInventarioOpen}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors text-white hover:bg-white/10 hover:text-white">
                  <div className="flex items-center">
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </div>
                  <span className={`transform transition-transform ${
                    (item.name === 'Generación de Documentos' ? documentosOpen : inventarioOpen) ? 'rotate-180' : ''
                  }`}>
                    ▼
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-1">
                  {item.items?.map((subItem) => {
                    const isActive = location.pathname === subItem.href;
                    return (
                      <Link
                        key={subItem.name}
                        to={subItem.href}
                        onClick={() => setOpen(false)}
                        className={`
                          flex items-center px-6 py-2 text-sm font-medium rounded-md transition-colors ml-6
                          ${isActive 
                            ? 'bg-mint-wave/20 text-mint-wave border-l-2 border-mint-wave' 
                            : 'text-white hover:bg-white/10 hover:text-white'
                          }
                        `}
                      >
                        <subItem.icon className="mr-3 h-4 w-4" />
                        {subItem.name}
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          } else {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setOpen(false)}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${isActive 
                    ? 'bg-mint-wave/20 text-mint-wave border-l-2 border-mint-wave' 
                    : 'text-white hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          }
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden fixed top-4 left-4 z-50">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <SidebarContent />
      </div>
    </>
  );
}
