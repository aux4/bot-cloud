#### Description

Invoke another machine as this bot machine. The source machine's explicit access policy must permit the target and effective command. Calls are denied by default. The control plane authenticates the machine key; no human SSO is forwarded.

#### Usage

```bash
aux4 bot-cloud invoke --target <machine> --command <token> [--command <token>]
```

#### Example

```bash
aux4 bot-cloud invoke --target repository --command read
```
