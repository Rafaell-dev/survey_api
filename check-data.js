const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5416/survey_db?schema=public"
  });
  await client.connect();

  const res = await client.query('SELECT count(*) FROM "User";');
  console.log("USER COUNT:", res.rows[0].count);

  await client.end();
}

main().catch(console.error);
