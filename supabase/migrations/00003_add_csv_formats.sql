-- Migration: Add SMBC and Rakuten CSV formats
-- 三井住友カード・楽天カードの CSV フォーマットを追加

ALTER TABLE import_logs DROP CONSTRAINT IF EXISTS import_logs_csv_format_check;
ALTER TABLE import_logs ADD CONSTRAINT import_logs_csv_format_check
  CHECK (csv_format IN ('wise', 'revolut', 'generic', 'smbc', 'rakuten'));
