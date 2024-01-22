import physical from "express-physical";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import log4js from "log4js";

const log = log4js.getLogger("postgresCheck");

export function postgresSimpleQueryCheck(dal: DataAccessLayer) {
  return async (done: any) => {
    const check: any = {
      name: "@gram/api-postgres",
      actionable: true,
      healthy: true,
      dependentOn: "postgres",
      type: physical.type.INFRASTRUCTURE,
    };

    try {
      await dal.pool.query("SELECT 1;");
    } catch (error: any) {
      log.error(error);
      check.healthy = false;
      check.message =
        "Postgres went down. Please check error log for more info";
      check.severity = physical.severity.CRITICAL;
    }

    done(physical.response(check));
  };
}

// export function postgresAvailableConnectionsCheck(dal: DataAccessLayer) {
//   return async (done: any) => {
//     const check: any = {
//       name: "@gram/api-postgres-available-connections",
//       actionable: true,
//       healthy: dal.pool._pool.waitingCount === 0,
//       dependentOn: "postgres",
//       type: physical.type.INFRASTRUCTURE,
//       severity:
//         dal.pool._pool.waitingCount === 0
//           ? undefined
//           : physical.severity.WARNING,
//       message:
//         dal.pool._pool.waitingCount === 0
//           ? undefined
//           : "The internal Postgres connection pool has been exhausted and clients are waiting. This means that queries are left hanging",
//     };

//     done(physical.response(check));
//   };
// }
