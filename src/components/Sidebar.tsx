
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calculator, Users, ShoppingCart, Package, CreditCard, Banknote, Building, FileText, Menu, X, GitBranch, Wrench, Settings, Plus, List } from 'lucide-react';
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
  { name: 'Inventario Consumibles', href: '/inventario', icon: Package },
  { name: 'Productos Elaborados', href: '/productos-elaborados', icon: Wrench },
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

  const SidebarContent = () => (
    <div className="flex h-full flex-col sidebar-odoo">
      <div className="flex h-14 items-center border-b border-white/10 px-4">
        <div className="bg-white p-2 rounded-lg mr-3">
          <Calculator className="h-5 w-5 text-odoo-purple" />
        </div>
        <div>
          <span className="font-semibold text-white text-sm">Pliego360</span>
          <p className="text-xs text-white/70">ERP Imprentas</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          if (item.isSection) {
            const isAnyChildActive = item.items?.some(child => location.pathname === child.href);
            return (
              <Collapsible
                key={item.name}
                open={documentosOpen}
                onOpenChange={setDocumentosOpen}
              >
                <CollapsibleTrigger className="sidebar-item-odoo flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md">
                  <div className="flex items-center">
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.name}
                  </div>
                  <span className={`transform transition-transform duration-200 ${documentosOpen ? 'rotate-180' : ''}`}>
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
                          flex items-center px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 ml-6
                          ${isActive 
                            ? 'sidebar-item-active-odoo' 
                            : 'sidebar-item-odoo'
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
                  flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
                  ${isActive 
                    ? 'sidebar-item-active-odoo' 
                    : 'sidebar-item-odoo'
                  }
                `}
              >
                <item.icon className="mr-3 h-4 w-4" />
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
          <Button variant="outline" size="icon" className="md:hidden fixed top-4 left-4 z-50 btn-odoo-secondary">
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
