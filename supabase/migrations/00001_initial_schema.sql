-- Migration: Initial Schema
-- KanjouAI - フリーランス確定申告仕訳アプリ

-- ============================================
-- 1. プロフィールテーブル
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  fiscal_year_start INT NOT NULL DEFAULT 1,
  default_tax_rate TEXT NOT NULL DEFAULT 'tax_10',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  USING (auth.uid() = id AND deleted_at IS NULL);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (auth.uid() = id AND deleted_at IS NULL);

-- ============================================
-- 2. 勘定科目マスタ
-- ============================================
CREATE TABLE IF NOT EXISTS account_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category_type TEXT NOT NULL CHECK (category_type IN ('expense', 'income', 'asset', 'liability')),
  tax_default TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, code)
);

ALTER TABLE account_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "account_categories_select" ON account_categories FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "account_categories_insert_own" ON account_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "account_categories_update_own" ON account_categories FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "account_categories_delete_own" ON account_categories FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_account_categories_user_id ON account_categories(user_id);

-- ============================================
-- 3. 取引テーブル
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount INT NOT NULL CHECK (amount > 0),
  debit_account TEXT NOT NULL,
  credit_account TEXT NOT NULL,
  tax_category TEXT,
  ai_confidence REAL CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  ai_suggested BOOLEAN NOT NULL DEFAULT false,
  is_confirmed BOOLEAN NOT NULL DEFAULT false,
  memo TEXT,
  -- CSV import metadata
  original_amount NUMERIC,
  original_currency TEXT,
  exchange_rate NUMERIC,
  fees INT DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'csv_import', 'ai')),
  import_log_id UUID REFERENCES import_logs(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select_own" ON transactions FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "transactions_insert_own" ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update_own" ON transactions FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "transactions_delete_own" ON transactions FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(user_id, transaction_date);
CREATE INDEX idx_transactions_confirmed ON transactions(user_id, is_confirmed);

-- ============================================
-- 4. インポート履歴テーブル
-- ============================================
CREATE TABLE IF NOT EXISTS import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INT,
  csv_format TEXT NOT NULL DEFAULT 'generic' CHECK (csv_format IN ('wise', 'revolut', 'generic')),
  row_count INT,
  success_count INT,
  error_count INT,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "import_logs_select_own" ON import_logs FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "import_logs_insert_own" ON import_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_import_logs_user_id ON import_logs(user_id);

-- ============================================
-- 5. CSV マッピング設定（ユーザーカスタム）
-- ============================================
CREATE TABLE IF NOT EXISTS csv_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  format_type TEXT NOT NULL DEFAULT 'custom',
  date_column TEXT NOT NULL,
  description_column TEXT NOT NULL,
  amount_column TEXT NOT NULL,
  currency_column TEXT,
  balance_column TEXT,
  date_format TEXT DEFAULT 'YYYY-MM-DD',
  delimiter TEXT DEFAULT ',',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE csv_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "csv_mappings_select_own" ON csv_mappings FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "csv_mappings_insert_own" ON csv_mappings FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "csv_mappings_update_own" ON csv_mappings FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "csv_mappings_delete_own" ON csv_mappings FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_csv_mappings_user_id ON csv_mappings(user_id);

-- ============================================
-- 6. updated_at 自動更新トリガー
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_transactions_updated_at
  BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_csv_mappings_updated_at
  BEFORE UPDATE ON csv_mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 7. プロフィール自動作成トリガー
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
