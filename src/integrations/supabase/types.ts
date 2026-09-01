export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string
          description: string
          field_changed: string | null
          id: string
          new_value: string | null
          old_value: string | null
          target: string
          target_id: string | null
          user_id: string
          user_name: string
          user_role: string
        }
        Insert: {
          action: string
          created_at?: string
          description: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          target: string
          target_id?: string | null
          user_id: string
          user_name: string
          user_role: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          target?: string
          target_id?: string | null
          user_id?: string
          user_name?: string
          user_role?: string
        }
        Relationships: []
      }
      calendar_deliveries: {
        Row: {
          color: string
          color_index: number
          created_at: string
          end_date: string
          id: string
          start_date: string
          updated_at: string
          working_days: number
        }
        Insert: {
          color: string
          color_index?: number
          created_at?: string
          end_date: string
          id?: string
          start_date: string
          updated_at?: string
          working_days: number
        }
        Update: {
          color?: string
          color_index?: number
          created_at?: string
          end_date?: string
          id?: string
          start_date?: string
          updated_at?: string
          working_days?: number
        }
        Relationships: []
      }
      calendar_receipts: {
        Row: {
          created_at: string
          delivery_id: string
          id: string
          receipt_date: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          delivery_id: string
          id?: string
          receipt_date: string
          updated_at?: string
          value?: number
        }
        Update: {
          created_at?: string
          delivery_id?: string
          id?: string
          receipt_date?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "calendar_receipts_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "calendar_deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_week_notes: {
        Row: {
          created_at: string
          id: string
          note: string
          updated_at: string
          week_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string
          updated_at?: string
          week_key: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          updated_at?: string
          week_key?: string
        }
        Relationships: []
      }
      cashflow_bucket_categories: {
        Row: {
          bucket: string
          category: string
          created_at: string
          id: string
        }
        Insert: {
          bucket: string
          category: string
          created_at?: string
          id?: string
        }
        Update: {
          bucket?: string
          category?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      cashflow_state: {
        Row: {
          alteracoes: Json
          alteracoes_anual: Json
          alteracoes_groups: Json
          change_history: Json
          created_at: string
          date_edits: Json
          end_date: string | null
          entries: Json
          file_name: string | null
          file_path: string | null
          id: string
          saved_edits: Json
          start_date: string | null
          state_key: string
          updated_at: string
          valor_previsto: number
          valor_previsto_anual: number
          valor_previsto_anual_comp: number
          valor_previsto_comp: number
        }
        Insert: {
          alteracoes?: Json
          alteracoes_anual?: Json
          alteracoes_groups?: Json
          change_history?: Json
          created_at?: string
          date_edits?: Json
          end_date?: string | null
          entries?: Json
          file_name?: string | null
          file_path?: string | null
          id?: string
          saved_edits?: Json
          start_date?: string | null
          state_key?: string
          updated_at?: string
          valor_previsto?: number
          valor_previsto_anual?: number
          valor_previsto_anual_comp?: number
          valor_previsto_comp?: number
        }
        Update: {
          alteracoes?: Json
          alteracoes_anual?: Json
          alteracoes_groups?: Json
          change_history?: Json
          created_at?: string
          date_edits?: Json
          end_date?: string | null
          entries?: Json
          file_name?: string | null
          file_path?: string | null
          id?: string
          saved_edits?: Json
          start_date?: string | null
          state_key?: string
          updated_at?: string
          valor_previsto?: number
          valor_previsto_anual?: number
          valor_previsto_anual_comp?: number
          valor_previsto_comp?: number
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          cnpj: string
          company_name: string
          email: string
          id: string
          phone: string
          updated_at: string
        }
        Insert: {
          cnpj?: string
          company_name?: string
          email?: string
          id?: string
          phone?: string
          updated_at?: string
        }
        Update: {
          cnpj?: string
          company_name?: string
          email?: string
          id?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_summary: {
        Row: {
          alteracoes: Json | null
          alteracoes_comp: Json | null
          anotacoes: string | null
          assinaturas: Json | null
          avisos: Json | null
          card_order: Json | null
          checklist: Json
          controle_ausencias: Json
          controle_semanal: Json
          created_at: string
          despesas: Json | null
          despesas_dia: string | null
          despesas_programadas: string
          despesas_programadas_comp: string | null
          dias_uteis_restante: string | null
          faturamento_necessario: string | null
          id: string
          objetivo_faturamento: string | null
          possiveis_perdas: string | null
          receitas_dia: string | null
          receitas_esperadas: string
          receitas_esperadas_comp: string | null
          receitas_receber: Json
          resultado_acumulado: string | null
          resultado_comp_hoje: string | null
          resultado_comp_inicio: string | null
          resultado_comp_ontem: string | null
          resultado_hoje: string | null
          resultado_inicio: string | null
          resultado_ontem: string | null
          saldo_final_dia: string | null
          saldo_inicial_dia: string | null
          summary_date: string
          updated_at: string
        }
        Insert: {
          alteracoes?: Json | null
          alteracoes_comp?: Json | null
          anotacoes?: string | null
          assinaturas?: Json | null
          avisos?: Json | null
          card_order?: Json | null
          checklist?: Json
          controle_ausencias?: Json
          controle_semanal?: Json
          created_at?: string
          despesas?: Json | null
          despesas_dia?: string | null
          despesas_programadas?: string
          despesas_programadas_comp?: string | null
          dias_uteis_restante?: string | null
          faturamento_necessario?: string | null
          id?: string
          objetivo_faturamento?: string | null
          possiveis_perdas?: string | null
          receitas_dia?: string | null
          receitas_esperadas?: string
          receitas_esperadas_comp?: string | null
          receitas_receber?: Json
          resultado_acumulado?: string | null
          resultado_comp_hoje?: string | null
          resultado_comp_inicio?: string | null
          resultado_comp_ontem?: string | null
          resultado_hoje?: string | null
          resultado_inicio?: string | null
          resultado_ontem?: string | null
          saldo_final_dia?: string | null
          saldo_inicial_dia?: string | null
          summary_date: string
          updated_at?: string
        }
        Update: {
          alteracoes?: Json | null
          alteracoes_comp?: Json | null
          anotacoes?: string | null
          assinaturas?: Json | null
          avisos?: Json | null
          card_order?: Json | null
          checklist?: Json
          controle_ausencias?: Json
          controle_semanal?: Json
          created_at?: string
          despesas?: Json | null
          despesas_dia?: string | null
          despesas_programadas?: string
          despesas_programadas_comp?: string | null
          dias_uteis_restante?: string | null
          faturamento_necessario?: string | null
          id?: string
          objetivo_faturamento?: string | null
          possiveis_perdas?: string | null
          receitas_dia?: string | null
          receitas_esperadas?: string
          receitas_esperadas_comp?: string | null
          receitas_receber?: Json
          resultado_acumulado?: string | null
          resultado_comp_hoje?: string | null
          resultado_comp_inicio?: string | null
          resultado_comp_ontem?: string | null
          resultado_hoje?: string | null
          resultado_inicio?: string | null
          resultado_ontem?: string | null
          saldo_final_dia?: string | null
          saldo_inicial_dia?: string | null
          summary_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      department_managers: {
        Row: {
          created_at: string
          department_name: string
          employee_id: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_name: string
          employee_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_name?: string
          employee_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_managers_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      dre_category_map: {
        Row: {
          category_name: string
          created_at: string
          group_name: string
          id: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category_name: string
          created_at?: string
          group_name: string
          id?: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category_name?: string
          created_at?: string
          group_name?: string
          id?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      dre_datasets: {
        Row: {
          created_at: string
          file_name: string | null
          id: string
          kind: string
          months: Json
          rows_data: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          id?: string
          kind: string
          months?: Json
          rows_data?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          id?: string
          kind?: string
          months?: Json
          rows_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      employee_documents: {
        Row: {
          created_at: string
          data_upload: string
          employee_id: string
          id: string
          nome: string
          tamanho: string | null
          tipo: string
        }
        Insert: {
          created_at?: string
          data_upload?: string
          employee_id: string
          id?: string
          nome: string
          tamanho?: string | null
          tipo: string
        }
        Update: {
          created_at?: string
          data_upload?: string
          employee_id?: string
          id?: string
          nome?: string
          tamanho?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_history: {
        Row: {
          created_at: string
          data: string
          descricao: string
          employee_id: string
          id: string
          responsavel: string | null
          tipo: string
        }
        Insert: {
          created_at?: string
          data: string
          descricao: string
          employee_id: string
          id?: string
          responsavel?: string | null
          tipo: string
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string
          employee_id?: string
          id?: string
          responsavel?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          atestado_acompanhante: boolean | null
          aviso_previo_ciente: boolean | null
          carga_horaria: number | null
          cargo: string
          centro_custo: string | null
          chave_pix: string | null
          contrato_assinado: boolean | null
          cpf: string
          created_at: string
          data_admissao: string
          data_desligamento: string | null
          data_fim_experiencia: string | null
          data_inicio_aviso_previo: string | null
          data_nascimento: string | null
          data_pagamento_rescisao: string | null
          departamento: string
          desconto_alimentacao: number | null
          desconto_faltas: number | null
          desconto_farmacia: number | null
          email_corporativo: string | null
          email_pessoal: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_estado: string | null
          endereco_numero: string | null
          endereco_rua: string | null
          foto: string | null
          genero: string | null
          gestor_direto: string | null
          id: string
          matricula: string
          motivo_desligamento: string | null
          nome: string
          pagamento_confirmado: boolean | null
          rg: string | null
          salario: number
          status: string
          telefone: string | null
          tipo_chave_pix: string | null
          tipo_contrato: string
          updated_at: string
          user_id: string | null
          valor_rescisao: number | null
        }
        Insert: {
          atestado_acompanhante?: boolean | null
          aviso_previo_ciente?: boolean | null
          carga_horaria?: number | null
          cargo: string
          centro_custo?: string | null
          chave_pix?: string | null
          contrato_assinado?: boolean | null
          cpf: string
          created_at?: string
          data_admissao: string
          data_desligamento?: string | null
          data_fim_experiencia?: string | null
          data_inicio_aviso_previo?: string | null
          data_nascimento?: string | null
          data_pagamento_rescisao?: string | null
          departamento: string
          desconto_alimentacao?: number | null
          desconto_faltas?: number | null
          desconto_farmacia?: number | null
          email_corporativo?: string | null
          email_pessoal?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_estado?: string | null
          endereco_numero?: string | null
          endereco_rua?: string | null
          foto?: string | null
          genero?: string | null
          gestor_direto?: string | null
          id?: string
          matricula: string
          motivo_desligamento?: string | null
          nome: string
          pagamento_confirmado?: boolean | null
          rg?: string | null
          salario?: number
          status?: string
          telefone?: string | null
          tipo_chave_pix?: string | null
          tipo_contrato?: string
          updated_at?: string
          user_id?: string | null
          valor_rescisao?: number | null
        }
        Update: {
          atestado_acompanhante?: boolean | null
          aviso_previo_ciente?: boolean | null
          carga_horaria?: number | null
          cargo?: string
          centro_custo?: string | null
          chave_pix?: string | null
          contrato_assinado?: boolean | null
          cpf?: string
          created_at?: string
          data_admissao?: string
          data_desligamento?: string | null
          data_fim_experiencia?: string | null
          data_inicio_aviso_previo?: string | null
          data_nascimento?: string | null
          data_pagamento_rescisao?: string | null
          departamento?: string
          desconto_alimentacao?: number | null
          desconto_faltas?: number | null
          desconto_farmacia?: number | null
          email_corporativo?: string | null
          email_pessoal?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_estado?: string | null
          endereco_numero?: string | null
          endereco_rua?: string | null
          foto?: string | null
          genero?: string | null
          gestor_direto?: string | null
          id?: string
          matricula?: string
          motivo_desligamento?: string | null
          nome?: string
          pagamento_confirmado?: boolean | null
          rg?: string | null
          salario?: number
          status?: string
          telefone?: string | null
          tipo_chave_pix?: string | null
          tipo_contrato?: string
          updated_at?: string
          user_id?: string | null
          valor_rescisao?: number | null
        }
        Relationships: []
      }
      evaluations: {
        Row: {
          comunicacao: number
          created_at: string
          data: string
          employee_id: string
          id: string
          lideranca: number
          periodo: string
          pontos_fortes: string | null
          pontos_melhoria: string | null
          proatividade: number
          produtividade: number
          resultados: number
          trabalho_equipe: number
        }
        Insert: {
          comunicacao?: number
          created_at?: string
          data: string
          employee_id: string
          id?: string
          lideranca?: number
          periodo: string
          pontos_fortes?: string | null
          pontos_melhoria?: string | null
          proatividade?: number
          produtividade?: number
          resultados?: number
          trabalho_equipe?: number
        }
        Update: {
          comunicacao?: number
          created_at?: string
          data?: string
          employee_id?: string
          id?: string
          lideranca?: number
          periodo?: string
          pontos_fortes?: string | null
          pontos_melhoria?: string | null
          proatividade?: number
          produtividade?: number
          resultados?: number
          trabalho_equipe?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          created_at: string
          forecast: number
          id: string
          month: number
          name: string
          sort_order: number | null
          spent: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          forecast?: number
          id?: string
          month: number
          name: string
          sort_order?: number | null
          spent?: number
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          forecast?: number
          id?: string
          month?: number
          name?: string
          sort_order?: number | null
          spent?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      financial_dashboard_data: {
        Row: {
          average_price: number
          created_at: string
          daily_production_avg: number
          id: string
          month: number
          revenue_billed: number
          revenue_goal: number
          total_pieces: number
          updated_at: string
          working_days: number
          working_days_passed: number
          year: number
        }
        Insert: {
          average_price?: number
          created_at?: string
          daily_production_avg?: number
          id?: string
          month: number
          revenue_billed?: number
          revenue_goal?: number
          total_pieces?: number
          updated_at?: string
          working_days?: number
          working_days_passed?: number
          year: number
        }
        Update: {
          average_price?: number
          created_at?: string
          daily_production_avg?: number
          id?: string
          month?: number
          revenue_billed?: number
          revenue_goal?: number
          total_pieces?: number
          updated_at?: string
          working_days?: number
          working_days_passed?: number
          year?: number
        }
        Relationships: []
      }
      food_voucher_entries: {
        Row: {
          created_at: string
          delivery_method: string
          employee_id: string
          id: string
          month: number
          value: number
          year: number
        }
        Insert: {
          created_at?: string
          delivery_method?: string
          employee_id: string
          id?: string
          month: number
          value?: number
          year: number
        }
        Update: {
          created_at?: string
          delivery_method?: string
          employee_id?: string
          id?: string
          month?: number
          value?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "food_voucher_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      food_voucher_settings: {
        Row: {
          benefit_day: number
          created_at: string
          id: string
          month: number
          updated_at: string
          year: number
        }
        Insert: {
          benefit_day?: number
          created_at?: string
          id?: string
          month: number
          updated_at?: string
          year: number
        }
        Update: {
          benefit_day?: number
          created_at?: string
          id?: string
          month?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      hr_process_case_steps: {
        Row: {
          case_id: string
          concluido: boolean
          concluido_em: string | null
          created_at: string
          id: string
          nome: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          case_id: string
          concluido?: boolean
          concluido_em?: string | null
          created_at?: string
          id?: string
          nome: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          case_id?: string
          concluido?: boolean
          concluido_em?: string | null
          created_at?: string
          id?: string
          nome?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_process_case_steps_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "hr_process_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_process_cases: {
        Row: {
          created_at: string
          data_referencia: string | null
          employee_id: string
          id: string
          observacoes: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_referencia?: string | null
          employee_id: string
          id?: string
          observacoes?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_referencia?: string | null
          employee_id?: string
          id?: string
          observacoes?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_process_cases_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_process_templates: {
        Row: {
          created_at: string
          id: string
          nome: string
          sort_order: number
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          sort_order?: number
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          sort_order?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      net_salary_columns: {
        Row: {
          column_id: string
          created_at: string
          id: string
          month: number
          name: string
          sort_order: number | null
          type: string
          year: number
        }
        Insert: {
          column_id: string
          created_at?: string
          id?: string
          month: number
          name: string
          sort_order?: number | null
          type: string
          year: number
        }
        Update: {
          column_id?: string
          created_at?: string
          id?: string
          month?: number
          name?: string
          sort_order?: number | null
          type?: string
          year?: number
        }
        Relationships: []
      }
      net_salary_values: {
        Row: {
          column_id: string
          created_at: string
          employee_id: string
          id: string
          month: number
          value: number
          year: number
        }
        Insert: {
          column_id: string
          created_at?: string
          employee_id: string
          id?: string
          month: number
          value?: number
          year: number
        }
        Update: {
          column_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          month?: number
          value?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "net_salary_values_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      overtime_entries: {
        Row: {
          colaborador: string
          created_at: string
          employee_id: string | null
          file_name: string | null
          file_path: string | null
          horas: number
          id: string
          matched: boolean
          month: number
          updated_at: string
          valor: number
          year: number
        }
        Insert: {
          colaborador: string
          created_at?: string
          employee_id?: string | null
          file_name?: string | null
          file_path?: string | null
          horas?: number
          id?: string
          matched?: boolean
          month: number
          updated_at?: string
          valor?: number
          year: number
        }
        Update: {
          colaborador?: string
          created_at?: string
          employee_id?: string | null
          file_name?: string | null
          file_path?: string | null
          horas?: number
          id?: string
          matched?: boolean
          month?: number
          updated_at?: string
          valor?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "overtime_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      system_users: {
        Row: {
          auth_user_id: string | null
          avatar: string | null
          cargo: string
          created_at: string
          departamento: string
          email: string
          id: string
          nivel_acesso: string
          nome: string
          status: string
          ultimo_acesso: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          avatar?: string | null
          cargo?: string
          created_at?: string
          departamento?: string
          email: string
          id?: string
          nivel_acesso?: string
          nome: string
          status?: string
          ultimo_acesso?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          avatar?: string | null
          cargo?: string
          created_at?: string
          departamento?: string
          email?: string
          id?: string
          nivel_acesso?: string
          nome?: string
          status?: string
          ultimo_acesso?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transport_voucher_entries: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          month: number
          payment1_date: string | null
          payment1_value: number
          payment2_date: string | null
          payment2_value: number
          year: number
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          month: number
          payment1_date?: string | null
          payment1_value?: number
          payment2_date?: string | null
          payment2_value?: number
          year: number
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          month?: number
          payment1_date?: string | null
          payment1_value?: number
          payment2_date?: string | null
          payment2_value?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "transport_voucher_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_section_permissions: {
        Row: {
          created_at: string
          has_access: boolean
          id: string
          section_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          has_access?: boolean
          id?: string
          section_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          has_access?: boolean
          id?: string
          section_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_section_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "system_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
