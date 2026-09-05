// ---------------------------------------------------------------------------
// Phase 5C-3: Request-scoped authentication context (middleware primitive).
//
// This module is a THIN, REUSABLE wrapper around server-lib/customer-access.js.
// It does NOT reimplement any token logic (generation, hashing, bearer parsing,
// token lookup, expiry/revocation validation, customer lookup) — it calls the
// 5C-2 helper authenticateBearerToken().
//
// Responsibilities:
//   - Extract ONLY `Authorization: Bearer <management-token>`.
//   - Return a request-scoped authenticated context: { authenticated, customer,
//     token } — WITHOUT the raw bearer token.
//   - After SUCCESSFUL authentication only, best-effort update last_seen_at
//     (telemetry; must never convert a valid credential into an auth failure).
//   - Distinguish invalid-credential (401, generic) from infrastructure
//     failure (500-class), without leaking internal details.
//
// Explicitly NOT implemented here (Phase 5C-4+):
//   - ownership enforcement (must never reference websiteId/orderId/
//     order_reference as an authorization mechanism).
//   - cookie / query-param / URL-fragment / localStorage authentication.
//   - any use of client-supplied customer_id as authorization.
//
// Context is request-scoped. There is NO module-level mutable auth state.
// ---------------------------------------------------------------------------

const { authenticateBearerToken, touchLastSeen } = require('./customer-access');

function requestedAuthHeader(req) {
  if (!req || typeof req.headers !== 'object' || req.headers === null) {
    return undefined;
  }
  return req.headers.authorization || req.headers.Authorization || undefined;
}

// Authenticates the current request and returns a request-scoped context.
//
// Success → { authenticated: true, customer, token }  (no raw token).
// Invalid credential → throws the generic 401 error from customer-access.js.
// Infrastructure failure → rethrown as-is (500-class); no internal details
// are included in the error message.
async function authenticateRequest(req, deps = {}) {
  const auth = deps.authenticateBearerToken || authenticateBearerToken;
  const touch = deps.touchLastSeen || touchLastSeen;

  const result = await auth(requestedAuthHeader(req), deps);
  // result = { customer, token } after successful authentication.

  // last_seen_at is telemetry/metadata only. 5C-2 contract decision:
  // BEST-EFFORT — a failed touch (DB hiccup) must never turn a valid
  // credential into an authorization failure. Its failure is swallowed by
  // the caller of this helper (never propagated to authorization).
  try {
    await touch(result.customer.id, deps);
  } catch {
    // Last-seen telemetry must not break authentication correctness.
  }

  return {
    authenticated: true,
    customer: result.customer,
    // Expose the token RECORD (id / expiry / revocation metadata) for future
    // ownership/management use — never the raw bearer credential.
    token: result.token
  };
}

module.exports = {
  authenticateRequest,
  requestedAuthHeader
};