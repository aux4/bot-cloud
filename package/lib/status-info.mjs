const e = process.env;
console.log(JSON.stringify({machine:e.AUX4_CLOUD_MACHINE || "", capabilities:(e.AUX4_CLOUD_CAPABILITIES || "").split(",").filter(Boolean), databaseUrl:e.TURSO_DATABASE_URL || "", databaseTokenLength:(e.TURSO_AUTH_TOKEN || "").length}));
