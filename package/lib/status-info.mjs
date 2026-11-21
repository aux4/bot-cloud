import fs from "node:fs";
import { configuredAgentMachine } from "./agent-config.mjs";
const e = process.env;
const agentMachine = configuredAgentMachine();
const read = path => { try { return fs.readFileSync(path, "utf8").trim(); } catch { return ""; } };
const capabilityLog = read("/tmp/capability-log").split("\n").filter(line => /^\[capabilities\] [a-z:]+: (credentials (cached|issued) \(expire [0-9TZ:.-]+\)|credential exchange failed \(HTTP [0-9]+\)|skipped: verified caller required)$/.test(line));
let exchangeProbe;
if (!e.TURSO_DATABASE_URL && e.CLOUD_SYNC_TOKEN && e.AUX4_CLOUD_API_URL && e.AUX4_CLOUD_SCOPE) {
  try {
    const response = await fetch(`${e.AUX4_CLOUD_API_URL}/v1/${encodeURIComponent(e.AUX4_CLOUD_SCOPE)}/capabilities/turso:database/credentials`, {method:"POST", headers:{"X-Api-Key":e.CLOUD_SYNC_TOKEN,"Content-Type":"application/json"},body:"{}",signal:AbortSignal.timeout(25000)});
    const result = await response.json();
    const known = ["Failed to read the turso platform credential", "The turso platform credential is not configured", "Failed to provision the turso database for this scope", "Failed to issue a turso database token", "Forbidden", "Machine authentication required"];
    exchangeProbe = {status:response.status, error:known.includes(result.error) ? result.error : undefined, databaseTokenLength:(result.env?.TURSO_AUTH_TOKEN || "").length};
  } catch { exchangeProbe = {error:"Capability probe unavailable"}; }
}
console.log(JSON.stringify({agentMachine, replyMode:agentMachine ? "callback" : "stdout", machine:e.AUX4_CLOUD_MACHINE || "", capabilities:(e.AUX4_CLOUD_CAPABILITIES || "").split(",").filter(Boolean), databaseUrl:e.TURSO_DATABASE_URL || "", databaseTokenLength:(e.TURSO_AUTH_TOKEN || "").length, capabilityDiagnostics:{exchangeProbe,apiUrl:e.AUX4_CLOUD_API_URL || "", machineKeyLength:(e.CLOUD_SYNC_TOKEN || "").length, resolverPresent:fs.existsSync("/var/task/aux4/resolve-capabilities.sh"), principalStatus:["ok","none","invalid"].includes(read("/tmp/principal-status")) ? read("/tmp/principal-status") : "unknown", log:capabilityLog}}));
