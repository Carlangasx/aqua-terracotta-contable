export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      cac_archivos: {
        Row: {
          created_at: string
          documento_id: number
          id: string
          nombre_archivo: string
          tipo_archivo: string
          url_archivo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          documento_id: number
          id?: string
          nombre_archivo: string
          tipo_archivo: string
          url_archivo: string
          user_id: string
        }
        Update: {
          created_at?: string
          documento_id?: number
          id?: string
          nombre_archivo?: string
          tipo_archivo?: string
          url_archivo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cac_archivos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos_generados"
            referencedColumns: ["id"]
          },
        ]
      }
      cac_resultados: {
        Row: {
          alto_real: number | null
          ancho_real: number | null
          barniz: string | null
          calibre: string | null
          colores: string | null
          created_at: string
          documento_id: number
          empaquetado: string | null
          extras: Json | null
          id: string
          n_paquetes: string | null
          pegado: string | null
          plastificado: string | null
          profundidad_real: number | null
          sustrato: string | null
          troquelado: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alto_real?: number | null
          ancho_real?: number | null
          barniz?: string | null
          calibre?: string | null
          colores?: string | null
          created_at?: string
          documento_id: number
          empaquetado?: string | null
          extras?: Json | null
          id?: string
          n_paquetes?: string | null
          pegado?: string | null
          plastificado?: string | null
          profundidad_real?: number | null
          sustrato?: string | null
          troquelado?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alto_real?: number | null
          ancho_real?: number | null
          barniz?: string | null
          calibre?: string | null
          colores?: string | null
          created_at?: string
          documento_id?: number
          empaquetado?: string | null
          extras?: Json | null
          id?: string
          n_paquetes?: string | null
          pegado?: string | null
          plastificado?: string | null
          profundidad_real?: number | null
          sustrato?: string | null
          troquelado?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cac_resultados_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: true
            referencedRelation: "documentos_generados"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          contribuyente_especial: boolean | null
          correo: string | null
          created_at: string
          direccion_fiscal: string | null
          id: string
          industria: string | null
          nombre_empresa: string
          persona_contacto: string | null
          rif: string
          telefono_contacto: string | null
          telefono_empresa: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contribuyente_especial?: boolean | null
          correo?: string | null
          created_at?: string
          direccion_fiscal?: string | null
          id?: string
          industria?: string | null
          nombre_empresa: string
          persona_contacto?: string | null
          rif: string
          telefono_contacto?: string | null
          telefono_empresa?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contribuyente_especial?: boolean | null
          correo?: string | null
          created_at?: string
          direccion_fiscal?: string | null
          id?: string
          industria?: string | null
          nombre_empresa?: string
          persona_contacto?: string | null
          rif?: string
          telefono_contacto?: string | null
          telefono_empresa?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conciliaciones: {
        Row: {
          conciliado: boolean
          created_at: string
          cuenta_bancaria_id: string | null
          fecha: string
          id: string
          monto: number
          movimiento_id: string | null
          observaciones: string | null
          referencia_bancaria: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conciliado?: boolean
          created_at?: string
          cuenta_bancaria_id?: string | null
          fecha: string
          id?: string
          monto?: number
          movimiento_id?: string | null
          observaciones?: string | null
          referencia_bancaria?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conciliado?: boolean
          created_at?: string
          cuenta_bancaria_id?: string | null
          fecha?: string
          id?: string
          monto?: number
          movimiento_id?: string | null
          observaciones?: string | null
          referencia_bancaria?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conciliaciones_cuenta_bancaria_id_fkey"
            columns: ["cuenta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "cuentas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conciliaciones_movimiento_id_fkey"
            columns: ["movimiento_id"]
            isOneToOne: false
            referencedRelation: "pagos"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_empresa: {
        Row: {
          condiciones_pago_default: string | null
          correo: string | null
          created_at: string
          direccion_fiscal: string
          id: string
          logo_url: string | null
          razon_social: string
          rif: string
          telefono: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          condiciones_pago_default?: string | null
          correo?: string | null
          created_at?: string
          direccion_fiscal: string
          id?: string
          logo_url?: string | null
          razon_social: string
          rif: string
          telefono?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          condiciones_pago_default?: string | null
          correo?: string | null
          created_at?: string
          direccion_fiscal?: string
          id?: string
          logo_url?: string | null
          razon_social?: string
          rif?: string
          telefono?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cotizaciones: {
        Row: {
          cantidad_cotizada: number
          cliente_id: string | null
          corte: string | null
          created_at: string
          descripcion_montaje: string | null
          documento_pdf: string | null
          fecha_cotizacion: string
          id: string
          industria: string | null
          medidas_caja_mm: Json
          nombre_producto: string
          observaciones: string | null
          precio_unitario: number
          sku: string
          tamaños_por_corte: string | null
          tamaños_por_pliego: string | null
          tipo_empaque: string | null
          troquel_id: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cantidad_cotizada?: number
          cliente_id?: string | null
          corte?: string | null
          created_at?: string
          descripcion_montaje?: string | null
          documento_pdf?: string | null
          fecha_cotizacion?: string
          id?: string
          industria?: string | null
          medidas_caja_mm?: Json
          nombre_producto: string
          observaciones?: string | null
          precio_unitario?: number
          sku: string
          tamaños_por_corte?: string | null
          tamaños_por_pliego?: string | null
          tipo_empaque?: string | null
          troquel_id?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cantidad_cotizada?: number
          cliente_id?: string | null
          corte?: string | null
          created_at?: string
          descripcion_montaje?: string | null
          documento_pdf?: string | null
          fecha_cotizacion?: string
          id?: string
          industria?: string | null
          medidas_caja_mm?: Json
          nombre_producto?: string
          observaciones?: string | null
          precio_unitario?: number
          sku?: string
          tamaños_por_corte?: string | null
          tamaños_por_pliego?: string | null
          tipo_empaque?: string | null
          troquel_id?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotizaciones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cuentas_bancarias: {
        Row: {
          activa: boolean
          banco_nombre: string
          created_at: string
          id: string
          moneda: Database["public"]["Enums"]["moneda"]
          numero_cuenta: string
          saldo_actual: number
          tipo: Database["public"]["Enums"]["tipo_cuenta_bancaria"]
          updated_at: string
          user_id: string
        }
        Insert: {
          activa?: boolean
          banco_nombre: string
          created_at?: string
          id?: string
          moneda?: Database["public"]["Enums"]["moneda"]
          numero_cuenta: string
          saldo_actual?: number
          tipo?: Database["public"]["Enums"]["tipo_cuenta_bancaria"]
          updated_at?: string
          user_id: string
        }
        Update: {
          activa?: boolean
          banco_nombre?: string
          created_at?: string
          id?: string
          moneda?: Database["public"]["Enums"]["moneda"]
          numero_cuenta?: string
          saldo_actual?: number
          tipo?: Database["public"]["Enums"]["tipo_cuenta_bancaria"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cuentas_por_cobrar: {
        Row: {
          cliente_id: string | null
          created_at: string
          estado: Database["public"]["Enums"]["estado_cuenta"]
          fecha_emision: string
          fecha_vencimiento: string | null
          id: string
          monto_pagado: number
          monto_total: number
          notas: string | null
          saldo: number
          updated_at: string
          user_id: string
          venta_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_cuenta"]
          fecha_emision?: string
          fecha_vencimiento?: string | null
          id?: string
          monto_pagado?: number
          monto_total?: number
          notas?: string | null
          saldo?: number
          updated_at?: string
          user_id: string
          venta_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_cuenta"]
          fecha_emision?: string
          fecha_vencimiento?: string | null
          id?: string
          monto_pagado?: number
          monto_total?: number
          notas?: string | null
          saldo?: number
          updated_at?: string
          user_id?: string
          venta_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cuentas_por_cobrar_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cuentas_por_cobrar_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
        ]
      }
      cuentas_por_pagar: {
        Row: {
          concepto: string
          created_at: string
          estado: Database["public"]["Enums"]["estado_cuenta"]
          fecha_emision: string
          fecha_vencimiento: string | null
          id: string
          monto_pagado: number
          monto_total: number
          proveedor_nombre: string
          saldo: number
          updated_at: string
          user_id: string
        }
        Insert: {
          concepto: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_cuenta"]
          fecha_emision?: string
          fecha_vencimiento?: string | null
          id?: string
          monto_pagado?: number
          monto_total?: number
          proveedor_nombre: string
          saldo?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          concepto?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_cuenta"]
          fecha_emision?: string
          fecha_vencimiento?: string | null
          id?: string
          monto_pagado?: number
          monto_total?: number
          proveedor_nombre?: string
          saldo?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      documentos_generados: {
        Row: {
          cliente_id: string | null
          codificacion: string | null
          condiciones_pago: string | null
          created_at: string | null
          descuento: number | null
          documento_origen_id: number | null
          estado: string | null
          extras: Json | null
          fecha_caducidad: string | null
          fecha_emision: string | null
          id: number
          moneda: string | null
          numero_control_general: number | null
          numero_documento: string
          observaciones: string | null
          productos: Json | null
          revision: number | null
          tipo_documento: string
          total: number | null
          updated_at: string | null
          url_pdf: string | null
          user_id: string
        }
        Insert: {
          cliente_id?: string | null
          codificacion?: string | null
          condiciones_pago?: string | null
          created_at?: string | null
          descuento?: number | null
          documento_origen_id?: number | null
          estado?: string | null
          extras?: Json | null
          fecha_caducidad?: string | null
          fecha_emision?: string | null
          id?: number
          moneda?: string | null
          numero_control_general?: number | null
          numero_documento: string
          observaciones?: string | null
          productos?: Json | null
          revision?: number | null
          tipo_documento: string
          total?: number | null
          updated_at?: string | null
          url_pdf?: string | null
          user_id: string
        }
        Update: {
          cliente_id?: string | null
          codificacion?: string | null
          condiciones_pago?: string | null
          created_at?: string | null
          descuento?: number | null
          documento_origen_id?: number | null
          estado?: string | null
          extras?: Json | null
          fecha_caducidad?: string | null
          fecha_emision?: string | null
          id?: number
          moneda?: string | null
          numero_control_general?: number | null
          numero_documento?: string
          observaciones?: string | null
          productos?: Json | null
          revision?: number | null
          tipo_documento?: string
          total?: number | null
          updated_at?: string | null
          url_pdf?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_generados_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      historial_elaboraciones: {
        Row: {
          arte_final_pdf_url: string | null
          cac_id: number | null
          creado_por: string
          created_at: string
          documento_generado_id: number | null
          fecha: string
          id: string
          numero_documento_origen: string | null
          observaciones: string | null
          precio_cliente_usd: number | null
          producto_id: string
          tipo_documento_origen: string
          updated_at: string
          user_id: string
        }
        Insert: {
          arte_final_pdf_url?: string | null
          cac_id?: number | null
          creado_por: string
          created_at?: string
          documento_generado_id?: number | null
          fecha?: string
          id?: string
          numero_documento_origen?: string | null
          observaciones?: string | null
          precio_cliente_usd?: number | null
          producto_id: string
          tipo_documento_origen: string
          updated_at?: string
          user_id: string
        }
        Update: {
          arte_final_pdf_url?: string | null
          cac_id?: number | null
          creado_por?: string
          created_at?: string
          documento_generado_id?: number | null
          fecha?: string
          id?: string
          numero_documento_origen?: string | null
          observaciones?: string | null
          precio_cliente_usd?: number | null
          producto_id?: string
          tipo_documento_origen?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historial_elaboraciones_cac_id_fkey"
            columns: ["cac_id"]
            isOneToOne: false
            referencedRelation: "documentos_generados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_elaboraciones_documento_generado_id_fkey"
            columns: ["documento_generado_id"]
            isOneToOne: false
            referencedRelation: "documentos_generados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_elaboraciones_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_elaborados"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario_consumibles: {
        Row: {
          cantidad_disponible: number | null
          categoria: string | null
          created_at: string
          descripcion: string | null
          fecha_ingreso: string | null
          id: string
          nombre_producto: string
          precio_unitario: number
          proveedor: string | null
          sku: string | null
          stock_minimo: number | null
          tipo: string | null
          unidad_medida: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cantidad_disponible?: number | null
          categoria?: string | null
          created_at?: string
          descripcion?: string | null
          fecha_ingreso?: string | null
          id?: string
          nombre_producto: string
          precio_unitario?: number
          proveedor?: string | null
          sku?: string | null
          stock_minimo?: number | null
          tipo?: string | null
          unidad_medida?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cantidad_disponible?: number | null
          categoria?: string | null
          created_at?: string
          descripcion?: string | null
          fecha_ingreso?: string | null
          id?: string
          nombre_producto?: string
          precio_unitario?: number
          proveedor?: string | null
          sku?: string | null
          stock_minimo?: number | null
          tipo?: string | null
          unidad_medida?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      log_cargas_cotizaciones: {
        Row: {
          created_at: string
          detalle_errores: Json | null
          fecha: string
          filas_actualizadas: number
          filas_con_error: number
          filas_insertadas: number
          id: string
          nombre_archivo: string
          tamaño_archivo: number | null
          total_filas: number
          updated_at: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          detalle_errores?: Json | null
          fecha?: string
          filas_actualizadas?: number
          filas_con_error?: number
          filas_insertadas?: number
          id?: string
          nombre_archivo: string
          tamaño_archivo?: number | null
          total_filas?: number
          updated_at?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          detalle_errores?: Json | null
          fecha?: string
          filas_actualizadas?: number
          filas_con_error?: number
          filas_insertadas?: number
          id?: string
          nombre_archivo?: string
          tamaño_archivo?: number | null
          total_filas?: number
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      log_cargas_inventario: {
        Row: {
          created_at: string
          detalle_errores: Json | null
          fecha: string
          filas_actualizadas: number
          filas_con_error: number
          filas_insertadas: number
          id: string
          nombre_archivo: string
          tamaño_archivo: number | null
          total_filas: number
          updated_at: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          detalle_errores?: Json | null
          fecha?: string
          filas_actualizadas?: number
          filas_con_error?: number
          filas_insertadas?: number
          id?: string
          nombre_archivo: string
          tamaño_archivo?: number | null
          total_filas?: number
          updated_at?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          detalle_errores?: Json | null
          fecha?: string
          filas_actualizadas?: number
          filas_con_error?: number
          filas_insertadas?: number
          id?: string
          nombre_archivo?: string
          tamaño_archivo?: number | null
          total_filas?: number
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      movimientos_inventario: {
        Row: {
          cantidad: number
          costo_unitario: number | null
          created_at: string
          fecha: string
          id: string
          motivo: string | null
          producto_id: string
          referencia_documento: string | null
          tipo_movimiento: Database["public"]["Enums"]["tipo_movimiento_inventario"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cantidad: number
          costo_unitario?: number | null
          created_at?: string
          fecha?: string
          id?: string
          motivo?: string | null
          producto_id: string
          referencia_documento?: string | null
          tipo_movimiento: Database["public"]["Enums"]["tipo_movimiento_inventario"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cantidad?: number
          costo_unitario?: number | null
          created_at?: string
          fecha?: string
          id?: string
          motivo?: string | null
          producto_id?: string
          referencia_documento?: string | null
          tipo_movimiento?: Database["public"]["Enums"]["tipo_movimiento_inventario"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_inventario_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "inventario_consumibles"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          created_at: string
          cuenta_bancaria_id: string | null
          cuenta_por_cobrar_id: string | null
          cuenta_por_pagar_id: string | null
          fecha: string
          id: string
          metodo_pago: string
          monto: number
          observaciones: string | null
          tipo: Database["public"]["Enums"]["tipo_pago"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cuenta_bancaria_id?: string | null
          cuenta_por_cobrar_id?: string | null
          cuenta_por_pagar_id?: string | null
          fecha?: string
          id?: string
          metodo_pago: string
          monto: number
          observaciones?: string | null
          tipo: Database["public"]["Enums"]["tipo_pago"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cuenta_bancaria_id?: string | null
          cuenta_por_cobrar_id?: string | null
          cuenta_por_pagar_id?: string | null
          fecha?: string
          id?: string
          metodo_pago?: string
          monto?: number
          observaciones?: string | null
          tipo?: Database["public"]["Enums"]["tipo_pago"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_cuenta_bancaria_id_fkey"
            columns: ["cuenta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "cuentas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_cuenta_por_cobrar_id_fkey"
            columns: ["cuenta_por_cobrar_id"]
            isOneToOne: false
            referencedRelation: "cuentas_por_cobrar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_cuenta_por_pagar_id_fkey"
            columns: ["cuenta_por_pagar_id"]
            isOneToOne: false
            referencedRelation: "cuentas_por_pagar"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          alto: number
          ancho: number
          cantidad: number
          correo_contacto: string
          created_at: string
          fecha_creacion: string
          id: string
          nombre_contacto: string
          plano_pdf_url: string | null
          profundidad: number
          puesto_contacto: string
          rif_pdf_url: string | null
          soporte: Database["public"]["Enums"]["tipo_soporte"]
          telefono: string
          unidad: Database["public"]["Enums"]["unidad_medida"]
          updated_at: string
        }
        Insert: {
          alto: number
          ancho: number
          cantidad: number
          correo_contacto: string
          created_at?: string
          fecha_creacion?: string
          id?: string
          nombre_contacto: string
          plano_pdf_url?: string | null
          profundidad: number
          puesto_contacto: string
          rif_pdf_url?: string | null
          soporte: Database["public"]["Enums"]["tipo_soporte"]
          telefono: string
          unidad?: Database["public"]["Enums"]["unidad_medida"]
          updated_at?: string
        }
        Update: {
          alto?: number
          ancho?: number
          cantidad?: number
          correo_contacto?: string
          created_at?: string
          fecha_creacion?: string
          id?: string
          nombre_contacto?: string
          plano_pdf_url?: string | null
          profundidad?: number
          puesto_contacto?: string
          rif_pdf_url?: string | null
          soporte?: Database["public"]["Enums"]["tipo_soporte"]
          telefono?: string
          unidad?: Database["public"]["Enums"]["unidad_medida"]
          updated_at?: string
        }
        Relationships: []
      }
      productos_elaborados: {
        Row: {
          actualizado_por: string
          alto: number | null
          ancho: number | null
          arte_final_pdf_url: string | null
          barniz: string | null
          calibre: string | null
          cantidad: number | null
          cliente_id: string | null
          colores: string | null
          cotizacion_pdf_url: string | null
          created_at: string
          empaquetado: string | null
          fecha_creacion: string | null
          id: string
          industria: string | null
          nombre_producto: string
          numero_colores: number | null
          numero_paquetes: string | null
          observaciones: string | null
          pegado: string | null
          plastificado: string | null
          precio_unitario_usd: number | null
          profundidad: number | null
          sustrato: string | null
          tipo_material: string | null
          tipo_producto: string | null
          troquelado: boolean | null
          ultima_modificacion: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actualizado_por: string
          alto?: number | null
          ancho?: number | null
          arte_final_pdf_url?: string | null
          barniz?: string | null
          calibre?: string | null
          cantidad?: number | null
          cliente_id?: string | null
          colores?: string | null
          cotizacion_pdf_url?: string | null
          created_at?: string
          empaquetado?: string | null
          fecha_creacion?: string | null
          id?: string
          industria?: string | null
          nombre_producto: string
          numero_colores?: number | null
          numero_paquetes?: string | null
          observaciones?: string | null
          pegado?: string | null
          plastificado?: string | null
          precio_unitario_usd?: number | null
          profundidad?: number | null
          sustrato?: string | null
          tipo_material?: string | null
          tipo_producto?: string | null
          troquelado?: boolean | null
          ultima_modificacion?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actualizado_por?: string
          alto?: number | null
          ancho?: number | null
          arte_final_pdf_url?: string | null
          barniz?: string | null
          calibre?: string | null
          cantidad?: number | null
          cliente_id?: string | null
          colores?: string | null
          cotizacion_pdf_url?: string | null
          created_at?: string
          empaquetado?: string | null
          fecha_creacion?: string | null
          id?: string
          industria?: string | null
          nombre_producto?: string
          numero_colores?: number | null
          numero_paquetes?: string | null
          observaciones?: string | null
          pegado?: string | null
          plastificado?: string | null
          precio_unitario_usd?: number | null
          profundidad?: number | null
          sustrato?: string | null
          tipo_material?: string | null
          tipo_producto?: string | null
          troquelado?: boolean | null
          ultima_modificacion?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "productos_elaborados_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      productos_elaborados_archivos: {
        Row: {
          created_at: string
          id: string
          nombre_archivo: string
          producto_elaborado_id: string | null
          tipo_archivo: string
          url_archivo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre_archivo: string
          producto_elaborado_id?: string | null
          tipo_archivo: string
          url_archivo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre_archivo?: string
          producto_elaborado_id?: string | null
          tipo_archivo?: string
          url_archivo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "productos_elaborados_archivos_producto_elaborado_id_fkey"
            columns: ["producto_elaborado_id"]
            isOneToOne: false
            referencedRelation: "productos_elaborados"
            referencedColumns: ["id"]
          },
        ]
      }
      productos_elaborados_historial: {
        Row: {
          arte_final_pdf_url: string | null
          cotizacion_pdf_url: string | null
          created_at: string
          descripcion: string
          fecha_cambio: string | null
          id: string
          producto_elaborado_id: string | null
          user_id: string
          usuario_modificador: string
        }
        Insert: {
          arte_final_pdf_url?: string | null
          cotizacion_pdf_url?: string | null
          created_at?: string
          descripcion: string
          fecha_cambio?: string | null
          id?: string
          producto_elaborado_id?: string | null
          user_id: string
          usuario_modificador: string
        }
        Update: {
          arte_final_pdf_url?: string | null
          cotizacion_pdf_url?: string | null
          created_at?: string
          descripcion?: string
          fecha_cambio?: string | null
          id?: string
          producto_elaborado_id?: string | null
          user_id?: string
          usuario_modificador?: string
        }
        Relationships: [
          {
            foreignKeyName: "productos_elaborados_historial_producto_elaborado_id_fkey"
            columns: ["producto_elaborado_id"]
            isOneToOne: false
            referencedRelation: "productos_elaborados"
            referencedColumns: ["id"]
          },
        ]
      }
      ventas: {
        Row: {
          cliente_id: string
          created_at: string
          estado: Database["public"]["Enums"]["estado_venta"] | null
          factura_pdf_url: string | null
          fecha: string
          id: string
          iva: number | null
          observaciones: string | null
          productos: Json
          subtotal: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_venta"] | null
          factura_pdf_url?: string | null
          fecha?: string
          id?: string
          iva?: number | null
          observaciones?: string | null
          productos?: Json
          subtotal?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_venta"] | null
          factura_pdf_url?: string | null
          fecha?: string
          id?: string
          iva?: number | null
          observaciones?: string | null
          productos?: Json
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ventas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_control_number: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_document_number: {
        Args: { doc_type: string }
        Returns: string
      }
    }
    Enums: {
      estado_cuenta: "pendiente" | "parcial" | "pagado"
      estado_venta: "emitida" | "cobrada" | "anulada"
      moneda: "VES" | "USD"
      tipo_cuenta_bancaria: "ahorro" | "corriente"
      tipo_movimiento_inventario: "ENTRADA" | "SALIDA"
      tipo_pago: "cobranza" | "pago"
      tipo_soporte: "Microcorrugado" | "Sulfatada" | "Kraft" | "Otra"
      unidad_medida: "cm" | "mm"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      estado_cuenta: ["pendiente", "parcial", "pagado"],
      estado_venta: ["emitida", "cobrada", "anulada"],
      moneda: ["VES", "USD"],
      tipo_cuenta_bancaria: ["ahorro", "corriente"],
      tipo_movimiento_inventario: ["ENTRADA", "SALIDA"],
      tipo_pago: ["cobranza", "pago"],
      tipo_soporte: ["Microcorrugado", "Sulfatada", "Kraft", "Otra"],
      unidad_medida: ["cm", "mm"],
    },
  },
} as const
