require('dotenv/config');

const {
  applyPendingMigrations,
  createTursoClient,
} = require('./turso-database');

async function main() {
  const client = createTursoClient();

  try {
    await applyPendingMigrations(client);
  } finally {
    client.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
