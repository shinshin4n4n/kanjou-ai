-- Migration: Classification Rules
-- ユーザーごとの AI 仕訳推定指示ルール

CREATE TABLE IF NOT EXISTS classification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  instruction TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE classification_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classification_rules_select_own" ON classification_rules FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "classification_rules_insert_own" ON classification_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "classification_rules_delete_own" ON classification_rules FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_classification_rules_user_id ON classification_rules(user_id);
