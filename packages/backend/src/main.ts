import { loadConfig } from './config.js';
import { createUseCasesFactory } from './container.js';
import { buildServer } from './infrastructure/http/buildServer.js';
import { ownerFromProxyHeader } from './infrastructure/http/owner.js';
import { SqliteItemRepositoryProvider } from './infrastructure/persistence/sqlite/SqliteItemRepository.js';
import { openDatabase } from './infrastructure/persistence/sqlite/openDatabase.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const db = openDatabase(config.databasePath, { defaultOwner: config.defaultUser });
  const app = await buildServer({
    useCasesFor: createUseCasesFactory(new SqliteItemRepositoryProvider(db)),
    resolveOwner: ownerFromProxyHeader(config.defaultUser),
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
