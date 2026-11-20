import { spawn } from "node:child_process";

// The bot owns routing. Only opaque correlation IDs and message text cross the
// agent boundary; the agent's completion destination is machine configuration.
export function agentRequest(text, env = process.env) {
  const machine = env.CLOUD_BOT_AGENT_MACHINE || "";
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(machine)) throw new Error("Invalid configured agent machine");
  const requestId = env.AUX4BOT_REQUEST_ID || "";
  const conversationId = env.AUX4BOT_CONVERSATION_ID || "";
  if (!/^[a-zA-Z0-9._:-]{1,128}$/.test(requestId) || !/^[a-zA-Z0-9._:-]{1,128}$/.test(conversationId)) {
    throw new Error("Missing bot correlation identifiers");
  }
  return {
    args: ["cloud", machine, "ask", "--conversationId", conversationId],
    body: { question: text, messageId: requestId, requestId, callback: { enabled: true } }
  };
}

export async function dispatchAgent(text, env = process.env) {
  const request = agentRequest(text, env);
  if (!String(env.CLOUD_SYNC_TOKEN || "").trim()) throw new Error("Machine identity is required for agent dispatch");
  // The cloud CLI chooses CLOUD_SYNC_TOKEN. A caller bearer must never replace
  // the bot VM's own identity for this outbound machine request.
  const childEnv = { ...env };
  delete childEnv.AUX4_ACCESS_TOKEN;
  await new Promise((resolve, reject) => {
    const child = spawn("aux4", request.args, { env: childEnv, stdio: ["pipe", "ignore", "ignore"] });
    child.once("error", () => reject(new Error("Agent invocation could not start")));
    child.once("close", code => code === 0 ? resolve() : reject(new Error("Agent invocation failed")));
    child.stdin.on("error", () => {});
    child.stdin.end(JSON.stringify(request.body));
  });
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  process.stdin.resume();
  dispatchAgent(process.argv[3] || "", {...process.env, CLOUD_BOT_AGENT_MACHINE: process.argv[2] || ""}).catch(() => {
    process.stderr.write("Configured agent invocation failed\n");
    process.exitCode = 1;
  });
}
