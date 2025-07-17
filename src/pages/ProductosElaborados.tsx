import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit, History, Package } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type ProductoElaborado = {
  id: string;
  nombre_producto: string;
  cliente_id: string | null;
  alto: number | null;
  ancho: number | null;
  profundidad: number | null;
  cantidad: number;
  numero_colores: number | null;
  tipo_material: string | null;
  fecha_creacion: string;
  observaciones: string | null;
  clientes?: {
    nombre_empresa: string;
  };
};

type Cliente = {
  id: string;
  nombre_empresa: string;
};

const ProductosElaborados = () => {
  const { user } = useAuth();
  const [productos, setProductos] = useState<ProductoElaborado[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductoElaborado | null>(null);
  const [formData, setFormData] = useState({
    nombre_producto: "",
    cliente_id: "",
    alto: "",
    ancho: "",
    profundidad: "",
    cantidad: "1",
    numero_colores: "",
    tipo_material: "",
    observaciones: ""
  });

  useEffect(() => {
    if (user) {
      fetchProductos();
      fetchClientes();
    }
  }, [user]);

  const fetchProductos = async () => {
    try {
      const { data, error } = await supabase
        .from("productos_elaborados")
        .select(`
          *,
          clientes:cliente_id (
            nombre_empresa
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error("Error fetching productos:", error);
      toast.error("Error al cargar productos elaborados");
    } finally {
      setLoading(false);
    }
  };

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nombre_empresa")
        .order("nombre_empresa");

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error("Error fetching clientes:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const productData = {
        nombre_producto: formData.nombre_producto,
        cliente_id: formData.cliente_id || null,
        alto: formData.alto ? parseFloat(formData.alto) : null,
        ancho: formData.ancho ? parseFloat(formData.ancho) : null,
        profundidad: formData.profundidad ? parseFloat(formData.profundidad) : null,
        cantidad: parseInt(formData.cantidad) || 1,
        numero_colores: formData.numero_colores ? parseInt(formData.numero_colores) : null,
        tipo_material: formData.tipo_material || null,
        observaciones: formData.observaciones || null,
        user_id: user.id,
        actualizado_por: user.id
      };

      if (editingProduct) {
        const { error } = await supabase
          .from("productos_elaborados")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;
        toast.success("Producto actualizado correctamente");
      } else {
        const { error } = await supabase
          .from("productos_elaborados")
          .insert(productData);

        if (error) throw error;
        toast.success("Producto creado correctamente");
      }

      setDialogOpen(false);
      resetForm();
      fetchProductos();
    } catch (error) {
      console.error("Error saving producto:", error);
      toast.error("Error al guardar el producto");
    }
  };

  const resetForm = () => {
    setFormData({
      nombre_producto: "",
      cliente_id: "",
      alto: "",
      ancho: "",
      profundidad: "",
      cantidad: "1",
      numero_colores: "",
      tipo_material: "",
      observaciones: ""
    });
    setEditingProduct(null);
  };

  const handleEdit = (producto: ProductoElaborado) => {
    setEditingProduct(producto);
    setFormData({
      nombre_producto: producto.nombre_producto,
      cliente_id: producto.cliente_id || "",
      alto: producto.alto?.toString() || "",
      ancho: producto.ancho?.toString() || "",
      profundidad: producto.profundidad?.toString() || "",
      cantidad: producto.cantidad.toString(),
      numero_colores: producto.numero_colores?.toString() || "",
      tipo_material: producto.tipo_material || "",
      observaciones: producto.observaciones || ""
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este producto?")) return;

    try {
      const { error } = await supabase
        .from("productos_elaborados")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Producto eliminado correctamente");
      fetchProductos();
    } catch (error) {
      console.error("Error deleting producto:", error);
      toast.error("Error al eliminar el producto");
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando productos elaborados...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Productos Elaborados</h1>
            <p className="text-muted-foreground">
              Gestiona los productos diseñados y fabricados bajo pedido
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Editar Producto" : "Nuevo Producto Elaborado"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="nombre_producto">Nombre del Producto *</Label>
                    <Input
                      id="nombre_producto"
                      value={formData.nombre_producto}
                      onChange={(e) => setFormData({ ...formData, nombre_producto: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="cliente_id">Cliente</Label>
                    <Select value={formData.cliente_id} onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.nombre_empresa}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="alto">Alto (cm)</Label>
                    <Input
                      id="alto"
                      type="number"
                      step="0.01"
                      value={formData.alto}
                      onChange={(e) => setFormData({ ...formData, alto: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="ancho">Ancho (cm)</Label>
                    <Input
                      id="ancho"
                      type="number"
                      step="0.01"
                      value={formData.ancho}
                      onChange={(e) => setFormData({ ...formData, ancho: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="profundidad">Profundidad (cm)</Label>
                    <Input
                      id="profundidad"
                      type="number"
                      step="0.01"
                      value={formData.profundidad}
                      onChange={(e) => setFormData({ ...formData, profundidad: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="cantidad">Cantidad</Label>
                    <Input
                      id="cantidad"
                      type="number"
                      min="1"
                      value={formData.cantidad}
                      onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="numero_colores">Número de Colores</Label>
                    <Input
                      id="numero_colores"
                      type="number"
                      min="1"
                      value={formData.numero_colores}
                      onChange={(e) => setFormData({ ...formData, numero_colores: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="tipo_material">Tipo de Material</Label>
                    <Input
                      id="tipo_material"
                      value={formData.tipo_material}
                      onChange={(e) => setFormData({ ...formData, tipo_material: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingProduct ? "Actualizar" : "Crear"} Producto
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productos.map((producto) => (
            <Card key={producto.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{producto.nombre_producto}</CardTitle>
                    <CardDescription>
                      {producto.clientes?.nombre_empresa || "Sin cliente asignado"}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    <Package className="mr-1 h-3 w-3" />
                    {producto.cantidad}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {(producto.alto || producto.ancho || producto.profundidad) && (
                    <div>
                      <strong>Medidas:</strong> {producto.alto || "?"} × {producto.ancho || "?"} × {producto.profundidad || "?"} cm
                    </div>
                  )}
                  {producto.numero_colores && (
                    <div><strong>Colores:</strong> {producto.numero_colores}</div>
                  )}
                  {producto.tipo_material && (
                    <div><strong>Material:</strong> {producto.tipo_material}</div>
                  )}
                  <div>
                    <strong>Creado:</strong> {format(new Date(producto.fecha_creacion), "dd/MM/yyyy", { locale: es })}
                  </div>
                </div>
                
                <div className="flex justify-between mt-4">
                  <div className="space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(producto)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <History className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => handleDelete(producto.id)}
                  >
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {productos.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold">No hay productos elaborados</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Comienza creando tu primer producto elaborado.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ProductosElaborados;