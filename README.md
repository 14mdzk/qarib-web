# Qarib Web v2 — landing only

Rebuilt from scratch (Astro + Svelte + Tailwind v4). v1 (SvelteKit app with
discovery, detail pages, BFF) was force-deleted; mobile owns discovery now.

## Commands (Bun)

```sh
bun install
bun run dev      # http://localhost:4321
bun run build    # static output in dist/
bun run preview  # serve the build
```

## Where things live

- `src/pages/index.astro` — the one page, six sections in order.
- `src/components/*` — Nav, Hero, Problem, Features, FinalCta, Footer.
  `MobileMenu.svelte` is the only interactive island (`client:load`).
- `src/messages/id.json` — UI strings, i18n-ready (`src/lib/i18n.ts`).
- `src/content/features/*.md` — feature cards (content collections).
- `src/styles/tokens.css` — brand tokens (orange/ink/paper, Jakarta Sans +
  Fraunces + Naskh, class dark mode).
- `public/tile.png` — brand tile (copied from mobile assets, do not redraw).

Copy deck (locked): hero `dekat, mendekatkan.`, ilmu lede, proximity-leads /
closeness-closes pillars, `teman, bukan penceramah` tone. Final strings
adapted from the t3 salvage draft; deviations are recorded on the r3 ticket.
