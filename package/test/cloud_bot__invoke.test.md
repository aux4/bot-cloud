# Machine invocation command path

## forwards command tokens and uses the VM credential

```timeout
30000
```

```execute
set -e
node fixtures/cloud.mjs 18873 invoke.ndjson >invoke.log 2>&1 &
serverPid=$!
trap 'kill "$serverPid" 2>/dev/null || true; rm -f invoke.ndjson invoke.log invoke.stdout invoke.stderr' EXIT
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS http://127.0.0.1:18873/health >/dev/null 2>&1; then break; fi
  sleep 0.2
done
export AUX4_CLOUD_API_URL=http://127.0.0.1:18873
export AUX4_CLOUD_SCOPE=aux4
export CLOUD_SYNC_TOKEN=00000000-0000-4000-8000-000000000000
export AUX4_ACCESS_TOKEN=test-human-token
if aux4 cloud-bot invoke --target target-vm --command cloud-bot --command status < /dev/null >invoke.stdout 2>invoke.stderr; then exit 1; fi
if aux4 cloud-bot invoke --target target-vm --command '["cloud-bot","status"]' < /dev/null >invoke.stdout 2>invoke.stderr; then exit 1; fi
if aux4 cloud-bot invoke --target target-vm --command "status'; false; '" < /dev/null >invoke.stdout 2>invoke.stderr; then exit 1; fi
node --input-type=module -e '
import fs from "node:fs";
import assert from "node:assert/strict";
const calls = fs.readFileSync("invoke.ndjson", "utf8").trim().split("\n").map(JSON.parse);
assert.equal(calls.length,2);
assert(calls.some(call => call.method === "POST" && call.path === "/v1/aux4/run/target-vm/cloud-bot/status" && call.machineKeyLength === 36 && call.hasAuthorization === false));
console.log("machine credential and command path preserved");
'
```

```expect
machine credential and command path preserved
```
