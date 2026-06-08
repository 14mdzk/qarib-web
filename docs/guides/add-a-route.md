# Guide — Add a Public Browse Route

**Audience:** engineer adding a public page under `src/routes/(app)/`. After
this guide, you will have a server-loaded, Bahasa-first page that reads public
data through Qarib Web's BFF-backed domain services.

Qarib Web v1 has no end-user auth. Do not add login gates, session redirects,
Bearer injection, favorites/follows, or write flows while following this guide.

## Prerequisites

- A domain exists for the data the page renders. If not, follow
  [`add-a-domain.md`](add-a-domain.md) first.
- The qarib-api runtime endpoint exists in `openapi/upstream.yaml` and
  `src/lib/core/api/endpoints.ts`.
- User-facing copy has Bahasa values in `messages/id.json`.

## Related Docs

- [`docs/architecture/overview.md`](../architecture/overview.md)
- [`docs/architecture/layer-rules.md`](../architecture/layer-rules.md)
- [`.claude/rules/api-contract.md`](../../.claude/rules/api-contract.md)
- [`.claude/rules/i18n.md`](../../.claude/rules/i18n.md)
- [`.claude/rules/observability.md`](../../.claude/rules/observability.md)
- [`docs/decisions/0009-public-no-auth-web-v1.md`](../decisions/0009-public-no-auth-web-v1.md)
- [`docs/decisions/0012-read-through-bff.md`](../decisions/0012-read-through-bff.md)

## Where the Route Goes

| Route group | Use for |
|---|---|
| `src/routes/(marketing)/` | Public landing/marketing pages, currently `/` |
| `src/routes/(app)/` | Public Qarib browse pages |
| `src/routes/api/upstream/` | BFF endpoints called by `core/api`, not user-visible HTML |
| `src/routes/api/tiles/` | Map tile proxy endpoints |

Current public browse examples: `/peta`, `/kajian/[id]`, `/tempat/[id]`,
`/ustadz/[id]`, and `/tema/[id]`.

## 1. Create the Files

```text
src/routes/(app)/example/
├── +page.server.ts        load function, server-side first
├── +page.svelte           rendered output
└── +layout.svelte         optional feature shell, e.g. filters/tabs
```

If the feature needs context-scoped UI state, put a `+layout.svelte` at the
lowest route segment that owns that state lifetime.

## 2. `+page.server.ts` — Load Public Data

The load function runs on the server first. It parses untrusted URL/search
params, then calls a domain service. The service goes through `core/api`, which
targets same-origin `/api/upstream` for public reads from the qarib-api runtime.

```ts
// src/routes/(app)/example/+page.server.ts
import type { PageServerLoad } from './$types';
import { exampleListQuerySchema, exampleService } from '$domains/example';

export const load: PageServerLoad = async ({ url }) => {
	const query = exampleListQuerySchema.parse({
		search: url.searchParams.get('q') ?? undefined,
		cursor: url.searchParams.get('cursor') ?? undefined,
		limit: Number(url.searchParams.get('limit')) || 20
	});

	const data = await exampleService.list(query);
	return { query, data };
};
```

Three things to notice:

- **Zod parse URL/search params.** Browser-provided values are untrusted.
- **No route-level `fetch`.** Product reads go through the domain service and
  `core/api`.
- **No auth branch.** `(app)` routes are public in v1.

## 3. `+page.svelte` — Render

Server data arrives as the `data` prop. Hydrate it into svelte-query where the
domain exposes query bindings, so navigation and refresh behavior stay
consistent.

```svelte
<!-- src/routes/(app)/example/+page.svelte -->
<script lang="ts">
	import { ExampleList, createExampleStore, useExampleList } from '$domains/example';
	import { m } from '$core/i18n';

	let { data } = $props();

	createExampleStore();
	const list = useExampleList(data.query);
</script>

<svelte:head>
	<title>{m.example_page_title()}</title>
</svelte:head>

<h1>{m.example_page_title()}</h1>
<ExampleList />
```

All user-facing strings flow through Paraglide. Add keys such as
`example_page_title` to `messages/id.json`.

## 4. Locale Handling

Bahasa Indonesia (`id`) is the only v1 locale. Do not add a locale switcher for
normal browse-route work.

If a route needs the locale value, read it from root layout data with the
runes-era `$app/state` API:

```ts
import { page } from '$app/state';

const locale = page.data.locale;
```

Do not use `$page` from `$app/stores`; this repo uses runes-era patterns.

## 5. Errors

- Throw SvelteKit `error(status, message)` from the load when route data is
  missing or invalid.
- Let `core/api` classify qarib-api runtime failures as `ApiError`.
- Do not log raw request, environment, or response objects from the route. Use
  structured logger fields when additional context is useful.

## 6. Tests

- **Vitest unit** for pure helpers, schemas, services, query builders, or
  stores.
- **Playwright e2e** under `e2e/<feature>.e2e.ts` when the route is a critical
  user path.

```ts
// e2e/example.e2e.ts
import { expect, test } from '@playwright/test';

test('example list renders', async ({ page }) => {
	await page.goto('/example');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
```

## Checklist Before Opening the PR

- [ ] Route lives under the right group: `(marketing)` for landing, `(app)` for
  public browse, `api/` for BFF/proxy routes.
- [ ] `+page.server.ts` parses untrusted input with Zod.
- [ ] Product reads go through a domain service and `core/api`.
- [ ] Browser never calls the qarib-api runtime directly.
- [ ] No login/session/Bearer/write behavior added for v1.
- [ ] All user-facing strings live in `messages/id.json`.
- [ ] Lint passes (`bun run lint`); typecheck passes (`bun run check`).
- [ ] Critical route flow has an e2e spec.
