-- Seed: デフォルト勘定科目マスタ
-- user_id = NULL はシステムプリセット（全ユーザー共通）

INSERT INTO account_categories (user_id, code, name, category_type, tax_default, sort_order) VALUES
  -- 経費 (expense)
  (NULL, 'EXP001', '通信費',       'expense', 'tax_10',         1),
  (NULL, 'EXP002', '消耗品費',     'expense', 'tax_10',         2),
  (NULL, 'EXP003', '旅費交通費',   'expense', 'tax_10',         3),
  (NULL, 'EXP004', '地代家賃',     'expense', 'tax_10',         4),
  (NULL, 'EXP005', '水道光熱費',   'expense', 'tax_10',         5),
  (NULL, 'EXP006', '新聞図書費',   'expense', 'tax_10',         6),
  (NULL, 'EXP007', '支払手数料',   'expense', 'tax_10',         7),
  (NULL, 'EXP008', '外注費',       'expense', 'tax_10',         8),
  (NULL, 'EXP009', '接待交際費',   'expense', 'tax_10',         9),
  (NULL, 'EXP010', '雑費',         'expense', 'tax_10',        10),
  (NULL, 'EXP011', '減価償却費',   'expense', 'not_applicable', 11),
  (NULL, 'EXP012', '広告宣伝費',   'expense', 'tax_10',        12),
  (NULL, 'EXP013', '租税公課',     'expense', 'not_applicable', 13),
  -- 収入 (income)
  (NULL, 'INC001', '売上高',       'income',  'tax_10',        14),
  (NULL, 'INC002', '雑収入',       'income',  'tax_10',        15),
  -- 資産 (asset)
  (NULL, 'AST001', '現金',         'asset',   'not_applicable', 16),
  (NULL, 'AST002', '普通預金',     'asset',   'not_applicable', 17),
  (NULL, 'AST003', '売掛金',       'asset',   'not_applicable', 18),
  (NULL, 'AST004', '事業主貸',     'asset',   'not_applicable', 19),
  -- 負債 (liability)
  (NULL, 'LIA001', '未払金',       'liability', 'not_applicable', 20),
  (NULL, 'LIA002', '事業主借',     'liability', 'not_applicable', 21);
