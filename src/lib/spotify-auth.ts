import { timingSafeEqual } from "node:crypto";
import { env, waitUntil } from "cloudflare:workers";
import { notify } from "@/lib/notify";

const SPOTIFY_ACCOUNTS = {
  AUTHORIZE: "https://accounts.spotify.com/authorize",
  TOKEN: "https://accounts.spotify.com/api/token",
} as const;

const SCOPES = "user-read-currently-playing user-read-recently-played";

export const KV = {
  ACCESS: "spotify:token",
  REFRESH: "spotify:refresh",
  STATE: "spotify:state",
  ALERT: "spotify:alert",
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;
// Refresh tokens die 6 months after the user authorized the app, and refreshing
// an access token does not extend that. https://developer.spotify.com/blog/2026-06-18-refresh-token-expiration
export const REFRESH_LIFETIME_MS = 182 * DAY_MS;
const WARN_BEFORE_MS = 30 * DAY_MS;
const STATE_TTL = 10 * 60;
const ALERT_TTL = 7 * 24 * 60 * 60;

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

function basicAuth() {
  const clientId = env.SPOTIFY_CLIENT_ID;
  const clientSecret = env.SPOTIFY_CLIENT_SECRET;
  if (!(clientId && clientSecret)) {
    throw new Error("Missing Spotify client credentials");
  }
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

async function tokenRequest(
  params: Record<string, string>,
  signal: AbortSignal
) {
  const response = await fetch(SPOTIFY_ACCOUNTS.TOKEN, {
    method: "POST",
    headers: {
      Authorization: basicAuth(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
    signal,
  });
  const data = (await response.json().catch(() => ({}))) as TokenResponse;
  return { ok: response.ok, status: response.status, data };
}

function callbackUrl(origin: string) {
  return `${origin}/api/spotify/callback`;
}

function connectUrl(origin: string) {
  const secret = env.SPOTIFY_CONNECT_SECRET;
  return secret
    ? `${origin}/api/spotify/connect?key=${encodeURIComponent(secret)}`
    : "(set SPOTIFY_CONNECT_SECRET to enable the reconnect link)";
}

export function isConnectKey(key: string | null) {
  const secret = env.SPOTIFY_CONNECT_SECRET;
  if (!(key && secret)) {
    return false;
  }
  const a = Buffer.from(key);
  const b = Buffer.from(secret);
  return a.byteLength === b.byteLength && timingSafeEqual(a, b);
}

async function alertOnce(
  kind: "expired" | "expiring",
  origin: string,
  expiresAt?: number
) {
  const key = `${KV.ALERT}:${kind}`;
  if (await env.SPOTIFY_TOKENS.get(key).catch(() => null)) {
    return;
  }
  await env.SPOTIFY_TOKENS.put(key, "1", { expirationTtl: ALERT_TTL }).catch(
    () => undefined
  );
  const link = connectUrl(origin);
  await notify(
    kind === "expired"
      ? `spotify refresh token is dead, the music widget is off.\n\nreconnect: ${link}`
      : `spotify refresh token expires around ${new Date(expiresAt ?? 0).toDateString()}.\n\nreconnect early: ${link}`
  );
}

async function getRefreshRecord(): Promise<RefreshRecord | null> {
  const stored = await env.SPOTIFY_TOKENS.get<RefreshRecord>(
    KV.REFRESH,
    "json"
  ).catch(() => null);
  if (stored?.refresh_token) {
    return stored;
  }
  return env.SPOTIFY_REFRESH_TOKEN
    ? { refresh_token: env.SPOTIFY_REFRESH_TOKEN, authorized_at: null }
    : null;
}

export async function getAccessToken(origin: string, signal: AbortSignal) {
  const cached = await env.SPOTIFY_TOKENS.get<AccessToken>(
    KV.ACCESS,
    "json"
  ).catch(() => null);
  if (cached && Date.now() < cached.expires_at) {
    return cached.access_token;
  }

  const record = await getRefreshRecord();
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
  if (!(data.access_token && Number.isFinite(data.expires_in))) {
    throw new Error("Spotify returned an invalid access token");
  }

  const expiresIn = Math.max((data.expires_in as number) - 60, 1);
  const token: AccessToken = {
    access_token: data.access_token,
    expires_at: Date.now() + expiresIn * 1000,
  };
  waitUntil(
    env.SPOTIFY_TOKENS.put(KV.ACCESS, JSON.stringify(token), {
      expirationTtl: expiresIn,
    }).catch(() => undefined)
  );

  if (record.authorized_at) {
    const expiresAt = record.authorized_at + REFRESH_LIFETIME_MS;
    if (Date.now() > expiresAt - WARN_BEFORE_MS) {
      waitUntil(alertOnce("expiring", origin, expiresAt));
    }
  }

  return token.access_token;
}

export async function beginConnect(origin: string) {
  const state = crypto.randomUUID();
  await env.SPOTIFY_TOKENS.put(KV.STATE, state, { expirationTtl: STATE_TTL });
  const url = new URL(SPOTIFY_ACCOUNTS.AUTHORIZE);
  url.search = new URLSearchParams({
    client_id: env.SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: callbackUrl(origin),
    scope: SCOPES,
    state,
  }).toString();
  return url.toString();
}

export async function finishConnect(
  origin: string,
  code: string,
  state: string,
  signal: AbortSignal
) {
  const expected = await env.SPOTIFY_TOKENS.get(KV.STATE);
  if (!expected || expected !== state) {
    throw new Error("State mismatch");
  }
  await env.SPOTIFY_TOKENS.delete(KV.STATE);

  const { ok, status, data } = await tokenRequest(
    {
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl(origin),
    },
    signal
  );
  if (!(ok && data.refresh_token)) {
    throw new Error(
      `Code exchange failed (${status}${data.error ? `: ${data.error}` : ""})`
    );
  }

  const authorizedAt = Date.now();
  const record: RefreshRecord = {
    refresh_token: data.refresh_token,
    authorized_at: authorizedAt,
  };
  await Promise.all([
    env.SPOTIFY_TOKENS.put(KV.REFRESH, JSON.stringify(record)),
    env.SPOTIFY_TOKENS.delete(KV.ACCESS),
    env.SPOTIFY_TOKENS.delete(`${KV.ALERT}:expired`),
    env.SPOTIFY_TOKENS.delete(`${KV.ALERT}:expiring`),
  ]);

  const expiresAt = new Date(authorizedAt + REFRESH_LIFETIME_MS);
  waitUntil(
    notify(`spotify reconnected. good until ~${expiresAt.toDateString()}.`)
  );
  return expiresAt;
}
