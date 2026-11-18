const [botId, phoneNumberId, verifyToken, token, appSecret, apiUrl] = process.argv.slice(2);

const command = `node ${new URL("./echo.mjs", import.meta.url).pathname}`;
process.stdout.write(JSON.stringify({
  channels: ["whatsapp"],
  bots: {
    [botId]: { channel: "whatsapp", phoneNumberId, verifyToken, token, appSecret, apiUrl, command }
  },
  defaults: {}
}));
