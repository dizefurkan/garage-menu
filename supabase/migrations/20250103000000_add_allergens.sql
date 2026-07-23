-- ============================================================================
-- ALLERGENS FEATURE - DATABASE SCHEMA MIGRATION
-- ============================================================================
-- Adds the 14 EU-regulated allergens (Regulation EU No 1169/2011, Annex II)
-- as global reference data with translations, a product<->allergen join table,
-- and an explicit "contains no allergens" flag on products so that missing
-- allergen info can be distinguished from confirmed allergen-free products.
--
-- Apply manually via the Supabase SQL Editor. Idempotent - safe to re-run.
-- ============================================================================

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- Global allergen reference table (NOT tenant-scoped - fixed EU list)
CREATE TABLE IF NOT EXISTS public.allergens (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  code VARCHAR(30) NOT NULL UNIQUE,        -- 'gluten', 'crustaceans', ...
  emoji VARCHAR(10) NOT NULL,
  display_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.allergen_translations (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  allergen_id BIGINT NOT NULL REFERENCES public.allergens(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL CHECK (language_code ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  name VARCHAR(255) NOT NULL,
  UNIQUE(allergen_id, language_code)
);

CREATE TABLE IF NOT EXISTS public.product_allergens (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  allergen_id BIGINT NOT NULL REFERENCES public.allergens(id) ON DELETE CASCADE,
  UNIQUE(product_id, allergen_id)
);

CREATE INDEX IF NOT EXISTS idx_product_allergens_product
  ON public.product_allergens(product_id);
CREATE INDEX IF NOT EXISTS idx_allergen_translations_allergen
  ON public.allergen_translations(allergen_id);

-- Explicit allergen-free confirmation. A product's allergen info is complete
-- when it has product_allergens rows OR this flag is true; neither = missing.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS contains_no_allergens BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allergen_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_allergens ENABLE ROW LEVEL SECURITY;

-- Allergens are global read-only reference data: anyone can read,
-- only the service role can write (no user-facing write path exists).
DROP POLICY IF EXISTS "Anyone can read allergens" ON public.allergens;
CREATE POLICY "Anyone can read allergens"
  ON public.allergens FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Ops: Allow service role full access" ON public.allergens;
CREATE POLICY "Ops: Allow service role full access"
  ON public.allergens FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Anyone can read allergen translations" ON public.allergen_translations;
CREATE POLICY "Anyone can read allergen translations"
  ON public.allergen_translations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Ops: Allow service role full access" ON public.allergen_translations;
CREATE POLICY "Ops: Allow service role full access"
  ON public.allergen_translations FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- product_allergens: tenant scope derived through the parent product
DROP POLICY IF EXISTS "Users can select product allergens" ON public.product_allergens;
CREATE POLICY "Users can select product allergens"
  ON public.product_allergens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND p.tenant_id = public.user_tenant_id()
    )
  );

DROP POLICY IF EXISTS "Editors can manage product allergens" ON public.product_allergens;
CREATE POLICY "Editors can manage product allergens"
  ON public.product_allergens FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND p.tenant_id = public.user_tenant_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE tenant_id = public.user_tenant_id()
        AND user_id = auth.uid()
        AND role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND p.tenant_id = public.user_tenant_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE tenant_id = public.user_tenant_id()
        AND user_id = auth.uid()
        AND role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "Ops: Allow service role full access" ON public.product_allergens;
CREATE POLICY "Ops: Allow service role full access"
  ON public.product_allergens FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 3. SEED: THE 14 EU-REGULATED ALLERGENS (Annex II, Reg. EU 1169/2011)
-- ============================================================================

INSERT INTO public.allergens (code, emoji, display_order) VALUES
  ('gluten',      '🌾', 1),
  ('crustaceans', '🦐', 2),
  ('eggs',        '🥚', 3),
  ('fish',        '🐟', 4),
  ('peanuts',     '🥜', 5),
  ('soybeans',    '🫘', 6),
  ('milk',        '🥛', 7),
  ('nuts',        '🌰', 8),
  ('celery',      '🥬', 9),
  ('mustard',     '🟡', 10),
  ('sesame',      '🫓', 11),
  ('sulphites',   '🍷', 12),
  ('lupin',       '🌸', 13),
  ('molluscs',    '🦪', 14)
ON CONFLICT (code) DO NOTHING;

-- Translations in all 11 supported tenant languages, using the official EU
-- allergen names from the regulation's language versions.
INSERT INTO public.allergen_translations (allergen_id, language_code, name)
SELECT a.id, v.lang, v.name
FROM (VALUES
  -- English
  ('gluten',      'en', 'Cereals containing gluten'),
  ('crustaceans', 'en', 'Crustaceans'),
  ('eggs',        'en', 'Eggs'),
  ('fish',        'en', 'Fish'),
  ('peanuts',     'en', 'Peanuts'),
  ('soybeans',    'en', 'Soybeans'),
  ('milk',        'en', 'Milk'),
  ('nuts',        'en', 'Tree nuts'),
  ('celery',      'en', 'Celery'),
  ('mustard',     'en', 'Mustard'),
  ('sesame',      'en', 'Sesame seeds'),
  ('sulphites',   'en', 'Sulphur dioxide and sulphites'),
  ('lupin',       'en', 'Lupin'),
  ('molluscs',    'en', 'Molluscs'),
  -- Turkish
  ('gluten',      'tr', 'Gluten içeren tahıllar'),
  ('crustaceans', 'tr', 'Kabuklular'),
  ('eggs',        'tr', 'Yumurta'),
  ('fish',        'tr', 'Balık'),
  ('peanuts',     'tr', 'Yer fıstığı'),
  ('soybeans',    'tr', 'Soya fasulyesi'),
  ('milk',        'tr', 'Süt'),
  ('nuts',        'tr', 'Sert kabuklu meyveler'),
  ('celery',      'tr', 'Kereviz'),
  ('mustard',     'tr', 'Hardal'),
  ('sesame',      'tr', 'Susam'),
  ('sulphites',   'tr', 'Kükürt dioksit ve sülfitler'),
  ('lupin',       'tr', 'Acı bakla (lüpen)'),
  ('molluscs',    'tr', 'Yumuşakçalar'),
  -- German
  ('gluten',      'de', 'Glutenhaltiges Getreide'),
  ('crustaceans', 'de', 'Krebstiere'),
  ('eggs',        'de', 'Eier'),
  ('fish',        'de', 'Fisch'),
  ('peanuts',     'de', 'Erdnüsse'),
  ('soybeans',    'de', 'Sojabohnen'),
  ('milk',        'de', 'Milch'),
  ('nuts',        'de', 'Schalenfrüchte (Nüsse)'),
  ('celery',      'de', 'Sellerie'),
  ('mustard',     'de', 'Senf'),
  ('sesame',      'de', 'Sesamsamen'),
  ('sulphites',   'de', 'Schwefeldioxid und Sulfite'),
  ('lupin',       'de', 'Lupinen'),
  ('molluscs',    'de', 'Weichtiere'),
  -- French
  ('gluten',      'fr', 'Céréales contenant du gluten'),
  ('crustaceans', 'fr', 'Crustacés'),
  ('eggs',        'fr', 'Œufs'),
  ('fish',        'fr', 'Poissons'),
  ('peanuts',     'fr', 'Arachides'),
  ('soybeans',    'fr', 'Soja'),
  ('milk',        'fr', 'Lait'),
  ('nuts',        'fr', 'Fruits à coque'),
  ('celery',      'fr', 'Céleri'),
  ('mustard',     'fr', 'Moutarde'),
  ('sesame',      'fr', 'Graines de sésame'),
  ('sulphites',   'fr', 'Anhydride sulfureux et sulfites'),
  ('lupin',       'fr', 'Lupin'),
  ('molluscs',    'fr', 'Mollusques'),
  -- Spanish
  ('gluten',      'es', 'Cereales que contienen gluten'),
  ('crustaceans', 'es', 'Crustáceos'),
  ('eggs',        'es', 'Huevos'),
  ('fish',        'es', 'Pescado'),
  ('peanuts',     'es', 'Cacahuetes'),
  ('soybeans',    'es', 'Soja'),
  ('milk',        'es', 'Leche'),
  ('nuts',        'es', 'Frutos de cáscara'),
  ('celery',      'es', 'Apio'),
  ('mustard',     'es', 'Mostaza'),
  ('sesame',      'es', 'Granos de sésamo'),
  ('sulphites',   'es', 'Dióxido de azufre y sulfitos'),
  ('lupin',       'es', 'Altramuces'),
  ('molluscs',    'es', 'Moluscos'),
  -- Italian
  ('gluten',      'it', 'Cereali contenenti glutine'),
  ('crustaceans', 'it', 'Crostacei'),
  ('eggs',        'it', 'Uova'),
  ('fish',        'it', 'Pesce'),
  ('peanuts',     'it', 'Arachidi'),
  ('soybeans',    'it', 'Soia'),
  ('milk',        'it', 'Latte'),
  ('nuts',        'it', 'Frutta a guscio'),
  ('celery',      'it', 'Sedano'),
  ('mustard',     'it', 'Senape'),
  ('sesame',      'it', 'Semi di sesamo'),
  ('sulphites',   'it', 'Anidride solforosa e solfiti'),
  ('lupin',       'it', 'Lupini'),
  ('molluscs',    'it', 'Molluschi'),
  -- Portuguese
  ('gluten',      'pt', 'Cereais que contêm glúten'),
  ('crustaceans', 'pt', 'Crustáceos'),
  ('eggs',        'pt', 'Ovos'),
  ('fish',        'pt', 'Peixes'),
  ('peanuts',     'pt', 'Amendoins'),
  ('soybeans',    'pt', 'Soja'),
  ('milk',        'pt', 'Leite'),
  ('nuts',        'pt', 'Frutos de casca rija'),
  ('celery',      'pt', 'Aipo'),
  ('mustard',     'pt', 'Mostarda'),
  ('sesame',      'pt', 'Sementes de sésamo'),
  ('sulphites',   'pt', 'Dióxido de enxofre e sulfitos'),
  ('lupin',       'pt', 'Tremoço'),
  ('molluscs',    'pt', 'Moluscos'),
  -- Japanese
  ('gluten',      'ja', 'グルテンを含む穀物'),
  ('crustaceans', 'ja', '甲殻類'),
  ('eggs',        'ja', '卵'),
  ('fish',        'ja', '魚'),
  ('peanuts',     'ja', 'ピーナッツ（落花生）'),
  ('soybeans',    'ja', '大豆'),
  ('milk',        'ja', '乳'),
  ('nuts',        'ja', 'ナッツ類'),
  ('celery',      'ja', 'セロリ'),
  ('mustard',     'ja', 'マスタード'),
  ('sesame',      'ja', 'ごま'),
  ('sulphites',   'ja', '二酸化硫黄・亜硫酸塩'),
  ('lupin',       'ja', 'ルピナス'),
  ('molluscs',    'ja', '軟体動物'),
  -- Chinese (Simplified)
  ('gluten',      'zh', '含麸质谷物'),
  ('crustaceans', 'zh', '甲壳类'),
  ('eggs',        'zh', '蛋类'),
  ('fish',        'zh', '鱼类'),
  ('peanuts',     'zh', '花生'),
  ('soybeans',    'zh', '大豆'),
  ('milk',        'zh', '牛奶'),
  ('nuts',        'zh', '坚果'),
  ('celery',      'zh', '芹菜'),
  ('mustard',     'zh', '芥末'),
  ('sesame',      'zh', '芝麻'),
  ('sulphites',   'zh', '二氧化硫和亚硫酸盐'),
  ('lupin',       'zh', '羽扇豆'),
  ('molluscs',    'zh', '软体动物'),
  -- Russian
  ('gluten',      'ru', 'Злаки, содержащие глютен'),
  ('crustaceans', 'ru', 'Ракообразные'),
  ('eggs',        'ru', 'Яйца'),
  ('fish',        'ru', 'Рыба'),
  ('peanuts',     'ru', 'Арахис'),
  ('soybeans',    'ru', 'Соя'),
  ('milk',        'ru', 'Молоко'),
  ('nuts',        'ru', 'Орехи'),
  ('celery',      'ru', 'Сельдерей'),
  ('mustard',     'ru', 'Горчица'),
  ('sesame',      'ru', 'Кунжут'),
  ('sulphites',   'ru', 'Диоксид серы и сульфиты'),
  ('lupin',       'ru', 'Люпин'),
  ('molluscs',    'ru', 'Моллюски'),
  -- Arabic
  ('gluten',      'ar', 'حبوب تحتوي على الغلوتين'),
  ('crustaceans', 'ar', 'قشريات'),
  ('eggs',        'ar', 'بيض'),
  ('fish',        'ar', 'سمك'),
  ('peanuts',     'ar', 'فول سوداني'),
  ('soybeans',    'ar', 'فول الصويا'),
  ('milk',        'ar', 'حليب'),
  ('nuts',        'ar', 'مكسرات'),
  ('celery',      'ar', 'كرفس'),
  ('mustard',     'ar', 'خردل'),
  ('sesame',      'ar', 'سمسم'),
  ('sulphites',   'ar', 'ثاني أكسيد الكبريت والسلفيت'),
  ('lupin',       'ar', 'ترمس'),
  ('molluscs',    'ar', 'رخويات')
) AS v(code, lang, name)
JOIN public.allergens a ON a.code = v.code
ON CONFLICT (allergen_id, language_code) DO NOTHING;

-- ============================================================================
-- 4. MIGRATION LOG
-- ============================================================================

INSERT INTO public.migration_log (migration_name, version)
VALUES ('003_add_allergens', 1)
ON CONFLICT (migration_name) DO UPDATE
SET applied_at = NOW(), version = migration_log.version + 1;
