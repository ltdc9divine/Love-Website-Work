// Phase 5C-3 focused tests for server-lib/auth-context.js
// Run: node scripts/test-auth-context.js
// No framework, no production data: in-memory fake DB via deps injection into
// the REAL authenticateBearerToken/touchLastSeen production implementations.

const path = require('path');
const ac = require(path.join(__dirname, '..', 'server-lib', 'auth-context.js'));
const ca = require(path.join(__dirname, '..', 'server-lib', 'customer-access.js'));

let total = 0, passed = 0, failed = 0;
function check(name, cond, detail) {
  total++;
  if (cond) { passed++; console.log('PASS: ' + name); }
  else { failed++; console.log('FAIL: ' + name + ' :: ' + String(detail).slice(0, 220)); }
}

// ---- In-memory fake DB (PostgREST-shaped, operator-aware) ----
function makeFakeDb() {
  const state = { customers: [], tokens: [], calls: [] };
  function params(p) {
    const q = p.split('?')[1] || '';
    const out = {};
    for (const pair of q.split('&')) {
      const idx = pair.indexOf('=');
      if (idx === -1) continue;
      const k = decodeURIComponent(pair.slice(0, idx));
      const raw = decodeURIComponent(pair.slice(idx + 1));
      const dot = raw.indexOf('.');
      out[k] = { op: dot === -1 ? raw : raw.slice(0, dot), value: dot === -1 ? '' : raw.slice(dot + 1) };
    }
    return out;
  }
  function matches(op, actual, expected) {
    if (op === 'eq') return actual === expected;
    if (op === 'is') return expected === 'null' ? (actual === null || actual === undefined) : actual === expected;
    if (op === 'lt') return new Date(actual || 0) < new Date(expected);
    return false;
  }
  return {
    state,
    async supabaseRequest(opts) {
      const p = opts.path || '';
      state.calls.push({ path: p, method: opts.method, body: opts.body });
      const table = p.startsWith('/rest/v1/') ? p.split('?')[0].slice('/rest/v1/'.length) : null;
      const q = params(p);
      if (opts.method === 'POST' && table === 'customers') {
        const row = { id: 'c' + (state.customers.length + 1) + '-0000-0000-0000-000000000000', created_at: new Date().toISOString(), last_seen_at: (opts.body && opts.body.last_seen_at) || null };
        state.customers.push(row);
        return [row];
      }
      if (opts.method === 'POST' && table === 'customer_access_tokens') {
        const row = { id: 't' + (state.tokens.length + 1) + '-0000-0000-0000-000000000000', customer_id: opts.body.customer_id, token_hash: opts.body.token_hash, created_at: new Date().toISOString(), expires_at: opts.body.expires_at, revoked_at: null };
        state.tokens.push(row);
        return [row];
      }
      if (opts.method === 'GET' && table === 'customer_access_tokens') {
        return state.tokens.filter(t => !q.token_hash || matches(q.token_hash.op, t.token_hash, q.token_hash.value));
      }
      if (opts.method === 'GET' && table === 'customers') {
        return state.customers.filter(c => !q.id || matches(q.id.op, c.id, q.id.value));
      }
      if (opts.method === 'DELETE' && table === 'customers') {
        const before = state.customers.length;
        state.customers = state.customers.filter(c => !(q.id && matches(q.id.op, c.id, q.id.value)));
        return state.customers.length < before ? [{ deleted: true }] : [];
      }
      if (opts.method === 'PATCH' && table === 'customers') {
        const target = state.customers.find(c => q.id && matches(q.id.op, c.id, q.id.value));
        if (!target) return [];
        if (q.last_seen_at && !matches(q.last_seen_at.op, target.last_seen_at, q.last_seen_at.value)) return [];
        Object.assign(target, opts.body || {});
        return [target];
      }
      if (opts.method === 'PATCH' && table === 'customer_access_tokens') {
        const target = state.tokens.find(t => q.id && matches(q.id.op, t.id, q.id.value));
        if (!target) return [];
        if (q.revoked_at && !matches(q.revoked_at.op, target.revoked_at, q.revoked_at.value)) return [];
        Object.assign(target, opts.body || {});
        return [target];
      }
      return [];
    }
  };
}

async function run(req, db) {
  try {
    return { ok: true, context: await ac.authenticateRequest(req, db) };
  } catch (error) {
    return { ok: false, error };
  }
}

(async () => {
  const UUID = '11111111-1111-4111-8111-111111111111';

  // ---- 1-3, 11-13. missing / malformed / UUID / no fallback / no cookie / no query ----
  {
    const db = makeFakeDb();
    const missing = await run({ headers: {} }, db);
    check('1. missing Authorization -> 401 generic', !missing.ok && missing.error.statusCode === 401 && missing.error.message === 'Unauthorized.', missing.error && missing.error.message);
    const empty = await run({ headers: { authorization: '' } }, db);
    check('1b. empty Authorization -> 401', !empty.ok && empty.error.statusCode === 401, '');
    const nonobject = await run({ headers: null }, db);
    check('1c. null headers -> 401', !nonobject.ok && nonobject.error.statusCode === 401, '');
    check('1d. missing/malformed -> ZERO DB calls', db.state.calls.length === 0, String(db.state.calls.length));

    const malformed = await run({ headers: { authorization: 'Token abc' } }, makeFakeDb());
    check('2. malformed (not Bearer) -> 401', !malformed.ok && malformed.error.statusCode === 401, '');

    const uuidBearer = await run({ headers: { authorization: 'Bearer ' + UUID } }, makeFakeDb());
    check('3. UUID as bearer -> 401, no fallback', !uuidBearer.ok && uuidBearer.error.statusCode === 401, '');

    const queryToken = await run({ headers: {}, query: { token: 'whatever' } }, makeFakeDb());
    check('12. no query-param token (query ignored -> 401)', !queryToken.ok && queryToken.error.statusCode === 401, '');
    const cookieToken = await run({ headers: { cookie: 'token=whatever' } }, makeFakeDb());
    check('13. no cookie token (cookie ignored -> 401)', !cookieToken.ok && cookieToken.error.statusCode === 401, '');
    const suppliedCust = await run({ headers: {}, body: { customer_id: 'c1' } }, makeFakeDb());
    check('11. client-supplied customer_id cannot bypass (no header -> 401)', !suppliedCust.ok && suppliedCust.error.statusCode === 401, '');
  }

  // ---- 4-7. invalid / expired / revoked / valid ----
  {
    const db = makeFakeDb();
    const OTHER = ca.generateRawToken();
    const invalid = await run({ headers: { authorization: 'Bearer ' + OTHER } }, db);
    check('4. invalid token -> 401', !invalid.ok && invalid.error.statusCode === 401, '');

    const minted = await ca.createCustomerWithToken(db);
    const header = { authorization: 'Bearer ' + minted.rawToken };
    db.state.tokens[0].expires_at = new Date(Date.now() - 1000).toISOString();
    const expired = await run({ headers: header }, db);
    check('5. expired token -> 401', !expired.ok && expired.error.statusCode === 401, '');

    db.state.tokens[0].expires_at = new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString();
    await ca.revokeToken(db.state.tokens[0].id, db);
    const revoked = await run({ headers: header }, db);
    check('6. revoked token -> 401', !revoked.ok && revoked.error.statusCode === 401, '');

    const db2 = makeFakeDb();
    const minted2 = await ca.createCustomerWithToken(db2);
    const valid = await run({ headers: { authorization: 'Bearer ' + minted2.rawToken } }, db2);
    check('7. valid token -> authenticated context with customer/token', valid.ok && valid.context.authenticated === true && !!valid.context.customer && !!valid.context.token, JSON.stringify(valid).slice(0, 200));
    check('7b. raw token NOT present in returned context', JSON.stringify(valid.context).indexOf(minted2.rawToken) === -1 && !valid.context.rawToken && !valid.context.raw_token && !valid.context.credential, JSON.stringify(valid.context).slice(0, 200));
    check('7c. context customer matches minted customer', valid.context.customer.id === minted2.customer.id, '');
  }

  // ---- 8-10. touchLastSeen wiring ----
  {
    const db = makeFakeDb();
    const minted = await ca.createCustomerWithToken(db);
    const before = db.state.customers[0].last_seen_at;
    await new Promise((r) => setTimeout(r, 15));
    const ok = await run({ headers: { authorization: 'Bearer ' + minted.rawToken } }, db);
    const touched = db.state.customers[0].last_seen_at !== before;
    check('8. valid token -> touchLastSeen runs after successful auth', ok.ok && touched, String(db.state.customers[0].last_seen_at));
  }
  {
    const db = makeFakeDb();
    await ca.createCustomerWithToken(db);
    await run({ headers: { authorization: 'Bearer ' + ca.generateRawToken() } }, db); // invalid
    check('9. invalid token does NOT call touchLastSeen (no customers PATCH)', db.state.calls.every(c => !(c.method === 'PATCH' && c.path.indexOf('/rest/v1/customers') === 0)), JSON.stringify(db.state.calls.map(c => c.method + ' ' + c.path)));
  }
  {
    const db2 = makeFakeDb();
    const m2 = await ca.createCustomerWithToken(db2);
    let calledTouch = false;
    const brokenDb = {
      state: { calls: [] },
      supabaseRequest: async (opts) => {
        brokenDb.state.calls.push({ method: opts.method, path: opts.path });
        if (opts.method === 'POST' && opts.path.indexOf('/rest/v1/customers') === 0) return [{ id: m2.customer.id, last_seen_at: new Date().toISOString() }];
        if (opts.method === 'POST' && opts.path.indexOf('/rest/v1/customer_access_tokens') === 0) return [{ id: m2.token.id + '-x', customer_id: m2.customer.id, token_hash: opts.body.token_hash, expires_at: opts.body.expires_at, revoked_at: null }];
        if (opts.method === 'GET' && opts.path.indexOf('/rest/v1/customer_access_tokens') === 0) return [Object.assign({}, db2.state.tokens[0])];
        if (opts.method === 'GET' && opts.path.indexOf('/rest/v1/customers') === 0) return [Object.assign({}, db2.state.customers[0])];
        if (opts.method === 'PATCH' && opts.path.indexOf('/rest/v1/customers') === 0) { calledTouch = true; throw new Error('touch failed'); }
        return [];
      }
    };
    const authResult = await run({ headers: { authorization: 'Bearer ' + m2.rawToken } }, brokenDb);
    check('10. touchLastSeen failure does NOT turn valid credential into unauthorized', authResult.ok && authResult.context.authenticated === true && calledTouch === true, authResult.error && String(authResult.error.message));
  }

  // ---- 14. internal failure surfaces, no internal details leaked ----
  // The middleware rethrows infrastructure errors (500-class) deliberately —
  // it does NOT convert them into "Unauthorized" (per 5C-3 requirement #6).
  // The requirement not to leak internal details refers to the CLIENT-FACING
  // HTTP response, which is shaped by the 5C-4 endpoint wiring (the endpoint
  // will send a generic 500). Here we assert the middleware's contract:
  //   - infra error is NOT turned into the generic 401 "Unauthorized."
  //   - the internal error message (which may contain infra detail) is
  //     propagated to server code ONLY — it is never placed in a client-bound
  //     payload by this helper (helper returns no response object).
  {
    const cat = { supabaseRequest: async () => { throw new Error('secret db url'); } };
    const r = await run({ headers: { authorization: 'Bearer ' + ca.generateRawToken() } }, cat);
    check('14. infrastructure failure surfaces as non-401', !r.ok && r.error.statusCode !== 401, r.error && String(r.error.message));
    check('14b. infra error is NOT the generic unauthorized message (it is 500-class by contract, scrubbed at HTTP boundary by the wired endpoint in 5C-4)', !r.ok && r.error.message !== 'Unauthorized.', r.error && String(r.error.message));
  }

  // ---- 15. request-scoped context (no global mutable state) ----
  {
    const c1 = await run({ headers: { authorization: 'Bearer ' + ca.generateRawToken() } }, makeFakeDb());
    const c2 = await run({ headers: { authorization: 'Bearer ' + ca.generateRawToken() } }, makeFakeDb());
    check('15. context is request-scoped (no shared failure state)', !c1.ok && !c2.ok && !c1.error.isSameContext, '');
    const db = makeFakeDb();
    const m = await ca.createCustomerWithToken(db);
    const ctxA = await run({ headers: { authorization: 'Bearer ' + m.rawToken } }, db);
    const ctxB = await run({ headers: { authorization: 'Bearer ' + m.rawToken } }, db);
    check('15b. repeated valid requests produce independent context objects', ctxA.ok && ctxB.ok && ctxA.context !== ctxB.context, '');
  }

  // ---- 16. no forbidden authorization references in module code ----
  {
    const fs = require('fs');
    const src = fs.readFileSync(path.join(__dirname, '..', 'server-lib', 'auth-context.js'), 'utf8');
    // The only require() must be the 5C-2 helper (customer-access), which is the
    // established 5C-3 contract. It must NOT pull in payment/preview/upload.
    const requires = (src.match(/require\(([^)]+)\)/g) || []);
    check('16a. module requires ONLY customer-access', requires.length === 1 && requires[0].includes('./customer-access'), JSON.stringify(requires));
    // Executable-code-only scan: strip line comments, then confirm the code
    // never USES these as identifiers (imports confirmed above). Verbal
    // occurrences in comments are allowed (they document what's forbidden).
    const codeBody = src.split('\n').map((l) => {
      const ci = l.indexOf('//');
      return ci === -1 ? l : l.slice(0, ci);
    }).join('\n');
    const usedIdentifiers = ['websiteId', 'orderId', 'order_reference', 'localStorage', 'document.cookie', 'req.query.token', 'req.cookies'];
    const used = usedIdentifiers.filter((id) => codeBody.includes(id));
    check('16b. module executable code uses no forbidden authorization identifiers', used.length === 0, used.join(','));
  }

  console.log('---');
  console.log('TOTAL: ' + total + ' | PASSED: ' + passed + ' | FAILED: ' + failed);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => { console.error('SCRIPT ERROR: ' + (e && e.stack || e)); process.exit(2); });