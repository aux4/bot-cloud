# aux4/bot-cloud manifest

## declares the trusted command machine and Turso capability

```execute
node -e "const fs=require('fs'); const m=JSON.parse(fs.readFileSync('../.aux4')); if(m.type!=='cloud'||m.cloud.deployment!=='new-vm'||m.cloud.machine.type!=='command'||m.cloud.machine.name!=='whatsapp-bot'||m.cloud.capabilities[0]!=='turso:database'||m.cloud.commands[0]!=='whatsapp') process.exit(1); console.log('manifest ok')"
```

```expect
manifest ok
```
