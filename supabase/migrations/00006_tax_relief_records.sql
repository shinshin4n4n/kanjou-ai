-- Migration: 控除記録テーブル (Tax Relief Records)
-- Issue #154: 個人控除トラッカー

-- 1. テーブル作成
CREATE TABLE tax_relief_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  relief_code TEXT NOT NULL,
  assessment_year TEXT NOT NULL,
  amount INT NOT NULL CHECK (amount > 0),
  description TEXT,
  receipt_date DATE NOT NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT tax_relief_records_year_check CHECK (assessment_year IN ('2024', '2025'))
);

-- 2. インデックス
CREATE INDEX idx_tax_relief_records_user_year
  ON tax_relief_records (user_id, assessment_year)
  WHERE deleted_at IS NULL;

-- 3. RLS 有効化
ALTER TABLE tax_relief_records ENABLE ROW LEVEL SECURITY;

-- 4. RLS ポリシー
CREATE POLICY "tax_relief_records_select_own"
  ON tax_relief_records FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "tax_relief_records_insert_own"
  ON tax_relief_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tax_relief_records_update_own"
  ON tax_relief_records FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- 5. updated_at 自動更新トリガー
CREATE TRIGGER update_tax_relief_records_updated_at
  BEFORE UPDATE ON tax_relief_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
