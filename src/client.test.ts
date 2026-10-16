import { describe, expect, it, vi } from 'vitest';
import { LockallyClient, LockallyError, fileToAttachment } from './client.js';
import { isSecretKey, resolveToken } from './auth.js';

function mockFetch(responses: Array<{ status?: number; json?: unknown }>) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  let i = 0;
  const impl = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const r = responses[Math.min(i++, responses.length - 1)];
    const status = r.status ?? 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => r.json ?? {},
    } as Response;
  });
  return { impl: impl as unknown as typeof fetch, calls };
}

describe('LockallyClient.send', () => {
  it('POSTs /v1/send with bearer token, idempotency key, and JSON body', async () => {
    const { impl, calls } = mockFetch([
      { status: 202, json: { id: 'm_1', message_id: '<x@lockally.com>', status: 'queued' } },
    ]);
    const client = new LockallyClient(
      { getToken: async () => 'tok_short_lived', baseUrl: 'https://api.lockally.com' },
      impl,
    );

    const res = await client.send({ from: 'a@acme.com', to: ['b@example.com'], subject: 'hi', text: 'yo' });

    expect(res.id).toBe('m_1');
    expect(calls).toHaveLength(1);
    const { url, init } = calls[0];
    expect(url).toBe('https://api.lockally.com/v1/send');
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer tok_short_lived');
    expect(headers['Idempotency-Key']).toMatch(/^lk-/);
    expect(JSON.parse(init.body as string)).toMatchObject({ from: 'a@acme.com', to: ['b@example.com'], text: 'yo' });
  });

  it('throws LockallyError with status + detail on non-2xx', async () => {
    const { impl } = mockFetch([{ status: 403, json: { detail: 'insufficient scope: send:write' } }]);
    const client = new LockallyClient({ getToken: async () => 't' }, impl);
    await expect(client.send({ from: 'a@a.com', to: ['b@b.com'], text: 'x' })).rejects.toMatchObject({
      name: 'LockallyError',
      status: 403,
      detail: 'insufficient scope: send:write',
    });
    expect(LockallyError).toBeTruthy();
  });
});

describe('LockallyClient reads', () => {
  it('listContacts appends ?q= and unwraps data', async () => {
    const { impl, calls } = mockFetch([{ json: { data: [{ id: 'c1', email: 'x@y.com', name: 'X' }] } }]);
    const client = new LockallyClient({ getToken: async () => 't' }, impl);
    const contacts = await client.listContacts('ac me');
    expect(contacts).toHaveLength(1);
    expect(calls[0].url).toBe('https://api.lockally.com/v1/contacts?q=ac%20me');
  });

  it('listTemplates unwraps data', async () => {
    const { impl, calls } = mockFetch([{ json: { data: [{ id: 't1', name: 'Welcome' }] } }]);
    const client = new LockallyClient({ getToken: async () => 't' }, impl);
    const templates = await client.listTemplates();
    expect(templates[0].name).toBe('Welcome');
    expect(calls[0].url).toBe('https://api.lockally.com/v1/templates');
  });

  it('uses a custom baseUrl (proxy) and omits Authorization when no token', async () => {
    const { impl, calls } = mockFetch([{ json: { data: [] } }]);
    const client = new LockallyClient({ baseUrl: 'https://app.example.com/api/lockally/' }, impl);
    await client.listContacts();
    expect(calls[0].url).toBe('https://app.example.com/api/lockally/v1/contacts');
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBeUndefined();
  });
});

describe('auth guard', () => {
  it('rejects a secret key returned to the browser', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const token = await resolveToken(async () => 'lk_live_abcd1234_secret');
    expect(token).toBeUndefined();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
    expect(isSecretKey('lk_test_x')).toBe(true);
    expect(isSecretKey('tok_x')).toBe(false);
  });
});

describe('fileToAttachment', () => {
  it('base64-encodes file bytes', async () => {
    const file = new File([new Uint8Array([66, 89, 84, 69, 83])], 'invoice.pdf', { type: 'application/pdf' });
    const att = await fileToAttachment(file);
    expect(att.filename).toBe('invoice.pdf');
    expect(att.content_type).toBe('application/pdf');
    expect(att.content_base64).toBe(btoa('BYTES'));
  });
});
