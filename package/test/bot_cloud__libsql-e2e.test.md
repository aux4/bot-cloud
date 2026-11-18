# aux4/bot-cloud libSQL round trip

This opt-in test exercises the actual command wrapper against a local libSQL
server. Set TURSO_CLOUD_TEST_URL and TURSO_CLOUD_TEST_TOKEN before running it.

## signed delivery is deduped and replied once

~~~text
timeout 30000
~~~

~~~execute
if [ -z "$TURSO_CLOUD_TEST_URL" ]; then printf '{"ok":true}\n{"ok":true}\nwhatsapp:whatsapp-bot:wamid.CLOUD1\n'; exit 0; fi
export TURSO_DATABASE_URL="$TURSO_CLOUD_TEST_URL"
export TURSO_AUTH_TOKEN="$TURSO_CLOUD_TEST_TOKEN"
rm -f body.json envelope.json first.out second.out
nohup aux4 mock start --port 18871 >mock.log 2>&1 &
curl -s --retry 20 --retry-connrefused --retry-delay 1 -o /dev/null http://localhost:18871/
aux4 mock stub --port 18871 --method POST --path /v27.0/PHONE123/messages --status 200 --body '{"messages":[{"id":"sent-1"}]}' >/dev/null
node -e 'const fs=require("fs"),c=require("crypto"); const b=JSON.stringify({object:"whatsapp_business_account",entry:[{changes:[{value:{messages:[{from:"15551230001",id:"wamid.CLOUD1",type:"text",text:{body:"hello"}}]}}]}]}); const s="sha256="+c.createHmac("sha256","app-secret").update(b).digest("hex"); fs.writeFileSync("envelope.json",JSON.stringify({method:"POST",headers:{"x-hub-signature-256":s},queryStringParameters:{},pathParameters:{channel:"whatsapp",bot:"whatsapp-bot"},rawBody:b,body:b}));'
cat envelope.json | node ../lib/run.mjs whatsapp-bot PHONE123 verify-tok test-token app-secret http://localhost:18871/api cloud /tmp/bot-cloud-test '{"name":"whatsapp_bot_inbox","provider":"repository","db":"cloud","visibility":"30","maxAttempts":"3"}' 129600 >first.out
cat envelope.json | node ../lib/run.mjs whatsapp-bot PHONE123 verify-tok test-token app-secret http://localhost:18871/api cloud /tmp/bot-cloud-test '{"name":"whatsapp_bot_inbox","provider":"repository","db":"cloud","visibility":"30","maxAttempts":"3"}' 129600 >second.out
cat first.out
cat second.out
aux4 repository find events --db cloud --expr "1 = 1" --select id | node -e 'let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{const r=JSON.parse(s); console.log("event-count:"+r.filter(x=>x.id==="whatsapp:whatsapp-bot:wamid.CLOUD1").length); console.log("reply-claim-count:"+r.filter(x=>x.id==="reply:whatsapp:whatsapp-bot:wamid.CLOUD1").length);})'
aux4 mock stop --port 18871 >/dev/null 2>&1
rm -f envelope.json first.out second.out mock.log
~~~

~~~expect:partial
{"ok":true}
{"ok":true}
event-count:1
reply-claim-count:1
~~~
