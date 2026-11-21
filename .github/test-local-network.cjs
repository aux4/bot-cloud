// Test processes may use local model servers and mocks only. Fail before any
// connection when a missing fixture hook falls through to a remote endpoint.
// aux4/action downloads Jest and its dependencies from the npm registry.
// This explicit setup endpoint serves packages, rather than model inference.
const http = require('node:http');
const https = require('node:https');
function localOnly(input) {
  let host;
  if (typeof input === 'string' || input instanceof URL) {
    host = new URL(input).hostname;
  } else {
    host = input?.hostname || input?.host || 'localhost';
  }
  host = String(host).toLowerCase();
  if (!['localhost', '127.0.0.1', '::1', '[::1]', 'registry.npmjs.org'].includes(host)) {
    throw new Error('External network disabled during tests; use a local model or mock');
  }
}
const originalFetch = globalThis.fetch;
globalThis.fetch = async function(input, ...args) {
  localOnly(input instanceof Request ? input.url : input);
  return originalFetch.call(this, input, ...args);
};
for (const module of [http, https]) {
  for (const name of ['request', 'get']) {
    const original = module[name];
    module[name] = function(input, ...args) {
      localOnly(input);
      return original.call(this, input, ...args);
    };
  }
}
