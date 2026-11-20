#### Description

Deliver the final result of a configured agent turn. This command accepts a JSON completion on stdin and uses the bot database to find its original recipient. VM-to-VM permissions must restrict callers to the configured agent.

#### Usage

```text
aux4 cloud whatsapp-bot cloud-bot complete < completion.json
```

The completion contains `requestId`, `status` (`completed` or `failed`), and `reply` for a completed turn. Unknown requests and mismatched correlation are rejected. Repeated completed deliveries do not send another message.

This privileged entry accepts no configuration flags. It uses the VM-bound `WHATSAPP_TOKEN`, fixed Graph API origin, and `cloud` database. Optional VM-owned `CLOUD_BOT_ID` and `CLOUD_BOT_PHONE_NUMBER_ID` select the bot identity. A calling agent cannot override these through RPC parameters.
