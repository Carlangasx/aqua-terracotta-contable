import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calculator, Users, ShoppingCart, Package, CreditCard, Banknote, Building, FileText, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Calculator },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Ventas', href: '/ventas', icon: ShoppingCart },
  { name: 'Inventario', href: '/inventario', icon: Package },
  { name: 'Cuentas por Cobrar', href: '/cuentas-cobrar', icon: CreditCard },
  { name: 'Cuentas por Pagar', href: '/cuentas-pagar', icon: FileText },
  { name: 'Pagos', href: '/pagos', icon: Banknote },
  { name: 'Cuentas Bancarias', href: '/cuentas-bancarias', icon: Building },
];

export function Sidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-sidebar-background">
      <div className="flex h-14 items-center border-b px-4">
        <Calculator className="h-6 w-6 text-primary mr-2" />
        <span className="font-semibold text-sidebar-foreground">ContaSimple</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setOpen(false)}
              className={`
                flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                ${isActive 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                }
              `}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
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