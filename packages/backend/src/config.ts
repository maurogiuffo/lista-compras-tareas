export interface Config {
  readonly host: string;
  readonly port: number;
  readonly databasePath: string;
  readonly corsOrigin: string | null;
  readonly logLevel: string;
}

/** Lee la configuración de variables de entorno, con valores por defecto para desarrollo. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port <= 0) throw new Error(`PORT inválido: ${env.PORT}`);
  return {
    host: env.HOST ?? '0.0.0.0',
    port,
    databasePath: env.DATABASE_PATH ?? './data/lista-compras.sqlite',
    corsOrigin: env.CORS_ORIGIN ?? null,
    logLevel: env.LOG_LEVEL ?? 'info',
  };
}
