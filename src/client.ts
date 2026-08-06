import { type LockallyAuth, resolveBaseUrl, resolveToken } from './auth.js';
import type { Contact, SendMessage, SendResult, Template } from './types.js';

export class LockallyError extends Error {
  readonly status: number;
  readonly detail?: string;
  constructor(status: number, message: string, detail?: string) {
    super(message);
    this.name = 'LockallyError';
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Minimal browser client the UI components call. Framework-agnostic — React/Vue/
 * Svelte/Angular packages all wrap this. Auth is a short-lived token from your
 * backend (never a secret key); see {@link LockallyAuth}.
 */
export class LockallyClient {
  private readonly auth: LockallyAuth;
  private readonly fetchImpl: typeof fetch;

  constructor(auth: LockallyAuth = {}, fetchImpl?: typeof fetch) {
    this.auth = auth;
    // Bind so a global fetch keeps its `this`; injectable for tests.
    this.fetchImpl = fetchImpl ?? ((...a: Parameters<typeof fetch>) => fetch(...a));
  }

  /** Send an email. Generates an Idempotency-Key per call. */
  async send(message: SendMessage): Promise<SendResult> {
    return this.request<SendResult>('POST', '/v1/send', message, {
      'Idempotency-Key': idempotencyKey(),
    });
  }

  /** Search contacts. `q` matches name / email / company. */
  async listContacts(q?: string): Promise<Contact[]> {
    const path = q ? `/v1/contacts?q=${encodeURIComponent(q)}` : '/v1/contacts';
    const body = await this.request<{ data: Contact[] }>('GET', path);
    return body.data ?? [];
  }

  /** List stored templates. */
  async listTemplates(): Promise<Template[]> {
    const body = await this.request<{ data: Template[] }>('GET', '/v1/templates');
    return body.data ?? [];
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...extraHeaders,
    };
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const token = await resolveToken(this.auth.getToken);
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await this.fetchImpl(`${resolveBaseUrl(this.auth.baseUrl)}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      let detail: string | undefined;
      try {
        const problem = (await res.json()) as { detail?: string; title?: string };
        detail = problem.detail ?? problem.title;
      } catch {
        /* non-JSON error body */
      }
      throw new LockallyError(res.status, `Lockally request failed (${res.status})`, detail);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }
}

/** Read a browser File into a Lockally attachment (base64 of raw bytes). */
export async function fileToAttachment(file: File) {
  const buf = await file.arrayBuffer();
  return {
    filename: file.name || 'attachment',
    content_type: file.type || 'application/octet-stream',
    content_base64: bytesToBase64(new Uint8Array(buf)),
  };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function idempotencyKey(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return `lk-${c.randomUUID().replace(/-/g, '')}`;
  return `lk-${Date.now().toString(16)}${Math.floor(Math.random() * 1e16).toString(16)}`;
}
