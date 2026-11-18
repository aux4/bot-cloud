let tokens = JSON.parse(process.argv[2] || "[]");
// The command runtime transports a repeated parameter as one JSON-array value.
if (Array.isArray(tokens) && tokens.length === 1 && typeof tokens[0] === "string" && tokens[0].startsWith("[")) {
  try { tokens = JSON.parse(tokens[0]); } catch { tokens = null; }
}
if (!Array.isArray(tokens) || tokens.length === 0 || tokens.some(token => typeof token !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(token))) {
  console.error("Command tokens must be command names");
  process.exitCode = 1;
} else {
  console.log(tokens.join(" "));
}
