import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { env } from "~/env";
import * as schema from "./schema";
import { createPool, type Pool } from "mysql2/promise";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: Pool | undefined;
};

export const client =
  globalForDb.conn ??
  createPool({
    host: env.SINGLESTORE_HOST,
    password: env.SINGLESTORE_PASS,
    port: parseInt(env.SINGLESTORE_PORT),
    user: env.SINGLESTORE_USER,
    database: env.SINGLESTORE_DB_NAME,
    ssl: {},
    maxIdle: 0,
  });
if (env.NODE_ENV !== "production") globalForDb.conn = client;

export const db = drizzle(client, { schema });
