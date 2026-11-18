const status = Number(process.argv[2]);
if (!Number.isInteger(status) || status < 200 || status >= 300) {
  process.stderr.write("Webhook ingest failed\n");
  process.exitCode = 1;
}
