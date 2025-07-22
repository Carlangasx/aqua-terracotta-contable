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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Plus, Edit, History, Package, ChevronDown, Upload, FileText, 
  Copy, Trash2, Filter, Download, Eye
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ImportarProductos from "@/components/ImportarProductos";

type ProductoElaborado = {
  id: string;
  nombre_producto: string;
  cliente_id: string | null;
  tipo_producto: string | null;
  industria: string | null;
  alto: number | null;
  ancho: number | null;
  profundidad: number | null;
  cantidad: number;
  numero_colores: number | null;
  tipo_material: string | null;
  sustrato: string | null;
  calibre: string | null;
  colores: string | null;
  barniz: string | null;
  plastificado: string | null;
  troquelado: boolean;
  empaquetado: string | null;
  pegado: string | null;
  numero_paquetes: string | null;
  precio_unitario_usd: number | null;
  fecha_creacion: string;
  observaciones: string | null;
  arte_final_pdf_url: string | null;
  cotizacion_pdf_url: string | null;
  clientes?: {
    nombre_empresa: string;
    industria: string | null;
  };
};

type Cliente = {
  id: string;
  nombre_empresa: string;
  industria: string | null;
};

type HistorialEntry = {
  id: string;
  fecha_cambio: string;
  descripcion: string;
  usuario_modificador: string;
  cotizacion_pdf_url: string | null;
  arte_final_pdf_url: string | null;
};

const TIPO_PRODUCTO_OPTIONS = ['Estuche', 'Caja', 'Microcorrugado', 'Otro'];
const INDUSTRIA_OPTIONS = ['Farmacia', 'Alimentos', 'Cosmética', 'Otros'];
const BARNIZ_OPTIONS = ['UV', 'AQ', 'Ninguno'];
const PLASTIFICADO_OPTIONS = ['Mate', 'Brillante', 'Ninguno'];

const ProductosElaborados = () => {
  const { user } = useAuth();
  const [productos, setProductos] = useState<ProductoElaborado[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [historialDialogOpen, setHistorialDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductoElaborado | null>(null);
  const [historial, setHistorial] = useState<HistorialEntry[]>([]);
  const [editingProduct, setEditingProduct] = useState<ProductoElaborado | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Filtros
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroTipoProducto, setFiltroTipoProducto] = useState('todos');
  const [filtroIndustria, setFiltroIndustria] = useState('todas');

  const [formData, setFormData] = useState({
    nombre_producto: "",
    cliente_id: "",
    tipo_producto: "",
    industria: "",
    alto: "",
    ancho: "",
    profundidad: "",
    cantidad: "1",
    numero_colores: "",
    tipo_material: "",
    sustrato: "",
    calibre: "",
    colores: "",
    barniz: "Ninguno",
    plastificado: "Ninguno",
    troquelado: false,
    empaquetado: "",
    pegado: "",
    numero_paquetes: "",
    precio_unitario_usd: "",
    observaciones: ""
  });

  const [archivoArteFinal, setArchivoArteFinal] = useState<File | null>(null);
  const [archivoCotizacion, setArchivoCotizacion] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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
            nombre_empresa,
            industria
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
        .select("id, nombre_empresa, industria")
        .order("nombre_empresa");

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error("Error fetching clientes:", error);
    }
  };

  const fetchHistorial = async (productoId: string) => {
    try {
      const { data, error } = await supabase
        .from("productos_elaborados_historial")
        .select("*")
        .eq("producto_elaborado_id", productoId)
        .order("fecha_cambio", { ascending: false });

      if (error) throw error;
      setHistorial(data || []);
    } catch (error) {
      console.error("Error fetching historial:", error);
      toast.error("Error al cargar el historial");
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('productos-elaborados-archivos')
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('productos-elaborados-archivos')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUploading(true);
    try {
      // Subir archivos si existen
      let arteUrl = null;
      let cotizacionUrl = null;

      if (archivoArteFinal) {
        arteUrl = await uploadFile(archivoArteFinal, 'arte_final');
      }

      if (archivoCotizacion) {
        cotizacionUrl = await uploadFile(archivoCotizacion, 'cotizacion');
      }

      const productData = {
        nombre_producto: formData.nombre_producto,
        cliente_id: formData.cliente_id || null,
        tipo_producto: formData.tipo_producto || null,
        industria: formData.industria || null,
        alto: formData.alto ? parseFloat(formData.alto) : null,
        ancho: formData.ancho ? parseFloat(formData.ancho) : null,
        profundidad: formData.profundidad ? parseFloat(formData.profundidad) : null,
        cantidad: parseInt(formData.cantidad) || 1,
        numero_colores: formData.numero_colores ? parseInt(formData.numero_colores) : null,
        tipo_material: formData.tipo_material || null,
        sustrato: formData.sustrato || null,
        calibre: formData.calibre || null,
        colores: formData.colores || null,
        barniz: formData.barniz || null,
        plastificado: formData.plastificado || null,
        troquelado: formData.troquelado,
        empaquetado: formData.empaquetado || null,
        pegado: formData.pegado || null,
        numero_paquetes: formData.numero_paquetes || null,
        precio_unitario_usd: formData.precio_unitario_usd ? parseFloat(formData.precio_unitario_usd) : null,
        observaciones: formData.observaciones || null,
        arte_final_pdf_url: arteUrl || (editingProduct ? editingProduct.arte_final_pdf_url : null),
        cotizacion_pdf_url: cotizacionUrl || (editingProduct ? editingProduct.cotizacion_pdf_url : null),
        user_id: user.id,
        actualizado_por: user.id
      };

      if (editingProduct) {
        const { error } = await supabase
          .from("productos_elaborados")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;

        // Agregar entrada al historial
        await supabase
          .from("productos_elaborados_historial")
          .insert({
            user_id: user.id,
            producto_elaborado_id: editingProduct.id,
            descripcion: "Producto actualizado",
            usuario_modificador: user.id,
            arte_final_pdf_url: arteUrl,
            cotizacion_pdf_url: cotizacionUrl
          });

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
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre_producto: "",
      cliente_id: "",
      tipo_producto: "",
      industria: "",
      alto: "",
      ancho: "",
      profundidad: "",
      cantidad: "1",
      numero_colores: "",
      tipo_material: "",
      sustrato: "",
      calibre: "",
      colores: "",
      barniz: "Ninguno",
      plastificado: "Ninguno",
      troquelado: false,
      empaquetado: "",
      pegado: "",
      numero_paquetes: "",
      precio_unitario_usd: "",
      observaciones: ""
    });
    setEditingProduct(null);
    setArchivoArteFinal(null);
    setArchivoCotizacion(null);
  };

  const handleEdit = (producto: ProductoElaborado) => {
    setEditingProduct(producto);
    setFormData({
      nombre_producto: producto.nombre_producto,
      cliente_id: producto.cliente_id || "",
      tipo_producto: producto.tipo_producto || "",
      industria: producto.industria || "",
      alto: producto.alto?.toString() || "",
      ancho: producto.ancho?.toString() || "",
      profundidad: producto.profundidad?.toString() || "",
      cantidad: producto.cantidad.toString(),
      numero_colores: producto.numero_colores?.toString() || "",
      tipo_material: producto.tipo_material || "",
      sustrato: producto.sustrato || "",
      calibre: producto.calibre || "",
      colores: producto.colores || "",
      barniz: producto.barniz || "Ninguno",
      plastificado: producto.plastificado || "Ninguno",
      troquelado: producto.troquelado || false,
      empaquetado: producto.empaquetado || "",
      pegado: producto.pegado || "",
      numero_paquetes: producto.numero_paquetes || "",
      precio_unitario_usd: producto.precio_unitario_usd?.toString() || "",
      observaciones: producto.observaciones || ""
    });
    setDialogOpen(true);
  };

  const handleDuplicate = (producto: ProductoElaborado) => {
    setEditingProduct(null);
    setFormData({
      nombre_producto: `${producto.nombre_producto} (Copia)`,
      cliente_id: producto.cliente_id || "",
      tipo_producto: producto.tipo_producto || "",
      industria: producto.industria || "",
      alto: producto.alto?.toString() || "",
      ancho: producto.ancho?.toString() || "",
      profundidad: producto.profundidad?.toString() || "",
      cantidad: producto.cantidad.toString(),
      numero_colores: producto.numero_colores?.toString() || "",
      tipo_material: producto.tipo_material || "",
      sustrato: producto.sustrato || "",
      calibre: producto.calibre || "",
      colores: producto.colores || "",
      barniz: producto.barniz || "Ninguno",
      plastificado: producto.plastificado || "Ninguno",
      troquelado: producto.troquelado || false,
      empaquetado: producto.empaquetado || "",
      pegado: producto.pegado || "",
      numero_paquetes: producto.numero_paquetes || "",
      precio_unitario_usd: producto.precio_unitario_usd?.toString() || "",
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

  const handleShowHistory = (producto: ProductoElaborado) => {
    setSelectedProduct(producto);
    fetchHistorial(producto.id);
    setHistorialDialogOpen(true);
  };

  // Filtros
  const productosFiltrados = productos.filter(producto => {
    const clienteMatch = !filtroCliente || 
      producto.clientes?.nombre_empresa.toLowerCase().includes(filtroCliente.toLowerCase());
    const tipoMatch = filtroTipoProducto === 'todos' || producto.tipo_producto === filtroTipoProducto;
    const industriaMatch = filtroIndustria === 'todas' || producto.industria === filtroIndustria;
    
    return clienteMatch && tipoMatch && industriaMatch;
  });

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Productos Elaborados</h1>
            <p className="text-muted-foreground">
              Gestiona los productos diseñados y fabricados bajo pedido
            </p>
          </div>
          <div className="flex space-x-2">
            <ImportarProductos onImportComplete={fetchProductos} />
            <Button 
              variant="outline" 
              onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
            >
              {viewMode === 'table' ? <Package className="mr-2 h-4 w-4" /> : <Table className="mr-2 h-4 w-4" />}
              {viewMode === 'table' ? 'Vista Cards' : 'Vista Tabla'}
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? "Editar Producto" : "Nuevo Producto Elaborado"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Información General */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-primary">Información General</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="nombre_producto">Nombre del Producto *</Label>
                        <Input
                          id="nombre_producto"
                          value={formData.nombre_producto}
                          onChange={(e) => setFormData({ ...formData, nombre_producto: e.target.value })}
                          required
                          className="bg-green-50 border-green-200"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="cliente_id">Cliente</Label>
                        <Select value={formData.cliente_id} onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}>
                          <SelectTrigger className="bg-green-50 border-green-200">
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
                        <Label htmlFor="tipo_producto">Tipo de Producto</Label>
                        <Select value={formData.tipo_producto} onValueChange={(value) => setFormData({ ...formData, tipo_producto: value })}>
                          <SelectTrigger className="bg-green-50 border-green-200">
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPO_PRODUCTO_OPTIONS.map((tipo) => (
                              <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="industria">Industria</Label>
                        <Select value={formData.industria} onValueChange={(value) => setFormData({ ...formData, industria: value })}>
                          <SelectTrigger className="bg-green-50 border-green-200">
                            <SelectValue placeholder="Seleccionar industria" />
                          </SelectTrigger>
                          <SelectContent>
                            {INDUSTRIA_OPTIONS.map((industria) => (
                              <SelectItem key={industria} value={industria}>{industria}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="precio_unitario_usd">Precio Unitario (USD)</Label>
                        <Input
                          id="precio_unitario_usd"
                          type="number"
                          step="0.01"
                          value={formData.precio_unitario_usd}
                          onChange={(e) => setFormData({ ...formData, precio_unitario_usd: e.target.value })}
                          className="bg-terracotta-50 border-terracotta-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Especificaciones Técnicas - Colapsible */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" type="button" className="w-full justify-between">
                        <span className="flex items-center">
                          <Package className="mr-2 h-4 w-4" />
                          Especificaciones Técnicas
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 mt-4 p-4 bg-ochre-50 rounded-lg border border-ochre-200">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="alto">Alto (cm)</Label>
                          <Input
                            id="alto"
                            type="number"
                            step="0.01"
                            value={formData.alto}
                            onChange={(e) => setFormData({ ...formData, alto: e.target.value })}
                            className="bg-white"
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
                            className="bg-white"
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
                            className="bg-white"
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
                            className="bg-white"
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
                            className="bg-white"
                          />
                        </div>

                        <div>
                          <Label htmlFor="calibre">Calibre</Label>
                          <Input
                            id="calibre"
                            value={formData.calibre}
                            onChange={(e) => setFormData({ ...formData, calibre: e.target.value })}
                            className="bg-white"
                          />
                        </div>

                        <div>
                          <Label htmlFor="sustrato">Sustrato</Label>
                          <Input
                            id="sustrato"
                            value={formData.sustrato}
                            onChange={(e) => setFormData({ ...formData, sustrato: e.target.value })}
                            className="bg-white"
                          />
                        </div>

                        <div>
                          <Label htmlFor="tipo_material">Tipo de Material</Label>
                          <Input
                            id="tipo_material"
                            value={formData.tipo_material}
                            onChange={(e) => setFormData({ ...formData, tipo_material: e.target.value })}
                            className="bg-white"
                          />
                        </div>

                        <div>
                          <Label htmlFor="colores">Colores</Label>
                          <Input
                            id="colores"
                            value={formData.colores}
                            onChange={(e) => setFormData({ ...formData, colores: e.target.value })}
                            className="bg-white"
                          />
                        </div>

                        <div>
                          <Label htmlFor="barniz">Barniz</Label>
                          <Select value={formData.barniz} onValueChange={(value) => setFormData({ ...formData, barniz: value })}>
                            <SelectTrigger className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BARNIZ_OPTIONS.map((barniz) => (
                                <SelectItem key={barniz} value={barniz}>{barniz}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="plastificado">Plastificado</Label>
                          <Select value={formData.plastificado} onValueChange={(value) => setFormData({ ...formData, plastificado: value })}>
                            <SelectTrigger className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PLASTIFICADO_OPTIONS.map((plastificado) => (
                                <SelectItem key={plastificado} value={plastificado}>{plastificado}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="empaquetado">Empaquetado</Label>
                          <Input
                            id="empaquetado"
                            value={formData.empaquetado}
                            onChange={(e) => setFormData({ ...formData, empaquetado: e.target.value })}
                            className="bg-white"
                          />
                        </div>

                        <div>
                          <Label htmlFor="pegado">Pegado</Label>
                          <Input
                            id="pegado"
                            value={formData.pegado}
                            onChange={(e) => setFormData({ ...formData, pegado: e.target.value })}
                            className="bg-white"
                          />
                        </div>

                        <div>
                          <Label htmlFor="numero_paquetes">Nº Paquetes</Label>
                          <Input
                            id="numero_paquetes"
                            value={formData.numero_paquetes}
                            onChange={(e) => setFormData({ ...formData, numero_paquetes: e.target.value })}
                            className="bg-white"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="troquelado"
                          checked={formData.troquelado}
                          onCheckedChange={(checked) => setFormData({ ...formData, troquelado: !!checked })}
                        />
                        <Label htmlFor="troquelado">Troquelado</Label>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Archivos */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-primary">Archivos Adjuntos</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="arte_final">Arte Final (PDF)</Label>
                        <Input
                          id="arte_final"
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setArchivoArteFinal(e.target.files?.[0] || null)}
                          className="bg-green-50 border-green-200"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="cotizacion">Cotización (PDF)</Label>
                        <Input
                          id="cotizacion"
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setArchivoCotizacion(e.target.files?.[0] || null)}
                          className="bg-green-50 border-green-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div>
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      className="bg-terracotta-50 border-terracotta-200"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={uploading}>
                      {uploading && <Upload className="mr-2 h-4 w-4 animate-spin" />}
                      {editingProduct ? "Actualizar" : "Crear"} Producto
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filtros */}
        <Card className="bg-gradient-to-r from-green-50 to-terracotta-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Filter className="mr-2 h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="filtro_cliente">Cliente</Label>
                <Input
                  id="filtro_cliente"
                  placeholder="Buscar por cliente..."
                  value={filtroCliente}
                  onChange={(e) => setFiltroCliente(e.target.value)}
                  className="bg-white"
                />
              </div>
              
              <div>
                <Label htmlFor="filtro_tipo">Tipo de Producto</Label>
                <Select value={filtroTipoProducto} onValueChange={setFiltroTipoProducto}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los tipos</SelectItem>
                    {TIPO_PRODUCTO_OPTIONS.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filtro_industria">Industria</Label>
                <Select value={filtroIndustria} onValueChange={setFiltroIndustria}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Todas las industrias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las industrias</SelectItem>
                    {INDUSTRIA_OPTIONS.map((industria) => (
                      <SelectItem key={industria} value={industria}>{industria}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contenido Principal */}
        {viewMode === 'table' ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow className="bg-ochre-50 hover:bg-ochre-100">
                  <TableHead>Producto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Industria</TableHead>
                  <TableHead>Medidas</TableHead>
                  <TableHead>Precio USD</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productosFiltrados.map((producto) => (
                  <TableRow key={producto.id} className="hover:bg-green-50">
                    <TableCell className="font-medium">{producto.nombre_producto}</TableCell>
                    <TableCell>{producto.clientes?.nombre_empresa || "Sin asignar"}</TableCell>
                    <TableCell>
                      {producto.tipo_producto && (
                        <Badge variant="secondary">{producto.tipo_producto}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {producto.industria && (
                        <Badge variant="outline">{producto.industria}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {(producto.alto || producto.ancho || producto.profundidad) ? 
                        `${producto.alto || "?"}×${producto.ancho || "?"}×${producto.profundidad || "?"}cm` : 
                        "-"
                      }
                    </TableCell>
                    <TableCell>
                      {producto.precio_unitario_usd ? `$${producto.precio_unitario_usd.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell>
                      {format(new Date(producto.fecha_creacion), "dd/MM/yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(producto)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDuplicate(producto)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleShowHistory(producto)}>
                          <History className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(producto.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {productosFiltrados.length === 0 && (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">No se encontraron productos</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ajusta los filtros o crea un nuevo producto.
                </p>
              </div>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productosFiltrados.map((producto) => (
              <Card key={producto.id} className="hover:shadow-md transition-shadow bg-gradient-to-br from-white to-green-50 border-green-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{producto.nombre_producto}</CardTitle>
                      <CardDescription>
                        {producto.clientes?.nombre_empresa || "Sin cliente asignado"}
                      </CardDescription>
                    </div>
                    <div className="space-y-1">
                      {producto.tipo_producto && (
                        <Badge variant="secondary">{producto.tipo_producto}</Badge>
                      )}
                      {producto.industria && (
                        <Badge variant="outline">{producto.industria}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {(producto.alto || producto.ancho || producto.profundidad) && (
                      <div>
                        <strong>Medidas:</strong> {producto.alto || "?"} × {producto.ancho || "?"} × {producto.profundidad || "?"} cm
                      </div>
                    )}
                    {producto.precio_unitario_usd && (
                      <div><strong>Precio:</strong> ${producto.precio_unitario_usd.toFixed(2)} USD</div>
                    )}
                    {producto.numero_colores && (
                      <div><strong>Colores:</strong> {producto.numero_colores}</div>
                    )}
                    <div>
                      <strong>Cantidad:</strong> {producto.cantidad}
                    </div>
                    <div>
                      <strong>Creado:</strong> {format(new Date(producto.fecha_creacion), "dd/MM/yyyy", { locale: es })}
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-4">
                    <div className="space-x-1">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(producto)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDuplicate(producto)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleShowHistory(producto)}>
                        <History className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleDelete(producto.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog del Historial */}
        <Dialog open={historialDialogOpen} onOpenChange={setHistorialDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                Historial de Cambios - {selectedProduct?.nombre_producto}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {historial.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="mx-auto h-12 w-12" />
                  <p className="mt-2">No hay cambios registrados</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historial.map((entry) => (
                    <Card key={entry.id} className="bg-gradient-to-r from-ochre-50 to-terracotta-50">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{entry.descripcion}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(entry.fecha_cambio), "dd/MM/yyyy HH:mm", { locale: es })}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            {entry.arte_final_pdf_url && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={entry.arte_final_pdf_url} target="_blank" rel="noopener noreferrer">
                                  <FileText className="h-4 w-4 mr-1" />
                                  Arte
                                </a>
                              </Button>
                            )}
                            {entry.cotizacion_pdf_url && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={entry.cotizacion_pdf_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 mr-1" />
                                  Cotización
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default ProductosElaborados;