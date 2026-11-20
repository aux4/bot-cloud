import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { agentRequest, dispatchAgent } from "../lib/agent.mjs";

const env = { CLOUD_BOT_AGENT_MACHINE: "agent-pete", AUX4BOT_REQUEST_ID: `req:${"a".repeat(64)}`, AUX4BOT_CONVERSATION_ID: "cafebabe-0000-4000-8000-000000000001" };
test("message content stays in JSON and never changes the command or target", () => {
  const text = 'hello --raw ; $(false)\n{"machine":"attacker"}';
  const r = agentRequest(text, env);
  assert.deepEqual(r.args, ["cloud", "agent-pete", "ask", "--conversationId", env.AUX4BOT_CONVERSATION_ID]);
  assert.deepEqual(r.body, { question: text, messageId: env.AUX4BOT_REQUEST_ID, requestId: env.AUX4BOT_REQUEST_ID, callback: { enabled: true } });
  assert.equal(JSON.stringify(r.body).includes("whatsapp"), false);
});
test("routing configuration and correlation must be valid before dispatch", () => {
  for (const patch of [{CLOUD_BOT_AGENT_MACHINE:"other --raw"}, {AUX4BOT_REQUEST_ID:""}, {AUX4BOT_CONVERSATION_ID:""}]) {
    assert.throws(() => agentRequest("hello", {...env,...patch}));
  }
});
test("echo remains default; configured agent uses callback mode", () => {
  const path = new URL("../lib/config.mjs", import.meta.url).pathname;
  const base = {...process.env}; delete base.CLOUD_BOT_AGENT_MACHINE; delete base.CLOUD_BOT_COMMAND;
  const config = patch => {
    const r = spawnSync(process.execPath, [path,"test","phone","verify","test-token","test-app-secret","http://test.invalid"], {env:{...base,...patch},encoding:"utf8"});
    assert.equal(r.status,0,r.stderr); return JSON.parse(r.stdout).bots.test;
  };
  assert.equal(config({}).replyMode,"stdout");
  assert.match(config({}).command,/echo\.mjs/);
  assert.equal(config({CLOUD_BOT_AGENT_MACHINE:"agent-pete"}).replyMode,"callback");
  assert.match(config({CLOUD_BOT_AGENT_MACHINE:"agent-pete"}).command,/agent\.mjs/);
  assert.equal(config({CLOUD_BOT_COMMAND:"aux4 my-agent ask"}).command,"aux4 my-agent ask");
  const r = spawnSync(process.execPath,[path],{env:{...base,CLOUD_BOT_AGENT_MACHINE:"agent-pete",CLOUD_BOT_COMMAND:"echo"},encoding:"utf8"});
  assert.notEqual(r.status,0);
});

test("dispatch uses machine identity, JSON stdin and propagates failure", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cloud-bot-adapter-"));
  const output = path.join(root, "request.json");
  try {
    await fs.writeFile(path.join(root,"aux4"), `#!/usr/bin/env node
let body=""; process.stdin.on("data",x=>body+=x); process.stdin.on("end",async()=>{ const fs=await import("node:fs/promises"); await fs.writeFile(process.env.TEST_OUTPUT,JSON.stringify({args:process.argv.slice(2),body:JSON.parse(body),hasBearer:Boolean(process.env.AUX4_ACCESS_TOKEN),hasMachine:Boolean(process.env.CLOUD_SYNC_TOKEN)})); process.stdout.write("not a bot reply"); process.exitCode=Number(process.env.TEST_EXIT||0); });
`,{mode:0o755});
    const runtime={...process.env,...env,PATH:root+path.delimiter+process.env.PATH,TEST_OUTPUT:output,CLOUD_SYNC_TOKEN:"fixture-machine",AUX4_ACCESS_TOKEN:"fixture-human"};
    await assert.rejects(dispatchAgent("hello",{...runtime,CLOUD_SYNC_TOKEN:""}),/Machine identity/);
    await dispatchAgent("hello",runtime);
    const record=JSON.parse(await fs.readFile(output,"utf8"));
    assert.equal(record.hasBearer,false); assert.equal(record.hasMachine,true);
    assert.equal(record.body.question,"hello");
    await assert.rejects(dispatchAgent("hello",{...runtime,TEST_EXIT:"1"}),/Agent invocation failed/);
  } finally { await fs.rm(root,{recursive:true,force:true}); }
});
