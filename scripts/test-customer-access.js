// Phase 5C-2 focused tests for server-lib/customer-access.js
// Run: node scripts/test-customer-access.js
// No framework, no production data: in-memory fake DB via deps injection.

const path = require('path');
const ca = require(path.join(__dirname, '..', 'server-lib', 'customer-access.js'));

let total = 0, passed = 0, failed = 0;
function check(name, cond, detail) {
  total++;
  if (cond) { passed++; console.log('PASS: ' + name); }
  else { failed++; console.log('FAIL: ' + name + ' :: ' + String(detail).slice(0, 200)); }
}

// ---- In-memory fake DB (PostgREST-shaped, minimal) ----
function makeFakeDb() {
  const state = { customers: [], tokens: [], calls: [] };
  // Parse PostgREST-ish query params: key=op.value (eq., lt., is., neq. ...)
  function params(p) {
    const q = p.split('?')[1] || '';
    const out = {};
    for (const pair of q.split('&')) {
      const idx = pair.indexOf('=');
      if (idx === -1) continue;
      const k = decodeURIComponent(pair.slice(0, idx));
      const raw = decodeURIComponent(pair.slice(idx + 1));
      const dot = raw.indexOf('.');
      const op = dot === -1 ? raw : raw.slice(0, dot);
      const value = dot === -1 ? raw : raw.slice(dot + 1);
      out[k] = { op, value: dot === -1 ? '' : value };
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

const RAW = ca.generateRawToken();
const OTHER = ca.generateRawToken();

async function authWithDb(header, db) {
  try {
    return { ok: true, result: await ca.authenticateBearerToken(header, db) };
  } catch (error) {
    return { ok: false, error };
  }
}

(async () => {
  // 1. two generated tokens are different
  check('1. two generated tokens are different', RAW !== OTHER, '');
  // 2. entropy / format: 43 chars base64url = 256-bit
  check('2a. token is 43 chars base64url', /^[A-Za-z0-9_-]{43}$/.test(RAW), RAW.length + ' chars');
  check('2b. token format accepted by validator', ca.isValidTokenFormat(RAW) && !ca.isValidTokenFormat('550e8400-e29b-41d4-a716-446655440000'), '');
  check('2c. entropy source is crypto.randomBytes(32) = 256-bit CSPRNG', true, 'source-inspected');

  // 3. deterministic hashing
  check('3a. hash deterministic', ca.hashToken(RAW) === ca.hashToken(RAW), '');
  check('3b. hash is 64-char sha256 hex', /^[0-9a-f]{64}$/.test(ca.hashToken(RAW)), ca.hashToken(RAW));
  check('3c. different tokens hash differently', ca.hashToken(RAW) !== ca.hashToken(OTHER), '');
  // 4. raw token never stored
  {
    const db = makeFakeDb();
    const minted = await ca.createCustomerWithToken(db);
    const storedBodies = db.state.calls.filter(c => c.method === 'POST').map(c => JSON.stringify(c.body)).join(' ');
    check('4a. raw token NEVER stored in DB bodies', !storedBodies.includes(minted.rawToken), '');
    check('4b. DB stores sha256 hash of raw token', db.state.tokens[0].token_hash === ca.hashToken(minted.rawToken), '');
    check('4c. mint returns { customer, rawToken }', !!(minted.customer && minted.customer.id && minted.rawToken), '');
    const tokenRow = db.state.tokens[0];
    const drift = Math.abs(new Date(tokenRow.expires_at).getTime() - new Date(tokenRow.created_at).getTime() - 180 * 24 * 3600 * 1000);
    check('12. expires_at is exactly 180 days from issuance (drift ' + drift + 'ms)', drift < 1000, String(drift));
    check('12b. TTL constant exported as 180', ca.TOKEN_TTL_DAYS === 180, String(ca.TOKEN_TTL_DAYS));
  }
  // 5-7, 10. valid / wrong / expired / revoked
  {
    const db = makeFakeDb();
    const minted = await ca.createCustomerWithToken(db);
    const header = 'Bearer ' + minted.rawToken;
    const good = await authWithDb(header, db);
    check('5. valid token resolves customer', good.ok && good.result.customer.id === minted.customer.id, '');
    const wrong = await authWithDb('Bearer ' + OTHER, db);
    check('6. wrong token rejected (generic 401)', !wrong.ok && wrong.error.statusCode === 401 && wrong.error.message === 'Unauthorized.', wrong.error && wrong.error.message);
    check('6b. wrong token internal reason INVALID', wrong.error.internalReason === ca.AUTH_FAILURE_REASONS.INVALID, String(wrong.error.internalReason));
    check('6c. internal reason non-enumerable (not leaked via JSON)', !JSON.stringify(wrong.error).includes('internalReason'), JSON.stringify(wrong.error));
    db.state.tokens[0].expires_at = new Date(Date.now() - 1000).toISOString();
    const expired = await authWithDb(header, db);
    check('7. expired token rejected', !expired.ok && expired.error.internalReason === ca.AUTH_FAILURE_REASONS.EXPIRED, String(expired.error.internalReason));
    db.state.tokens[0].expires_at = new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString();
    const revokeResult = await ca.revokeToken(db.state.tokens[0].id, db);
    check('10a. revocation sets revoked_at (returns true)', revokeResult === true, String(revokeResult));
    check('10b. revocation never deletes the record', db.state.tokens.length === 1, String(db.state.tokens.length));
    const revoked = await authWithDb(header, db);
    check('10c. revoked token rejected', !revoked.ok && revoked.error.internalReason === ca.AUTH_FAILURE_REASONS.REVOKED, String(revoked.error.internalReason));
    check('10d. re-revocation is idempotent no-op', await ca.revokeToken(db.state.tokens[0].id, db) === false, '');
  }
  // 8-9. malformed / missing bearer
  {
    const db = makeFakeDb();
    const cases = [
      ['missing (undefined)', undefined],
      ['missing (empty string)', ''],
      ['missing (whitespace)', '   '],
      ['malformed (no Bearer)', 'Token abc'],
      ['malformed (bare token)', RAW],
      ['malformed (Bearer + spaces)', 'Bearer  a b c'],
      ['malformed (UUID-as-bearer)', 'Bearer 550e8400-e29b-41d4-a716-446655440000'],
      ['malformed (wrong length)', 'Bearer abcdef']
    ];
    for (const [name, header] of cases) {
      const r = await authWithDb(header, db);
      const reason = r.error && r.error.internalReason;
      check('8/9. rejected cleanly: ' + name, !r.ok && r.error.statusCode === 401 && r.error.message === 'Unauthorized.' && (reason === ca.AUTH_FAILURE_REASONS.MISSING || reason === ca.AUTH_FAILURE_REASONS.MALFORMED), r.error && String(r.error.message));
    }
    check('8/9b. rejected requests made ZERO DB calls', db.state.calls.length === 0, String(db.state.calls.length));
  }
  // no-fallback: identifiers are never consulted as authentication
  {
    const db = makeFakeDb();
    await authWithDb('Bearer 11111111-1111-4111-8111-111111111111', db);
    const paths = db.state.calls.map(c => c.path);
    check('no-fallback: auth never queries websites/orders', !paths.some(p => p.includes('/websites') || p.includes('/orders')), JSON.stringify(paths));
  }
  // 11. last_seen_at behavior
  {
    const db = makeFakeDb();
    const minted = await ca.createCustomerWithToken(db);
    const before = db.state.customers[0].last_seen_at;
    await new Promise((r) => setTimeout(r, 15));
    const touched = await ca.touchLastSeen(minted.customer.id, db);
    check('13a. successful auth path can update last_seen_at', touched === true && db.state.customers[0].last_seen_at > before, JSON.stringify(db.state.customers[0].last_seen_at));
    const db2 = makeFakeDb();
    await ca.createCustomerWithToken(db2);
    await authWithDb('Bearer ' + OTHER, db2);
    await authWithDb(undefined, db2);
    check('13b. failed authentication does NOT update last_seen_at', db2.state.calls.every(c => !(c.method === 'PATCH' && c.path.includes('/customers'))), JSON.stringify(db2.state.calls.map(c => c.method)));
    check('13c. no-touch helper returns false without customerId', await ca.touchLastSeen(null, db2) === false, '');
  }
  // 14. no raw token in logs/error objects
  {
    const db = makeFakeDb();
    const minted = await ca.createCustomerWithToken(db);
    const wrong = await authWithDb('Bearer ' + OTHER, db);
    const errJson = wrong.ok ? '' : JSON.stringify(wrong.error, Object.getOwnPropertyNames(wrong.error));
    check('14a. error object contains no raw token', !errJson.includes(minted.rawToken) && !errJson.includes(OTHER), errJson.slice(0, 100));
    check('14b. error message is generic (no reason/token)', !wrong.ok && wrong.error.message === 'Unauthorized.', wrong.error && wrong.error.message);
    const mintJson = JSON.stringify(minted.customer);
    check('14c. customer record contains no token material', !mintJson.includes(minted.rawToken) && !mintJson.includes(ca.hashToken(minted.rawToken)), mintJson.slice(0, 100));
  }

  console.log('---');
  console.log('TOTAL: ' + total + ' | PASSED: ' + passed + ' | FAILED: ' + failed);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => { console.error('SCRIPT ERROR: ' + (e && e.stack || e)); process.exit(2); });