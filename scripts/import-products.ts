/**
 * Imports supplier CSV files into the product library.
 *
 *   pnpm import:products path/to/Clarius.csv path/to/NoviFlora.csv
 *
 * Uses NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY from .env.local (or the environment),
 * so it can target local or hosted Supabase. Safe to re-run: products are upserted.
 */
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";
import { parseSupplierCsv } from "../src/features/products/import/supplier-csv";
import { importProducts } from "../src/features/products/import/run-import";

config({ path: ".env.local", quiet: true });

async function main() {
  const files = process.argv.slice(2);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (files.length === 0 || !url || !key) {
    console.error(
      "Usage: pnpm import:products <file.csv> [...]  (needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY)",
    );
    process.exit(1);
  }

  const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });

  for (const file of files) {
    const parsed = parseSupplierCsv(readFileSync(file, "utf8"));
    console.log(
      `${basename(file)}: ${parsed.rowsRead} rows, ${parsed.products.length} products, ` +
        `${parsed.duplicates} duplicates, ${parsed.problems.length} problems`,
    );
    for (const problem of parsed.problems.slice(0, 20)) {
      console.log(`  line ${problem.line}: ${problem.message}`);
    }
    for (const [group, count] of Object.entries(parsed.unknownGroups)) {
      console.log(`  skipped ${count} rows with unknown product group ${group}`);
    }
    const outcome = await importProducts(supabase, parsed.products, (done, total) => {
      process.stdout.write(`\r  imported ${done}/${total}`);
    });
    console.log(`\n  created ${outcome.created}, updated ${outcome.updated}, images added ${outcome.imagesAdded}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
