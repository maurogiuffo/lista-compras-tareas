import { loadConfig } from './config.js';
import { createUseCases } from './container.js';
import { buildServer } from './infrastructure/http/buildServer.js';
import { SqliteItemRepository } from './infrastructure/persistence/sqlite/SqliteItemRepository.js';
import { openDatabase } from './infrastructure/persistence/sqlite/openDatabase.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const db = openDatabase(config.databasePath);
  const useCases = createUseCases({ repository: new SqliteItemRepository(db) });
  const app = await buildServer({
    useCases,
    logger: { level: config.logLevel },
    corsOrigin: config.corsOrigin,
  });

  const shutdown = async (signal: string) => {
    app.log.info(`Recibido ${signal}, cerrando...`);
    await app.close();
    db.close();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await app.listen({ host: config.host, port: config.port });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
