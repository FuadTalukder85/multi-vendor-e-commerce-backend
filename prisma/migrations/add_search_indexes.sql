-- ============================================================================
-- GIN Trigram Indexes for Product Search Performance
-- ============================================================================
-- Enables fast ILIKE '%term%' searches across all product list endpoints:
--   - getAllProductsPublic  (productSearchableFields)
--   - getMyVendorProducts  (productSearchableFields)
--   - getAllProductsAdmin   (adminProductSearchableFields)
--
-- Without these indexes, ILIKE with a leading wildcard forces a full sequential
-- scan on every search query. At 1M+ rows this takes 2-10 seconds.
-- With GIN trigram indexes, the same queries resolve in 5-50ms.
-- ============================================================================

-- 1. Enable pg_trgm extension (required for gin_trgm_ops)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Products table — text fields used in search
--    Used by: adminProductSearchableFields (title, brand)
--             productSearchableFields (title, description, brand, slug)

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_title_trgm
  ON products USING gin (title gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_brand_trgm
  ON products USING gin (brand gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_description_trgm
  ON products USING gin (description gin_trgm_ops);

-- 3. Products table — tags array field (used with 'has' operator in search)
--    Used by: productSearchableFields (tags)

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_tags_gin
  ON products USING gin (tags);

-- 4. Product variants table — SKU field (used in correlated subquery search)
--    Used by: productSearchableFields (variants.sku)
--    Search generates: WHERE EXISTS (SELECT 1 FROM product_variants WHERE sku ILIKE '%term%')

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_variants_sku_trgm
  ON product_variants USING gin (sku gin_trgm_ops);
