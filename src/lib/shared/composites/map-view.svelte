<script lang="ts">
	/**
	 * MapView — Leaflet client-only island.
	 *
	 * Server renders a sized placeholder div. The map initialises entirely in
	 * `onMount` so Leaflet (which calls `window`/`document`) never runs during
	 * SSR. Leaflet's CSS is also imported dynamically in `onMount`.
	 *
	 * Props:
	 *   - `center`        — [lat, lng] initial map centre.
	 *   - `zoom`          — initial zoom level (default 13).
	 *   - `pins`          — array of pins; each has id, lat, lng, and a tier
	 *                       ('now' | 'soon' | 'today') used to colour the marker.
	 *   - `userLocation`  — [lat, lng] of the device; renders a distinct dot.
	 *   - `onpinclick`    — callback fired with the pin id when a pin is clicked.
	 *
	 * Tile layer: `/api/tiles/{z}/{x}/{y}{r}.png` (BFF proxy; ADR 0013).
	 * Attribution control is rendered (required by Stadia free tier).
	 * Respects `prefers-reduced-motion` (disables zoom/pan animation).
	 *
	 * Conformance:
	 *   - .claude/rules/styling.md  (client-only island; token colours; no fetch)
	 *   - .claude/rules/security.md (STADIA_API_KEY stays server-side — never here)
	 *   - ADR 0013 (tile proxy)
	 */
	import { onMount, onDestroy } from 'svelte';
	import { m } from '$core/i18n';
	import { tierToTokenColor } from '$domains/events/pin-tier.js';
	import type { PinTier } from '$domains/events/pin-tier.js';

	interface Pin {
		id: string | number;
		lat: number;
		lng: number;
		tier: PinTier;
	}

	interface Props {
		center: [number, number];
		zoom?: number;
		pins?: Pin[];
		userLocation?: [number, number];
		onpinclick?: (id: string | number) => void;
	}

	let { center, zoom = 13, pins = [], userLocation, onpinclick }: Props = $props();

	let mapContainer: HTMLDivElement | undefined = $state();

	// Internal Leaflet map instance — module-level via closure, not $state,
	// because Leaflet objects are not plain-serialisable values.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Leaflet runtime types are loose; re-typing its internals isn't worth it
	let L: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Leaflet Map; typed via `L` above, not a separate import
	let map: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Leaflet LayerGroup; typed via `L` above
	let pinLayerGroup: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Leaflet Marker; nullable, typed via `L` above
	let userMarker: any;

	// Check prefers-reduced-motion once at mount; memoised in a boolean.
	let reducedMotion = false;

	function buildPinIcon(tier: PinTier): unknown {
		const color = tierToTokenColor(tier);
		return L.divIcon({
			className: '',
			html: `<div style="
				width: 14px;
				height: 14px;
				border-radius: 50%;
				background: ${color};
				border: 2px solid white;
				box-shadow: 0 1px 4px rgba(0,0,0,0.35);
			"></div>`,
			iconSize: [14, 14],
			iconAnchor: [7, 7],
			popupAnchor: [0, -10]
		});
	}

	function buildUserLocationIcon(): unknown {
		return L.divIcon({
			className: '',
			html: `<div style="
				width: 16px;
				height: 16px;
				border-radius: 50%;
				background: var(--color-info, #3b82f6);
				border: 3px solid white;
				box-shadow: 0 1px 6px rgba(59,130,246,0.55);
			"></div>`,
			iconSize: [16, 16],
			iconAnchor: [8, 8]
		});
	}

	function renderPins(currentPins: Pin[]): void {
		if (!pinLayerGroup) return;
		pinLayerGroup.clearLayers();
		for (const pin of currentPins) {
			const marker = L.marker([pin.lat, pin.lng], { icon: buildPinIcon(pin.tier) });
			marker.on('click', () => {
				onpinclick?.(pin.id);
			});
			pinLayerGroup.addLayer(marker);
		}
	}

	function renderUserLocation(loc: [number, number] | undefined): void {
		if (!map) return;
		if (userMarker) {
			userMarker.remove();
			userMarker = null;
		}
		if (loc) {
			userMarker = L.marker(loc, { icon: buildUserLocationIcon(), zIndexOffset: 1000 }).addTo(map);
		}
	}

	onMount(async () => {
		// Dynamic import so Leaflet + CSS never run during SSR.
		const leafletModule = await import('leaflet');
		L = leafletModule.default;

		// Leaflet CSS — also deferred to avoid SSR issues.
		await import('leaflet/dist/leaflet.css');

		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		if (!mapContainer) return;

		map = L.map(mapContainer, {
			center,
			zoom,
			zoomAnimation: !reducedMotion,
			markerZoomAnimation: !reducedMotion,
			fadeAnimation: !reducedMotion
		});

		L.tileLayer('/api/tiles/{z}/{x}/{y}{r}.png', {
			detectRetina: true,
			attribution:
				'&copy; <a href="https://stadiamaps.com/" target="_blank" rel="noopener">Stadia Maps</a> ' +
				'&copy; <a href="https://openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> ' +
				'&copy; <a href="https://www.openstreetmap.org/about" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
			maxZoom: 20
		}).addTo(map);

		pinLayerGroup = L.layerGroup().addTo(map);

		renderPins(pins);
		renderUserLocation(userLocation);
	});

	// Reactively re-render pins when the prop changes.
	$effect(() => {
		if (map && pinLayerGroup) {
			renderPins(pins);
		}
	});

	// Reactively update the user-location marker.
	$effect(() => {
		if (map) {
			renderUserLocation(userLocation);
		}
	});

	// Reactively fly to the new center when the prop changes (post-mount only).
	$effect(() => {
		if (map) {
			if (reducedMotion) {
				map.setView(center, zoom);
			} else {
				map.setView(center, zoom, { animate: true });
			}
		}
	});

	onDestroy(() => {
		if (map) {
			map.remove();
			map = undefined;
		}
	});
</script>

<!--
  Server renders a same-sized placeholder div.
  The map element is a fixed-height block; callers set height via a class or
  style on the parent.  The div itself carries `role="application"` so screen
  readers know it is interactive.
-->
<div
	bind:this={mapContainer}
	role="application"
	aria-label={m.map_view_aria_label()}
	class="h-full w-full"
></div>
