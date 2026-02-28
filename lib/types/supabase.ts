export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	// Allows to automatically instantiate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: "14.4";
	};
	public: {
		Tables: {
			account_categories: {
				Row: {
					category_type: string;
					code: string;
					created_at: string;
					id: string;
					is_active: boolean;
					name: string;
					sort_order: number;
					tax_default: string | null;
					user_id: string | null;
				};
				Insert: {
					category_type: string;
					code: string;
					created_at?: string;
					id?: string;
					is_active?: boolean;
					name: string;
					sort_order?: number;
					tax_default?: string | null;
					user_id?: string | null;
				};
				Update: {
					category_type?: string;
					code?: string;
					created_at?: string;
					id?: string;
					is_active?: boolean;
					name?: string;
					sort_order?: number;
					tax_default?: string | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "account_categories_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			csv_mappings: {
				Row: {
					amount_column: string;
					balance_column: string | null;
					created_at: string;
					currency_column: string | null;
					date_column: string;
					date_format: string | null;
					delimiter: string | null;
					description_column: string;
					format_type: string;
					id: string;
					name: string;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					amount_column: string;
					balance_column?: string | null;
					created_at?: string;
					currency_column?: string | null;
					date_column: string;
					date_format?: string | null;
					delimiter?: string | null;
					description_column: string;
					format_type?: string;
					id?: string;
					name: string;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					amount_column?: string;
					balance_column?: string | null;
					created_at?: string;
					currency_column?: string | null;
					date_column?: string;
					date_format?: string | null;
					delimiter?: string | null;
					description_column?: string;
					format_type?: string;
					id?: string;
					name?: string;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "csv_mappings_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			import_logs: {
				Row: {
					created_at: string;
					csv_format: string;
					error_count: number | null;
					error_details: Json | null;
					file_name: string;
					file_size: number | null;
					id: string;
					row_count: number | null;
					status: string;
					success_count: number | null;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					csv_format?: string;
					error_count?: number | null;
					error_details?: Json | null;
					file_name: string;
					file_size?: number | null;
					id?: string;
					row_count?: number | null;
					status?: string;
					success_count?: number | null;
					user_id: string;
				};
				Update: {
					created_at?: string;
					csv_format?: string;
					error_count?: number | null;
					error_details?: Json | null;
					file_name?: string;
					file_size?: number | null;
					id?: string;
					row_count?: number | null;
					status?: string;
					success_count?: number | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "import_logs_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			profiles: {
				Row: {
					created_at: string;
					default_tax_rate: string;
					deleted_at: string | null;
					display_name: string | null;
					fiscal_year_start: number;
					id: string;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					default_tax_rate?: string;
					deleted_at?: string | null;
					display_name?: string | null;
					fiscal_year_start?: number;
					id: string;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					default_tax_rate?: string;
					deleted_at?: string | null;
					display_name?: string | null;
					fiscal_year_start?: number;
					id?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			transactions: {
				Row: {
					ai_confidence: number | null;
					ai_suggested: boolean;
					amount: number;
					created_at: string;
					credit_account: string;
					debit_account: string;
					deleted_at: string | null;
					description: string;
					exchange_rate: number | null;
					fees: number | null;
					id: string;
					import_log_id: string | null;
					is_confirmed: boolean;
					memo: string | null;
					original_amount: number | null;
					original_currency: string | null;
					source: string;
					tax_category: string | null;
					transaction_date: string;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					ai_confidence?: number | null;
					ai_suggested?: boolean;
					amount: number;
					created_at?: string;
					credit_account: string;
					debit_account: string;
					deleted_at?: string | null;
					description: string;
					exchange_rate?: number | null;
					fees?: number | null;
					id?: string;
					import_log_id?: string | null;
					is_confirmed?: boolean;
					memo?: string | null;
					original_amount?: number | null;
					original_currency?: string | null;
					source?: string;
					tax_category?: string | null;
					transaction_date: string;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					ai_confidence?: number | null;
					ai_suggested?: boolean;
					amount?: number;
					created_at?: string;
					credit_account?: string;
					debit_account?: string;
					deleted_at?: string | null;
					description?: string;
					exchange_rate?: number | null;
					fees?: number | null;
					id?: string;
					import_log_id?: string | null;
					is_confirmed?: boolean;
					memo?: string | null;
					original_amount?: number | null;
					original_currency?: string | null;
					source?: string;
					tax_category?: string | null;
					transaction_date?: string;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "transactions_import_log_id_fkey";
						columns: ["import_log_id"];
						isOneToOne: false;
						referencedRelation: "import_logs";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "transactions_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema["Enums"]
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
		? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema["CompositeTypes"]
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
		? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	public: {
		Enums: {},
	},
} as const;
