import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Clientes from "./pages/Clientes";
import Documentos from "./pages/Documentos";
import Inventario from "./pages/Inventario";
import ProductosElaborados from "./pages/ProductosElaborados";
import CuentasPorCobrar from "./pages/CuentasPorCobrar";
import CuentasPorPagar from "./pages/CuentasPorPagar";
import ConciliacionBancaria from "./pages/ConciliacionBancaria";
import CuentasBancarias from "./pages/CuentasBancarias";
import NotFound from "./pages/NotFound";
import Configuracion from "./pages/Configuracion";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/clientes" element={<Clientes />} />
          <Route path="/documentos" element={<Documentos />} />
          <Route path="/configuracion" element={<Configuracion />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/productos-elaborados" element={<ProductosElaborados />} />
            <Route path="/cuentas-cobrar" element={<CuentasPorCobrar />} />
            <Route path="/cuentas-pagar" element={<CuentasPorPagar />} />
            <Route path="/cuentas-bancarias" element={<CuentasBancarias />} />
            <Route path="/bancos/conciliacion" element={<ConciliacionBancaria />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
