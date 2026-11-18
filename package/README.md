# aux4/bot-cloud

Run a WhatsApp aux4 bot on one aux4.cloud command machine. The machine declares
`turso:database`, so bot state and the repository-backed queue share its own
Turso database through `db: cloud`.

## Installation

```bash
aux4 aux4 pkger install aux4/bot-cloud
```

The `whatsapp` command consumes the platform webhook's raw request envelope on
stdin, performs the bot's own Meta signature check, enqueues new messages, and
processes one queue item before returning. Its default brain replies
`you said: <text>`.

Configure the `verifyToken` value when deploying and create the aux4-cloud
scope secret `whatsapp` with `token` and `appSecret` fields. The command uses
the `secret://aux4-cloud/whatsapp/...` references by default.

The platform webhook must pass an envelope containing `method`, `headers`,
`queryStringParameters`, `rawBody`, and `pathParameters` with `channel` and
`bot`. The command is intended to be bound to the platform's asynchronous
webhook runner.
