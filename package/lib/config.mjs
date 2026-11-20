const [botId, phoneNumberId, verifyToken, token, appSecret, apiUrl, agentMachineArg, commandArg] = process.argv.slice(2);

const agentMachine = agentMachineArg || process.env.CLOUD_BOT_AGENT_MACHINE || "";
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
