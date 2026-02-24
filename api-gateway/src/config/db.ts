import knex, { Knex } from "knex";
import path from "path";
import { config } from "./env";

/**
 * Knex Database Instance.
 * Configured for PostgreSQL with a connection pool and absolute migration paths.
 */
const db: Knex = knex({
  client: "pg",
  connection: config.DATABASE_URL,
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 2000,
  },
  migrations: {
    // Use absolute path to ensure migrations work regardless of working directory
    directory: path.join(__dirname, "../../database/migrations"),
  },
});

export default db;
