import fs from "node:fs";
const e = process.env;
const read = path => { try { return fs.readFileSync(path, "utf8").trim(); } catch { return ""; } };
const capabilityLog = read("/tmp/capability-log").split("\n").filter(line => /^\[capabilities\] [a-z:]+: (credentials (cached|issued) \(expire [0-9TZ:.-]+\)|credential exchange failed \(HTTP [0-9]+\)|skipped: verified caller required)$/.test(line));
console.log(JSON.stringify({machine:e.AUX4_CLOUD_MACHINE || "", capabilities:(e.AUX4_CLOUD_CAPABILITIES || "").split(",").filter(Boolean), databaseUrl:e.TURSO_DATABASE_URL || "", databaseTokenLength:(e.TURSO_AUTH_TOKEN || "").length, capabilityDiagnostics:{apiUrl:e.AUX4_CLOUD_API_URL || "", machineKeyLength:(e.CLOUD_SYNC_TOKEN || "").length, resolverPresent:fs.existsSync("/var/task/aux4/resolve-capabilities.sh"), principalStatus:["ok","none","invalid"].includes(read("/tmp/principal-status")) ? read("/tmp/principal-status") : "unknown", log:capabilityLog}}));
