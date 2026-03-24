-- Migration: Malaysia Form B 対応の勘定科目マスタに置換
-- Issue #148
--
-- NOTE: この移行により既存コード（EXP001-013等）のセマンティクスが変わります。
-- 例: 旧 EXP003=旅費交通費 → 新 EXP003=Office Rent
-- 本番データがある場合は、事前にトランザクションデータの移行計画を策定してください。
-- 既存データのマイグレーションスクリプトは後続PRで対応予定。

-- 1. CHECK制約に 'capital' を追加
ALTER TABLE account_categories DROP CONSTRAINT IF EXISTS account_categories_category_type_check;
ALTER TABLE account_categories ADD CONSTRAINT account_categories_category_type_check
  CHECK (category_type IN ('expense', 'income', 'asset', 'liability', 'capital'));

-- 2. 旧システムプリセットを削除
DELETE FROM account_categories WHERE user_id IS NULL;

-- 3. Malaysia Form B 対応カテゴリを挿入
INSERT INTO account_categories (user_id, code, name, category_type, tax_default, sort_order) VALUES
  -- Income (Form B)
  (NULL, 'INC001', 'IT Services (Domestic)',      'income',    'not_applicable',  1),
  (NULL, 'INC002', 'IT Services (Overseas)',       'income',    'not_applicable',  2),
  (NULL, 'INC003', 'Software Licenses/Royalties',  'income',    'not_applicable',  3),
  (NULL, 'INC004', 'Salary/Director Fee',          'income',    'not_applicable',  4),
  (NULL, 'INC005', 'Interest Income',              'income',    'not_applicable',  5),
  (NULL, 'INC006', 'Dividend Income',              'income',    'tax_exempt',      6),
  (NULL, 'INC007', 'Rental Income',                'income',    'not_applicable',  7),
  -- Expense (Section 33)
  (NULL, 'EXP001', 'Software/Cloud/SaaS',          'expense',   'not_applicable',  8),
  (NULL, 'EXP002', 'Telecommunication',            'expense',   'not_applicable',  9),
  (NULL, 'EXP003', 'Office Rent',                  'expense',   'not_applicable', 10),
  (NULL, 'EXP004', 'Utilities',                    'expense',   'not_applicable', 11),
  (NULL, 'EXP005', 'Travel (Business)',            'expense',   'not_applicable', 12),
  (NULL, 'EXP006', 'Professional Fees',            'expense',   'not_applicable', 13),
  (NULL, 'EXP007', 'Training/Upskilling',          'expense',   'not_applicable', 14),
  (NULL, 'EXP008', 'Entertainment',                'expense',   'not_applicable', 15),
  (NULL, 'EXP009', 'Insurance (Business)',          'expense',   'not_applicable', 16),
  (NULL, 'EXP010', 'Office Supplies',              'expense',   'not_applicable', 17),
  (NULL, 'EXP011', 'Depreciation',                 'expense',   'not_applicable', 18),
  (NULL, 'EXP012', 'Marketing/Advertising',        'expense',   'not_applicable', 19),
  (NULL, 'EXP013', 'Miscellaneous Expense',        'expense',   'not_applicable', 20),
  -- Capital Expenditure (Schedule 3)
  (NULL, 'CAP001', 'ICT Equipment',                'capital',   'not_applicable', 21),
  (NULL, 'CAP002', 'Small Assets (<RM2000)',        'capital',   'not_applicable', 22),
  (NULL, 'CAP003', 'Furniture/Fittings',            'capital',   'not_applicable', 23),
  (NULL, 'CAP004', 'Motor Vehicle',                 'capital',   'not_applicable', 24),
  (NULL, 'CAP005', 'Software License (Capital)',    'capital',   'not_applicable', 25),
  -- Asset
  (NULL, 'AST001', 'Cash',                         'asset',     'not_applicable', 26),
  (NULL, 'AST002', 'Bank Account',                 'asset',     'not_applicable', 27),
  (NULL, 'AST003', 'Accounts Receivable',           'asset',     'not_applicable', 28),
  (NULL, 'AST004', 'Owner''s Drawings',             'asset',     'not_applicable', 29),
  -- Liability
  (NULL, 'LIA001', 'Accounts Payable',              'liability', 'not_applicable', 30),
  (NULL, 'LIA002', 'Owner''s Capital Injection',    'liability', 'not_applicable', 31);
