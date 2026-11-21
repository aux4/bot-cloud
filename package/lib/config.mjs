import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const [botId, phoneNumberId, verifyToken, token, appSecret, apiUrl, agentMachineArg, commandArg] = process.argv.slice(2);

function configuredAgentMachine() {
  const file = process.env.CLOUD_BOT_CONFIG_FILE || "/tmp/config.yaml";
  if (!existsSync(file)) return "";
  // Use aux4's configuration reader; only the non-secret, allow-listed agent
  // target is read here. Command execution and credentials stay VM-owned.
  const result = spawnSync("aux4", ["config", "get", "--file", file, "bot/agentMachine"], {
    encoding: "utf8", timeout: 5000, stdio: ["ignore", "pipe", "pipe"]
  });
  if (result.status !== 0) throw new Error("Unable to read the bot's VM configuration");
  return String(result.stdout || "").trim();
}

const agentMachine = agentMachineArg || process.env.CLOUD_BOT_AGENT_MACHINE || configuredAgentMachine();
const configuredCommand = commandArg || process.env.CLOUD_BOT_COMMAND || "";
if (agentMachine && configuredCommand) throw new Error("Configure an agent machine or a command, not both");
if (agentMachine && !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(agentMachine)) throw new Error("Invalid configured agent machine");
const script = agentMachine ? "./agent.mjs" : "./echo.mjs";
const command = configuredCommand || `node '${new URL(script, import.meta.url).pathname}'${agentMachine ? ` ${agentMachine}` : ""}`;
const replyMode = agentMachine ? "callback" : "stdout";
process.stdout.write(JSON.stringify({
  channels: ["whatsapp"],
  bots: {
    [botId]: { channel: "whatsapp", phoneNumberId, verifyToken, token, appSecret, apiUrl, command, replyMode }
  },
  defaults: {}
}));
