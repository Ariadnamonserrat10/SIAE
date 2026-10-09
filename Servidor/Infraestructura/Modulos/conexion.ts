import pg, { type PoolClient, type QueryResult } from 'pg';
const {
  Pool
} = pg;
type QueryParams = Array<unknown>;
import { normalizeRows, normalizeSql, normalizeError } from './compatibilidad-sql';
class PgConnection {
  constructor(private readonly client: PoolClient | pg.Pool) {}
  async execute<T = unknown>(sql: string, params: QueryParams = []): Promise<[T, unknown[]]> {
    try {
      const result: QueryResult = await this.client.query(normalizeSql(sql), params);
      const rows = normalizeRows(result.rows || []);
      if (result.command === 'SELECT' || result.command === 'SHOW') return [rows as T, []];
      const insertId = Number((rows[0] as Record<string, unknown> | undefined)?.id || 0);
      return [{
        insertId,
        affectedRows: result.rowCount || 0
      } as T, []];
    } catch (error) {
      throw normalizeError(error);
    }
  }
  query<T = unknown>(sql: string, params: QueryParams = []) {
    return this.execute<T>(sql, params);
  }
}
let pool: pg.Pool | undefined;
let compatibilityPool: PgConnection | undefined;
function databasePool() {
  if (pool && compatibilityPool) return {
    pool,
    compatibilityPool
  };
  const config = useRuntimeConfig();
  pool = new Pool({
    host: config.databaseHost,
    port: Number(config.databasePort),
    user: config.databaseUser,
    password: config.databasePassword || undefined,
    database: config.databaseName,
    max: 10,
    ssl: String(useRuntimeConfig().databaseSslCa || '') ? {
      ca: config.databaseSslCa,
      rejectUnauthorized: true
    } : undefined
  });
  compatibilityPool = new PgConnection(pool);
  return {
    pool,
    compatibilityPool
  };
}
export function db() {
  return databasePool().compatibilityPool;
}
export async function transaction<T>(work: (connection: PgConnection) => Promise<T>) {
  const client = await databasePool().pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(new PgConnection(client));
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
