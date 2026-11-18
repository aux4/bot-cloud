import { spawn } from "node:child_process";

const [botId, phoneNumberId, verifyToken, token, appSecret, apiUrl, db, tmpDir, queue, dedupeTtl] = process.argv.slice(2);

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on("data", chunk => chunks.push(chunk));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    process.stdin.on("error", reject);
  });
}

function runAux4(args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn("aux4", args, { stdio: ["pipe", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", chunk => stdout.push(chunk));
    child.stderr.on("data", chunk => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", code => {
      const result = {
        code,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8")
      };
      if (code === 0) resolve(result);
      else reject(Object.assign(new Error(`aux4 command exited ${code}`), { result }));
    });
    child.stdin.end(input || "");
  });
}

const input = await readStdin();
let envelope;
try {
  const parsed = JSON.parse(input || "{}");
  envelope = parsed && typeof parsed === "object" && Object.prototype.hasOwnProperty.call(parsed, "rawBody")
    ? parsed
    : {
        method: "POST",
        headers: {},
        queryStringParameters: {},
        pathParameters: { channel: "whatsapp", bot: botId },
        rawBody: input,
        body: input
      };
} catch {
  envelope = {
    method: "POST",
    headers: {},
    queryStringParameters: {},
    pathParameters: { channel: "whatsapp", bot: botId },
    rawBody: input,
    body: input
  };
}
const bot = {
  channel: "whatsapp",
  phoneNumberId,
  verifyToken,
  token,
  appSecret,
  apiUrl,
  command: `node ${new URL("./echo.mjs", import.meta.url).pathname}`
};
const channels = JSON.stringify(["whatsapp"]);
const bots = JSON.stringify({ [botId]: bot });
const defaults = JSON.stringify({});

const common = [
  "--channels", channels,
  "--bots", bots,
  "--defaults", defaults,
  "--db", db,
  "--dedupeTtl", dedupeTtl
];

function parseOutput(stdout) {
  try {
    return JSON.parse(stdout.trim());
  } catch {
    return null;
  }
}

function messageCount(rawBody) {
  try {
    const payload = JSON.parse(rawBody || "{}");
    return (payload.entry || []).reduce((total, entry) =>
      total + (entry.changes || []).reduce((changeTotal, change) =>
        changeTotal + (change.value?.messages?.length || 0), 0), 0);
  } catch {
    return 0;
  }
}

try {
  const ingest = await runAux4(["bot", "ingest", ...common, "--queue", queue], JSON.stringify(envelope));
  const ingestResult = parseOutput(ingest.stdout);
  if (ingestResult && Number(ingestResult.statusCode || 200) >= 400) {
    throw new Error("webhook rejected");
  }
  const count = messageCount(envelope.rawBody);
  for (let index = 0; index < count; index += 1) {
    const work = await runAux4(["bot", "work", "--mode", "pull", ...common, "--tmpDir", tmpDir, "--queue", queue], "");
    const workResult = parseOutput(work.stdout);
    if (workResult && workResult.leased === false) break;
  }
  process.stdout.write(JSON.stringify({ ok: true }) + "\n");
} catch (error) {
  process.stderr.write(error.result?.stderr || `${error.message}\n`);
  process.exitCode = 1;
}
