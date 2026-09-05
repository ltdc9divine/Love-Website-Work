// ---------------------------------------------------------------------------
// Phase 5C-2: Customer management capability-token infrastructure (Option D)
//
// Security invariants (MUST hold for every change to this file):
//   - The RAW management token NEVER reaches the database, logs, analytics,
//     error objects, or any persistence layer. Only its SHA-256 hash is stored.
//   - Tokens are 256-bit cryptographically random (crypto.randomBytes).
//     Math.random() and UUID-as-bearer are forbidden.
//   - websiteId / orderId / order_reference are NEVER accepted as
//     authentication or as a fallback for a missing/invalid token.
//   - Authorization: Bearer <token> is the only transport in this phase.
//     No cookies, no query-parameter tokens.
//   - TTL is exactly 180 days from issuance. Validation NEVER slides or
//     silently extends expires_at.
//   - Revocation sets revoked_at; records are never deleted to revoke.
//   - External callers receive a generic unauthorized error; the detailed
//     reason (missing/malformed/invalid/expired/revoked) stays internal.
//
// Preview capabilities and public slug access are separate concerns and are
// deliberately NOT implemented here (Phase 5C-5 scope).
// ---------------------------------------------------------------------------

const crypto = require('crypto');
const { supabaseRequest } = require('./supabase');

const TOKEN_TTL_DAYS = 180;
const TOKEN_TTL_MS = TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

// base64url of 32 random bytes -> 43 characters, URL-safe, high alphabet.
const RAW_TOKEN_LENGTH = 43;
const RAW_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

// Internal classification only. Never exposed to external callers as-is.
const AUTH_FAILURE_REASONS = Object.freeze({
  MISSING: 'missing_token',
  MALFORMED: 'malformed_token',
  INVALID: 'invalid_token',
  EXPIRED: 'expired_token',
  REVOKED: 'revoked_token'
});

function sha256Hex(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function generateRawToken() {
  // 256 bits of CSPRNG entropy; base64url alphabet is URL/header safe.
  return crypto.randomBytes(32).toString('base64url');
}

function isValidTokenFormat(rawToken) {
  return typeof rawToken === 'string' && RAW_TOKEN_PATTERN.test(rawToken);
}

// Constant-time comparison of two hashes (both must be sha256 hex).
function hashesMatch(hashA, hashB) {
  if (typeof hashA !== 'string' || typeof hashB !== 'string') {
    return false;
  }
  const a = Buffer.from(hashA, 'utf8');
  const b = Buffer.from(hashB, 'utf8');
  if (a.length !== b.length) {
    // Length difference is not a secret (hashes are fixed-length in practice);
    // timingSafeEqual requires equal lengths.
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

function unauthorizedError() {
  // Generic boundary error: no reason, no token material, no record details.
  const error = new Error('Unauthorized.');
  error.statusCode = 401;
  error.code = 'UNAUTHORIZED';
  return error;
}

function extractBearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== 'string') {
    return { ok: false, reason: AUTH_FAILURE_REASONS.MISSING };
  }
  const trimmed = authorizationHeader.trim();
  if (!trimmed) {
    return { ok: false, reason: AUTH_FAILURE_REASONS.MISSING };
  }
  const match = /^Bearer\s+(\S+)$/i.exec(trimmed);
  if (!match) {
    return { ok: false, reason: AUTH_FAILURE_REASONS.MALFORMED };
  }
  return { ok: true, rawToken: match[1] };
}

// Creates the customer AND its first management capability token.
// The database receives token_hash ONLY. The raw token is returned once to
// the caller so it can be delivered to the customer (e.g. checkout link).
async function createCustomerWithToken(deps = {}) {
  const db = deps.supabaseRequest || supabaseRequest;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_TTL_MS); // exactly 180 days

  const customerRows = await db({
    path: '/rest/v1/customers',
    method: 'POST',
    body: { last_seen_at: now.toISOString() }
  });
  const customer = Array.isArray(customerRows) ? customerRows[0] : null;
  if (!customer || !customer.id) {
    throw new Error('Unable to create customer record.');
  }

  const rawToken = generateRawToken();
  try {
    const tokenRows = await db({
      path: '/rest/v1/customer_access_tokens',
      method: 'POST',
      body: {
        customer_id: customer.id,
        token_hash: sha256Hex(rawToken),
        expires_at: expiresAt.toISOString()
      }
    });
    const tokenRecord = Array.isArray(tokenRows) ? tokenRows[0] : null;
    if (!tokenRecord || !tokenRecord.id) {
      throw new Error('Unable to create token record.');
    }
    return { customer, rawToken };
  } catch (error) {
    // Compensating cleanup: remove the orphan customer we just created so a
    // failed mint cannot leave an ownerless customer row behind. Only the
    // single row this call created is removed.
    try {
      await db({
        path: `/rest/v1/customers?id=eq.${encodeURIComponent(customer.id)}`,
        method: 'DELETE'
      });
    } catch {
      // Cleanup failure must not mask the original error.
    }
    throw error;
  }
}

// Resolves a customer from a raw management token.
// Returns { ok: true, customer, token } or { ok: false, reason } where reason
// is an internal AUTH_FAILURE_REASONS value (never sent to external callers).
async function resolveManagementToken(rawToken, deps = {}) {
  const db = deps.supabaseRequest || supabaseRequest;

  if (!isValidTokenFormat(rawToken)) {
    return { ok: false, reason: AUTH_FAILURE_REASONS.MALFORMED };
  }

  const tokenHash = sha256Hex(rawToken);
  const rows = await db({
    path: `/rest/v1/customer_access_tokens?token_hash=eq.${encodeURIComponent(tokenHash)}&select=*`,
    method: 'GET'
  });
  const token = Array.isArray(rows) ? rows[0] : null;

  if (!token) {
    return { ok: false, reason: AUTH_FAILURE_REASONS.INVALID };
  }

  if (token.revoked_at) {
    return { ok: false, reason: AUTH_FAILURE_REASONS.REVOKED };
  }

  const now = new Date();
  const expiresAt = token.expires_at ? new Date(token.expires_at) : null;
  if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= now.getTime()) {
    return { ok: false, reason: AUTH_FAILURE_REASONS.EXPIRED };
  }

  // Defense-in-depth: verify the stored hash matches what we derived, even
  // though the DB equality filter already matched. Constant-time compare.
  if (!hashesMatch(String(token.token_hash || ''), tokenHash)) {
    return { ok: false, reason: AUTH_FAILURE_REASONS.INVALID };
  }

  const customerRows = await db({
    path: `/rest/v1/customers?id=eq.${encodeURIComponent(token.customer_id)}&select=*`,
    method: 'GET'
  });
  const customer = Array.isArray(customerRows) ? customerRows[0] : null;
  if (!customer) {
    // Token points at a customer that no longer exists.
    return { ok: false, reason: AUTH_FAILURE_REASONS.INVALID };
  }

  return { ok: true, customer, token };
}

// Full authentication from an Authorization header value.
// Throws the GENERIC unauthorized error on every failure class. The detailed
// internal reason is attached non-enumerably so server code can branch while
// the error message/JSON stays identical for missing/malformed/invalid/
// expired/revoked.
async function authenticateBearerToken(authorizationHeader, deps = {}) {
  const extracted = extractBearerToken(authorizationHeader);
  if (!extracted.ok) {
    throw unauthorizedWithReason(extracted.reason);
  }

  let resolved;
  try {
    resolved = await resolveManagementToken(extracted.rawToken, deps);
  } catch (error) {
    // Infrastructure failure (DB unavailable etc.) is a 500-class problem,
    // deliberately NOT converted into an authorization answer.
    throw error;
  }

  if (!resolved.ok) {
    throw unauthorizedWithReason(resolved.reason);
  }

  return { customer: resolved.customer, token: resolved.token };
}

function unauthorizedWithReason(reason) {
  const error = unauthorizedError();
  Object.defineProperty(error, 'internalReason', {
    value: reason,
    enumerable: false,
    writable: false
  });
  return error;
}

// Updates last_seen_at for a customer that was JUST successfully
// authenticated. Never called on failed authentication. Skips the write when
// the stored value is already current (conditional PATCH), avoiding a write
// per request.
async function touchLastSeen(customerId, deps = {}) {
  const db = deps.supabaseRequest || supabaseRequest;
  if (!customerId) {
    return false;
  }
  const nowIso = new Date().toISOString();
  const updated = await db({
    path: `/rest/v1/customers?id=eq.${encodeURIComponent(customerId)}&last_seen_at=lt.${encodeURIComponent(nowIso)}`,
    method: 'PATCH',
    body: { last_seen_at: nowIso }
  });
  return Array.isArray(updated) && updated.length > 0;
}

// Revokes a token by record id. Revocation only SETS revoked_at; the record
// is never deleted. Idempotent: revoking an already-revoked token is a no-op.
async function revokeToken(tokenId, deps = {}) {
  const db = deps.supabaseRequest || supabaseRequest;
  if (!tokenId) {
    return false;
  }
  const nowIso = new Date().toISOString();
  const updated = await db({
    path: `/rest/v1/customer_access_tokens?id=eq.${encodeURIComponent(tokenId)}&revoked_at=is.null`,
    method: 'PATCH',
    body: { revoked_at: nowIso }
  });
  return Array.isArray(updated) && updated.length > 0;
}

module.exports = {
  TOKEN_TTL_DAYS,
  AUTH_FAILURE_REASONS,
  generateRawToken,
  hashToken: sha256Hex,
  isValidTokenFormat,
  hashesMatch,
  extractBearerToken,
  createCustomerWithToken,
  resolveManagementToken,
  authenticateBearerToken,
  touchLastSeen,
  revokeToken
};
