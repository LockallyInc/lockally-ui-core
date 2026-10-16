<!-- lockally-brand-header -->
<p align="center">
  <a href="https://lockally.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/LockallyInc/community/main/brand/lockup-dark.png">
      <img alt="Lockally" src="https://raw.githubusercontent.com/LockallyInc/community/main/brand/lockup-light.png" width="260">
    </picture>
  </a>
</p>
<!-- /lockally-brand-header -->

# @lockally/ui-core

Framework-agnostic browser client that powers the Lockally UI component libraries
([`@lockally/react`](https://www.npmjs.com/package/@lockally/react),
`@lockally/vue`, `@lockally/svelte`, `@lockally/angular`). You usually don't install
this directly — install the package for your framework.

## Browser-safe auth

A secret `lk_live_` / `lk_test_` key must **never** ship in browser code. Give the
client a `getToken()` callback that returns a **short-lived bearer minted by your
backend** (which holds the secret key):

```ts
import { LockallyClient } from '@lockally/ui-core';

const client = new LockallyClient({
  getToken: async () => {
    const res = await fetch('/api/lockally-token'); // your backend
    const { token } = await res.json();
    return token; // e.g. a scoped, short-lived bearer
  },
});
```

Or point `baseUrl` at your own proxy that adds credentials server-side and pass no token:

```ts
const client = new LockallyClient({ baseUrl: '/api/lockally' });
```

A secret key returned to the browser is refused with a console error — return a
short-lived token instead.

## API

- `client.send(message)` → `POST /v1/send` (adds an `Idempotency-Key`).
- `client.listContacts(q?)` → `GET /v1/contacts` (search by name/email/company).
- `client.listTemplates()` → `GET /v1/templates`.
- `fileToAttachment(file)` → `{ filename, content_type, content_base64 }` for a browser `File`.

## License

MIT © Lockally
