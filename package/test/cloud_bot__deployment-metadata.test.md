# Installed cloud deployment contract

## the packaged manifest preserves the machine and capability policy

```execute
node --input-type=module -e '
import fs from "node:fs";
import assert from "node:assert/strict";
const manifest = JSON.parse(fs.readFileSync("../.aux4", "utf8"));
assert.equal(manifest.scope, "aux4");
assert.equal(manifest.name, "cloud-bot");
assert.equal(manifest.type, "cloud");
assert.equal(manifest.cloud.deployment, "new-vm");
assert.deepEqual(manifest.cloud.replaces, ["aux4/bot-cloud"]);
assert.equal(manifest.cloud.machine.name, "whatsapp-bot");
assert.equal(manifest.cloud.machine.type, "command");
assert.equal(manifest.cloud.machine.size, "xs");
assert.deepEqual(manifest.cloud.capabilities, ["turso:database"]);
assert(manifest.cloud.commands.includes("whatsapp"));
assert(manifest.cloud.commands.includes("cloud-bot"));
console.log("Cloud deployment contract preserved");
'
```

```expect
Cloud deployment contract preserved
```
