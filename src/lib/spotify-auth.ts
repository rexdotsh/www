import { createHmac, timingSafeEqual } from "node:crypto";
import { env, waitUntil } from "cloudflare:workers";
import { notify } from "@/lib/notify";

const AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const SCOPES = "user-read-currently-playing user-read-recently-played";

const KV_ACCESS = "spotify:token";
const KV_REFRESH = "spotify:refresh";
const KV_ALERT = "spotify:alert";

const DAY_MS = 86_400_000;
// Refresh tokens die 6 months after authorization; refreshing doesn't extend it.
// https://developer.spotify.com/blog/2026-06-18-refresh-token-expiration
const REFRESH_LIFETIME_MS = 182 * DAY_MS;
const WARN_BEFORE_MS = 30 * DAY_MS;
const STATE_TTL_MS = 10 * 60_000;
const ALERT_TTL = 7 * 86_400;

interface AccessToken {
  access_token: string;
  expires_at: number;
}

interface RefreshRecord {
  // Unknown for the seed token from the env var.
  authorized_at: number | null;
  refresh_token: string;
}

interface TokenResponse {
  access_token?: string;
  error?: string;
  expires_in?: number;
  refresh_token?: string;
}

const kv = () => env.SPOTIFY_TOKENS;

async function tokenRequest(
  params: Record<string, string>,
  signal: AbortSignal
) {
  const basic = Buffer.from(
    `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
    signal,
  });
  const data = (await response.json().catch(() => ({}))) as TokenResponse;
  return { ok: response.ok, status: response.status, data };
}

// Caches the access token from either grant; returns it or null if malformed.
function cacheAccessToken(data: TokenResponse) {
  if (!(data.access_token && typeof data.expires_in === "number")) {
    return null;
  }
  const ttl = Math.max(data.expires_in - 60, 1);
  const token: AccessToken = {
    access_token: data.access_token,
    expires_at: Date.now() + ttl * 1000,
  };
  waitUntil(
    kv()
      .put(KV_ACCESS, JSON.stringify(token), { expirationTtl: ttl })
      .catch(() => undefined)
  );
  return token.access_token;
}

async function alertOnce(
  kind: "expired" | "expiring",
  origin: string,
  expiresAt = 0
) {
  if (
    (await kv()
      .get(KV_ALERT)
      .catch(() => kind)) === kind
  ) {
    return;
  }
  await kv().put(KV_ALERT, kind, { expirationTtl: ALERT_TTL });
  const link = env.SPOTIFY_CONNECT_SECRET
    ? `${origin}/api/spotify/connect?key=${encodeURIComponent(env.SPOTIFY_CONNECT_SECRET)}`
    : "(set SPOTIFY_CONNECT_SECRET first)";
  await notify(
    kind === "expired"
      ? `spotify refresh token is dead, the music widget is off.\n\nreconnect: ${link}`
      : `spotify refresh token expires around ${new Date(expiresAt).toDateString()}.\n\nreconnect early: ${link}`
  );
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.byteLength === y.byteLength && timingSafeEqual(x, y);
}

export function isConnectKey(key: string | null) {
  const secret = env.SPOTIFY_CONNECT_SECRET;
  return Boolean(key && secret) && safeEqual(key as string, secret);
}

// OAuth state is a signed timestamp, so it needs no storage. KV is eventually
// consistent and a put-then-get across the redirect was failing on retries.
const signState = (issuedAt: string) =>
  createHmac("sha256", env.SPOTIFY_CONNECT_SECRET)
    .update(issuedAt)
    .digest("base64url");

function isValidState(state: string) {
  const [issuedAt, sig] = state.split(".");
  return Boolean(
    issuedAt &&
      sig &&
      Date.now() - Number.parseInt(issuedAt, 36) < STATE_TTL_MS &&
      safeEqual(sig, signState(issuedAt))
  );
}

export async function getAccessToken(origin: string, signal: AbortSignal) {
  const cached = await kv()
    .get<AccessToken>(KV_ACCESS, "json")
    .catch(() => null);
  if (cached && Date.now() < cached.expires_at) {
    return cached.access_token;
  }

  const record =
    (await kv()
      .get<RefreshRecord>(KV_REFRESH, "json")
      .catch(() => null)) ??
    (env.SPOTIFY_REFRESH_TOKEN
      ? { refresh_token: env.SPOTIFY_REFRESH_TOKEN, authorized_at: null }
      : null);
  if (!record) {
    throw new Error("Missing Spotify refresh token");
  }

  const { ok, status, data } = await tokenRequest(
    { grant_type: "refresh_token", refresh_token: record.refresh_token },
    signal
  );
  if (!ok) {
    if (data.error === "invalid_grant") {
      waitUntil(alertOnce("expired", origin));
    }
    throw new Error(`Failed to refresh access token (${status})`);
  }
  const token = cacheAccessToken(data);
  if (!token) {
    throw new Error("Spotify returned an invalid access token");
  }

  if (record.authorized_at) {
    const expiresAt = record.authorized_at + REFRESH_LIFETIME_MS;
    if (Date.now() > expiresAt - WARN_BEFORE_MS) {
      waitUntil(alertOnce("expiring", origin, expiresAt));
    }
  }
  return token;
}

export function beginConnect(origin: string) {
  const issuedAt = Date.now().toString(36);
  const state = `${issuedAt}.${signState(issuedAt)}`;
  const params = new URLSearchParams({
    client_id: env.SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: `${origin}/api/spotify/callback`,
    scope: SCOPES,
    state,
  });
  return `${AUTHORIZE_URL}?${params}`;
}

export async function finishConnect(
  origin: string,
  code: string,
  state: string,
  signal: AbortSignal
) {
  if (!isValidState(state)) {
    throw new Error("Invalid or expired state");
  }
  const { ok, status, data } = await tokenRequest(
    {
      grant_type: "authorization_code",
      code,
      redirect_uri: `${origin}/api/spotify/callback`,
    },
    signal
  );
  if (!(ok && data.refresh_token)) {
    throw new Error(`Code exchange failed (${status} ${data.error ?? ""})`);
  }

  const authorizedAt = Date.now();
  const record: RefreshRecord = {
    refresh_token: data.refresh_token,
    authorized_at: authorizedAt,
  };
  cacheAccessToken(data);
  await Promise.all([
    kv().put(KV_REFRESH, JSON.stringify(record)),
    kv().delete(KV_ALERT),
  ]);

  // Awaited on purpose: this is a one-off admin action and the DM is the
  // confirmation, so it should land before the "connected" page does.
  const expiresAt = new Date(authorizedAt + REFRESH_LIFETIME_MS);
  await notify(`spotify reconnected. good until ~${expiresAt.toDateString()}.`);
  return expiresAt;
}
