-- 事業按分率カラムを追加（0-100の整数、デフォルト100=全額事業経費）
ALTER TABLE transactions ADD COLUMN business_use_ratio INTEGER NOT NULL DEFAULT 100
  CHECK (business_use_ratio >= 0 AND business_use_ratio <= 100);
