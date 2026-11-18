#### Description

Verify a signed WhatsApp webhook envelope from stdin, enqueue its messages, and process one queued message. State and queue use the machine's own Turso database. The default brain replies `you said: <text>`.

#### Usage

```bash
aux4 whatsapp < delivery.json
```

The platform webhook must use asynchronous execution with the envelope payload format. Set the `whatsapp` scope secret's `token` and `appSecret` fields before deployment. `--db` defaults to `cloud`; `--phoneNumberId` selects the Meta number. `--apiUrl` overrides the Graph API endpoint for testing.

#### Example

```bash
aux4 whatsapp --phoneNumberId 1450110568185980 < delivery.json
```

```text
{"ok":true}
```
