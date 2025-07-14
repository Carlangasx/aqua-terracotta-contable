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
      inventario: {
        Row: {
          cantidad_disponible: number | null
          categoria: string | null
          created_at: string
          descripcion: string | null
          id: string
          nombre_producto: string
          precio_unitario: number
          sku: string | null
          stock_minimo: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cantidad_disponible?: number | null
          categoria?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre_producto: string
          precio_unitario?: number
          sku?: string | null
          stock_minimo?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cantidad_disponible?: number | null
          categoria?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre_producto?: string
          precio_unitario?: number
          sku?: string | null
          stock_minimo?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      ventas: {
        Row: {
          cliente_id: string
          created_at: string
          estado: Database["public"]["Enums"]["estado_venta"] | null
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
      [_ in never]: never
    }
    Enums: {
      estado_cuenta: "pendiente" | "parcial" | "pagado"
      estado_venta: "emitida" | "cobrada" | "anulada"
      moneda: "VES" | "USD"
      tipo_cuenta_bancaria: "ahorro" | "corriente"
      tipo_pago: "cobranza" | "pago"
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
      tipo_pago: ["cobranza", "pago"],
    },
  },
} as const
