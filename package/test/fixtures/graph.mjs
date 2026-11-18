import http from 'node:http';
import fs from 'node:fs';
const [port, log] = process.argv.slice(2);
http.createServer(async (req, res) => {
  let body = '';
  for await (const chunk of req) body += chunk;
  if (req.method === 'POST') fs.appendFileSync(log, JSON.stringify({ path: req.url, body: JSON.parse(body) }) + '\n');
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ messages: [{ id: 'sent-1' }] }));
}).listen(Number(port), '127.0.0.1');
