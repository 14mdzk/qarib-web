# Guide — Add a Domain

**Audience:** an engineer adding a bounded public browse slice that mirrors a
qarib-api runtime module (e.g. `events`, `places`, `asatidz`, `subject`). After
this guide you will have a domain
folder that exposes a typed service, query keys, a UI store, and components,
all importable as `$domains/<name>`.

**Prerequisites:**

- `core/api`, `core/query`, generated qarib-api runtime types, and the
  read-through BFF are wired.
- The browse endpoint exists in `openapi/upstream.yaml` and the endpoint
  registry.
- v1 domains are public read-only. Content writes and schema ownership belong
  to qarib-cms and qarib-api.

**Related rules:**

- [`.claude/rules/architecture.md`](../../.claude/rules/architecture.md)
- [`.claude/rules/state-management.md`](../../.claude/rules/state-management.md)
- [`.claude/rules/api-contract.md`](../../.claude/rules/api-contract.md)
- [`.claude/rules/i18n.md`](../../.claude/rules/i18n.md)
- [`docs/architecture/layer-rules.md`](../architecture/layer-rules.md)

## 1. Decide the boundary

A domain is **one bounded context** that maps to one qarib-api runtime module.
If you are tempted to put two unrelated slices in one folder, stop — make two
domains. If two domains would share a type or helper, that piece moves to
`shared/` or `core/`. Cross-domain imports are forbidden by
`docs/architecture/layer-rules.md`.

Pick a kebab-case name. We use `example` below.

## 2. Create the folder

```
src/lib/domains/example/
├── schema.ts            types + zod parsers (often re-exporting from $generated)
├── service.ts           the only place api calls happen for this domain
├── queries.ts           svelte-query keys + defineQuery
├── store.svelte.ts      UI state factory (context-scoped)
├── index.ts             public exports — routes import this, not deep paths
└── components/
    └── example-list.svelte
```

The `_template` domain (Phase 3) will be a copy-pasteable starter. Until then,
create the files by hand following this guide.

## 3. `schema.ts` — types at the boundary

Re-export generated types from `$generated/upstream`. Add Zod parsers only at
trust boundaries — URL search params, BFF inbound params, or third-party
inputs — per
[`api-contract.md`](../../.claude/rules/api-contract.md).

```ts
// src/lib/domains/example/schema.ts
import { z } from 'zod';

export const exampleListQuerySchema = z.object({
	search: z.string().trim().optional(),
	cursor: z.string().optional(),
	limit: z.number().int().positive().max(100).default(20)
});

export type ExampleListQuery = z.infer<typeof exampleListQuerySchema>;

export interface Example {
	id: string;
	name: string;
	createdAt: string; // ISO 8601
}
```

Prefer generated qarib-api runtime types over hand-written interfaces. Write
local Zod only for inputs this app receives from a browser.

## 4. `service.ts` — the only api caller for this domain

Every qarib-api runtime read for `example` lives here. No other file in the
domain calls `core/api`. Routes call services, not `core/api`.

```ts
// src/lib/domains/example/service.ts
import { api } from '$core/api';
import type { Example, ExampleListQuery } from './schema';

export const exampleService = {
	list: (q: ExampleListQuery) => api('example.list', q),
	get: (id: string) => api('example.get', { id })
} as const;
```

Do **not** call `fetch(...)` here. Hand-rolled fetch is a code-review block.
Do **not** add create/update/delete service methods for v1 web browse work;
qarib-cms owns writes.

## 5. `queries.ts` — svelte-query bindings

Server state lives in svelte-query, not in the runes store. Define keys and
query builders here so components stay declarative.

```ts
// src/lib/domains/example/queries.ts
import { defineQuery } from '$core/query';
import { exampleService } from './service';
import type { ExampleListQuery } from './schema';

export const exampleKeys = {
	all: ['example'] as const,
	list: (q: ExampleListQuery) => [...exampleKeys.all, 'list', q] as const,
	get: (id: string) => [...exampleKeys.all, 'get', id] as const
};

export const useExampleList = (q: ExampleListQuery) =>
	defineQuery({
		queryKey: exampleKeys.list(q),
		queryFn: () => exampleService.list(q)
	});

export const useExample = (id: string) =>
	defineQuery({
		queryKey: exampleKeys.get(id),
		queryFn: () => exampleService.get(id)
	});
```

Use mutations only if a future accepted ADR adds a web write surface. That is
out of scope for public v1.

## 6. `store.svelte.ts` — UI state factory

UI-only state (filters, selection, modal open/close) lives here. Server data
does **not**. Use the context-DI pattern from
[`state-management.md`](../../.claude/rules/state-management.md). No module
singletons.

```ts
// src/lib/domains/example/store.svelte.ts
import { getContext, setContext } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';

const KEY = Symbol('example-store');

class ExampleStore {
	search = $state('');
	selected = new SvelteSet<string>();

	toggle(id: string) {
		if (this.selected.has(id)) this.selected.delete(id);
		else this.selected.add(id);
	}
}

export function createExampleStore() {
	const store = new ExampleStore();
	setContext(KEY, store);
	return store;
}

export function getExampleStore(): ExampleStore {
	const store = getContext<ExampleStore | undefined>(KEY);
	if (!store) {
		throw new Error('ExampleStore not initialized; call createExampleStore() in a parent layout');
	}
	return store;
}
```

Two non-negotiables:

- Use `SvelteSet` / `SvelteMap` from `svelte/reactivity` for reactive
  collections. Vanilla `Set` / `Map` in `$state` will not trigger updates.
- The factory is instantiated in the **lowest layout that owns its lifetime**
  (typically the feature's `+layout.svelte`).

## 7. `index.ts` — the public surface

Routes and other layers import this file. Deep imports into the domain are a
review block.

```ts
// src/lib/domains/example/index.ts
export * from './schema';
export { exampleService } from './service';
export { exampleKeys, useExample, useExampleList } from './queries';
export { createExampleStore, getExampleStore } from './store.svelte';
export { default as ExampleList } from './components/example-list.svelte';
```

## 8. Components

Domain components live in `domains/example/components/`. They consume the
domain's queries and store; they do not call `core/api` or `fetch` directly.

```svelte
<!-- src/lib/domains/example/components/example-list.svelte -->
<script lang="ts">
	import { useExampleList } from '../queries';
	import { getExampleStore } from '../store.svelte';
	import { m } from '$core/i18n';

	const store = getExampleStore();
	const list = useExampleList({ search: store.search, limit: 20 });
</script>

{#if $list.isLoading}
	<p>{m.example_loading()}</p>
{:else if $list.error}
	<p role="alert">{m.example_error()}</p>
{:else}
	<ul>
		{#each $list.data?.data ?? [] as item (item.id)}
			<li>{item.name}</li>
		{/each}
	</ul>
{/if}
```

All user-facing strings flow through Paraglide
([`i18n.md`](../../.claude/rules/i18n.md)). Add the keys
(`example_loading`, `example_error`, ...) to `messages/id.json`.

## 9. Tests

Co-locate Vitest unit tests next to the unit. Test the store factory by
calling it directly with stub deps; do not mock modules.

```ts
// src/lib/domains/example/store.svelte.test.ts
import { describe, it, expect } from 'vitest';
import { createExampleStore } from './store.svelte';

describe('exampleStore', () => {
	it('toggles selection idempotently', () => {
		const store = createExampleStore();
		store.toggle('a');
		store.toggle('a');
		expect(store.selected.has('a')).toBe(false);
	});
});
```

For HTTP-touching code, use MSW (see
[`testing.md`](../../.claude/rules/testing.md)). For end-to-end coverage of
the feature route, add a `*.e2e.ts` spec under `e2e/`.

## 10. Wire it into a route

See [`add-a-route.md`](add-a-route.md) for the route side.

## Checklist before opening the PR

- [ ] Folder under `src/lib/domains/<name>/` with the canonical files.
- [ ] No deep imports from outside the domain — only `index.ts`.
- [ ] No cross-domain imports (`domains/<X>` does not import `domains/<Y>`).
- [ ] Store uses `SvelteMap` / `SvelteSet`; no module-singleton.
- [ ] Service is the only `core/api` caller in the domain.
- [ ] Domain exposes public read methods only unless a new ADR adds web writes.
- [ ] Browser never calls the qarib-api runtime directly.
- [ ] All user-facing strings live in `messages/id.json`.
- [ ] Vitest unit covers the store and any pure logic.
- [ ] If the route is critical (map, list, detail, search), there is a
  `*.e2e.ts` spec.
- [ ] Doc updated — if a new convention emerged, file a concept page in the
  Obsidian wiki and reference it from the relevant rule.
