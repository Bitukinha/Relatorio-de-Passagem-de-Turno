import { neon } from "@neondatabase/serverless";

function createSql() {
  const url = process.env["DATABASE_URL"];
  if (!url) {
    throw new Error(
      "Missing DATABASE_URL environment variable. Add your Neon connection string to .env.",
    );
  }
  return neon(url);
}

let _sql: ReturnType<typeof createSql> | undefined;

export function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  if (!_sql) _sql = createSql();
  return _sql(strings, ...values);
}
