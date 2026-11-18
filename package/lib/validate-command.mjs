const tokens = JSON.parse(process.argv[2] || "[]");
if (!Array.isArray(tokens) || tokens.length === 0 || tokens.some(token => typeof token !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(token))) {
  console.error("Command tokens must be command names");
  process.exitCode = 1;
}
