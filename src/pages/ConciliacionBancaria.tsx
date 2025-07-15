import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, Link as LinkIcon, Check, X, Filter, Download, AlertTriangle } from 'lucide-react';

interface CuentaBancaria {
  id: string;
  banco_nombre: string;
  numero_cuenta: string;
  tipo: string;
  saldo_actual: number;
  moneda: string;
}

interface MovimientoInterno {
  id: string;
  tipo: string;
  monto: number;
  fecha: string;
  metodo_pago: string;
  observaciones?: string;
  conciliado: boolean;
}

interface MovimientoBanco {
  referencia: string;
  descripcion: string;
  monto: number;
  fecha: string;
  tipo: string;
}

interface Conciliacion {
  id: string;
  cuenta_bancaria_id: string;
  movimiento_id?: string;
  referencia_bancaria: string;
  monto: number;
  fecha: string;
  conciliado: boolean;
  observaciones?: string;
}

export default function ConciliacionBancaria() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([]);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<string>('');
  const [movimientosInternos, setMovimientosInternos] = useState<MovimientoInterno[]>([]);
  const [movimientosBanco, setMovimientosBanco] = useState<MovimientoBanco[]>([]);
  const [conciliaciones, setConciliaciones] = useState<Conciliacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [conciliarDialogOpen, setConciliarDialogOpen] = useState(false);
  const [selectedMovimiento, setSelectedMovimiento] = useState<MovimientoInterno | null>(null);
  const [selectedBanco, setSelectedBanco] = useState<MovimientoBanco | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [filtroMes, setFiltroMes] = useState('');
  const [soloNoConciliados, setSoloNoConciliados] = useState(false);

  useEffect(() => {
    if (user) {
      loadCuentasBancarias();
    }
  }, [user]);

  useEffect(() => {
    if (cuentaSeleccionada) {
      loadMovimientosInternos();
      loadConciliaciones();
    }
  }, [cuentaSeleccionada]);

  const loadCuentasBancarias = async () => {
    try {
      const { data, error } = await supabase
        .from('cuentas_bancarias')
        .select('*')
        .eq('user_id', user?.id)
        .eq('activa', true)
        .order('banco_nombre');

      if (error) throw error;
      setCuentasBancarias(data || []);
    } catch (error) {
      console.error('Error loading cuentas bancarias:', error);
      toast({
        title: "Error",
        description: "Error al cargar las cuentas bancarias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMovimientosInternos = async () => {
    try {
      const { data, error } = await supabase
        .from('pagos')
        .select('*')
        .eq('user_id', user?.id)
        .eq('cuenta_bancaria_id', cuentaSeleccionada)
        .order('fecha', { ascending: false });

      if (error) throw error;

      const movimientos = (data || []).map(pago => ({
        id: pago.id,
        tipo: pago.tipo,
        monto: pago.monto,
        fecha: pago.fecha,
        metodo_pago: pago.metodo_pago,
        observaciones: pago.observaciones,
        conciliado: false // Will be updated from conciliaciones
      }));

      setMovimientosInternos(movimientos);
    } catch (error) {
      console.error('Error loading movimientos internos:', error);
    }
  };

  const loadConciliaciones = async () => {
    try {
      const { data, error } = await supabase
        .from('conciliaciones')
        .select('*')
        .eq('user_id', user?.id)
        .eq('cuenta_bancaria_id', cuentaSeleccionada);

      if (error) throw error;
      setConciliaciones(data || []);

      // Update movimientos internos with conciliation status
      setMovimientosInternos(prev => prev.map(mov => ({
        ...mov,
        conciliado: (data || []).some(conc => conc.movimiento_id === mov.id && conc.conciliado)
      })));
    } catch (error) {
      console.error('Error loading conciliaciones:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const movements: MovimientoBanco[] = [];

      // Simple CSV parsing (assuming format: fecha,descripcion,monto,referencia)
      for (let i = 1; i < lines.length; i++) { // Skip header
        const line = lines[i].trim();
        if (!line) continue;

        const [fecha, descripcion, monto, referencia] = line.split(',');
        if (fecha && descripcion && monto && referencia) {
          movements.push({
            referencia: referencia.replace(/['"]/g, ''),
            descripcion: descripcion.replace(/['"]/g, ''),
            monto: parseFloat(monto.replace(/['"]/g, '')),
            fecha: fecha.replace(/['"]/g, ''),
            tipo: parseFloat(monto.replace(/['"]/g, '')) > 0 ? 'ingreso' : 'egreso'
          });
        }
      }

      setMovimientosBanco(movements);
      setUploadDialogOpen(false);
      
      toast({
        title: "Éxito",
        description: `${movements.length} movimientos bancarios cargados`,
      });
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: "Error",
        description: "Error al procesar el archivo",
        variant: "destructive",
      });
    }
  };

  const openConciliarDialog = (movimiento: MovimientoInterno, banco: MovimientoBanco) => {
    setSelectedMovimiento(movimiento);
    setSelectedBanco(banco);
    setObservaciones('');
    setConciliarDialogOpen(true);
  };

  const handleConciliar = async () => {
    if (!selectedMovimiento || !selectedBanco) return;

    try {
      const { error } = await supabase
        .from('conciliaciones')
        .insert({
          user_id: user?.id,
          cuenta_bancaria_id: cuentaSeleccionada,
          movimiento_id: selectedMovimiento.id,
          referencia_bancaria: selectedBanco.referencia,
          monto: selectedBanco.monto,
          fecha: selectedBanco.fecha,
          conciliado: true,
          observaciones
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Movimiento conciliado correctamente",
      });

      setConciliarDialogOpen(false);
      loadConciliaciones();
    } catch (error: any) {
      console.error('Error conciliating movement:', error);
      toast({
        title: "Error",
        description: "Error al conciliar el movimiento",
        variant: "destructive",
      });
    }
  };

  const sugerirConciliaciones = () => {
    const sugerencias: Array<{interno: MovimientoInterno, banco: MovimientoBanco}> = [];
    
    movimientosInternos.forEach(interno => {
      if (interno.conciliado) return;
      
      const banco = movimientosBanco.find(b => {
        const fechaInterno = new Date(interno.fecha);
        const fechaBanco = new Date(b.fecha);
        const diffDays = Math.abs((fechaInterno.getTime() - fechaBanco.getTime()) / (1000 * 60 * 60 * 24));
        
        return Math.abs(interno.monto - Math.abs(b.monto)) < 0.01 && diffDays <= 1;
      });
      
      if (banco) {
        sugerencias.push({ interno, banco });
      }
    });

    if (sugerencias.length > 0) {
      toast({
        title: "Sugerencias encontradas",
        description: `${sugerencias.length} posibles coincidencias detectadas`,
      });
    } else {
      toast({
        title: "Sin sugerencias",
        description: "No se encontraron coincidencias automáticas",
      });
    }
  };

  const filteredMovimientosInternos = movimientosInternos.filter(mov => {
    if (soloNoConciliados && mov.conciliado) return false;
    if (filtroMes && !mov.fecha.includes(filtroMes)) return false;
    return true;
  });

  const filteredMovimientosBanco = movimientosBanco.filter(mov => {
    if (filtroMes && !mov.fecha.includes(filtroMes)) return false;
    return true;
  });

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <Link to="/cuentas-bancarias">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-primary">Conciliación Bancaria</h1>
                <p className="text-muted-foreground">Concilia movimientos internos con estados de cuenta</p>
              </div>
            </div>
          </div>

          {/* Selección de cuenta y filtros */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
              <CardDescription>Selecciona la cuenta bancaria y configura los filtros</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Cuenta Bancaria</Label>
                  <Select value={cuentaSeleccionada} onValueChange={setCuentaSeleccionada}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {cuentasBancarias.map((cuenta) => (
                        <SelectItem key={cuenta.id} value={cuenta.id}>
                          {cuenta.banco_nombre} - {cuenta.numero_cuenta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Filtrar por mes</Label>
                  <Input
                    type="month"
                    value={filtroMes}
                    onChange={(e) => setFiltroMes(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mostrar solo no conciliados</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={soloNoConciliados}
                      onChange={(e) => setSoloNoConciliados(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Solo no conciliados</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Acciones</Label>
                  <div className="flex space-x-2">
                    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={!cuentaSeleccionada}>
                          <Upload className="h-4 w-4 mr-1" />
                          Subir CSV
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Cargar Estado de Cuenta</DialogTitle>
                          <DialogDescription>
                            Sube un archivo CSV con formato: fecha,descripcion,monto,referencia
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            type="file"
                            accept=".csv,.xlsx"
                            onChange={handleFileUpload}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={sugerirConciliaciones}
                      disabled={!cuentaSeleccionada || movimientosBanco.length === 0}
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Sugerir
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {cuentaSeleccionada && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Movimientos Internos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Movimientos Internos
                    <Badge variant="secondary">{filteredMovimientosInternos.length}</Badge>
                  </CardTitle>
                  <CardDescription>Pagos registrados en el sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMovimientosInternos.map((movimiento) => (
                          <TableRow 
                            key={movimiento.id}
                            className={movimiento.conciliado ? 'bg-green-50' : 'cursor-pointer hover:bg-muted/50'}
                          >
                            <TableCell className="text-sm">{movimiento.fecha}</TableCell>
                            <TableCell>
                              <Badge variant={movimiento.tipo === 'cobranza' ? 'default' : 'secondary'}>
                                {movimiento.tipo}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono">
                              ${Math.abs(movimiento.monto).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {movimiento.conciliado ? (
                                <Badge variant="default" className="bg-green-600">
                                  <Check className="h-3 w-3 mr-1" />
                                  Conciliado
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <X className="h-3 w-3 mr-1" />
                                  Pendiente
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Movimientos del Banco */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Movimientos del Banco
                    <Badge variant="secondary">{filteredMovimientosBanco.length}</Badge>
                  </CardTitle>
                  <CardDescription>Estado de cuenta bancario</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMovimientosBanco.map((movimiento, index) => (
                          <TableRow key={index} className="hover:bg-muted/50">
                            <TableCell className="text-sm">{movimiento.fecha}</TableCell>
                            <TableCell className="text-sm max-w-32 truncate" title={movimiento.descripcion}>
                              {movimiento.descripcion}
                            </TableCell>
                            <TableCell className="font-mono">
                              <span className={movimiento.monto >= 0 ? 'text-green-600' : 'text-red-600'}>
                                ${Math.abs(movimiento.monto).toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Find potential match
                                  const match = filteredMovimientosInternos.find(interno => 
                                    !interno.conciliado && 
                                    Math.abs(interno.monto - Math.abs(movimiento.monto)) < 0.01
                                  );
                                  if (match) {
                                    openConciliarDialog(match, movimiento);
                                  } else {
                                    toast({
                                      title: "Sin coincidencias",
                                      description: "No se encontró un movimiento interno para conciliar",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <LinkIcon className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Dialog de Conciliación */}
          <Dialog open={conciliarDialogOpen} onOpenChange={setConciliarDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Conciliar Movimientos</DialogTitle>
                <DialogDescription>
                  Confirma la conciliación entre el movimiento interno y bancario
                </DialogDescription>
              </DialogHeader>
              
              {selectedMovimiento && selectedBanco && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-semibold">Movimiento Interno</Label>
                      <div className="p-3 bg-muted rounded">
                        <p className="text-sm">Fecha: {selectedMovimiento.fecha}</p>
                        <p className="text-sm">Tipo: {selectedMovimiento.tipo}</p>
                        <p className="text-sm">Monto: ${selectedMovimiento.monto.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="font-semibold">Movimiento Bancario</Label>
                      <div className="p-3 bg-muted rounded">
                        <p className="text-sm">Fecha: {selectedBanco.fecha}</p>
                        <p className="text-sm">Ref: {selectedBanco.referencia}</p>
                        <p className="text-sm">Monto: ${selectedBanco.monto.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Notas adicionales sobre la conciliación..."
                    />
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setConciliarDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleConciliar}>
                  <Check className="h-4 w-4 mr-2" />
                  Conciliar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </MainLayout>
  );
}