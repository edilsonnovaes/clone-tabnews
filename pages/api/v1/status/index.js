import { createRouter } from "next-connect";
import database from "infra/database.js";
import controller from "infra/controller.js";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.ErrorHandlers);

async function getHandler(request, response) {
  const updatedAt = new Date().toISOString();

  const resultVersion = await database.query("SHOW server_version;");
  const resultMaxConnections = await database.query("SHOW max_connections;");

  const databaseName = process.env.POSTGRES_DB;
  const resultDatabase = await database.query({
    text: "SELECT count(*)::int as connectionsOpen from pg_stat_activity where datname = $1;",
    values: [databaseName],
  });

  const version = resultVersion.rows[0].server_version;
  const maxConnections = resultMaxConnections.rows[0].max_connections;
  const connectionsOpen = resultDatabase.rows[0].connectionsopen;

  return response.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: version,
        max_connections: parseInt(maxConnections),
        connections_open: connectionsOpen,
      },
    },
  });
}
