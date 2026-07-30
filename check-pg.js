const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5416/survey_db?schema=public"
  });

  await client.connect();

  const res = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);

  console.log("TABLES IN DB:");
  res.rows.forEach(r => console.log(r.table_name));

  await client.end();
}

main().catch(console.error);
