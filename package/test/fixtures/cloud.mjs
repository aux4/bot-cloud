import http from "node:http";
import fs from "node:fs";
const [port, output] = process.argv.slice(2);
http.createServer((request,response) => {
  if (request.url === "/health") { response.end("ok"); return; }
  request.resume();
  request.on("end", () => {
    fs.appendFileSync(output, JSON.stringify({method:request.method,path:request.url,machineKeyLength:(request.headers["x-api-key"] || "").length,hasAuthorization:Boolean(request.headers.authorization)})+"\n");
    response.writeHead(403,{"Content-Type":"application/json"});
    response.end(JSON.stringify({error:"Machine is not authorized to invoke this command"}));
  });
}).listen(Number(port),"127.0.0.1");
