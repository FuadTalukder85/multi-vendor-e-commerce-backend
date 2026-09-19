import { Client } from "pg";
import { envVars } from "../src/app/config/env";

async function applyIndexes() {
  console.log("Connecting to database...");
  const client = new Client({
    connectionString: envVars.DATABASE_URL,
  });

  await client.connect();
  console.log("Connected successfully.");

  // Statements to create pg_trgm extension and GIN indexes
  const statements = [
    { name: "pg_trgm extension", sql: "CREATE EXTENSION IF NOT EXISTS pg_trgm;" },
    { name: "idx_products_title_trgm", sql: "CREATE INDEX IF NOT EXISTS idx_products_title_trgm ON products USING gin (title gin_trgm_ops);" },
    { name: "idx_products_brand_trgm", sql: "CREATE INDEX IF NOT EXISTS idx_products_brand_trgm ON products USING gin (brand gin_trgm_ops);" },
    { name: "idx_products_description_trgm", sql: "CREATE INDEX IF NOT EXISTS idx_products_description_trgm ON products USING gin (description gin_trgm_ops);" },
    { name: "idx_products_tags_gin", sql: "CREATE INDEX IF NOT EXISTS idx_products_tags_gin ON products USING gin (tags);" },
    { name: "idx_product_variants_sku_trgm", sql: "CREATE INDEX IF NOT EXISTS idx_product_variants_sku_trgm ON product_variants USING gin (sku gin_trgm_ops);" },
  ];

  for (const { name, sql } of statements) {
    console.log(`Applying [${name}]...`);
    try {
      await client.query(sql);
      console.log(`  -> SUCCESS: ${name}`);
    } catch (err: any) {
      console.error(`  -> ERROR on ${name}: ${err.message}`);
    }
  }

  await client.end();
  console.log("All search indexes processed successfully.");
}

applyIndexes().catch((err) => {
  console.error("Fatal error applying indexes:", err);
  process.exit(1);
});
