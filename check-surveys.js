const { Client } = require('pg');
async function main() {
  const client = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5416/survey_db?schema=public" });
  await client.connect();
  const res = await client.query('SELECT count(*) FROM "Survey";');
  console.log("SURVEY COUNT:", res.rows[0].count);
  await client.end();
}
main().catch(console.error);
