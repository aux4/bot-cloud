import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

// This is a privileged command boundary. Never resolve its provider, database,
// credential, or bot configuration from RPC parameters supplied by the agent.
export function completionArgs(env = process.env) {
  const token = env.WHATSAPP_TOKEN || "";
  if (!token) throw new Error("WhatsApp credential binding is unavailable");
  const botId = env.CLOUD_BOT_ID || "whatsapp-bot";
  const apiUrl = "https://graph.facebook.com";
  const bots = { [botId]: {
    channel: "whatsapp", phoneNumberId: env.CLOUD_BOT_PHONE_NUMBER_ID || "1450110568185980",
    token, apiUrl, replyMode: "callback"
  } };
  return ["bot", "complete", "--channels", '["whatsapp"]', "--bots", JSON.stringify(bots), "--defaults", "{}", "--db", "cloud"];
}

export async function complete(input, env = process.env) {
  const args = completionArgs(env);
  return new Promise((resolve, reject) => {
    const child = spawn("aux4", args, { env, stdio: ["pipe", "pipe", "ignore"] });
    let output = "";
    child.stdout.on("data", chunk => { output = (output + chunk).slice(-65536); });
    child.once("error", () => reject(new Error("Bot completion could not start")));
    child.once("close", code => code === 0 ? resolve(output) : reject(new Error("Bot completion was rejected")));
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
    if (Buffer.byteLength(input) > 262144) throw new Error("Completion payload is too large");
  }
  complete(input).then(output => process.stdout.write(output)).catch(() => {
    process.stderr.write("Bot completion was rejected\n"); process.exitCode = 1;
  });
}
