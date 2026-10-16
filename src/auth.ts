// Browser-safe auth for the Lockally UI components.
//
// A secret `lk_live_` / `lk_test_` key must NEVER ship in browser code. The
// components authenticate with a short-lived bearer token that YOUR backend mints
// (it holds the secret key), supplied through a `getToken()` callback — mirroring
// the mobile SDK's BackendTokenProvider. Alternatively, point `baseUrl` at your own
// proxy that injects the key server-side and pass no token at all.

/** Returns a short-lived bearer token (minted by your backend). May be async. */
export type GetToken = () => string | Promise<string>;

export interface LockallyAuth {
  /**
   * Async callback returning a short-lived bearer token from your backend.
   * Preferred. If omitted, requests are sent without an Authorization header
   * (only valid when `baseUrl` points at a proxy that adds credentials).
   */
  getToken?: GetToken;
  /**
   * Base URL for API calls. Default `https://api.lockally.com`. Set this to your
   * own proxy (e.g. `/api/lockally`) if it forwards to Lockally with the secret key.
   */
  baseUrl?: string;
}

const DEFAULT_BASE_URL = 'https://api.lockally.com';

/** True for a secret Lockally API key that must never reach the browser. */
export function isSecretKey(value: string): boolean {
  return /^lk_(live|test)_/.test(value);
}

/**
 * Resolve the auth config, guarding against a secret key being passed as a token.
 * A caller may pass a literal token string as `getToken` for convenience in trusted
 * (non-browser) contexts — but a secret key there is refused loudly.
 */
export function resolveBaseUrl(baseUrl?: string): string {
  return (baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
}

export async function resolveToken(getToken?: GetToken): Promise<string | undefined> {
  if (!getToken) return undefined;
  const token = await getToken();
  if (token && isSecretKey(token)) {
    // Loud, non-fatal: a secret key in the browser is a credential leak. Strip it
    // rather than transmit it from client code.
    // eslint-disable-next-line no-console
    console.error(
      '[lockally] A secret API key (lk_live_/lk_test_) was returned to a browser ' +
        'component and has been rejected. Return a short-lived token from your backend ' +
        'instead — see https://lockally.com/developers/sdks.',
    );
    return undefined;
  }
  return token || undefined;
}
